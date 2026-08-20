alter table public.practice_test_blueprints
  drop constraint practice_test_blueprints_selection_strategy_check;

alter table public.practice_test_blueprints
  add constraint practice_test_blueprints_selection_strategy_check
  check (selection_strategy in (
    'fixed_blueprint', 'mitchell_full_exam', 'aerospace_full_exam'
  ));

create or replace function private.set_practice_review_tracking_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.mode = 'practice_test'
    and new.blueprint_id is not null
    and exists (
      select 1
      from public.practice_test_blueprints b
      where b.id = new.blueprint_id
        and b.selection_strategy in ('mitchell_full_exam', 'aerospace_full_exam')
    ) then
    new.review_tracking_version := 1;
  end if;
  return new;
end;
$$;

create or replace function public.get_practice_test_options()
returns table (
  blueprint_id uuid,
  blueprint_code text,
  selection_strategy text,
  exam_id uuid,
  exam_title text,
  blueprint_name text,
  description text,
  question_count integer,
  time_limit_seconds integer,
  allow_untimed boolean,
  allow_pause boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not private.has_role('student') then
    raise exception 'Student role required' using errcode = '42501';
  end if;

  return query
  select b.id, b.code, b.selection_strategy, b.exam_id, e.title, b.name, b.description,
    b.question_count, b.time_limit_seconds, b.allow_untimed, b.allow_pause
  from public.practice_test_blueprints b
  join public.exams e on e.id = b.exam_id
  where b.status = 'active'
    and e.status = 'active'
    and (
      b.selection_strategy <> 'aerospace_full_exam'
      or not exists (
        select 1
        from generate_series(1, 7) as required_module(module_number)
        where (
          select count(distinct q.question_family_id)
          from public.questions q
          where q.exam_id = b.exam_id
            and q.module_number = required_module.module_number
            and q.eligible_for_final_exam
            and q.exam_likeness = 'high'
            and q.final_exam_weight > 0
            and q.question_family_id is not null
            and (
              (q.review_status = 'approved' and q.status = 'active')
              or (
                q.review_status = 'draft' and q.status = 'draft'
                and q.import_package is not null
                and private.has_pilot_package_access(q.import_package)
              )
            )
        ) < 8
      )
    )
  order by e.sort_order, b.name;
end;
$$;

create function public.create_aerospace_full_practice_exam(
  p_blueprint_id uuid,
  p_timed boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  student_id uuid := (select auth.uid());
  blueprint public.practice_test_blueprints%rowtype;
  session_id uuid := gen_random_uuid();
  selected_count integer;
  extra_module integer;
begin
  if student_id is null or not private.has_role('student') then
    raise exception 'Student role required' using errcode = '42501';
  end if;

  select b.* into blueprint
  from public.practice_test_blueprints b
  join public.exams e on e.id = b.exam_id and e.status = 'active'
  where b.id = p_blueprint_id
    and b.status = 'active'
    and b.selection_strategy = 'aerospace_full_exam';

  if not found then
    raise exception 'Active Aerospace full-exam blueprint not found' using errcode = 'P0002';
  end if;
  if blueprint.question_count <> 50 then
    raise exception 'Aerospace full-exam blueprint must contain 50 questions'
      using errcode = '22023';
  end if;
  if p_timed is null then
    raise exception 'Timed selection is required' using errcode = '22023';
  end if;
  if not p_timed and not blueprint.allow_untimed then
    raise exception 'This practice test must be timed' using errcode = '22023';
  end if;

  -- Seven questions come from every module. One deterministic, session-specific
  -- module contributes an eighth question so the complete form totals fifty.
  select candidate_module.module_number into extra_module
  from generate_series(1, 7) as candidate_module(module_number)
  order by md5(session_id::text || ':extra-module:' || candidate_module.module_number::text)
  limit 1;

  if exists (
    with targets(module_number, target_count) as (
      select candidate_module.module_number,
        7 + (candidate_module.module_number = extra_module)::integer
      from generate_series(1, 7) as candidate_module(module_number)
    )
    select 1
    from targets t
    where (
      select count(distinct q.question_family_id)
      from public.questions q
      where q.exam_id = blueprint.exam_id
        and q.module_number = t.module_number
        and q.eligible_for_final_exam
        and q.exam_likeness = 'high'
        and q.final_exam_weight > 0
        and q.question_family_id is not null
        and (
          (q.review_status = 'approved' and q.status = 'active')
          or (
            q.review_status = 'draft' and q.status = 'draft'
            and q.import_package is not null
            and private.has_pilot_package_access(q.import_package)
          )
        )
    ) < t.target_count
  ) then
    raise exception 'Not enough eligible questions for the Aerospace full practice exam'
      using errcode = '22023';
  end if;

  insert into public.study_sessions (
    id, student_id, exam_id, mode, requested_count, question_count,
    blueprint_id, timed, time_limit_seconds, allow_pause_snapshot
  ) values (
    session_id, student_id, blueprint.exam_id, 'practice_test',
    50, 50, blueprint.id, p_timed,
    case when p_timed then blueprint.time_limit_seconds else null end,
    blueprint.allow_pause
  );

  with targets(module_number, target_count) as (
    select candidate_module.module_number,
      7 + (candidate_module.module_number = extra_module)::integer
    from generate_series(1, 7) as candidate_module(module_number)
  ), candidates as (
    select
      q.id as question_id,
      q.version,
      q.module_number,
      q.learning_objective_id,
      q.question_family_id,
      row_number() over (
        partition by q.question_family_id
        order by
          -ln(greatest(
            0.000000001::numeric,
            ((('x' || substr(md5(session_id::text || ':family:' || q.id::text), 1, 7))::bit(28)::bigint + 1)::numeric
              / 268435457::numeric)
          )) / greatest(q.final_exam_weight, 0.01),
          q.id
      ) as family_rank,
      -ln(greatest(
        0.000000001::numeric,
        ((('x' || substr(md5(session_id::text || ':rank:' || q.id::text), 1, 7))::bit(28)::bigint + 1)::numeric
          / 268435457::numeric)
      )) / greatest(q.final_exam_weight, 0.01) as weighted_rank
    from public.questions q
    where q.exam_id = blueprint.exam_id
      and q.module_number between 1 and 7
      and q.eligible_for_final_exam
      and q.exam_likeness = 'high'
      and q.final_exam_weight > 0
      and q.question_family_id is not null
      and (
        (q.review_status = 'approved' and q.status = 'active')
        or (
          q.review_status = 'draft' and q.status = 'draft'
          and q.import_package is not null
          and private.has_pilot_package_access(q.import_package)
        )
      )
  ), ranked as (
    select c.*,
      row_number() over (
        partition by c.module_number
        order by c.weighted_rank, c.question_id
      ) as module_rank
    from candidates c
    where c.family_rank = 1
  ), selected as (
    select r.*
    from ranked r
    join targets t on t.module_number = r.module_number
    where r.module_rank <= t.target_count
  ), positioned as (
    select s.*,
      row_number() over (
        order by s.module_rank,
          md5(session_id::text || ':module-order:' || s.module_number::text)
      )::integer as position
    from selected s
  )
  insert into public.study_session_questions (
    session_id, question_id, position, selection_reason, question_version
  )
  select session_id, p.question_id, p.position, 'practice_test_blueprint', p.version
  from positioned p;

  select count(*)::integer into selected_count
  from public.study_session_questions sq where sq.session_id = session_id;

  if selected_count <> 50 then
    raise exception 'Aerospace full practice exam selection was incomplete'
      using errcode = '22023';
  end if;

  return session_id;
end;
$$;

create or replace function public.get_latest_practice_test_topic_results(
  p_student_id uuid,
  p_exam_id uuid
)
returns table (
  session_id uuid,
  completed_at timestamptz,
  topic_id uuid,
  topic_title text,
  question_count integer,
  answered_count integer,
  correct_count integer,
  score_percent numeric,
  performance_label text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
    or not private.can_view_student_progress(p_student_id) then
    raise exception 'Progress access denied' using errcode = '42501';
  end if;

  return query
  with latest_session as (
    select s.id, s.completed_at
    from public.study_sessions s
    join public.practice_test_blueprints b on b.id = s.blueprint_id
    where s.student_id = p_student_id
      and s.exam_id = p_exam_id
      and s.mode = 'practice_test'
      and s.status = 'completed'
      and b.selection_strategy in ('mitchell_full_exam', 'aerospace_full_exam')
    order by s.completed_at desc nulls last, s.created_at desc, s.id
    limit 1
  )
  select
    latest.id,
    latest.completed_at,
    t.id,
    t.title,
    count(*)::integer,
    count(a.id)::integer,
    count(a.id) filter (where a.is_correct)::integer,
    round(count(a.id) filter (where a.is_correct)::numeric / count(*) * 100, 2),
    case
      when count(a.id) = 0 then 'Not attempted'
      when count(a.id) filter (where a.is_correct)::numeric / count(*) >= 0.80 then 'Strength'
      when count(a.id) filter (where a.is_correct)::numeric / count(*) >= 0.60 then 'Developing'
      else 'Review next'
    end
  from latest_session latest
  join public.study_session_questions sq on sq.session_id = latest.id
  join public.questions q on q.id = sq.question_id
  join public.topics t on t.id = q.topic_id
  left join public.question_attempts a on a.session_question_id = sq.id
  group by latest.id, latest.completed_at, t.id, t.title
  order by 8, t.title;
end;
$$;

create or replace function public.get_practice_test_review_progress(p_session_id uuid)
returns table (
  session_id uuid,
  tracking_available boolean,
  missed_count integer,
  reviewed_count integer,
  review_percent integer,
  review_complete boolean,
  reviewed_session_question_ids uuid[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_student_id uuid;
  v_tracking_version smallint;
begin
  select s.student_id, s.review_tracking_version
  into v_student_id, v_tracking_version
  from public.study_sessions s
  join public.practice_test_blueprints b on b.id = s.blueprint_id
  where s.id = p_session_id
    and s.mode = 'practice_test'
    and s.status = 'completed'
    and b.selection_strategy in ('mitchell_full_exam', 'aerospace_full_exam');

  if not found then
    raise exception 'Completed full practice test not found' using errcode = 'P0002';
  end if;
  if (select auth.uid()) is null
    or not private.can_view_student_progress(v_student_id) then
    raise exception 'Progress access denied' using errcode = '42501';
  end if;

  return query
  with missed as (
    select sq.id, sq.reviewed_at
    from public.study_session_questions sq
    join public.question_attempts a on a.session_question_id = sq.id
    where sq.session_id = p_session_id
      and not a.is_correct
  ), totals as (
    select
      count(*)::integer as missed_count,
      count(*) filter (where reviewed_at is not null)::integer as reviewed_count,
      coalesce(
        array_agg(id order by id) filter (where reviewed_at is not null),
        '{}'::uuid[]
      ) as reviewed_ids
    from missed
  )
  select
    p_session_id,
    coalesce(v_tracking_version = 1, false),
    totals.missed_count,
    case when v_tracking_version = 1 then totals.reviewed_count else 0 end,
    case
      when v_tracking_version is distinct from 1 then null
      when totals.missed_count = 0 then 100
      else round(totals.reviewed_count::numeric / totals.missed_count * 100)::integer
    end,
    case
      when v_tracking_version is distinct from 1 then false
      else totals.reviewed_count = totals.missed_count
    end,
    case
      when v_tracking_version = 1 and (select auth.uid()) = v_student_id
        then totals.reviewed_ids
      else '{}'::uuid[]
    end
  from totals;
end;
$$;

create or replace function public.mark_practice_answer_reviewed(p_session_question_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1
    from public.study_session_questions sq
    join public.study_sessions s on s.id = sq.session_id
    join public.practice_test_blueprints b on b.id = s.blueprint_id
    join public.question_attempts a on a.session_question_id = sq.id
    where sq.id = p_session_question_id
      and s.student_id = (select auth.uid())
      and s.mode = 'practice_test'
      and s.status = 'completed'
      and s.review_tracking_version = 1
      and b.selection_strategy in ('mitchell_full_exam', 'aerospace_full_exam')
      and not a.is_correct
  ) then
    raise exception 'Reviewable missed answer not found' using errcode = 'P0002';
  end if;

  update public.study_session_questions
  set reviewed_at = coalesce(reviewed_at, now())
  where id = p_session_question_id;
end;
$$;

insert into public.practice_test_blueprints (
  id, exam_id, code, name, description, question_count,
  time_limit_seconds, allow_untimed, allow_pause, status, selection_strategy
) values (
  '70000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000002',
  'MITCHELL_AEROSPACE_FULL_50',
  'Full Mitchell Aerospace Practice Exam',
  'Unofficial 50-question practice exam covering Aerospace Dimensions Modules 1 through 7.',
  50, 3600, true, true, 'active', 'aerospace_full_exam'
) on conflict (exam_id, code) do update set
  name = excluded.name,
  description = excluded.description,
  question_count = excluded.question_count,
  time_limit_seconds = excluded.time_limit_seconds,
  allow_untimed = excluded.allow_untimed,
  allow_pause = excluded.allow_pause,
  status = excluded.status,
  selection_strategy = excluded.selection_strategy;

revoke all on function public.create_aerospace_full_practice_exam(uuid, boolean) from public;
revoke all on function public.get_practice_test_options() from public;
revoke all on function public.get_latest_practice_test_topic_results(uuid, uuid) from public;
revoke all on function public.get_practice_test_review_progress(uuid) from public;
revoke all on function public.mark_practice_answer_reviewed(uuid) from public;

grant execute on function public.create_aerospace_full_practice_exam(uuid, boolean) to authenticated;
grant execute on function public.get_practice_test_options() to authenticated;
grant execute on function public.get_latest_practice_test_topic_results(uuid, uuid) to authenticated;
grant execute on function public.get_practice_test_review_progress(uuid) to authenticated;
grant execute on function public.mark_practice_answer_reviewed(uuid) to authenticated;

comment on function public.create_aerospace_full_practice_exam is
  'Creates a frozen, owner-only 50-question Modules 1-7 Aerospace practice exam from eligible accessible questions without exposing answer keys.';
comment on function public.get_latest_practice_test_topic_results is
  'Returns topic analysis from the latest completed Leadership or Aerospace full practice exam for an authorized student or linked guardian.';
comment on function public.get_practice_test_review_progress is
  'Returns missed-answer review completion for a completed Leadership or Aerospace full practice test to its student or an authorized linked guardian.';
comment on function public.mark_practice_answer_reviewed is
  'Idempotently records deliberate review of one incorrect answer after a tracked Leadership or Aerospace full practice test is completed.';

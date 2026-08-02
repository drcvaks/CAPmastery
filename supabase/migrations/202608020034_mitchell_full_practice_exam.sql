alter table public.questions
  add column chapter_number integer,
  add column exam_likeness text,
  add column distractor_difficulty text,
  add column eligible_for_final_exam boolean not null default false,
  add column final_exam_weight numeric not null default 0,
  add column content_origin text,
  add column style_reference text,
  add constraint questions_chapter_number_check check (
    chapter_number is null or chapter_number between 1 and 99
  ),
  add constraint questions_exam_likeness_check check (
    exam_likeness is null or exam_likeness in ('high', 'medium', 'low')
  ),
  add constraint questions_distractor_difficulty_check check (
    distractor_difficulty is null or distractor_difficulty in ('basic', 'moderate', 'close')
  ),
  add constraint questions_final_exam_weight_check check (final_exam_weight >= 0),
  add constraint questions_content_origin_check check (
    content_origin is null or content_origin in (
      'existing_original_bank', 'original_textbook_grounded'
    )
  ),
  add constraint questions_style_reference_check check (
    style_reference is null or style_reference in (
      'pre_sample_bank_review', 'Mitchell_sample_style_analysis'
    )
  );

create index questions_final_exam_pool_idx
  on public.questions (exam_id, chapter_number, exam_likeness, final_exam_weight desc)
  where eligible_for_final_exam;

alter table public.practice_test_blueprints
  add column selection_strategy text not null default 'fixed_blueprint'
    check (selection_strategy in ('fixed_blueprint', 'mitchell_full_exam'));

drop index public.practice_test_blueprints_one_active_exam_idx;

alter table public.study_session_questions
  add column flagged_at timestamptz;

drop function public.get_practice_test_options();
create function public.get_practice_test_options()
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
  where b.status = 'active' and e.status = 'active'
  order by e.sort_order, b.name;
end;
$$;

create function public.create_mitchell_full_practice_exam(
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
  extra_4 integer;
  extra_5 integer;
  extra_6 integer;
  extra_7 integer;
  extra_8 integer;
begin
  if student_id is null or not private.has_role('student') then
    raise exception 'Student role required' using errcode = '42501';
  end if;
  select b.* into blueprint
  from public.practice_test_blueprints b
  join public.exams e on e.id = b.exam_id and e.status = 'active'
  where b.id = p_blueprint_id
    and b.status = 'active'
    and b.selection_strategy = 'mitchell_full_exam';
  if not found then
    raise exception 'Active Mitchell full-exam blueprint not found' using errcode = 'P0002';
  end if;
  if blueprint.question_count <> 50 then
    raise exception 'Mitchell full-exam blueprint must contain 50 questions'
      using errcode = '22023';
  end if;
  if p_timed is null then
    raise exception 'Timed selection is required' using errcode = '22023';
  end if;
  if not p_timed and not blueprint.allow_untimed then
    raise exception 'This practice test must be timed' using errcode = '22023';
  end if;

  -- Choose a deterministic, session-specific distribution totaling 50. Each
  -- chapter receives 9-11 questions, comfortably inside the 7-13 safeguard,
  -- and the all-ten distribution is excluded so generated forms vary.
  select a, b, c, d, e into extra_4, extra_5, extra_6, extra_7, extra_8
  from generate_series(2, 4) a
  cross join generate_series(2, 4) b
  cross join generate_series(2, 4) c
  cross join generate_series(2, 4) d
  cross join generate_series(2, 4) e
  where a + b + c + d + e = 15
    and not (a = 3 and b = 3 and c = 3 and d = 3 and e = 3)
    and ((a = 4)::integer + (b = 4)::integer + (c = 4)::integer
      + (d = 4)::integer + (e = 4)::integer) <> 1
  order by md5(session_id::text || ':distribution:' || a || b || c || d || e)
  limit 1;

  if exists (
    with targets(chapter_number, target_count) as (
      values (4, 7 + extra_4), (5, 7 + extra_5), (6, 7 + extra_6),
        (7, 7 + extra_7), (8, 7 + extra_8)
    )
    select 1
    from targets t
    where (
      select count(distinct q.question_family_id)
      from public.questions q
      where q.exam_id = blueprint.exam_id
        and q.chapter_number = t.chapter_number
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
    raise exception 'Not enough eligible questions for the Mitchell full practice exam'
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

  with targets(chapter_number, target_count) as (
    values (4, 7 + extra_4), (5, 7 + extra_5), (6, 7 + extra_6),
      (7, 7 + extra_7), (8, 7 + extra_8)
  ), candidates as (
    select
      q.id as question_id,
      q.version,
      q.chapter_number,
      q.learning_objective_id,
      q.question_family_id,
      row_number() over (
        partition by q.question_family_id
        order by
          case q.exam_likeness when 'high' then 0 when 'medium' then 1 else 2 end,
          -ln(greatest(
            0.000000001::numeric,
            ((('x' || substr(md5(session_id::text || ':weight:' || q.id::text), 1, 7))::bit(28)::bigint + 1)::numeric
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
      and q.chapter_number between 4 and 8
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
        partition by c.chapter_number
        order by c.weighted_rank, c.question_id
      ) as chapter_rank
    from candidates c
    where c.family_rank = 1
  ), selected as (
    select r.*
    from ranked r
    join targets t on t.chapter_number = r.chapter_number
    where r.chapter_rank <= t.target_count
  ), positioned as (
    select s.*,
      row_number() over (
        order by s.chapter_rank,
          md5(session_id::text || ':chapter-order:' || s.chapter_number::text)
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
    raise exception 'Mitchell full practice exam selection was incomplete'
      using errcode = '22023';
  end if;
  return session_id;
end;
$$;

create function public.set_practice_test_question_flag(
  p_session_question_id uuid,
  p_flagged boolean
)
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
    where sq.id = p_session_question_id
      and s.student_id = (select auth.uid())
      and s.mode = 'practice_test'
  ) then
    raise exception 'Practice-test question not found' using errcode = 'P0002';
  end if;
  update public.study_session_questions
  set flagged_at = case when p_flagged then now() else null end
  where id = p_session_question_id;
end;
$$;

create function public.get_practice_test_question_flags(p_session_id uuid)
returns table (session_question_id uuid)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.study_sessions s
    where s.id = p_session_id
      and s.student_id = (select auth.uid())
      and s.mode = 'practice_test'
  ) then
    raise exception 'Practice test not found' using errcode = 'P0002';
  end if;
  return query
  select sq.id
  from public.study_session_questions sq
  where sq.session_id = p_session_id and sq.flagged_at is not null
  order by sq.position;
end;
$$;

create function public.get_practice_test_weak_areas(p_session_id uuid)
returns table (
  chapter_number integer,
  chapter_title text,
  objective_id uuid,
  objective_code text,
  objective_title text,
  concept_titles text[],
  question_count integer,
  answered_count integer,
  correct_count integer,
  score_percent numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.study_sessions s
    where s.id = p_session_id
      and s.student_id = (select auth.uid())
      and s.mode = 'practice_test'
      and s.status = 'completed'
  ) then
    raise exception 'Completed practice test not found' using errcode = 'P0002';
  end if;
  return query
  select
    q.chapter_number,
    t.title,
    o.id,
    o.code,
    o.title,
    coalesce(array_agg(distinct c.title) filter (where c.id is not null), '{}'::text[]),
    count(*)::integer,
    count(a.id)::integer,
    count(a.id) filter (where a.is_correct)::integer,
    round(count(a.id) filter (where a.is_correct)::numeric / count(*) * 100, 2)
  from public.study_session_questions sq
  join public.questions q on q.id = sq.question_id
  join public.topics t on t.id = q.topic_id
  join public.learning_objectives o on o.id = q.learning_objective_id
  left join public.question_attempts a on a.session_question_id = sq.id
  left join public.question_concepts qc on qc.question_id = q.id and qc.is_primary
  left join public.concepts c on c.id = qc.concept_id
  where sq.session_id = p_session_id
  group by q.chapter_number, t.title, o.id, o.code, o.title
  order by score_percent, q.chapter_number, o.code;
end;
$$;

create function public.reviewer_save_question_with_classification(
  p_question_id uuid,
  p_payload jsonb,
  p_change_reason text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_version integer;
  v_chapter integer;
  v_weight numeric;
begin
  if v_actor is null or not private.can_review_content() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  v_chapter := nullif(p_payload->>'chapter_number', '')::integer;
  v_weight := coalesce(nullif(p_payload->>'final_exam_weight', '')::numeric, 0);
  if v_chapter is not null and v_chapter not between 1 and 99 then
    raise exception 'Chapter number must be between 1 and 99' using errcode = '22023';
  end if;
  if coalesce(p_payload->>'exam_likeness', '') not in ('', 'high', 'medium', 'low')
    or coalesce(p_payload->>'distractor_difficulty', '') not in ('', 'basic', 'moderate', 'close')
    or coalesce(p_payload->>'content_origin', '') not in (
      '', 'existing_original_bank', 'original_textbook_grounded'
    )
    or coalesce(p_payload->>'style_reference', '') not in (
      '', 'pre_sample_bank_review', 'Mitchell_sample_style_analysis'
    )
    or v_weight < 0 then
    raise exception 'Final-exam classification is invalid' using errcode = '22023';
  end if;

  v_version := public.reviewer_save_question(p_question_id, p_payload, p_change_reason);
  update public.questions set
    chapter_number = v_chapter,
    exam_likeness = nullif(p_payload->>'exam_likeness', ''),
    distractor_difficulty = nullif(p_payload->>'distractor_difficulty', ''),
    eligible_for_final_exam = coalesce((p_payload->>'eligible_for_final_exam')::boolean, false),
    final_exam_weight = v_weight,
    content_origin = nullif(p_payload->>'content_origin', ''),
    style_reference = nullif(p_payload->>'style_reference', '')
  where id = p_question_id;

  insert into public.audit_log (
    actor_id, action, entity_type, entity_id, after_summary
  ) values (
    v_actor, 'question.final_exam_classification_edited', 'question', p_question_id,
    jsonb_build_object(
      'chapter_number', v_chapter,
      'exam_likeness', nullif(p_payload->>'exam_likeness', ''),
      'eligible_for_final_exam', coalesce((p_payload->>'eligible_for_final_exam')::boolean, false),
      'final_exam_weight', v_weight
    )
  );
  return v_version;
end;
$$;

insert into public.practice_test_blueprints (
  id, exam_id, code, name, description, question_count,
  time_limit_seconds, allow_untimed, allow_pause, status, selection_strategy
) values (
  '70000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000001',
  'MITCHELL_LEADERSHIP_FULL_50',
  'Full Mitchell Leadership Practice Exam',
  'Unofficial 50-question practice exam covering Learn to Lead Volume 2, Chapters 4 through 8.',
  50, 3000, true, false, 'active', 'mitchell_full_exam'
) on conflict (exam_id, code) do update set
  name = excluded.name,
  description = excluded.description,
  question_count = excluded.question_count,
  time_limit_seconds = excluded.time_limit_seconds,
  allow_untimed = excluded.allow_untimed,
  allow_pause = excluded.allow_pause,
  status = excluded.status,
  selection_strategy = excluded.selection_strategy;

revoke all on function public.get_practice_test_options() from public;
revoke all on function public.create_mitchell_full_practice_exam(uuid, boolean) from public;
revoke all on function public.set_practice_test_question_flag(uuid, boolean) from public;
revoke all on function public.get_practice_test_question_flags(uuid) from public;
revoke all on function public.get_practice_test_weak_areas(uuid) from public;
revoke all on function public.reviewer_save_question_with_classification(uuid, jsonb, text) from public;

grant execute on function public.get_practice_test_options() to authenticated;
grant execute on function public.create_mitchell_full_practice_exam(uuid, boolean) to authenticated;
grant execute on function public.set_practice_test_question_flag(uuid, boolean) to authenticated;
grant execute on function public.get_practice_test_question_flags(uuid) to authenticated;
grant execute on function public.get_practice_test_weak_areas(uuid) to authenticated;
grant execute on function public.reviewer_save_question_with_classification(uuid, jsonb, text) to authenticated;

comment on column public.questions.eligible_for_final_exam is
  'Reviewer-editable eligibility for full or chapter practice exams; study mode may still use ineligible questions.';
comment on column public.questions.final_exam_weight is
  'Relative selection weight for eligible practice-exam questions, not a guaranteed inclusion rule.';
comment on function public.create_mitchell_full_practice_exam is
  'Creates a frozen, owner-only 50-question Chapters 4-8 exam from eligible accessible questions without exposing answer keys.';
comment on function public.set_practice_test_question_flag is
  'Persists an owned practice-test review flag without revealing correctness.';

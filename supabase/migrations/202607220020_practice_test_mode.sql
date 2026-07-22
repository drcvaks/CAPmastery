create table public.practice_test_blueprints (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9_]{3,80}$'),
  name text not null check (char_length(trim(name)) between 3 and 120),
  description text not null check (char_length(trim(description)) between 10 and 500),
  question_count integer not null check (question_count between 1 and 50),
  time_limit_seconds integer not null check (time_limit_seconds between 60 and 14400),
  allow_untimed boolean not null default true,
  allow_pause boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'active', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_id, code)
);

create unique index practice_test_blueprints_one_active_exam_idx
  on public.practice_test_blueprints (exam_id) where status = 'active';

create table public.practice_test_blueprint_rules (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references public.practice_test_blueprints (id) on delete cascade,
  difficulty public.question_difficulty not null,
  cognitive_level public.cognitive_level not null,
  target_count integer not null check (target_count between 1 and 50),
  created_at timestamptz not null default now(),
  unique (blueprint_id, difficulty, cognitive_level)
);

create index practice_test_blueprint_rules_blueprint_idx
  on public.practice_test_blueprint_rules (blueprint_id);

create trigger practice_test_blueprints_set_updated_at
before update on public.practice_test_blueprints
for each row execute function private.set_updated_at();

alter table public.practice_test_blueprints enable row level security;
alter table public.practice_test_blueprint_rules enable row level security;

create policy practice_test_blueprints_select_active
on public.practice_test_blueprints for select to authenticated
using (status = 'active');

create policy practice_test_blueprint_rules_select_active
on public.practice_test_blueprint_rules for select to authenticated
using (exists (
  select 1 from public.practice_test_blueprints b
  where b.id = blueprint_id and b.status = 'active'
));

revoke all on table public.practice_test_blueprints from anon, authenticated;
revoke all on table public.practice_test_blueprint_rules from anon, authenticated;
grant select on table public.practice_test_blueprints to authenticated;
grant select on table public.practice_test_blueprint_rules to authenticated;

alter table public.study_sessions
  add column blueprint_id uuid references public.practice_test_blueprints (id) on delete restrict,
  add column timed boolean not null default false,
  add column time_limit_seconds integer check (
    time_limit_seconds is null or time_limit_seconds between 60 and 14400
  ),
  add column allow_pause_snapshot boolean not null default false,
  add column paused_at timestamptz,
  add column total_paused_seconds integer not null default 0 check (total_paused_seconds >= 0);

do $$
declare
  constraint_name text;
begin
  select c.conname into constraint_name
  from pg_catalog.pg_constraint c
  where c.conrelid = 'public.study_sessions'::regclass
    and c.contype = 'c'
    and pg_catalog.pg_get_constraintdef(c.oid) like '%completed_at%answered_count%question_count%'
  limit 1;
  if constraint_name is null then
    raise exception 'Existing study session completion constraint was not found';
  end if;
  execute format('alter table public.study_sessions drop constraint %I', constraint_name);
end;
$$;

alter table public.study_sessions
  add constraint study_sessions_completion_check check (
    (
      status = 'completed'
      and completed_at is not null
      and (mode = 'practice_test' or answered_count = question_count)
    )
    or (status <> 'completed' and completed_at is null)
  ),
  add constraint study_sessions_practice_configuration_check check (
    (
      mode = 'study'
      and blueprint_id is null
      and not timed
      and time_limit_seconds is null
      and not allow_pause_snapshot
      and paused_at is null
      and total_paused_seconds = 0
    )
    or (
      mode = 'practice_test'
      and blueprint_id is not null
      and ((timed and time_limit_seconds is not null) or (not timed and time_limit_seconds is null))
    )
  );

alter table public.study_session_questions
  drop constraint study_session_questions_selection_reason_check;
alter table public.study_session_questions
  add constraint study_session_questions_selection_reason_check check (
    selection_reason in (
      'basic_ordered', 'private_pilot', 'weak_topic', 'recently_missed',
      'developing_topic', 'retention_check', 'new_or_harder',
      'same_session_remediation', 'practice_test_blueprint'
    )
  );

create function private.practice_remaining_seconds(
  p_started_at timestamptz,
  p_time_limit_seconds integer,
  p_total_paused_seconds integer,
  p_paused_at timestamptz,
  p_now timestamptz
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select greatest(
    0,
    floor(
      p_time_limit_seconds
      - extract(epoch from (p_now - p_started_at))
      + p_total_paused_seconds
      + case when p_paused_at is null then 0 else extract(epoch from (p_now - p_paused_at)) end
    
    )::integer
  );
$$;

create function public.get_practice_test_options()
returns table (
  blueprint_id uuid,
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
  select b.id, b.exam_id, e.title, b.name, b.description, b.question_count,
    b.time_limit_seconds, b.allow_untimed, b.allow_pause
  from public.practice_test_blueprints b
  join public.exams e on e.id = b.exam_id
  where b.status = 'active' and e.status = 'active'
  order by e.sort_order, b.name;
end;
$$;

create function public.create_practice_test(
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
  rule_total integer;
begin
  if student_id is null or not private.has_role('student') then
    raise exception 'Student role required' using errcode = '42501';
  end if;
  select b.* into blueprint
  from public.practice_test_blueprints b
  join public.exams e on e.id = b.exam_id and e.status = 'active'
  where b.id = p_blueprint_id and b.status = 'active';
  if not found then
    raise exception 'Active practice-test blueprint not found' using errcode = 'P0002';
  end if;
  if p_timed is null then
    raise exception 'Timed selection is required' using errcode = '22023';
  end if;
  if not p_timed and not blueprint.allow_untimed then
    raise exception 'This practice test must be timed' using errcode = '22023';
  end if;
  select coalesce(sum(r.target_count), 0)::integer into rule_total
  from public.practice_test_blueprint_rules r where r.blueprint_id = blueprint.id;
  if rule_total <> blueprint.question_count then
    raise exception 'Practice-test blueprint rules do not match its question count'
      using errcode = '22023';
  end if;
  if exists (
    select 1
    from public.practice_test_blueprint_rules r
    where r.blueprint_id = blueprint.id
      and (
        select count(*)
        from public.questions q
        where q.exam_id = blueprint.exam_id
          and q.difficulty = r.difficulty
          and q.cognitive_level = r.cognitive_level
          and (
            (q.review_status = 'approved' and q.status = 'active')
            or (
              q.review_status = 'draft' and q.status = 'draft'
              and q.import_package is not null
              and private.has_pilot_package_access(q.import_package)
            )
          )
      ) < r.target_count
  ) then
    raise exception 'Not enough available questions for the practice-test blueprint'
      using errcode = '22023';
  end if;

  insert into public.study_sessions (
    id, student_id, exam_id, mode, requested_count, question_count,
    blueprint_id, timed, time_limit_seconds, allow_pause_snapshot
  ) values (
    session_id, student_id, blueprint.exam_id, 'practice_test',
    blueprint.question_count, blueprint.question_count, blueprint.id, p_timed,
    case when p_timed then blueprint.time_limit_seconds else null end,
    blueprint.allow_pause
  );

  with candidates as (
    select
      r.id as rule_id,
      r.target_count,
      q.id as question_id,
      q.version,
      q.topic_id,
      row_number() over (
        partition by r.id, q.topic_id
        order by md5(session_id::text || ':candidate:' || q.id::text)
      ) as topic_rank
    from public.practice_test_blueprint_rules r
    join public.questions q
      on q.exam_id = blueprint.exam_id
      and q.difficulty = r.difficulty
      and q.cognitive_level = r.cognitive_level
    where r.blueprint_id = blueprint.id
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
        partition by c.rule_id
        order by c.topic_rank, c.topic_id,
          md5(session_id::text || ':rule:' || c.question_id::text)
      ) as rule_rank
    from candidates c
  ), selected as (
    select r.*,
      row_number() over (
        order by md5(session_id::text || ':position:' || r.question_id::text)
      )::integer as position
    from ranked r
    where r.rule_rank <= r.target_count
  )
  insert into public.study_session_questions (
    session_id, question_id, position, selection_reason, question_version
  )
  select session_id, s.question_id, s.position, 'practice_test_blueprint', s.version
  from selected s;

  select count(*)::integer into selected_count
  from public.study_session_questions sq where sq.session_id = session_id;
  if selected_count <> blueprint.question_count then
    raise exception 'Practice-test blueprint selection was incomplete' using errcode = '22023';
  end if;
  return session_id;
end;
$$;

create function public.set_practice_test_paused(p_session_id uuid, p_paused boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  student_id uuid := (select auth.uid());
  session public.study_sessions%rowtype;
begin
  select s.* into session from public.study_sessions s where s.id = p_session_id for update;
  if student_id is null or not found or session.student_id <> student_id
    or session.mode <> 'practice_test' then
    raise exception 'Practice test not found' using errcode = 'P0002';
  end if;
  if session.status <> 'active' then
    raise exception 'Practice test is not active' using errcode = '22023';
  end if;
  if not session.allow_pause_snapshot then
    raise exception 'Pausing is not allowed for this practice test' using errcode = '42501';
  end if;
  if p_paused and session.paused_at is null then
    update public.study_sessions set paused_at = now() where id = session.id;
  elsif not p_paused and session.paused_at is not null then
    update public.study_sessions set
      total_paused_seconds = total_paused_seconds
        + greatest(0, floor(extract(epoch from (now() - paused_at)))::integer),
      paused_at = null
    where id = session.id;
  end if;
end;
$$;

create function public.complete_practice_test(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  student_id uuid := (select auth.uid());
  session public.study_sessions%rowtype;
begin
  select s.* into session from public.study_sessions s where s.id = p_session_id for update;
  if student_id is null or not found or session.student_id <> student_id
    or session.mode <> 'practice_test' then
    raise exception 'Practice test not found' using errcode = 'P0002';
  end if;
  if session.status = 'completed' then return; end if;
  if session.status <> 'active' then
    raise exception 'Practice test is not active' using errcode = '22023';
  end if;
  update public.study_sessions set
    status = 'completed',
    completed_at = now(),
    total_paused_seconds = total_paused_seconds + case when paused_at is null then 0
      else greatest(0, floor(extract(epoch from (now() - paused_at)))::integer) end,
    paused_at = null
  where id = session.id;
end;
$$;

drop function public.get_study_session_questions(uuid);
create function public.get_study_session_questions(p_session_id uuid)
returns table (
  session_id uuid,
  session_mode public.study_session_mode,
  session_status public.study_session_status,
  question_count integer,
  answered_count integer,
  correct_count integer,
  timed boolean,
  time_limit_seconds integer,
  allow_pause boolean,
  is_paused boolean,
  remaining_seconds integer,
  feedback_released boolean,
  session_question_id uuid,
  question_position integer,
  question_id uuid,
  question_text text,
  question_type public.question_type,
  difficulty public.question_difficulty,
  cognitive_level public.cognitive_level,
  source_reference text,
  choices jsonb,
  attempt_id uuid,
  selected_choice_id uuid,
  is_correct boolean,
  correct_choice_id uuid,
  explanation text,
  selected_choice_feedback text,
  remediation text,
  common_mistake text,
  short_explanation text,
  feedback_display_version integer,
  memory_aid text,
  visual_asset_key text,
  visual_caption text,
  visual_alt_text text,
  visual_storage_path text,
  visual_mime_type text,
  visual_width integer,
  visual_height integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not private.owns_study_session(p_session_id) then
    raise exception 'Study session not found' using errcode = 'P0002';
  end if;
  return query
  select
    s.id,
    s.mode,
    s.status,
    s.question_count,
    s.answered_count,
    case when s.mode = 'study' or s.status = 'completed' then s.correct_count else 0 end,
    s.timed,
    s.time_limit_seconds,
    s.allow_pause_snapshot,
    s.paused_at is not null,
    case when s.timed then private.practice_remaining_seconds(
      s.started_at, s.time_limit_seconds, s.total_paused_seconds, s.paused_at, now()
    ) else null end,
    s.mode = 'study' or s.status = 'completed',
    sq.id,
    sq.position,
    q.id,
    q.question_text,
    q.question_type,
    q.difficulty,
    q.cognitive_level,
    q.source_reference,
    coalesce(
      jsonb_agg(jsonb_build_object(
        'id', c.id, 'key', c.choice_key, 'text', c.choice_text, 'sortOrder', c.sort_order
      ) order by c.sort_order) filter (where c.id is not null),
      '[]'::jsonb
    ),
    a.id,
    a.selected_choice_id,
    case when s.mode = 'study' or s.status = 'completed' then a.is_correct else null end,
    case when a.id is not null and (s.mode = 'study' or s.status = 'completed') then k.correct_choice_id else null end,
    case when a.id is not null and (s.mode = 'study' or s.status = 'completed') then k.explanation else null end,
    case when a.id is not null and (s.mode = 'study' or s.status = 'completed') then f.feedback_text else null end,
    case when a.id is not null and (s.mode = 'study' or s.status = 'completed') then k.remediation else null end,
    case when a.id is not null and (s.mode = 'study' or s.status = 'completed') then k.common_mistake else null end,
    case when a.id is not null and (s.mode = 'study' or s.status = 'completed') then ls.short_explanation else null end,
    case when a.id is not null and (s.mode = 'study' or s.status = 'completed') then ls.feedback_display_version else null end,
    case when a.id is not null and (s.mode = 'study' or s.status = 'completed') then ls.memory_aid else null end,
    case when a.id is not null and (s.mode = 'study' or s.status = 'completed') and va.status = 'approved' then va.asset_key else null end,
    case when a.id is not null and (s.mode = 'study' or s.status = 'completed') and va.status = 'approved' then ls.visual_caption else null end,
    case when a.id is not null and (s.mode = 'study' or s.status = 'completed') and va.status = 'approved' then va.alt_text else null end,
    case when a.id is not null and (s.mode = 'study' or s.status = 'completed') and va.status = 'approved' then va.storage_path else null end,
    case when a.id is not null and (s.mode = 'study' or s.status = 'completed') and va.status = 'approved' then va.mime_type else null end,
    case when a.id is not null and (s.mode = 'study' or s.status = 'completed') and va.status = 'approved' then va.width else null end,
    case when a.id is not null and (s.mode = 'study' or s.status = 'completed') and va.status = 'approved' then va.height else null end
  from public.study_sessions s
  join public.study_session_questions sq on sq.session_id = s.id
  join public.questions q on q.id = sq.question_id
  left join public.question_choices c on c.question_id = q.id
  left join public.question_attempts a on a.session_question_id = sq.id
  left join private.question_answer_keys k on k.question_id = q.id
  left join private.question_choice_feedback f on f.choice_id = a.selected_choice_id
  left join private.question_learning_support ls on ls.question_id = q.id
  left join private.visual_assets va on va.asset_key = ls.visual_asset_key
  where s.id = p_session_id
  group by s.id, sq.id, q.id, a.id, k.question_id, f.choice_id, ls.question_id, va.asset_key
  order by sq.position;
end;
$$;

create or replace function public.submit_answer(
  p_session_question_id uuid,
  p_selected_choice_id uuid,
  p_response_time_ms integer,
  p_confidence smallint default null
)
returns table (
  attempt_id uuid,
  is_correct boolean,
  correct_choice_id uuid,
  explanation text,
  selected_choice_feedback text,
  remediation text,
  common_mistake text,
  source_reference text,
  session_completed boolean,
  answered_count integer,
  question_count integer,
  correct_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  student_id uuid := (select auth.uid());
  session public.study_sessions%rowtype;
  session_question public.study_session_questions%rowtype;
  existing public.question_attempts%rowtype;
  correct_choice uuid;
  answer_correct boolean;
  new_attempt_id uuid;
  objective_id uuid;
  release_feedback boolean;
begin
  if student_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_response_time_ms is null or p_response_time_ms < 0 or p_response_time_ms > 3600000 then
    raise exception 'Invalid response time' using errcode = '22023';
  end if;
  if p_confidence is not null and (p_confidence < 1 or p_confidence > 5) then
    raise exception 'Confidence must be between 1 and 5' using errcode = '22023';
  end if;
  select sq.* into session_question from public.study_session_questions sq
  where sq.id = p_session_question_id;
  if not found then raise exception 'Session question not found' using errcode = 'P0002'; end if;
  select s.* into session from public.study_sessions s
  where s.id = session_question.session_id for update;
  if not found or session.student_id <> student_id then
    raise exception 'Study session not found' using errcode = 'P0002';
  end if;
  select a.* into existing from public.question_attempts a
  where a.session_question_id = p_session_question_id;
  if found then
    if existing.selected_choice_id <> p_selected_choice_id then
      raise exception 'Answer already submitted with a different choice' using errcode = '23505';
    end if;
    new_attempt_id := existing.id;
    answer_correct := existing.is_correct;
  else
    if session.status <> 'active' then
      raise exception 'Study session is not active' using errcode = '22023';
    end if;
    if session.mode = 'practice_test' and session.paused_at is not null then
      raise exception 'Resume the practice test before answering' using errcode = '22023';
    end if;
    if session.mode = 'practice_test' and session.timed and private.practice_remaining_seconds(
      session.started_at, session.time_limit_seconds, session.total_paused_seconds,
      session.paused_at, now()
    ) <= 0 then
      raise exception 'Practice test time has expired' using errcode = '22023';
    end if;
    if not exists (
      select 1 from public.question_choices c
      where c.id = p_selected_choice_id and c.question_id = session_question.question_id
    ) then
      raise exception 'Selected choice does not belong to the question' using errcode = '22023';
    end if;
    select k.correct_choice_id into correct_choice from private.question_answer_keys k
    where k.question_id = session_question.question_id;
    if correct_choice is null then raise exception 'Question answer key unavailable'; end if;
    answer_correct := p_selected_choice_id = correct_choice;
    insert into public.question_attempts (
      session_id, session_question_id, student_id, question_id,
      selected_choice_id, is_correct, response_time_ms, confidence
    ) values (
      session.id, p_session_question_id, student_id, session_question.question_id,
      p_selected_choice_id, answer_correct, p_response_time_ms, p_confidence
    ) returning id into new_attempt_id;

    if session.mode = 'study' then
      perform private.update_student_mastery(
        student_id, session_question.question_id, answer_correct, p_confidence, now()
      );
      if not answer_correct then
        select q.learning_objective_id into objective_id
        from public.questions q where q.id = session_question.question_id;
        if objective_id is not null then
          update public.study_session_questions target set selection_reason = 'same_session_remediation'
          where target.id = (
            select later.id
            from public.study_session_questions later
            join public.questions related on related.id = later.question_id
            left join public.question_attempts attempted on attempted.session_question_id = later.id
            where later.session_id = session.id
              and later.position > session_question.position
              and related.learning_objective_id = objective_id
              and attempted.id is null
            order by later.position limit 1
          );
        end if;
      end if;
    end if;

    update public.study_sessions s set
      answered_count = s.answered_count + 1,
      correct_count = s.correct_count + case when answer_correct then 1 else 0 end,
      status = case when s.answered_count + 1 = s.question_count then 'completed' else s.status end,
      completed_at = case when s.answered_count + 1 = s.question_count then now() else s.completed_at end
    where s.id = session.id returning * into session;
  end if;

  release_feedback := session.mode = 'study' or session.status = 'completed';
  return query select
    new_attempt_id,
    case when release_feedback then answer_correct else null end,
    case when release_feedback then k.correct_choice_id else null end,
    case when release_feedback then k.explanation else null end,
    case when release_feedback then f.feedback_text else null end,
    case when release_feedback then k.remediation else null end,
    case when release_feedback then k.common_mistake else null end,
    case when release_feedback then q.source_reference else null end,
    session.status = 'completed',
    session.answered_count,
    session.question_count,
    case when release_feedback then session.correct_count else 0 end
  from public.questions q
  join private.question_answer_keys k on k.question_id = q.id
  left join private.question_choice_feedback f on f.choice_id = p_selected_choice_id
  where q.id = session_question.question_id;
end;
$$;

create function public.get_practice_test_results(p_session_id uuid)
returns table (
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
#variable_conflict use_variable
declare
  student_id uuid := (select auth.uid());
begin
  if student_id is null or not exists (
    select 1 from public.study_sessions s
    where s.id = p_session_id and s.student_id = student_id
      and s.mode = 'practice_test' and s.status = 'completed'
  ) then
    raise exception 'Completed practice test not found' using errcode = 'P0002';
  end if;
  return query
  select
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
  from public.study_session_questions sq
  join public.questions q on q.id = sq.question_id
  join public.topics t on t.id = q.topic_id
  left join public.question_attempts a on a.session_question_id = sq.id
  where sq.session_id = p_session_id
  group by t.id, t.title
  order by score_percent, t.title;
end;
$$;

insert into public.practice_test_blueprints (
  id, exam_id, code, name, description, question_count,
  time_limit_seconds, allow_untimed, allow_pause, status
) values (
  '70000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'LTL1_C1_PILOT_10',
  'Chapter 1 pilot practice test',
  'Unofficial ten-question pilot blueprint with balanced difficulty and cognitive coverage.',
  10, 900, true, false, 'active'
);

insert into public.practice_test_blueprint_rules (
  blueprint_id, difficulty, cognitive_level, target_count
) values
  ('70000000-0000-4000-8000-000000000001', 'easy', 'recall', 2),
  ('70000000-0000-4000-8000-000000000001', 'easy', 'understanding', 2),
  ('70000000-0000-4000-8000-000000000001', 'medium', 'recall', 1),
  ('70000000-0000-4000-8000-000000000001', 'medium', 'understanding', 1),
  ('70000000-0000-4000-8000-000000000001', 'medium', 'application', 1),
  ('70000000-0000-4000-8000-000000000001', 'medium', 'scenario', 1),
  ('70000000-0000-4000-8000-000000000001', 'hard', 'recall', 1),
  ('70000000-0000-4000-8000-000000000001', 'hard', 'scenario', 1);

revoke all on function private.practice_remaining_seconds(timestamptz, integer, integer, timestamptz, timestamptz) from public;
revoke all on function public.get_practice_test_options() from public;
revoke all on function public.create_practice_test(uuid, boolean) from public;
revoke all on function public.set_practice_test_paused(uuid, boolean) from public;
revoke all on function public.complete_practice_test(uuid) from public;
revoke all on function public.get_study_session_questions(uuid) from public;
revoke all on function public.submit_answer(uuid, uuid, integer, smallint) from public;
revoke all on function public.get_practice_test_results(uuid) from public;
grant execute on function public.get_practice_test_options() to authenticated;
grant execute on function public.create_practice_test(uuid, boolean) to authenticated;
grant execute on function public.set_practice_test_paused(uuid, boolean) to authenticated;
grant execute on function public.complete_practice_test(uuid) to authenticated;
grant execute on function public.get_study_session_questions(uuid) to authenticated;
grant execute on function public.submit_answer(uuid, uuid, integer, smallint) to authenticated;
grant execute on function public.get_practice_test_results(uuid) to authenticated;

comment on table public.practice_test_blueprints is 'Configurable unofficial practice-test timing and question targets.';
comment on table public.practice_test_blueprint_rules is 'Disjoint difficulty/cognitive strata used for balanced practice-test selection.';
comment on function public.create_practice_test is 'Creates an owned practice test from a fixed active blueprint without exposing answers.';
comment on function public.set_practice_test_paused is 'Pauses or resumes only an owned active practice test whose snapshotted blueprint permits pausing.';
comment on function public.complete_practice_test is 'Completes an owned practice test and releases feedback for attempted questions.';
comment on function public.get_practice_test_results is 'Returns topic-level analysis only after an owned practice test is complete.';

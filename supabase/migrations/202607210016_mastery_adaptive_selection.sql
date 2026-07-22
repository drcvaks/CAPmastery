create type public.mastery_status as enum (
  'not_started', 'beginning', 'developing', 'proficient', 'mastered', 'needs_review'
);
create type public.question_learning_state as enum ('new', 'learning', 'review', 'secure', 'needs_review');

create table public.student_question_state (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  times_seen integer not null default 0 check (times_seen >= 0),
  times_correct integer not null default 0 check (times_correct between 0 and times_seen),
  consecutive_correct integer not null default 0 check (consecutive_correct >= 0),
  consecutive_incorrect integer not null default 0 check (consecutive_incorrect >= 0),
  last_result boolean,
  last_seen_at timestamptz,
  next_review_at timestamptz,
  ease_factor numeric(4, 2) not null default 2.50 check (ease_factor between 1.30 and 3.00),
  interval_days integer not null default 0 check (interval_days between 0 and 60),
  state public.question_learning_state not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, question_id)
);

create table public.student_topic_mastery (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  attempts_count integer not null default 0 check (attempts_count >= 0),
  correct_count integer not null default 0 check (correct_count between 0 and attempts_count),
  recent_accuracy numeric(5, 2) not null default 40 check (recent_accuracy between 0 and 100),
  mastery_score numeric(5, 2) not null default 40 check (mastery_score between 0 and 100),
  confidence_score numeric(5, 2) not null default 0 check (confidence_score between 0 and 100),
  retention_score numeric(5, 2) not null default 0 check (retention_score between 0 and 100),
  consecutive_correct integer not null default 0 check (consecutive_correct >= 0),
  consecutive_incorrect integer not null default 0 check (consecutive_incorrect >= 0),
  last_practiced_at timestamptz,
  next_review_at timestamptz,
  status public.mastery_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, topic_id)
);

create index student_question_state_student_due_idx
  on public.student_question_state (student_id, next_review_at, last_seen_at);
create index student_question_state_question_idx
  on public.student_question_state (question_id, last_seen_at desc);
create index student_topic_mastery_student_status_idx
  on public.student_topic_mastery (student_id, status, mastery_score);
create index student_topic_mastery_topic_idx
  on public.student_topic_mastery (topic_id, updated_at desc);

create trigger student_question_state_set_updated_at
before update on public.student_question_state
for each row execute function private.set_updated_at();

create trigger student_topic_mastery_set_updated_at
before update on public.student_topic_mastery
for each row execute function private.set_updated_at();

alter table public.student_question_state enable row level security;
alter table public.student_topic_mastery enable row level security;

create policy student_question_state_select_owner
on public.student_question_state for select to authenticated
using (student_id = (select auth.uid()));

create policy student_topic_mastery_select_owner
on public.student_topic_mastery for select to authenticated
using (student_id = (select auth.uid()));

revoke all on table public.student_question_state from anon, authenticated;
revoke all on table public.student_topic_mastery from anon, authenticated;
grant select on table public.student_question_state to authenticated;
grant select on table public.student_topic_mastery to authenticated;

alter table public.study_session_questions
  drop constraint if exists study_session_questions_selection_reason_check;
alter table public.study_session_questions
  add constraint study_session_questions_selection_reason_check check (
    selection_reason in (
      'basic_ordered', 'private_pilot', 'weak_topic', 'recently_missed',
      'developing_topic', 'retention_check', 'new_or_harder', 'same_session_remediation'
    )
  );

create function private.review_interval_days(p_is_correct boolean, p_consecutive_correct integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when not p_is_correct then 1
    when p_consecutive_correct <= 1 then 2
    when p_consecutive_correct = 2 then 5
    when p_consecutive_correct = 3 then 10
    else least(60, round(10 * power(1.7, p_consecutive_correct - 3))::integer)
  end;
$$;

create function private.mastery_status_for(
  p_score numeric,
  p_attempts integer,
  p_consecutive_incorrect integer
)
returns public.mastery_status
language sql
immutable
set search_path = ''
as $$
  select case
    when p_attempts = 0 then 'not_started'::public.mastery_status
    when p_consecutive_incorrect >= 2 then 'needs_review'::public.mastery_status
    when p_score < 35 then 'beginning'::public.mastery_status
    when p_score < 60 then 'developing'::public.mastery_status
    when p_score < 80 then 'proficient'::public.mastery_status
    else 'mastered'::public.mastery_status
  end;
$$;

create function private.update_student_mastery(
  p_student_id uuid,
  p_question_id uuid,
  p_is_correct boolean,
  p_confidence smallint,
  p_now timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_question public.questions%rowtype;
  v_question_state public.student_question_state%rowtype;
  v_topic_state public.student_topic_mastery%rowtype;
  v_question_correct integer;
  v_question_incorrect integer;
  v_topic_correct integer;
  v_topic_incorrect integer;
  v_interval integer;
  v_delta numeric;
  v_mastery numeric;
  v_recent_accuracy numeric;
  v_confidence_score numeric;
  v_attempts integer;
  v_correct_count integer;
  v_status public.mastery_status;
begin
  select q.* into strict v_question from public.questions q where q.id = p_question_id;

  select s.* into v_question_state
  from public.student_question_state s
  where s.student_id = p_student_id and s.question_id = p_question_id
  for update;

  v_question_correct := case when p_is_correct then coalesce(v_question_state.consecutive_correct, 0) + 1 else 0 end;
  v_question_incorrect := case when p_is_correct then 0 else coalesce(v_question_state.consecutive_incorrect, 0) + 1 end;
  v_interval := private.review_interval_days(p_is_correct, v_question_correct);

  insert into public.student_question_state (
    student_id, question_id, times_seen, times_correct, consecutive_correct,
    consecutive_incorrect, last_result, last_seen_at, next_review_at,
    ease_factor, interval_days, state
  ) values (
    p_student_id,
    p_question_id,
    coalesce(v_question_state.times_seen, 0) + 1,
    coalesce(v_question_state.times_correct, 0) + case when p_is_correct then 1 else 0 end,
    v_question_correct,
    v_question_incorrect,
    p_is_correct,
    p_now,
    p_now + make_interval(days => v_interval),
    greatest(1.30, least(3.00,
      coalesce(v_question_state.ease_factor, 2.50)
      + case when not p_is_correct then -0.20 when coalesce(p_confidence, 3) >= 4 then 0.10 else 0 end
    )),
    v_interval,
    case
      when not p_is_correct then 'needs_review'::public.question_learning_state
      when v_question_correct >= 3 then 'secure'::public.question_learning_state
      when v_question_correct >= 2 then 'review'::public.question_learning_state
      else 'learning'::public.question_learning_state
    end
  ) on conflict (student_id, question_id) do update set
    times_seen = excluded.times_seen,
    times_correct = excluded.times_correct,
    consecutive_correct = excluded.consecutive_correct,
    consecutive_incorrect = excluded.consecutive_incorrect,
    last_result = excluded.last_result,
    last_seen_at = excluded.last_seen_at,
    next_review_at = excluded.next_review_at,
    ease_factor = excluded.ease_factor,
    interval_days = excluded.interval_days,
    state = excluded.state;

  select m.* into v_topic_state
  from public.student_topic_mastery m
  where m.student_id = p_student_id and m.topic_id = v_question.topic_id
  for update;

  v_topic_correct := case when p_is_correct then coalesce(v_topic_state.consecutive_correct, 0) + 1 else 0 end;
  v_topic_incorrect := case when p_is_correct then 0 else coalesce(v_topic_state.consecutive_incorrect, 0) + 1 end;
  v_delta := case
    when p_is_correct then case v_question.difficulty when 'easy' then 5 when 'medium' then 7 else 9 end
    else case v_question.difficulty when 'easy' then -10 when 'medium' then -8 else -6 end
  end;
  if p_is_correct and v_question.cognitive_level in ('application', 'scenario') then
    v_delta := v_delta + 2;
  end if;
  if p_is_correct and coalesce(p_confidence, 3) <= 2 then
    v_delta := v_delta * 0.70;
  elsif not p_is_correct and coalesce(p_confidence, 3) >= 4 then
    v_delta := v_delta - 2;
  end if;

  v_attempts := coalesce(v_topic_state.attempts_count, 0) + 1;
  v_correct_count := coalesce(v_topic_state.correct_count, 0) + case when p_is_correct then 1 else 0 end;
  v_mastery := round(greatest(0, least(100, coalesce(v_topic_state.mastery_score, 40) + v_delta)), 2);
  v_recent_accuracy := round(
    greatest(0, least(100, coalesce(v_topic_state.recent_accuracy, 40) * 0.75 + case when p_is_correct then 25 else 0 end)),
    2
  );
  v_confidence_score := round(greatest(0, least(100,
    coalesce(v_topic_state.confidence_score, 0)
    + case when p_is_correct then 10 else 6 end
    + case when v_topic_correct >= 2 then 3 else 0 end
  )), 2);
  v_status := private.mastery_status_for(v_mastery, v_attempts, v_topic_incorrect);
  v_interval := private.review_interval_days(p_is_correct, v_topic_correct);

  insert into public.student_topic_mastery (
    student_id, topic_id, attempts_count, correct_count, recent_accuracy,
    mastery_score, confidence_score, retention_score, consecutive_correct,
    consecutive_incorrect, last_practiced_at, next_review_at, status
  ) values (
    p_student_id, v_question.topic_id, v_attempts, v_correct_count, v_recent_accuracy,
    v_mastery, v_confidence_score, v_mastery, v_topic_correct,
    v_topic_incorrect, p_now, p_now + make_interval(days => v_interval), v_status
  ) on conflict (student_id, topic_id) do update set
    attempts_count = excluded.attempts_count,
    correct_count = excluded.correct_count,
    recent_accuracy = excluded.recent_accuracy,
    mastery_score = excluded.mastery_score,
    confidence_score = excluded.confidence_score,
    retention_score = excluded.retention_score,
    consecutive_correct = excluded.consecutive_correct,
    consecutive_incorrect = excluded.consecutive_incorrect,
    last_practiced_at = excluded.last_practiced_at,
    next_review_at = excluded.next_review_at,
    status = excluded.status;
end;
$$;

create or replace function public.create_study_session(
  p_exam_id uuid,
  p_question_count integer default 10,
  p_topic_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id uuid := (select auth.uid());
  v_session_id uuid;
  v_available integer;
begin
  if v_student_id is null or not private.has_role('student') then
    raise exception 'Student role required' using errcode = '42501';
  end if;
  if p_question_count is null or p_question_count < 1 or p_question_count > 50 then
    raise exception 'Question count must be between 1 and 50' using errcode = '22023';
  end if;
  if not exists (select 1 from public.exams e where e.id = p_exam_id and e.status = 'active') then
    raise exception 'Active exam not found' using errcode = 'P0002';
  end if;
  if p_topic_id is not null and not exists (
    select 1 from public.topics t
    where t.id = p_topic_id and t.exam_id = p_exam_id and t.status = 'active'
  ) then
    raise exception 'Active topic does not belong to exam' using errcode = '22023';
  end if;

  select count(*) into v_available
  from public.questions q
  where q.exam_id = p_exam_id
    and (p_topic_id is null or q.topic_id = p_topic_id)
    and (
      (q.review_status = 'approved' and q.status = 'active')
      or (
        q.review_status = 'draft' and q.status = 'draft' and q.import_package is not null
        and private.has_pilot_package_access(q.import_package)
      )
    );
  if v_available < p_question_count then
    raise exception 'Not enough available questions for a % question session', p_question_count
      using errcode = '22023';
  end if;

  insert into public.study_sessions (
    student_id, exam_id, topic_id, requested_count, question_count
  ) values (v_student_id, p_exam_id, p_topic_id, p_question_count, p_question_count)
  returning id into v_session_id;

  with eligible as (
    select
      q.id,
      q.version,
      coalesce(qs.times_seen, 0) as times_seen,
      qs.last_seen_at,
      case
        when qs.last_result = false and (qs.next_review_at is null or qs.next_review_at <= now()) then 'recently_missed'
        when tm.status in ('needs_review', 'beginning') or (tm.attempts_count > 0 and tm.mastery_score < 40) then 'weak_topic'
        when tm.status = 'developing' or (tm.attempts_count > 0 and tm.mastery_score < 60) then 'developing_topic'
        when tm.mastery_score >= 60 and qs.next_review_at is not null and qs.next_review_at <= now() then 'retention_check'
        else 'new_or_harder'
      end as reason
    from public.questions q
    left join public.student_question_state qs
      on qs.question_id = q.id and qs.student_id = v_student_id
    left join public.student_topic_mastery tm
      on tm.topic_id = q.topic_id and tm.student_id = v_student_id
    where q.exam_id = p_exam_id
      and (p_topic_id is null or q.topic_id = p_topic_id)
      and (
        (q.review_status = 'approved' and q.status = 'active')
        or (
          q.review_status = 'draft' and q.status = 'draft' and q.import_package is not null
          and private.has_pilot_package_access(q.import_package)
        )
      )
  ), quota_values as (
    select
      floor(p_question_count * 0.4)::integer as weak_count,
      floor(p_question_count * 0.2)::integer as missed_count,
      floor(p_question_count * 0.2)::integer as developing_count,
      floor(p_question_count * 0.1)::integer as retention_count,
      floor(p_question_count * 0.1)::integer as new_count
  ), quotas as (
    select q.*,
      p_question_count - (weak_count + missed_count + developing_count + retention_count + new_count) as remainder
    from quota_values q
  ), ranked as (
    select e.*,
      row_number() over (
        partition by e.reason
        order by
          case when e.last_seen_at > now() - interval '12 hours' then 1 else 0 end,
          e.times_seen,
          e.last_seen_at nulls first,
          md5(v_student_id::text || ':' || e.id::text)
      ) as bucket_rank
    from eligible e
  ), preferred as (
    select r.*,
      case r.reason
        when 'weak_topic' then 1
        when 'recently_missed' then 2
        when 'developing_topic' then 3
        when 'retention_check' then 4
        else 5
      end as bucket_order
    from ranked r cross join quotas q
    where r.bucket_rank <= case r.reason
      when 'weak_topic' then q.weak_count + case when q.remainder >= 1 then 1 else 0 end
      when 'recently_missed' then q.missed_count + case when q.remainder >= 2 then 1 else 0 end
      when 'developing_topic' then q.developing_count + case when q.remainder >= 3 then 1 else 0 end
      when 'retention_check' then q.retention_count + case when q.remainder >= 4 then 1 else 0 end
      else q.new_count + case when q.remainder >= 5 then 1 else 0 end
    end
  ), ordered_candidates as (
    select p.id, p.version, p.reason, 0 as fallback_order, p.bucket_order, p.bucket_rank
    from preferred p
    union all
    select r.id, r.version, r.reason, 1, 6,
      row_number() over (order by
        case r.reason
          when 'weak_topic' then 1 when 'recently_missed' then 2
          when 'developing_topic' then 3 when 'retention_check' then 4 else 5
        end,
        case when r.last_seen_at > now() - interval '12 hours' then 1 else 0 end,
        r.times_seen, r.last_seen_at nulls first,
        md5(v_student_id::text || ':' || r.id::text)
      )
    from ranked r
    where not exists (select 1 from preferred p where p.id = r.id)
  ), selected as (
    select c.*, row_number() over (
      order by c.fallback_order, c.bucket_order, c.bucket_rank, c.id
    )::integer as position
    from ordered_candidates c
    limit p_question_count
  )
  insert into public.study_session_questions (
    session_id, question_id, position, selection_reason, question_version
  )
  select v_session_id, s.id, s.position, s.reason, s.version
  from selected s;

  return v_session_id;
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
declare
  v_student_id uuid := (select auth.uid());
  v_session public.study_sessions%rowtype;
  v_session_question public.study_session_questions%rowtype;
  v_existing public.question_attempts%rowtype;
  v_correct_choice_id uuid;
  v_is_correct boolean;
  v_attempt_id uuid;
  v_objective_id uuid;
begin
  if v_student_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_response_time_ms is null or p_response_time_ms < 0 or p_response_time_ms > 3600000 then
    raise exception 'Invalid response time' using errcode = '22023';
  end if;
  if p_confidence is not null and (p_confidence < 1 or p_confidence > 5) then
    raise exception 'Confidence must be between 1 and 5' using errcode = '22023';
  end if;

  select sq.* into v_session_question from public.study_session_questions sq
  where sq.id = p_session_question_id;
  if not found then raise exception 'Session question not found' using errcode = 'P0002'; end if;

  select s.* into v_session from public.study_sessions s
  where s.id = v_session_question.session_id for update;
  if not found or v_session.student_id <> v_student_id then
    raise exception 'Study session not found' using errcode = 'P0002';
  end if;

  select a.* into v_existing from public.question_attempts a
  where a.session_question_id = p_session_question_id;
  if found then
    if v_existing.selected_choice_id <> p_selected_choice_id then
      raise exception 'Answer already submitted with a different choice' using errcode = '23505';
    end if;
    v_attempt_id := v_existing.id;
    v_is_correct := v_existing.is_correct;
  else
    if v_session.status <> 'active' then raise exception 'Study session is not active' using errcode = '22023'; end if;
    if not exists (
      select 1 from public.question_choices c
      where c.id = p_selected_choice_id and c.question_id = v_session_question.question_id
    ) then
      raise exception 'Selected choice does not belong to the question' using errcode = '22023';
    end if;

    select k.correct_choice_id into v_correct_choice_id
    from private.question_answer_keys k where k.question_id = v_session_question.question_id;
    if v_correct_choice_id is null then raise exception 'Question answer key unavailable'; end if;
    v_is_correct := p_selected_choice_id = v_correct_choice_id;

    insert into public.question_attempts (
      session_id, session_question_id, student_id, question_id,
      selected_choice_id, is_correct, response_time_ms, confidence
    ) values (
      v_session.id, p_session_question_id, v_student_id, v_session_question.question_id,
      p_selected_choice_id, v_is_correct, p_response_time_ms, p_confidence
    ) returning id into v_attempt_id;

    perform private.update_student_mastery(
      v_student_id, v_session_question.question_id, v_is_correct, p_confidence, now()
    );

    if not v_is_correct then
      select q.learning_objective_id into v_objective_id
      from public.questions q where q.id = v_session_question.question_id;
      if v_objective_id is not null then
        update public.study_session_questions target set selection_reason = 'same_session_remediation'
        where target.id = (
          select later.id
          from public.study_session_questions later
          join public.questions related on related.id = later.question_id
          left join public.question_attempts attempted on attempted.session_question_id = later.id
          where later.session_id = v_session.id
            and later.position > v_session_question.position
            and related.learning_objective_id = v_objective_id
            and attempted.id is null
          order by later.position
          limit 1
        );
      end if;
    end if;

    update public.study_sessions s set
      answered_count = s.answered_count + 1,
      correct_count = s.correct_count + case when v_is_correct then 1 else 0 end,
      status = case when s.answered_count + 1 = s.question_count then 'completed' else s.status end,
      completed_at = case when s.answered_count + 1 = s.question_count then now() else s.completed_at end
    where s.id = v_session.id returning * into v_session;
  end if;

  return query select
    v_attempt_id, v_is_correct, k.correct_choice_id, k.explanation, f.feedback_text,
    k.remediation, k.common_mistake, q.source_reference, v_session.status = 'completed',
    v_session.answered_count, v_session.question_count, v_session.correct_count
  from public.questions q
  join private.question_answer_keys k on k.question_id = q.id
  left join private.question_choice_feedback f on f.choice_id = p_selected_choice_id
  where q.id = v_session_question.question_id;
end;
$$;

revoke all on function private.review_interval_days(boolean, integer) from public;
revoke all on function private.mastery_status_for(numeric, integer, integer) from public;
revoke all on function private.update_student_mastery(uuid, uuid, boolean, smallint, timestamptz) from public;
revoke all on function public.create_study_session(uuid, integer, uuid) from public;
revoke all on function public.submit_answer(uuid, uuid, integer, smallint) from public;
grant execute on function public.create_study_session(uuid, integer, uuid) to authenticated;
grant execute on function public.submit_answer(uuid, uuid, integer, smallint) to authenticated;

comment on table public.student_question_state is 'Server-maintained spaced-review state; students may read only their own rows.';
comment on table public.student_topic_mastery is 'Server-maintained deterministic topic mastery; students may read only their own rows.';
comment on function public.create_study_session is 'Creates an owned deterministic adaptive session with auditable selection reasons and sparse-bank protection.';
comment on function public.submit_answer is 'Idempotent server-side grading that atomically updates question state and topic mastery.';

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
  v_question_ids uuid[];
begin
  if v_student_id is null or not private.has_role('student') then
    raise exception 'Student role required' using errcode = '42501';
  end if;
  if p_question_count is null or p_question_count < 1 or p_question_count > 50 then
    raise exception 'Question count must be between 1 and 50' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.exams e where e.id = p_exam_id and e.status = 'active'
  ) then
    raise exception 'Active exam not found' using errcode = 'P0002';
  end if;
  if p_topic_id is not null and not exists (
    select 1 from public.topics t
    where t.id = p_topic_id and t.exam_id = p_exam_id and t.status = 'active'
  ) then
    raise exception 'Active topic does not belong to exam' using errcode = '22023';
  end if;

  select array_agg(candidate.id order by candidate.created_at, candidate.id)
  into v_question_ids
  from (
    select q.id, q.created_at
    from public.questions q
    where q.exam_id = p_exam_id
      and (p_topic_id is null or q.topic_id = p_topic_id)
      and q.review_status = 'approved'
      and q.status = 'active'
    order by q.created_at, q.id
    limit p_question_count
  ) candidate;

  if coalesce(cardinality(v_question_ids), 0) < p_question_count then
    raise exception 'Not enough approved questions for a % question session', p_question_count
      using errcode = '22023';
  end if;

  insert into public.study_sessions (
    student_id, exam_id, topic_id, requested_count, question_count
  ) values (
    v_student_id, p_exam_id, p_topic_id, p_question_count, cardinality(v_question_ids)
  ) returning id into v_session_id;

  insert into public.study_session_questions (
    session_id, question_id, position, selection_reason, question_version
  )
  select v_session_id, q.id, selected.ordinality::integer, 'basic_ordered', q.version
  from unnest(v_question_ids) with ordinality selected(id, ordinality)
  join public.questions q on q.id = selected.id;

  return v_session_id;
end;
$$;

create or replace function public.get_study_session_questions(p_session_id uuid)
returns table (
  session_id uuid,
  session_status public.study_session_status,
  question_count integer,
  answered_count integer,
  correct_count integer,
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
  common_mistake text
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
    s.status,
    s.question_count,
    s.answered_count,
    s.correct_count,
    sq.id,
    sq.position,
    q.id,
    q.question_text,
    q.question_type,
    q.difficulty,
    q.cognitive_level,
    q.source_reference,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'key', c.choice_key,
          'text', c.choice_text,
          'sortOrder', c.sort_order
        ) order by c.sort_order
      ) filter (where c.id is not null),
      '[]'::jsonb
    ),
    a.id,
    a.selected_choice_id,
    a.is_correct,
    case when a.id is not null then k.correct_choice_id else null end,
    case when a.id is not null then k.explanation else null end,
    case when a.id is not null then f.feedback_text else null end,
    case when a.id is not null then k.remediation else null end,
    case when a.id is not null then k.common_mistake else null end
  from public.study_sessions s
  join public.study_session_questions sq on sq.session_id = s.id
  join public.questions q on q.id = sq.question_id
  left join public.question_choices c on c.question_id = q.id
  left join public.question_attempts a on a.session_question_id = sq.id
  left join private.question_answer_keys k on k.question_id = q.id
  left join private.question_choice_feedback f on f.choice_id = a.selected_choice_id
  where s.id = p_session_id
  group by s.id, sq.id, q.id, a.id, k.question_id, f.choice_id
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
declare
  v_student_id uuid := (select auth.uid());
  v_session public.study_sessions%rowtype;
  v_session_question public.study_session_questions%rowtype;
  v_existing public.question_attempts%rowtype;
  v_correct_choice_id uuid;
  v_is_correct boolean;
  v_attempt_id uuid;
begin
  if v_student_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_response_time_ms is null or p_response_time_ms < 0 or p_response_time_ms > 3600000 then
    raise exception 'Invalid response time' using errcode = '22023';
  end if;
  if p_confidence is not null and (p_confidence < 1 or p_confidence > 5) then
    raise exception 'Confidence must be between 1 and 5' using errcode = '22023';
  end if;

  select sq.* into v_session_question
  from public.study_session_questions sq
  where sq.id = p_session_question_id;
  if not found then
    raise exception 'Session question not found' using errcode = 'P0002';
  end if;

  select s.* into v_session
  from public.study_sessions s
  where s.id = v_session_question.session_id
  for update;
  if not found or v_session.student_id <> v_student_id then
    raise exception 'Study session not found' using errcode = 'P0002';
  end if;

  select a.* into v_existing
  from public.question_attempts a
  where a.session_question_id = p_session_question_id;
  if found then
    if v_existing.selected_choice_id <> p_selected_choice_id then
      raise exception 'Answer already submitted with a different choice' using errcode = '23505';
    end if;
    v_attempt_id := v_existing.id;
    v_is_correct := v_existing.is_correct;
  else
    if v_session.status <> 'active' then
      raise exception 'Study session is not active' using errcode = '22023';
    end if;
    if not exists (
      select 1 from public.question_choices c
      where c.id = p_selected_choice_id and c.question_id = v_session_question.question_id
    ) then
      raise exception 'Selected choice does not belong to the question' using errcode = '22023';
    end if;

    select k.correct_choice_id into v_correct_choice_id
    from private.question_answer_keys k
    where k.question_id = v_session_question.question_id;
    if v_correct_choice_id is null then
      raise exception 'Question answer key unavailable';
    end if;
    v_is_correct := p_selected_choice_id = v_correct_choice_id;

    insert into public.question_attempts (
      session_id, session_question_id, student_id, question_id,
      selected_choice_id, is_correct, response_time_ms, confidence
    ) values (
      v_session.id, p_session_question_id, v_student_id, v_session_question.question_id,
      p_selected_choice_id, v_is_correct, p_response_time_ms, p_confidence
    ) returning id into v_attempt_id;

    update public.study_sessions s set
      answered_count = s.answered_count + 1,
      correct_count = s.correct_count + case when v_is_correct then 1 else 0 end,
      status = case when s.answered_count + 1 = s.question_count then 'completed' else s.status end,
      completed_at = case when s.answered_count + 1 = s.question_count then now() else s.completed_at end
    where s.id = v_session.id
    returning * into v_session;
  end if;

  return query
  select
    v_attempt_id,
    v_is_correct,
    k.correct_choice_id,
    k.explanation,
    f.feedback_text,
    k.remediation,
    k.common_mistake,
    q.source_reference,
    v_session.status = 'completed',
    v_session.answered_count,
    v_session.question_count,
    v_session.correct_count
  from public.questions q
  join private.question_answer_keys k on k.question_id = q.id
  left join private.question_choice_feedback f on f.choice_id = p_selected_choice_id
  where q.id = v_session_question.question_id;
end;
$$;

revoke all on function public.create_study_session(uuid, integer, uuid) from public;
revoke all on function public.get_study_session_questions(uuid) from public;
revoke all on function public.submit_answer(uuid, uuid, integer, smallint) from public;
grant execute on function public.create_study_session(uuid, integer, uuid) to authenticated;
grant execute on function public.get_study_session_questions(uuid) to authenticated;
grant execute on function public.submit_answer(uuid, uuid, integer, smallint) to authenticated;

comment on function public.create_study_session is 'Creates an owned session from approved active questions only.';
comment on function public.get_study_session_questions is 'Returns session prompts and post-attempt feedback only to the owning student.';
comment on function public.submit_answer is 'Idempotent server-side grading; clients cannot supply or write correctness.';

-- Practice choices can be revised only before explicit completion or expiry.
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
      if session.mode <> 'practice_test' then
        raise exception 'Answer already submitted with a different choice' using errcode = '23505';
      end if;
      if not private.has_role('student') or not exists (
        select 1 from public.profiles p where p.id=student_id and p.status='active'
      ) then raise exception 'Not authorized' using errcode='42501'; end if;
      if session.status <> 'active' then
        raise exception 'Practice test is not active' using errcode='22023';
      end if;
      if session.paused_at is not null then
        raise exception 'Resume the practice test before answering' using errcode='22023';
      end if;
      if session.timed and private.practice_remaining_seconds(
        session.started_at, session.time_limit_seconds, session.total_paused_seconds,
        session.paused_at, now()
      ) <= 0 then
        raise exception 'Practice test time has expired' using errcode='22023';
      end if;
      if not exists (
        select 1 from public.question_choices c
        where c.id=p_selected_choice_id and c.question_id=session_question.question_id
      ) then raise exception 'Selected choice does not belong to the question' using errcode='22023'; end if;
      select k.correct_choice_id into correct_choice from private.question_answer_keys k
        where k.question_id=session_question.question_id;
      if correct_choice is null then raise exception 'Question answer key unavailable'; end if;
      answer_correct := p_selected_choice_id=correct_choice;
      update public.question_attempts a set selected_choice_id=p_selected_choice_id,
        is_correct=answer_correct, response_time_ms=p_response_time_ms, confidence=p_confidence
        where a.id=existing.id;
      update public.study_sessions s set correct_count=s.correct_count
        - case when existing.is_correct then 1 else 0 end
        + case when answer_correct then 1 else 0 end
        where s.id=session.id returning * into session;
      -- Keep the encounter/attempt ID and original submitted_at so changing a
      -- choice does not count as a new question or mission contribution.
      existing.is_correct := answer_correct;
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
      status = case when s.mode <> 'practice_test' and s.answered_count + 1 = s.question_count then 'completed' else s.status end,
      completed_at = case when s.mode <> 'practice_test' and s.answered_count + 1 = s.question_count then now() else s.completed_at end
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

comment on function public.submit_answer(uuid,uuid,integer,smallint) is
  'Server grading with active-practice answer revisions; Study and challenge attempts remain immutable.';

revoke all on function public.submit_answer(uuid,uuid,integer,smallint) from public,anon,authenticated;
grant execute on function public.submit_answer(uuid,uuid,integer,smallint) to authenticated;


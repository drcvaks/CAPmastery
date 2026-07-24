create function public.admin_reset_student_learning_progress(
  p_student_id uuid,
  p_reason text,
  p_confirm boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text := trim(coalesce(p_reason, ''));
  v_session_count integer;
  v_attempt_count integer;
  v_question_state_count integer;
  v_topic_mastery_count integer;
  v_achievement_count integer;
  v_challenge_count integer;
  v_summary jsonb;
begin
  if (select auth.uid()) is null or not private.has_role('admin') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if char_length(v_reason) not between 10 and 240 then
    raise exception 'Reset reason must be between 10 and 240 characters'
      using errcode = '22023';
  end if;

  perform 1
  from public.profiles
  where id = p_student_id
  for update;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.user_roles
    where user_id = p_student_id
      and role = 'student'
      and scope_type = 'global'
  ) then
    raise exception 'Student role required' using errcode = '22023';
  end if;

  select count(*)::integer
  into v_session_count
  from public.study_sessions
  where student_id = p_student_id;

  select count(*)::integer
  into v_attempt_count
  from public.question_attempts
  where student_id = p_student_id;

  select count(*)::integer
  into v_question_state_count
  from public.student_question_state
  where student_id = p_student_id;

  select count(*)::integer
  into v_topic_mastery_count
  from public.student_topic_mastery
  where student_id = p_student_id;

  select count(*)::integer
  into v_achievement_count
  from public.student_achievements
  where student_id = p_student_id;

  select count(*)::integer
  into v_challenge_count
  from public.challenge_participants
  where student_id = p_student_id;

  v_summary := jsonb_build_object(
    'student_id', p_student_id,
    'study_sessions', v_session_count,
    'question_attempts', v_attempt_count,
    'question_states', v_question_state_count,
    'topic_mastery_rows', v_topic_mastery_count,
    'achievements', v_achievement_count,
    'shared_challenges', v_challenge_count,
    'preserved', jsonb_build_array(
      'account',
      'profile',
      'roles',
      'family_links',
      'pilot_package_assignments'
    )
  );

  if p_confirm is not true then
    return v_summary || jsonb_build_object(
      'confirmed', false,
      'blocked', v_challenge_count > 0
    );
  end if;

  if v_challenge_count > 0 then
    raise exception 'Student is part of a shared challenge; resolve that challenge before resetting progress'
      using errcode = '22023';
  end if;

  delete from public.student_achievements
  where student_id = p_student_id;

  delete from public.student_topic_mastery
  where student_id = p_student_id;

  delete from public.student_question_state
  where student_id = p_student_id;

  delete from public.study_sessions
  where student_id = p_student_id;

  insert into public.audit_log (
    actor_id,
    action,
    entity_type,
    entity_id,
    before_summary,
    after_summary
  ) values (
    (select auth.uid()),
    'student.learning_progress_reset',
    'profile',
    p_student_id,
    v_summary || jsonb_build_object('reason', v_reason),
    jsonb_build_object(
      'learning_progress', 'not_started',
      'account_preserved', true
    )
  );

  return v_summary || jsonb_build_object(
    'confirmed', true,
    'blocked', false
  );
end;
$$;

revoke all on function public.admin_reset_student_learning_progress(uuid, text, boolean)
from public;
grant execute on function public.admin_reset_student_learning_progress(uuid, text, boolean)
to authenticated;

comment on function public.admin_reset_student_learning_progress(uuid, text, boolean) is
  'Admin-only preview and audited reset of one student learning history. Shared challenge participation blocks deletion.';

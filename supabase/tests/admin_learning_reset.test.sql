begin;

create extension if not exists pgtap with schema extensions;
select plan(26);

select has_function(
  'public',
  'admin_reset_student_learning_progress',
  array['uuid', 'text', 'boolean'],
  'admin learning reset function exists'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.admin_reset_student_learning_progress(uuid,text,boolean)',
    'execute'
  ),
  'authenticated users may reach the protected reset entrypoint'
);
select is(
  has_function_privilege(
    'anon',
    'public.admin_reset_student_learning_progress(uuid,text,boolean)',
    'execute'
  ),
  false,
  'anonymous users cannot execute the reset entrypoint'
);

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
values
  (
    'a1111111-1111-4111-8111-111111111111',
    'reset-admin@example.test',
    '{"display_name":"Reset Administrator"}',
    '{}',
    'authenticated',
    'authenticated'
  ),
  (
    'a2222222-2222-4222-8222-222222222222',
    'reset-student@example.test',
    '{"display_name":"Reset Student"}',
    '{}',
    'authenticated',
    'authenticated'
  ),
  (
    'a3333333-3333-4333-8333-333333333333',
    'preserved-student@example.test',
    '{"display_name":"Preserved Student"}',
    '{}',
    'authenticated',
    'authenticated'
  );

insert into public.user_roles (user_id, role, created_by)
values
  (
    'a1111111-1111-4111-8111-111111111111',
    'admin',
    'a1111111-1111-4111-8111-111111111111'
  ),
  (
    'a1111111-1111-4111-8111-111111111111',
    'parent',
    'a1111111-1111-4111-8111-111111111111'
  ),
  (
    'a2222222-2222-4222-8222-222222222222',
    'student',
    'a1111111-1111-4111-8111-111111111111'
  ),
  (
    'a3333333-3333-4333-8333-333333333333',
    'student',
    'a1111111-1111-4111-8111-111111111111'
  );

insert into public.student_guardian_links (
  student_id,
  guardian_id,
  relationship_type,
  can_view_progress,
  can_manage_challenges,
  created_by
) values (
  'a2222222-2222-4222-8222-222222222222',
  'a1111111-1111-4111-8111-111111111111',
  'parent',
  true,
  true,
  'a1111111-1111-4111-8111-111111111111'
);

insert into public.pilot_package_assignments (student_id, import_package, assigned_by)
values (
  'a2222222-2222-4222-8222-222222222222',
  'RESET_TEST_PACKAGE',
  'a1111111-1111-4111-8111-111111111111'
);

insert into public.questions (
  id,
  exam_id,
  topic_id,
  question_text,
  difficulty,
  cognitive_level,
  created_by,
  external_id
) values (
  'a4444444-4444-4444-8444-444444444444',
  '20000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  'Synthetic reset question?',
  'easy',
  'recall',
  'a1111111-1111-4111-8111-111111111111',
  'RESET-TEST-Q1'
);

insert into public.question_choices (
  id,
  question_id,
  choice_key,
  choice_text,
  sort_order
) values (
  'a5555555-5555-4555-8555-555555555555',
  'a4444444-4444-4444-8444-444444444444',
  'A',
  'Synthetic reset answer',
  0
);

insert into public.study_sessions (
  id,
  student_id,
  exam_id,
  mode,
  requested_count,
  question_count
) values
  (
    'a6666666-6666-4666-8666-666666666661',
    'a2222222-2222-4222-8222-222222222222',
    '20000000-0000-4000-8000-000000000001',
    'study',
    1,
    1
  ),
  (
    'a6666666-6666-4666-8666-666666666662',
    'a2222222-2222-4222-8222-222222222222',
    '20000000-0000-4000-8000-000000000001',
    'challenge',
    1,
    1
  ),
  (
    'a6666666-6666-4666-8666-666666666663',
    'a3333333-3333-4333-8333-333333333333',
    '20000000-0000-4000-8000-000000000001',
    'study',
    1,
    1
  );

insert into public.study_session_questions (
  id,
  session_id,
  question_id,
  position,
  selection_reason,
  question_version
) values (
  'a7777777-7777-4777-8777-777777777777',
  'a6666666-6666-4666-8666-666666666661',
  'a4444444-4444-4444-8444-444444444444',
  1,
  'basic_ordered',
  1
);

insert into public.question_attempts (
  session_id,
  session_question_id,
  student_id,
  question_id,
  selected_choice_id,
  is_correct,
  response_time_ms
) values (
  'a6666666-6666-4666-8666-666666666661',
  'a7777777-7777-4777-8777-777777777777',
  'a2222222-2222-4222-8222-222222222222',
  'a4444444-4444-4444-8444-444444444444',
  'a5555555-5555-4555-8555-555555555555',
  true,
  1000
);

insert into public.student_question_state (
  student_id,
  question_id,
  times_seen,
  times_correct
) values (
  'a2222222-2222-4222-8222-222222222222',
  'a4444444-4444-4444-8444-444444444444',
  1,
  1
);

insert into public.student_topic_mastery (
  student_id,
  topic_id,
  attempts_count,
  correct_count
) values (
  'a2222222-2222-4222-8222-222222222222',
  '40000000-0000-4000-8000-000000000001',
  1,
  1
);

insert into public.student_achievements (student_id, achievement_id)
select
  'a2222222-2222-4222-8222-222222222222',
  id
from public.achievements
where code = 'FIRST_SESSION';

insert into public.challenges (
  id,
  created_by,
  title,
  exam_id,
  question_count,
  ends_at
) values (
  'a8888888-8888-4888-8888-888888888888',
  'a1111111-1111-4111-8111-111111111111',
  'Reset safety challenge',
  '20000000-0000-4000-8000-000000000001',
  3,
  now() + interval '7 days'
);

insert into public.challenge_participants (challenge_id, student_id, session_id)
values (
  'a8888888-8888-4888-8888-888888888888',
  'a2222222-2222-4222-8222-222222222222',
  'a6666666-6666-4666-8666-666666666662'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'a2222222-2222-4222-8222-222222222222',
  true
);
select throws_ok(
  $$select public.admin_reset_student_learning_progress(
    'a2222222-2222-4222-8222-222222222222',
    'Remove synthetic learning data',
    false
  )$$,
  '42501',
  'Not authorized',
  'student cannot preview or reset learning history'
);

select set_config(
  'request.jwt.claim.sub',
  'a1111111-1111-4111-8111-111111111111',
  true
);
create temporary table reset_preview as
select public.admin_reset_student_learning_progress(
  'a2222222-2222-4222-8222-222222222222',
  'Remove synthetic learning data',
  false
) as result;

select is((select result ->> 'confirmed' from reset_preview), 'false', 'preview does not confirm deletion');
select is((select (result ->> 'study_sessions')::integer from reset_preview), 2, 'preview counts target sessions');
select is((select (result ->> 'question_attempts')::integer from reset_preview), 1, 'preview counts target attempts');
select is((select (result ->> 'question_states')::integer from reset_preview), 1, 'preview counts target question state');
select is((select (result ->> 'topic_mastery_rows')::integer from reset_preview), 1, 'preview counts target mastery');
select is((select (result ->> 'achievements')::integer from reset_preview), 1, 'preview counts target achievements');
select is((select (result ->> 'shared_challenges')::integer from reset_preview), 1, 'preview counts shared challenges');
select is((select result ->> 'blocked' from reset_preview), 'true', 'preview reports the shared challenge block');
select throws_ok(
  $$select public.admin_reset_student_learning_progress(
    'a2222222-2222-4222-8222-222222222222',
    'Remove synthetic learning data',
    true
  )$$,
  '22023',
  'Student is part of a shared challenge; resolve that challenge before resetting progress',
  'shared challenge participation blocks destructive reset'
);
reset role;
select is(
  (
    select count(*)::integer
    from public.study_sessions
    where student_id = 'a2222222-2222-4222-8222-222222222222'
  ),
  2,
  'blocked reset leaves all target sessions intact'
);

delete from public.challenges
where id = 'a8888888-8888-4888-8888-888888888888';

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'a1111111-1111-4111-8111-111111111111',
  true
);
create temporary table reset_result as
select public.admin_reset_student_learning_progress(
  'a2222222-2222-4222-8222-222222222222',
  'Remove synthetic learning data',
  true
) as result;

reset role;
select is((select result ->> 'confirmed' from reset_result), 'true', 'administrator explicitly confirms the reset');
select is(
  (select count(*)::integer from public.study_sessions where student_id = 'a2222222-2222-4222-8222-222222222222'),
  0,
  'target sessions are deleted'
);
select is(
  (select count(*)::integer from public.question_attempts where student_id = 'a2222222-2222-4222-8222-222222222222'),
  0,
  'target attempts are deleted through session cascade'
);
select is(
  (select count(*)::integer from public.student_question_state where student_id = 'a2222222-2222-4222-8222-222222222222'),
  0,
  'target question state is deleted'
);
select is(
  (select count(*)::integer from public.student_topic_mastery where student_id = 'a2222222-2222-4222-8222-222222222222'),
  0,
  'target mastery is deleted'
);
select is(
  (select count(*)::integer from public.student_achievements where student_id = 'a2222222-2222-4222-8222-222222222222'),
  0,
  'target achievements are deleted'
);
select is(
  (
    select count(*)::integer
    from public.user_roles
    where user_id = 'a2222222-2222-4222-8222-222222222222'
      and role = 'student'
  ),
  1,
  'student role is preserved'
);
select is(
  (
    select count(*)::integer
    from public.student_guardian_links
    where student_id = 'a2222222-2222-4222-8222-222222222222'
  ),
  1,
  'family link is preserved'
);
select is(
  (
    select count(*)::integer
    from public.pilot_package_assignments
    where student_id = 'a2222222-2222-4222-8222-222222222222'
  ),
  1,
  'pilot package assignment is preserved'
);
select is(
  (
    select count(*)::integer
    from public.study_sessions
    where student_id = 'a3333333-3333-4333-8333-333333333333'
  ),
  1,
  'another student learning history is preserved'
);
select is(
  (
    select count(*)::integer
    from public.audit_log
    where action = 'student.learning_progress_reset'
      and entity_id = 'a2222222-2222-4222-8222-222222222222'
      and before_summary ->> 'reason' = 'Remove synthetic learning data'
  ),
  1,
  'confirmed reset is audited with the reason and target'
);
select is(
  (
    select after_summary ->> 'account_preserved'
    from public.audit_log
    where action = 'student.learning_progress_reset'
      and entity_id = 'a2222222-2222-4222-8222-222222222222'
    order by id desc
    limit 1
  ),
  'true',
  'audit confirms that the account was preserved'
);

rollback;

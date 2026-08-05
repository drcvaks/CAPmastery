begin;

create extension if not exists pgtap with schema extensions;
select plan(23);

-- This synthetic suite intentionally reuses the stable seed topic ID. Production
-- archives the obsolete catalog label, so the transaction owns its active fixture.
update public.topics
set status = 'active'
where id = '40000000-0000-4000-8000-000000000001';

select has_column('public', 'questions', 'external_id', 'questions have stable external IDs');
select has_column('public', 'questions', 'pilot_batch', 'questions preserve pilot batch');
select has_column('public', 'questions', 'import_package', 'questions preserve import package');
select has_column('public', 'questions', 'source_status', 'questions preserve source status');
select has_column('public', 'question_families', 'source_code', 'families preserve supplied source code');
select has_table('public', 'pilot_package_assignments', 'pilot package assignment table exists');
select has_function(
  'public', 'get_accessible_study_catalog', array[]::text[],
  'student-safe accessible study catalog function exists'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.pilot_package_assignments'::regclass),
  'pilot package assignments have RLS enabled'
);
select is(
  has_table_privilege('authenticated', 'public.pilot_package_assignments', 'insert'),
  false,
  'clients cannot directly create pilot assignments'
);

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
values
  ('b1111111-1111-4111-8111-111111111111', 'pilot-one@example.test', '{"display_name":"Pilot One"}', '{}', 'authenticated', 'authenticated'),
  ('b2222222-2222-4222-8222-222222222222', 'pilot-two@example.test', '{"display_name":"Pilot Two"}', '{}', 'authenticated', 'authenticated'),
  ('b3333333-3333-4333-8333-333333333333', 'pilot-admin@example.test', '{"display_name":"Pilot Admin"}', '{}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role, created_by)
values
  ('b1111111-1111-4111-8111-111111111111', 'student', 'b3333333-3333-4333-8333-333333333333'),
  ('b2222222-2222-4222-8222-222222222222', 'student', 'b3333333-3333-4333-8333-333333333333'),
  ('b3333333-3333-4333-8333-333333333333', 'admin', 'b3333333-3333-4333-8333-333333333333');

insert into public.questions (
  id, exam_id, topic_id, question_text, difficulty, cognitive_level,
  created_by, external_id, pilot_batch, import_package, source_status
) values (
  'b4444444-4444-4444-8444-444444444441',
  '20000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  'Private draft pilot fixture?', 'easy', 'recall',
  'b3333333-3333-4333-8333-333333333333',
  'PILOT-ACCESS-Q001', 'Pilot Test', 'PILOT_ACCESS_TEST', 'approved_source'
);
insert into public.question_choices (id, question_id, choice_key, choice_text, sort_order)
values
  ('b4444444-4444-4444-8444-444444444442', 'b4444444-4444-4444-8444-444444444441', 'A', 'Correct', 0),
  ('b4444444-4444-4444-8444-444444444443', 'b4444444-4444-4444-8444-444444444441', 'B', 'Wrong', 1),
  ('b4444444-4444-4444-8444-444444444444', 'b4444444-4444-4444-8444-444444444441', 'C', 'Other', 2),
  ('b4444444-4444-4444-8444-444444444445', 'b4444444-4444-4444-8444-444444444441', 'D', 'Alternate', 3);
insert into private.question_answer_keys (
  question_id, correct_choice_id, explanation, remediation, common_mistake, created_by
) values (
  'b4444444-4444-4444-8444-444444444441',
  'b4444444-4444-4444-8444-444444444442',
  'Private fixture explanation', 'Private fixture remediation', 'Private fixture mistake',
  'b3333333-3333-4333-8333-333333333333'
);

create temporary table pilot_session (id uuid primary key);
grant select, insert on table pilot_session to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b1111111-1111-4111-8111-111111111111', true);
select is(
  coalesce((
    select available_question_count
    from public.get_accessible_study_catalog()
    where topic_id = '40000000-0000-4000-8000-000000000001'
  ), 0),
  (
    select count(*)::integer
    from public.questions
    where topic_id = '40000000-0000-4000-8000-000000000001'
  ),
  'unassigned catalog count contains only student-visible approved questions'
);
select throws_ok(
  $$select public.admin_set_pilot_package_assignment(
    'b1111111-1111-4111-8111-111111111111', 'PILOT_ACCESS_TEST', true
  )$$,
  '42501', 'Administrator role required', 'students cannot assign pilot packages'
);
select throws_ok(
  $$select public.create_study_session(
    '20000000-0000-4000-8000-000000000001', 1,
    '40000000-0000-4000-8000-000000000001'
  )$$,
  '22023', 'Not enough available questions for a 1 question session',
  'unassigned students cannot receive draft pilot questions'
);

select set_config('request.jwt.claim.sub', 'b3333333-3333-4333-8333-333333333333', true);
select lives_ok(
  $$select public.admin_set_pilot_package_assignment(
    'b1111111-1111-4111-8111-111111111111', 'PILOT_ACCESS_TEST', true
  )$$,
  'administrator can assign a private pilot package'
);
select is(
  (
    select count(*)::integer
    from public.audit_log
    where action = 'pilot.assignment_enabled'
      and entity_id = 'b1111111-1111-4111-8111-111111111111'
  ),
  1,
  'pilot assignment is audited'
);

select set_config('request.jwt.claim.sub', 'b1111111-1111-4111-8111-111111111111', true);
select is(
  (select count(*)::integer from public.pilot_package_assignments),
  1,
  'assigned student reads own pilot assignment'
);
select is(
  (select count(*)::integer from public.questions where external_id = 'PILOT-ACCESS-Q001'),
  0,
  'draft pilot prompt remains hidden through normal question RLS'
);

insert into pilot_session
select public.create_study_session(
  '20000000-0000-4000-8000-000000000001', 1,
  '40000000-0000-4000-8000-000000000001'
) as id;
grant select on table pilot_session to authenticated;
select is((select count(*)::integer from pilot_session), 1, 'assigned student creates pilot session');
select is(
  (
    select available_question_count
    from public.get_accessible_study_catalog()
    where topic_id = '40000000-0000-4000-8000-000000000001'
  ),
  (
    select count(*)::integer + 1
    from public.questions
    where topic_id = '40000000-0000-4000-8000-000000000001'
  ),
  'assigned student catalog count adds exactly the assigned private question'
);
select is(
  (select selection_reason from public.study_session_questions where session_id = (select id from pilot_session)),
  'new_or_harder',
  'draft pilot questions participate in adaptive selection without being published'
);
select is(
  (
    select count(*)::integer
    from public.get_study_session_questions((select id from pilot_session))
    where correct_choice_id is not null or explanation is not null
  ),
  0,
  'draft pilot delivery hides answer data before submission'
);

select set_config('request.jwt.claim.sub', 'b2222222-2222-4222-8222-222222222222', true);
select is(
  coalesce((
    select available_question_count
    from public.get_accessible_study_catalog()
    where topic_id = '40000000-0000-4000-8000-000000000001'
  ), 0),
  (
    select count(*)::integer
    from public.questions
    where topic_id = '40000000-0000-4000-8000-000000000001'
  ),
  'another student catalog count excludes the assigned private question'
);
select is(
  (select count(*)::integer from public.pilot_package_assignments),
  0,
  'other students cannot read pilot assignments'
);
select is(
  (select count(*)::integer from public.study_sessions),
  0,
  'other students cannot read pilot sessions'
);

reset role;
select * from finish();
rollback;

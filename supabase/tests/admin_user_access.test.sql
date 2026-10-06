begin;

create extension if not exists pgtap with schema extensions;
select plan(22);

select has_function(
  'public',
  'admin_get_user_access_overview',
  array[]::text[],
  'admin user-access overview function exists'
);
select has_function(
  'public',
  'admin_update_student_access',
  array['uuid', 'boolean', 'text[]'],
  'admin student-access update function exists'
);
select ok(
  has_function_privilege('authenticated', 'public.admin_get_user_access_overview()', 'execute'),
  'authenticated users may reach the protected overview entrypoint'
);
select is(
  has_function_privilege('anon', 'public.admin_get_user_access_overview()', 'execute'),
  false,
  'anonymous users cannot execute the overview entrypoint'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.admin_update_student_access(uuid,boolean,text[])',
    'execute'
  ),
  'authenticated users may reach the protected update entrypoint'
);
select is(
  has_function_privilege('anon', 'public.admin_update_student_access(uuid,boolean,text[])', 'execute'),
  false,
  'anonymous users cannot execute the update entrypoint'
);

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
values
  (
    'ac100000-0000-4000-8000-000000000001',
    'access-admin@example.test',
    '{"display_name":"Access Administrator"}',
    '{}',
    'authenticated',
    'authenticated'
  ),
  (
    'ac100000-0000-4000-8000-000000000002',
    'new-cadet@example.test',
    '{"display_name":"New Cadet"}',
    '{}',
    'authenticated',
    'authenticated'
  ),
  (
    'ac100000-0000-4000-8000-000000000003',
    'ordinary-user@example.test',
    '{"display_name":"Ordinary User"}',
    '{}',
    'authenticated',
    'authenticated'
  );

insert into public.user_roles (user_id, role, created_by)
values (
  'ac100000-0000-4000-8000-000000000001',
  'admin',
  'ac100000-0000-4000-8000-000000000001'
);

insert into public.questions (
  id,
  exam_id,
  topic_id,
  question_text,
  difficulty,
  cognitive_level,
  created_by,
  external_id,
  import_package
) values
  (
    'ac200000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Synthetic access package question one?',
    'easy',
    'recall',
    'ac100000-0000-4000-8000-000000000001',
    'ACCESS-ADMIN-Q1',
    'ACCESS_TEST_ONE'
  ),
  (
    'ac200000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Synthetic access package question two?',
    'easy',
    'recall',
    'ac100000-0000-4000-8000-000000000001',
    'ACCESS-ADMIN-Q2',
    'ACCESS_TEST_TWO'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', 'ac100000-0000-4000-8000-000000000003', true);

select throws_ok(
  $$select public.admin_get_user_access_overview()$$,
  '42501',
  'Administrator role required',
  'non-admin cannot list registered users'
);
select throws_ok(
  $$select public.admin_update_student_access(
    'ac100000-0000-4000-8000-000000000002', true, array['ACCESS_TEST_ONE']
  )$$,
  '42501',
  'Administrator role required',
  'non-admin cannot update student access'
);

select set_config('request.jwt.claim.sub', 'ac100000-0000-4000-8000-000000000001', true);

select is(
  (
    select user_record ->> 'email'
    from jsonb_array_elements(public.admin_get_user_access_overview() -> 'users') user_record
    where user_record ->> 'user_id' = 'ac100000-0000-4000-8000-000000000002'
  ),
  'new-cadet@example.test',
  'admin overview includes the registered email'
);
select is(
  (
    select count(*)::integer
    from jsonb_array_elements(public.admin_get_user_access_overview() -> 'packages') package_record
    where package_record ->> 'import_package' in ('ACCESS_TEST_ONE', 'ACCESS_TEST_TWO')
      and package_record ->> 'exam_title' is not null
      and jsonb_array_length(package_record -> 'topic_titles') = 1
  ),
  2,
  'overview includes assignable package metadata'
);

select lives_ok(
  $$select public.admin_update_student_access(
    'ac100000-0000-4000-8000-000000000002',
    true,
    array['access_test_two', 'ACCESS_TEST_ONE', 'ACCESS_TEST_ONE']
  )$$,
  'admin atomically enables student access and normalized packages'
);
select is(
  (
    select count(*)::integer from public.user_roles
    where user_id = 'ac100000-0000-4000-8000-000000000002'
      and role = 'student'
      and scope_type = 'global'
  ),
  1,
  'student role is granted once'
);
select is(
  (
    select count(*)::integer from public.pilot_package_assignments
    where student_id = 'ac100000-0000-4000-8000-000000000002'
      and import_package in ('ACCESS_TEST_ONE', 'ACCESS_TEST_TWO')
  ),
  2,
  'both selected packages are assigned'
);
select is(
  (
    select jsonb_array_length(user_record -> 'assigned_packages')
    from jsonb_array_elements(public.admin_get_user_access_overview() -> 'users') user_record
    where user_record ->> 'user_id' = 'ac100000-0000-4000-8000-000000000002'
  ),
  2,
  'refreshed overview reports current assignments'
);

select lives_ok(
  $$select public.admin_update_student_access(
    'ac100000-0000-4000-8000-000000000002', true, array['ACCESS_TEST_TWO']
  )$$,
  'admin can replace the complete package selection'
);
select is(
  (
    select string_agg(import_package, ',' order by import_package)
    from public.pilot_package_assignments
    where student_id = 'ac100000-0000-4000-8000-000000000002'
  ),
  'ACCESS_TEST_TWO',
  'unselected packages are removed'
);
select throws_ok(
  $$select public.admin_update_student_access(
    'ac100000-0000-4000-8000-000000000002', true, array['MISSING_PACKAGE']
  )$$,
  'P0002',
  'Import package not found',
  'unknown package is rejected'
);
select is(
  (
    select string_agg(import_package, ',' order by import_package)
    from public.pilot_package_assignments
    where student_id = 'ac100000-0000-4000-8000-000000000002'
  ),
  'ACCESS_TEST_TWO',
  'rejected update leaves prior access unchanged'
);

select lives_ok(
  $$select public.admin_update_student_access(
    'ac100000-0000-4000-8000-000000000002', false, array[]::text[]
  )$$,
  'admin can remove student access'
);
select is(
  (
    select count(*)::integer from public.user_roles
    where user_id = 'ac100000-0000-4000-8000-000000000002'
      and role = 'student'
      and scope_type = 'global'
  ),
  0,
  'student role is revoked'
);
select is(
  (
    select count(*)::integer from public.pilot_package_assignments
    where student_id = 'ac100000-0000-4000-8000-000000000002'
  ),
  0,
  'removing student access clears package assignments'
);
select is(
  (
    select count(*)::integer from public.audit_log
    where entity_id = 'ac100000-0000-4000-8000-000000000002'
      and action = 'student_access.updated'
  ),
  3,
  'each successful access save is audited'
);

select * from finish();
rollback;

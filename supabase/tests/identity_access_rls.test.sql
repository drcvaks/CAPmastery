begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'user_roles', 'user_roles exists');
select has_table('public', 'student_guardian_links', 'student_guardian_links exists');
select has_table('public', 'organizations', 'organizations exists');
select has_table('public', 'organization_memberships', 'organization_memberships exists');
select has_table('public', 'audit_log', 'audit_log exists');

select is(
  (
    select count(*)::integer
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'profiles',
        'user_roles',
        'student_guardian_links',
        'organizations',
        'organization_memberships',
        'audit_log'
      )
      and c.relrowsecurity
  ),
  6,
  'RLS is enabled on every Checkpoint 2 API table'
);

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
values
  ('11111111-1111-1111-1111-111111111111', 'student-one@example.test', '{"display_name":"Student One"}', '{}', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'student-two@example.test', '{"display_name":"Student Two"}', '{}', 'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'guardian@example.test', '{"display_name":"Guardian"}', '{}', 'authenticated', 'authenticated'),
  ('44444444-4444-4444-4444-444444444444', 'admin@example.test', '{"display_name":"Administrator"}', '{}', 'authenticated', 'authenticated');

select is(
  (
    select count(*)::integer
    from public.profiles
    where id in (
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444'
    )
  ),
  4,
  'Auth trigger creates fixture profiles'
);

insert into public.user_roles (user_id, role, created_by)
values
  ('11111111-1111-1111-1111-111111111111', 'student', '44444444-4444-4444-4444-444444444444'),
  ('22222222-2222-2222-2222-222222222222', 'student', '44444444-4444-4444-4444-444444444444'),
  ('33333333-3333-3333-3333-333333333333', 'parent', '44444444-4444-4444-4444-444444444444'),
  ('44444444-4444-4444-4444-444444444444', 'admin', '44444444-4444-4444-4444-444444444444');

insert into public.student_guardian_links (
  student_id,
  guardian_id,
  relationship_type,
  created_by
) values (
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  'parent',
  '44444444-4444-4444-4444-444444444444'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select is((select count(*)::integer from public.profiles), 1, 'Student reads only own profile');
select is((select count(*)::integer from public.user_roles), 1, 'Student reads only own role');
select throws_ok(
  $$insert into public.user_roles (user_id, role) values ('11111111-1111-1111-1111-111111111111', 'admin')$$,
  '42501',
  'permission denied for table user_roles',
  'Student cannot assign a role directly'
);
select throws_ok(
  $$select public.admin_set_user_role('11111111-1111-1111-1111-111111111111', 'admin', true)$$,
  '42501',
  'Not authorized',
  'Student cannot call the admin role function'
);

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
select is((select count(*)::integer from public.profiles), 2, 'Guardian reads self and linked student');

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select is((select count(*)::integer from public.profiles), 1, 'Unrelated student cannot read another profile');

select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', true);
select is(
  (
    select count(*)::integer
    from public.profiles
    where id in (
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444'
    )
  ),
  4,
  'Admin reads all fixture profiles'
);

select * from finish();
rollback;

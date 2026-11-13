begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data,aud,role)
select ('ad620000-0000-4000-8000-00000000000'||n)::uuid,'family-fixture-'||n||'@example.test',
  '{}','{}','authenticated','authenticated' from generate_series(1,4) n;
insert into public.user_roles(user_id,role) values
('ad620000-0000-4000-8000-000000000001','admin'),
('ad620000-0000-4000-8000-000000000003','student'),
('ad620000-0000-4000-8000-000000000004','student');

select ok(not has_function_privilege('anon','public.admin_family_links(uuid,uuid,boolean)','execute'),'anonymous cannot call family management');
set local role authenticated;
select set_config('request.jwt.claim.sub','ad620000-0000-4000-8000-000000000002',true);
select throws_ok($$select public.admin_family_links('ad620000-0000-4000-8000-000000000002')$$,'42501','Not authorized','ordinary user cannot list links');
select throws_ok($$select public.admin_family_links('ad620000-0000-4000-8000-000000000002','ad620000-0000-4000-8000-000000000003',true)$$,'42501','Not authorized','ordinary user cannot grant their own access');

select set_config('request.jwt.claim.sub','ad620000-0000-4000-8000-000000000001',true);
select throws_ok($$select public.admin_family_links('ad620000-0000-4000-8000-000000000002','ad620000-0000-4000-8000-000000000001',true)$$,'22023','Student role required','cannot link a non-cadet');
select ok(not exists(select 1 from public.user_roles where user_id='ad620000-0000-4000-8000-000000000002' and role='parent'),'failed link rolls back Parent role');
select lives_ok($$select public.admin_family_links('ad620000-0000-4000-8000-000000000002','ad620000-0000-4000-8000-000000000003',true)$$,'admin links a cadet');
select ok(exists(select 1 from public.student_guardian_links where guardian_id='ad620000-0000-4000-8000-000000000002'
  and student_id='ad620000-0000-4000-8000-000000000003' and status='active' and can_view_progress
  and not can_assign_content and not can_manage_challenges),'new link is progress-only');
select is(jsonb_array_length(public.admin_family_links('ad620000-0000-4000-8000-000000000002','ad620000-0000-4000-8000-000000000004',true)),2,'admin can add a sibling');
select is(jsonb_array_length(public.admin_family_links('ad620000-0000-4000-8000-000000000002','ad620000-0000-4000-8000-000000000003',false)),1,'revoking a cadet leaves sibling linked');
select is(public.admin_family_links('ad620000-0000-4000-8000-000000000002')->0->>'student_id','ad620000-0000-4000-8000-000000000004','only sibling remains visible in management');
select set_config('request.jwt.claim.sub','ad620000-0000-4000-8000-000000000002',true);
select ok(exists(select 1 from public.get_progress_students() where student_id='ad620000-0000-4000-8000-000000000004'),'parent sees linked sibling in Family Progress');
select ok(not exists(select 1 from public.get_progress_students() where student_id='ad620000-0000-4000-8000-000000000003'),'revoked cadet no longer appears in Family Progress');

select * from finish();
rollback;

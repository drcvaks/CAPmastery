begin;
create extension if not exists pgtap with schema extensions;
select plan(15);
select has_function('public','get_content_review_catalog',array[]::text[],'curriculum review catalog exists');
select ok(has_function_privilege('authenticated','public.get_content_review_catalog()','execute'),'authenticated can reach protected catalog');
select is(has_function_privilege('anon','public.get_content_review_catalog()','execute'),false,'anonymous catalog access denied');
select is(has_table_privilege('authenticated','private.question_answer_keys','select'),false,'answer tables remain private');

insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data,aud,role) values
('ac580000-0000-4000-8000-000000000001','catalog-reviewer@example.test','{}','{}','authenticated','authenticated'),
('ac580000-0000-4000-8000-000000000002','catalog-student@example.test','{}','{}','authenticated','authenticated'),
('ac580000-0000-4000-8000-000000000003','catalog-admin@example.test','{}','{}','authenticated','authenticated'),
('ac580000-0000-4000-8000-000000000004','catalog-unassigned@example.test','{}','{}','authenticated','authenticated');
insert into public.user_roles(user_id,role,created_by) values
('ac580000-0000-4000-8000-000000000001','content_reviewer','ac580000-0000-4000-8000-000000000003'),
('ac580000-0000-4000-8000-000000000002','student','ac580000-0000-4000-8000-000000000003'),
('ac580000-0000-4000-8000-000000000003','admin','ac580000-0000-4000-8000-000000000003');
insert into public.questions(id,exam_id,topic_id,question_text,difficulty,cognitive_level,created_by,external_id,chapter_number,module_number)
select md5('review-catalog-fixture-'||n)::uuid,t.exam_id,t.id,'Synthetic review catalog prompt '||n,'easy','recall',
  'ac580000-0000-4000-8000-000000000003','REVIEWCATALOG-'||n,1,case when n=1005 then 7 else null end
from generate_series(1,1005) n
cross join public.topics t where t.id='40000000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.sub','ac580000-0000-4000-8000-000000000002',true);
select throws_ok($$select public.get_content_review_catalog()$$,'42501','Not authorized','student cannot discover draft question catalog');
select throws_ok($$select public.get_content_review_question(md5('review-catalog-fixture-1')::uuid)$$,'42501','Not authorized','student cannot open answer-bearing reviewer detail');
select set_config('request.jwt.claim.sub','ac580000-0000-4000-8000-000000000004',true);
select throws_ok($$select public.get_content_review_catalog()$$,'42501','Not authorized','account without role cannot browse catalog');
select set_config('request.jwt.claim.sub','ac580000-0000-4000-8000-000000000001',true);
select is((select count(*)::integer from jsonb_array_elements(public.get_content_review_catalog()) q where q->>'external_id' like 'REVIEWCATALOG-%'),1005,'catalog retains every fixture beyond first 100 and 1000 rows');
select is((select (q->>'chapter_number')::integer from jsonb_array_elements(public.get_content_review_catalog()) q where q->>'external_id'='REVIEWCATALOG-1'),1,'chapter number is projected');
select is((select (q->>'module_number')::integer from jsonb_array_elements(public.get_content_review_catalog()) q where q->>'external_id'='REVIEWCATALOG-1005'),7,'module number is projected');
select ok((select q->>'exam_id' is not null and q->>'exam_title' is not null and q->>'chapter_title' is not null from jsonb_array_elements(public.get_content_review_catalog()) q where q->>'external_id'='REVIEWCATALOG-1'),'catalog includes human-readable curriculum labels');
select is((select q->>'review_status' from jsonb_array_elements(public.get_content_review_catalog()) q where q->>'external_id'='REVIEWCATALOG-1'),'draft','draft review status is preserved');
select is((select count(*)::integer from jsonb_array_elements(public.get_content_review_catalog()) q where q ?| array['answer','correct_choice_id','choices','explanation','student_id']),0,'catalog exposes no answer keys, choices, or student records');
select set_config('request.jwt.claim.sub','ac580000-0000-4000-8000-000000000003',true);
select lives_ok($$select public.get_content_review_catalog()$$,'administrator can browse catalog');
select has_function('public','get_content_review_queue',array[]::text[],'previous reviewer queue API remains intact');
select * from finish();
rollback;

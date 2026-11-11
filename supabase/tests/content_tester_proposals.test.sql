begin;
create extension if not exists pgtap with schema extensions;
select plan(43);

select is(has_function_privilege('anon','public.get_tester_question(uuid)','execute'),false,'anonymous cannot open tester detail');
select is(has_function_privilege('anon','public.admin_learning_access(uuid,boolean,text[],jsonb)','execute'),false,'anonymous cannot use unified access');
select is(has_table_privilege('authenticated','private.content_change_proposals','select'),false,'proposals have no direct client read grant');
select is(has_table_privilege('authenticated','private.content_tester_access','insert'),false,'grants are not client writable');

insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data,aud,role) values
('ad600000-0000-4000-8000-000000000001','tester-admin@example.test','{}','{}','authenticated','authenticated'),
('ad600000-0000-4000-8000-000000000002','tester-question@example.test','{}','{}','authenticated','authenticated'),
('ad600000-0000-4000-8000-000000000003','tester-image@example.test','{}','{}','authenticated','authenticated'),
('ad600000-0000-4000-8000-000000000004','tester-student@example.test','{}','{}','authenticated','authenticated');
insert into public.user_roles(user_id,role) values
('ad600000-0000-4000-8000-000000000001','admin'),('ad600000-0000-4000-8000-000000000004','student');
insert into public.topics(id,exam_id,code,title)
select ('ad600000-0000-4000-8000-00000000001'||n)::uuid,exam_id,'TESTER-FIXTURE-'||n,'Synthetic tester chapter '||n
from public.topics cross join generate_series(1,2) n where id='40000000-0000-4000-8000-000000000001';
insert into public.questions(id,exam_id,topic_id,question_text,difficulty,cognitive_level,created_by)
select ('ad600000-0000-4000-8000-00000000002'||n)::uuid,exam_id,id,'Original tester prompt '||n,'easy','recall','ad600000-0000-4000-8000-000000000001'
from generate_series(1,2) n join public.topics on id=('ad600000-0000-4000-8000-00000000001'||n)::uuid;
insert into public.question_choices(id,question_id,choice_key,choice_text,sort_order)
values('ad600000-0000-4000-8000-000000000031','ad600000-0000-4000-8000-000000000021','A','Original A',0);
insert into private.question_answer_keys(question_id,correct_choice_id,explanation,created_by)
values('ad600000-0000-4000-8000-000000000021','ad600000-0000-4000-8000-000000000031','Original explanation','ad600000-0000-4000-8000-000000000001');
insert into storage.objects(bucket_id,name,metadata)
values('learning-visuals','assets/cap-visuals/tester-fixture.png','{"mimetype":"image/png","size":100}');
insert into private.visual_assets(asset_key,storage_path,mime_type,width,height,alt_text,status,created_by,approved_by,approved_at)
values('tester_fixture','assets/cap-visuals/tester-fixture.png','image/png',100,100,'Original image','approved',
'ad600000-0000-4000-8000-000000000001','ad600000-0000-4000-8000-000000000001',now());
insert into private.question_learning_support(question_id,short_explanation,visual_asset_key,visual_brief,visual_caption,visual_alt_text)
values('ad600000-0000-4000-8000-000000000021','Synthetic explanation','tester_fixture','Synthetic brief','Synthetic caption','Synthetic description');
select set_config('tester_fixture.exam',(select exam_id::text from public.topics where id='ad600000-0000-4000-8000-000000000011'),true);
select set_config('tester_fixture.question_at',(select updated_at::text from public.questions where id='ad600000-0000-4000-8000-000000000021'),true);
select set_config('tester_fixture.visual_at',(select updated_at::text from private.visual_assets where asset_key='tester_fixture'),true);
select set_config('tester_fixture.payload','{"question_text":"Proposed tester prompt","explanation":"Corrected explanation","source_reference":"Synthetic source","difficulty":"easy","cognitive_level":"recall","correct_letter":"B","choices":[{"key":"A","text":"Choice A"},{"key":"B","text":"Choice B"},{"key":"C","text":"Choice C"},{"key":"D","text":"Choice D"}]}',true);

set local role authenticated;
select set_config('request.jwt.claim.sub','ad600000-0000-4000-8000-000000000004',true);
select throws_ok($$select public.get_tester_question('ad600000-0000-4000-8000-000000000021')$$,'42501','Not authorized','student cannot open answer-bearing detail');
select throws_ok($$select public.admin_content_tester_access('ad600000-0000-4000-8000-000000000004','[]')$$,'42501','Administrator role required','student cannot grant access');
select throws_ok($$select public.admin_learning_access('ad600000-0000-4000-8000-000000000004')$$,'42501','Administrator role required','student cannot read unified catalog');

select set_config('request.jwt.claim.sub','ad600000-0000-4000-8000-000000000001',true);
select is((select section->>'question_count' from jsonb_array_elements(public.admin_learning_access('ad600000-0000-4000-8000-000000000002')->'sections') section
where section->>'chapter_id'='ad600000-0000-4000-8000-000000000011'),'1','chapter catalog counts questions');
select is((select section->>'image_count' from jsonb_array_elements(public.admin_learning_access('ad600000-0000-4000-8000-000000000002')->'sections') section
where section->>'chapter_id'='ad600000-0000-4000-8000-000000000011'),'1','chapter catalog counts registered images');
select throws_ok($$select public.admin_learning_access('ad600000-0000-4000-8000-000000000002',true,'{}','[{"kind":"invalid"}]')$$,
'P0001','Invalid review type','combined save fails when review grant is invalid');
select ok(not exists(select 1 from jsonb_array_elements(public.admin_get_user_access_overview()->'users') u
where u->>'user_id'='ad600000-0000-4000-8000-000000000002' and (u->'roles') ? 'student'),'failed combined save rolls back student grant');
select lives_ok($$select public.admin_learning_access('ad600000-0000-4000-8000-000000000002',true,'{}',
jsonb_build_array(jsonb_build_object('kind','question','exam_id',current_setting('tester_fixture.exam'),'chapter_id','ad600000-0000-4000-8000-000000000011')))$$,'admin saves student role and one question chapter together');
select ok(exists(select 1 from jsonb_array_elements(public.admin_get_user_access_overview()->'users') u
where u->>'user_id'='ad600000-0000-4000-8000-000000000002' and (u->'roles') ? 'student'),'combined save grants Student as requested');
select lives_ok($$select public.admin_content_tester_access('ad600000-0000-4000-8000-000000000003','[{"kind":"image"}]')$$,'admin grants all images separately');

select set_config('request.jwt.claim.sub','ad600000-0000-4000-8000-000000000002',true);
select is(jsonb_array_length(public.get_tester_question_catalog()),1,'only assigned chapter is listed');
select is(public.get_tester_question('ad600000-0000-4000-8000-000000000021')#>>'{answer,explanation}','Original explanation','assigned tester can read explanation');
select throws_ok($$select public.get_tester_question('ad600000-0000-4000-8000-000000000022')$$,'42501','Not authorized','tester cannot fetch sibling chapter by guessed ID');
select throws_ok($$select public.get_content_review_catalog()$$,'42501','Not authorized','tester cannot reach unrestricted review catalog');
select throws_ok($$select public.reviewer_save_question_with_classification('ad600000-0000-4000-8000-000000000021','{}','reason')$$,'42501','Not authorized','tester cannot edit live questions');
select throws_ok($$select public.reviewer_submit_question_review('ad600000-0000-4000-8000-000000000021',5::smallint,5::smallint,5::smallint,'tester','approve')$$,'42501','Not authorized','tester cannot use legacy publication RPC');
select is(jsonb_array_length(public.get_tester_visuals()),0,'question-only grant does not include images');
select is(private.tester_storage_access('assets/cap-visuals/tester-fixture.png',false),false,'question tester cannot read image through tester storage policy');
select set_config('tester_fixture.question_proposal',(public.submit_content_proposal('question','ad600000-0000-4000-8000-000000000021',current_setting('tester_fixture.payload')::jsonb,'Correct the test wording',current_setting('tester_fixture.question_at')::timestamptz)->>'id'),true);
select is(public.get_tester_question('ad600000-0000-4000-8000-000000000021')#>>'{question,question_text}','Original tester prompt 1','pending proposal leaves live prompt unchanged');
select is(jsonb_array_length(public.get_content_proposals()),1,'tester sees own proposal');
select throws_ok($$select public.admin_decide_content_proposal(current_setting('tester_fixture.question_proposal')::uuid,'approved')$$,'42501','Administrator role required','tester cannot self-approve');
select set_config('tester_fixture.stale_proposal',(public.submit_content_proposal('question','ad600000-0000-4000-8000-000000000021',current_setting('tester_fixture.payload')::jsonb,'Another suggested correction',current_setting('tester_fixture.question_at')::timestamptz)->>'id'),true);

select set_config('request.jwt.claim.sub','ad600000-0000-4000-8000-000000000003',true);
select is(jsonb_array_length(public.get_tester_question_catalog()),0,'image-only tester cannot list questions');
select throws_ok($$select public.get_tester_question('ad600000-0000-4000-8000-000000000021')$$,'42501','Not authorized','image tester cannot access answer keys');
select is(jsonb_array_length(public.get_content_proposals()),0,'other tester cannot read proposal');
select ok(private.tester_storage_access('assets/cap-visuals/tester-fixture.png',false),'assigned image tester can preview original');
select is(private.tester_storage_access('assets/cap-visuals/tester-fixture.png',true),false,'tester cannot upload over live path');
select throws_ok($$select public.admin_replace_learning_visual('tester_fixture','assets/cap-visuals/tester-fixture.png','assets/cap-visuals/tester-fixture.png',100,100,'New text','Correct the labels')$$,'42501','Administrator role required','tester cannot activate replacement directly');
select set_config('tester_fixture.image_proposal',public.submit_content_proposal('image','tester_fixture','{"width":200,"height":150,"alt_text":"Proposed image"}','Correct diagram labels',current_setting('tester_fixture.visual_at')::timestamptz)::text,true);
select ok(private.tester_storage_access(current_setting('tester_fixture.image_proposal')::jsonb->>'upload_path',true),'only reserved proposal path is writable');
insert into storage.objects(bucket_id,name,metadata) values
('learning-visuals',current_setting('tester_fixture.image_proposal')::jsonb->>'upload_path','{"mimetype":"image/png","size":100}');
select lives_ok($$select public.finish_content_image_proposal((current_setting('tester_fixture.image_proposal')::jsonb->>'id')::uuid)$$,'tester finalizes staged upload');
select is(private.tester_storage_access(current_setting('tester_fixture.image_proposal')::jsonb->>'upload_path',true),false,'submitted replacement is immutable');
reset role;
select is((select storage_path from private.visual_assets where asset_key='tester_fixture'),'assets/cap-visuals/tester-fixture.png','pending image leaves live path unchanged');
set local role authenticated;
select set_config('request.jwt.claim.sub','ad600000-0000-4000-8000-000000000004',true);
select is(private.tester_storage_access(current_setting('tester_fixture.image_proposal')::jsonb->>'upload_path',false),false,'student cannot read staged replacement');

select set_config('request.jwt.claim.sub','ad600000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.admin_decide_content_proposal(current_setting('tester_fixture.question_proposal')::uuid,'approved')$$,'admin applies question proposal');
select throws_ok($$select public.admin_decide_content_proposal(current_setting('tester_fixture.stale_proposal')::uuid,'approved')$$,'40001','Content changed since proposal; request a new proposal','stale proposal cannot overwrite new question');
select lives_ok($$select public.admin_decide_content_proposal((current_setting('tester_fixture.image_proposal')::jsonb->>'id')::uuid,'approved')$$,'admin activates image proposal');
select is((select entry->>'storage_path' from jsonb_array_elements(public.admin_get_learning_visuals()) entry where entry->>'asset_key'='tester_fixture'),
current_setting('tester_fixture.image_proposal')::jsonb->>'upload_path','registry switches to approved image');
select is(public.get_content_review_question('ad600000-0000-4000-8000-000000000021')#>>'{question,question_text}','Proposed tester prompt','approved proposal updates question');
select lives_ok($$select public.admin_content_tester_access('ad600000-0000-4000-8000-000000000002','[]')$$,'admin revokes review access');
select set_config('request.jwt.claim.sub','ad600000-0000-4000-8000-000000000002',true);
select throws_ok($$select public.get_tester_question('ad600000-0000-4000-8000-000000000021')$$,'42501','Not authorized','revoked tester loses answer-key access');
select * from finish();
rollback;

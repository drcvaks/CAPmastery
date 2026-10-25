begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

select has_function('public','admin_get_learning_visuals',array[]::text[],'administrator image catalog exists');
select has_function('public','admin_replace_learning_visual',array['text','text','text','integer','integer','text','text'],'audited replacement exists');
select ok(has_function_privilege('authenticated','public.admin_get_learning_visuals()','execute'),'authenticated can reach protected catalog');
select ok(has_function_privilege('authenticated','public.admin_replace_learning_visual(text,text,text,integer,integer,text,text)','execute'),'authenticated can reach protected replacement');
select is(has_function_privilege('anon','public.admin_get_learning_visuals()','execute'),false,'anonymous catalog denied');
select is(has_function_privilege('anon','public.admin_replace_learning_visual(text,text,text,integer,integer,text,text)','execute'),false,'anonymous replacement denied');

insert into auth.users (id,email,raw_user_meta_data,raw_app_meta_data,aud,role) values
('ad570000-0000-4000-8000-000000000001','visual-admin@example.test','{}','{}','authenticated','authenticated'),
('ad570000-0000-4000-8000-000000000002','visual-student@example.test','{}','{}','authenticated','authenticated'),
('ad570000-0000-4000-8000-000000000003','visual-reviewer@example.test','{}','{}','authenticated','authenticated');
insert into public.user_roles(user_id,role,created_by) values
('ad570000-0000-4000-8000-000000000001','admin','ad570000-0000-4000-8000-000000000001'),
('ad570000-0000-4000-8000-000000000002','student','ad570000-0000-4000-8000-000000000001'),
('ad570000-0000-4000-8000-000000000003','content_reviewer','ad570000-0000-4000-8000-000000000001');
insert into storage.objects(bucket_id,name,metadata) values
('learning-visuals','assets/cap-visuals/test-original.png','{"mimetype":"image/png","size":100}'),
('learning-visuals','assets/cap-visuals/revision-ad570000-0000-4000-8000-000000000001.png','{"mimetype":"image/png","size":100}'),
('learning-visuals','assets/cap-visuals/revision-ad570000-0000-4000-8000-000000000002.png','{"mimetype":"image/jpeg","size":100}');
insert into private.visual_assets(asset_key,storage_path,mime_type,width,height,alt_text,status,created_by,approved_by,approved_at)
values ('admin_library_fixture','assets/cap-visuals/test-original.png','image/png',100,100,'Original test guide','approved','ad570000-0000-4000-8000-000000000001','ad570000-0000-4000-8000-000000000001',now());
insert into public.questions(id,exam_id,topic_id,question_text,difficulty,cognitive_level,created_by)
select 'ad570000-0000-4000-8000-000000000004',t.exam_id,t.id,'Synthetic image library question','easy','recall','ad570000-0000-4000-8000-000000000001'
from public.topics t where t.id='40000000-0000-4000-8000-000000000001';
insert into private.question_learning_support(question_id,short_explanation,visual_asset_key,visual_brief,visual_caption,visual_alt_text)
values ('ad570000-0000-4000-8000-000000000004','Synthetic explanation','admin_library_fixture','Synthetic visual brief','Synthetic caption','Synthetic description');

set local role authenticated;
select set_config('request.jwt.claim.sub','ad570000-0000-4000-8000-000000000002',true);
select throws_ok($$select public.admin_get_learning_visuals()$$,'42501','Administrator role required','student cannot list visual library');
select throws_ok($$select public.admin_replace_learning_visual('admin_library_fixture','assets/cap-visuals/test-original.png','assets/cap-visuals/revision-ad570000-0000-4000-8000-000000000001.png',100,100,'Corrected test guide','Corrected test labels')$$,'42501','Administrator role required','student cannot replace image');
select is(private.can_read_learning_visual('assets/cap-visuals/test-original.png'),false,'catalog change does not grant early student image access');
select set_config('request.jwt.claim.sub','ad570000-0000-4000-8000-000000000003',true);
select throws_ok($$select public.admin_get_learning_visuals()$$,'42501','Administrator role required','content reviewer cannot access admin image library');
select set_config('request.jwt.claim.sub','ad570000-0000-4000-8000-000000000001',true);
select is((select (entry->>'width')::integer from jsonb_array_elements(public.admin_get_learning_visuals()) entry where entry->>'asset_key'='admin_library_fixture'),100,'admin catalog includes image metadata');
select is((select jsonb_array_length(entry->'locations') from jsonb_array_elements(public.admin_get_learning_visuals()) entry where entry->>'asset_key'='admin_library_fixture'),1,'catalog includes question-derived curriculum location');
select throws_ok($$select public.admin_replace_learning_visual('admin_library_fixture','assets/cap-visuals/test-original.png','assets/cap-visuals/revision-ad570000-0000-4000-8000-000000000003.png',100,100,'Corrected guide','Corrected test labels')$$,'P0002','Uploaded PNG object not found or exceeds five megabytes','missing upload cannot activate');
select throws_ok($$select public.admin_replace_learning_visual('admin_library_fixture','assets/cap-visuals/test-original.png','assets/cap-visuals/revision-ad570000-0000-4000-8000-000000000002.png',100,100,'Corrected guide','Corrected test labels')$$,'P0002','Uploaded PNG object not found or exceeds five megabytes','non-PNG cannot activate');
select throws_ok($$select public.admin_replace_learning_visual('admin_library_fixture','assets/cap-visuals/test-original.png','assets/cap-visuals/revision-ad570000-0000-4000-8000-000000000001.png',100,100,'Corrected guide','short')$$,'22023','Replacement metadata is invalid','replacement reason required');
select lives_ok($$select public.admin_replace_learning_visual('admin_library_fixture','assets/cap-visuals/test-original.png','assets/cap-visuals/revision-ad570000-0000-4000-8000-000000000001.png',200,150,'Corrected test guide','Corrected test labels')$$,'administrator activates uploaded replacement');
select throws_ok($$select public.admin_replace_learning_visual('admin_library_fixture','assets/cap-visuals/test-original.png','assets/cap-visuals/revision-ad570000-0000-4000-8000-000000000001.png',100,100,'Another guide','Corrected test labels')$$,'40001','This image changed. Refresh the library before replacing it.','stale editor cannot overwrite newer replacement');
reset role;
select is((select storage_path from private.visual_assets where asset_key='admin_library_fixture'),'assets/cap-visuals/revision-ad570000-0000-4000-8000-000000000001.png','registry points to new version');
select is((select status::text from private.visual_assets where asset_key='admin_library_fixture'),'approved','approval status preserved');
select is((select count(*)::integer from storage.objects where bucket_id='learning-visuals' and name='assets/cap-visuals/test-original.png'),1,'previous file retained');
select is((select visual_asset_key from private.question_learning_support where question_id='ad570000-0000-4000-8000-000000000004'),'admin_library_fixture','question mapping preserved');
select is((select count(*)::integer from public.audit_log where actor_id='ad570000-0000-4000-8000-000000000001' and action='learning_visual.replaced'),1,'one audited replacement recorded');
select is((select before_summary->>'storage_path' from public.audit_log where actor_id='ad570000-0000-4000-8000-000000000001' and action='learning_visual.replaced'),'assets/cap-visuals/test-original.png','audit preserves previous path for recovery');
select * from finish();
rollback;

begin;

create extension if not exists pgtap with schema extensions;

select plan(44);

select has_table('public', 'questions', 'questions exists');
select has_table('public', 'question_choices', 'question choices exist');
select has_table('public', 'question_versions', 'question versions exist');
select has_table('public', 'question_quality_reviews', 'question reviews exist');
select has_table('public', 'question_reports', 'question reports exist');
select has_table('private', 'question_answer_keys', 'private answer keys exist');
select has_table('private', 'source_passages', 'private source passages exist');
select has_table('public', 'concepts', 'concepts exist');
select has_table('public', 'learning_objective_relationships', 'objective relationships exist');
select has_table('public', 'concept_relationships', 'concept relationships exist');
select has_table('public', 'question_families', 'question families exist');
select has_table('private', 'tutor_notes', 'private tutor notes exist');

select is(
  (
    select count(*)::integer
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'programs', 'exams', 'courses', 'volumes', 'chapters', 'sections',
        'topics', 'learning_objectives', 'source_documents', 'questions',
        'question_choices', 'question_versions', 'question_quality_reviews',
        'question_reports', 'learning_objective_relationships', 'concepts',
        'concept_objectives', 'concept_relationships', 'question_families',
        'question_concepts', 'question_reinforcements'
      )
      and c.relrowsecurity
  ),
  21,
  'RLS is enabled on every Checkpoint 3 API table'
);

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
values
  ('55555555-5555-4555-8555-555555555555', 'content-reviewer@example.test', '{"display_name":"Content Reviewer"}', '{}', 'authenticated', 'authenticated'),
  ('66666666-6666-4666-8666-666666666666', 'content-student@example.test', '{"display_name":"Content Student"}', '{}', 'authenticated', 'authenticated');

select is(
  (
    select count(*)::integer from public.profiles
    where id in (
      '55555555-5555-4555-8555-555555555555',
      '66666666-6666-4666-8666-666666666666'
    )
  ),
  2,
  'Auth trigger creates content-test profiles'
);

insert into public.user_roles (user_id, role, created_by)
values
  ('55555555-5555-4555-8555-555555555555', 'content_reviewer', '55555555-5555-4555-8555-555555555555'),
  ('66666666-6666-4666-8666-666666666666', 'student', '55555555-5555-4555-8555-555555555555');

insert into public.learning_objectives (
  id, topic_id, code, title, status
) values (
  '77777777-7777-4777-8777-777777777701',
  '40000000-0000-4000-8000-000000000001',
  'SYNTHETIC_TEST_OBJECTIVE',
  'Synthetic transaction-only test objective',
  'active'
);

insert into public.source_documents (
  id, title, document_type, external_reference, authorization_status, status, created_by
) values (
  '77777777-7777-4777-8777-777777777702',
  'Synthetic transaction-only test source',
  'test_fixture',
  'internal:test-fixture',
  'approved',
  'active',
  '55555555-5555-4555-8555-555555555555'
);

insert into public.question_families (id, exam_id, code, title, status)
values (
  '77777777-7777-4777-8777-777777777703',
  '20000000-0000-4000-8000-000000000001',
  'SYNTHETIC_TEST_FAMILY',
  'Synthetic transaction-only family',
  'active'
);

insert into public.concepts (id, topic_id, code, title, status)
values (
  '77777777-7777-4777-8777-777777777704',
  '40000000-0000-4000-8000-000000000001',
  'SYNTHETIC_TEST_CONCEPT',
  'Synthetic transaction-only concept',
  'active'
);

insert into public.questions (
  id, exam_id, topic_id, learning_objective_id, source_document_id,
  source_reference, source_page_start, question_text, question_type, difficulty,
  cognitive_level, purpose, question_family_id, estimated_time_seconds, created_by
) values
  (
    '88888888-8888-4888-8888-888888888801',
    '20000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '77777777-7777-4777-8777-777777777701',
    '77777777-7777-4777-8777-777777777702',
    'Synthetic test reference', 1,
    'Which synthetic option is designated for this transaction-only test?',
    'multiple_choice',
    'easy',
    'recall',
    'recall',
    '77777777-7777-4777-8777-777777777703', 30,
    '55555555-5555-4555-8555-555555555555'
  ),
  (
    '88888888-8888-4888-8888-888888888802',
    '20000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '77777777-7777-4777-8777-777777777701',
    '77777777-7777-4777-8777-777777777702',
    'Synthetic draft reference', 1,
    'This synthetic draft must remain hidden.',
    'true_false',
    'easy',
    'recall',
    'retention_check',
    '77777777-7777-4777-8777-777777777703', 30,
    '55555555-5555-4555-8555-555555555555'
  );

insert into public.question_choices (id, question_id, choice_key, choice_text, sort_order)
values
  ('99999999-9999-4999-8999-999999999901', '88888888-8888-4888-8888-888888888801', 'A', 'Synthetic option A', 0),
  ('99999999-9999-4999-8999-999999999902', '88888888-8888-4888-8888-888888888801', 'B', 'Synthetic option B', 1),
  ('99999999-9999-4999-8999-999999999903', '88888888-8888-4888-8888-888888888801', 'C', 'Synthetic option C', 2),
  ('99999999-9999-4999-8999-999999999904', '88888888-8888-4888-8888-888888888802', 'A', 'True', 0),
  ('99999999-9999-4999-8999-999999999905', '88888888-8888-4888-8888-888888888802', 'B', 'False', 1);

insert into public.question_concepts (question_id, concept_id, is_primary)
values
  ('88888888-8888-4888-8888-888888888801', '77777777-7777-4777-8777-777777777704', true),
  ('88888888-8888-4888-8888-888888888802', '77777777-7777-4777-8777-777777777704', true);

set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);

insert into public.question_quality_reviews (
  question_id, reviewer_id, accuracy_rating, clarity_rating,
  source_alignment_rating, decision
) values (
  '88888888-8888-4888-8888-888888888801',
  '55555555-5555-4555-8555-555555555555',
  5, 5, 5, 'approve'
);

select lives_ok(
  $$select public.reviewer_set_question_answer(
    '88888888-8888-4888-8888-888888888801',
    '99999999-9999-4999-8999-999999999902',
    'Synthetic explanation available only after a later grading checkpoint.',
    'Synthetic remediation',
    'Synthetic common mistake'
  )$$,
  'Reviewer can store an answer through the protected function'
);

select lives_ok(
  $$select public.reviewer_set_choice_feedback(
    '99999999-9999-4999-8999-999999999901',
    'Synthetic feedback for incorrect option A'
  )$$,
  'Reviewer can store first distractor feedback through the protected function'
);

select lives_ok(
  $$select public.reviewer_set_choice_feedback(
    '99999999-9999-4999-8999-999999999903',
    'Synthetic feedback for incorrect option C'
  )$$,
  'Reviewer can store second distractor feedback through the protected function'
);

select lives_ok(
  $$select public.reviewer_approve_question('88888888-8888-4888-8888-888888888801')$$,
  'Reviewer can approve a fully reviewed question'
);

select set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666666', true);

select is(
  (
    select count(*)::integer
    from public.questions
    where id in (
      '88888888-8888-4888-8888-888888888801',
      '88888888-8888-4888-8888-888888888802'
    )
  ),
  1,
  'Student sees only the approved active fixture question'
);
select is(
  (select count(*)::integer from public.questions where id = '88888888-8888-4888-8888-888888888802'),
  0,
  'Draft question is hidden from student'
);
select is(
  (
    select count(*)::integer
    from public.question_choices
    where question_id in (
      '88888888-8888-4888-8888-888888888801',
      '88888888-8888-4888-8888-888888888802'
    )
  ),
  3,
  'Student sees choices only for the approved fixture question'
);
select is(
  (
    select count(*)::integer
    from public.get_approved_questions('20000000-0000-4000-8000-000000000001')
    where id = '88888888-8888-4888-8888-888888888801'
  ),
  1,
  'Safe retrieval function returns the approved fixture question'
);
select ok(
  (
    select choices::text !~* '(correct|explanation|feedback|remediation|mistake)'
    from public.get_approved_questions('20000000-0000-4000-8000-000000000001')
    limit 1
  ),
  'Safe retrieval choices contain no answer or feedback fields'
);
select is(
  has_table_privilege('authenticated', 'private.question_answer_keys', 'select'),
  false,
  'Authenticated clients cannot select private answer keys'
);
select is(
  has_table_privilege('authenticated', 'private.source_passages', 'select'),
  false,
  'Authenticated clients cannot select private source passages'
);
select is(
  has_table_privilege('authenticated', 'private.question_choice_feedback', 'select'),
  false,
  'Authenticated clients cannot select private choice feedback'
);
select is(
  has_table_privilege('authenticated', 'private.tutor_notes', 'select'),
  false,
  'Authenticated clients cannot select private tutor notes'
);
select is((select count(*)::integer from public.source_documents), 0, 'Student cannot enumerate source documents');
select throws_ok(
  $$select public.reviewer_approve_question('88888888-8888-4888-8888-888888888802')$$,
  '42501',
  'Not authorized',
  'Student cannot approve a question'
);
select throws_ok(
  $$insert into public.question_reports (
    question_id, reporter_id, report_type, details
  ) values (
    '88888888-8888-4888-8888-888888888801',
    '66666666-6666-4666-8666-666666666666',
    'unclear_wording',
    'Synthetic transaction-only report'
  )$$,
  '42501',
  'permission denied for table question_reports',
  'Student cannot bypass the Study report RPC'
);
select is((select count(*)::integer from public.question_reports where reporter_id = '66666666-6666-4666-8666-666666666666'), 0, 'Rejected insert creates no report');

reset role;
insert into public.study_sessions(id,student_id,exam_id,requested_count,question_count)
select 'ad630000-0000-4000-8000-000000000001','66666666-6666-4666-8666-666666666666',exam_id,1,1
from public.questions where id='88888888-8888-4888-8888-888888888801';
insert into public.study_session_questions(id,session_id,question_id,position,question_version)
select 'ad630000-0000-4000-8000-000000000002','ad630000-0000-4000-8000-000000000001',id,1,version
from public.questions where id='88888888-8888-4888-8888-888888888801';
set local role authenticated;
select throws_ok($$select public.submit_study_issue('ad630000-0000-4000-8000-000000000002',array['image'],'')$$,
  '42501','Not authorized','unanswered Study encounter cannot be reported');
reset role;
insert into public.question_attempts(session_id,session_question_id,student_id,question_id,selected_choice_id,is_correct,response_time_ms)
values('ad630000-0000-4000-8000-000000000001','ad630000-0000-4000-8000-000000000002',
 '66666666-6666-4666-8666-666666666666','88888888-8888-4888-8888-888888888801','99999999-9999-4999-8999-999999999901',true,1000);
set local role authenticated;
select throws_ok($$select public.submit_study_issue('ad630000-0000-4000-8000-000000000002',array['other'],'  ')$$,
  '22023','Invalid report categories or details','Other requires a note');
select lives_ok($$select public.submit_study_issue('ad630000-0000-4000-8000-000000000002',array['image','answer'],'Please check the diagram')$$,
  'student reports their answered Study question');
select lives_ok($$select public.submit_study_issue('ad630000-0000-4000-8000-000000000002',array['image'],'')$$,
  'retry is safe');
select is((select count(*)::integer from public.question_reports where session_question_id='ad630000-0000-4000-8000-000000000002'
  and categories=array['answer','image'] and question_version is not null),1,'one report records original categories and version');
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select is((select count(*)::integer from public.question_reports where session_question_id='ad630000-0000-4000-8000-000000000002'),0,'regular reviewer cannot read report directly');
select throws_ok($$select public.admin_study_issues('open')$$,'42501','Not authorized','regular reviewer cannot open inbox');
select throws_ok($$select public.admin_study_issue_snapshot('ad630000-0000-4000-8000-000000000002')$$,'42501','Not authorized','regular reviewer cannot open report snapshot');
select throws_ok($$select public.admin_set_study_issue_status('ad630000-0000-4000-8000-000000000002','resolved')$$,'42501','Not authorized','regular reviewer cannot close reports');

select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select is(
  (
    select count(*)::integer
    from public.questions
    where id in (
      '88888888-8888-4888-8888-888888888801',
      '88888888-8888-4888-8888-888888888802'
    )
  ),
  2,
  'Reviewer sees approved and draft fixture questions'
);

reset role;
insert into public.user_roles(user_id,role) values('55555555-5555-4555-8555-555555555555','admin');
set local role authenticated;
select is((select item->>'reporter_email' from jsonb_array_elements(public.admin_study_issues('open')) item
  where item->>'question_id'='88888888-8888-4888-8888-888888888801'),
  'content-student@example.test','admin inbox shows the reporter');
select ok(public.admin_study_issue_snapshot((select (item->>'id')::uuid from jsonb_array_elements(public.admin_study_issues('open')) item
  where item->>'question_id'='88888888-8888-4888-8888-888888888801')) is not null,'admin can open the version snapshot');
select lives_ok($$select public.admin_set_study_issue_status((select (item->>'id')::uuid from jsonb_array_elements(public.admin_study_issues('open')) item
  where item->>'question_id'='88888888-8888-4888-8888-888888888801'),'resolved')$$,'admin can resolve a report');
select * from finish();
rollback;

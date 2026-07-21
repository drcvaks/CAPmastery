begin;

create extension if not exists pgtap with schema extensions;

select plan(32);

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

select is((select count(*)::integer from public.questions), 1, 'Student sees only approved active questions');
select is(
  (select count(*)::integer from public.questions where id = '88888888-8888-4888-8888-888888888802'),
  0,
  'Draft question is hidden from student'
);
select is((select count(*)::integer from public.question_choices), 3, 'Student sees choices only for approved question');
select is(
  (
    select count(*)::integer
    from public.get_approved_questions('20000000-0000-4000-8000-000000000001')
  ),
  1,
  'Safe retrieval function returns approved question'
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
select lives_ok(
  $$insert into public.question_reports (
    question_id, reporter_id, report_type, details
  ) values (
    '88888888-8888-4888-8888-888888888801',
    '66666666-6666-4666-8666-666666666666',
    'unclear_wording',
    'Synthetic transaction-only report'
  )$$,
  'Student can report an approved question as self'
);
select is((select count(*)::integer from public.question_reports), 1, 'Student reads own report');

select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select is((select count(*)::integer from public.questions), 2, 'Reviewer sees approved and draft questions');

select * from finish();
rollback;

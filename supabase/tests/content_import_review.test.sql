begin;

create extension if not exists pgtap with schema extensions;
select plan(59);

select has_table('public', 'csv_import_jobs', 'CSV import jobs exist');
select has_column('public', 'questions', 'question_mode', 'question delivery mode is preserved');
select has_column('public', 'questions', 'question_style', 'question style is preserved');
select is(
  (
    select count(*)::integer
    from public.topics
    where code in ('LEADERSHIP_CATALOG_PENDING', 'AEROSPACE_CATALOG_PENDING')
      and status <> 'archived'
  ),
  0,
  'obsolete catalog placeholder topics are archived'
);
select has_column('public', 'questions', 'module_number', 'question module number is preserved');
select is(
  (
    select count(*)::integer
    from pg_constraint
    where conrelid = 'public.questions'::regclass
      and conname = 'questions_module_number_check'
  ),
  1,
  'question module number is constrained'
);
select ok(
  (
    select pg_get_constraintdef(oid)
    from pg_constraint
    where conrelid = 'public.questions'::regclass
      and conname = 'questions_style_reference_check'
  ) like '%Mitchell_Aerospace_sample_style_analysis%',
  'Aerospace sample-style provenance is constrained and preserved'
);
select is((select relrowsecurity from pg_class where oid = 'public.csv_import_jobs'::regclass), true, 'CSV import jobs have RLS');
select is(has_table_privilege('authenticated', 'public.csv_import_jobs', 'insert'), false, 'clients cannot forge import jobs');
select has_function('public', 'reviewer_check_import_duplicates', array['jsonb'], 'duplicate preview function exists');
select has_function('public', 'reviewer_import_question_csv', array['text', 'jsonb'], 'draft import function exists');
select has_function('public', 'get_content_review_queue', array[]::text[], 'review queue function exists');
select has_function('public', 'get_content_review_question', array['uuid'], 'review detail function exists');
select has_function('public', 'reviewer_save_question', array['uuid', 'jsonb', 'text'], 'review edit function exists');
select has_function(
  'public', 'reviewer_submit_question_review',
  array['uuid', 'smallint', 'smallint', 'smallint', 'text', 'review_decision'],
  'review decision function exists'
);
select is(has_function_privilege('authenticated', 'private.question_content_snapshot(uuid)', 'execute'), false, 'private snapshots are not client callable');

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
values
  ('81111111-1111-4111-8111-111111111111', 'checkpoint8-reviewer@example.test', '{"display_name":"Checkpoint 8 Reviewer"}', '{}', 'authenticated', 'authenticated'),
  ('82222222-2222-4222-8222-222222222222', 'checkpoint8-student@example.test', '{"display_name":"Checkpoint 8 Student"}', '{}', 'authenticated', 'authenticated');

insert into public.user_roles (user_id, role, created_by)
values
  ('81111111-1111-4111-8111-111111111111', 'content_reviewer', '81111111-1111-4111-8111-111111111111'),
  ('82222222-2222-4222-8222-222222222222', 'student', '81111111-1111-4111-8111-111111111111');

insert into public.source_documents (
  id, title, document_type, external_reference, authorization_status, status, created_by
) values (
  '83000000-0000-4000-8000-000000000001', 'Checkpoint 8 authorized fixture',
  'test_fixture', 'checkpoint8:source', 'approved', 'active',
  '81111111-1111-4111-8111-111111111111'
);
insert into public.learning_objectives (id, topic_id, code, title, source_document_id, status)
values (
  '84000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  'CHECKPOINT8_OBJECTIVE', 'Checkpoint 8 objective',
  '83000000-0000-4000-8000-000000000001', 'draft'
);
insert into public.concepts (
  id, topic_id, source_document_id, code, title, source_reference, status
) values (
  '85000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  '83000000-0000-4000-8000-000000000001',
  'CHECKPOINT8_CONCEPT', 'Checkpoint 8 concept', 'Fixture page 1', 'draft'
);
insert into public.concept_objectives (concept_id, learning_objective_id)
values ('85000000-0000-4000-8000-000000000001', '84000000-0000-4000-8000-000000000001');
insert into public.question_families (id, exam_id, code, source_code, title, status)
values (
  '86000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'CHECKPOINT8_FAMILY_CANONICAL', 'CHECKPOINT8_FAMILY', 'Checkpoint 8 family', 'draft'
);

insert into public.questions (
  id, exam_id, topic_id, learning_objective_id, source_document_id,
  source_reference, question_text, difficulty, cognitive_level,
  created_by, external_id, review_status, status
) values (
  '87000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  '84000000-0000-4000-8000-000000000001',
  '83000000-0000-4000-8000-000000000001',
  'Fixture page 1', 'What should a reviewer verify?', 'medium', 'understanding',
  '81111111-1111-4111-8111-111111111111', 'CHECKPOINT8-EXISTING', 'draft', 'draft'
);

create temporary table checkpoint8_payloads (name text primary key, payload jsonb not null);
create temporary table checkpoint8_jobs (name text primary key, id uuid not null);
grant select on checkpoint8_payloads to authenticated;
grant select, insert on checkpoint8_jobs to authenticated;

insert into checkpoint8_payloads values (
  'valid', jsonb_build_array(jsonb_build_object(
    'external_id', 'CHECKPOINT8-IMPORTED',
    'pilot_batch', 'CHECKPOINT8',
    'objective_code', 'CHECKPOINT8_OBJECTIVE',
    'concept_code', 'CHECKPOINT8_CONCEPT',
    'question_family_code', 'CHECKPOINT8_FAMILY',
    'difficulty', 'medium',
    'cognitive_level', 'understanding',
    'question_type', 'multiple_choice',
    'question_text', '  What   should a reviewer verify? ',
    'choice_a', 'Accuracy, clarity, and source alignment',
    'choice_b', 'Only punctuation',
    'choice_c', 'Student private progress',
    'choice_d', 'Nothing before publishing',
    'correct_letter', 'A',
    'explanation', 'Reviewers verify accuracy, clarity, and source alignment.',
    'choice_a_explanation', 'This is the complete review standard.',
    'choice_b_explanation', 'Punctuation alone is insufficient.',
    'choice_c_explanation', 'Reviewers do not receive student progress access.',
    'choice_d_explanation', 'Human review is required before publication.',
    'common_mistake', 'Treating import as approval.',
    'remediation_text', 'Review the source and every choice.',
    'source_reference_text', 'Checkpoint 8 authorized fixture, page 1',
    'source_pages', '1',
    'source_status', 'verified',
    'review_status', 'draft',
    'reinforcement_question_ids', '',
    'estimated_time_seconds', '30'
  ))
);
insert into checkpoint8_payloads
select 'invalid', jsonb_set(payload, '{0,review_status}', '"approved"')
from checkpoint8_payloads where name = 'valid';

set local role authenticated;
select set_config('request.jwt.claim.sub', '82222222-2222-4222-8222-222222222222', true);
select throws_ok(
  $$select * from public.reviewer_check_import_duplicates((select payload from checkpoint8_payloads where name = 'valid'))$$,
  '42501', 'Not authorized', 'student cannot run duplicate preview'
);
select throws_ok(
  $$select public.reviewer_import_question_csv('student.csv', (select payload from checkpoint8_payloads where name = 'valid'))$$,
  '42501', 'Not authorized', 'student cannot import questions'
);
select throws_ok(
  $$select * from public.get_content_review_queue()$$,
  '42501', 'Not authorized', 'student cannot open review queue'
);
select is((select count(*)::integer from public.csv_import_jobs), 0, 'student cannot enumerate import jobs');

select set_config('request.jwt.claim.sub', '81111111-1111-4111-8111-111111111111', true);
select is(
  (select count(*)::integer from public.reviewer_check_import_duplicates(
    (select payload from checkpoint8_payloads where name = 'valid')
  )), 1, 'preview warns about normalized duplicate wording'
);
insert into checkpoint8_jobs values (
  'invalid', public.reviewer_import_question_csv(
    'invalid.csv', (select payload from checkpoint8_payloads where name = 'invalid')
  )
);
select is((select status::text from public.csv_import_jobs where id = (select id from checkpoint8_jobs where name = 'invalid')), 'failed', 'invalid import job is retained as failed');
select is((select rows_rejected from public.csv_import_jobs where id = (select id from checkpoint8_jobs where name = 'invalid')), 1, 'invalid row is explicitly rejected');
select is((select jsonb_array_length(error_report) from public.csv_import_jobs where id = (select id from checkpoint8_jobs where name = 'invalid')), 1, 'invalid row has a safe error report');
select is((select count(*)::integer from public.questions where external_id = 'CHECKPOINT8-IMPORTED'), 0, 'invalid import writes no partial question');

insert into checkpoint8_jobs values (
  'valid', public.reviewer_import_question_csv(
    'valid.csv', (select payload from checkpoint8_payloads where name = 'valid')
  )
);
select is((select status::text from public.csv_import_jobs where id = (select id from checkpoint8_jobs where name = 'valid')), 'completed', 'valid import completes');
select is((select rows_accepted from public.csv_import_jobs where id = (select id from checkpoint8_jobs where name = 'valid')), 1, 'valid row is accepted');
select is((select jsonb_array_length(warning_report) from public.csv_import_jobs where id = (select id from checkpoint8_jobs where name = 'valid')), 1, 'duplicate warning is retained without merging');
select is((select review_status::text from public.questions where external_id = 'CHECKPOINT8-IMPORTED'), 'draft', 'imported question begins as draft');
select is((select status::text from public.questions where external_id = 'CHECKPOINT8-IMPORTED'), 'draft', 'imported question is not student active');
select is((select count(*)::integer from public.question_choices c join public.questions q on q.id = c.question_id where q.external_id = 'CHECKPOINT8-IMPORTED'), 4, 'all four choices import');
select is((select count(*)::integer from public.get_content_review_queue() where external_id = 'CHECKPOINT8-IMPORTED'), 1, 'imported draft appears in review queue');
select is(
  (select get_content_review_question->'answer'->>'explanation'
   from public.get_content_review_question((select id from public.questions where external_id = 'CHECKPOINT8-IMPORTED'))),
  'Reviewers verify accuracy, clarity, and source alignment.',
  'review detail includes protected answer content for reviewer'
);

select set_config('request.jwt.claim.sub', '82222222-2222-4222-8222-222222222222', true);
select is((select count(*)::integer from public.get_approved_questions('20000000-0000-4000-8000-000000000001') where id = (select id from public.questions where external_id = 'CHECKPOINT8-IMPORTED')), 0, 'student cannot receive imported draft');
select throws_ok(
  $$select public.reviewer_save_question((select id from public.questions where external_id = 'CHECKPOINT8-IMPORTED'), '{}'::jsonb, '')$$,
  '42501', 'Not authorized', 'student cannot edit content'
);

select set_config('request.jwt.claim.sub', '81111111-1111-4111-8111-111111111111', true);
select lives_ok(
  $$select public.reviewer_save_question(
    (select id from public.questions where external_id = 'CHECKPOINT8-IMPORTED'),
    jsonb_build_object(
      'question_text', 'What must a reviewer verify before approval?',
      'difficulty', 'medium', 'cognitive_level', 'understanding',
      'source_reference', 'Checkpoint 8 authorized fixture, page 1',
      'source_page_start', '1', 'source_page_end', '1', 'estimated_time_seconds', '30',
      'correct_letter', 'A', 'explanation', 'Review accuracy, clarity, and source alignment.',
      'common_mistake', 'Treating import as approval.', 'remediation', 'Review every field.',
      'choices', jsonb_build_array(
        jsonb_build_object('key', 'A', 'text', 'Accuracy, clarity, and source alignment', 'feedback', 'Complete review standard.'),
        jsonb_build_object('key', 'B', 'text', 'Only punctuation', 'feedback', 'Punctuation alone is insufficient.'),
        jsonb_build_object('key', 'C', 'text', 'Student private progress', 'feedback', 'Reviewers do not see private progress.'),
        jsonb_build_object('key', 'D', 'text', 'Nothing before publishing', 'feedback', 'Human review is required.')
      )
    ), ''
  )$$,
  'reviewer corrects imported draft'
);
select is((select question_text from public.questions where external_id = 'CHECKPOINT8-IMPORTED'), 'What must a reviewer verify before approval?', 'draft correction is saved');
select is((select version from public.questions where external_id = 'CHECKPOINT8-IMPORTED'), 1, 'draft correction does not create a false historical version');
select lives_ok(
  $$select public.reviewer_submit_question_review(
    (select id from public.questions where external_id = 'CHECKPOINT8-IMPORTED'),
    4::smallint, 5::smallint, 5::smallint, 'Clarify one phrase', 'request_changes'
  )$$,
  'reviewer requests changes'
);
select is((select review_status::text from public.questions where external_id = 'CHECKPOINT8-IMPORTED'), 'draft', 'requested changes remain draft');
select lives_ok(
  $$select public.reviewer_submit_question_review(
    (select id from public.questions where external_id = 'CHECKPOINT8-IMPORTED'),
    5::smallint, 5::smallint, 5::smallint, 'Source and wording verified', 'approve'
  )$$,
  'reviewer approves corrected draft'
);
select is((select review_status::text from public.questions where external_id = 'CHECKPOINT8-IMPORTED'), 'approved', 'approved review status is set');
select is((select status::text from public.questions where external_id = 'CHECKPOINT8-IMPORTED'), 'active', 'approved question becomes student active');
select is((select status::text from public.learning_objectives where id = '84000000-0000-4000-8000-000000000001'), 'active', 'approval activates the linked objective');
select is((select status::text from public.concepts where id = '85000000-0000-4000-8000-000000000001'), 'active', 'approval activates the primary concept');
select is((select status::text from public.question_families where id = '86000000-0000-4000-8000-000000000001'), 'active', 'approval activates the exam-scoped question family');
select is((select jsonb_array_length(snapshot->'choices') from public.question_versions where question_id = (select id from public.questions where external_id = 'CHECKPOINT8-IMPORTED') and version = 1), 4, 'approved version stores complete choice snapshot');

reset role;
insert into public.study_sessions (
  id, student_id, exam_id, mode, status, requested_count, question_count, answered_count, correct_count
) values (
  '88000000-0000-4000-8000-000000000001', '82222222-2222-4222-8222-222222222222',
  '20000000-0000-4000-8000-000000000001', 'study', 'active', 1, 1, 0, 0
);
insert into public.study_session_questions (
  id, session_id, question_id, position, selection_reason, question_version
) values (
  '89000000-0000-4000-8000-000000000001', '88000000-0000-4000-8000-000000000001',
  (select id from public.questions where external_id = 'CHECKPOINT8-IMPORTED'),
  1, 'weak_topic', 1
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '82222222-2222-4222-8222-222222222222', true);
select is((select count(*)::integer from public.get_approved_questions('20000000-0000-4000-8000-000000000001') where id = (select id from public.questions where external_id = 'CHECKPOINT8-IMPORTED')), 1, 'approved question reaches student-safe delivery');

select set_config('request.jwt.claim.sub', '81111111-1111-4111-8111-111111111111', true);
select lives_ok(
  $$select public.reviewer_save_question(
    (select id from public.questions where external_id = 'CHECKPOINT8-IMPORTED'),
    jsonb_build_object(
      'question_text', 'What must a reviewer verify before final approval?',
      'difficulty', 'hard', 'cognitive_level', 'application',
      'source_reference', 'Checkpoint 8 authorized fixture, page 1',
      'source_page_start', '1', 'source_page_end', '1', 'estimated_time_seconds', '40',
      'correct_letter', 'A', 'explanation', 'Verify accuracy, clarity, and source alignment.',
      'common_mistake', 'Treating revised wording as sufficient evidence.',
      'remediation', 'Review every field.',
      'choices', jsonb_build_array(
        jsonb_build_object('key', 'A', 'text', 'Accuracy, clarity, and source alignment', 'feedback', 'Complete review standard.'),
        jsonb_build_object('key', 'B', 'text', 'Only punctuation', 'feedback', 'Punctuation alone is insufficient.'),
        jsonb_build_object('key', 'C', 'text', 'Student private progress', 'feedback', 'Reviewers do not see private progress.'),
        jsonb_build_object('key', 'D', 'text', 'Nothing before publishing', 'feedback', 'Human review is required.')
      )
    ), 'Improve precision after pilot feedback'
  )$$,
  'approved edit creates a draft revision'
);
select is((select version from public.questions where external_id = 'CHECKPOINT8-IMPORTED'), 2, 'approved edit increments version');
select is((select review_status::text from public.questions where external_id = 'CHECKPOINT8-IMPORTED'), 'draft', 'approved edit returns revision to draft');
reset role;
select is((select question_version from public.study_session_questions where id = '89000000-0000-4000-8000-000000000001'), 1, 'historical session remains tied to version one');
select is((select snapshot->'question'->>'question_text' from public.question_versions where question_id = (select id from public.questions where external_id = 'CHECKPOINT8-IMPORTED') and version = 1), 'What must a reviewer verify before approval?', 'version one retains historical wording');
select is((select count(*)::integer from public.question_quality_reviews where question_id = (select id from public.questions where external_id = 'CHECKPOINT8-IMPORTED')), 0, 'editing approved content requires a fresh quality review');
set local role authenticated;
select set_config('request.jwt.claim.sub', '81111111-1111-4111-8111-111111111111', true);
select lives_ok(
  $$select public.reviewer_submit_question_review(
    (select id from public.questions where external_id = 'CHECKPOINT8-IMPORTED'),
    5::smallint, 5::smallint, 5::smallint, 'Revision verified', 'approve'
  )$$,
  'reviewer approves version two'
);
select is((select version from public.questions where external_id = 'CHECKPOINT8-IMPORTED' and review_status = 'approved'), 2, 'approved revision remains version two');
select is((select count(*)::integer from public.question_versions where question_id = (select id from public.questions where external_id = 'CHECKPOINT8-IMPORTED')), 2, 'both approved versions have snapshots');
reset role;
select is((select count(*)::integer from public.audit_log where action = 'question.csv_imported' and entity_id = (select id from checkpoint8_jobs where name = 'valid')), 1, 'successful import is audited');
select ok((select count(*) >= 2 from public.audit_log where action in ('question.edited', 'question.approved') and entity_id = (select id from public.questions where external_id = 'CHECKPOINT8-IMPORTED')), 'review edits and approvals are audited');

select * from finish();
rollback;

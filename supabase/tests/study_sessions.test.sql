begin;

create extension if not exists pgtap with schema extensions;
select plan(42);

select has_table('public', 'study_sessions', 'study sessions exist');
select has_table('public', 'study_session_questions', 'session questions exist');
select has_table('public', 'question_attempts', 'question attempts exist');
select is(
  (
    select count(*)::integer
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('study_sessions', 'study_session_questions', 'question_attempts')
      and c.relrowsecurity
  ),
  3,
  'RLS is enabled on every Checkpoint 4 table'
);
select is(has_table_privilege('authenticated', 'public.study_sessions', 'insert'), false, 'Clients cannot insert sessions');
select is(has_table_privilege('authenticated', 'public.study_session_questions', 'insert'), false, 'Clients cannot insert session questions');
select is(has_table_privilege('authenticated', 'public.question_attempts', 'insert'), false, 'Clients cannot insert attempts or correctness');

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
values
  ('a1111111-1111-4111-8111-111111111111', 'study-one@example.test', '{"display_name":"Study One"}', '{}', 'authenticated', 'authenticated'),
  ('a2222222-2222-4222-8222-222222222222', 'study-two@example.test', '{"display_name":"Study Two"}', '{}', 'authenticated', 'authenticated'),
  ('a3333333-3333-4333-8333-333333333333', 'study-reviewer@example.test', '{"display_name":"Study Reviewer"}', '{}', 'authenticated', 'authenticated');

select is(
  (select count(*)::integer from public.profiles where id in (
    'a1111111-1111-4111-8111-111111111111',
    'a2222222-2222-4222-8222-222222222222',
    'a3333333-3333-4333-8333-333333333333'
  )),
  3,
  'Auth trigger creates study fixture profiles'
);

insert into public.user_roles (user_id, role, created_by)
values
  ('a1111111-1111-4111-8111-111111111111', 'student', 'a3333333-3333-4333-8333-333333333333'),
  ('a2222222-2222-4222-8222-222222222222', 'student', 'a3333333-3333-4333-8333-333333333333'),
  ('a3333333-3333-4333-8333-333333333333', 'content_reviewer', 'a3333333-3333-4333-8333-333333333333');

insert into public.learning_objectives (id, topic_id, code, title, status)
values (
  'a4444444-4444-4444-8444-444444444441',
  '40000000-0000-4000-8000-000000000001',
  'STUDY_TEST_OBJECTIVE',
  'Synthetic study-session objective',
  'active'
);
insert into public.source_documents (
  id, title, document_type, external_reference, authorization_status, status, created_by
) values (
  'a4444444-4444-4444-8444-444444444442',
  'Synthetic study-session source',
  'test_fixture',
  'internal:study-test-fixture',
  'approved',
  'active',
  'a3333333-3333-4333-8333-333333333333'
);
insert into public.question_families (id, exam_id, code, title, status)
values (
  'a4444444-4444-4444-8444-444444444443',
  '20000000-0000-4000-8000-000000000001',
  'STUDY_TEST_FAMILY',
  'Synthetic study-session family',
  'active'
);
insert into public.concepts (id, topic_id, code, title, status)
values (
  'a4444444-4444-4444-8444-444444444444',
  '40000000-0000-4000-8000-000000000001',
  'STUDY_TEST_CONCEPT',
  'Synthetic study-session concept',
  'active'
);

create temporary table study_test_questions (
  position integer primary key,
  question_id uuid not null,
  correct_choice_id uuid not null,
  wrong_choice_id uuid not null
);
grant select on table study_test_questions to authenticated;

do $$
declare
  i integer;
  q_id uuid;
  correct_id uuid;
  wrong_id uuid;
  other_id uuid;
begin
  for i in 1..10 loop
    q_id := gen_random_uuid();
    correct_id := gen_random_uuid();
    wrong_id := gen_random_uuid();
    other_id := gen_random_uuid();

    insert into public.questions (
      id, exam_id, topic_id, learning_objective_id, source_document_id,
      source_page_start, source_reference, question_text, question_type,
      difficulty, cognitive_level, purpose, question_family_id,
      estimated_time_seconds, created_by
    ) values (
      q_id,
      '20000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      'a4444444-4444-4444-8444-444444444441',
      'a4444444-4444-4444-8444-444444444442',
      i,
      'Synthetic study test page ' || i,
      'Synthetic study-session question ' || i || '?',
      'multiple_choice', 'easy', 'recall', 'recall',
      'a4444444-4444-4444-8444-444444444443',
      30,
      'a3333333-3333-4333-8333-333333333333'
    );
    insert into public.question_choices (id, question_id, choice_key, choice_text, sort_order)
    values
      (correct_id, q_id, 'A', 'Synthetic correct choice ' || i, 0),
      (wrong_id, q_id, 'B', 'Synthetic wrong choice ' || i, 1),
      (other_id, q_id, 'C', 'Synthetic alternate choice ' || i, 2);
    insert into public.question_concepts (question_id, concept_id, is_primary)
    values (q_id, 'a4444444-4444-4444-8444-444444444444', true);
    insert into private.question_answer_keys (
      question_id, correct_choice_id, explanation, remediation, common_mistake, created_by
    ) values (
      q_id, correct_id, 'Synthetic explanation ' || i,
      'Synthetic remediation ' || i, 'Synthetic mistake ' || i,
      'a3333333-3333-4333-8333-333333333333'
    );
    insert into private.question_choice_feedback (choice_id, feedback_text)
    values
      (wrong_id, 'Synthetic wrong-choice feedback ' || i),
      (other_id, 'Synthetic alternate-choice feedback ' || i);
    insert into private.question_learning_support (
      question_id, short_explanation, feedback_display_version, memory_aid,
      visual_priority, visual_type, visual_display_mode, visual_asset_key,
      visual_brief, visual_caption, visual_alt_text
    ) values (
      q_id, 'Synthetic short explanation ' || i, 1, 'Synthetic memory aid ' || i,
      'medium', 'concept_diagram', 'optional_after_answer', 'missing_asset_' || i,
      'Synthetic internal brief ' || i, 'Synthetic caption ' || i, 'Synthetic alt text ' || i
    );
    insert into public.question_quality_reviews (
      question_id, reviewer_id, accuracy_rating, clarity_rating,
      source_alignment_rating, decision
    ) values (
      q_id, 'a3333333-3333-4333-8333-333333333333', 5, 5, 5, 'approve'
    );
    update public.questions set
      review_status = 'approved', status = 'active',
      approved_by = 'a3333333-3333-4333-8333-333333333333', approved_at = now()
    where id = q_id;
    insert into study_test_questions values (i, q_id, correct_id, wrong_id);
  end loop;
end;
$$;

create temporary table study_test_session (id uuid primary key);
grant select, insert on table study_test_session to authenticated;
create temporary table study_test_session_answers (
  session_question_id uuid primary key,
  session_position integer not null unique,
  correct_choice_id uuid not null,
  wrong_choice_id uuid not null
);
grant select, insert on table study_test_session_answers to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);

insert into study_test_session
select public.create_study_session(
  '20000000-0000-4000-8000-000000000001',
  10,
  '40000000-0000-4000-8000-000000000001'
);
insert into study_test_session_answers
select sq.id, sq.position, q.correct_choice_id, q.wrong_choice_id
from public.study_session_questions sq
join study_test_questions q on q.question_id = sq.question_id
where sq.session_id = (select id from study_test_session);
select is((select count(*)::integer from study_test_session), 1, 'Student creates a 10-question session');
select is(
  (select count(*)::integer from public.study_session_questions where session_id = (select id from study_test_session)),
  10,
  'Created session contains exactly 10 questions'
);
select is((select count(*)::integer from public.study_sessions), 1, 'Student reads own session');
select is(
  (select count(*)::integer from public.get_study_session_questions((select id from study_test_session))),
  10,
  'Owner receives ten safe session questions'
);
select has_function(
  'public',
  'get_study_session_question_context',
  array['uuid'],
  'Safe session curriculum context function exists'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.get_study_session_question_context(uuid)',
    'execute'
  ),
  'Authenticated students can request owned session curriculum context'
);
select is(
  (
    select count(*)::integer
    from public.get_study_session_question_context((select id from study_test_session))
    where topic_title is not null
  ),
  10,
  'Owner receives topic context for every session question'
);
select is(
  (
    select count(*)::integer
    from public.get_study_session_questions((select id from study_test_session))
    where correct_choice_id is not null or explanation is not null
  ),
  0,
  'Unanswered delivery exposes no answer or explanation'
);
select is(
  (
    select count(*)::integer
    from public.get_study_session_questions((select id from study_test_session))
    where short_explanation is not null or memory_aid is not null
  ),
  0,
  'Unanswered delivery exposes no learning support'
);

select set_config('request.jwt.claim.sub', 'a2222222-2222-4222-8222-222222222222', true);
select is((select count(*)::integer from public.study_sessions), 0, 'Other student cannot read session');
select is((select count(*)::integer from public.study_session_questions), 0, 'Other student cannot read session questions');
select is((select count(*)::integer from public.question_attempts), 0, 'Other student cannot read attempts');
select throws_ok(
  $$select * from public.get_study_session_questions((select id from study_test_session))$$,
  'P0002', 'Study session not found', 'Other student cannot call session delivery'
);
select throws_ok(
  $$select * from public.get_study_session_question_context((select id from study_test_session))$$,
  'P0002', 'Study session not found', 'Other student cannot read session curriculum context'
);
select throws_ok(
  $$select * from public.submit_answer(
    (select sq.id from public.study_session_questions sq where sq.session_id = (select id from study_test_session) limit 1),
    (select correct_choice_id from study_test_session_answers where session_position = 1), 1000
  )$$,
  'P0002', 'Session question not found', 'Other student cannot submit to hidden session question'
);

select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
select throws_ok(
  $$select * from public.submit_answer(
    (select id from public.study_session_questions where session_id = (select id from study_test_session) and position = 1),
    (select correct_choice_id from study_test_session_answers where session_position = 2), 1000
  )$$,
  '22023', 'Selected choice does not belong to the question', 'Choice substitution is rejected'
);
select throws_ok(
  $$select * from public.submit_answer(
    (select id from public.study_session_questions where session_id = (select id from study_test_session) and position = 1),
    (select correct_choice_id from study_test_session_answers where session_position = 1), 1000, 6::smallint
  )$$,
  '22023', 'Confidence must be between 1 and 5', 'Invalid confidence is rejected'
);
select is(
  (
    select is_correct
    from public.submit_answer(
      (select id from public.study_session_questions where session_id = (select id from study_test_session) and position = 1),
      (select correct_choice_id from study_test_session_answers where session_position = 1), 1000, 4::smallint
    )
  ),
  true,
  'Server grades a correct answer'
);
select ok(
  (select is_correct from public.question_attempts limit 1),
  'Persisted correctness is server-computed'
);
select lives_ok(
  $$select * from public.submit_answer(
    (select id from public.study_session_questions where session_id = (select id from study_test_session) and position = 1),
    (select correct_choice_id from study_test_session_answers where session_position = 1), 9999, 1::smallint
  )$$,
  'Retrying the same choice is idempotent'
);
select is((select count(*)::integer from public.question_attempts), 1, 'Idempotent retry creates no duplicate attempt');
select throws_ok(
  $$select * from public.submit_answer(
    (select id from public.study_session_questions where session_id = (select id from study_test_session) and position = 1),
    (select wrong_choice_id from study_test_session_answers where session_position = 1), 1000
  )$$,
  '23505', 'Answer already submitted with a different choice', 'Changed duplicate answer is rejected'
);
select is(
  (
    select is_correct
    from public.submit_answer(
      (select id from public.study_session_questions where session_id = (select id from study_test_session) and position = 2),
      (select wrong_choice_id from study_test_session_answers where session_position = 2), 1000
    )
  ),
  false,
  'Server grades an incorrect answer'
);

do $$
declare
  i integer;
begin
  for i in 3..10 loop
    perform * from public.submit_answer(
      (select id from public.study_session_questions where session_id = (select id from study_test_session) and position = i),
      (select correct_choice_id from study_test_session_answers where session_position = i),
      1000,
      null::smallint
    );
  end loop;
end;
$$;

select is((select status::text from public.study_sessions), 'completed', 'Tenth answer completes session');
select is((select answered_count from public.study_sessions), 10, 'Completed session records ten answers');
select is((select correct_count from public.study_sessions), 9, 'Completed session records server score');
select is((select count(*)::integer from public.question_attempts), 10, 'Ten attempts are recorded');
select is(
  (
    select count(*)::integer
    from public.get_study_session_questions((select id from study_test_session))
    where correct_choice_id is not null and explanation is not null
  ),
  10,
  'Post-submission delivery returns feedback for attempted questions'
);
select is(
  (
    select count(*)::integer
    from public.get_study_session_questions((select id from study_test_session))
    where short_explanation is not null and memory_aid is not null
  ),
  10,
  'Post-submission delivery returns reviewed short feedback and memory aids'
);
select is(
  (
    select count(*)::integer
    from public.get_study_session_questions((select id from study_test_session))
    where visual_asset_key is not null or visual_storage_path is not null
  ),
  0,
  'Missing or unapproved visual assets remain hidden after submission'
);

select set_config('request.jwt.claim.sub', 'a2222222-2222-4222-8222-222222222222', true);
select is((select count(*)::integer from public.question_attempts), 0, 'Other student still cannot view completed attempts');
select throws_ok(
  $$insert into public.question_attempts (
    session_id, session_question_id, student_id, question_id, selected_choice_id,
    is_correct, response_time_ms
  ) select s.id, sq.id, 'a2222222-2222-4222-8222-222222222222', sq.question_id,
    q.correct_choice_id, true, 1
    from study_test_session s
    join public.study_session_questions sq on sq.session_id = s.id
    join study_test_questions q on q.question_id = sq.question_id
    limit 1$$,
  '42501', 'permission denied for table question_attempts', 'Client cannot forge correctness directly'
);
select throws_ok(
  $$update public.study_sessions set correct_count = 10 where id = (select id from study_test_session)$$,
  '42501', 'permission denied for table study_sessions', 'Client cannot alter session score'
);

select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
select throws_ok(
  $$select public.create_study_session(
    '20000000-0000-4000-8000-000000000001',
    11,
    '40000000-0000-4000-8000-000000000001'
  )$$,
  '22023', 'Not enough available questions for a 11 question session', 'Sparse bank cannot create an oversized session'
);

select * from finish();
rollback;

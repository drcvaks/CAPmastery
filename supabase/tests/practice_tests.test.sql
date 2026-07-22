begin;

create extension if not exists pgtap with schema extensions;
select plan(56);

select has_table('public', 'practice_test_blueprints', 'practice-test blueprints exist');
select has_table('public', 'practice_test_blueprint_rules', 'practice-test blueprint rules exist');
select is(
  (select count(*)::integer from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname in ('practice_test_blueprints', 'practice_test_blueprint_rules')
     and c.relrowsecurity),
  2,
  'RLS is enabled on both blueprint tables'
);
select is(has_table_privilege('authenticated', 'public.practice_test_blueprints', 'insert'), false, 'students cannot insert blueprints');
select is(has_table_privilege('authenticated', 'public.practice_test_blueprint_rules', 'insert'), false, 'students cannot insert blueprint rules');
select has_function('public', 'create_practice_test', array['uuid', 'boolean'], 'practice creation function exists');
select has_function('public', 'get_practice_test_options', array[]::text[], 'practice options function exists');
select has_function('public', 'set_practice_test_paused', array['uuid', 'boolean'], 'practice pause function exists');
select has_function('public', 'complete_practice_test', array['uuid'], 'practice completion function exists');
select has_function('public', 'get_practice_test_results', array['uuid'], 'practice result function exists');
select is(
  private.practice_remaining_seconds(now() - interval '30 seconds', 90, 0, null, now()),
  60,
  'server timer calculates remaining seconds'
);
select is(
  private.readiness_score_with_practice(20, 66.67, 70, 65, 60, 0, 2, null),
  private.readiness_score(20, 66.67, 70, 65, 60, 0, 2),
  'readiness preserves Checkpoint 6 weights before a practice result exists'
);
select is(
  private.readiness_score_with_practice(20, 66.67, 70, 65, 60, 0, 2, 90),
  71.75::numeric,
  'completed practice score receives its distinct readiness component'
);

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
values
  ('e1111111-1111-4111-8111-111111111111', 'practice-one@example.test', '{"display_name":"Practice One"}', '{}', 'authenticated', 'authenticated'),
  ('e2222222-2222-4222-8222-222222222222', 'practice-two@example.test', '{"display_name":"Practice Two"}', '{}', 'authenticated', 'authenticated'),
  ('e3333333-3333-4333-8333-333333333333', 'practice-admin@example.test', '{"display_name":"Practice Admin"}', '{}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role, created_by)
values
  ('e1111111-1111-4111-8111-111111111111', 'student', 'e3333333-3333-4333-8333-333333333333'),
  ('e2222222-2222-4222-8222-222222222222', 'student', 'e3333333-3333-4333-8333-333333333333'),
  ('e3333333-3333-4333-8333-333333333333', 'admin', 'e3333333-3333-4333-8333-333333333333');
select is(
  (select count(*)::integer from public.profiles where id in (
    'e1111111-1111-4111-8111-111111111111',
    'e2222222-2222-4222-8222-222222222222',
    'e3333333-3333-4333-8333-333333333333'
  )),
  3,
  'auth trigger creates practice fixture profiles'
);

insert into public.topics (id, exam_id, code, title, status, sort_order)
values
  ('e4000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'PRACTICE_ALPHA', 'Practice alpha', 'active', 300),
  ('e4000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'PRACTICE_BRAVO', 'Practice bravo', 'active', 301);
insert into public.pilot_package_assignments (student_id, import_package, assigned_by)
values ('e1111111-1111-4111-8111-111111111111', 'PRACTICE_TEST', 'e3333333-3333-4333-8333-333333333333');

insert into public.practice_test_blueprints (
  id, exam_id, code, name, description, question_count, time_limit_seconds,
  allow_untimed, allow_pause, status
) values (
  'e5000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  'PRACTICE_TEST_10', 'Synthetic balanced practice test',
  'Synthetic rolled-back blueprint for secure practice-test validation.',
  10, 900, true, false, 'active'
);
insert into public.practice_test_blueprint_rules (
  blueprint_id, difficulty, cognitive_level, target_count
) values
  ('e5000000-0000-4000-8000-000000000001', 'easy', 'recall', 2),
  ('e5000000-0000-4000-8000-000000000001', 'easy', 'understanding', 2),
  ('e5000000-0000-4000-8000-000000000001', 'medium', 'recall', 1),
  ('e5000000-0000-4000-8000-000000000001', 'medium', 'understanding', 1),
  ('e5000000-0000-4000-8000-000000000001', 'medium', 'application', 1),
  ('e5000000-0000-4000-8000-000000000001', 'medium', 'scenario', 1),
  ('e5000000-0000-4000-8000-000000000001', 'hard', 'recall', 1),
  ('e5000000-0000-4000-8000-000000000001', 'hard', 'scenario', 1);

create temporary table practice_questions (
  question_id uuid primary key,
  correct_choice_id uuid not null,
  wrong_choice_id uuid not null,
  difficulty public.question_difficulty not null,
  cognitive_level public.cognitive_level not null,
  topic_id uuid not null
);
grant select on table practice_questions to authenticated;

do $$
declare
  rule record;
  item integer;
  sequence integer := 0;
  question_id uuid;
  correct_id uuid;
  wrong_id uuid;
  topic_id uuid;
begin
  for rule in
    select * from public.practice_test_blueprint_rules
    where blueprint_id = 'e5000000-0000-4000-8000-000000000001'
    order by difficulty, cognitive_level
  loop
    for item in 1..rule.target_count loop
      sequence := sequence + 1;
      question_id := gen_random_uuid();
      correct_id := gen_random_uuid();
      wrong_id := gen_random_uuid();
      topic_id := case when sequence % 2 = 0
        then 'e4000000-0000-4000-8000-000000000002'::uuid
        else 'e4000000-0000-4000-8000-000000000001'::uuid end;
      insert into public.questions (
        id, exam_id, topic_id, source_reference, question_text, difficulty,
        cognitive_level, created_by, external_id, import_package, source_status
      ) values (
        question_id, '20000000-0000-4000-8000-000000000002', topic_id,
        'Synthetic practice source', 'Synthetic practice question ' || sequence || '?',
        rule.difficulty, rule.cognitive_level, 'e3333333-3333-4333-8333-333333333333',
        'PRACTICE-Q' || lpad(sequence::text, 3, '0'), 'PRACTICE_TEST', 'approved_source'
      );
      insert into public.question_choices (id, question_id, choice_key, choice_text, sort_order)
      values
        (correct_id, question_id, 'A', 'Correct practice choice', 0),
        (wrong_id, question_id, 'B', 'Wrong practice choice', 1);
      insert into private.question_answer_keys (
        question_id, correct_choice_id, explanation, remediation, common_mistake, created_by
      ) values (
        question_id, correct_id, 'Synthetic practice explanation',
        'Synthetic practice remediation', 'Synthetic practice mistake',
        'e3333333-3333-4333-8333-333333333333'
      );
      insert into practice_questions values (
        question_id, correct_id, wrong_id, rule.difficulty, rule.cognitive_level, topic_id
      );
    end loop;
  end loop;
end;
$$;

create temporary table practice_sessions (label text primary key, id uuid not null);
grant select, insert on table practice_sessions to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'e1111111-1111-4111-8111-111111111111', true);
select is(
  (select count(*)::integer from public.get_practice_test_options()
   where blueprint_id = 'e5000000-0000-4000-8000-000000000001'),
  1,
  'student sees the active practice blueprint'
);
insert into practice_sessions values (
  'primary', public.create_practice_test('e5000000-0000-4000-8000-000000000001', true)
);
select is((select count(*)::integer from practice_sessions where label = 'primary'), 1, 'student creates a practice test');
select is((select count(distinct sq.question_id)::integer from public.study_session_questions sq where sq.session_id = (select id from practice_sessions where label = 'primary')), 10, 'practice test has ten unique questions');
select is((select mode::text from public.study_sessions where id = (select id from practice_sessions where label = 'primary')), 'practice_test', 'session is separately marked as practice test');
select is((select timed from public.study_sessions where id = (select id from practice_sessions where label = 'primary')), true, 'timed option is snapshotted');
select is((select time_limit_seconds from public.study_sessions where id = (select id from practice_sessions where label = 'primary')), 900, 'configured timer is snapshotted');
select is((select count(*)::integer from public.study_session_questions where session_id = (select id from practice_sessions where label = 'primary') and selection_reason = 'practice_test_blueprint'), 10, 'every question records blueprint selection');
select is((select count(*)::integer from public.study_session_questions sq join practice_questions q on q.question_id = sq.question_id where sq.session_id = (select id from practice_sessions where label = 'primary') and q.difficulty = 'easy'), 4, 'blueprint selects four easy questions');
select is((select count(*)::integer from public.study_session_questions sq join practice_questions q on q.question_id = sq.question_id where sq.session_id = (select id from practice_sessions where label = 'primary') and q.difficulty = 'medium'), 4, 'blueprint selects four medium questions');
select is((select count(*)::integer from public.study_session_questions sq join practice_questions q on q.question_id = sq.question_id where sq.session_id = (select id from practice_sessions where label = 'primary') and q.difficulty = 'hard'), 2, 'blueprint selects two hard questions');
select is((select count(*)::integer from public.study_session_questions sq join practice_questions q on q.question_id = sq.question_id where sq.session_id = (select id from practice_sessions where label = 'primary') and q.cognitive_level = 'recall'), 4, 'blueprint selects four recall questions');
select is((select count(*)::integer from public.study_session_questions sq join practice_questions q on q.question_id = sq.question_id where sq.session_id = (select id from practice_sessions where label = 'primary') and q.cognitive_level = 'understanding'), 3, 'blueprint selects three understanding questions');
select is((select count(*)::integer from public.study_session_questions sq join practice_questions q on q.question_id = sq.question_id where sq.session_id = (select id from practice_sessions where label = 'primary') and q.cognitive_level = 'application'), 1, 'blueprint selects one application question');
select is((select count(*)::integer from public.study_session_questions sq join practice_questions q on q.question_id = sq.question_id where sq.session_id = (select id from practice_sessions where label = 'primary') and q.cognitive_level = 'scenario'), 2, 'blueprint selects two scenario questions');
select is((select count(distinct q.topic_id)::integer from public.study_session_questions sq join practice_questions q on q.question_id = sq.question_id where sq.session_id = (select id from practice_sessions where label = 'primary')), 2, 'selection balances available topics');

select is(
  (select is_correct from public.submit_answer(
    (select sq.id from public.study_session_questions sq where sq.session_id = (select id from practice_sessions where label = 'primary') order by sq.position limit 1),
    (select pq.correct_choice_id from public.study_session_questions sq join practice_questions pq on pq.question_id = sq.question_id where sq.session_id = (select id from practice_sessions where label = 'primary') order by sq.position limit 1),
    1000, null
  )),
  null::boolean,
  'active practice submission withholds correctness'
);
select is(
  (select correct_choice_id from public.submit_answer(
    (select sq.id from public.study_session_questions sq where sq.session_id = (select id from practice_sessions where label = 'primary') order by sq.position limit 1),
    (select pq.correct_choice_id from public.study_session_questions sq join practice_questions pq on pq.question_id = sq.question_id where sq.session_id = (select id from practice_sessions where label = 'primary') order by sq.position limit 1),
    1000, null
  )),
  null::uuid,
  'idempotent active practice response withholds the answer key'
);
select is((select is_correct from public.get_study_session_questions((select id from practice_sessions where label = 'primary')) where attempt_id is not null), null::boolean, 'active practice retrieval withholds correctness');
select is((select explanation from public.get_study_session_questions((select id from practice_sessions where label = 'primary')) where attempt_id is not null), null::text, 'active practice retrieval withholds explanation');
select is((select max(correct_count) from public.get_study_session_questions((select id from practice_sessions where label = 'primary'))), 0, 'active practice retrieval withholds aggregate score');
select is((select count(*)::integer from public.student_question_state), 0, 'practice attempts do not update ordinary question state');
select is((select count(*)::integer from public.student_topic_mastery), 0, 'practice attempts do not update ordinary topic mastery');
select throws_ok(
  $$select public.set_practice_test_paused((select id from practice_sessions where label = 'primary'), true)$$,
  '42501', 'Pausing is not allowed for this practice test', 'pause is denied when the blueprint disallows it'
);
select throws_ok(
  $$select * from public.get_practice_test_results((select id from practice_sessions where label = 'primary'))$$,
  'P0002', 'Completed practice test not found', 'topic results are unavailable before completion'
);

select set_config('request.jwt.claim.sub', 'e2222222-2222-4222-8222-222222222222', true);
select throws_ok(
  $$select * from public.get_study_session_questions((select id from practice_sessions where label = 'primary'))$$,
  'P0002', 'Study session not found', 'another student cannot read the practice test'
);
select throws_ok(
  $$select public.complete_practice_test((select id from practice_sessions where label = 'primary'))$$,
  'P0002', 'Practice test not found', 'another student cannot complete the practice test'
);

select set_config('request.jwt.claim.sub', 'e1111111-1111-4111-8111-111111111111', true);
select lives_ok(
  $$select public.complete_practice_test((select id from practice_sessions where label = 'primary'))$$,
  'owner completes the practice test'
);
select is((select is_correct from public.get_study_session_questions((select id from practice_sessions where label = 'primary')) where attempt_id is not null), true, 'completion releases attempted-answer correctness');
select is((select explanation from public.get_study_session_questions((select id from practice_sessions where label = 'primary')) where attempt_id is not null), 'Synthetic practice explanation', 'completion releases attempted-answer explanation');
select is((select count(*)::integer from public.get_practice_test_results((select id from practice_sessions where label = 'primary'))), 2, 'completed results cover both selected topics');
select is((select count(*)::integer from public.get_practice_test_results((select id from practice_sessions where label = 'primary')) where performance_label in ('Review next', 'Not attempted')), 2, 'topic results identify review needs');
select is((select count(*)::integer from public.get_progress_trends('e1111111-1111-4111-8111-111111111111', '20000000-0000-4000-8000-000000000002', 30)), 0, 'ordinary trend analytics exclude practice attempts');
select is((select attempted_question_count from public.get_progress_dashboard('e1111111-1111-4111-8111-111111111111', '20000000-0000-4000-8000-000000000002')), 1, 'practice attempts contribute to readiness coverage');
select is((select recent_accuracy_score from public.get_progress_dashboard('e1111111-1111-4111-8111-111111111111', '20000000-0000-4000-8000-000000000002')), 0::numeric, 'ordinary recent accuracy remains separate from practice score');

reset role;
update public.practice_test_blueprints set allow_pause = true
where id = 'e5000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'e1111111-1111-4111-8111-111111111111', true);
insert into practice_sessions values (
  'pausable', public.create_practice_test('e5000000-0000-4000-8000-000000000001', false)
);
select is((select allow_pause_snapshot from public.study_sessions where id = (select id from practice_sessions where label = 'pausable')), true, 'pause permission is snapshotted at creation');
select lives_ok($$select public.set_practice_test_paused((select id from practice_sessions where label = 'pausable'), true)$$, 'configured test can pause');
select is((select is_paused from public.get_study_session_questions((select id from practice_sessions where label = 'pausable')) limit 1), true, 'paused state is visible');
select throws_ok(
  $$select * from public.submit_answer(
    (select sq.id from public.study_session_questions sq where sq.session_id = (select id from practice_sessions where label = 'pausable') order by sq.position limit 1),
    (select pq.correct_choice_id from public.study_session_questions sq join practice_questions pq on pq.question_id = sq.question_id where sq.session_id = (select id from practice_sessions where label = 'pausable') order by sq.position limit 1),
    1000, null
  )$$,
  '22023', 'Resume the practice test before answering', 'paused test cannot accept answers'
);
select lives_ok($$select public.set_practice_test_paused((select id from practice_sessions where label = 'pausable'), false)$$, 'configured test resumes');
select is((select is_paused from public.get_study_session_questions((select id from practice_sessions where label = 'pausable')) limit 1), false, 'resumed state is visible');

insert into practice_sessions values (
  'expired', public.create_practice_test('e5000000-0000-4000-8000-000000000001', true)
);
reset role;
update public.study_sessions set started_at = now() - interval '20 minutes'
where id = (select id from practice_sessions where label = 'expired');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'e1111111-1111-4111-8111-111111111111', true);
select throws_ok(
  $$select * from public.submit_answer(
    (select sq.id from public.study_session_questions sq where sq.session_id = (select id from practice_sessions where label = 'expired') order by sq.position limit 1),
    (select pq.correct_choice_id from public.study_session_questions sq join practice_questions pq on pq.question_id = sq.question_id where sq.session_id = (select id from practice_sessions where label = 'expired') order by sq.position limit 1),
    1000, null
  )$$,
  '22023', 'Practice test time has expired', 'expired timed test cannot accept answers'
);

reset role;
update public.practice_test_blueprints set status = 'retired'
where id = 'e5000000-0000-4000-8000-000000000001';
insert into public.practice_test_blueprints (
  id, exam_id, code, name, description, question_count, time_limit_seconds,
  allow_untimed, allow_pause, status
) values (
  'e5000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000002',
  'PRACTICE_SPARSE', 'Synthetic sparse practice test',
  'Synthetic blueprint that deliberately requires an unavailable stratum.',
  1, 300, true, false, 'active'
);
insert into public.practice_test_blueprint_rules (
  blueprint_id, difficulty, cognitive_level, target_count
) values ('e5000000-0000-4000-8000-000000000002', 'hard', 'application', 1);
set local role authenticated;
select set_config('request.jwt.claim.sub', 'e1111111-1111-4111-8111-111111111111', true);
select throws_ok(
  $$select public.create_practice_test('e5000000-0000-4000-8000-000000000002', true)$$,
  '22023', 'Not enough available questions for the practice-test blueprint', 'sparse blueprint fails clearly'
);

reset role;
select * from finish();
rollback;

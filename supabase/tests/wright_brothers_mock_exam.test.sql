begin;

create extension if not exists pgtap with schema extensions;
select plan(32);

select is(
  (select selection_strategy from public.practice_test_blueprints
   where code = 'WRIGHT_BROTHERS_MOCK_30'),
  'wright_brothers_mock_exam',
  'Wright Brothers mock blueprint uses its dedicated selection strategy'
);
select is(
  (select question_count from public.practice_test_blueprints
   where code = 'WRIGHT_BROTHERS_MOCK_30'),
  30,
  'Wright Brothers mock blueprint contains thirty questions'
);
select ok(
  (select time_limit_seconds is null from public.practice_test_blueprints
   where code = 'WRIGHT_BROTHERS_MOCK_30'),
  'Wright Brothers mock blueprint has no clock'
);
select is(
  (select allow_untimed from public.practice_test_blueprints
   where code = 'WRIGHT_BROTHERS_MOCK_30'),
  true,
  'Wright Brothers mock blueprint permits untimed sessions'
);
select is(
  (select allow_pause from public.practice_test_blueprints
   where code = 'WRIGHT_BROTHERS_MOCK_30'),
  false,
  'Wright Brothers mock blueprint does not expose pause controls'
);
select has_function(
  'public', 'create_wright_brothers_mock_exam', array['uuid', 'boolean'],
  'Wright Brothers mock-exam creation function exists'
);
select is(
  has_function_privilege(
    'authenticated', 'public.create_wright_brothers_mock_exam(uuid, boolean)', 'execute'
  ),
  true,
  'authenticated students can execute protected Wright mock creation'
);
select is(
  has_function_privilege(
    'anon', 'public.create_wright_brothers_mock_exam(uuid, boolean)', 'execute'
  ),
  false,
  'anonymous users cannot create Wright mock exams'
);

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
values
  ('f1111111-1111-4111-8111-111111111111', 'wright-one@example.test', '{"display_name":"Wright One"}', '{}', 'authenticated', 'authenticated'),
  ('f2222222-2222-4222-8222-222222222222', 'wright-two@example.test', '{"display_name":"Wright Two"}', '{}', 'authenticated', 'authenticated'),
  ('f3333333-3333-4333-8333-333333333333', 'wright-admin@example.test', '{"display_name":"Wright Admin"}', '{}', 'authenticated', 'authenticated');

insert into public.user_roles (user_id, role, created_by)
values
  ('f1111111-1111-4111-8111-111111111111', 'student', 'f3333333-3333-4333-8333-333333333333'),
  ('f2222222-2222-4222-8222-222222222222', 'student', 'f3333333-3333-4333-8333-333333333333'),
  ('f3333333-3333-4333-8333-333333333333', 'admin', 'f3333333-3333-4333-8333-333333333333');

create temporary table wright_exam_questions (
  question_id uuid primary key,
  chapter_number integer not null,
  family_id uuid not null,
  wrong_choice_id uuid not null
);
grant select on wright_exam_questions to authenticated;

do $$
declare
  v_chapter integer;
  v_item integer;
  v_topic uuid;
  v_objective uuid;
  v_family uuid;
  v_question uuid;
  v_correct_choice uuid;
  v_wrong_choice uuid;
begin
  for v_chapter in 1..3 loop
    v_topic := gen_random_uuid();
    v_objective := gen_random_uuid();
    insert into public.topics (id, exam_id, code, title, status, sort_order)
    values (
      v_topic, '20000000-0000-4000-8000-000000000003',
      'WRIGHT_TEST_C' || v_chapter, 'Wright Test Chapter ' || v_chapter,
      'active', 950 + v_chapter
    );
    insert into public.learning_objectives (id, topic_id, code, title, status)
    values (
      v_objective, v_topic, 'WRIGHT_TEST_C' || v_chapter || '_OBJECTIVE',
      'Wright test objective ' || v_chapter, 'draft'
    );

    for v_item in 1..10 loop
      v_family := gen_random_uuid();
      v_question := gen_random_uuid();
      v_correct_choice := gen_random_uuid();
      v_wrong_choice := gen_random_uuid();

      insert into public.question_families (id, exam_id, code, source_code, title, status)
      values (
        v_family, '20000000-0000-4000-8000-000000000003',
        'WBC' || v_chapter || 'F' || lpad(v_item::text, 2, '0'),
        'WBC' || v_chapter || 'S' || v_item,
        'Wright family ' || v_chapter || '-' || v_item, 'draft'
      );
      insert into public.questions (
        id, exam_id, topic_id, learning_objective_id, question_family_id,
        source_reference, question_text, difficulty, cognitive_level,
        created_by, external_id, import_package, source_status,
        chapter_number, exam_likeness, distractor_difficulty,
        eligible_for_final_exam, final_exam_weight, content_origin, style_reference
      ) values (
        v_question, '20000000-0000-4000-8000-000000000003', v_topic, v_objective,
        v_family, 'Synthetic Wright source',
        'Synthetic Wright question ' || v_chapter || '-' || v_item || '?',
        'medium', 'application', 'f3333333-3333-4333-8333-333333333333',
        'WRIGHT-C' || v_chapter || '-Q' || lpad(v_item::text, 3, '0'),
        'WRIGHT_TEST_C' || v_chapter, 'approved_source', v_chapter,
        'high', 'close', true, 1.0,
        'original_textbook_grounded',
        'Three Wright Brothers Milestone exam forms used as style/difficulty reference only'
      );
      insert into public.question_choices (id, question_id, choice_key, choice_text, sort_order)
      values
        (v_correct_choice, v_question, 'A', 'Correct synthetic choice', 0),
        (v_wrong_choice, v_question, 'B', 'Incorrect synthetic choice', 1);
      insert into private.question_answer_keys (
        question_id, correct_choice_id, explanation, remediation, common_mistake, created_by
      ) values (
        v_question, v_correct_choice, 'Synthetic explanation', 'Synthetic remediation',
        'Synthetic misconception', 'f3333333-3333-4333-8333-333333333333'
      );
      insert into wright_exam_questions values (
        v_question, v_chapter, v_family, v_wrong_choice
      );
    end loop;
  end loop;
end;
$$;

create temporary table wright_sessions (id uuid primary key);
grant select, insert on wright_sessions to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1111111-1111-4111-8111-111111111111', true);

select is(
  (select count(*)::integer from public.get_practice_test_options()
   where blueprint_id = '70000000-0000-4000-8000-000000000004'),
  0,
  'Wright mock stays hidden before all chapter packages are accessible'
);

reset role;
insert into public.pilot_package_assignments (student_id, import_package, assigned_by)
select
  'f1111111-1111-4111-8111-111111111111',
  'WRIGHT_TEST_C' || chapter_number,
  'f3333333-3333-4333-8333-333333333333'
from generate_series(1, 3) chapter_number;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1111111-1111-4111-8111-111111111111', true);

select is(
  (select count(*)::integer from public.get_practice_test_options()
   where blueprint_id = '70000000-0000-4000-8000-000000000004'
     and selection_strategy = 'wright_brothers_mock_exam'),
  1,
  'student with all three chapter packages sees the Wright mock exam'
);
insert into wright_sessions values (
  public.create_wright_brothers_mock_exam(
    '70000000-0000-4000-8000-000000000004', false
  )
);
select is((select count(*)::integer from wright_sessions), 1, 'student creates a Wright mock exam');
select is(
  (select review_tracking_version from public.study_sessions
   where id = (select id from wright_sessions)),
  1::smallint,
  'new Wright mock exams enable missed-answer review tracking'
);
select is(
  (select count(*)::integer from public.study_session_questions
   where session_id = (select id from wright_sessions)),
  30,
  'Wright mock freezes exactly thirty questions'
);
select is(
  (select count(distinct question_id)::integer from public.study_session_questions
   where session_id = (select id from wright_sessions)),
  30,
  'Wright mock contains thirty unique questions'
);
select is(
  (select count(distinct q.chapter_number)::integer
   from public.study_session_questions sq
   join wright_exam_questions q on q.question_id = sq.question_id
   where sq.session_id = (select id from wright_sessions)),
  3,
  'Wright mock covers all three chapters'
);
select is(
  (select count(*)::integer
   from (
     select q.chapter_number
     from public.study_session_questions sq
     join wright_exam_questions q on q.question_id = sq.question_id
     where sq.session_id = (select id from wright_sessions)
     group by q.chapter_number
     having count(*) = 10
   ) balanced_chapters),
  3,
  'each Wright chapter contributes exactly ten questions'
);
select is(
  (select count(distinct q.family_id)::integer
   from public.study_session_questions sq
   join wright_exam_questions q on q.question_id = sq.question_id
   where sq.session_id = (select id from wright_sessions)),
  30,
  'Wright mock does not repeat a question family'
);
select ok(
  (select time_limit_seconds is null from public.study_sessions
   where id = (select id from wright_sessions)),
  'Wright mock session freezes no time limit'
);
select is(
  (select timed from public.study_sessions where id = (select id from wright_sessions)),
  false,
  'Wright mock session is untimed'
);
select is(
  (select allow_pause_snapshot from public.study_sessions
   where id = (select id from wright_sessions)),
  false,
  'Wright mock session has no pause state'
);
select lives_ok(
  format(
    'select public.set_practice_test_question_flag(%L, true)',
    (select id from public.study_session_questions
     where session_id = (select id from wright_sessions)
     order by position limit 1)
  ),
  'student flags a Wright mock question'
);
select is(
  (select count(*)::integer
   from public.get_practice_test_question_flags((select id from wright_sessions))),
  1,
  'Wright mock question flag persists server-side'
);

select set_config('request.jwt.claim.sub', 'f2222222-2222-4222-8222-222222222222', true);
select throws_ok(
  $$select public.create_wright_brothers_mock_exam(
    '70000000-0000-4000-8000-000000000004', false
  )$$,
  '22023', 'Not enough eligible questions for the Wright Brothers mock exam',
  'student without chapter assignments cannot create the Wright mock exam'
);

select set_config('request.jwt.claim.sub', 'f1111111-1111-4111-8111-111111111111', true);
select throws_ok(
  $$select public.create_wright_brothers_mock_exam(
    '70000000-0000-4000-8000-000000000004', true
  )$$,
  '22023', 'The Wright Brothers mock exam is untimed',
  'Wright mock exam rejects a timed session request'
);
select lives_ok(
  format(
    'select public.submit_answer(%L, %L, 1000, null::smallint)',
    (select sq.id from public.study_session_questions sq
     where sq.session_id = (select id from wright_sessions)
     order by sq.position limit 1),
    (select q.wrong_choice_id
     from public.study_session_questions sq
     join wright_exam_questions q on q.question_id = sq.question_id
     where sq.session_id = (select id from wright_sessions)
     order by sq.position limit 1)
  ),
  'student submits an incorrect Wright mock answer'
);
select lives_ok(
  format('select public.complete_practice_test(%L)', (select id from wright_sessions)),
  'student completes the Wright mock exam'
);
select is(
  (select missed_count
   from public.get_practice_test_review_progress((select id from wright_sessions))),
  1,
  'Wright review progress counts the missed answer'
);
select is(
  (select review_percent
   from public.get_practice_test_review_progress((select id from wright_sessions))),
  0,
  'Wright review begins at zero percent'
);
select lives_ok(
  format(
    'select public.mark_practice_answer_reviewed(%L)',
    (select sq.id
     from public.study_session_questions sq
     join public.question_attempts a on a.session_question_id = sq.id
     where sq.session_id = (select id from wright_sessions) and not a.is_correct)
  ),
  'student records deliberate review of a Wright missed answer'
);
select is(
  (select review_percent
   from public.get_practice_test_review_progress((select id from wright_sessions))),
  100,
  'Wright missed-answer review reaches one hundred percent'
);
select is(
  (select count(*)::integer
   from public.get_latest_practice_test_topic_results(
     'f1111111-1111-4111-8111-111111111111',
     '20000000-0000-4000-8000-000000000003'
   )),
  3,
  'latest Wright mock progress covers all three chapter topics'
);
select is(
  (select count(*)::integer from public.get_practice_test_options()
   where blueprint_id = '70000000-0000-4000-8000-000000000004'),
  1,
  'completed Wright mock does not change package-based option access'
);

select * from finish();
rollback;

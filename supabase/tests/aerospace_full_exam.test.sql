begin;

create extension if not exists pgtap with schema extensions;
select plan(31);

select is(
  (select selection_strategy from public.practice_test_blueprints
   where code = 'MITCHELL_AEROSPACE_FULL_50'),
  'aerospace_full_exam',
  'Aerospace full-exam blueprint uses the dedicated selection strategy'
);
select is(
  (select question_count from public.practice_test_blueprints
   where code = 'MITCHELL_AEROSPACE_FULL_50'),
  50,
  'Aerospace full-exam blueprint contains fifty questions'
);
select is(
  (select time_limit_seconds from public.practice_test_blueprints
   where code = 'MITCHELL_AEROSPACE_FULL_50'),
  3600,
  'Aerospace full-exam blueprint uses a sixty-minute timer'
);
select is(
  (select allow_pause from public.practice_test_blueprints
   where code = 'MITCHELL_AEROSPACE_FULL_50'),
  true,
  'Aerospace full-exam blueprint permits pausing'
);
select has_function(
  'public', 'create_aerospace_full_practice_exam', array['uuid', 'boolean'],
  'Aerospace full-exam creation function exists'
);
select is(
  has_function_privilege(
    'authenticated', 'public.create_aerospace_full_practice_exam(uuid, boolean)', 'execute'
  ),
  true,
  'authenticated students can execute protected Aerospace full-exam creation'
);
select is(
  has_function_privilege(
    'anon', 'public.create_aerospace_full_practice_exam(uuid, boolean)', 'execute'
  ),
  false,
  'anonymous users cannot create Aerospace full exams'
);

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
values
  ('e1111111-1111-4111-8111-111111111111', 'aerospace-one@example.test', '{"display_name":"Aerospace One"}', '{}', 'authenticated', 'authenticated'),
  ('e2222222-2222-4222-8222-222222222222', 'aerospace-two@example.test', '{"display_name":"Aerospace Two"}', '{}', 'authenticated', 'authenticated'),
  ('e3333333-3333-4333-8333-333333333333', 'aerospace-admin@example.test', '{"display_name":"Aerospace Admin"}', '{}', 'authenticated', 'authenticated');

insert into public.user_roles (user_id, role, created_by)
values
  ('e1111111-1111-4111-8111-111111111111', 'student', 'e3333333-3333-4333-8333-333333333333'),
  ('e2222222-2222-4222-8222-222222222222', 'student', 'e3333333-3333-4333-8333-333333333333'),
  ('e3333333-3333-4333-8333-333333333333', 'admin', 'e3333333-3333-4333-8333-333333333333');

insert into public.practice_test_blueprints (
  id, exam_id, code, name, description, question_count, time_limit_seconds,
  allow_untimed, allow_pause, status, selection_strategy
) values (
  'e5000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  'AEROSPACE_TEST_50', 'Synthetic Aerospace full exam',
  'Synthetic rolled-back blueprint for Aerospace full-exam validation.',
  50, 3600, true, true, 'active', 'aerospace_full_exam'
);

create temporary table aerospace_exam_questions (
  question_id uuid primary key,
  module_number integer not null,
  family_id uuid not null,
  wrong_choice_id uuid not null
);
grant select on aerospace_exam_questions to authenticated;

do $$
declare
  v_module integer;
  v_item integer;
  v_topic uuid;
  v_objective uuid;
  v_family uuid;
  v_question uuid;
  v_correct_choice uuid;
  v_wrong_choice uuid;
begin
  for v_module in 1..7 loop
    v_topic := gen_random_uuid();
    v_objective := gen_random_uuid();
    insert into public.topics (id, exam_id, code, title, status, sort_order)
    values (
      v_topic, '20000000-0000-4000-8000-000000000002',
      'AERO_TEST_M' || v_module, 'Aerospace Test Module ' || v_module,
      'active', 900 + v_module
    );
    insert into public.learning_objectives (id, topic_id, code, title, status)
    values (
      v_objective, v_topic, 'AERO_TEST_M' || v_module || '_OBJECTIVE',
      'Aerospace test objective ' || v_module, 'draft'
    );

    for v_item in 1..8 loop
      v_family := gen_random_uuid();
      v_question := gen_random_uuid();
      v_correct_choice := gen_random_uuid();
      v_wrong_choice := gen_random_uuid();

      insert into public.question_families (id, exam_id, code, source_code, title, status)
      values (
        v_family, '20000000-0000-4000-8000-000000000002',
        'AERO_M' || v_module || '_F' || lpad(v_item::text, 2, '0'),
        'M' || v_module || 'F' || v_item,
        'Aerospace family ' || v_module || '-' || v_item, 'draft'
      );
      insert into public.questions (
        id, exam_id, topic_id, learning_objective_id, question_family_id,
        source_reference, question_text, difficulty, cognitive_level,
        created_by, external_id, import_package, source_status,
        module_number, chapter_number, exam_likeness, distractor_difficulty,
        eligible_for_final_exam, final_exam_weight, content_origin, style_reference
      ) values (
        v_question, '20000000-0000-4000-8000-000000000002', v_topic, v_objective,
        v_family, 'Synthetic Aerospace source',
        'Synthetic Aerospace question ' || v_module || '-' || v_item || '?',
        'medium', 'application', 'e3333333-3333-4333-8333-333333333333',
        'AERO-M' || v_module || '-Q' || lpad(v_item::text, 3, '0'),
        'AERO_TEST_M' || v_module, 'approved_source', v_module, 1,
        'high', 'close', true, 1.0,
        'original_textbook_grounded', 'Mitchell_Aerospace_sample_style_analysis'
      );
      insert into public.question_choices (id, question_id, choice_key, choice_text, sort_order)
      values
        (v_correct_choice, v_question, 'A', 'Correct synthetic choice', 0),
        (v_wrong_choice, v_question, 'B', 'Incorrect synthetic choice', 1);
      insert into private.question_answer_keys (
        question_id, correct_choice_id, explanation, remediation, common_mistake, created_by
      ) values (
        v_question, v_correct_choice, 'Synthetic explanation', 'Synthetic remediation',
        'Synthetic misconception', 'e3333333-3333-4333-8333-333333333333'
      );
      insert into aerospace_exam_questions values (
        v_question, v_module, v_family, v_wrong_choice
      );
    end loop;
  end loop;
end;
$$;

create temporary table aerospace_sessions (id uuid primary key);
grant select, insert on aerospace_sessions to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'e1111111-1111-4111-8111-111111111111', true);

select is(
  (select count(*)::integer from public.get_practice_test_options()
   where blueprint_id = 'e5000000-0000-4000-8000-000000000001'),
  0,
  'Aerospace full exam stays hidden before all module packages are accessible'
);

reset role;
insert into public.pilot_package_assignments (student_id, import_package, assigned_by)
select
  'e1111111-1111-4111-8111-111111111111',
  'AERO_TEST_M' || module_number,
  'e3333333-3333-4333-8333-333333333333'
from generate_series(1, 7) module_number;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'e1111111-1111-4111-8111-111111111111', true);

select is(
  (select count(*)::integer from public.get_practice_test_options()
   where blueprint_id = 'e5000000-0000-4000-8000-000000000001'
     and selection_strategy = 'aerospace_full_exam'),
  1,
  'student with all seven module packages sees the Aerospace full exam'
);
insert into aerospace_sessions values (
  public.create_aerospace_full_practice_exam(
    'e5000000-0000-4000-8000-000000000001', true
  )
);
select is((select count(*)::integer from aerospace_sessions), 1, 'student creates an Aerospace full exam');
select is(
  (select review_tracking_version from public.study_sessions
   where id = (select id from aerospace_sessions)),
  1::smallint,
  'new Aerospace full exams enable missed-answer review tracking'
);
select is(
  (select count(*)::integer from public.study_session_questions
   where session_id = (select id from aerospace_sessions)),
  50,
  'Aerospace full exam freezes exactly fifty questions'
);
select is(
  (select count(distinct question_id)::integer from public.study_session_questions
   where session_id = (select id from aerospace_sessions)),
  50,
  'Aerospace full exam contains fifty unique questions'
);
select is(
  (select count(distinct q.module_number)::integer
   from public.study_session_questions sq
   join aerospace_exam_questions q on q.question_id = sq.question_id
   where sq.session_id = (select id from aerospace_sessions)),
  7,
  'Aerospace full exam covers all seven modules'
);
select ok(
  not exists (
    select 1
    from public.study_session_questions sq
    join aerospace_exam_questions q on q.question_id = sq.question_id
    where sq.session_id = (select id from aerospace_sessions)
    group by q.module_number
    having count(*) < 7 or count(*) > 8
  ),
  'every Aerospace module contributes seven or eight questions'
);
select is(
  (select count(*)::integer
   from (
     select q.module_number
     from public.study_session_questions sq
     join aerospace_exam_questions q on q.question_id = sq.question_id
     where sq.session_id = (select id from aerospace_sessions)
     group by q.module_number
     having count(*) = 8
   ) extra_module),
  1,
  'exactly one Aerospace module contributes the fiftieth question'
);
select is(
  (select count(distinct q.family_id)::integer
   from public.study_session_questions sq
   join aerospace_exam_questions q on q.question_id = sq.question_id
   where sq.session_id = (select id from aerospace_sessions)),
  50,
  'Aerospace full exam does not repeat a question family'
);
select is(
  (select time_limit_seconds from public.study_sessions
   where id = (select id from aerospace_sessions)),
  3600,
  'timed Aerospace session freezes the sixty-minute limit'
);
select is(
  (select allow_pause_snapshot from public.study_sessions
   where id = (select id from aerospace_sessions)),
  true,
  'Aerospace session freezes pause permission'
);
select lives_ok(
  format(
    'select public.set_practice_test_question_flag(%L, true)',
    (select id from public.study_session_questions
     where session_id = (select id from aerospace_sessions)
     order by position limit 1)
  ),
  'student flags an Aerospace test question'
);
select is(
  (select count(*)::integer
   from public.get_practice_test_question_flags((select id from aerospace_sessions))),
  1,
  'Aerospace question flag persists server-side'
);

select set_config('request.jwt.claim.sub', 'e2222222-2222-4222-8222-222222222222', true);
select throws_ok(
  $$select public.create_aerospace_full_practice_exam(
    'e5000000-0000-4000-8000-000000000001', true
  )$$,
  '22023', 'Not enough eligible questions for the Aerospace full practice exam',
  'student without module assignments cannot create the Aerospace full exam'
);

select set_config('request.jwt.claim.sub', 'e1111111-1111-4111-8111-111111111111', true);
select lives_ok(
  format(
    'select public.submit_answer(%L, %L, 1000, null::smallint)',
    (select sq.id from public.study_session_questions sq
     where sq.session_id = (select id from aerospace_sessions)
     order by sq.position limit 1),
    (select q.wrong_choice_id
     from public.study_session_questions sq
     join aerospace_exam_questions q on q.question_id = sq.question_id
     where sq.session_id = (select id from aerospace_sessions)
     order by sq.position limit 1)
  ),
  'student submits an incorrect Aerospace exam answer'
);
select lives_ok(
  format('select public.complete_practice_test(%L)', (select id from aerospace_sessions)),
  'student completes the Aerospace full exam'
);
select is(
  (select missed_count
   from public.get_practice_test_review_progress((select id from aerospace_sessions))),
  1,
  'Aerospace review progress counts the missed answer'
);
select is(
  (select review_percent
   from public.get_practice_test_review_progress((select id from aerospace_sessions))),
  0,
  'Aerospace review begins at zero percent'
);
select lives_ok(
  format(
    'select public.mark_practice_answer_reviewed(%L)',
    (select sq.id
     from public.study_session_questions sq
     join public.question_attempts a on a.session_question_id = sq.id
     where sq.session_id = (select id from aerospace_sessions) and not a.is_correct)
  ),
  'student records deliberate review of an Aerospace missed answer'
);
select is(
  (select review_percent
   from public.get_practice_test_review_progress((select id from aerospace_sessions))),
  100,
  'Aerospace missed-answer review reaches one hundred percent'
);
select is(
  (select count(*)::integer
   from public.get_latest_practice_test_topic_results(
     'e1111111-1111-4111-8111-111111111111',
     '20000000-0000-4000-8000-000000000002'
   )),
  7,
  'latest Aerospace full-test progress covers all seven module topics'
);
select is(
  (select count(*)::integer from public.get_practice_test_options()
   where blueprint_id = 'e5000000-0000-4000-8000-000000000001'),
  1,
  'completed Aerospace test does not change package-based option access'
);
select throws_ok(
  $$select public.create_mitchell_full_practice_exam(
    'e5000000-0000-4000-8000-000000000001', true
  )$$,
  'P0002', 'Active Mitchell full-exam blueprint not found',
  'Aerospace blueprint cannot be used with the Leadership selector'
);

select * from finish();
rollback;

begin;

create extension if not exists pgtap with schema extensions;
select plan(35);

select is(
  (select selection_strategy from public.practice_test_blueprints
   where code = 'EARHART_FULL_50'),
  'earhart_full_exam',
  'Earhart blueprint uses its dedicated selection strategy'
);
select is(
  (select question_count from public.practice_test_blueprints
   where code = 'EARHART_FULL_50'),
  50,
  'Earhart blueprint contains fifty questions'
);
select is(
  (select time_limit_seconds from public.practice_test_blueprints
   where code = 'EARHART_FULL_50'),
  3600,
  'Earhart blueprint uses a sixty-minute timer'
);
select is(
  (select allow_untimed from public.practice_test_blueprints
   where code = 'EARHART_FULL_50'),
  true,
  'Earhart blueprint permits untimed practice'
);
select is(
  (select allow_pause from public.practice_test_blueprints
   where code = 'EARHART_FULL_50'),
  true,
  'Earhart blueprint permits pausing'
);
select has_function(
  'public', 'create_earhart_full_practice_exam', array['uuid', 'boolean'],
  'Earhart full-exam creation function exists'
);
select is(
  has_function_privilege(
    'authenticated', 'public.create_earhart_full_practice_exam(uuid, boolean)', 'execute'
  ),
  true,
  'authenticated students can execute protected Earhart exam creation'
);
select is(
  has_function_privilege(
    'anon', 'public.create_earhart_full_practice_exam(uuid, boolean)', 'execute'
  ),
  false,
  'anonymous users cannot create Earhart exams'
);

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
values
  ('a1111111-1111-4111-8111-111111111111', 'earhart-one@example.test', '{"display_name":"Earhart One"}', '{}', 'authenticated', 'authenticated'),
  ('a2222222-2222-4222-8222-222222222222', 'earhart-two@example.test', '{"display_name":"Earhart Two"}', '{}', 'authenticated', 'authenticated'),
  ('a3333333-3333-4333-8333-333333333333', 'earhart-admin@example.test', '{"display_name":"Earhart Admin"}', '{}', 'authenticated', 'authenticated');

insert into public.user_roles (user_id, role, created_by)
values
  ('a1111111-1111-4111-8111-111111111111', 'student', 'a3333333-3333-4333-8333-333333333333'),
  ('a2222222-2222-4222-8222-222222222222', 'student', 'a3333333-3333-4333-8333-333333333333'),
  ('a3333333-3333-4333-8333-333333333333', 'admin', 'a3333333-3333-4333-8333-333333333333');

create temporary table earhart_exam_questions (
  question_id uuid primary key,
  chapter_number integer not null,
  family_id uuid not null,
  wrong_choice_id uuid not null
);
grant select on earhart_exam_questions to authenticated;

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
  for v_chapter in 9..11 loop
    v_topic := gen_random_uuid();
    v_objective := gen_random_uuid();
    insert into public.topics (id, exam_id, code, title, status, sort_order)
    values (
      v_topic, '20000000-0000-4000-8000-000000000004',
      'EARHART_TEST_C' || v_chapter, 'Earhart Test Chapter ' || v_chapter,
      'active', 950 + v_chapter
    );
    insert into public.learning_objectives (id, topic_id, code, title, status)
    values (
      v_objective, v_topic, 'EARHART_TEST_C' || v_chapter || '_OBJECTIVE',
      'Earhart test objective ' || v_chapter, 'draft'
    );

    for v_item in 1..17 loop
      v_family := gen_random_uuid();
      v_question := gen_random_uuid();
      v_correct_choice := gen_random_uuid();
      v_wrong_choice := gen_random_uuid();

      insert into public.question_families (id, exam_id, code, source_code, title, status)
      values (
        v_family, '20000000-0000-4000-8000-000000000004',
        'EC' || v_chapter || 'F' || lpad(v_item::text, 2, '0'),
        'EC' || v_chapter || 'S' || v_item,
        'Earhart family ' || v_chapter || '-' || v_item, 'draft'
      );
      insert into public.questions (
        id, exam_id, topic_id, learning_objective_id, question_family_id,
        source_reference, question_text, difficulty, cognitive_level,
        created_by, external_id, import_package, source_status,
        chapter_number, exam_likeness, distractor_difficulty,
        eligible_for_final_exam, final_exam_weight, content_origin, style_reference
      ) values (
        v_question, '20000000-0000-4000-8000-000000000004', v_topic, v_objective,
        v_family, 'Synthetic Earhart source',
        'Synthetic Earhart question ' || v_chapter || '-' || v_item || '?',
        'medium', 'application', 'a3333333-3333-4333-8333-333333333333',
        'EARHART-C' || v_chapter || '-Q' || lpad(v_item::text, 3, '0'),
        'EARHART_TEST_C' || v_chapter, 'approved_source', v_chapter,
        'high', 'close', true, 1.0,
        'original_textbook_grounded',
        'Three Earhart Milestone Leadership exam forms used only as style/difficulty references; no milestone question copied'
      );
      insert into public.question_choices (id, question_id, choice_key, choice_text, sort_order)
      values
        (v_correct_choice, v_question, 'A', 'Correct synthetic choice', 0),
        (v_wrong_choice, v_question, 'B', 'Incorrect synthetic choice', 1);
      insert into private.question_answer_keys (
        question_id, correct_choice_id, explanation, remediation, common_mistake, created_by
      ) values (
        v_question, v_correct_choice, 'Synthetic explanation', 'Synthetic remediation',
        'Synthetic misconception', 'a3333333-3333-4333-8333-333333333333'
      );
      insert into earhart_exam_questions values (
        v_question, v_chapter, v_family, v_wrong_choice
      );
    end loop;
  end loop;
end;
$$;

create temporary table earhart_sessions (id uuid primary key);
grant select, insert on earhart_sessions to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);

select is(
  (select count(*)::integer from public.get_practice_test_options()
   where blueprint_id = '70000000-0000-4000-8000-000000000005'),
  0,
  'Earhart exam stays hidden before all chapter packages are accessible'
);

reset role;
insert into public.pilot_package_assignments (student_id, import_package, assigned_by)
select
  'a1111111-1111-4111-8111-111111111111',
  'EARHART_TEST_C' || chapter_number,
  'a3333333-3333-4333-8333-333333333333'
from generate_series(9, 11) chapter_number;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);

select is(
  (select count(*)::integer from public.get_practice_test_options()
   where blueprint_id = '70000000-0000-4000-8000-000000000005'
     and selection_strategy = 'earhart_full_exam'),
  1,
  'student with all three chapter packages sees the Earhart exam'
);
insert into earhart_sessions values (
  public.create_earhart_full_practice_exam(
    '70000000-0000-4000-8000-000000000005', true
  )
);
select is((select count(*)::integer from earhart_sessions), 1, 'student creates an Earhart exam');
select is(
  (select review_tracking_version from public.study_sessions
   where id = (select id from earhart_sessions)),
  1::smallint,
  'new Earhart exams enable missed-answer review tracking'
);
select is(
  (select count(*)::integer from public.study_session_questions
   where session_id = (select id from earhart_sessions)),
  50,
  'Earhart exam freezes exactly fifty questions'
);
select is(
  (select count(distinct question_id)::integer from public.study_session_questions
   where session_id = (select id from earhart_sessions)),
  50,
  'Earhart exam contains fifty unique questions'
);
select is(
  (select count(distinct q.chapter_number)::integer
   from public.study_session_questions sq
   join earhart_exam_questions q on q.question_id = sq.question_id
   where sq.session_id = (select id from earhart_sessions)),
  3,
  'Earhart exam covers all three chapters'
);
select ok(
  not exists (
    select 1
    from public.study_session_questions sq
    join earhart_exam_questions q on q.question_id = sq.question_id
    where sq.session_id = (select id from earhart_sessions)
    group by q.chapter_number
    having count(*) < 16 or count(*) > 17
  ),
  'every Earhart chapter contributes sixteen or seventeen questions'
);
select is(
  (select count(*)::integer
   from (
     select q.chapter_number
     from public.study_session_questions sq
     join earhart_exam_questions q on q.question_id = sq.question_id
     where sq.session_id = (select id from earhart_sessions)
     group by q.chapter_number
     having count(*) = 16
   ) sixteen_chapter),
  1,
  'exactly one Earhart chapter contributes sixteen questions'
);
select is(
  (select count(distinct q.family_id)::integer
   from public.study_session_questions sq
   join earhart_exam_questions q on q.question_id = sq.question_id
   where sq.session_id = (select id from earhart_sessions)),
  50,
  'Earhart exam does not repeat a question family'
);
select is(
  (select time_limit_seconds from public.study_sessions
   where id = (select id from earhart_sessions)),
  3600,
  'timed Earhart session freezes the sixty-minute limit'
);
select is(
  (select allow_pause_snapshot from public.study_sessions
   where id = (select id from earhart_sessions)),
  true,
  'Earhart session freezes pause permission'
);
select is(
  (select timed from public.study_sessions where id = (select id from earhart_sessions)),
  true,
  'Earhart session freezes the timed selection'
);
select lives_ok(
  format(
    'select public.set_practice_test_question_flag(%L, true)',
    (select id from public.study_session_questions
     where session_id = (select id from earhart_sessions)
     order by position limit 1)
  ),
  'student flags an Earhart test question'
);
select is(
  (select count(*)::integer
   from public.get_practice_test_question_flags((select id from earhart_sessions))),
  1,
  'Earhart question flag persists server-side'
);

select set_config('request.jwt.claim.sub', 'a2222222-2222-4222-8222-222222222222', true);
select throws_ok(
  $$select public.create_earhart_full_practice_exam(
    '70000000-0000-4000-8000-000000000005', true
  )$$,
  '22023', 'Not enough eligible questions for the Earhart full practice exam',
  'student without chapter assignments cannot create the Earhart exam'
);

select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
select lives_ok(
  format(
    'select public.submit_answer(%L, %L, 1000, null::smallint)',
    (select sq.id from public.study_session_questions sq
     where sq.session_id = (select id from earhart_sessions)
     order by sq.position limit 1),
    (select q.wrong_choice_id
     from public.study_session_questions sq
     join earhart_exam_questions q on q.question_id = sq.question_id
     where sq.session_id = (select id from earhart_sessions)
     order by sq.position limit 1)
  ),
  'student submits an incorrect Earhart exam answer'
);
select lives_ok(
  format('select public.complete_practice_test(%L)', (select id from earhart_sessions)),
  'student completes the Earhart exam'
);
select is(
  (select missed_count
   from public.get_practice_test_review_progress((select id from earhart_sessions))),
  1,
  'Earhart review progress counts the missed answer'
);
select is(
  (select review_percent
   from public.get_practice_test_review_progress((select id from earhart_sessions))),
  0,
  'Earhart review begins at zero percent'
);
select lives_ok(
  format(
    'select public.mark_practice_answer_reviewed(%L)',
    (select sq.id
     from public.study_session_questions sq
     join public.question_attempts a on a.session_question_id = sq.id
     where sq.session_id = (select id from earhart_sessions) and not a.is_correct)
  ),
  'student records deliberate review of an Earhart missed answer'
);
select is(
  (select review_percent
   from public.get_practice_test_review_progress((select id from earhart_sessions))),
  100,
  'Earhart missed-answer review reaches one hundred percent'
);
select is(
  (select count(*)::integer
   from public.get_latest_practice_test_topic_results(
     'a1111111-1111-4111-8111-111111111111',
     '20000000-0000-4000-8000-000000000004'
   )),
  3,
  'latest Earhart full-test progress covers all three chapter topics'
);
select is(
  (select count(*)::integer
   from public.get_progress_dashboard(
     'a1111111-1111-4111-8111-111111111111',
     '20000000-0000-4000-8000-000000000004'
   )),
  1,
  'Earhart readiness is returned as its own exam record'
);
select is(
  (select attempted_question_count
   from public.get_progress_dashboard(
     'a1111111-1111-4111-8111-111111111111',
     '20000000-0000-4000-8000-000000000004'
   )),
  1,
  'Earhart practice answers contribute only to Earhart readiness coverage'
);
select is(
  (select count(*)::integer from public.get_practice_test_options()
   where blueprint_id = '70000000-0000-4000-8000-000000000005'),
  1,
  'completed Earhart test does not change package-based option access'
);
select throws_ok(
  $$select public.create_aerospace_full_practice_exam(
    '70000000-0000-4000-8000-000000000005', true
  )$$,
  'P0002', 'Active Aerospace full-exam blueprint not found',
  'Earhart blueprint cannot be used with the Aerospace selector'
);

select * from finish();
rollback;

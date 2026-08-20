begin;

create extension if not exists pgtap with schema extensions;
select plan(56);

select has_column('public', 'questions', 'chapter_number', 'questions store chapter number');
select has_column('public', 'questions', 'exam_likeness', 'questions store exam likeness');
select has_column('public', 'questions', 'distractor_difficulty', 'questions store distractor difficulty');
select has_column('public', 'questions', 'eligible_for_final_exam', 'questions store final-exam eligibility');
select has_column('public', 'questions', 'final_exam_weight', 'questions store final-exam weight');
select has_column('public', 'questions', 'content_origin', 'questions store content origin');
select has_column('public', 'questions', 'style_reference', 'questions store style reference');
select has_column('public', 'study_session_questions', 'flagged_at', 'practice questions store review flags');
select has_column('public', 'study_sessions', 'review_tracking_version', 'sessions identify reliable review tracking');
select has_column('public', 'study_session_questions', 'reviewed_at', 'missed answers store deliberate review completion');
select is(
  (
    select time_limit_seconds
    from public.practice_test_blueprints
    where code = 'MITCHELL_LEADERSHIP_FULL_50'
  ),
  3600,
  'Mitchell fifty-question blueprint uses a sixty-minute timer'
);
select is(
  (
    select allow_pause
    from public.practice_test_blueprints
    where code = 'MITCHELL_LEADERSHIP_FULL_50'
  ),
  true,
  'Mitchell fifty-question blueprint permits pausing'
);
select has_function('public', 'create_mitchell_full_practice_exam', array['uuid', 'boolean'], 'full-exam creation function exists');
select has_function('public', 'set_practice_test_question_flag', array['uuid', 'boolean'], 'review-flag function exists');
select has_function('public', 'get_practice_test_question_flags', array['uuid'], 'review-flag read function exists');
select has_function('public', 'get_practice_test_weak_areas', array['uuid'], 'weak-area function exists');
select has_function('public', 'get_latest_practice_test_topic_results', array['uuid', 'uuid'], 'latest full-test progress function exists');
select has_function('public', 'get_practice_test_review_progress', array['uuid'], 'review progress function exists');
select has_function('public', 'mark_practice_answer_reviewed', array['uuid'], 'missed-answer review function exists');
select is(has_function_privilege('authenticated', 'public.get_latest_practice_test_topic_results(uuid, uuid)', 'execute'), true, 'authenticated users can execute protected latest-test analysis');
select is(has_function_privilege('authenticated', 'public.get_practice_test_review_progress(uuid)', 'execute'), true, 'authenticated users can execute protected review progress');
select is(has_function_privilege('anon', 'public.mark_practice_answer_reviewed(uuid)', 'execute'), false, 'anonymous users cannot record answer review');
select has_function('public', 'reviewer_save_question_with_classification', array['uuid', 'jsonb', 'text'], 'reviewer classification edit function exists');
select is(has_function_privilege('authenticated', 'public.create_mitchell_full_practice_exam(uuid, boolean)', 'execute'), true, 'students can execute protected full-exam creation');
select is(has_function_privilege('anon', 'public.create_mitchell_full_practice_exam(uuid, boolean)', 'execute'), false, 'anonymous users cannot create full exams');

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
values
  ('f1111111-1111-4111-8111-111111111111', 'mitchell-one@example.test', '{"display_name":"Mitchell One"}', '{}', 'authenticated', 'authenticated'),
  ('f2222222-2222-4222-8222-222222222222', 'mitchell-two@example.test', '{"display_name":"Mitchell Two"}', '{}', 'authenticated', 'authenticated'),
  ('f3333333-3333-4333-8333-333333333333', 'mitchell-admin@example.test', '{"display_name":"Mitchell Admin"}', '{}', 'authenticated', 'authenticated'),
  ('f4444444-4444-4444-8444-444444444444', 'mitchell-parent@example.test', '{"display_name":"Mitchell Parent"}', '{}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role, created_by)
values
  ('f1111111-1111-4111-8111-111111111111', 'student', 'f3333333-3333-4333-8333-333333333333'),
  ('f2222222-2222-4222-8222-222222222222', 'student', 'f3333333-3333-4333-8333-333333333333'),
  ('f3333333-3333-4333-8333-333333333333', 'admin', 'f3333333-3333-4333-8333-333333333333'),
  ('f4444444-4444-4444-8444-444444444444', 'parent', 'f3333333-3333-4333-8333-333333333333');
insert into public.student_guardian_links (
  student_id, guardian_id, relationship_type, status,
  can_view_progress, can_assign_content, can_manage_challenges, created_by
) values (
  'f1111111-1111-4111-8111-111111111111',
  'f4444444-4444-4444-8444-444444444444',
  'parent', 'active', true, false, false,
  'f3333333-3333-4333-8333-333333333333'
);
insert into public.pilot_package_assignments (student_id, import_package, assigned_by)
values ('f1111111-1111-4111-8111-111111111111', 'MITCHELL_TEST', 'f3333333-3333-4333-8333-333333333333');

insert into public.practice_test_blueprints (
  id, exam_id, code, name, description, question_count, time_limit_seconds,
  allow_untimed, allow_pause, status, selection_strategy
) values (
  'f5000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  'MITCHELL_TEST_50', 'Synthetic Mitchell full exam',
  'Synthetic rolled-back blueprint for final-exam selection validation.',
  50, 3000, true, false, 'active', 'mitchell_full_exam'
);

create temporary table mitchell_topics (
  chapter_number integer primary key,
  topic_id uuid not null,
  objective_id uuid not null
);
create temporary table mitchell_exam_questions (
  question_id uuid primary key,
  chapter_number integer not null,
  family_id uuid not null,
  wrong_choice_id uuid
);
grant select on mitchell_topics, mitchell_exam_questions to authenticated;

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
  for v_chapter in 4..8 loop
    v_topic := gen_random_uuid();
    v_objective := gen_random_uuid();
    insert into public.topics (
      id, exam_id, code, title, status, sort_order
    ) values (
      v_topic, '20000000-0000-4000-8000-000000000002',
      'MITCHELL_C' || v_chapter, 'Mitchell Chapter ' || v_chapter,
      'active', 500 + v_chapter
    );
    insert into public.learning_objectives (id, topic_id, code, title, status)
    values (
      v_objective, v_topic, 'MITCHELL_C' || v_chapter || '_OBJECTIVE',
      'Mitchell objective ' || v_chapter, 'draft'
    );
    insert into mitchell_topics values (v_chapter, v_topic, v_objective);

    for v_item in 1..12 loop
      v_family := gen_random_uuid();
      v_question := gen_random_uuid();
      insert into public.question_families (id, exam_id, code, source_code, title, status)
      values (
        v_family, '20000000-0000-4000-8000-000000000002',
        'MITCHELL_C' || v_chapter || '_F' || lpad(v_item::text, 2, '0'),
        'F' || v_item, 'Mitchell family ' || v_chapter || '-' || v_item, 'draft'
      );
      insert into public.questions (
        id, exam_id, topic_id, learning_objective_id, question_family_id,
        source_reference, question_text, difficulty, cognitive_level,
        created_by, external_id, import_package, source_status,
        chapter_number, exam_likeness, distractor_difficulty,
        eligible_for_final_exam, final_exam_weight, content_origin, style_reference
      ) values (
        v_question, '20000000-0000-4000-8000-000000000002', v_topic, v_objective, v_family,
        'Synthetic Mitchell source', 'Synthetic Mitchell question ' || v_chapter || '-' || v_item || '?',
        'medium', 'application', 'f3333333-3333-4333-8333-333333333333',
        'MITCHELL-C' || v_chapter || '-Q' || lpad(v_item::text, 3, '0'),
        'MITCHELL_TEST', 'approved_source', v_chapter, 'high', 'close', true,
        case when v_item = 1 then 1.2 else 1.0 end,
        'original_textbook_grounded', 'Mitchell_sample_style_analysis'
      );
      insert into mitchell_exam_questions (question_id, chapter_number, family_id)
      values (v_question, v_chapter, v_family);
      v_correct_choice := gen_random_uuid();
      v_wrong_choice := gen_random_uuid();
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
      update mitchell_exam_questions
      set wrong_choice_id = v_wrong_choice
      where question_id = v_question;
    end loop;
  end loop;
end;
$$;

create temporary table mitchell_sessions (id uuid primary key);
grant select, insert on mitchell_sessions to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1111111-1111-4111-8111-111111111111', true);

select is(
  (select count(*)::integer from public.get_practice_test_options()
   where blueprint_id = 'f5000000-0000-4000-8000-000000000001'
     and blueprint_code = 'MITCHELL_TEST_50'
     and selection_strategy = 'mitchell_full_exam'),
  1,
  'student sees the full-exam blueprint and strategy'
);
insert into mitchell_sessions values (
  public.create_mitchell_full_practice_exam('f5000000-0000-4000-8000-000000000001', true)
);
select is((select count(*)::integer from mitchell_sessions), 1, 'student creates a full practice exam');
select is(
  (select review_tracking_version from public.study_sessions where id = (select id from mitchell_sessions)),
  1::smallint,
  'new Mitchell full exams enable review tracking'
);
select is(
  (select count(*)::integer from public.study_session_questions
   where session_id = (select id from mitchell_sessions)),
  50,
  'full exam freezes exactly fifty questions'
);
select is(
  (select count(distinct question_id)::integer from public.study_session_questions
   where session_id = (select id from mitchell_sessions)),
  50,
  'full exam contains fifty unique questions'
);
select ok(
  not exists (
    select 1
    from public.study_session_questions sq
    join mitchell_exam_questions q on q.question_id = sq.question_id
    where sq.session_id = (select id from mitchell_sessions)
    group by q.chapter_number
    having count(*) < 7 or count(*) > 13
  ),
  'every chapter contributes between seven and thirteen questions'
);
select isnt(
  (select count(*)::integer
   from (
     select q.chapter_number
     from public.study_session_questions sq
     join mitchell_exam_questions q on q.question_id = sq.question_id
     where sq.session_id = (select id from mitchell_sessions)
     group by q.chapter_number
     having count(*) = 10
   ) exactly_ten),
  5,
  'chapter distribution is not always ten per chapter'
);
select is(
  (select count(distinct q.family_id)::integer
   from public.study_session_questions sq
   join mitchell_exam_questions q on q.question_id = sq.question_id
   where sq.session_id = (select id from mitchell_sessions)),
  50,
  'full exam does not repeat a question family'
);
select ok(
  not exists (
    select 1
    from public.study_session_questions current_question
    join public.study_session_questions prior_question
      on prior_question.session_id = current_question.session_id
      and prior_question.position = current_question.position - 1
    join public.questions current_content on current_content.id = current_question.question_id
    join public.questions prior_content on prior_content.id = prior_question.question_id
    where current_question.session_id = (select id from mitchell_sessions)
      and current_content.learning_objective_id = prior_content.learning_objective_id
  ),
  'questions from the same objective are not consecutive'
);
select is(
  (select count(*)::integer from public.get_practice_test_question_flags((select id from mitchell_sessions))),
  0,
  'full exam begins without review flags'
);
select lives_ok(
  format(
    'select public.set_practice_test_question_flag(%L, true)',
    (select id from public.study_session_questions where session_id = (select id from mitchell_sessions) order by position limit 1)
  ),
  'student flags a question for review'
);
select is(
  (select count(*)::integer from public.get_practice_test_question_flags((select id from mitchell_sessions))),
  1,
  'review flag is persisted server-side'
);
select throws_ok(
  format('select * from public.get_practice_test_review_progress(%L)', (select id from mitchell_sessions)),
  'P0002', 'Completed full practice test not found',
  'review progress remains unavailable before completion'
);
select lives_ok(
  format(
    'select public.submit_answer(%L, %L, 1000, null::smallint)',
    (select sq.id from public.study_session_questions sq where sq.session_id = (select id from mitchell_sessions) order by sq.position limit 1),
    (select q.wrong_choice_id from public.study_session_questions sq join mitchell_exam_questions q on q.question_id = sq.question_id where sq.session_id = (select id from mitchell_sessions) order by sq.position limit 1)
  ),
  'student submits one incorrect answer for review tracking'
);

select set_config('request.jwt.claim.sub', 'f2222222-2222-4222-8222-222222222222', true);
select throws_ok(
  format('select * from public.get_practice_test_question_flags(%L)', (select id from mitchell_sessions)),
  'P0002', 'Practice test not found',
  'another student cannot read review flags'
);

select set_config('request.jwt.claim.sub', 'f1111111-1111-4111-8111-111111111111', true);
select lives_ok(
  format('select public.complete_practice_test(%L)', (select id from mitchell_sessions)),
  'student submits the full exam'
);
select is(
  (select missed_count from public.get_practice_test_review_progress((select id from mitchell_sessions))),
  1,
  'completed review progress counts the incorrect answer'
);
select is(
  (select review_percent from public.get_practice_test_review_progress((select id from mitchell_sessions))),
  0,
  'newly completed test begins at zero percent reviewed'
);

select set_config('request.jwt.claim.sub', 'f2222222-2222-4222-8222-222222222222', true);
select throws_ok(
  format(
    'select public.mark_practice_answer_reviewed(%L)',
    (select sq.id from public.study_session_questions sq join public.question_attempts a on a.session_question_id = sq.id where sq.session_id = (select id from mitchell_sessions) and not a.is_correct)
  ),
  'P0002', 'Reviewable missed answer not found',
  'another student cannot record review completion'
);

select set_config('request.jwt.claim.sub', 'f1111111-1111-4111-8111-111111111111', true);
select lives_ok(
  format(
    'select public.mark_practice_answer_reviewed(%L)',
    (select sq.id from public.study_session_questions sq join public.question_attempts a on a.session_question_id = sq.id where sq.session_id = (select id from mitchell_sessions) and not a.is_correct)
  ),
  'student records deliberate review of the missed answer'
);
select lives_ok(
  format(
    'select public.mark_practice_answer_reviewed(%L)',
    (select sq.id from public.study_session_questions sq join public.question_attempts a on a.session_question_id = sq.id where sq.session_id = (select id from mitchell_sessions) and not a.is_correct)
  ),
  'recording the same review is idempotent'
);
select is(
  (select reviewed_count from public.get_practice_test_review_progress((select id from mitchell_sessions))),
  1,
  'reviewed count is not duplicated'
);
select is(
  (select review_percent from public.get_practice_test_review_progress((select id from mitchell_sessions))),
  100,
  'review progress reaches one hundred percent'
);
select is(
  (select count(*)::integer from public.get_practice_test_weak_areas((select id from mitchell_sessions))),
  5,
  'completed exam reports objective-level weak areas across five chapters'
);
select is(
  (select count(*)::integer from public.get_latest_practice_test_topic_results(
    'f1111111-1111-4111-8111-111111111111',
    '20000000-0000-4000-8000-000000000002'
  )),
  5,
  'student progress includes all five chapters from the latest full test'
);

select set_config('request.jwt.claim.sub', 'f2222222-2222-4222-8222-222222222222', true);
select throws_ok(
  $$select * from public.get_latest_practice_test_topic_results(
    'f1111111-1111-4111-8111-111111111111',
    '20000000-0000-4000-8000-000000000002'
  )$$,
  '42501', 'Progress access denied',
  'unlinked student cannot read another student latest-test analysis'
);

select set_config('request.jwt.claim.sub', 'f4444444-4444-4444-8444-444444444444', true);
select is(
  (select count(*)::integer from public.get_latest_practice_test_topic_results(
    'f1111111-1111-4111-8111-111111111111',
    '20000000-0000-4000-8000-000000000002'
  )),
  5,
  'linked parent reads the latest full-test chapter analysis'
);
select is(
  (select review_percent from public.get_practice_test_review_progress((select id from mitchell_sessions))),
  100,
  'linked parent reads missed-answer review completion'
);
select is(
  (select cardinality(reviewed_session_question_ids) from public.get_practice_test_review_progress((select id from mitchell_sessions))),
  0,
  'linked parent receives aggregate review progress without session-question identifiers'
);

reset role;
update public.study_sessions
set review_tracking_version = null
where id = (select id from mitchell_sessions);
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f1111111-1111-4111-8111-111111111111', true);
select is(
  (select tracking_available from public.get_practice_test_review_progress((select id from mitchell_sessions))),
  false,
  'historical full tests report review tracking unavailable'
);
select is(
  (select review_percent from public.get_practice_test_review_progress((select id from mitchell_sessions))),
  null::integer,
  'historical full tests do not imply a review percentage'
);

select * from finish();
rollback;

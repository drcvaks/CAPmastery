begin;

create extension if not exists pgtap with schema extensions;
select plan(34);

select has_table('public', 'student_question_state', 'question learning state exists');
select has_table('public', 'student_topic_mastery', 'topic mastery exists');
select is(
  (select count(*)::integer from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in ('student_question_state', 'student_topic_mastery') and c.relrowsecurity),
  2,
  'RLS is enabled on both mastery tables'
);
select is(has_table_privilege('authenticated', 'public.student_question_state', 'insert'), false, 'clients cannot insert question state');
select is(has_table_privilege('authenticated', 'public.student_topic_mastery', 'insert'), false, 'clients cannot insert topic mastery');
select is(private.review_interval_days(false, 0), 1, 'a miss is reviewed next day');
select is(private.review_interval_days(true, 1), 2, 'first correct answer schedules two days');
select is(private.review_interval_days(true, 2), 5, 'second consecutive correct schedules five days');
select is(private.review_interval_days(true, 3), 10, 'third consecutive correct schedules ten days');
select is(private.review_interval_days(true, 4), 17, 'continued correctness expands the interval');
select is(private.mastery_status_for(70, 5, 2)::text, 'needs_review', 'repeated misses override a prior strong score');

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
values
  ('c1111111-1111-4111-8111-111111111111', 'adaptive-one@example.test', '{"display_name":"Adaptive One"}', '{}', 'authenticated', 'authenticated'),
  ('c2222222-2222-4222-8222-222222222222', 'adaptive-two@example.test', '{"display_name":"Adaptive Two"}', '{}', 'authenticated', 'authenticated'),
  ('c3333333-3333-4333-8333-333333333333', 'adaptive-admin@example.test', '{"display_name":"Adaptive Admin"}', '{}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role, created_by)
values
  ('c1111111-1111-4111-8111-111111111111', 'student', 'c3333333-3333-4333-8333-333333333333'),
  ('c2222222-2222-4222-8222-222222222222', 'student', 'c3333333-3333-4333-8333-333333333333'),
  ('c3333333-3333-4333-8333-333333333333', 'admin', 'c3333333-3333-4333-8333-333333333333');
select is(
  (select count(*)::integer from public.profiles where id in (
    'c1111111-1111-4111-8111-111111111111',
    'c2222222-2222-4222-8222-222222222222',
    'c3333333-3333-4333-8333-333333333333'
  )),
  3,
  'auth trigger creates adaptive fixture profiles'
);

insert into public.topics (id, exam_id, code, title, status, sort_order)
values
  ('c4000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'ADAPT_WEAK', 'Adaptive weak topic', 'active', 100),
  ('c4000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'ADAPT_MISSED', 'Adaptive missed topic', 'active', 101),
  ('c4000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'ADAPT_DEVELOP', 'Adaptive developing topic', 'active', 102),
  ('c4000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 'ADAPT_RETAIN', 'Adaptive retention topic', 'active', 103),
  ('c4000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000001', 'ADAPT_NEW', 'Adaptive new topic', 'active', 104);
insert into public.learning_objectives (id, topic_id, code, title, status)
values
  ('c5000000-0000-4000-8000-000000000001', 'c4000000-0000-4000-8000-000000000001', 'ADAPT_WEAK_OBJ', 'Weak objective', 'active'),
  ('c5000000-0000-4000-8000-000000000002', 'c4000000-0000-4000-8000-000000000002', 'ADAPT_MISSED_OBJ', 'Missed objective', 'active'),
  ('c5000000-0000-4000-8000-000000000003', 'c4000000-0000-4000-8000-000000000003', 'ADAPT_DEVELOP_OBJ', 'Developing objective', 'active'),
  ('c5000000-0000-4000-8000-000000000004', 'c4000000-0000-4000-8000-000000000004', 'ADAPT_RETAIN_OBJ', 'Retention objective', 'active'),
  ('c5000000-0000-4000-8000-000000000005', 'c4000000-0000-4000-8000-000000000005', 'ADAPT_NEW_OBJ', 'New objective', 'active');
insert into public.pilot_package_assignments (student_id, import_package, assigned_by)
values ('c1111111-1111-4111-8111-111111111111', 'ADAPTIVE_TEST', 'c3333333-3333-4333-8333-333333333333');

create temporary table adaptive_questions (
  number integer primary key,
  question_id uuid not null,
  topic_id uuid not null,
  correct_choice_id uuid not null,
  wrong_choice_id uuid not null
);
grant select on table adaptive_questions to authenticated;

do $$
declare
  i integer;
  q_id uuid;
  correct_id uuid;
  wrong_id uuid;
  topic_id uuid;
  objective_id uuid;
begin
  for i in 1..10 loop
    q_id := gen_random_uuid();
    correct_id := gen_random_uuid();
    wrong_id := gen_random_uuid();
    topic_id := case
      when i <= 4 then 'c4000000-0000-4000-8000-000000000001'::uuid
      when i <= 6 then 'c4000000-0000-4000-8000-000000000002'::uuid
      when i <= 8 then 'c4000000-0000-4000-8000-000000000003'::uuid
      when i = 9 then 'c4000000-0000-4000-8000-000000000004'::uuid
      else 'c4000000-0000-4000-8000-000000000005'::uuid
    end;
    objective_id := ('c5000000-0000-4000-8000-00000000000' || case
      when i <= 4 then '1' when i <= 6 then '2' when i <= 8 then '3' when i = 9 then '4' else '5'
    end)::uuid;
    insert into public.questions (
      id, exam_id, topic_id, learning_objective_id, source_reference,
      question_text, difficulty, cognitive_level, created_by,
      external_id, import_package, source_status
    ) values (
      q_id, '20000000-0000-4000-8000-000000000001', topic_id, objective_id,
      'Synthetic adaptive source ' || i, 'Synthetic adaptive question ' || i || '?',
      case when i = 10 then 'hard'::public.question_difficulty else 'medium'::public.question_difficulty end,
      'understanding', 'c3333333-3333-4333-8333-333333333333',
      'ADAPTIVE-Q' || lpad(i::text, 3, '0'), 'ADAPTIVE_TEST', 'approved_source'
    );
    insert into public.question_choices (id, question_id, choice_key, choice_text, sort_order)
    values (correct_id, q_id, 'A', 'Correct ' || i, 0), (wrong_id, q_id, 'B', 'Wrong ' || i, 1);
    insert into private.question_answer_keys (
      question_id, correct_choice_id, explanation, remediation, common_mistake, created_by
    ) values (
      q_id, correct_id, 'Adaptive explanation ' || i, 'Adaptive remediation ' || i,
      'Adaptive mistake ' || i, 'c3333333-3333-4333-8333-333333333333'
    );
    insert into adaptive_questions values (i, q_id, topic_id, correct_id, wrong_id);
  end loop;
end;
$$;

insert into public.student_topic_mastery (
  student_id, topic_id, attempts_count, correct_count, recent_accuracy, mastery_score,
  confidence_score, retention_score, consecutive_correct, consecutive_incorrect, status
) values
  ('c1111111-1111-4111-8111-111111111111', 'c4000000-0000-4000-8000-000000000001', 4, 1, 25, 30, 30, 30, 0, 2, 'needs_review'),
  ('c1111111-1111-4111-8111-111111111111', 'c4000000-0000-4000-8000-000000000003', 3, 2, 55, 50, 35, 50, 1, 0, 'developing'),
  ('c1111111-1111-4111-8111-111111111111', 'c4000000-0000-4000-8000-000000000004', 5, 4, 80, 75, 70, 75, 3, 0, 'proficient');
insert into public.student_question_state (
  student_id, question_id, times_seen, times_correct, consecutive_correct,
  consecutive_incorrect, last_result, last_seen_at, next_review_at, interval_days, state
)
select
  'c1111111-1111-4111-8111-111111111111', q.question_id, 1, 0, 0, 1, false,
  now() - interval '2 days', now() - interval '1 day', 1, 'needs_review'
from adaptive_questions q where q.number in (5, 6);
insert into public.student_question_state (
  student_id, question_id, times_seen, times_correct, consecutive_correct,
  consecutive_incorrect, last_result, last_seen_at, next_review_at, interval_days, state
)
select
  'c1111111-1111-4111-8111-111111111111', q.question_id, 3, 3, 3, 0, true,
  now() - interval '11 days', now() - interval '1 day', 10, 'secure'
from adaptive_questions q where q.number = 9;

create temporary table adaptive_session (id uuid primary key);
grant select, insert on table adaptive_session to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c1111111-1111-4111-8111-111111111111', true);
insert into adaptive_session
select public.create_study_session('20000000-0000-4000-8000-000000000001', 10, null);
select is((select count(*)::integer from adaptive_session), 1, 'student creates an adaptive session');
select is((select count(*)::integer from public.study_session_questions where session_id = (select id from adaptive_session)), 10, 'adaptive session contains ten unique questions');
select is((select count(*)::integer from public.study_session_questions where session_id = (select id from adaptive_session) and selection_reason = 'weak_topic'), 4, 'weak topics receive forty percent');
select is((select count(*)::integer from public.study_session_questions where session_id = (select id from adaptive_session) and selection_reason = 'recently_missed'), 2, 'recently missed questions receive twenty percent');
select is((select count(*)::integer from public.study_session_questions where session_id = (select id from adaptive_session) and selection_reason = 'developing_topic'), 2, 'developing topics receive twenty percent');
select is((select count(*)::integer from public.study_session_questions where session_id = (select id from adaptive_session) and selection_reason = 'retention_check'), 1, 'retention checks receive ten percent');
select is((select count(*)::integer from public.study_session_questions where session_id = (select id from adaptive_session) and selection_reason = 'new_or_harder'), 1, 'new or harder material receives ten percent');
select is((select count(distinct question_id)::integer from public.study_session_questions where session_id = (select id from adaptive_session)), 10, 'adaptive selection never duplicates a question');

select is(
  (select is_correct from public.submit_answer(
    (select sq.id from public.study_session_questions sq join adaptive_questions q on q.question_id = sq.question_id
     where sq.session_id = (select id from adaptive_session) and q.number between 1 and 4
     order by sq.position limit 1),
    (select q.wrong_choice_id from public.study_session_questions sq join adaptive_questions q on q.question_id = sq.question_id
     where sq.session_id = (select id from adaptive_session) and q.number between 1 and 4
     order by sq.position limit 1), 1000, 5::smallint
  )),
  false,
  'secure submission grades the adaptive answer'
);
select is(
  (select qs.times_seen from public.student_question_state qs
   join public.study_session_questions sq on sq.question_id = qs.question_id
   join adaptive_questions q on q.question_id = sq.question_id
   where sq.session_id = (select id from adaptive_session) and q.number between 1 and 4
   order by sq.position limit 1),
  1,
  'submission creates question state'
);
select is(
  (select qs.interval_days from public.student_question_state qs
   join public.study_session_questions sq on sq.question_id = qs.question_id
   join adaptive_questions q on q.question_id = sq.question_id
   where sq.session_id = (select id from adaptive_session) and q.number between 1 and 4
   order by sq.position limit 1),
  1,
  'incorrect question schedules next-day review'
);
select is((select mastery_score from public.student_topic_mastery where topic_id = 'c4000000-0000-4000-8000-000000000001'), 20.00::numeric, 'confident medium miss decreases topic mastery deterministically');
select is(
  (select count(*)::integer from public.study_session_questions sq join adaptive_questions q on q.question_id = sq.question_id
   where sq.session_id = (select id from adaptive_session) and q.number between 1 and 4 and sq.selection_reason = 'same_session_remediation'),
  1,
  'a later related question is marked for same-session remediation'
);
select lives_ok(
  $$select * from public.submit_answer(
    (select sq.id from public.study_session_questions sq join adaptive_questions q on q.question_id = sq.question_id
     where sq.session_id = (select id from adaptive_session) and q.number between 1 and 4
     order by sq.position limit 1),
    (select q.wrong_choice_id from public.study_session_questions sq join adaptive_questions q on q.question_id = sq.question_id
     where sq.session_id = (select id from adaptive_session) and q.number between 1 and 4
     order by sq.position limit 1), 1000, 5::smallint
  )$$,
  'retrying the same submission remains idempotent'
);
select is(
  (select qs.times_seen from public.student_question_state qs
   join public.study_session_questions sq on sq.question_id = qs.question_id
   join adaptive_questions q on q.question_id = sq.question_id
   where sq.session_id = (select id from adaptive_session) and q.number between 1 and 4
   order by sq.position limit 1),
  1,
  'idempotent retry does not double-update mastery'
);

select set_config('request.jwt.claim.sub', 'c2222222-2222-4222-8222-222222222222', true);
select is((select count(*)::integer from public.student_question_state), 0, 'another student cannot read question state');
select is((select count(*)::integer from public.student_topic_mastery), 0, 'another student cannot read topic mastery');
select throws_ok(
  $$insert into public.student_topic_mastery (student_id, topic_id) values (
    'c2222222-2222-4222-8222-222222222222', 'c4000000-0000-4000-8000-000000000005'
  )$$,
  '42501', 'permission denied for table student_topic_mastery', 'students cannot forge mastery'
);

select set_config('request.jwt.claim.sub', 'c1111111-1111-4111-8111-111111111111', true);
create temporary table new_topic_sessions (id uuid primary key);
grant select, insert on table new_topic_sessions to authenticated;
insert into new_topic_sessions select public.create_study_session(
  '20000000-0000-4000-8000-000000000001', 1, 'c4000000-0000-4000-8000-000000000005'
);
select is(
  (select is_correct from public.submit_answer(
    (select sq.id from public.study_session_questions sq where sq.session_id = (select id from new_topic_sessions)),
    (select wrong_choice_id from adaptive_questions where number = 10), 1000, 3::smallint
  )),
  false,
  'first miss on a new concept is recorded'
);
delete from new_topic_sessions;
insert into new_topic_sessions select public.create_study_session(
  '20000000-0000-4000-8000-000000000001', 1, 'c4000000-0000-4000-8000-000000000005'
);
select lives_ok(
  $$select * from public.submit_answer(
    (select sq.id from public.study_session_questions sq where sq.session_id = (select id from new_topic_sessions)),
    (select wrong_choice_id from adaptive_questions where number = 10), 1000, 3::smallint
  )$$,
  'the same concept can be reviewed in a later session'
);
select is((select state::text from public.student_question_state where question_id = (select question_id from adaptive_questions where number = 10)), 'needs_review', 'repeated misses keep the question in review');
select is((select consecutive_incorrect from public.student_question_state where question_id = (select question_id from adaptive_questions where number = 10)), 2, 'repeated misses are counted deterministically');

reset role;
select * from finish();
rollback;

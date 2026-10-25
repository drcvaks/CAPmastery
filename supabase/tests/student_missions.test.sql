begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

select has_table('public', 'student_mission_preferences', 'mission preferences table exists');
select ok((select relrowsecurity from pg_class where oid = 'public.student_mission_preferences'::regclass), 'preferences use RLS');
select is(has_table_privilege('authenticated', 'public.student_mission_preferences', 'INSERT,UPDATE,DELETE'), false, 'direct preference writes are denied');
select is(has_function_privilege('anon', 'public.get_student_missions(text)', 'execute'), false, 'anonymous mission access is denied');
select is(has_function_privilege('anon', 'public.set_student_weekly_mission(integer)', 'execute'), false, 'anonymous goal changes are denied');

insert into auth.users(id, email, raw_user_meta_data, aud, role) values
('af100000-0000-4000-8000-000000000001', 'mission-one@example.test', '{}', 'authenticated', 'authenticated'),
('af100000-0000-4000-8000-000000000002', 'mission-two@example.test', '{}', 'authenticated', 'authenticated'),
('af100000-0000-4000-8000-000000000003', 'mission-other@example.test', '{}', 'authenticated', 'authenticated');
insert into public.user_roles(user_id, role) values
('af100000-0000-4000-8000-000000000001', 'student'),
('af100000-0000-4000-8000-000000000002', 'student');

insert into public.questions(id, exam_id, topic_id, question_text, difficulty, cognitive_level, created_by)
values ('af200000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001',
'40000000-0000-4000-8000-000000000001', 'Synthetic mission question?', 'easy', 'recall', 'af100000-0000-4000-8000-000000000001');
insert into public.question_choices(id, question_id, choice_key, choice_text, sort_order)
values ('af300000-0000-4000-8000-000000000001', 'af200000-0000-4000-8000-000000000001', 'A', 'Synthetic choice', 0);
insert into public.study_sessions(id, student_id, exam_id, requested_count, question_count)
values ('af400000-0000-4000-8000-000000000001', 'af100000-0000-4000-8000-000000000001',
'20000000-0000-4000-8000-000000000001', 10, 10);
insert into public.study_session_questions(id, session_id, question_id, position, question_version)
values ('af500000-0000-4000-8000-000000000001', 'af400000-0000-4000-8000-000000000001',
'af200000-0000-4000-8000-000000000001', 1, 1);
insert into public.question_attempts(session_id, session_question_id, student_id, question_id, selected_choice_id, is_correct, response_time_ms, submitted_at)
values ('af400000-0000-4000-8000-000000000001', 'af500000-0000-4000-8000-000000000001',
'af100000-0000-4000-8000-000000000001', 'af200000-0000-4000-8000-000000000001',
'af300000-0000-4000-8000-000000000001', false, 1000, now());

-- The same source question in an older session is valid history, but belongs to
-- neither the current local day nor the current UTC week.
insert into public.study_sessions(id, student_id, exam_id, requested_count, question_count)
values ('af400000-0000-4000-8000-000000000002', 'af100000-0000-4000-8000-000000000001',
'20000000-0000-4000-8000-000000000001', 10, 10);
insert into public.study_session_questions(id, session_id, question_id, position, question_version)
values ('af500000-0000-4000-8000-000000000002', 'af400000-0000-4000-8000-000000000002',
'af200000-0000-4000-8000-000000000001', 1, 1);
insert into public.question_attempts(session_id, session_question_id, student_id, question_id, selected_choice_id, is_correct, response_time_ms, submitted_at)
values ('af400000-0000-4000-8000-000000000002', 'af500000-0000-4000-8000-000000000002',
'af100000-0000-4000-8000-000000000001', 'af200000-0000-4000-8000-000000000001',
'af300000-0000-4000-8000-000000000001', true, 1000,
(date_trunc('week', now() at time zone 'UTC') - interval '1 day') at time zone 'UTC');
update public.study_sessions set status = 'abandoned'
where id = 'af400000-0000-4000-8000-000000000002';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'af100000-0000-4000-8000-000000000003', true);
select throws_ok($$select public.get_student_missions('UTC')$$, '42501', 'Student role required', 'non-student cannot read missions');
select throws_ok($$select public.set_student_weekly_mission(100)$$, '42501', 'Student role required', 'non-student cannot save goals');
select set_config('request.jwt.claim.sub', 'af100000-0000-4000-8000-000000000001', true);
select is((public.get_student_missions('UTC')->>'weekly_goal')::integer, 50, 'new students default to Standard');
select lives_ok($$select public.set_student_weekly_mission(25)$$, 'Light goal is saved');
select is((public.get_student_missions('UTC')->>'weekly_goal')::integer, 25, 'goal persists');
select throws_ok($$select public.set_student_weekly_mission(26)$$, '22023', 'Weekly goal must be 25, 50, or 100', 'unsupported goals are rejected');
select is((public.get_student_missions('UTC')->>'today_count')::integer, 1, 'incorrect answers count toward daily effort');
select is((public.get_student_missions('UTC')->>'weekly_count')::integer, 1, 'current answer counts once toward weekly effort');
select is(public.get_student_missions('UTC')->>'active_session_id', 'af400000-0000-4000-8000-000000000001', 'active owned study session can be resumed');
select throws_ok($$select public.get_student_missions('Invalid/Timezone')$$, '22023', 'Invalid timezone', 'invalid timezone is rejected');
select set_config('request.jwt.claim.sub', 'af100000-0000-4000-8000-000000000002', true);
select is((public.get_student_missions('UTC')->>'today_count')::integer, 0, 'another student cannot see first student effort');
select is((select count(*)::integer from public.student_mission_preferences), 0, 'RLS hides another student goal');
select is((public.get_student_missions('UTC')->>'weekly_goal')::integer, 50, 'another student retains their own default goal');
select * from finish();
rollback;

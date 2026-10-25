begin;
create extension if not exists pgtap with schema extensions;
select plan(14);
select has_function('public', 'get_student_mission_tracks', array[]::text[], 'mission track projection exists');
select is(has_function_privilege('anon', 'public.get_student_mission_tracks()', 'execute'), false, 'anonymous users cannot read track coverage');

insert into auth.users(id, email, raw_user_meta_data, aud, role) values
('af610000-0000-4000-8000-000000000001', 'track-one@example.test', '{}', 'authenticated', 'authenticated'),
('af610000-0000-4000-8000-000000000002', 'track-two@example.test', '{}', 'authenticated', 'authenticated'),
('af610000-0000-4000-8000-000000000003', 'track-other@example.test', '{}', 'authenticated', 'authenticated');
insert into public.user_roles(user_id, role) values
('af610000-0000-4000-8000-000000000001', 'student'),
('af610000-0000-4000-8000-000000000002', 'student');
insert into public.topics(id, exam_id, code, title, status) values
('af620000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'MISSION_TRACK_A', 'Track Chapter A', 'active'),
('af620000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'MISSION_TRACK_B', 'Track Chapter B', 'active');
insert into public.questions(id, exam_id, topic_id, question_text, difficulty, cognitive_level, created_by, import_package)
select md5('track-coverage-question-' || n)::uuid,
 case when n <= 5 then '20000000-0000-4000-8000-000000000001'::uuid else '20000000-0000-4000-8000-000000000002'::uuid end,
 case when n <= 5 then 'af620000-0000-4000-8000-000000000001'::uuid else 'af620000-0000-4000-8000-000000000002'::uuid end,
 'Synthetic track question ' || n, 'easy', 'recall', 'af610000-0000-4000-8000-000000000001',
 case when n <= 5 then 'MISSION_TRACK_A' else 'MISSION_TRACK_B' end
from generate_series(1, 10) n;
insert into public.pilot_package_assignments(student_id, import_package, assigned_by) values
('af610000-0000-4000-8000-000000000001', 'MISSION_TRACK_A', 'af610000-0000-4000-8000-000000000001'),
('af610000-0000-4000-8000-000000000001', 'MISSION_TRACK_B', 'af610000-0000-4000-8000-000000000001'),
('af610000-0000-4000-8000-000000000002', 'MISSION_TRACK_A', 'af610000-0000-4000-8000-000000000001');
insert into public.study_sessions(id, student_id, exam_id, requested_count, question_count) values
('af630000-0000-4000-8000-000000000001', 'af610000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 5, 5),
('af630000-0000-4000-8000-000000000002', 'af610000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 5, 5),
('af630000-0000-4000-8000-000000000003', 'af610000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 5, 5);
update public.study_sessions set status = 'abandoned' where id = 'af630000-0000-4000-8000-000000000003';
insert into public.question_choices(id, question_id, choice_key, choice_text, sort_order)
values ('af640000-0000-4000-8000-000000000001', md5('track-coverage-question-1')::uuid, 'A', 'Synthetic choice', 0);
insert into public.study_session_questions(id, session_id, question_id, position, question_version) values
('af650000-0000-4000-8000-000000000001', 'af630000-0000-4000-8000-000000000001', md5('track-coverage-question-1')::uuid, 1, 1),
('af650000-0000-4000-8000-000000000003', 'af630000-0000-4000-8000-000000000003', md5('track-coverage-question-1')::uuid, 1, 1);
insert into public.question_attempts(session_id, session_question_id, student_id, question_id, selected_choice_id, is_correct, response_time_ms) values
('af630000-0000-4000-8000-000000000001', 'af650000-0000-4000-8000-000000000001', 'af610000-0000-4000-8000-000000000001', md5('track-coverage-question-1')::uuid, 'af640000-0000-4000-8000-000000000001', false, 1000),
('af630000-0000-4000-8000-000000000003', 'af650000-0000-4000-8000-000000000003', 'af610000-0000-4000-8000-000000000001', md5('track-coverage-question-1')::uuid, 'af640000-0000-4000-8000-000000000001', true, 1000);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'af610000-0000-4000-8000-000000000003', true);
select throws_ok($$select public.get_student_mission_tracks()$$, '42501', 'Student role required', 'non-student is denied');
select set_config('request.jwt.claim.sub', 'af610000-0000-4000-8000-000000000001', true);
select is((select count(*)::integer from jsonb_array_elements(public.get_student_mission_tracks()) r where r->>'id' in ('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002')), 2, 'both assigned tracks are returned');
select is((select r->>'active_session_id' from jsonb_array_elements(public.get_student_mission_tracks()) r where r->>'id'='20000000-0000-4000-8000-000000000001'), 'af630000-0000-4000-8000-000000000001', 'Leadership resumes its own mission');
select is((select r->>'active_session_id' from jsonb_array_elements(public.get_student_mission_tracks()) r where r->>'id'='20000000-0000-4000-8000-000000000002'), 'af630000-0000-4000-8000-000000000002', 'Aerospace resumes its own mission');
select is((select (s->>'practiced_count')::integer from jsonb_array_elements(public.get_student_mission_tracks()) r cross join lateral jsonb_array_elements(r->'sections') s where s->>'topic_id'='af620000-0000-4000-8000-000000000001'), 1, 'repeat answers count once toward distinct coverage');
select is((select (s->>'available_count')::integer from jsonb_array_elements(public.get_student_mission_tracks()) r cross join lateral jsonb_array_elements(r->'sections') s where s->>'topic_id'='af620000-0000-4000-8000-000000000001'), 5, 'chapter denominator uses accessible questions');
select is((select (s->>'practiced_count')::integer from jsonb_array_elements(public.get_student_mission_tracks()) r cross join lateral jsonb_array_elements(r->'sections') s where s->>'topic_id'='af620000-0000-4000-8000-000000000002'), 0, 'untouched chapters show zero coverage');
select ok(not exists(select 1 from jsonb_array_elements(public.get_student_mission_tracks()) r where r ? 'correct_count' or r ? 'readiness_score'), 'coverage does not expose correctness or infer readiness');
select set_config('request.jwt.claim.sub', 'af610000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from jsonb_array_elements(public.get_student_mission_tracks()) r cross join lateral jsonb_array_elements(r->'sections') s where s->>'topic_id'='af620000-0000-4000-8000-000000000002'), 0, 'unassigned private chapters stay hidden');
select is((select (s->>'practiced_count')::integer from jsonb_array_elements(public.get_student_mission_tracks()) r cross join lateral jsonb_array_elements(r->'sections') s where s->>'topic_id'='af620000-0000-4000-8000-000000000001'), 0, 'coverage never includes another student answers');
select is((select count(*)::integer from jsonb_array_elements(public.get_student_mission_tracks()) r where r->>'active_session_id' is not null), 0, 'another student cannot resume private sessions');
select ok(has_function_privilege('authenticated', 'public.get_student_mission_tracks()', 'execute'), 'authenticated grant reaches protected entrypoint');
select * from finish();
rollback;

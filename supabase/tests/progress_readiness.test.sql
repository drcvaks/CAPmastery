begin;

create extension if not exists pgtap with schema extensions;
select plan(34);

select has_function('public', 'get_progress_students', array[]::text[], 'progress student access function exists');
select has_function('public', 'get_progress_dashboard', array['uuid', 'uuid'], 'readiness dashboard function exists');
select has_function('public', 'get_topic_progress', array['uuid', 'uuid'], 'topic detail function exists');
select has_function('public', 'get_progress_trends', array['uuid', 'uuid', 'integer'], 'trend function exists');
select is(private.readiness_coverage_cap(5, 100), 40::numeric, 'five perfect answers remain capped at forty');
select is(private.readiness_coverage_cap(10, 49), 65::numeric, 'low coverage caps readiness at sixty-five');
select is(private.readiness_coverage_cap(20, 69), 79::numeric, 'partial coverage caps readiness below strong');
select is(private.readiness_coverage_cap(30, 70), 100::numeric, 'broad evidence removes the cap');
select is(private.readiness_label(49), 'Developing', 'low readiness uses supportive developing label');
select is(private.readiness_score(0, 0, 0, 40, 0, 0, 2), 0::numeric, 'zero attempts produce zero readiness');
select is(private.readiness_label(0, 0), 'Not started', 'zero attempts use the not-started label');
select is(
  private.readiness_score(5, 100, 100, 100, 100, 0, 2),
  40::numeric,
  'readiness score enforces the few-question cap'
);

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
values
  ('d1111111-1111-4111-8111-111111111111', 'progress-one@example.test', '{"display_name":"Progress One"}', '{}', 'authenticated', 'authenticated'),
  ('d2222222-2222-4222-8222-222222222222', 'progress-two@example.test', '{"display_name":"Progress Two"}', '{}', 'authenticated', 'authenticated'),
  ('d3333333-3333-4333-8333-333333333333', 'progress-parent@example.test', '{"display_name":"Progress Parent"}', '{}', 'authenticated', 'authenticated'),
  ('d4444444-4444-4444-8444-444444444444', 'progress-reviewer@example.test', '{"display_name":"Progress Reviewer"}', '{}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role, created_by)
values
  ('d1111111-1111-4111-8111-111111111111', 'student', 'd4444444-4444-4444-8444-444444444444'),
  ('d2222222-2222-4222-8222-222222222222', 'student', 'd4444444-4444-4444-8444-444444444444'),
  ('d3333333-3333-4333-8333-333333333333', 'parent', 'd4444444-4444-4444-8444-444444444444'),
  ('d4444444-4444-4444-8444-444444444444', 'content_reviewer', 'd4444444-4444-4444-8444-444444444444');
select is(
  (select count(*)::integer from public.profiles where id in (
    'd1111111-1111-4111-8111-111111111111',
    'd2222222-2222-4222-8222-222222222222',
    'd3333333-3333-4333-8333-333333333333',
    'd4444444-4444-4444-8444-444444444444'
  )),
  4,
  'auth trigger creates all progress fixture profiles'
);
insert into public.student_guardian_links (
  student_id, guardian_id, relationship_type, status,
  can_view_progress, can_assign_content, can_manage_challenges, created_by
) values
  ('d1111111-1111-4111-8111-111111111111', 'd3333333-3333-4333-8333-333333333333', 'parent', 'active', true, false, false, 'd4444444-4444-4444-8444-444444444444'),
  ('d2222222-2222-4222-8222-222222222222', 'd3333333-3333-4333-8333-333333333333', 'parent', 'active', true, false, false, 'd4444444-4444-4444-8444-444444444444');

insert into public.exams (id, program_id, code, title, status, sort_order)
values (
  'd4000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'PROGRESS_TEST',
  'Progress transaction-only exam',
  'active',
  900
);

insert into public.topics (id, exam_id, code, title, status, sort_order)
values
  ('d5000000-0000-4000-8000-000000000001', 'd4000000-0000-4000-8000-000000000001', 'PROGRESS_WEAK', 'Progress weak topic', 'active', 200),
  ('d5000000-0000-4000-8000-000000000002', 'd4000000-0000-4000-8000-000000000001', 'PROGRESS_NEW', 'Progress new topic', 'active', 201);
insert into public.pilot_package_assignments (student_id, import_package, assigned_by)
values
  ('d1111111-1111-4111-8111-111111111111', 'PROGRESS_TEST', 'd4444444-4444-4444-8444-444444444444'),
  ('d2222222-2222-4222-8222-222222222222', 'PROGRESS_TEST', 'd4444444-4444-4444-8444-444444444444');

create temporary table progress_questions (number integer primary key, question_id uuid not null);
grant select on table progress_questions to authenticated;
do $$
declare
  i integer;
  q_id uuid;
begin
  for i in 1..30 loop
    q_id := gen_random_uuid();
    insert into public.questions (
      id, exam_id, topic_id, source_reference, question_text, difficulty,
      cognitive_level, created_by, external_id, import_package, source_status
    ) values (
      q_id, 'd4000000-0000-4000-8000-000000000001',
      case when i <= 15 then 'd5000000-0000-4000-8000-000000000001'::uuid
        else 'd5000000-0000-4000-8000-000000000002'::uuid end,
      'Progress fixture source', 'Progress fixture question ' || i || '?',
      'medium', 'understanding', 'd4444444-4444-4444-8444-444444444444',
      'PROGRESS-Q' || lpad(i::text, 3, '0'), 'PROGRESS_TEST', 'approved_source'
    );
    insert into progress_questions values (i, q_id);
  end loop;
end;
$$;

insert into public.student_question_state (
  student_id, question_id, times_seen, times_correct, consecutive_correct,
  consecutive_incorrect, last_result, last_seen_at, next_review_at, interval_days, state
)
select
  'd1111111-1111-4111-8111-111111111111', q.question_id, 1,
  case when q.number <= 3 then 1 else 0 end,
  case when q.number <= 3 then 1 else 0 end,
  case when q.number > 3 then 1 else 0 end,
  q.number <= 3, now() - interval '1 day',
  case when q.number > 3 then now() - interval '1 hour' else now() + interval '1 day' end,
  case when q.number > 3 then 1 else 2 end,
  case when q.number > 3 then 'needs_review'::public.question_learning_state else 'learning'::public.question_learning_state end
from progress_questions q where q.number <= 5;
insert into public.student_topic_mastery (
  student_id, topic_id, attempts_count, correct_count, recent_accuracy,
  mastery_score, confidence_score, retention_score, consecutive_correct,
  consecutive_incorrect, last_practiced_at, next_review_at, status
) values (
  'd1111111-1111-4111-8111-111111111111', 'd5000000-0000-4000-8000-000000000001',
  5, 3, 55, 32, 35, 30, 0, 2, now() - interval '1 day', now() - interval '1 hour', 'needs_review'
);

insert into public.question_choices (id, question_id, choice_key, choice_text, sort_order)
select 'd6000000-0000-4000-8000-000000000001', question_id, 'A', 'Progress choice', 0
from progress_questions where number = 1;
insert into public.study_sessions (
  id, student_id, exam_id, mode, status, requested_count, question_count,
  answered_count, correct_count, started_at, completed_at
) values (
  'd7000000-0000-4000-8000-000000000001', 'd1111111-1111-4111-8111-111111111111',
  'd4000000-0000-4000-8000-000000000001', 'study', 'completed', 1, 1, 1, 1,
  now() - interval '1 hour', now() - interval '1 hour'
);
insert into public.study_session_questions (
  id, session_id, question_id, position, selection_reason, question_version
)
select
  'd8000000-0000-4000-8000-000000000001', 'd7000000-0000-4000-8000-000000000001',
  question_id, 1, 'weak_topic', 1
from progress_questions where number = 1;
insert into public.question_attempts (
  session_id, session_question_id, student_id, question_id, selected_choice_id,
  is_correct, response_time_ms, submitted_at
)
select
  'd7000000-0000-4000-8000-000000000001', 'd8000000-0000-4000-8000-000000000001',
  'd1111111-1111-4111-8111-111111111111', question_id,
  'd6000000-0000-4000-8000-000000000001', true, 1000, now() - interval '1 hour'
from progress_questions where number = 1;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1111111-1111-4111-8111-111111111111', true);
select is((select count(*)::integer from public.get_progress_students()), 1, 'student sees only self in progress selector');
select is((select count(*)::integer from public.get_progress_dashboard('d1111111-1111-4111-8111-111111111111', 'd4000000-0000-4000-8000-000000000001')), 1, 'student reads personal dashboard');
select is((select count(*)::integer from public.get_progress_dashboard('d2222222-2222-4222-8222-222222222222', 'd4000000-0000-4000-8000-000000000001')), 0, 'student cannot read another student dashboard');
select is((select eligible_question_count from public.get_progress_dashboard('d1111111-1111-4111-8111-111111111111', 'd4000000-0000-4000-8000-000000000001')), 30, 'dashboard counts thirty eligible questions');
select is((select attempted_question_count from public.get_progress_dashboard('d1111111-1111-4111-8111-111111111111', 'd4000000-0000-4000-8000-000000000001')), 5, 'dashboard counts five covered questions');
select ok((select readiness_score <= 40 from public.get_progress_dashboard('d1111111-1111-4111-8111-111111111111', 'd4000000-0000-4000-8000-000000000001')), 'few-question readiness remains capped');
select is((select readiness_label from public.get_progress_dashboard('d1111111-1111-4111-8111-111111111111', 'd4000000-0000-4000-8000-000000000001')), 'Developing', 'dashboard exposes supportive readiness label');
select is((select weak_topic_count from public.get_progress_dashboard('d1111111-1111-4111-8111-111111111111', 'd4000000-0000-4000-8000-000000000001')), 1, 'weak topic is visible');
select is((select recommended_topic_title from public.get_progress_dashboard('d1111111-1111-4111-8111-111111111111', 'd4000000-0000-4000-8000-000000000001')), 'Progress weak topic', 'recommended weak topic is visible');
select is((select count(*)::integer from public.get_topic_progress('d1111111-1111-4111-8111-111111111111', 'd4000000-0000-4000-8000-000000000001')), 2, 'topic detail includes practiced and unstarted topics');
select is((select count(*)::integer from public.get_progress_trends('d1111111-1111-4111-8111-111111111111', 'd4000000-0000-4000-8000-000000000001', 30)), 1, 'trend returns the recent activity day');

select set_config('request.jwt.claim.sub', 'd3333333-3333-4333-8333-333333333333', true);
select is((select count(*)::integer from public.get_progress_students()), 2, 'linked parent sees both linked children');
select is((select count(*)::integer from public.get_progress_dashboard('d1111111-1111-4111-8111-111111111111', 'd4000000-0000-4000-8000-000000000001')), 1, 'linked parent reads first child dashboard');
select is((select count(*)::integer from public.get_progress_dashboard('d2222222-2222-4222-8222-222222222222', 'd4000000-0000-4000-8000-000000000001')), 1, 'linked parent reads second child dashboard');
select is((select readiness_score from public.get_progress_dashboard('d2222222-2222-4222-8222-222222222222', 'd4000000-0000-4000-8000-000000000001')), 0::numeric, 'unpracticed child has zero readiness');
select is((select readiness_label from public.get_progress_dashboard('d2222222-2222-4222-8222-222222222222', 'd4000000-0000-4000-8000-000000000001')), 'Not started', 'unpracticed child is labeled not started');
select is((select count(*)::integer from public.get_topic_progress('d1111111-1111-4111-8111-111111111111', 'd4000000-0000-4000-8000-000000000001')), 2, 'linked parent reads authorized topic detail');
select is((select count(*)::integer from public.student_topic_mastery), 0, 'parent still cannot directly select private mastery rows');
select throws_ok(
  $$select * from public.get_progress_trends(
    'd1111111-1111-4111-8111-111111111111',
    'd4000000-0000-4000-8000-000000000001', 2
  )$$,
  '22023', 'Trend range must be between 7 and 180 days', 'trend range is bounded'
);

select set_config('request.jwt.claim.sub', 'd4444444-4444-4444-8444-444444444444', true);
select is((select count(*)::integer from public.get_progress_students()), 0, 'unlinked reviewer sees no students');
select is((select count(*)::integer from public.get_progress_dashboard('d1111111-1111-4111-8111-111111111111', 'd4000000-0000-4000-8000-000000000001')), 0, 'unlinked reviewer cannot read a student dashboard');

reset role;
select * from finish();
rollback;

begin;

create extension if not exists pgtap with schema extensions;
select plan(67);

select has_table('public', 'achievements', 'achievement definitions exist');
select has_table('public', 'student_achievements', 'student achievement awards exist');
select has_table('public', 'challenges', 'private challenges exist');
select has_table('public', 'challenge_question_sets', 'shared challenge sets exist');
select has_table('public', 'challenge_participants', 'challenge participants exist');
select has_table('public', 'challenge_results', 'supportive challenge results exist');
select has_table('public', 'encouragements', 'predefined encouragements exist');
select is(
  (
    select count(*)::integer
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'achievements', 'student_achievements', 'challenges',
        'challenge_question_sets', 'challenge_participants',
        'challenge_results', 'encouragements'
      )
      and c.relrowsecurity
  ),
  7,
  'RLS is enabled on every motivation table'
);
select is(has_table_privilege('authenticated', 'public.achievements', 'insert'), false, 'clients cannot insert achievement definitions');
select is(has_table_privilege('authenticated', 'public.student_achievements', 'insert'), false, 'clients cannot award achievements');
select is(has_table_privilege('authenticated', 'public.challenges', 'insert'), false, 'clients cannot directly insert challenges');
select is(has_table_privilege('authenticated', 'public.challenge_question_sets', 'insert'), false, 'clients cannot alter shared question sets');
select is(has_table_privilege('authenticated', 'public.challenge_participants', 'insert'), false, 'clients cannot directly add participants');
select is(has_table_privilege('authenticated', 'public.challenge_results', 'insert'), false, 'clients cannot write results');
select is(has_table_privilege('authenticated', 'public.encouragements', 'insert'), false, 'clients cannot bypass predefined reaction RPC');
select has_function('public', 'get_challenge_creation_students', array[]::text[], 'challenge student picker function exists');
select has_function('public', 'get_challenge_creation_exams', array['uuid[]'], 'challenge exam picker function exists');
select has_function(
  'public', 'create_private_challenge',
  array['text', 'uuid', 'uuid[]', 'integer', 'timestamp with time zone'],
  'private challenge creation function exists'
);
select has_function('public', 'get_private_challenges', array[]::text[], 'private challenge reader exists');
select has_function(
  'public', 'send_challenge_encouragement',
  array['uuid', 'uuid', 'encouragement_reaction'],
  'encouragement function exists'
);
select has_function('public', 'get_student_achievements', array['uuid'], 'achievement reader exists');
select ok(
  has_function_privilege(
    'authenticated',
    'private.can_view_motivation_student(uuid)',
    'execute'
  ),
  'authenticated RLS evaluation may execute the motivation access helper'
);
select ok(
  has_function_privilege(
    'authenticated',
    'private.can_access_challenge(uuid)',
    'execute'
  ),
  'authenticated RLS evaluation may execute the challenge access helper'
);
select is((select count(*)::integer from public.achievements), 7, 'seven supportive achievements are configured');
select is(
  (select count(*)::integer from unnest(enum_range(null::public.encouragement_reaction))),
  5,
  'only five predefined encouragement reactions are available'
);

insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role)
values
  ('91111111-1111-4111-8111-111111111111', 'challenge-parent@example.test', '{"display_name":"Challenge Parent"}', '{}', 'authenticated', 'authenticated'),
  ('92222222-2222-4222-8222-222222222222', 'challenge-student-one@example.test', '{"display_name":"Challenge Student One"}', '{}', 'authenticated', 'authenticated'),
  ('93333333-3333-4333-8333-333333333333', 'challenge-student-two@example.test', '{"display_name":"Challenge Student Two"}', '{}', 'authenticated', 'authenticated'),
  ('94444444-4444-4444-8444-444444444444', 'challenge-unrelated@example.test', '{"display_name":"Challenge Unrelated"}', '{}', 'authenticated', 'authenticated');
insert into public.user_roles (user_id, role, created_by)
values
  ('91111111-1111-4111-8111-111111111111', 'parent', '91111111-1111-4111-8111-111111111111'),
  ('92222222-2222-4222-8222-222222222222', 'student', '91111111-1111-4111-8111-111111111111'),
  ('93333333-3333-4333-8333-333333333333', 'student', '91111111-1111-4111-8111-111111111111'),
  ('94444444-4444-4444-8444-444444444444', 'student', '91111111-1111-4111-8111-111111111111');
insert into public.student_guardian_links (
  student_id, guardian_id, relationship_type, status,
  can_view_progress, can_manage_challenges, created_by
) values
  (
    '92222222-2222-4222-8222-222222222222',
    '91111111-1111-4111-8111-111111111111',
    'parent', 'active', true, true,
    '91111111-1111-4111-8111-111111111111'
  ),
  (
    '93333333-3333-4333-8333-333333333333',
    '91111111-1111-4111-8111-111111111111',
    'parent', 'active', true, true,
    '91111111-1111-4111-8111-111111111111'
  );
select is(
  (
    select count(*)::integer
    from public.profiles
    where id in (
      '91111111-1111-4111-8111-111111111111',
      '92222222-2222-4222-8222-222222222222',
      '93333333-3333-4333-8333-333333333333',
      '94444444-4444-4444-8444-444444444444'
    )
  ),
  4,
  'auth trigger creates challenge fixture profiles'
);

insert into public.concepts (id, topic_id, code, title, source_reference, status)
values (
  '95000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  'CHECKPOINT9_CONCEPT', 'Checkpoint 9 concept', 'Synthetic challenge source', 'active'
);
insert into public.question_families (id, exam_id, code, source_code, title, status)
values (
  '96000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'CHECKPOINT9_FAMILY', 'CHECKPOINT9', 'Checkpoint 9 family', 'active'
);

create temporary table challenge_questions (
  number integer primary key,
  question_id uuid not null,
  correct_choice_id uuid not null,
  wrong_choice_id uuid not null
);

do $$
declare
  item integer;
  question_id uuid;
  correct_id uuid;
  wrong_id uuid;
begin
  for item in 1..4 loop
    question_id := gen_random_uuid();
    correct_id := gen_random_uuid();
    wrong_id := gen_random_uuid();
    insert into public.questions (
      id, exam_id, topic_id, source_page_start, source_reference,
      question_text, difficulty, cognitive_level, question_family_id,
      estimated_time_seconds, created_by, external_id
    ) values (
      question_id,
      '20000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      item, 'Synthetic challenge source',
      'Synthetic challenge question ' || item || '?',
      'easy', 'recall',
      '96000000-0000-4000-8000-000000000001',
      30, '91111111-1111-4111-8111-111111111111',
      'CHECKPOINT9-Q' || item
    );
    insert into public.question_choices (id, question_id, choice_key, choice_text, sort_order)
    values
      (correct_id, question_id, 'A', 'Correct challenge choice', 0),
      (wrong_id, question_id, 'B', 'Wrong challenge choice', 1);
    insert into private.question_answer_keys (
      question_id, correct_choice_id, explanation, remediation, common_mistake, created_by
    ) values (
      question_id, correct_id, 'Synthetic challenge explanation.',
      'Review the challenge concept.', 'Confusing the two choices.',
      '91111111-1111-4111-8111-111111111111'
    );
    insert into private.question_choice_feedback (choice_id, feedback_text)
    values (wrong_id, 'This choice does not match the source.');
    insert into public.question_concepts (question_id, concept_id, is_primary)
    values (question_id, '95000000-0000-4000-8000-000000000001', true);
    if item <= 3 then
      update public.questions
      set review_status = 'approved', status = 'active',
          approved_by = '91111111-1111-4111-8111-111111111111', approved_at = now()
      where id = question_id;
    else
      update public.questions
      set import_package = 'CHECKPOINT9_PRIVATE'
      where id = question_id;
    end if;
    insert into challenge_questions values (item, question_id, correct_id, wrong_id);
  end loop;
end;
$$;

insert into public.pilot_package_assignments (
  student_id, import_package, assigned_by
) values
  (
    '92222222-2222-4222-8222-222222222222',
    'CHECKPOINT9_PRIVATE',
    '91111111-1111-4111-8111-111111111111'
  ),
  (
    '93333333-3333-4333-8333-333333333333',
    'CHECKPOINT9_PRIVATE',
    '91111111-1111-4111-8111-111111111111'
  );
select is(
  private.challenge_question_is_eligible(
    (select question_id from challenge_questions where number = 4),
    array[
      '92222222-2222-4222-8222-222222222222'::uuid,
      '94444444-4444-4444-8444-444444444444'::uuid
    ]
  ),
  false,
  'one student package assignment cannot expose a draft to another student'
);

create temporary table created_challenge (id uuid primary key);
grant select, insert on table created_challenge to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '91111111-1111-4111-8111-111111111111', true);
select is((select count(*)::integer from public.get_challenge_creation_students()), 2, 'parent can choose two actively linked students');
select is(
  (
    select count(*)::integer
    from public.get_challenge_creation_exams(array[
      '92222222-2222-4222-8222-222222222222'::uuid,
      '93333333-3333-4333-8333-333333333333'::uuid
    ])
    where exam_id = '20000000-0000-4000-8000-000000000001'
      and available_question_count >= 4
  ),
  1,
  'parent sees the approved and mutually assigned package questions'
);
select throws_ok(
  $$select public.create_private_challenge(
    'Invalid one-student challenge',
    '20000000-0000-4000-8000-000000000001',
    array['92222222-2222-4222-8222-222222222222'::uuid],
    4, now() + interval '7 days'
  )$$,
  '22023', 'A private family challenge requires exactly two students',
  'challenge requires exactly two students'
);

select set_config('request.jwt.claim.sub', '92222222-2222-4222-8222-222222222222', true);
select throws_ok(
  $$select public.create_private_challenge(
    'Student-created challenge',
    '20000000-0000-4000-8000-000000000001',
    array[
      '92222222-2222-4222-8222-222222222222'::uuid,
      '93333333-3333-4333-8333-333333333333'::uuid
    ],
    4, now() + interval '7 days'
  )$$,
  '42501', 'Not authorized', 'student cannot create a challenge'
);

select set_config('request.jwt.claim.sub', '91111111-1111-4111-8111-111111111111', true);
insert into created_challenge
select public.create_private_challenge(
  'Private Family Practice',
  '20000000-0000-4000-8000-000000000001',
  array[
    '92222222-2222-4222-8222-222222222222'::uuid,
    '93333333-3333-4333-8333-333333333333'::uuid
  ],
  4, now() + interval '7 days'
);
select is((select count(*)::integer from created_challenge), 1, 'parent creates a private challenge');
select is(
  (
    select count(*)::integer from public.challenge_participants
    where challenge_id = (select id from created_challenge)
  ),
  2,
  'challenge has exactly two participants'
);
reset role;
select is(
  (
    select count(*)::integer
    from public.study_sessions s
    join public.challenge_participants p on p.session_id = s.id
    where p.challenge_id = (select id from created_challenge)
      and s.mode = 'challenge'
  ),
  2,
  'each participant receives a separate challenge session'
);
select is(
  (
    select count(*)::integer
    from (
      select sq.position, sq.question_id, sq.question_version
      from public.study_session_questions sq
      join public.challenge_participants p on p.session_id = sq.session_id
      where p.challenge_id = (select id from created_challenge)
        and p.student_id = '92222222-2222-4222-8222-222222222222'
      except
      select sq.position, sq.question_id, sq.question_version
      from public.study_session_questions sq
      join public.challenge_participants p on p.session_id = sq.session_id
      where p.challenge_id = (select id from created_challenge)
        and p.student_id = '93333333-3333-4333-8333-333333333333'
    ) differences
  ),
  0,
  'both students receive identical question ids, versions, and order'
);
select is(
  (
    select count(*)::integer
    from public.challenge_question_sets
    where challenge_id = (select id from created_challenge)
  ),
  4,
  'shared challenge set includes the package question available to both students'
);
select is(
  (
    select count(*)::integer from public.audit_log
    where action = 'challenge.created'
      and entity_id = (select id from created_challenge)
  ),
  1,
  'challenge creation is audited'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '91111111-1111-4111-8111-111111111111', true);
select is(
  (
    select count(*)::integer from public.get_private_challenges()
    where challenge_id = (select id from created_challenge)
  ),
  2,
  'parent sees both private participant rows'
);
select is(
  (
    select count(*)::integer from public.get_private_challenges()
    where challenge_id = (select id from created_challenge)
      and score_percent is null and not results_revealed
  ),
  2,
  'parent sees no scores before both students finish'
);
select is((select count(*)::integer from public.challenge_results), 0, 'no result exists before completion');

select set_config('request.jwt.claim.sub', '92222222-2222-4222-8222-222222222222', true);
select is(
  (
    select count(*)::integer from public.get_private_challenges()
    where challenge_id = (select id from created_challenge)
  ),
  2,
  'participant sees the shared private challenge'
);
select is((select count(*)::integer from public.challenges), 1, 'participant passes challenge RLS');
select is(
  (
    select count(*)::integer
    from public.study_sessions s
    join public.challenge_participants p on p.session_id = s.id
    where p.challenge_id = (select id from created_challenge)
  ),
  1,
  'participant can read only their own challenge session'
);
select is(
  (
    select count(*)::integer
    from public.study_sessions s
    join public.challenge_participants p on p.session_id = s.id
    where p.challenge_id = (select id from created_challenge)
      and p.student_id = '93333333-3333-4333-8333-333333333333'
  ),
  0,
  'participant cannot read the other student session'
);
select lives_ok(
  $$select public.send_challenge_encouragement(
    (select id from created_challenge),
    '93333333-3333-4333-8333-333333333333',
    'keep_going'
  )$$,
  'participant sends a predefined encouragement'
);
select is(
  (
    select count(*)::integer from public.get_challenge_encouragements(
      (select id from created_challenge)
    )
  ),
  1,
  'participant sees the sent encouragement'
);

select set_config('request.jwt.claim.sub', '94444444-4444-4444-8444-444444444444', true);
select is((select count(*)::integer from public.get_challenge_creation_students()), 0, 'unrelated student has no challenge-management links');
select is((select count(*)::integer from public.get_private_challenges()), 0, 'unrelated student sees no private challenge rows');
select is((select count(*)::integer from public.challenges), 0, 'unrelated student is blocked by challenge RLS');
select throws_ok(
  $$select public.send_challenge_encouragement(
    (select id from created_challenge),
    '92222222-2222-4222-8222-222222222222',
    'great_effort'
  )$$,
  'P0002', 'Challenge not found', 'unrelated student cannot send a reaction'
);
select throws_ok(
  $$select * from public.get_student_achievements(
    '92222222-2222-4222-8222-222222222222'
  )$$,
  'P0002', 'Student achievements not found', 'unrelated student cannot read achievements'
);

reset role;
update public.challenge_participants
set baseline_accuracy = case
  when student_id = '92222222-2222-4222-8222-222222222222' then 20
  else 80 end
where challenge_id = (select id from created_challenge);
update public.study_sessions
set answered_count = 4, correct_count = 3, status = 'completed', completed_at = now()
where id = (
  select session_id from public.challenge_participants
  where challenge_id = (select id from created_challenge)
    and student_id = '92222222-2222-4222-8222-222222222222'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '91111111-1111-4111-8111-111111111111', true);
select is((select count(*)::integer from public.challenge_results), 0, 'first result is hidden by RLS until both finish');
select is(
  (
    select count(*)::integer from public.get_private_challenges()
    where challenge_id = (select id from created_challenge)
      and score_percent is null and not results_revealed
  ),
  2,
  'first completion does not reveal either score'
);

reset role;
select is(
  (
    select count(*)::integer from public.challenge_results
    where challenge_id = (select id from created_challenge)
  ),
  1,
  'first result is stored securely'
);
update public.study_sessions
set answered_count = 4, correct_count = 4, status = 'completed', completed_at = now()
where id = (
  select session_id from public.challenge_participants
  where challenge_id = (select id from created_challenge)
    and student_id = '93333333-3333-4333-8333-333333333333'
);
select is(
  (select status::text from public.challenges where id = (select id from created_challenge)),
  'completed',
  'challenge completes only after both participants finish'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '91111111-1111-4111-8111-111111111111', true);
select is(
  (
    select count(*)::integer from public.get_private_challenges()
    where challenge_id = (select id from created_challenge)
      and results_revealed and score_percent is not null
  ),
  2,
  'both supportive results unlock together'
);
select is((select count(*)::integer from public.challenge_results), 2, 'parent reads both completed results');
select is(
  (
    select total_points from public.challenge_results
    where student_id = '92222222-2222-4222-8222-222222222222'
  ),
  90,
  'completion, accuracy, and capped improvement produce positive points'
);
select is(
  (
    select total_points from public.challenge_results
    where student_id = '93333333-3333-4333-8333-333333333333'
  ),
  100,
  'positive point score is capped at one hundred'
);
select hasnt_column('public', 'challenge_results', 'rank', 'results do not store a public rank');
select hasnt_column('public', 'challenge_results', 'winner', 'results do not label a winner or lowest score');
select is(
  (
    select count(*)::integer
    from public.student_achievements sa
    join public.achievements a on a.id = sa.achievement_id
    where a.code = 'TEAM_FINISHER'
      and sa.student_id in (
        '92222222-2222-4222-8222-222222222222',
        '93333333-3333-4333-8333-333333333333'
      )
  ),
  2,
  'both participants earn team-finisher recognition'
);
select is(
  (
    select count(*)::integer
    from public.student_achievements sa
    join public.achievements a on a.id = sa.achievement_id
    where a.code = 'IMPROVEMENT_10'
      and sa.student_id in (
        '92222222-2222-4222-8222-222222222222',
        '93333333-3333-4333-8333-333333333333'
      )
  ),
  2,
  'both meaningful improvements earn recognition'
);
select is(
  (
    select count(*)::integer from public.get_student_achievements(
      '92222222-2222-4222-8222-222222222222'
    )
  ),
  7,
  'linked parent can read the full achievement catalog for a child'
);
select is(
  (
    select count(*)::integer from public.get_challenge_encouragements(
      (select id from created_challenge)
    )
  ),
  1,
  'challenge creator sees private encouragement activity'
);

reset role;
do $$
declare
  item integer;
  session_id uuid;
  session_question_id uuid;
  fixture_question uuid := (select question_id from challenge_questions where number = 1);
  fixture_choice uuid := (select correct_choice_id from challenge_questions where number = 1);
begin
  for item in 1..25 loop
    insert into public.study_sessions (
      student_id, exam_id, mode, requested_count, question_count
    ) values (
      '92222222-2222-4222-8222-222222222222',
      '20000000-0000-4000-8000-000000000001',
      'study', 1, 1
    ) returning id into session_id;
    insert into public.study_session_questions (
      session_id, question_id, position, selection_reason, question_version
    ) values (
      session_id, fixture_question, 1, 'basic_ordered', 1
    ) returning id into session_question_id;
    insert into public.question_attempts (
      session_id, session_question_id, student_id, question_id,
      selected_choice_id, is_correct, response_time_ms
    ) values (
      session_id, session_question_id,
      '92222222-2222-4222-8222-222222222222',
      fixture_question, fixture_choice, true, 1000
    );
  end loop;
end;
$$;
select is(
  (
    select count(*)::integer
    from public.student_achievements sa
    join public.achievements a on a.id = sa.achievement_id
    where a.code = 'PERSISTENCE_25'
      and sa.student_id = '92222222-2222-4222-8222-222222222222'
  ),
  1,
  'twenty-five answers automatically earn persistence recognition'
);
select is(
  (
    select count(*)::integer
    from public.student_achievements sa
    join public.achievements a on a.id = sa.achievement_id
    where a.code = 'FIRST_SESSION'
      and sa.student_id in (
        '92222222-2222-4222-8222-222222222222',
        '93333333-3333-4333-8333-333333333333'
      )
  ),
  2,
  'completing each challenge session earns first-step recognition'
);

select * from finish();
rollback;

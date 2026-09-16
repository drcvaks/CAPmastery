begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

select is(
  (select title from public.exams where code = 'EARHART_LEADERSHIP'),
  'Earhart Leadership',
  'Earhart Leadership exam track exists'
);
select is(
  (select sort_order from public.exams where code = 'EARHART_LEADERSHIP'),
  40,
  'Earhart Leadership follows the current three study tracks'
);
select is(
  (select sort_order from public.exams where code = 'WRIGHT_BROTHERS'),
  10,
  'Wright Brothers remains first'
);
select is(
  (select sort_order from public.exams where code = 'MITCHELL_LEADERSHIP'),
  20,
  'Mitchell Leadership remains second'
);
select is(
  (select sort_order from public.exams where code = 'MITCHELL_AEROSPACE'),
  30,
  'Mitchell Aerospace remains third'
);
select is(
  (
    select e.code
    from public.courses c
    join public.exams e on e.id = c.exam_id
    where c.code = 'EARHART_LTL'
  ),
  'EARHART_LEADERSHIP',
  'Earhart Learn to Lead course belongs to the Earhart track'
);
select ok(
  (
    select pg_get_constraintdef(oid)
    from pg_constraint
    where conrelid = 'public.questions'::regclass
      and conname = 'questions_style_reference_check'
  ) like '%Three Earhart Milestone Leadership exam forms used as style/difficulty reference only; no milestone question copied%',
  'Earhart style provenance is constrained'
);
select ok(
  (
    select pg_get_constraintdef(oid)
    from pg_constraint
    where conrelid = 'public.questions'::regclass
      and conname = 'questions_style_reference_check'
  ) like '%Three Earhart Milestone Leadership exam forms used only as style/difficulty references; no milestone question copied%',
  'Earhart Chapter 10 style provenance is constrained'
);
select is(
  (
    select count(*)::integer
    from public.practice_test_blueprints
    where exam_id = '20000000-0000-4000-8000-000000000004'
  ),
  0,
  'an Earhart exam is not exposed before its comprehensive blueprint is reviewed'
);
select is(
  (
    select count(*)::integer
    from public.questions q
    join public.question_families f on f.id = q.question_family_id
    where q.exam_id <> f.exam_id
  ),
  0,
  'every question family remains owned by the question exam'
);

select * from finish();
rollback;

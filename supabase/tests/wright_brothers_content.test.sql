begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

select is(
  (select title from public.exams where code = 'WRIGHT_BROTHERS'),
  'Wright Brothers',
  'Wright Brothers exam track exists'
);
select is(
  (select sort_order from public.exams where code = 'WRIGHT_BROTHERS'),
  10,
  'Wright Brothers is the first study track'
);
select is(
  (select sort_order from public.exams where code = 'MITCHELL_LEADERSHIP'),
  20,
  'Mitchell Leadership follows Wright Brothers'
);
select is(
  (select sort_order from public.exams where code = 'MITCHELL_AEROSPACE'),
  30,
  'Mitchell Aerospace follows Leadership'
);
select is(
  (
    select e.code
    from public.courses c
    join public.exams e on e.id = c.exam_id
    where c.code = 'WRIGHT_BROTHERS_LTL'
  ),
  'WRIGHT_BROTHERS',
  'Wright Brothers Learn to Lead course belongs to the new track'
);
select is(
  (
    select e.code
    from public.practice_test_blueprints b
    join public.exams e on e.id = b.exam_id
    where b.code = 'LTL1_C1_PILOT_10'
  ),
  'WRIGHT_BROTHERS',
  'temporary Chapter 1 practice test is rehomed without deletion'
);
select ok(
  (
    select pg_get_constraintdef(oid)
    from pg_constraint
    where conrelid = 'public.questions'::regclass
      and conname = 'questions_style_reference_check'
  ) like '%Wright Brothers milestone sample exams used as style/difficulty reference only%',
  'Wright Brothers style provenance is constrained'
);
select ok(
  (
    select pg_get_constraintdef(oid)
    from pg_constraint
    where conrelid = 'public.questions'::regclass
      and conname = 'questions_style_reference_check'
  ) like '%Three Wright Brothers Milestone exam forms used as style/difficulty reference only%',
  'Chapter 2 Wright Brothers style provenance is constrained'
);
select is(
  (select status::text from public.exams where code = 'WRIGHT_BROTHERS'),
  'active',
  'Wright Brothers track is active'
);
select is(
  (select status::text from public.courses where code = 'WRIGHT_BROTHERS_LTL'),
  'active',
  'Wright Brothers course is active'
);
select is(
  (select count(*)::integer from public.practice_test_blueprint_rules
   where blueprint_id = '70000000-0000-4000-8000-000000000001'),
  8,
  'rehome preserves all Chapter 1 pilot blueprint rules'
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

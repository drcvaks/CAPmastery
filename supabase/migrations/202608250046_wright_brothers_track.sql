insert into public.exams (
  id, program_id, code, title, description, sort_order, status
) values (
  '20000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000001',
  'WRIGHT_BROTHERS',
  'Wright Brothers',
  'Learn to Lead, Volume 1 study track for the Wright Brothers milestone.',
  10,
  'active'
)
on conflict (id) do update set
  code = excluded.code,
  title = excluded.title,
  description = excluded.description,
  sort_order = excluded.sort_order,
  status = excluded.status;

update public.exams
set sort_order = case code
  when 'WRIGHT_BROTHERS' then 10
  when 'MITCHELL_LEADERSHIP' then 20
  when 'MITCHELL_AEROSPACE' then 30
  else sort_order
end
where code in ('WRIGHT_BROTHERS', 'MITCHELL_LEADERSHIP', 'MITCHELL_AEROSPACE');

insert into public.courses (
  id, exam_id, code, title, description, sort_order, status
) values (
  '30000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000003',
  'WRIGHT_BROTHERS_LTL',
  'Learn to Lead',
  'Learn to Lead, Volume 1 content for the Wright Brothers milestone.',
  10,
  'active'
)
on conflict (id) do update set
  exam_id = excluded.exam_id,
  code = excluded.code,
  title = excluded.title,
  description = excluded.description,
  sort_order = excluded.sort_order,
  status = excluded.status;

-- Move the existing Volume 1 hierarchy rather than cloning it. This preserves
-- question, attempt, mastery, and session-question identities.
update public.volumes
set course_id = '30000000-0000-4000-8000-000000000003'
where code = 'LTL_V1'
  and course_id = '30000000-0000-4000-8000-000000000001';

update public.chapters c
set course_id = '30000000-0000-4000-8000-000000000003'
from public.volumes v
where c.volume_id = v.id
  and v.code = 'LTL_V1'
  and v.course_id = '30000000-0000-4000-8000-000000000003';

update public.topics
set exam_id = '20000000-0000-4000-8000-000000000003',
    course_id = '30000000-0000-4000-8000-000000000003',
    description = 'Private Wright Brothers Chapter 1 study content.'
where code = 'LTL1_C1';

-- A family is exam-owned. Move each exclusively Chapter 1 family before its
-- questions so the question integrity trigger sees matching ownership.
do $$
begin
  if exists (
    select 1
    from public.question_families f
    join public.questions target_question on target_question.question_family_id = f.id
    join public.topics target_topic on target_topic.id = target_question.topic_id
    join public.questions other_question on other_question.question_family_id = f.id
    join public.topics other_topic on other_topic.id = other_question.topic_id
    where target_topic.code = 'LTL1_C1'
      and other_topic.code <> 'LTL1_C1'
  ) then
    raise exception 'Cannot rehome a question family shared outside LTL1_C1';
  end if;
end
$$;

update public.question_families f
set exam_id = '20000000-0000-4000-8000-000000000003'
where exists (
  select 1
  from public.questions q
  join public.topics t on t.id = q.topic_id
  where q.question_family_id = f.id
    and t.code = 'LTL1_C1'
);

update public.questions q
set exam_id = '20000000-0000-4000-8000-000000000003'
from public.topics t
where q.topic_id = t.id
  and t.code = 'LTL1_C1';

-- Keep the temporary Chapter 1 pilot test, but show it in the correct track.
update public.practice_test_blueprints
set exam_id = '20000000-0000-4000-8000-000000000003'
where code = 'LTL1_C1_PILOT_10';

alter table public.questions
  drop constraint questions_style_reference_check,
  add constraint questions_style_reference_check check (
    style_reference is null or style_reference in (
      'pre_sample_bank_review',
      'Mitchell_sample_style_analysis',
      'Mitchell_Aerospace_sample_style_analysis',
      'Wright Brothers milestone sample exams used as style/difficulty reference only'
    )
  );

comment on constraint questions_style_reference_check on public.questions is
  'Controlled provenance labels for style analysis; no recalled protected exam questions are permitted.';

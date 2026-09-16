insert into public.exams (
  id, program_id, code, title, description, sort_order, status
) values (
  '20000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000001',
  'EARHART_LEADERSHIP',
  'Earhart Leadership',
  'Learn to Lead, Volume 3 study track for the Earhart milestone.',
  40,
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
  when 'EARHART_LEADERSHIP' then 40
  else sort_order
end
where code in (
  'WRIGHT_BROTHERS',
  'MITCHELL_LEADERSHIP',
  'MITCHELL_AEROSPACE',
  'EARHART_LEADERSHIP'
);

insert into public.courses (
  id, exam_id, code, title, description, sort_order, status
) values (
  '30000000-0000-4000-8000-000000000004',
  '20000000-0000-4000-8000-000000000004',
  'EARHART_LTL',
  'Learn to Lead',
  'Learn to Lead, Volume 3 content for the Earhart milestone.',
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

alter table public.questions
  drop constraint questions_style_reference_check,
  add constraint questions_style_reference_check check (
    style_reference is null or style_reference in (
      'pre_sample_bank_review',
      'Mitchell_sample_style_analysis',
      'Mitchell_Aerospace_sample_style_analysis',
      'Wright Brothers milestone sample exams used as style/difficulty reference only',
      'Three Wright Brothers Milestone exam forms used as style/difficulty reference only',
      'Three Earhart Milestone Leadership exam forms used as style/difficulty reference only; no milestone question copied'
    )
  );

comment on constraint questions_style_reference_check on public.questions is
  'Controlled provenance labels for style analysis; no recalled protected exam questions are permitted.';

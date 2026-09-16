alter table public.questions
  drop constraint questions_style_reference_check,
  add constraint questions_style_reference_check check (
    style_reference is null or style_reference in (
      'pre_sample_bank_review',
      'Mitchell_sample_style_analysis',
      'Mitchell_Aerospace_sample_style_analysis',
      'Wright Brothers milestone sample exams used as style/difficulty reference only',
      'Three Wright Brothers Milestone exam forms used as style/difficulty reference only',
      'Three Earhart Milestone Leadership exam forms used as style/difficulty reference only; no milestone question copied',
      'Three Earhart Milestone Leadership exam forms used only as style/difficulty references; no milestone question copied'
    )
  );

comment on constraint questions_style_reference_check on public.questions is
  'Controlled provenance labels for style analysis; no recalled protected exam questions are permitted.';

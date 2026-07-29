alter table public.questions
  add column question_mode text,
  add column question_style text,
  add constraint questions_question_mode_format check (
    question_mode is null or question_mode ~ '^[a-z][a-z0-9_-]{1,79}$'
  ),
  add constraint questions_question_style_format check (
    question_style is null or question_style ~ '^[a-z][a-z0-9_-]{1,79}$'
  );

comment on column public.questions.question_mode is
  'Optional source-bank delivery classification such as mixed; it does not override study-session security behavior.';
comment on column public.questions.question_style is
  'Optional source-bank style classification such as cap_direct, application, or scenario.';

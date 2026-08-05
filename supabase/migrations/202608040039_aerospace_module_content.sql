alter table public.questions
  add column module_number integer,
  add constraint questions_module_number_check check (
    module_number is null or module_number between 1 and 99
  );

alter table public.questions
  drop constraint questions_style_reference_check,
  add constraint questions_style_reference_check check (
    style_reference is null or style_reference in (
      'pre_sample_bank_review',
      'Mitchell_sample_style_analysis',
      'Mitchell_Aerospace_sample_style_analysis'
    )
  );

create index questions_module_study_pool_idx
  on public.questions (
    exam_id,
    module_number,
    chapter_number,
    review_status,
    status
  );

comment on column public.questions.module_number is
  'Source curriculum module number used to scope Aerospace Dimensions study and future module/full-exam blueprints.';

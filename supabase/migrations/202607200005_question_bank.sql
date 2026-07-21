create type public.question_type as enum ('multiple_choice', 'true_false');
create type public.question_difficulty as enum ('easy', 'medium', 'hard');
create type public.cognitive_level as enum ('recall', 'understanding', 'application', 'scenario');
create type public.question_review_status as enum ('draft', 'in_review', 'approved', 'rejected', 'archived');
create type public.review_decision as enum ('approve', 'request_changes', 'reject');
create type public.question_report_type as enum (
  'unclear_wording',
  'incorrect_answer',
  'poor_explanation',
  'source_mismatch',
  'formatting_problem',
  'other'
);
create type public.question_report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete restrict,
  topic_id uuid not null references public.topics (id) on delete restrict,
  learning_objective_id uuid references public.learning_objectives (id) on delete restrict,
  source_document_id uuid references public.source_documents (id) on delete restrict,
  source_page_start integer check (source_page_start is null or source_page_start > 0),
  source_page_end integer check (source_page_end is null or source_page_end > 0),
  source_reference text,
  question_text text not null check (char_length(question_text) between 1 and 4000),
  question_type public.question_type not null default 'multiple_choice',
  difficulty public.question_difficulty not null,
  cognitive_level public.cognitive_level not null,
  is_exam_style boolean not null default false,
  review_status public.question_review_status not null default 'draft',
  status public.content_status not null default 'draft',
  version integer not null default 1 check (version > 0),
  created_by uuid not null references public.profiles (id) on delete restrict,
  approved_by uuid references public.profiles (id) on delete restrict,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_page_end is null or source_page_start is null or source_page_end >= source_page_start),
  check (
    (review_status = 'approved' and status = 'active' and approved_by is not null and approved_at is not null)
    or review_status <> 'approved'
  )
);

create table public.question_choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  choice_key text not null check (choice_key ~ '^[A-Z]$'),
  choice_text text not null check (char_length(choice_text) between 1 and 2000),
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, choice_key),
  unique (question_id, sort_order)
);

create table private.question_answer_keys (
  question_id uuid primary key references public.questions (id) on delete cascade,
  correct_choice_id uuid not null references public.question_choices (id) on delete restrict,
  explanation text not null check (char_length(explanation) between 1 and 8000),
  remediation text,
  common_mistake text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.question_choice_feedback (
  choice_id uuid primary key references public.question_choices (id) on delete cascade,
  feedback_text text not null check (char_length(feedback_text) between 1 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_versions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  version integer not null check (version > 0),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  change_reason text not null check (char_length(change_reason) between 1 and 1000),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (question_id, version)
);

create table public.question_quality_reviews (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete restrict,
  accuracy_rating smallint not null check (accuracy_rating between 1 and 5),
  clarity_rating smallint not null check (clarity_rating between 1 and 5),
  source_alignment_rating smallint not null check (source_alignment_rating between 1 and 5),
  notes text,
  decision public.review_decision not null,
  created_at timestamptz not null default now()
);

create table public.question_reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete restrict,
  reporter_id uuid not null references public.profiles (id) on delete restrict,
  report_type public.question_report_type not null,
  details text not null check (char_length(details) between 1 and 4000),
  status public.question_report_status not null default 'open',
  resolution_notes text,
  resolved_by uuid references public.profiles (id) on delete restrict,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status in ('resolved', 'dismissed') and resolved_by is not null and resolved_at is not null)
    or status in ('open', 'reviewing')
  )
);

create index questions_exam_delivery_idx
  on public.questions (exam_id, review_status, status);
create index questions_topic_delivery_idx
  on public.questions (topic_id, review_status, status);
create index question_choices_question_id_idx on public.question_choices (question_id, sort_order);
create index question_versions_question_id_idx on public.question_versions (question_id, version desc);
create index question_quality_reviews_question_id_idx on public.question_quality_reviews (question_id);
create index question_reports_question_id_idx on public.question_reports (question_id, status);
create index question_reports_reporter_id_idx on public.question_reports (reporter_id, created_at desc);

create trigger questions_set_updated_at
before update on public.questions
for each row execute function private.set_updated_at();

create trigger question_choices_set_updated_at
before update on public.question_choices
for each row execute function private.set_updated_at();

create trigger question_answer_keys_set_updated_at
before update on private.question_answer_keys
for each row execute function private.set_updated_at();

create trigger question_choice_feedback_set_updated_at
before update on private.question_choice_feedback
for each row execute function private.set_updated_at();

create trigger question_reports_set_updated_at
before update on public.question_reports
for each row execute function private.set_updated_at();

comment on table private.question_answer_keys is 'Correct choices and post-submission teaching content; never grant direct client access.';
comment on table private.question_choice_feedback is 'Per-choice teaching feedback; never grant direct client access.';
comment on column public.question_versions.snapshot is 'Reviewer-only audit snapshot; it may contain answer-key material.';

create type public.study_session_status as enum ('active', 'completed', 'abandoned');
create type public.study_session_mode as enum ('study');

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete restrict,
  exam_id uuid not null references public.exams (id) on delete restrict,
  topic_id uuid references public.topics (id) on delete restrict,
  mode public.study_session_mode not null default 'study',
  status public.study_session_status not null default 'active',
  requested_count integer not null check (requested_count between 1 and 50),
  question_count integer not null check (question_count between 1 and 50),
  answered_count integer not null default 0 check (answered_count >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (answered_count <= question_count),
  check (correct_count <= answered_count),
  check (
    (status = 'completed' and completed_at is not null and answered_count = question_count)
    or (status <> 'completed' and completed_at is null)
  )
);

create table public.study_session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete restrict,
  position integer not null check (position > 0),
  selection_reason text not null default 'basic_ordered' check (char_length(selection_reason) between 1 and 80),
  question_version integer not null check (question_version > 0),
  created_at timestamptz not null default now(),
  unique (session_id, position),
  unique (session_id, question_id)
);

create table public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions (id) on delete cascade,
  session_question_id uuid not null references public.study_session_questions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete restrict,
  question_id uuid not null references public.questions (id) on delete restrict,
  selected_choice_id uuid not null references public.question_choices (id) on delete restrict,
  is_correct boolean not null,
  response_time_ms integer not null check (response_time_ms between 0 and 3600000),
  confidence smallint check (confidence is null or confidence between 1 and 5),
  submitted_at timestamptz not null default now(),
  unique (session_question_id)
);

create index study_sessions_student_status_idx
  on public.study_sessions (student_id, status, started_at desc);
create index study_sessions_exam_id_idx on public.study_sessions (exam_id, started_at desc);
create index study_session_questions_session_idx
  on public.study_session_questions (session_id, position);
create index question_attempts_student_idx
  on public.question_attempts (student_id, submitted_at desc);
create index question_attempts_session_idx
  on public.question_attempts (session_id, submitted_at);
create index question_attempts_question_idx
  on public.question_attempts (question_id, submitted_at);

create trigger study_sessions_set_updated_at
before update on public.study_sessions
for each row execute function private.set_updated_at();

create or replace function private.owns_study_session(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.study_sessions s
    where s.id = p_session_id and s.student_id = (select auth.uid())
  );
$$;

alter table public.study_sessions enable row level security;
alter table public.study_session_questions enable row level security;
alter table public.question_attempts enable row level security;

create policy study_sessions_select_owner
on public.study_sessions for select to authenticated
using (student_id = (select auth.uid()));

create policy study_session_questions_select_owner
on public.study_session_questions for select to authenticated
using (private.owns_study_session(session_id));

create policy question_attempts_select_owner
on public.question_attempts for select to authenticated
using (student_id = (select auth.uid()) and private.owns_study_session(session_id));

revoke all on table public.study_sessions from anon, authenticated;
revoke all on table public.study_session_questions from anon, authenticated;
revoke all on table public.question_attempts from anon, authenticated;
grant select on table public.study_sessions to authenticated;
grant select on table public.study_session_questions to authenticated;
grant select on table public.question_attempts to authenticated;

revoke all on function private.owns_study_session(uuid) from public;
grant execute on function private.owns_study_session(uuid) to authenticated;

comment on table public.question_attempts is 'Correctness is computed by submit_answer; clients have select-only access to their own attempts.';

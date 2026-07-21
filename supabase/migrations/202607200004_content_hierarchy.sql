create type public.content_status as enum ('draft', 'active', 'archived');
create type public.source_authorization_status as enum ('pending', 'approved', 'restricted', 'rejected');

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,39}$'),
  title text not null check (char_length(title) between 1 and 160),
  description text,
  sort_order integer not null default 0 check (sort_order >= 0),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code)
);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,39}$'),
  title text not null check (char_length(title) between 1 and 160),
  description text,
  passing_score numeric(5, 2) check (passing_score is null or passing_score between 0 and 100),
  time_limit_minutes integer check (time_limit_minutes is null or time_limit_minutes > 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, code)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,39}$'),
  title text not null check (char_length(title) between 1 and 160),
  description text,
  sort_order integer not null default 0 check (sort_order >= 0),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_id, code)
);

create table public.volumes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,39}$'),
  title text not null check (char_length(title) between 1 and 160),
  description text,
  edition text,
  sort_order integer not null default 0 check (sort_order >= 0),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, code)
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete restrict,
  volume_id uuid references public.volumes (id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_.-]{0,39}$'),
  title text not null check (char_length(title) between 1 and 200),
  description text,
  sort_order integer not null default 0 check (sort_order >= 0),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (course_id, volume_id, code)
);

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_.-]{0,39}$'),
  title text not null check (char_length(title) between 1 and 200),
  description text,
  sort_order integer not null default 0 check (sort_order >= 0),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, code)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete restrict,
  course_id uuid references public.courses (id) on delete restrict,
  volume_id uuid references public.volumes (id) on delete restrict,
  chapter_id uuid references public.chapters (id) on delete restrict,
  section_id uuid references public.sections (id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_.-]{0,59}$'),
  title text not null check (char_length(title) between 1 and 200),
  description text,
  sort_order integer not null default 0 check (sort_order >= 0),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_id, code)
);

create table public.learning_objectives (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_.-]{0,79}$'),
  title text not null check (char_length(title) between 1 and 240),
  description text,
  sort_order integer not null default 0 check (sort_order >= 0),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, code)
);

create table public.source_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 240),
  document_type text not null check (char_length(document_type) between 1 and 80),
  edition text,
  publication_date date,
  storage_path text,
  external_reference text,
  authorization_status public.source_authorization_status not null default 'pending',
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references public.profiles (id) on delete restrict,
  check (storage_path is not null or external_reference is not null)
);

create table private.source_passages (
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null references public.source_documents (id) on delete cascade,
  chapter_id uuid references public.chapters (id) on delete set null,
  section_id uuid references public.sections (id) on delete set null,
  page_start integer check (page_start is null or page_start > 0),
  page_end integer check (page_end is null or page_end > 0),
  heading text,
  passage_text text not null check (char_length(passage_text) > 0),
  content_hash text not null check (char_length(content_hash) between 32 and 128),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  check (page_end is null or page_start is null or page_end >= page_start),
  unique (source_document_id, content_hash)
);

create index exams_program_id_idx on public.exams (program_id);
create index courses_exam_id_idx on public.courses (exam_id);
create index volumes_course_id_idx on public.volumes (course_id);
create index chapters_course_id_idx on public.chapters (course_id);
create index chapters_volume_id_idx on public.chapters (volume_id);
create index sections_chapter_id_idx on public.sections (chapter_id);
create index topics_exam_id_idx on public.topics (exam_id);
create index topics_course_id_idx on public.topics (course_id);
create index learning_objectives_topic_id_idx on public.learning_objectives (topic_id);
create index source_documents_authorization_idx
  on public.source_documents (authorization_status, status);

create or replace function private.validate_chapter_hierarchy()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.volume_id is not null and not exists (
    select 1
    from public.volumes v
    where v.id = new.volume_id
      and v.course_id = new.course_id
  ) then
    raise exception 'Chapter volume must belong to the selected course';
  end if;

  return new;
end;
$$;

create or replace function private.validate_topic_hierarchy()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  selected_course_id uuid;
  selected_volume_course_id uuid;
  selected_chapter_course_id uuid;
  selected_chapter_volume_id uuid;
  selected_section_chapter_id uuid;
begin
  if new.course_id is not null then
    select c.exam_id into selected_course_id
    from public.courses c
    where c.id = new.course_id;

    if selected_course_id is distinct from new.exam_id then
      raise exception 'Topic course must belong to the selected exam';
    end if;
  end if;

  if new.volume_id is not null then
    select v.course_id into selected_volume_course_id
    from public.volumes v
    where v.id = new.volume_id;

    if new.course_id is null or selected_volume_course_id is distinct from new.course_id then
      raise exception 'Topic volume requires its owning course';
    end if;
  end if;

  if new.chapter_id is not null then
    select c.course_id, c.volume_id
      into selected_chapter_course_id, selected_chapter_volume_id
    from public.chapters c
    where c.id = new.chapter_id;

    if new.course_id is null or selected_chapter_course_id is distinct from new.course_id then
      raise exception 'Topic chapter requires its owning course';
    end if;

    if selected_chapter_volume_id is not null
      and selected_chapter_volume_id is distinct from new.volume_id then
      raise exception 'Topic chapter requires its owning volume';
    end if;
  end if;

  if new.section_id is not null then
    select s.chapter_id into selected_section_chapter_id
    from public.sections s
    where s.id = new.section_id;

    if new.chapter_id is null or selected_section_chapter_id is distinct from new.chapter_id then
      raise exception 'Topic section requires its owning chapter';
    end if;
  end if;

  return new;
end;
$$;

create trigger chapters_validate_hierarchy
before insert or update of course_id, volume_id on public.chapters
for each row execute function private.validate_chapter_hierarchy();

create trigger topics_validate_hierarchy
before insert or update of exam_id, course_id, volume_id, chapter_id, section_id on public.topics
for each row execute function private.validate_topic_hierarchy();

create trigger programs_set_updated_at
before update on public.programs
for each row execute function private.set_updated_at();

create trigger exams_set_updated_at
before update on public.exams
for each row execute function private.set_updated_at();

create trigger courses_set_updated_at
before update on public.courses
for each row execute function private.set_updated_at();

create trigger volumes_set_updated_at
before update on public.volumes
for each row execute function private.set_updated_at();

create trigger chapters_set_updated_at
before update on public.chapters
for each row execute function private.set_updated_at();

create trigger sections_set_updated_at
before update on public.sections
for each row execute function private.set_updated_at();

create trigger topics_set_updated_at
before update on public.topics
for each row execute function private.set_updated_at();

create trigger learning_objectives_set_updated_at
before update on public.learning_objectives
for each row execute function private.set_updated_at();

create trigger source_documents_set_updated_at
before update on public.source_documents
for each row execute function private.set_updated_at();

comment on table private.source_passages is 'Authorized source text is private and never exposed through the Data API.';

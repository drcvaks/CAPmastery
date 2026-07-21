create type public.learning_relationship_type as enum ('prerequisite', 'related');
create type public.concept_relationship_type as enum (
  'supports',
  'requires',
  'expresses',
  'guides',
  'contrasts_with',
  'is_example_of',
  'develops',
  'influences',
  'prerequisite_for',
  'reinforces'
);
create type public.question_purpose as enum (
  'recall',
  'recognition',
  'understanding',
  'application',
  'scenario_judgment',
  'analysis',
  'misconception_check',
  'reinforcement',
  'retention_check'
);

alter table public.sections
  add column parent_section_id uuid references public.sections (id) on delete restrict;
create index sections_parent_section_id_idx on public.sections (parent_section_id);

alter table public.learning_objectives
  add column official_objective_number text,
  add column official_objective_text text,
  add column source_document_id uuid references public.source_documents (id) on delete restrict,
  add column source_page_start integer check (source_page_start is null or source_page_start > 0),
  add column source_page_end integer check (source_page_end is null or source_page_end > 0),
  add column importance_weight numeric(5, 2) not null default 1 check (importance_weight > 0),
  add constraint learning_objectives_source_pages_ordered
    check (source_page_end is null or source_page_start is null or source_page_end >= source_page_start);

create table public.learning_objective_relationships (
  objective_id uuid not null references public.learning_objectives (id) on delete cascade,
  related_objective_id uuid not null references public.learning_objectives (id) on delete cascade,
  relationship_type public.learning_relationship_type not null,
  created_at timestamptz not null default now(),
  primary key (objective_id, related_objective_id, relationship_type),
  check (objective_id <> related_objective_id)
);

create table public.concepts (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete restrict,
  source_document_id uuid references public.source_documents (id) on delete restrict,
  parent_concept_id uuid references public.concepts (id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_.-]{0,99}$'),
  title text not null check (char_length(title) between 1 and 240),
  plain_language_definition text,
  deeper_definition text,
  source_reference text,
  importance_weight numeric(5, 2) not null default 1 check (importance_weight > 0),
  common_confusions text,
  sort_order integer not null default 0 check (sort_order >= 0),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, code),
  check (parent_concept_id is null or parent_concept_id <> id)
);

create table public.concept_objectives (
  concept_id uuid not null references public.concepts (id) on delete cascade,
  learning_objective_id uuid not null references public.learning_objectives (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (concept_id, learning_objective_id)
);

create table public.concept_relationships (
  concept_id uuid not null references public.concepts (id) on delete cascade,
  related_concept_id uuid not null references public.concepts (id) on delete cascade,
  relationship_type public.concept_relationship_type not null,
  created_at timestamptz not null default now(),
  primary key (concept_id, related_concept_id, relationship_type),
  check (concept_id <> related_concept_id)
);

create table private.tutor_notes (
  concept_id uuid primary key references public.concepts (id) on delete cascade,
  essential_understanding text,
  simple_explanation text,
  deeper_explanation text,
  common_misconceptions text,
  real_life_examples text,
  cap_examples text,
  teaching_analogy text,
  remediation_strategy text,
  distinguishing_points text,
  source_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_families (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_.-]{0,99}$'),
  title text not null check (char_length(title) between 1 and 240),
  description text,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_id, code)
);

alter table public.questions
  add column question_family_id uuid references public.question_families (id) on delete set null,
  add column purpose public.question_purpose,
  add column estimated_time_seconds integer check (estimated_time_seconds is null or estimated_time_seconds > 0);

create table public.question_concepts (
  question_id uuid not null references public.questions (id) on delete cascade,
  concept_id uuid not null references public.concepts (id) on delete restrict,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (question_id, concept_id)
);

create table public.question_reinforcements (
  question_id uuid not null references public.questions (id) on delete cascade,
  reinforcement_question_id uuid not null references public.questions (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (question_id, reinforcement_question_id),
  check (question_id <> reinforcement_question_id)
);

create index concepts_topic_id_idx on public.concepts (topic_id, status, sort_order);
create index concept_objectives_objective_id_idx on public.concept_objectives (learning_objective_id);
create index question_families_exam_id_idx on public.question_families (exam_id, status);
create index questions_question_family_id_idx on public.questions (question_family_id);
create index question_concepts_concept_id_idx on public.question_concepts (concept_id);
create index question_reinforcements_target_idx on public.question_reinforcements (reinforcement_question_id);

create trigger concepts_set_updated_at
before update on public.concepts
for each row execute function private.set_updated_at();
create trigger tutor_notes_set_updated_at
before update on private.tutor_notes
for each row execute function private.set_updated_at();
create trigger question_families_set_updated_at
before update on public.question_families
for each row execute function private.set_updated_at();

create or replace function private.validate_section_parent()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.parent_section_id is not null and not exists (
    select 1 from public.sections s
    where s.id = new.parent_section_id and s.chapter_id = new.chapter_id
  ) then
    raise exception 'Parent section must belong to the same chapter';
  end if;
  return new;
end;
$$;

create or replace function private.validate_concept_links()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.parent_concept_id is not null and not exists (
    select 1 from public.concepts c
    where c.id = new.parent_concept_id and c.topic_id = new.topic_id
  ) then
    raise exception 'Parent concept must belong to the same topic';
  end if;
  return new;
end;
$$;

create trigger sections_validate_parent
before insert or update of chapter_id, parent_section_id on public.sections
for each row execute function private.validate_section_parent();
create trigger concepts_validate_links
before insert or update of topic_id, parent_concept_id on public.concepts
for each row execute function private.validate_concept_links();

alter table public.learning_objective_relationships enable row level security;
alter table public.concepts enable row level security;
alter table public.concept_objectives enable row level security;
alter table public.concept_relationships enable row level security;
alter table public.question_families enable row level security;
alter table public.question_concepts enable row level security;
alter table public.question_reinforcements enable row level security;

create policy objective_relationships_active_or_reviewer
on public.learning_objective_relationships for select to authenticated
using (
  private.can_review_content()
  or (
    exists (select 1 from public.learning_objectives o where o.id = objective_id and o.status = 'active')
    and exists (select 1 from public.learning_objectives o where o.id = related_objective_id and o.status = 'active')
  )
);
create policy objective_relationships_manage_reviewer
on public.learning_objective_relationships for all to authenticated
using (private.can_review_content()) with check (private.can_review_content());

create policy concepts_active_or_reviewer
on public.concepts for select to authenticated
using (status = 'active' or private.can_review_content());
create policy concepts_manage_reviewer
on public.concepts for all to authenticated
using (private.can_review_content()) with check (private.can_review_content());

create policy concept_objectives_active_or_reviewer
on public.concept_objectives for select to authenticated
using (
  private.can_review_content()
  or exists (select 1 from public.concepts c where c.id = concept_id and c.status = 'active')
);
create policy concept_objectives_manage_reviewer
on public.concept_objectives for all to authenticated
using (private.can_review_content()) with check (private.can_review_content());

create policy concept_relationships_active_or_reviewer
on public.concept_relationships for select to authenticated
using (
  private.can_review_content()
  or (
    exists (select 1 from public.concepts c where c.id = concept_id and c.status = 'active')
    and exists (select 1 from public.concepts c where c.id = related_concept_id and c.status = 'active')
  )
);
create policy concept_relationships_manage_reviewer
on public.concept_relationships for all to authenticated
using (private.can_review_content()) with check (private.can_review_content());

create policy question_families_active_or_reviewer
on public.question_families for select to authenticated
using (status = 'active' or private.can_review_content());
create policy question_families_manage_reviewer
on public.question_families for all to authenticated
using (private.can_review_content()) with check (private.can_review_content());

create policy question_concepts_visible_or_reviewer
on public.question_concepts for select to authenticated
using (private.question_is_student_visible(question_id) or private.can_review_content());
create policy question_concepts_manage_reviewer
on public.question_concepts for all to authenticated
using (private.can_review_content() and private.question_is_editable(question_id))
with check (private.can_review_content() and private.question_is_editable(question_id));

create policy question_reinforcements_visible_or_reviewer
on public.question_reinforcements for select to authenticated
using (
  private.can_review_content()
  or (
    private.question_is_student_visible(question_id)
    and private.question_is_student_visible(reinforcement_question_id)
  )
);
create policy question_reinforcements_manage_reviewer
on public.question_reinforcements for all to authenticated
using (private.can_review_content() and private.question_is_editable(question_id))
with check (private.can_review_content() and private.question_is_editable(question_id));

revoke all on table public.learning_objective_relationships from anon, authenticated;
revoke all on table public.concepts from anon, authenticated;
revoke all on table public.concept_objectives from anon, authenticated;
revoke all on table public.concept_relationships from anon, authenticated;
revoke all on table public.question_families from anon, authenticated;
revoke all on table public.question_concepts from anon, authenticated;
revoke all on table public.question_reinforcements from anon, authenticated;
revoke all on table private.tutor_notes from anon, authenticated;

grant select, insert, update, delete on table public.learning_objective_relationships to authenticated;
grant select, insert, update, delete on table public.concepts to authenticated;
grant select, insert, update, delete on table public.concept_objectives to authenticated;
grant select, insert, update, delete on table public.concept_relationships to authenticated;
grant select, insert, update, delete on table public.question_families to authenticated;
grant select, insert, update, delete on table public.question_concepts to authenticated;
grant select, insert, update, delete on table public.question_reinforcements to authenticated;

revoke all on function private.validate_section_parent() from public;
revoke all on function private.validate_concept_links() from public;

create or replace function public.reviewer_approve_question(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_question public.questions%rowtype;
  v_choice_count integer;
begin
  if (select auth.uid()) is null or not private.can_review_content() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  select * into v_question from public.questions where id = p_question_id for update;
  if not found then raise exception 'Question not found' using errcode = 'P0002'; end if;
  if v_question.learning_objective_id is null
    or v_question.source_document_id is null
    or v_question.purpose is null
    or nullif(trim(v_question.source_reference), '') is null then
    raise exception 'Approved questions require an objective, purpose, and source reference' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.source_documents
    where id = v_question.source_document_id and authorization_status = 'approved' and status = 'active'
  ) then
    raise exception 'Question source must be active and authorized' using errcode = '22023';
  end if;
  select count(*) into v_choice_count from public.question_choices where question_id = p_question_id;
  if (v_question.question_type = 'true_false' and v_choice_count <> 2)
    or (v_question.question_type = 'multiple_choice' and v_choice_count < 3) then
    raise exception 'Question has an invalid number of choices' using errcode = '22023';
  end if;
  if not exists (
    select 1 from private.question_answer_keys
    where question_id = p_question_id and nullif(trim(explanation), '') is not null
  ) then
    raise exception 'Question requires a private answer key and explanation' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.question_quality_reviews
    where question_id = p_question_id and decision = 'approve'
  ) then
    raise exception 'Question requires an approving quality review' using errcode = '22023';
  end if;
  insert into public.question_versions (question_id, version, snapshot, change_reason, created_by)
  values (p_question_id, v_question.version, to_jsonb(v_question), 'Approved for student delivery', (select auth.uid()))
  on conflict (question_id, version) do nothing;
  update public.questions set review_status = 'approved', status = 'active',
    approved_by = (select auth.uid()), approved_at = now()
  where id = p_question_id;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, before_summary, after_summary)
  values ((select auth.uid()), 'question.approved', 'question', p_question_id,
    jsonb_build_object('review_status', v_question.review_status, 'status', v_question.status),
    jsonb_build_object('review_status', 'approved', 'status', 'active'));
end;
$$;

comment on table private.tutor_notes is 'Instructional metadata withheld from direct client access.';

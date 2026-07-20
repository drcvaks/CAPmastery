create schema if not exists private;

revoke all on schema private from public;

create type public.profile_status as enum ('active', 'disabled');
create type public.app_role as enum (
  'student',
  'parent',
  'coach',
  'content_reviewer',
  'squadron_leader',
  'admin'
);
create type public.role_scope_type as enum ('global', 'organization');
create type public.relationship_status as enum ('active', 'inactive');
create type public.organization_status as enum ('active', 'inactive');
create type public.organization_type as enum ('family', 'squadron', 'group');
create type public.membership_status as enum ('active', 'inactive');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  first_name text check (first_name is null or char_length(first_name) between 1 and 60),
  last_name text check (last_name is null or char_length(last_name) between 1 and 60),
  avatar_url text,
  status public.profile_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  organization_type public.organization_type not null,
  parent_organization_id uuid references public.organizations (id),
  status public.organization_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_organization_id is null or parent_organization_id <> id)
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  scope_type public.role_scope_type not null default 'global',
  scope_id uuid references public.organizations (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  constraint user_roles_scope_consistency check (
    (scope_type = 'global' and scope_id is null)
    or (scope_type = 'organization' and scope_id is not null)
  ),
  unique nulls not distinct (user_id, role, scope_type, scope_id)
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  membership_role text not null check (char_length(membership_role) between 1 and 60),
  status public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  unique (organization_id, user_id)
);

create table public.student_guardian_links (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  guardian_id uuid not null references public.profiles (id) on delete cascade,
  relationship_type text not null check (char_length(relationship_type) between 1 and 60),
  status public.relationship_status not null default 'active',
  can_view_progress boolean not null default true,
  can_assign_content boolean not null default false,
  can_manage_challenges boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references public.profiles (id) on delete restrict,
  check (student_id <> guardian_id),
  unique (student_id, guardian_id)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (char_length(action) between 1 and 120),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id uuid,
  before_summary jsonb,
  after_summary jsonb,
  created_at timestamptz not null default now()
);

create index user_roles_user_id_idx on public.user_roles (user_id);
create index user_roles_scope_idx on public.user_roles (scope_type, scope_id);
create index organization_memberships_user_id_idx on public.organization_memberships (user_id);
create index student_guardian_links_student_active_idx
  on public.student_guardian_links (student_id)
  where status = 'active';
create index student_guardian_links_guardian_active_idx
  on public.student_guardian_links (guardian_id)
  where status = 'active';
create index audit_log_created_at_idx on public.audit_log (created_at desc);
create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);

create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function private.set_updated_at();

create trigger student_guardian_links_set_updated_at
before update on public.student_guardian_links
for each row execute function private.set_updated_at();

create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_first_name text := nullif(trim(new.raw_user_meta_data ->> 'first_name'), '');
  v_last_name text := nullif(trim(new.raw_user_meta_data ->> 'last_name'), '');
  v_display_name text := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
begin
  if v_display_name is null then
    v_display_name := nullif(trim(concat_ws(' ', v_first_name, v_last_name)), '');
  end if;

  if v_display_name is null then
    v_display_name := split_part(coalesce(new.email, 'CAP Mastery user'), '@', 1);
  end if;

  insert into public.profiles (id, display_name, first_name, last_name)
  values (
    new.id,
    left(v_display_name, 100),
    left(v_first_name, 60),
    left(v_last_name, 60)
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

comment on table public.user_roles is 'Database-authoritative scoped application roles. Client writes are forbidden.';
comment on table public.audit_log is 'Append-only safe summaries for sensitive administrative actions.';

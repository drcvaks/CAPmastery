create function private.has_role(
  p_role public.app_role,
  p_scope_type public.role_scope_type default 'global',
  p_scope_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = p_role
      and scope_type = p_scope_type
      and scope_id is not distinct from p_scope_id
  );
$$;

create function private.can_view_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_profile_id = (select auth.uid())
    or private.has_role('admin')
    or exists (
      select 1
      from public.student_guardian_links
      where guardian_id = (select auth.uid())
        and student_id = p_profile_id
        and status = 'active'
        and can_view_progress
    );
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.student_guardian_links enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.audit_log enable row level security;

create policy profiles_select_authorized
on public.profiles for select to authenticated
using (private.can_view_profile(id));

create policy profiles_update_own
on public.profiles for update to authenticated
using (id = (select auth.uid()) and status = 'active')
with check (id = (select auth.uid()) and status = 'active');

create policy user_roles_select_own_or_admin
on public.user_roles for select to authenticated
using (user_id = (select auth.uid()) or private.has_role('admin'));

create policy guardian_links_select_participant_or_admin
on public.student_guardian_links for select to authenticated
using (
  student_id = (select auth.uid())
  or guardian_id = (select auth.uid())
  or private.has_role('admin')
);

create policy organizations_select_member_or_admin
on public.organizations for select to authenticated
using (
  private.has_role('admin')
  or id in (
    select organization_id
    from public.organization_memberships
    where user_id = (select auth.uid()) and status = 'active'
  )
);

create policy memberships_select_own_or_admin
on public.organization_memberships for select to authenticated
using (user_id = (select auth.uid()) or private.has_role('admin'));

create policy audit_log_select_admin
on public.audit_log for select to authenticated
using (private.has_role('admin'));

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.user_roles from anon, authenticated;
revoke all on table public.student_guardian_links from anon, authenticated;
revoke all on table public.organizations from anon, authenticated;
revoke all on table public.organization_memberships from anon, authenticated;
revoke all on table public.audit_log from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, first_name, last_name, avatar_url) on table public.profiles to authenticated;
grant select on table public.user_roles to authenticated;
grant select on table public.student_guardian_links to authenticated;
grant select on table public.organizations to authenticated;
grant select on table public.organization_memberships to authenticated;
grant select on table public.audit_log to authenticated;

revoke all on function private.has_role(public.app_role, public.role_scope_type, uuid) from public;
revoke all on function private.can_view_profile(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.has_role(public.app_role, public.role_scope_type, uuid) to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;

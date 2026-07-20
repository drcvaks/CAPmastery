create function public.admin_set_user_role(
  p_user_id uuid,
  p_role public.app_role,
  p_enabled boolean,
  p_scope_type public.role_scope_type default 'global',
  p_scope_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role_id uuid;
  v_before jsonb;
begin
  if (select auth.uid()) is null or not private.has_role('admin') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if (p_scope_type = 'global' and p_scope_id is not null)
    or (p_scope_type = 'organization' and p_scope_id is null) then
    raise exception 'Invalid role scope' using errcode = '22023';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  select id, to_jsonb(user_roles)
  into v_role_id, v_before
  from public.user_roles
  where user_id = p_user_id
    and role = p_role
    and scope_type = p_scope_type
    and scope_id is not distinct from p_scope_id;

  if p_enabled and v_role_id is null then
    insert into public.user_roles (user_id, role, scope_type, scope_id, created_by)
    values (p_user_id, p_role, p_scope_type, p_scope_id, (select auth.uid()))
    returning id into v_role_id;
  elsif not p_enabled and v_role_id is not null then
    if p_user_id = (select auth.uid()) and p_role = 'admin' and p_scope_type = 'global' then
      raise exception 'Administrators cannot remove their own global admin role' using errcode = '42501';
    end if;

    delete from public.user_roles where id = v_role_id;
  else
    return;
  end if;

  insert into public.audit_log (
    actor_id,
    action,
    entity_type,
    entity_id,
    before_summary,
    after_summary
  ) values (
    (select auth.uid()),
    case when p_enabled then 'role.granted' else 'role.revoked' end,
    'user_role',
    v_role_id,
    v_before,
    case when p_enabled then jsonb_build_object(
      'user_id', p_user_id,
      'role', p_role,
      'scope_type', p_scope_type,
      'scope_id', p_scope_id
    ) else null end
  );
end;
$$;

create function public.admin_set_guardian_link(
  p_student_id uuid,
  p_guardian_id uuid,
  p_relationship_type text,
  p_status public.relationship_status,
  p_can_view_progress boolean default true,
  p_can_assign_content boolean default false,
  p_can_manage_challenges boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link_id uuid;
  v_before jsonb;
begin
  if (select auth.uid()) is null or not private.has_role('admin') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_student_id = p_guardian_id then
    raise exception 'Student and guardian must be different users' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.user_roles
    where user_id = p_student_id and role = 'student' and scope_type = 'global'
  ) then
    raise exception 'Student role required' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.user_roles
    where user_id = p_guardian_id and role in ('parent', 'coach', 'admin') and scope_type = 'global'
  ) then
    raise exception 'Guardian must have a parent, coach, or admin role' using errcode = '22023';
  end if;

  select id, to_jsonb(student_guardian_links)
  into v_link_id, v_before
  from public.student_guardian_links
  where student_id = p_student_id and guardian_id = p_guardian_id;

  insert into public.student_guardian_links (
    student_id,
    guardian_id,
    relationship_type,
    status,
    can_view_progress,
    can_assign_content,
    can_manage_challenges,
    created_by
  ) values (
    p_student_id,
    p_guardian_id,
    left(trim(p_relationship_type), 60),
    p_status,
    p_can_view_progress,
    p_can_assign_content,
    p_can_manage_challenges,
    (select auth.uid())
  )
  on conflict (student_id, guardian_id) do update set
    relationship_type = excluded.relationship_type,
    status = excluded.status,
    can_view_progress = excluded.can_view_progress,
    can_assign_content = excluded.can_assign_content,
    can_manage_challenges = excluded.can_manage_challenges
  returning id into v_link_id;

  insert into public.audit_log (
    actor_id,
    action,
    entity_type,
    entity_id,
    before_summary,
    after_summary
  ) values (
    (select auth.uid()),
    case when v_before is null then 'guardian_link.created' else 'guardian_link.updated' end,
    'student_guardian_link',
    v_link_id,
    v_before,
    jsonb_build_object(
      'student_id', p_student_id,
      'guardian_id', p_guardian_id,
      'relationship_type', left(trim(p_relationship_type), 60),
      'status', p_status,
      'can_view_progress', p_can_view_progress,
      'can_assign_content', p_can_assign_content,
      'can_manage_challenges', p_can_manage_challenges
    )
  );

  return v_link_id;
end;
$$;

revoke all on function public.admin_set_user_role(uuid, public.app_role, boolean, public.role_scope_type, uuid) from public;
revoke all on function public.admin_set_guardian_link(uuid, uuid, text, public.relationship_status, boolean, boolean, boolean) from public;
grant execute on function public.admin_set_user_role(uuid, public.app_role, boolean, public.role_scope_type, uuid) to authenticated;
grant execute on function public.admin_set_guardian_link(uuid, uuid, text, public.relationship_status, boolean, boolean, boolean) to authenticated;

comment on function public.admin_set_user_role is 'Admin-only audited role grant/revoke entrypoint.';
comment on function public.admin_set_guardian_link is 'Admin-only audited guardian-link upsert entrypoint.';

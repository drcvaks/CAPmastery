create function public.admin_family_links(
  p_guardian_id uuid,
  p_student_id uuid default null,
  p_enabled boolean default null
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v_link public.student_guardian_links%rowtype;
begin
  if (select auth.uid()) is null or not private.has_role('admin') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if (p_student_id is null) <> (p_enabled is null) then
    raise exception 'Both cadet and action are required' using errcode = '22023';
  end if;
  perform 1 from public.profiles where id = p_guardian_id for update;
  if not found then
    raise exception 'Parent profile not found' using errcode = 'P0002';
  end if;
  if p_enabled is true then
    if p_guardian_id = p_student_id or not exists (
      select 1 from public.profiles where id = p_guardian_id and status = 'active'
    ) or not exists (
      select 1 from public.profiles where id = p_student_id and status = 'active'
    ) then
      raise exception 'Select two different active accounts' using errcode = '22023';
    end if;
    select * into v_link from public.student_guardian_links
      where guardian_id = p_guardian_id and student_id = p_student_id for update;
    if found and v_link.status = 'active' then
      raise exception 'This cadet already has an active link' using errcode = '22023';
    end if;
    perform public.admin_set_user_role(p_guardian_id, 'parent', true);
    perform public.admin_set_guardian_link(p_student_id, p_guardian_id, 'parent', 'active', true, false, false);
  elsif p_enabled is false then
    select * into v_link from public.student_guardian_links
      where guardian_id = p_guardian_id and student_id = p_student_id and status = 'active' for update;
    if not found then
      raise exception 'Active family link not found' using errcode = 'P0002';
    end if;
    -- Allow revocation even if the cadet or guardian no longer has their role.
    update public.student_guardian_links set status = 'inactive' where id = v_link.id;
    insert into public.audit_log (actor_id, action, entity_type, entity_id, before_summary, after_summary)
    values ((select auth.uid()), 'guardian_link.updated', 'student_guardian_link', v_link.id,
      to_jsonb(v_link), to_jsonb(v_link) || '{"status":"inactive"}'::jsonb);
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('student_id', student_id,
      'relationship_type', relationship_type, 'can_view_progress', can_view_progress)
      order by student_id)
    from public.student_guardian_links
    where guardian_id = p_guardian_id and status = 'active'
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_family_links(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.admin_family_links(uuid, uuid, boolean) to authenticated;

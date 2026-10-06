create or replace function public.admin_get_user_access_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
begin
  if v_actor_id is null or not private.has_role('admin') then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'users', coalesce((
      select jsonb_agg(listed.user_record order by listed.sort_name, listed.email)
      from (
        select
          lower(coalesce(nullif(trim(p.display_name), ''), u.email, u.id::text)) as sort_name,
          lower(coalesce(u.email, '')) as email,
          jsonb_build_object(
            'user_id', u.id,
            'email', u.email,
            'display_name', p.display_name,
            'status', p.status,
            'created_at', p.created_at,
            'roles', coalesce((
              select jsonb_agg(r.role order by r.role::text)
              from public.user_roles r
              where r.user_id = u.id
                and r.scope_type = 'global'
            ), '[]'::jsonb),
            'assigned_packages', coalesce((
              select jsonb_agg(a.import_package order by a.import_package)
              from public.pilot_package_assignments a
              where a.student_id = u.id
            ), '[]'::jsonb)
          ) as user_record
        from auth.users u
        join public.profiles p on p.id = u.id
      ) listed
    ), '[]'::jsonb),
    'packages', coalesce((
      select jsonb_agg(package_record.record order by package_record.exam_title, package_record.import_package)
      from (
        select
          q.import_package,
          min(e.title) as exam_title,
          jsonb_build_object(
            'import_package', q.import_package,
            'exam_title', min(e.title),
            'topic_titles', to_jsonb(array_agg(distinct t.title order by t.title)),
            'question_count', count(*)
          ) as record
        from public.questions q
        join public.exams e on e.id = q.exam_id
        join public.topics t on t.id = q.topic_id
        where q.import_package is not null
        group by q.import_package
      ) package_record
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_update_student_access(
  p_user_id uuid,
  p_student_enabled boolean,
  p_import_packages text[] default '{}'::text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_packages text[];
  v_before_student boolean;
  v_before_packages text[];
begin
  if v_actor_id is null or not private.has_role('admin') then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;
  if p_user_id is null or not exists (select 1 from public.profiles p where p.id = p_user_id) then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  select coalesce(array_agg(distinct upper(trim(candidate)) order by upper(trim(candidate))), '{}'::text[])
  into v_packages
  from unnest(coalesce(p_import_packages, '{}'::text[])) candidate
  where nullif(trim(candidate), '') is not null;

  if exists (
    select 1 from unnest(v_packages) package_name
    where package_name !~ '^[A-Z0-9][A-Z0-9_-]{2,119}$'
  ) then
    raise exception 'Invalid import package' using errcode = '22023';
  end if;
  if exists (
    select 1
    from unnest(v_packages) package_name
    where not exists (
      select 1 from public.questions q where q.import_package = package_name
    )
  ) then
    raise exception 'Import package not found' using errcode = 'P0002';
  end if;
  if not p_student_enabled and cardinality(v_packages) > 0 then
    raise exception 'Student role is required for package assignments' using errcode = '22023';
  end if;

  select exists (
    select 1 from public.user_roles r
    where r.user_id = p_user_id
      and r.role = 'student'
      and r.scope_type = 'global'
  ) into v_before_student;

  select coalesce(array_agg(a.import_package order by a.import_package), '{}'::text[])
  into v_before_packages
  from public.pilot_package_assignments a
  where a.student_id = p_user_id;

  if p_student_enabled then
    insert into public.user_roles (user_id, role, scope_type, scope_id, created_by)
    values (p_user_id, 'student', 'global', null, v_actor_id)
    on conflict do nothing;

    delete from public.pilot_package_assignments a
    where a.student_id = p_user_id
      and not (a.import_package = any(v_packages));

    insert into public.pilot_package_assignments (student_id, import_package, assigned_by)
    select p_user_id, package_name, v_actor_id
    from unnest(v_packages) package_name
    on conflict (student_id, import_package) do update set
      assigned_by = excluded.assigned_by,
      created_at = now();
  else
    delete from public.pilot_package_assignments a where a.student_id = p_user_id;
    delete from public.user_roles r
    where r.user_id = p_user_id
      and r.role = 'student'
      and r.scope_type = 'global';
  end if;

  insert into public.audit_log (
    actor_id,
    action,
    entity_type,
    entity_id,
    before_summary,
    after_summary
  ) values (
    v_actor_id,
    'student_access.updated',
    'profile',
    p_user_id,
    jsonb_build_object(
      'student_enabled', v_before_student,
      'import_packages', to_jsonb(v_before_packages)
    ),
    jsonb_build_object(
      'student_enabled', p_student_enabled,
      'import_packages', to_jsonb(case when p_student_enabled then v_packages else '{}'::text[] end)
    )
  );
end;
$$;

revoke all on function public.admin_get_user_access_overview() from public;
revoke all on function public.admin_update_student_access(uuid, boolean, text[]) from public;
grant execute on function public.admin_get_user_access_overview() to authenticated;
grant execute on function public.admin_update_student_access(uuid, boolean, text[]) to authenticated;

comment on function public.admin_get_user_access_overview() is
  'Admin-only projection of registered users, global roles, package assignments, and assignable package metadata.';
comment on function public.admin_update_student_access(uuid, boolean, text[]) is
  'Admin-only audited atomic replacement of one user global student role and private study-package assignments.';

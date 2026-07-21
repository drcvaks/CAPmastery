# Development Auth Bootstrap

Use this procedure only for the separate CAP Mastery development project after Checkpoint 2 migrations have been applied. Use the real Auth-account email addresses only in the temporary SQL Editor query you execute. Never save those addresses or any passwords in this tracked file, migrations, seed files, chat, or Git.

## 1. Create development Auth users

In Supabase Dashboard > Authentication > Users, create one administrator and one student using owner-controlled inboxes. Confirm both users for development. Do not use a service-role key in the client and do not enable public sign-up.

The `on_auth_user_created` trigger creates each `public.profiles` row. Verify that both profiles appear before continuing.

## 2. Bootstrap the first roles

Open the CAP Mastery development project's SQL Editor. Replace the two placeholder strings with the real email addresses of the Auth users you just created, then run the block once. The addresses are required to find those users. Do not paste the completed query into chat or save a copy containing the real addresses in the repository.

'''SQL

do $$
declare
  v_admin_id uuid;
  v_admin_role_id uuid;
  v_student_id uuid;
  v_student_role_id uuid;
begin
  select id into v_admin_id
  from auth.users
  where lower(email) = lower('chaimvaks@gmail.com');

  select id into v_student_id
  from auth.users
  where lower(email) = lower('heshyvaks@gmail.com');

  if v_admin_id is null or v_student_id is null then
    raise exception 'Both Auth users must exist before role bootstrap';
  end if;

  insert into public.user_roles (user_id, role, scope_type, created_by)
  values (v_admin_id, 'admin', 'global', v_admin_id)
  on conflict do nothing;

  select id into strict v_admin_role_id
  from public.user_roles
  where user_id = v_admin_id
    and role = 'admin'
    and scope_type = 'global'
    and scope_id is null;

  insert into public.user_roles (user_id, role, scope_type, created_by)
  values (v_student_id, 'student', 'global', v_admin_id)
  on conflict do nothing;

  select id into strict v_student_role_id
  from public.user_roles
  where user_id = v_student_id
    and role = 'student'
    and scope_type = 'global'
    and scope_id is null;

  insert into public.audit_log (
    actor_id,
    action,
    entity_type,
    entity_id,
    after_summary
  ) values
    (
      v_admin_id,
      'role.bootstrap_confirmed',
      'user_role',
      v_admin_role_id,
      jsonb_build_object('user_id', v_admin_id, 'role', 'admin', 'scope_type', 'global')
    ),
    (
      v_admin_id,
      'role.bootstrap_confirmed',
      'user_role',
      v_student_role_id,
      jsonb_build_object('user_id', v_student_id, 'role', 'student', 'scope_type', 'global')
    );
end;
$$;
```

## 3. Verify application access

1. Start Expo with `npm start -- --clear`.
2. Sign in as the student. Confirm `/home` opens and navigating directly to `/admin` returns to `/home`.
3. Sign out, then sign in as the administrator. Confirm `/admin` opens.
4. Sign out. Do not share either password or a reset link.

Later role changes must use `public.admin_set_user_role`; this direct bootstrap exists only because no administrator exists before the first role is assigned.

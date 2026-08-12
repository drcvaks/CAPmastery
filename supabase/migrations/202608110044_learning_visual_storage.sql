insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values (
  'learning-visuals',
  'learning-visuals',
  false,
  5242880,
  array['image/png']::text[]
) on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create function private.can_read_learning_visual(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    private.has_role('admin')
    or exists (
      select 1
      from private.visual_assets va
      join private.question_learning_support ls on ls.visual_asset_key = va.asset_key
      join public.study_session_questions sq on sq.question_id = ls.question_id
      join public.study_sessions s on s.id = sq.session_id
      join public.question_attempts a on a.session_question_id = sq.id
      where va.storage_path = p_object_name
        and va.status = 'approved'
        and s.student_id = (select auth.uid())
        and (s.mode = 'study' or s.status = 'completed')
    )
  );
$$;

create function public.admin_register_learning_visual(
  p_asset_key text,
  p_storage_path text,
  p_mime_type text,
  p_width integer,
  p_height integer,
  p_alt_text text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
begin
  if v_actor is null or not private.has_role('admin') then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;
  if p_asset_key is null
    or p_asset_key !~ '^[a-z0-9][a-z0-9_-]{2,119}$'
    or p_storage_path is null
    or p_storage_path !~ '^assets/cap-visuals/[a-z0-9][a-z0-9_.-]{2,199}\.png$'
    or p_mime_type <> 'image/png'
    or p_width is null or p_width <= 0
    or p_height is null or p_height <= 0
    or nullif(trim(p_alt_text), '') is null
    or char_length(p_alt_text) > 1000 then
    raise exception 'Visual asset metadata is invalid' using errcode = '22023';
  end if;
  if not exists (
    select 1
    from storage.objects o
    where o.bucket_id = 'learning-visuals'
      and o.name = p_storage_path
  ) then
    raise exception 'Uploaded visual object not found' using errcode = 'P0002';
  end if;

  insert into private.visual_assets (
    asset_key, storage_path, mime_type, width, height, alt_text,
    status, created_by, approved_by, approved_at
  ) values (
    p_asset_key, p_storage_path, p_mime_type, p_width, p_height, trim(p_alt_text),
    'approved', v_actor, v_actor, now()
  ) on conflict (asset_key) do update set
    storage_path = excluded.storage_path,
    mime_type = excluded.mime_type,
    width = excluded.width,
    height = excluded.height,
    alt_text = excluded.alt_text,
    status = 'approved',
    approved_by = v_actor,
    approved_at = now();

  insert into public.audit_log (
    actor_id, action, entity_type, after_summary
  ) values (
    v_actor,
    'learning_visual.registered',
    'visual_asset',
    jsonb_build_object(
      'asset_key', p_asset_key,
      'storage_path', p_storage_path,
      'mime_type', p_mime_type,
      'width', p_width,
      'height', p_height,
      'status', 'approved'
    )
  );
end;
$$;

drop policy if exists learning_visuals_select_authorized on storage.objects;
create policy learning_visuals_select_authorized
on storage.objects for select to authenticated
using (
  bucket_id = 'learning-visuals'
  and private.can_read_learning_visual(name)
);

drop policy if exists learning_visuals_insert_admin on storage.objects;
create policy learning_visuals_insert_admin
on storage.objects for insert to authenticated
with check (
  bucket_id = 'learning-visuals'
  and private.has_role('admin')
);

drop policy if exists learning_visuals_update_admin on storage.objects;
create policy learning_visuals_update_admin
on storage.objects for update to authenticated
using (
  bucket_id = 'learning-visuals'
  and private.has_role('admin')
)
with check (
  bucket_id = 'learning-visuals'
  and private.has_role('admin')
);

revoke all on function private.can_read_learning_visual(text) from public;
revoke all on function public.admin_register_learning_visual(text, text, text, integer, integer, text) from public;

grant execute on function private.can_read_learning_visual(text) to authenticated;
grant execute on function public.admin_register_learning_visual(text, text, text, integer, integer, text) to authenticated;

comment on function private.can_read_learning_visual is
  'Storage-policy helper allowing approved visuals only after an owned study attempt or completed delayed-feedback session; administrators retain upload access.';
comment on function public.admin_register_learning_visual is
  'Audited administrator-only registration and approval of an already-uploaded private learning visual.';

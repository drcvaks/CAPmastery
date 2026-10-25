-- Private image inventory and non-destructive, optimistic administrator replacement.
create function public.admin_get_learning_visuals()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not private.has_role('admin') then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'asset_key', va.asset_key, 'storage_path', va.storage_path,
      'width', va.width, 'height', va.height, 'alt_text', va.alt_text,
      'status', va.status, 'updated_at', va.updated_at,
      'locations', coalesce((
        select jsonb_agg(to_jsonb(loc) order by loc.exam_title, loc.module_number, loc.chapter_number, loc.chapter_title)
        from (
          select e.id exam_id, e.code exam_code, e.title exam_title,
            coalesce(c.title, t.title) chapter_title,
            q.module_number, q.chapter_number, count(*)::integer question_count
          from private.question_learning_support ls
          join public.questions q on q.id = ls.question_id
          join public.exams e on e.id = q.exam_id
          join public.topics t on t.id = q.topic_id
          left join public.chapters c on c.id = t.chapter_id
          where ls.visual_asset_key = va.asset_key
          group by e.id, e.code, e.title, c.title, t.title, q.module_number, q.chapter_number
        ) loc
      ), '[]'::jsonb)
    ) order by va.asset_key) from private.visual_assets va
  ), '[]'::jsonb);
end;
$$;

create function public.admin_replace_learning_visual(
  p_asset_key text, p_expected_storage_path text, p_storage_path text,
  p_width integer, p_height integer, p_alt_text text, p_reason text
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_before private.visual_assets%rowtype;
  v_actor uuid := (select auth.uid());
begin
  if v_actor is null or not private.has_role('admin') then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;
  select * into v_before from private.visual_assets where asset_key = p_asset_key for update;
  if not found then
    raise exception 'Visual asset not found' using errcode = 'P0002';
  end if;
  if p_expected_storage_path is distinct from v_before.storage_path then
    raise exception 'This image changed. Refresh the library before replacing it.' using errcode = '40001';
  end if;
  if p_storage_path is null
    or p_storage_path !~ '^assets/cap-visuals/revision-[a-f0-9-]{36}\.png$'
    or p_storage_path = v_before.storage_path
    or p_width is null or p_height is null
    or p_width not between 1 and 20000 or p_height not between 1 and 20000
    or nullif(trim(p_alt_text), '') is null or char_length(p_alt_text) > 1000
    or p_reason is null or char_length(trim(p_reason)) not between 10 and 500 then
    raise exception 'Replacement metadata is invalid' using errcode = '22023';
  end if;
  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'learning-visuals' and o.name = p_storage_path
      and o.metadata->>'mimetype' = 'image/png'
      and (o.metadata->>'size')::bigint between 1 and 5242880
  ) then
    raise exception 'Uploaded PNG object not found or exceeds five megabytes' using errcode = 'P0002';
  end if;
  update private.visual_assets set
    storage_path = p_storage_path, mime_type = 'image/png',
    width = p_width, height = p_height, alt_text = trim(p_alt_text),
    approved_by = case when status = 'approved' then v_actor else approved_by end,
    approved_at = case when status = 'approved' then now() else approved_at end
  where asset_key = p_asset_key;
  insert into public.audit_log (actor_id, action, entity_type, before_summary, after_summary)
  values (v_actor, 'learning_visual.replaced', 'visual_asset',
    jsonb_build_object('asset_key', p_asset_key, 'storage_path', v_before.storage_path,
      'width', v_before.width, 'height', v_before.height, 'alt_text', v_before.alt_text),
    jsonb_build_object('asset_key', p_asset_key, 'storage_path', p_storage_path,
      'width', p_width, 'height', p_height, 'alt_text', trim(p_alt_text), 'reason', trim(p_reason)));
end;
$$;

revoke all on function public.admin_get_learning_visuals() from public, anon;
revoke all on function public.admin_replace_learning_visual(text,text,text,integer,integer,text,text) from public, anon;
grant execute on function public.admin_get_learning_visuals() to authenticated;
grant execute on function public.admin_replace_learning_visual(text,text,text,integer,integer,text,text) to authenticated;

comment on function public.admin_get_learning_visuals() is 'Administrator-only image inventory, including unmapped assets; no private table grants.';
comment on function public.admin_replace_learning_visual(text,text,text,integer,integer,text,text) is 'Audited versioned replacement retaining the old object, asset key, question mappings, and approval status.';

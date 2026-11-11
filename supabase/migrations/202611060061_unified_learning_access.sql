create function public.admin_learning_access(
  p_user_id uuid,
  p_student_enabled boolean default null,
  p_import_packages text[] default null,
  p_grants jsonb default null
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v_access jsonb;
begin
  if not private.has_role('admin') then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;
  perform 1 from public.profiles where id=p_user_id for update;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
  if p_student_enabled is not null then
    perform public.admin_update_student_access(p_user_id, p_student_enabled, p_import_packages);
  end if;
  v_access := public.admin_content_tester_access(p_user_id, p_grants);
  return jsonb_build_object(
    'grants', v_access->'grants',
    'sections', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.exam_title, s.module_number, s.chapter_number, s.title, s.chapter_id)
      from (
        select e.id as exam_id, e.title as exam_title, q.module_number,
          case when grouping(coalesce(t.chapter_id,t.id)) = 0 then coalesce(t.chapter_id,t.id) end as chapter_id,
          min(q.chapter_number) as chapter_number,
          case when grouping(coalesce(t.chapter_id,t.id)) = 0 then min(coalesce(c.title,t.title))
            else coalesce(min(v.title), 'Module ' || q.module_number) end as title,
          count(distinct q.id) as question_count,
          count(distinct a.asset_key) as image_count,
          coalesce(array_agg(distinct q.import_package) filter (where q.import_package is not null), '{}'::text[]) as packages
        from public.questions q
        join public.exams e on e.id=q.exam_id
        join public.topics t on t.id=q.topic_id
        left join public.chapters c on c.id=t.chapter_id
        left join public.volumes v on v.id=t.volume_id
        left join private.question_learning_support ls on ls.question_id=q.id
        left join private.visual_assets a on a.asset_key=ls.visual_asset_key
        group by e.id,e.title,q.module_number,grouping sets ((coalesce(t.chapter_id,t.id)), ())
        having grouping(coalesce(t.chapter_id,t.id))=0 or q.module_number is not null
      ) s
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_learning_access(uuid,boolean,text[],jsonb) from public,anon,authenticated;
grant execute on function public.admin_learning_access(uuid,boolean,text[],jsonb) to authenticated;

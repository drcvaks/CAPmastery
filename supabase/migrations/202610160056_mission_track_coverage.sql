create function public.get_student_mission_tracks()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_student uuid := (select auth.uid());
  v_result jsonb;
begin
  if v_student is null or not private.has_role('student') then
    raise exception 'Student role required' using errcode = '42501';
  end if;

  with accessible as materialized (
    select q.id, q.exam_id, q.topic_id, q.module_number, q.chapter_number
    from public.questions q
    join public.exams e on e.id = q.exam_id and e.status = 'active'
    join public.topics t on t.id = q.topic_id and t.exam_id = q.exam_id and t.status = 'active'
    where (q.review_status = 'approved' and q.status = 'active')
      or (q.review_status = 'draft' and q.status = 'draft'
        and q.import_package is not null and private.has_pilot_package_access(q.import_package))
  ), practiced as (
    select distinct a.question_id
    from public.question_attempts a
    join accessible q on q.id = a.question_id
    where a.student_id = v_student
  ), sections as (
    select q.exam_id, t.id topic_id, t.title,
      coalesce(c.title, t.title) chapter_title,
      coalesce(c.sort_order, t.sort_order) section_order,
      min(q.module_number) module_number,
      min(q.chapter_number) chapter_number,
      max(v.title) module_title,
      count(*)::integer available_count,
      count(p.question_id)::integer practiced_count
    from accessible q
    join public.topics t on t.id = q.topic_id
    left join public.chapters c on c.id = t.chapter_id
    left join public.volumes v on v.id = t.volume_id
    left join practiced p on p.question_id = q.id
    group by q.exam_id, t.id, t.title, c.title, c.sort_order, t.sort_order
  )
  select coalesce(jsonb_agg(track.record order by track.sort_order, track.title), '[]'::jsonb)
  into v_result
  from (
    select e.sort_order, e.title, jsonb_build_object(
      'id', e.id, 'title', e.title,
      'available_count', sum(section.available_count),
      'practiced_count', sum(section.practiced_count),
      'active_session_id', (select s.id from public.study_sessions s
        where s.student_id = v_student and s.exam_id = e.id and s.mode = 'study' and s.status = 'active'
        order by s.updated_at desc, s.id limit 1),
      'sections', jsonb_agg(jsonb_build_object(
        'topic_id', section.topic_id, 'title', section.title,
        'chapter_title', section.chapter_title, 'chapter_number', section.chapter_number,
        'module_number', section.module_number, 'module_title', section.module_title,
        'available_count', section.available_count, 'practiced_count', section.practiced_count
      ) order by section.module_number nulls first, section.section_order, section.title)
    ) record
    from sections section
    join public.exams e on e.id = section.exam_id
    group by e.id
    having sum(section.available_count) >= 5
  ) track;
  return v_result;
end;
$$;

revoke all on function public.get_student_mission_tracks() from public, anon;
grant execute on function public.get_student_mission_tracks() to authenticated;
comment on function public.get_student_mission_tracks() is
  'Student-owner track coverage from distinct accessible practiced questions, with one resumable study session per exam. No correctness or mastery is returned.';

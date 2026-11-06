-- Complete reviewer-only curriculum metadata; answer keys stay in the single-question RPC.
create function public.get_content_review_catalog()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not private.can_review_content() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'question_id', q.id, 'external_id', q.external_id, 'question_text', q.question_text,
      'exam_id', e.id, 'exam_code', e.code, 'exam_title', e.title,
      'topic_title', t.title, 'chapter_title', coalesce(c.title, t.title),
      'chapter_number', q.chapter_number, 'module_number', q.module_number,
      'module_title', case when q.module_number is not null then v.title else null end,
      'review_status', q.review_status, 'version', q.version, 'updated_at', q.updated_at
    ) order by e.sort_order, e.title, q.module_number, c.sort_order, t.sort_order, q.external_id, q.id)
    from public.questions q
    join public.exams e on e.id = q.exam_id
    join public.topics t on t.id = q.topic_id
    left join public.chapters c on c.id = t.chapter_id
    left join public.volumes v on v.id = t.volume_id
  ), '[]'::jsonb);
end;
$$;
revoke all on function public.get_content_review_catalog() from public, anon;
grant execute on function public.get_content_review_catalog() to authenticated;
comment on function public.get_content_review_catalog() is
  'Reviewer/admin-only full question catalog as one JSON array, avoiding row-response limits. Includes curriculum labels, not choices, answer keys, or student data.';

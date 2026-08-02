create function public.get_study_session_question_context(p_session_id uuid)
returns table (
  session_question_id uuid,
  chapter_number integer,
  chapter_title text,
  topic_title text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1
    from public.study_sessions s
    where s.id = p_session_id
      and s.student_id = (select auth.uid())
  ) then
    raise exception 'Study session not found' using errcode = 'P0002';
  end if;

  return query
  select
    sq.id,
    coalesce(
      q.chapter_number,
      nullif(substring(ch.code from '_C([0-9]+)$'), '')::integer
    ),
    ch.title,
    t.title
  from public.study_session_questions sq
  join public.questions q on q.id = sq.question_id
  join public.topics t on t.id = q.topic_id
  left join public.chapters ch on ch.id = t.chapter_id
  where sq.session_id = p_session_id
  order by sq.position;
end;
$$;

revoke all on function public.get_study_session_question_context(uuid) from public;
grant execute on function public.get_study_session_question_context(uuid) to authenticated;

comment on function public.get_study_session_question_context is
  'Returns only chapter and topic labels for questions in an authenticated student-owned session, including assigned private drafts.';

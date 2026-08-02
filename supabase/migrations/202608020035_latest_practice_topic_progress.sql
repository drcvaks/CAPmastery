create function public.get_latest_practice_test_topic_results(
  p_student_id uuid,
  p_exam_id uuid
)
returns table (
  session_id uuid,
  completed_at timestamptz,
  topic_id uuid,
  topic_title text,
  question_count integer,
  answered_count integer,
  correct_count integer,
  score_percent numeric,
  performance_label text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
    or not private.can_view_student_progress(p_student_id) then
    raise exception 'Progress access denied' using errcode = '42501';
  end if;

  return query
  with latest_session as (
    select s.id, s.completed_at
    from public.study_sessions s
    join public.practice_test_blueprints b on b.id = s.blueprint_id
    where s.student_id = p_student_id
      and s.exam_id = p_exam_id
      and s.mode = 'practice_test'
      and s.status = 'completed'
      and b.selection_strategy = 'mitchell_full_exam'
    order by s.completed_at desc nulls last, s.created_at desc, s.id
    limit 1
  )
  select
    latest.id,
    latest.completed_at,
    t.id,
    t.title,
    count(*)::integer,
    count(a.id)::integer,
    count(a.id) filter (where a.is_correct)::integer,
    round(count(a.id) filter (where a.is_correct)::numeric / count(*) * 100, 2),
    case
      when count(a.id) = 0 then 'Not attempted'
      when count(a.id) filter (where a.is_correct)::numeric / count(*) >= 0.80 then 'Strength'
      when count(a.id) filter (where a.is_correct)::numeric / count(*) >= 0.60 then 'Developing'
      else 'Review next'
    end
  from latest_session latest
  join public.study_session_questions sq on sq.session_id = latest.id
  join public.questions q on q.id = sq.question_id
  join public.topics t on t.id = q.topic_id
  left join public.question_attempts a on a.session_question_id = sq.id
  group by latest.id, latest.completed_at, t.id, t.title
  order by 8, t.title;
end;
$$;

revoke all on function public.get_latest_practice_test_topic_results(uuid, uuid) from public;
grant execute on function public.get_latest_practice_test_topic_results(uuid, uuid) to authenticated;

comment on function public.get_latest_practice_test_topic_results is
  'Returns chapter/topic analysis from the latest completed Mitchell full practice exam for an authorized student or linked guardian.';

create or replace function public.get_accessible_study_catalog()
returns table (
  exam_id uuid,
  topic_id uuid,
  available_question_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    q.exam_id,
    q.topic_id,
    count(*)::integer as available_question_count
  from public.questions q
  join public.exams e on e.id = q.exam_id and e.status = 'active'
  join public.topics t on t.id = q.topic_id and t.exam_id = q.exam_id and t.status = 'active'
  where (select auth.uid()) is not null
    and private.has_role('student')
    and (
      (q.review_status = 'approved' and q.status = 'active')
      or (
        q.review_status = 'draft'
        and q.status = 'draft'
        and q.import_package is not null
        and private.has_pilot_package_access(q.import_package)
      )
    )
  group by q.exam_id, q.topic_id;
$$;

revoke all on function public.get_accessible_study_catalog() from public;
grant execute on function public.get_accessible_study_catalog() to authenticated;

comment on function public.get_accessible_study_catalog() is
  'Student-safe per-topic counts for approved content or exact assigned private packages; returns no question or answer data.';

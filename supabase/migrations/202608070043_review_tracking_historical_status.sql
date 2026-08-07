create or replace function public.get_practice_test_review_progress(p_session_id uuid)
returns table (
  session_id uuid,
  tracking_available boolean,
  missed_count integer,
  reviewed_count integer,
  review_percent integer,
  review_complete boolean,
  reviewed_session_question_ids uuid[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_student_id uuid;
  v_tracking_version smallint;
begin
  select s.student_id, s.review_tracking_version
  into v_student_id, v_tracking_version
  from public.study_sessions s
  join public.practice_test_blueprints b on b.id = s.blueprint_id
  where s.id = p_session_id
    and s.mode = 'practice_test'
    and s.status = 'completed'
    and b.selection_strategy = 'mitchell_full_exam';

  if not found then
    raise exception 'Completed Mitchell practice test not found' using errcode = 'P0002';
  end if;
  if (select auth.uid()) is null
    or not private.can_view_student_progress(v_student_id) then
    raise exception 'Progress access denied' using errcode = '42501';
  end if;

  return query
  with missed as (
    select sq.id, sq.reviewed_at
    from public.study_session_questions sq
    join public.question_attempts a on a.session_question_id = sq.id
    where sq.session_id = p_session_id
      and not a.is_correct
  ), totals as (
    select
      count(*)::integer as missed_count,
      count(*) filter (where reviewed_at is not null)::integer as reviewed_count,
      coalesce(
        array_agg(id order by id) filter (where reviewed_at is not null),
        '{}'::uuid[]
      ) as reviewed_ids
    from missed
  )
  select
    p_session_id,
    coalesce(v_tracking_version = 1, false),
    totals.missed_count,
    case when v_tracking_version = 1 then totals.reviewed_count else 0 end,
    case
      when v_tracking_version is distinct from 1 then null
      when totals.missed_count = 0 then 100
      else round(totals.reviewed_count::numeric / totals.missed_count * 100)::integer
    end,
    case
      when v_tracking_version is distinct from 1 then false
      else totals.reviewed_count = totals.missed_count
    end,
    case
      when v_tracking_version = 1 and (select auth.uid()) = v_student_id
        then totals.reviewed_ids
      else '{}'::uuid[]
    end
  from totals;
end;
$$;

revoke all on function public.get_practice_test_review_progress(uuid) from public;
grant execute on function public.get_practice_test_review_progress(uuid) to authenticated;

comment on function public.get_practice_test_review_progress is
  'Returns missed-answer review completion for a completed Mitchell full practice test to its student or an authorized linked guardian; historical untracked sessions return tracking_available false.';

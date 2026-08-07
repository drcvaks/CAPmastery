alter table public.study_sessions
  add column review_tracking_version smallint
  constraint study_sessions_review_tracking_version_check
    check (review_tracking_version is null or review_tracking_version = 1);

alter table public.study_session_questions
  add column reviewed_at timestamptz;

create function private.set_practice_review_tracking_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.mode = 'practice_test'
    and new.blueprint_id is not null
    and exists (
      select 1
      from public.practice_test_blueprints b
      where b.id = new.blueprint_id
        and b.selection_strategy = 'mitchell_full_exam'
    ) then
    new.review_tracking_version := 1;
  end if;
  return new;
end;
$$;

create trigger study_sessions_set_review_tracking_version
before insert on public.study_sessions
for each row execute function private.set_practice_review_tracking_version();

create function public.get_practice_test_review_progress(p_session_id uuid)
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

create function public.mark_practice_answer_reviewed(p_session_question_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1
    from public.study_session_questions sq
    join public.study_sessions s on s.id = sq.session_id
    join public.practice_test_blueprints b on b.id = s.blueprint_id
    join public.question_attempts a on a.session_question_id = sq.id
    where sq.id = p_session_question_id
      and s.student_id = (select auth.uid())
      and s.mode = 'practice_test'
      and s.status = 'completed'
      and s.review_tracking_version = 1
      and b.selection_strategy = 'mitchell_full_exam'
      and not a.is_correct
  ) then
    raise exception 'Reviewable missed answer not found' using errcode = 'P0002';
  end if;

  update public.study_session_questions
  set reviewed_at = coalesce(reviewed_at, now())
  where id = p_session_question_id;
end;
$$;

revoke all on function private.set_practice_review_tracking_version() from public;
revoke all on function public.get_practice_test_review_progress(uuid) from public;
revoke all on function public.mark_practice_answer_reviewed(uuid) from public;

grant execute on function public.get_practice_test_review_progress(uuid) to authenticated;
grant execute on function public.mark_practice_answer_reviewed(uuid) to authenticated;

comment on column public.study_sessions.review_tracking_version is
  'Null for historical sessions whose completed-answer review cannot be inferred; version 1 records deliberate missed-answer review completion.';
comment on column public.study_session_questions.reviewed_at is
  'First time the owning cadet deliberately completed review of this missed answer; written only through the protected review function.';
comment on function public.get_practice_test_review_progress is
  'Returns missed-answer review completion for a completed Mitchell full practice test to its student or an authorized linked guardian.';
comment on function public.mark_practice_answer_reviewed is
  'Idempotently records deliberate review of one incorrect answer after a tracked Mitchell full practice test is completed.';

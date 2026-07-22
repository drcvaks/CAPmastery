create function private.readiness_score_with_practice(
  p_attempted integer,
  p_coverage numeric,
  p_recent_accuracy numeric,
  p_mastery numeric,
  p_retention numeric,
  p_weak_topics integer,
  p_topic_count integer,
  p_practice_score numeric
)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case
    when p_practice_score is null then private.readiness_score(
      p_attempted, p_coverage, p_recent_accuracy, p_mastery,
      p_retention, p_weak_topics, p_topic_count
    )
    when p_attempted = 0 then 0::numeric
    else round(
      least(
        private.readiness_coverage_cap(p_attempted, p_coverage),
        greatest(
          0,
          least(100, p_coverage) * 0.15
          + greatest(0, least(100, p_recent_accuracy)) * 0.20
          + greatest(0, least(100, p_mastery)) * 0.25
          + greatest(0, least(100, p_retention)) * 0.15
          + greatest(0, least(100, p_practice_score)) * 0.25
          - case when p_topic_count > 0
              then least(15, greatest(0, p_weak_topics)::numeric / p_topic_count * 15)
              else 0
            end
        )
      ),
      2
    )
  end;
$$;

alter function public.get_progress_dashboard(uuid, uuid) set schema private;
alter function private.get_progress_dashboard(uuid, uuid) rename to get_progress_dashboard_checkpoint6;
revoke all on function private.get_progress_dashboard_checkpoint6(uuid, uuid) from public, anon, authenticated;

create function public.get_progress_dashboard(
  p_student_id uuid,
  p_exam_id uuid default null
)
returns table (
  student_id uuid,
  student_name text,
  exam_id uuid,
  exam_title text,
  eligible_question_count integer,
  attempted_question_count integer,
  topic_count integer,
  practiced_topic_count integer,
  coverage_score numeric,
  recent_accuracy_score numeric,
  mastery_score numeric,
  retention_score numeric,
  weak_topic_count integer,
  due_question_count integer,
  readiness_score numeric,
  readiness_label text,
  recommended_topic_id uuid,
  recommended_topic_title text,
  recommended_action text
)
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select * from private.get_progress_dashboard_checkpoint6(p_student_id, p_exam_id)
  ), covered as (
    select q.exam_id, count(distinct a.question_id)::integer as attempted_count
    from public.question_attempts a
    join public.questions q on q.id = a.question_id
    where a.student_id = p_student_id
      and (p_exam_id is null or q.exam_id = p_exam_id)
    group by q.exam_id
  ), ordinary_recent as (
    select recent_attempts.exam_id,
      round(avg(case when recent_attempts.is_correct then 100 else 0 end), 2) as score
    from (
      select q.exam_id, a.is_correct,
        row_number() over (partition by q.exam_id order by a.submitted_at desc, a.id desc) as recency
      from public.question_attempts a
      join public.study_sessions s on s.id = a.session_id and s.mode = 'study'
      join public.questions q on q.id = a.question_id
      where a.student_id = p_student_id
        and (p_exam_id is null or q.exam_id = p_exam_id)
    ) recent_attempts
    where recent_attempts.recency <= 30
    group by recent_attempts.exam_id
  ), practice as (
    select recent_tests.exam_id, round(avg(recent_tests.score), 2) as score
    from (
      select s.exam_id,
        s.correct_count::numeric / s.question_count * 100 as score,
        row_number() over (
          partition by s.exam_id order by s.completed_at desc, s.id desc
        ) as recency
      from public.study_sessions s
      where s.student_id = p_student_id
        and s.mode = 'practice_test'
        and s.status = 'completed'
        and (p_exam_id is null or s.exam_id = p_exam_id)
    ) recent_tests
    where recent_tests.recency <= 3
    group by recent_tests.exam_id
  ), metrics as (
    select
      b.*,
      least(b.eligible_question_count, coalesce(c.attempted_count, 0))::integer as all_attempted,
      round(case when b.eligible_question_count = 0 then 0
        else least(b.eligible_question_count, coalesce(c.attempted_count, 0))::numeric
          / b.eligible_question_count * 100 end, 2) as all_coverage,
      coalesce(o.score, 0) as ordinary_score,
      p.score as practice_score
    from base b
    left join covered c on c.exam_id = b.exam_id
    left join ordinary_recent o on o.exam_id = b.exam_id
    left join practice p on p.exam_id = b.exam_id
  ), scored as (
    select m.*,
      private.readiness_score_with_practice(
        m.all_attempted, m.all_coverage, m.ordinary_score, m.mastery_score,
        m.retention_score, m.weak_topic_count, m.topic_count, m.practice_score
      ) as adjusted_score
    from metrics m
  )
  select
    s.student_id,
    s.student_name,
    s.exam_id,
    s.exam_title,
    s.eligible_question_count,
    s.all_attempted,
    s.topic_count,
    s.practiced_topic_count,
    s.all_coverage,
    s.ordinary_score,
    s.mastery_score,
    s.retention_score,
    s.weak_topic_count,
    s.due_question_count,
    s.adjusted_score,
    private.readiness_label(s.adjusted_score, s.all_attempted),
    s.recommended_topic_id,
    s.recommended_topic_title,
    s.recommended_action
  from scored s
  order by s.exam_title;
$$;

create or replace function public.get_progress_trends(
  p_student_id uuid,
  p_exam_id uuid,
  p_days integer default 30
)
returns table (
  trend_date date,
  questions_answered integer,
  correct_count integer,
  accuracy_score numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_days is null or p_days < 7 or p_days > 180 then
    raise exception 'Trend range must be between 7 and 180 days' using errcode = '22023';
  end if;
  if not private.can_view_student_progress(p_student_id) then return; end if;
  return query
  select
    (a.submitted_at at time zone 'UTC')::date,
    count(*)::integer,
    count(*) filter (where a.is_correct)::integer,
    round(count(*) filter (where a.is_correct)::numeric / count(*) * 100, 2)
  from public.question_attempts a
  join public.study_sessions s on s.id = a.session_id and s.mode = 'study'
  join public.questions q on q.id = a.question_id
  where a.student_id = p_student_id
    and q.exam_id = p_exam_id
    and a.submitted_at >= now() - make_interval(days => p_days)
  group by (a.submitted_at at time zone 'UTC')::date
  order by trend_date;
end;
$$;

revoke all on function private.readiness_score_with_practice(integer, numeric, numeric, numeric, numeric, integer, integer, numeric) from public;
revoke all on function public.get_progress_dashboard(uuid, uuid) from public;
revoke all on function public.get_progress_trends(uuid, uuid, integer) from public;
grant execute on function public.get_progress_dashboard(uuid, uuid) to authenticated;
grant execute on function public.get_progress_trends(uuid, uuid, integer) to authenticated;

comment on function private.readiness_score_with_practice is 'Uses the Checkpoint 6 weights until a completed practice test exists, then gives a distinct 25 percent practice-test component.';
comment on function public.get_progress_dashboard is 'Keeps ordinary recent accuracy/mastery separate while allowing recent completed practice tests to influence coverage-capped readiness.';
comment on function public.get_progress_trends is 'Returns ordinary-study UTC daily trends; practice-test results are reported separately.';

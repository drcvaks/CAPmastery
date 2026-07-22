create or replace function public.get_progress_dashboard(
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
  ), covered_questions as (
    select s.question_id
    from public.student_question_state s
    where s.student_id = p_student_id
    union
    select a.question_id
    from public.question_attempts a
    where a.student_id = p_student_id
  ), covered as (
    select q.exam_id, count(distinct cq.question_id)::integer as attempted_count
    from covered_questions cq
    join public.questions q on q.id = cq.question_id
    where p_exam_id is null or q.exam_id = p_exam_id
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

revoke all on function public.get_progress_dashboard(uuid, uuid) from public;
grant execute on function public.get_progress_dashboard(uuid, uuid) to authenticated;

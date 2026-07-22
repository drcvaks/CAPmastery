create or replace function private.readiness_score(
  p_attempted integer,
  p_coverage numeric,
  p_recent_accuracy numeric,
  p_mastery numeric,
  p_retention numeric,
  p_weak_topics integer,
  p_topic_count integer
)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case
    when p_attempted = 0 then 0::numeric
    else round(
      least(
        private.readiness_coverage_cap(p_attempted, p_coverage),
        greatest(
          0,
          least(100, p_coverage) * 0.15
          + greatest(0, least(100, p_recent_accuracy)) * 0.30
          + greatest(0, least(100, p_mastery)) * 0.35
          + greatest(0, least(100, p_retention)) * 0.20
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

create function private.readiness_label(p_score numeric, p_attempted integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_attempted = 0 then 'Not started'
    else private.readiness_label(p_score)
  end;
$$;

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
  with eligible as (
    select q.id as question_id, q.exam_id, q.topic_id
    from public.questions q
    where (p_exam_id is null or q.exam_id = p_exam_id)
      and (
        (q.review_status = 'approved' and q.status = 'active')
        or (
          q.review_status = 'draft'
          and q.status = 'draft'
          and q.import_package is not null
          and exists (
            select 1 from public.pilot_package_assignments a
            where a.student_id = p_student_id and a.import_package = q.import_package
          )
        )
      )
  ), question_metrics as (
    select
      e.exam_id,
      count(*)::integer as eligible_count,
      count(*) filter (where qs.times_seen > 0)::integer as attempted_count,
      count(*) filter (where qs.next_review_at <= now())::integer as due_count
    from eligible e
    left join public.student_question_state qs
      on qs.student_id = p_student_id and qs.question_id = e.question_id
    group by e.exam_id
  ), topic_rows as (
    select
      et.exam_id,
      t.id as topic_id,
      t.title,
      coalesce(tm.attempts_count, 0) as attempts_count,
      coalesce(tm.mastery_score, 40) as mastery_score,
      case
        when tm.last_practiced_at is null then 0
        else greatest(
          0,
          tm.mastery_score - least(
            35,
            greatest(0, extract(epoch from (now() - tm.last_practiced_at)) / 86400)
              * (1.25 - tm.confidence_score / 200)
          )
        )
      end as retention_score,
      coalesce(tm.status, 'not_started'::public.mastery_status) as status,
      coalesce(tm.next_review_at <= now(), false) as is_due
    from (select distinct exam_id, topic_id from eligible) et
    join public.topics t on t.id = et.topic_id
    left join public.student_topic_mastery tm
      on tm.student_id = p_student_id and tm.topic_id = et.topic_id
  ), topic_metrics as (
    select
      tr.exam_id,
      count(*)::integer as topic_count,
      count(*) filter (where tr.attempts_count > 0)::integer as practiced_count,
      round(avg(tr.mastery_score), 2) as mastery_score,
      round(avg(tr.retention_score), 2) as retention_score,
      count(*) filter (
        where tr.status in ('beginning', 'needs_review') or tr.mastery_score < 40
      )::integer as weak_count
    from topic_rows tr
    group by tr.exam_id
  ), recent as (
    select exam_attempts.exam_id,
      round(avg(case when exam_attempts.is_correct then 100 else 0 end), 2) as recent_accuracy
    from (
      select q.exam_id, a.is_correct,
        row_number() over (partition by q.exam_id order by a.submitted_at desc, a.id desc) as recency
      from public.question_attempts a
      join public.questions q on q.id = a.question_id
      where a.student_id = p_student_id
        and (p_exam_id is null or q.exam_id = p_exam_id)
    ) exam_attempts
    where exam_attempts.recency <= 30
    group by exam_attempts.exam_id
  ), metrics as (
    select
      qm.exam_id,
      qm.eligible_count,
      qm.attempted_count,
      tm.topic_count,
      tm.practiced_count,
      round(case when qm.eligible_count = 0 then 0
        else qm.attempted_count::numeric / qm.eligible_count * 100 end, 2) as coverage,
      coalesce(r.recent_accuracy, 0) as recent_accuracy,
      coalesce(tm.mastery_score, 40) as mastery,
      coalesce(tm.retention_score, 0) as retention,
      tm.weak_count,
      qm.due_count
    from question_metrics qm
    join topic_metrics tm on tm.exam_id = qm.exam_id
    left join recent r on r.exam_id = qm.exam_id
  ), scored as (
    select m.*,
      private.readiness_score(
        m.attempted_count, m.coverage, m.recent_accuracy, m.mastery,
        m.retention, m.weak_count, m.topic_count
      ) as score
    from metrics m
  )
  select
    p_student_id,
    p.display_name,
    e.id,
    e.title,
    s.eligible_count,
    s.attempted_count,
    s.topic_count,
    s.practiced_count,
    s.coverage,
    s.recent_accuracy,
    s.mastery,
    s.retention,
    s.weak_count,
    s.due_count,
    s.score,
    private.readiness_label(s.score, s.attempted_count),
    recommendation.topic_id,
    recommendation.title,
    case
      when s.attempted_count = 0 then 'Start a 10-question study session.'
      when s.due_count > 0 then 'Review ' || s.due_count || ' question' || case when s.due_count = 1 then '' else 's' end || ' due now.'
      when s.weak_count > 0 and recommendation.title is not null then 'Strengthen ' || recommendation.title || ' next.'
      when s.coverage < 70 then 'Keep exploring new questions to build coverage.'
      else 'Complete another mixed session to strengthen retention.'
    end
  from scored s
  join public.exams e on e.id = s.exam_id
  join public.profiles p on p.id = p_student_id
  left join lateral (
    select tr.topic_id, tr.title
    from topic_rows tr
    where tr.exam_id = s.exam_id
    order by
      case when tr.status in ('needs_review', 'beginning') or tr.is_due then 0 else 1 end,
      tr.mastery_score,
      tr.title
    limit 1
  ) recommendation on true
  where private.can_view_student_progress(p_student_id)
  order by e.title;
$$;

revoke all on function private.readiness_label(numeric, integer) from public;

comment on function private.readiness_label(numeric, integer) is 'Returns Not started only when no answers exist; otherwise maps the computed readiness score.';

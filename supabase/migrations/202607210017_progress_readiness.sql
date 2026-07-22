create function private.can_view_student_progress(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_student_id = (select auth.uid())
    or exists (
      select 1
      from public.student_guardian_links l
      where l.guardian_id = (select auth.uid())
        and l.student_id = p_student_id
        and l.status = 'active'
        and l.can_view_progress
    );
$$;

create function private.readiness_coverage_cap(
  p_attempted integer,
  p_coverage numeric
)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case
    when p_attempted < 10 or p_coverage < 20 then 40
    when p_attempted < 20 or p_coverage < 50 then 65
    when p_attempted < 30 or p_coverage < 70 then 79
    else 100
  end::numeric;
$$;

create function private.readiness_score(
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
  select round(
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
  );
$$;

create function private.readiness_label(p_score numeric)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_score < 50 then 'Developing'
    when p_score < 70 then 'Getting Close'
    when p_score < 85 then 'Practice-Test Ready'
    else 'Strong Readiness'
  end;
$$;

create function public.get_progress_students()
returns table (
  student_id uuid,
  display_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select distinct p.id, p.display_name
  from public.profiles p
  where (select auth.uid()) is not null
    and p.status = 'active'
    and (
      (
        p.id = (select auth.uid())
        and exists (
          select 1 from public.user_roles r
          where r.user_id = p.id and r.role = 'student'
        )
      )
      or exists (
        select 1
        from public.student_guardian_links l
        where l.guardian_id = (select auth.uid())
          and l.student_id = p.id
          and l.status = 'active'
          and l.can_view_progress
      )
    )
  order by p.display_name, p.id;
$$;

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
    private.readiness_label(s.score),
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

create function public.get_topic_progress(
  p_student_id uuid,
  p_exam_id uuid
)
returns table (
  topic_id uuid,
  topic_title text,
  eligible_question_count integer,
  attempted_question_count integer,
  attempts_count integer,
  correct_count integer,
  accuracy_score numeric,
  mastery_score numeric,
  confidence_score numeric,
  retention_score numeric,
  status public.mastery_status,
  due_question_count integer,
  last_practiced_at timestamptz,
  next_review_at timestamptz,
  recommended boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with eligible as (
    select q.id as question_id, q.topic_id
    from public.questions q
    where q.exam_id = p_exam_id
      and (
        (q.review_status = 'approved' and q.status = 'active')
        or (
          q.review_status = 'draft' and q.status = 'draft' and q.import_package is not null
          and exists (
            select 1 from public.pilot_package_assignments a
            where a.student_id = p_student_id and a.import_package = q.import_package
          )
        )
      )
  ), question_totals as (
    select
      e.topic_id,
      count(*)::integer as eligible_count,
      count(*) filter (where qs.times_seen > 0)::integer as attempted_count,
      count(*) filter (where qs.next_review_at <= now())::integer as due_count,
      coalesce(sum(qs.times_seen), 0)::integer as attempts_count,
      coalesce(sum(qs.times_correct), 0)::integer as correct_count
    from eligible e
    left join public.student_question_state qs
      on qs.student_id = p_student_id and qs.question_id = e.question_id
    group by e.topic_id
  )
  select
    t.id as topic_id,
    t.title as topic_title,
    qt.eligible_count as eligible_question_count,
    qt.attempted_count as attempted_question_count,
    qt.attempts_count,
    qt.correct_count,
    round(case when qt.attempts_count = 0 then 0
      else qt.correct_count::numeric / qt.attempts_count * 100 end, 2) as accuracy_score,
    coalesce(tm.mastery_score, 40) as mastery_score,
    coalesce(tm.confidence_score, 0) as confidence_score,
    round(case
      when tm.last_practiced_at is null then 0
      else greatest(0, tm.mastery_score - least(
        35,
        greatest(0, extract(epoch from (now() - tm.last_practiced_at)) / 86400)
          * (1.25 - tm.confidence_score / 200)
      ))
    end, 2) as retention_score,
    coalesce(tm.status, 'not_started'::public.mastery_status) as status,
    qt.due_count as due_question_count,
    tm.last_practiced_at,
    tm.next_review_at,
    qt.due_count > 0
      or coalesce(tm.status, 'not_started'::public.mastery_status) in ('beginning', 'needs_review')
      or coalesce(tm.mastery_score, 40) < 40 as recommended
  from question_totals qt
  join public.topics t on t.id = qt.topic_id
  left join public.student_topic_mastery tm
    on tm.student_id = p_student_id and tm.topic_id = qt.topic_id
  where private.can_view_student_progress(p_student_id)
  order by recommended desc, mastery_score, t.title;
$$;

create function public.get_progress_trends(
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
  if not private.can_view_student_progress(p_student_id) then
    return;
  end if;

  return query
  select
    (a.submitted_at at time zone 'UTC')::date,
    count(*)::integer,
    count(*) filter (where a.is_correct)::integer,
    round(avg(case when a.is_correct then 100 else 0 end), 2)
  from public.question_attempts a
  join public.questions q on q.id = a.question_id
  where a.student_id = p_student_id
    and q.exam_id = p_exam_id
    and a.submitted_at >= now() - make_interval(days => p_days)
  group by (a.submitted_at at time zone 'UTC')::date
  order by trend_date;
end;
$$;

revoke all on function private.can_view_student_progress(uuid) from public;
revoke all on function private.readiness_coverage_cap(integer, numeric) from public;
revoke all on function private.readiness_score(integer, numeric, numeric, numeric, numeric, integer, integer) from public;
revoke all on function private.readiness_label(numeric) from public;
revoke all on function public.get_progress_students() from public;
revoke all on function public.get_progress_dashboard(uuid, uuid) from public;
revoke all on function public.get_topic_progress(uuid, uuid) from public;
revoke all on function public.get_progress_trends(uuid, uuid, integer) from public;
grant execute on function public.get_progress_students() to authenticated;
grant execute on function public.get_progress_dashboard(uuid, uuid) to authenticated;
grant execute on function public.get_topic_progress(uuid, uuid) to authenticated;
grant execute on function public.get_progress_trends(uuid, uuid, integer) to authenticated;

comment on function public.get_progress_students is 'Lists only the current student and/or actively linked students whose progress the caller may view.';
comment on function public.get_progress_dashboard is 'Returns coverage-capped unofficial readiness and a supportive next action for an authorized student.';
comment on function public.get_topic_progress is 'Returns authorized topic mastery, retention, due review, and coverage detail without answer content.';
comment on function public.get_progress_trends is 'Returns authorized UTC daily answer trends for a bounded recent range.';

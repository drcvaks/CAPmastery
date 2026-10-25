create table public.student_mission_preferences (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  weekly_goal integer not null default 50 check (weekly_goal in (25, 50, 100))
);

alter table public.student_mission_preferences enable row level security;
create policy student_mission_preferences_select_own
on public.student_mission_preferences for select to authenticated
using (student_id = (select auth.uid()) and private.has_role('student'));
revoke all on public.student_mission_preferences from anon, authenticated;
grant select on public.student_mission_preferences to authenticated;

create function public.set_student_weekly_mission(p_goal integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not private.has_role('student') then
    raise exception 'Student role required' using errcode = '42501';
  end if;
  if p_goal is null or p_goal not in (25, 50, 100) then
    raise exception 'Weekly goal must be 25, 50, or 100' using errcode = '22023';
  end if;
  insert into public.student_mission_preferences(student_id, weekly_goal)
  values ((select auth.uid()), p_goal)
  on conflict (student_id) do update set weekly_goal = excluded.weekly_goal;
end;
$$;

create function public.get_student_missions(p_timezone text default 'UTC')
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_student uuid := (select auth.uid());
  v_today date;
  v_day_start timestamptz;
  v_week_start timestamptz;
  v_week_end timestamptz;
begin
  if v_student is null or not private.has_role('student') then
    raise exception 'Student role required' using errcode = '42501';
  end if;
  if p_timezone is null or not exists (
    select 1 from pg_catalog.pg_timezone_names where name = p_timezone
  ) then
    raise exception 'Invalid timezone' using errcode = '22023';
  end if;
  v_today := (now() at time zone p_timezone)::date;
  v_day_start := v_today::timestamp at time zone p_timezone;
  v_week_start := date_trunc('week', v_today::timestamp) at time zone p_timezone;
  v_week_end := (date_trunc('week', v_today::timestamp) + interval '7 days') at time zone p_timezone;

  return jsonb_build_object(
    'today_count', (select count(*) from public.question_attempts a
      where a.student_id = v_student and a.submitted_at >= v_day_start
        and a.submitted_at < ((v_today + 1)::timestamp at time zone p_timezone)),
    'weekly_count', (select count(*) from public.question_attempts a
      where a.student_id = v_student and a.submitted_at >= v_week_start and a.submitted_at < v_week_end),
    'weekly_goal', coalesce((select weekly_goal from public.student_mission_preferences where student_id = v_student), 50),
    'local_date', v_today,
    'active_session_id', (select s.id from public.study_sessions s
      where s.student_id = v_student and s.mode = 'study' and s.status = 'active'
      order by s.updated_at desc, s.id limit 1),
    'exams', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title,
      'available_count', available.question_count) order by e.sort_order, e.title)
      from (select exam_id, sum(available_question_count)::integer question_count
        from public.get_accessible_study_catalog() group by exam_id) available
      join public.exams e on e.id = available.exam_id
      where available.question_count >= 5), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.set_student_weekly_mission(integer) from public, anon;
revoke all on function public.get_student_missions(text) from public, anon;
grant execute on function public.set_student_weekly_mission(integer) to authenticated;
grant execute on function public.get_student_missions(text) to authenticated;

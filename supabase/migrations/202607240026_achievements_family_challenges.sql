create type public.challenge_status as enum ('active', 'completed', 'cancelled');
create type public.encouragement_reaction as enum (
  'great_effort',
  'keep_going',
  'proud_of_you',
  'nice_comeback',
  'team_spirit'
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_]{3,80}$'),
  category text not null check (category in (
    'first_session', 'persistence', 'improvement', 'streak',
    'topic_mastered', 'comeback', 'helping_the_team'
  )),
  title text not null check (char_length(title) between 1 and 100),
  description text not null check (char_length(description) between 1 and 240),
  sort_order integer not null check (sort_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.student_achievements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete restrict,
  evidence jsonb not null default '{}'::jsonb,
  awarded_at timestamptz not null default now(),
  unique (student_id, achievement_id)
);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete restrict,
  title text not null check (char_length(title) between 3 and 100),
  exam_id uuid not null references public.exams (id) on delete restrict,
  status public.challenge_status not null default 'active',
  question_count integer not null check (question_count between 3 and 20),
  scoring_method text not null default 'balanced_progress'
    check (scoring_method = 'balanced_progress'),
  visibility text not null default 'private_family'
    check (visibility = 'private_family'),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create table public.challenge_question_sets (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  position integer not null check (position > 0),
  question_id uuid not null references public.questions (id) on delete restrict,
  question_version integer not null check (question_version > 0),
  primary key (challenge_id, position),
  unique (challenge_id, question_id)
);

create table public.challenge_participants (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete restrict,
  session_id uuid not null unique references public.study_sessions (id) on delete restrict,
  baseline_accuracy numeric check (
    baseline_accuracy is null or baseline_accuracy between 0 and 100
  ),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (challenge_id, student_id)
);

create table public.challenge_results (
  challenge_id uuid not null,
  student_id uuid not null,
  correct_count integer not null check (correct_count >= 0),
  question_count integer not null check (question_count > 0),
  score_percent numeric not null check (score_percent between 0 and 100),
  baseline_accuracy numeric check (
    baseline_accuracy is null or baseline_accuracy between 0 and 100
  ),
  improvement_percent numeric,
  completion_points integer not null check (completion_points between 0 and 40),
  accuracy_points integer not null check (accuracy_points between 0 and 40),
  improvement_points integer not null check (improvement_points between 0 and 20),
  total_points integer not null check (total_points between 0 and 100),
  recognition text not null check (char_length(recognition) between 1 and 100),
  completed_at timestamptz not null default now(),
  primary key (challenge_id, student_id),
  foreign key (challenge_id, student_id)
    references public.challenge_participants (challenge_id, student_id) on delete cascade
);

create table public.encouragements (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete restrict,
  recipient_id uuid not null references public.profiles (id) on delete restrict,
  reaction public.encouragement_reaction not null,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id),
  unique (challenge_id, sender_id, recipient_id, reaction)
);

create index student_achievements_student_idx
  on public.student_achievements (student_id, awarded_at desc);
create index challenges_creator_idx on public.challenges (created_by, created_at desc);
create index challenge_participants_student_idx
  on public.challenge_participants (student_id, created_at desc);
create index encouragements_recipient_idx
  on public.encouragements (recipient_id, created_at desc);

create trigger challenges_set_updated_at
before update on public.challenges
for each row execute function private.set_updated_at();

insert into public.achievements (code, category, title, description, sort_order) values
  ('FIRST_SESSION', 'first_session', 'First Step', 'Complete your first study session.', 10),
  ('PERSISTENCE_25', 'persistence', 'Keep Showing Up', 'Answer 25 questions across your study work.', 20),
  ('STEADY_3', 'streak', 'Steady Effort', 'Complete three study or practice sessions.', 30),
  ('TOPIC_MASTERED', 'topic_mastered', 'Topic Builder', 'Reach mastered status in a topic.', 40),
  ('COMEBACK', 'comeback', 'Strong Comeback', 'Correct a question after missing it earlier.', 50),
  ('IMPROVEMENT_10', 'improvement', 'Growing Stronger', 'Improve by at least 10 percentage points in a challenge.', 60),
  ('TEAM_FINISHER', 'helping_the_team', 'Team Finisher', 'Complete your part of a family challenge.', 70);

create function private.can_view_motivation_student(p_student_id uuid)
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

create function private.can_access_challenge(p_challenge_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.challenges c
    where c.id = p_challenge_id
      and (
        c.created_by = (select auth.uid())
        or exists (
          select 1
          from public.challenge_participants p
          where p.challenge_id = c.id
            and p.student_id = (select auth.uid())
        )
      )
  );
$$;

create function private.award_achievement(
  p_student_id uuid,
  p_code text,
  p_evidence jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.student_achievements (student_id, achievement_id, evidence)
  select p_student_id, a.id, coalesce(p_evidence, '{}'::jsonb)
  from public.achievements a
  where a.code = p_code and a.active
  on conflict (student_id, achievement_id) do nothing;
$$;

create function private.refresh_student_achievements(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  select count(*)::integer into v_count
  from public.study_sessions s
  where s.student_id = p_student_id and s.status = 'completed';
  if v_count >= 1 then
    perform private.award_achievement(
      p_student_id, 'FIRST_SESSION', jsonb_build_object('completed_sessions', v_count)
    );
  end if;
  if v_count >= 3 then
    perform private.award_achievement(
      p_student_id, 'STEADY_3', jsonb_build_object('completed_sessions', v_count)
    );
  end if;

  select count(*)::integer into v_count
  from public.question_attempts a
  where a.student_id = p_student_id;
  if v_count >= 25 then
    perform private.award_achievement(
      p_student_id, 'PERSISTENCE_25', jsonb_build_object('questions_answered', v_count)
    );
  end if;

  if exists (
    select 1 from public.student_topic_mastery m
    where m.student_id = p_student_id and m.status = 'mastered'
  ) then
    perform private.award_achievement(p_student_id, 'TOPIC_MASTERED');
  end if;

  if exists (
    select 1
    from public.question_attempts correct
    where correct.student_id = p_student_id
      and correct.is_correct
      and exists (
        select 1 from public.question_attempts missed
        where missed.student_id = correct.student_id
          and missed.question_id = correct.question_id
          and not missed.is_correct
          and (missed.submitted_at, missed.id) < (correct.submitted_at, correct.id)
      )
  ) then
    perform private.award_achievement(p_student_id, 'COMEBACK');
  end if;

  if exists (
    select 1 from public.challenge_results r
    where r.student_id = p_student_id and r.improvement_percent >= 10
  ) then
    perform private.award_achievement(p_student_id, 'IMPROVEMENT_10');
  end if;

  if exists (
    select 1 from public.challenge_results r where r.student_id = p_student_id
  ) then
    perform private.award_achievement(p_student_id, 'TEAM_FINISHER');
  end if;
end;
$$;

create function private.refresh_achievements_after_attempt()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.refresh_student_achievements(new.student_id);
  return new;
end;
$$;

create trigger question_attempt_refresh_achievements
after insert on public.question_attempts
for each row execute function private.refresh_achievements_after_attempt();

create function private.finalize_challenge_session()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant public.challenge_participants%rowtype;
  v_score numeric;
  v_improvement numeric;
  v_accuracy_points integer;
  v_improvement_points integer;
begin
  if old.status = 'completed' or new.status <> 'completed' then
    return new;
  end if;

  select p.* into v_participant
  from public.challenge_participants p
  where p.session_id = new.id;

  if found then
    v_score := round(new.correct_count::numeric / new.question_count * 100, 2);
    v_improvement := case when v_participant.baseline_accuracy is null then null
      else round(v_score - v_participant.baseline_accuracy, 2) end;
    v_accuracy_points := least(40, greatest(0, round(v_score * 0.4)::integer));
    v_improvement_points := case when v_improvement is null then 0
      else least(20, greatest(0, round(v_improvement)::integer)) end;

    update public.challenge_participants
    set completed_at = coalesce(completed_at, new.completed_at, now())
    where challenge_id = v_participant.challenge_id
      and student_id = v_participant.student_id;

    insert into public.challenge_results (
      challenge_id, student_id, correct_count, question_count, score_percent,
      baseline_accuracy, improvement_percent, completion_points, accuracy_points,
      improvement_points, total_points, recognition, completed_at
    ) values (
      v_participant.challenge_id, v_participant.student_id, new.correct_count,
      new.question_count, v_score, v_participant.baseline_accuracy, v_improvement,
      40, v_accuracy_points, v_improvement_points,
      40 + v_accuracy_points + v_improvement_points,
      case
        when v_improvement >= 10 then 'Growing stronger'
        when v_score >= 80 then 'Strong preparation'
        else 'Challenge completed'
      end,
      coalesce(new.completed_at, now())
    ) on conflict (challenge_id, student_id) do nothing;

    if not exists (
      select 1
      from public.challenge_participants p
      where p.challenge_id = v_participant.challenge_id
        and p.completed_at is null
    ) then
      update public.challenges
      set status = 'completed', completed_at = now()
      where id = v_participant.challenge_id and status = 'active';
    end if;
  end if;

  perform private.refresh_student_achievements(new.student_id);
  return new;
end;
$$;

create trigger study_session_finalize_challenge
after update of status on public.study_sessions
for each row execute function private.finalize_challenge_session();

alter table public.achievements enable row level security;
alter table public.student_achievements enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_question_sets enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.challenge_results enable row level security;
alter table public.encouragements enable row level security;

create policy achievements_select_authenticated
on public.achievements for select to authenticated
using (active);

create policy student_achievements_select_authorized
on public.student_achievements for select to authenticated
using (private.can_view_motivation_student(student_id));

create policy challenges_select_private
on public.challenges for select to authenticated
using (private.can_access_challenge(id));

create policy challenge_question_sets_select_private
on public.challenge_question_sets for select to authenticated
using (private.can_access_challenge(challenge_id));

create policy challenge_participants_select_private
on public.challenge_participants for select to authenticated
using (private.can_access_challenge(challenge_id));

create policy challenge_results_select_after_reveal
on public.challenge_results for select to authenticated
using (
  private.can_access_challenge(challenge_id)
  and exists (
    select 1 from public.challenges c
    where c.id = challenge_id and c.status = 'completed'
  )
);

create policy encouragements_select_private
on public.encouragements for select to authenticated
using (
  private.can_access_challenge(challenge_id)
  and (
    sender_id = (select auth.uid())
    or recipient_id = (select auth.uid())
    or exists (
      select 1 from public.challenges c
      where c.id = challenge_id and c.created_by = (select auth.uid())
    )
  )
);

revoke all on table public.achievements from anon, authenticated;
revoke all on table public.student_achievements from anon, authenticated;
revoke all on table public.challenges from anon, authenticated;
revoke all on table public.challenge_question_sets from anon, authenticated;
revoke all on table public.challenge_participants from anon, authenticated;
revoke all on table public.challenge_results from anon, authenticated;
revoke all on table public.encouragements from anon, authenticated;

grant select on table public.achievements to authenticated;
grant select on table public.student_achievements to authenticated;
grant select on table public.challenges to authenticated;
grant select on table public.challenge_question_sets to authenticated;
grant select on table public.challenge_participants to authenticated;
grant select on table public.challenge_results to authenticated;
grant select on table public.encouragements to authenticated;

create function public.get_challenge_creation_students()
returns table (student_id uuid, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name
  from public.student_guardian_links l
  join public.profiles p on p.id = l.student_id
  where l.guardian_id = (select auth.uid())
    and l.status = 'active'
    and l.can_manage_challenges
    and p.status = 'active'
    and (
      private.has_role('parent')
      or private.has_role('coach')
    )
  order by p.display_name, p.id;
$$;

create function public.get_challenge_creation_exams()
returns table (exam_id uuid, exam_title text, available_question_count integer)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, e.title, count(q.id)::integer
  from public.exams e
  join public.questions q on q.exam_id = e.id
    and q.review_status = 'approved' and q.status = 'active'
  where (select auth.uid()) is not null
    and (
      private.has_role('parent')
      or private.has_role('coach')
    )
  group by e.id, e.title
  having count(q.id) >= 3
  order by e.title;
$$;

create function public.create_private_challenge(
  p_title text,
  p_exam_id uuid,
  p_student_ids uuid[],
  p_question_count integer default 5,
  p_ends_at timestamptz default now() + interval '7 days'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_challenge_id uuid;
  v_student_id uuid;
  v_session_id uuid;
  v_baseline numeric;
  v_available integer;
begin
  if v_actor is null or not (
    private.has_role('parent') or private.has_role('coach')
  ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if nullif(trim(p_title), '') is null or char_length(trim(p_title)) not between 3 and 100 then
    raise exception 'Challenge title must be between 3 and 100 characters' using errcode = '22023';
  end if;
  if p_question_count not between 3 and 20 then
    raise exception 'Challenge question count must be between 3 and 20' using errcode = '22023';
  end if;
  if p_ends_at <= now() or p_ends_at > now() + interval '30 days' then
    raise exception 'Challenge end date must be within the next 30 days' using errcode = '22023';
  end if;
  if cardinality(p_student_ids) <> 2
    or (select count(distinct id) from unnest(p_student_ids) as ids(id)) <> 2 then
    raise exception 'A private family challenge requires exactly two students'
      using errcode = '22023';
  end if;
  if (
    select count(*)
    from public.student_guardian_links l
    where l.guardian_id = v_actor
      and l.student_id = any(p_student_ids)
      and l.status = 'active'
      and l.can_manage_challenges
  ) <> 2 then
    raise exception 'Both students require active challenge-management links'
      using errcode = '42501';
  end if;

  select count(*)::integer into v_available
  from public.questions q
  where q.exam_id = p_exam_id
    and q.review_status = 'approved'
    and q.status = 'active'
    and exists (
      select 1 from private.question_answer_keys k where k.question_id = q.id
    );
  if v_available < p_question_count then
    raise exception 'Not enough approved questions for this challenge'
      using errcode = '22023';
  end if;

  insert into public.challenges (
    created_by, title, exam_id, question_count, ends_at
  ) values (
    v_actor, trim(p_title), p_exam_id, p_question_count, p_ends_at
  ) returning id into v_challenge_id;

  insert into public.challenge_question_sets (
    challenge_id, position, question_id, question_version
  )
  select
    v_challenge_id,
    row_number() over (order by md5(q.id::text || v_challenge_id::text), q.id)::integer,
    q.id,
    q.version
  from public.questions q
  where q.exam_id = p_exam_id
    and q.review_status = 'approved'
    and q.status = 'active'
    and exists (
      select 1 from private.question_answer_keys k where k.question_id = q.id
    )
  order by md5(q.id::text || v_challenge_id::text), q.id
  limit p_question_count;

  foreach v_student_id in array p_student_ids loop
    select round(avg(case when recent.is_correct then 100 else 0 end), 2)
    into v_baseline
    from (
      select a.is_correct
      from public.question_attempts a
      join public.questions q on q.id = a.question_id
      join public.study_sessions s on s.id = a.session_id
      where a.student_id = v_student_id
        and q.exam_id = p_exam_id
        and s.mode <> 'challenge'
      order by a.submitted_at desc, a.id desc
      limit 20
    ) recent;

    insert into public.study_sessions (
      student_id, exam_id, mode, status, requested_count, question_count
    ) values (
      v_student_id, p_exam_id, 'challenge', 'active',
      p_question_count, p_question_count
    ) returning id into v_session_id;

    insert into public.study_session_questions (
      session_id, question_id, position, selection_reason, question_version
    )
    select
      v_session_id, q.question_id, q.position, 'challenge_shared', q.question_version
    from public.challenge_question_sets q
    where q.challenge_id = v_challenge_id
    order by q.position;

    insert into public.challenge_participants (
      challenge_id, student_id, session_id, baseline_accuracy
    ) values (
      v_challenge_id, v_student_id, v_session_id, v_baseline
    );
  end loop;

  insert into public.audit_log (
    actor_id, action, entity_type, entity_id, after_summary
  ) values (
    v_actor, 'challenge.created', 'challenge', v_challenge_id,
    jsonb_build_object(
      'exam_id', p_exam_id,
      'question_count', p_question_count,
      'participant_count', 2,
      'visibility', 'private_family'
    )
  );
  return v_challenge_id;
end;
$$;

create function public.get_private_challenges()
returns table (
  challenge_id uuid,
  title text,
  exam_id uuid,
  exam_title text,
  challenge_status public.challenge_status,
  question_count integer,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid,
  can_manage boolean,
  participant_student_id uuid,
  participant_name text,
  participant_session_id uuid,
  participant_completed boolean,
  results_revealed boolean,
  score_percent numeric,
  improvement_percent numeric,
  total_points integer,
  recognition text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.title,
    c.exam_id,
    e.title,
    c.status,
    c.question_count,
    c.starts_at,
    c.ends_at,
    c.created_by,
    c.created_by = (select auth.uid()),
    p.student_id,
    profile.display_name,
    p.session_id,
    p.completed_at is not null,
    c.status = 'completed',
    case when c.status = 'completed' then r.score_percent else null end,
    case when c.status = 'completed' then r.improvement_percent else null end,
    case when c.status = 'completed' then r.total_points else null end,
    case when c.status = 'completed' then r.recognition else null end
  from public.challenges c
  join public.exams e on e.id = c.exam_id
  join public.challenge_participants p on p.challenge_id = c.id
  join public.profiles profile on profile.id = p.student_id
  left join public.challenge_results r
    on r.challenge_id = p.challenge_id and r.student_id = p.student_id
  where (select auth.uid()) is not null
    and (
      c.created_by = (select auth.uid())
      or exists (
        select 1 from public.challenge_participants mine
        where mine.challenge_id = c.id
          and mine.student_id = (select auth.uid())
      )
    )
  order by c.created_at desc, profile.display_name, p.student_id;
$$;

create function public.get_challenge_encouragements(p_challenge_id uuid)
returns table (
  encouragement_id uuid,
  sender_id uuid,
  sender_name text,
  recipient_id uuid,
  recipient_name text,
  reaction public.encouragement_reaction,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not private.can_access_challenge(p_challenge_id) then
    raise exception 'Challenge not found' using errcode = 'P0002';
  end if;
  return query
  select
    en.id,
    en.sender_id,
    sender.display_name,
    en.recipient_id,
    recipient.display_name,
    en.reaction,
    en.created_at
  from public.encouragements en
  join public.profiles sender on sender.id = en.sender_id
  join public.profiles recipient on recipient.id = en.recipient_id
  join public.challenges c on c.id = en.challenge_id
  where en.challenge_id = p_challenge_id
    and (
      c.created_by = (select auth.uid())
      or en.sender_id = (select auth.uid())
      or en.recipient_id = (select auth.uid())
    )
  order by en.created_at desc, en.id;
end;
$$;

create function public.send_challenge_encouragement(
  p_challenge_id uuid,
  p_recipient_id uuid,
  p_reaction public.encouragement_reaction
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_id uuid;
begin
  if v_actor is null or not private.can_access_challenge(p_challenge_id) then
    raise exception 'Challenge not found' using errcode = 'P0002';
  end if;
  if v_actor = p_recipient_id then
    raise exception 'Choose another participant to encourage' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.challenge_participants p
    where p.challenge_id = p_challenge_id and p.student_id = p_recipient_id
  ) then
    raise exception 'Challenge participant not found' using errcode = 'P0002';
  end if;
  if not (
    exists (
      select 1 from public.challenges c
      where c.id = p_challenge_id and c.created_by = v_actor
        and c.status <> 'cancelled'
    )
    or exists (
      select 1 from public.challenge_participants p
      where p.challenge_id = p_challenge_id and p.student_id = v_actor
    )
  ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  insert into public.encouragements (
    challenge_id, sender_id, recipient_id, reaction
  ) values (
    p_challenge_id, v_actor, p_recipient_id, p_reaction
  ) on conflict (challenge_id, sender_id, recipient_id, reaction)
    do update set created_at = public.encouragements.created_at
  returning id into v_id;
  return v_id;
end;
$$;

create function public.get_student_achievements(p_student_id uuid default null)
returns table (
  achievement_id uuid,
  code text,
  category text,
  title text,
  description text,
  earned boolean,
  awarded_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare v_student_id uuid := coalesce(p_student_id, (select auth.uid()));
begin
  if (select auth.uid()) is null
    or not private.can_view_motivation_student(v_student_id) then
    raise exception 'Student achievements not found' using errcode = 'P0002';
  end if;
  perform private.refresh_student_achievements(v_student_id);
  return query
  select
    a.id,
    a.code,
    a.category,
    a.title,
    a.description,
    sa.id is not null,
    sa.awarded_at
  from public.achievements a
  left join public.student_achievements sa
    on sa.achievement_id = a.id and sa.student_id = v_student_id
  where a.active
  order by a.sort_order, a.code;
end;
$$;

revoke all on function private.can_view_motivation_student(uuid) from public;
revoke all on function private.can_access_challenge(uuid) from public;
revoke all on function private.award_achievement(uuid, text, jsonb) from public;
revoke all on function private.refresh_student_achievements(uuid) from public;
revoke all on function private.refresh_achievements_after_attempt() from public;
revoke all on function private.finalize_challenge_session() from public;
revoke all on function public.get_challenge_creation_students() from public;
revoke all on function public.get_challenge_creation_exams() from public;
revoke all on function public.create_private_challenge(
  text, uuid, uuid[], integer, timestamptz
) from public;
revoke all on function public.get_private_challenges() from public;
revoke all on function public.get_challenge_encouragements(uuid) from public;
revoke all on function public.send_challenge_encouragement(
  uuid, uuid, public.encouragement_reaction
) from public;
revoke all on function public.get_student_achievements(uuid) from public;

grant execute on function public.get_challenge_creation_students() to authenticated;
grant execute on function public.get_challenge_creation_exams() to authenticated;
grant execute on function public.create_private_challenge(
  text, uuid, uuid[], integer, timestamptz
) to authenticated;
grant execute on function public.get_private_challenges() to authenticated;
grant execute on function public.get_challenge_encouragements(uuid) to authenticated;
grant execute on function public.send_challenge_encouragement(
  uuid, uuid, public.encouragement_reaction
) to authenticated;
grant execute on function public.get_student_achievements(uuid) to authenticated;

do $$
declare v_student_id uuid;
begin
  for v_student_id in
    select distinct r.user_id from public.user_roles r where r.role = 'student'
  loop
    perform private.refresh_student_achievements(v_student_id);
  end loop;
end;
$$;

comment on table public.challenge_results is
  'Supportive private results. RLS and RPC projections withhold all scores until every participant finishes.';
comment on table public.encouragements is
  'Predefined reactions only; free-form challenge messaging is intentionally unsupported.';

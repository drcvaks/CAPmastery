create function private.challenge_question_is_eligible(
  p_question_id uuid,
  p_student_ids uuid[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select cardinality(p_student_ids) = 2
    and (select count(distinct id) from unnest(p_student_ids) as students(id)) = 2
    and exists (
      select 1
      from public.questions q
      where q.id = p_question_id
        and exists (
          select 1
          from private.question_answer_keys k
          where k.question_id = q.id
        )
        and (
          (q.review_status = 'approved' and q.status = 'active')
          or (
            q.review_status = 'draft'
            and q.status = 'draft'
            and q.import_package is not null
            and (
              select count(distinct a.student_id)
              from public.pilot_package_assignments a
              where a.import_package = q.import_package
                and a.student_id = any(p_student_ids)
            ) = 2
          )
        )
    );
$$;

drop function public.get_challenge_creation_exams();

create function public.get_challenge_creation_exams(p_student_ids uuid[])
returns table (exam_id uuid, exam_title text, available_question_count integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_actor uuid := (select auth.uid());
begin
  if v_actor is null or not (
    private.has_role('parent') or private.has_role('coach')
  ) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if cardinality(p_student_ids) <> 2
    or (select count(distinct id) from unnest(p_student_ids) as ids(id)) <> 2 then
    raise exception 'Choose exactly two students' using errcode = '22023';
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

  return query
  select e.id, e.title, count(q.id)::integer
  from public.exams e
  join public.questions q on q.exam_id = e.id
  where private.challenge_question_is_eligible(q.id, p_student_ids)
  group by e.id, e.title
  having count(q.id) >= 3
  order by e.title;
end;
$$;

create or replace function public.create_private_challenge(
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
  if nullif(trim(p_title), '') is null
    or char_length(trim(p_title)) not between 3 and 100 then
    raise exception 'Challenge title must be between 3 and 100 characters'
      using errcode = '22023';
  end if;
  if p_question_count not between 3 and 20 then
    raise exception 'Challenge question count must be between 3 and 20'
      using errcode = '22023';
  end if;
  if p_ends_at <= now() or p_ends_at > now() + interval '30 days' then
    raise exception 'Challenge end date must be within the next 30 days'
      using errcode = '22023';
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
    and private.challenge_question_is_eligible(q.id, p_student_ids);
  if v_available < p_question_count then
    raise exception 'Not enough shared questions for this challenge'
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
    row_number() over (
      order by md5(q.id::text || v_challenge_id::text), q.id
    )::integer,
    q.id,
    q.version
  from public.questions q
  where q.exam_id = p_exam_id
    and private.challenge_question_is_eligible(q.id, p_student_ids)
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
      v_session_id, q.question_id, q.position,
      'challenge_shared', q.question_version
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
      'visibility', 'private_family',
      'eligibility', 'approved_or_shared_private_package'
    )
  );
  return v_challenge_id;
end;
$$;

revoke all on function private.challenge_question_is_eligible(uuid, uuid[]) from public;
revoke all on function public.get_challenge_creation_exams(uuid[]) from public;
grant execute on function public.get_challenge_creation_exams(uuid[]) to authenticated;

comment on function private.challenge_question_is_eligible(uuid, uuid[]) is
  'Challenge eligibility requires an answer key plus either approved-active publication or the exact draft package assignment shared by both students.';
comment on function public.get_challenge_creation_exams(uuid[]) is
  'Returns exams with at least three questions accessible to both selected, challenge-linked students.';

alter table public.questions
  add column external_id text,
  add column pilot_batch text,
  add column import_package text,
  add column source_status text,
  add constraint questions_external_id_format
    check (external_id is null or external_id ~ '^[A-Z0-9][A-Z0-9_-]{2,119}$'),
  add constraint questions_pilot_batch_length
    check (pilot_batch is null or char_length(pilot_batch) between 1 and 80),
  add constraint questions_import_package_format
    check (import_package is null or import_package ~ '^[A-Z0-9][A-Z0-9_-]{2,119}$'),
  add constraint questions_source_status_format
    check (source_status is null or source_status ~ '^[a-z][a-z0-9_]{1,79}$'),
  add constraint questions_external_id_unique unique (external_id);

alter table public.question_families
  add column source_code text,
  add constraint question_families_source_code_format
    check (source_code is null or source_code ~ '^[A-Z0-9][A-Z0-9_.-]{0,99}$');

create index questions_import_package_idx
  on public.questions (import_package, review_status, status);

create table public.pilot_package_assignments (
  student_id uuid not null references public.profiles (id) on delete cascade,
  import_package text not null
    check (import_package ~ '^[A-Z0-9][A-Z0-9_-]{2,119}$'),
  assigned_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (student_id, import_package)
);

create index pilot_package_assignments_package_idx
  on public.pilot_package_assignments (import_package, student_id);

alter table public.pilot_package_assignments enable row level security;

create policy pilot_package_assignments_select_self_or_admin
on public.pilot_package_assignments for select to authenticated
using (student_id = (select auth.uid()) or private.has_role('admin'));

revoke all on table public.pilot_package_assignments from anon, authenticated;
grant select on table public.pilot_package_assignments to authenticated;

create or replace function private.has_pilot_package_access(p_import_package text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.pilot_package_assignments a
    where a.student_id = (select auth.uid())
      and a.import_package = p_import_package
  );
$$;

create or replace function public.admin_set_pilot_package_assignment(
  p_student_id uuid,
  p_import_package text,
  p_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_package text := upper(trim(p_import_package));
begin
  if v_actor_id is null or not private.has_role('admin') then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;
  if v_package is null or v_package !~ '^[A-Z0-9][A-Z0-9_-]{2,119}$' then
    raise exception 'Invalid import package' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.user_roles r
    where r.user_id = p_student_id and r.role = 'student'
  ) then
    raise exception 'Student role required for pilot assignment' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.questions q where q.import_package = v_package
  ) then
    raise exception 'Import package not found' using errcode = 'P0002';
  end if;

  if p_enabled then
    insert into public.pilot_package_assignments (student_id, import_package, assigned_by)
    values (p_student_id, v_package, v_actor_id)
    on conflict (student_id, import_package)
    do update set assigned_by = excluded.assigned_by, created_at = now();
  else
    delete from public.pilot_package_assignments
    where student_id = p_student_id and import_package = v_package;
  end if;

  insert into public.audit_log (
    actor_id, action, entity_type, entity_id, after_summary
  ) values (
    v_actor_id,
    case when p_enabled then 'pilot.assignment_enabled' else 'pilot.assignment_disabled' end,
    'profile',
    p_student_id,
    jsonb_build_object('import_package', v_package, 'enabled', p_enabled)
  );
end;
$$;

create or replace function public.create_study_session(
  p_exam_id uuid,
  p_question_count integer default 10,
  p_topic_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id uuid := (select auth.uid());
  v_session_id uuid;
  v_question_ids uuid[];
begin
  if v_student_id is null or not private.has_role('student') then
    raise exception 'Student role required' using errcode = '42501';
  end if;
  if p_question_count is null or p_question_count < 1 or p_question_count > 50 then
    raise exception 'Question count must be between 1 and 50' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.exams e where e.id = p_exam_id and e.status = 'active'
  ) then
    raise exception 'Active exam not found' using errcode = 'P0002';
  end if;
  if p_topic_id is not null and not exists (
    select 1 from public.topics t
    where t.id = p_topic_id and t.exam_id = p_exam_id and t.status = 'active'
  ) then
    raise exception 'Active topic does not belong to exam' using errcode = '22023';
  end if;

  select array_agg(candidate.id order by candidate.created_at, candidate.id)
  into v_question_ids
  from (
    select q.id, q.created_at
    from public.questions q
    where q.exam_id = p_exam_id
      and (p_topic_id is null or q.topic_id = p_topic_id)
      and (
        (q.review_status = 'approved' and q.status = 'active')
        or (
          q.review_status = 'draft'
          and q.status = 'draft'
          and q.import_package is not null
          and private.has_pilot_package_access(q.import_package)
        )
      )
    order by q.created_at, q.id
    limit p_question_count
  ) candidate;

  if coalesce(cardinality(v_question_ids), 0) < p_question_count then
    raise exception 'Not enough available questions for a % question session', p_question_count
      using errcode = '22023';
  end if;

  insert into public.study_sessions (
    student_id, exam_id, topic_id, requested_count, question_count
  ) values (
    v_student_id, p_exam_id, p_topic_id, p_question_count, cardinality(v_question_ids)
  ) returning id into v_session_id;

  insert into public.study_session_questions (
    session_id, question_id, position, selection_reason, question_version
  )
  select
    v_session_id,
    q.id,
    selected.ordinality::integer,
    case when q.review_status = 'draft' then 'private_pilot' else 'basic_ordered' end,
    q.version
  from unnest(v_question_ids) with ordinality selected(id, ordinality)
  join public.questions q on q.id = selected.id;

  return v_session_id;
end;
$$;

revoke all on function private.has_pilot_package_access(text) from public;
revoke all on function public.admin_set_pilot_package_assignment(uuid, text, boolean) from public;
revoke all on function public.create_study_session(uuid, integer, uuid) from public;
grant execute on function public.admin_set_pilot_package_assignment(uuid, text, boolean) to authenticated;
grant execute on function public.create_study_session(uuid, integer, uuid) to authenticated;

comment on column public.questions.external_id is 'Stable unique key supplied by an authorized import package.';
comment on column public.questions.import_package is 'Stable package identifier used for idempotent import and private pilot assignment.';
comment on table public.pilot_package_assignments is 'Admin-managed access to draft pilot packages; it does not publish draft questions.';
comment on function public.admin_set_pilot_package_assignment(uuid, text, boolean) is 'Admin-only audited private-pilot assignment toggle.';
comment on function public.create_study_session is 'Creates an owned session from approved content or explicitly assigned draft pilot content.';

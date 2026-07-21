create or replace function private.can_review_content()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('content_reviewer') or private.has_role('admin');
$$;

create or replace function private.question_is_student_visible(p_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.questions q
    where q.id = p_question_id
      and q.review_status = 'approved'
      and q.status = 'active'
  );
$$;

alter table public.programs enable row level security;
alter table public.exams enable row level security;
alter table public.courses enable row level security;
alter table public.volumes enable row level security;
alter table public.chapters enable row level security;
alter table public.sections enable row level security;
alter table public.topics enable row level security;
alter table public.learning_objectives enable row level security;
alter table public.source_documents enable row level security;
alter table public.questions enable row level security;
alter table public.question_choices enable row level security;
alter table public.question_versions enable row level security;
alter table public.question_quality_reviews enable row level security;
alter table public.question_reports enable row level security;

create policy programs_select_active_or_reviewer
on public.programs for select to authenticated
using (status = 'active' or private.can_review_content());
create policy programs_manage_reviewer
on public.programs for all to authenticated
using (private.can_review_content()) with check (private.can_review_content());

create policy exams_select_active_or_reviewer
on public.exams for select to authenticated
using (status = 'active' or private.can_review_content());
create policy exams_manage_reviewer
on public.exams for all to authenticated
using (private.can_review_content()) with check (private.can_review_content());

create policy courses_select_active_or_reviewer
on public.courses for select to authenticated
using (status = 'active' or private.can_review_content());
create policy courses_manage_reviewer
on public.courses for all to authenticated
using (private.can_review_content()) with check (private.can_review_content());

create policy volumes_select_active_or_reviewer
on public.volumes for select to authenticated
using (status = 'active' or private.can_review_content());
create policy volumes_manage_reviewer
on public.volumes for all to authenticated
using (private.can_review_content()) with check (private.can_review_content());

create policy chapters_select_active_or_reviewer
on public.chapters for select to authenticated
using (status = 'active' or private.can_review_content());
create policy chapters_manage_reviewer
on public.chapters for all to authenticated
using (private.can_review_content()) with check (private.can_review_content());

create policy sections_select_active_or_reviewer
on public.sections for select to authenticated
using (status = 'active' or private.can_review_content());
create policy sections_manage_reviewer
on public.sections for all to authenticated
using (private.can_review_content()) with check (private.can_review_content());

create policy topics_select_active_or_reviewer
on public.topics for select to authenticated
using (status = 'active' or private.can_review_content());
create policy topics_manage_reviewer
on public.topics for all to authenticated
using (private.can_review_content()) with check (private.can_review_content());

create policy objectives_select_active_or_reviewer
on public.learning_objectives for select to authenticated
using (status = 'active' or private.can_review_content());
create policy objectives_manage_reviewer
on public.learning_objectives for all to authenticated
using (private.can_review_content()) with check (private.can_review_content());

create policy source_documents_reviewer_only
on public.source_documents for all to authenticated
using (private.can_review_content()) with check (private.can_review_content());

create policy questions_select_approved_or_reviewer
on public.questions for select to authenticated
using (
  (review_status = 'approved' and status = 'active')
  or private.can_review_content()
);
create policy questions_manage_reviewer
on public.questions for all to authenticated
using (private.can_review_content()) with check (private.can_review_content());

create policy choices_select_visible_question_or_reviewer
on public.question_choices for select to authenticated
using (private.question_is_student_visible(question_id) or private.can_review_content());
create policy choices_manage_reviewer
on public.question_choices for all to authenticated
using (private.can_review_content()) with check (private.can_review_content());

create policy versions_reviewer_only
on public.question_versions for all to authenticated
using (private.can_review_content()) with check (private.can_review_content());

create policy quality_reviews_reviewer_only
on public.question_quality_reviews for all to authenticated
using (private.can_review_content()) with check (
  private.can_review_content() and reviewer_id = (select auth.uid())
);

create policy reports_select_owner_or_reviewer
on public.question_reports for select to authenticated
using (reporter_id = (select auth.uid()) or private.can_review_content());
create policy reports_insert_owner
on public.question_reports for insert to authenticated
with check (
  reporter_id = (select auth.uid())
  and status = 'open'
  and resolved_by is null
  and resolved_at is null
);
create policy reports_update_reviewer
on public.question_reports for update to authenticated
using (private.can_review_content()) with check (private.can_review_content());

revoke all on table public.programs from anon, authenticated;
revoke all on table public.exams from anon, authenticated;
revoke all on table public.courses from anon, authenticated;
revoke all on table public.volumes from anon, authenticated;
revoke all on table public.chapters from anon, authenticated;
revoke all on table public.sections from anon, authenticated;
revoke all on table public.topics from anon, authenticated;
revoke all on table public.learning_objectives from anon, authenticated;
revoke all on table public.source_documents from anon, authenticated;
revoke all on table public.questions from anon, authenticated;
revoke all on table public.question_choices from anon, authenticated;
revoke all on table public.question_versions from anon, authenticated;
revoke all on table public.question_quality_reviews from anon, authenticated;
revoke all on table public.question_reports from anon, authenticated;

grant select, insert, update, delete on table public.programs to authenticated;
grant select, insert, update, delete on table public.exams to authenticated;
grant select, insert, update, delete on table public.courses to authenticated;
grant select, insert, update, delete on table public.volumes to authenticated;
grant select, insert, update, delete on table public.chapters to authenticated;
grant select, insert, update, delete on table public.sections to authenticated;
grant select, insert, update, delete on table public.topics to authenticated;
grant select, insert, update, delete on table public.learning_objectives to authenticated;
grant select, insert, update, delete on table public.source_documents to authenticated;
grant select, insert, update, delete on table public.questions to authenticated;
grant select, insert, update, delete on table public.question_choices to authenticated;
grant select, insert, update, delete on table public.question_versions to authenticated;
grant select, insert, update, delete on table public.question_quality_reviews to authenticated;
grant select, insert, update on table public.question_reports to authenticated;

revoke all on table private.source_passages from anon, authenticated;
revoke all on table private.question_answer_keys from anon, authenticated;
revoke all on table private.question_choice_feedback from anon, authenticated;

create or replace function public.reviewer_set_question_answer(
  p_question_id uuid,
  p_correct_choice_id uuid,
  p_explanation text,
  p_remediation text default null,
  p_common_mistake text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before jsonb;
begin
  if (select auth.uid()) is null or not private.can_review_content() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.question_choices
    where id = p_correct_choice_id and question_id = p_question_id
  ) then
    raise exception 'Correct choice must belong to the question' using errcode = '22023';
  end if;

  if char_length(trim(p_explanation)) = 0 then
    raise exception 'Explanation is required' using errcode = '22023';
  end if;

  select jsonb_build_object('had_answer_key', true)
    into v_before
  from private.question_answer_keys
  where question_id = p_question_id;

  insert into private.question_answer_keys (
    question_id, correct_choice_id, explanation, remediation, common_mistake, created_by
  ) values (
    p_question_id,
    p_correct_choice_id,
    trim(p_explanation),
    nullif(trim(p_remediation), ''),
    nullif(trim(p_common_mistake), ''),
    (select auth.uid())
  )
  on conflict (question_id) do update set
    correct_choice_id = excluded.correct_choice_id,
    explanation = excluded.explanation,
    remediation = excluded.remediation,
    common_mistake = excluded.common_mistake;

  insert into public.audit_log (
    actor_id, action, entity_type, entity_id, before_summary, after_summary
  ) values (
    (select auth.uid()),
    case when v_before is null then 'question.answer_created' else 'question.answer_updated' end,
    'question',
    p_question_id,
    v_before,
    jsonb_build_object('has_answer_key', true)
  );
end;
$$;

create or replace function public.reviewer_approve_question(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_question public.questions%rowtype;
  v_choice_count integer;
begin
  if (select auth.uid()) is null or not private.can_review_content() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into v_question
  from public.questions
  where id = p_question_id
  for update;

  if not found then
    raise exception 'Question not found' using errcode = 'P0002';
  end if;

  if v_question.learning_objective_id is null
    or v_question.source_document_id is null
    or nullif(trim(v_question.source_reference), '') is null then
    raise exception 'Approved questions require a learning objective and source reference' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.source_documents
    where id = v_question.source_document_id
      and authorization_status = 'approved'
      and status = 'active'
  ) then
    raise exception 'Question source must be active and authorized' using errcode = '22023';
  end if;

  select count(*) into v_choice_count
  from public.question_choices
  where question_id = p_question_id;

  if (v_question.question_type = 'true_false' and v_choice_count <> 2)
    or (v_question.question_type = 'multiple_choice' and v_choice_count < 3) then
    raise exception 'Question has an invalid number of choices' using errcode = '22023';
  end if;

  if not exists (
    select 1 from private.question_answer_keys
    where question_id = p_question_id
      and nullif(trim(explanation), '') is not null
  ) then
    raise exception 'Question requires a private answer key and explanation' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.question_quality_reviews
    where question_id = p_question_id and decision = 'approve'
  ) then
    raise exception 'Question requires an approving quality review' using errcode = '22023';
  end if;

  insert into public.question_versions (
    question_id, version, snapshot, change_reason, created_by
  ) values (
    p_question_id,
    v_question.version,
    to_jsonb(v_question),
    'Approved for student delivery',
    (select auth.uid())
  ) on conflict (question_id, version) do nothing;

  update public.questions set
    review_status = 'approved',
    status = 'active',
    approved_by = (select auth.uid()),
    approved_at = now()
  where id = p_question_id;

  insert into public.audit_log (
    actor_id, action, entity_type, entity_id, before_summary, after_summary
  ) values (
    (select auth.uid()),
    'question.approved',
    'question',
    p_question_id,
    jsonb_build_object('review_status', v_question.review_status, 'status', v_question.status),
    jsonb_build_object('review_status', 'approved', 'status', 'active')
  );
end;
$$;

create or replace function public.get_approved_questions(
  p_exam_id uuid,
  p_topic_id uuid default null,
  p_limit integer default 50
)
returns table (
  id uuid,
  exam_id uuid,
  topic_id uuid,
  question_text text,
  question_type public.question_type,
  difficulty public.question_difficulty,
  cognitive_level public.cognitive_level,
  source_reference text,
  choices jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    q.id,
    q.exam_id,
    q.topic_id,
    q.question_text,
    q.question_type,
    q.difficulty,
    q.cognitive_level,
    q.source_reference,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'key', c.choice_key,
          'text', c.choice_text,
          'sortOrder', c.sort_order
        ) order by c.sort_order
      ) filter (where c.id is not null),
      '[]'::jsonb
    ) as choices
  from public.questions q
  left join public.question_choices c on c.question_id = q.id
  where q.exam_id = p_exam_id
    and (p_topic_id is null or q.topic_id = p_topic_id)
    and q.review_status = 'approved'
    and q.status = 'active'
  group by q.id
  order by q.created_at, q.id
  limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;

revoke all on function private.can_review_content() from public;
revoke all on function private.question_is_student_visible(uuid) from public;
revoke all on function public.reviewer_set_question_answer(uuid, uuid, text, text, text) from public;
revoke all on function public.reviewer_approve_question(uuid) from public;
revoke all on function public.get_approved_questions(uuid, uuid, integer) from public;

grant execute on function private.can_review_content() to authenticated;
grant execute on function private.question_is_student_visible(uuid) to authenticated;
grant execute on function public.reviewer_set_question_answer(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.reviewer_approve_question(uuid) to authenticated;
grant execute on function public.get_approved_questions(uuid, uuid, integer) to authenticated;

comment on function public.get_approved_questions is 'Student-safe delivery projection; excludes answer keys and teaching feedback.';
comment on function public.reviewer_set_question_answer is 'Reviewer-only answer-key writer with no client table access.';
comment on function public.reviewer_approve_question is 'Reviewer-only approval gate requiring source, objective, choices, answer, explanation, and quality review.';

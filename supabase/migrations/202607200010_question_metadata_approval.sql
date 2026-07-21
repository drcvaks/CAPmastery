create or replace function private.validate_question_learning_links()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.question_family_id is not null and not exists (
    select 1 from public.question_families f
    where f.id = new.question_family_id and f.exam_id = new.exam_id
  ) then
    raise exception 'Question family must belong to the selected exam';
  end if;
  return new;
end;
$$;

create or replace function private.validate_question_concept_link()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.questions q
    join public.concepts c on c.id = new.concept_id
    where q.id = new.question_id and c.topic_id = q.topic_id
  ) then
    raise exception 'Question concept must belong to the question topic';
  end if;
  return new;
end;
$$;

create or replace function private.validate_question_approval_metadata()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_correct_choice_id uuid;
  v_wrong_choice_count integer;
  v_wrong_feedback_count integer;
begin
  if new.review_status <> 'approved' or old.review_status = 'approved' then
    return new;
  end if;

  if new.question_family_id is null
    or new.source_page_start is null
    or new.estimated_time_seconds is null then
    raise exception 'Approval requires a question family, source page, and estimated time';
  end if;

  if not exists (
    select 1 from public.question_families f
    where f.id = new.question_family_id and f.exam_id = new.exam_id and f.status = 'active'
  ) then
    raise exception 'Approval requires an active question family for the exam';
  end if;

  if not exists (
    select 1
    from public.question_concepts qc
    join public.concepts c on c.id = qc.concept_id
    where qc.question_id = new.id
      and qc.is_primary
      and c.topic_id = new.topic_id
      and c.status = 'active'
  ) then
    raise exception 'Approval requires an active primary concept for the question topic';
  end if;

  select correct_choice_id into v_correct_choice_id
  from private.question_answer_keys
  where question_id = new.id
    and nullif(trim(common_mistake), '') is not null
    and nullif(trim(remediation), '') is not null;

  if v_correct_choice_id is null then
    raise exception 'Approval requires misconception and remediation metadata';
  end if;

  select count(*) into v_wrong_choice_count
  from public.question_choices
  where question_id = new.id and id <> v_correct_choice_id;

  select count(*) into v_wrong_feedback_count
  from public.question_choices c
  join private.question_choice_feedback f on f.choice_id = c.id
  where c.question_id = new.id and c.id <> v_correct_choice_id;

  if v_wrong_feedback_count <> v_wrong_choice_count then
    raise exception 'Approval requires feedback for every incorrect choice';
  end if;

  return new;
end;
$$;

create trigger questions_validate_learning_links
before insert or update of exam_id, question_family_id on public.questions
for each row execute function private.validate_question_learning_links();
create trigger question_concepts_validate_link
before insert or update of question_id, concept_id on public.question_concepts
for each row execute function private.validate_question_concept_link();
create trigger questions_validate_approval_metadata
before update of review_status on public.questions
for each row execute function private.validate_question_approval_metadata();

create or replace function public.reviewer_set_choice_feedback(
  p_choice_id uuid,
  p_feedback_text text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_question_id uuid;
begin
  if (select auth.uid()) is null or not private.can_review_content() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select question_id into v_question_id
  from public.question_choices
  where id = p_choice_id;

  if v_question_id is null then
    raise exception 'Choice not found' using errcode = 'P0002';
  end if;
  if not private.question_is_editable(v_question_id) then
    raise exception 'Approved choice feedback cannot be changed directly' using errcode = '42501';
  end if;
  if nullif(trim(p_feedback_text), '') is null then
    raise exception 'Choice feedback is required' using errcode = '22023';
  end if;

  insert into private.question_choice_feedback (choice_id, feedback_text)
  values (p_choice_id, trim(p_feedback_text))
  on conflict (choice_id) do update set feedback_text = excluded.feedback_text;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, after_summary)
  values (
    (select auth.uid()),
    'question.choice_feedback_saved',
    'question_choice',
    p_choice_id,
    jsonb_build_object('has_feedback', true)
  );
end;
$$;

revoke all on function private.validate_question_learning_links() from public;
revoke all on function private.validate_question_concept_link() from public;
revoke all on function private.validate_question_approval_metadata() from public;
revoke all on function public.reviewer_set_choice_feedback(uuid, text) from public;
grant execute on function public.reviewer_set_choice_feedback(uuid, text) to authenticated;

comment on function public.reviewer_set_choice_feedback is 'Reviewer-only distractor-feedback writer with no private table access.';

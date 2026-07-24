create function private.activate_reviewed_question_metadata(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_question public.questions%rowtype;
  v_concept_ids uuid[];
begin
  if v_actor is null or not private.can_review_content() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into v_question
  from public.questions
  where id = p_question_id
  for update;

  if not found then
    raise exception 'Question not found' using errcode = 'P0002';
  end if;
  if v_question.question_family_id is null
    or v_question.learning_objective_id is null then
    raise exception 'Approval requires linked learning metadata' using errcode = '22023';
  end if;
  if not exists (
    select 1
    from public.question_families f
    where f.id = v_question.question_family_id
      and f.exam_id = v_question.exam_id
  ) then
    raise exception 'Question family must belong to the selected exam'
      using errcode = '22023';
  end if;

  select array_agg(qc.concept_id order by qc.concept_id)
  into v_concept_ids
  from public.question_concepts qc
  join public.concepts c on c.id = qc.concept_id
  where qc.question_id = p_question_id
    and qc.is_primary
    and c.topic_id = v_question.topic_id;

  if coalesce(cardinality(v_concept_ids), 0) = 0 then
    raise exception 'Approval requires a primary concept for the question topic'
      using errcode = '22023';
  end if;

  update public.learning_objectives
  set status = 'active'
  where id = v_question.learning_objective_id;

  update public.concepts
  set status = 'active'
  where id = any(v_concept_ids);

  update public.question_families
  set status = 'active'
  where id = v_question.question_family_id;

  insert into public.audit_log (
    actor_id, action, entity_type, entity_id, after_summary
  ) values (
    v_actor,
    'question.learning_metadata_activated',
    'question',
    p_question_id,
    jsonb_build_object(
      'learning_objective_id', v_question.learning_objective_id,
      'question_family_id', v_question.question_family_id,
      'primary_concept_ids', v_concept_ids
    )
  );
end;
$$;

create or replace function public.reviewer_submit_question_review(
  p_question_id uuid,
  p_accuracy_rating smallint,
  p_clarity_rating smallint,
  p_source_alignment_rating smallint,
  p_notes text,
  p_decision public.review_decision
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_actor uuid := (select auth.uid());
begin
  if v_actor is null or not private.can_review_content() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if p_accuracy_rating not between 1 and 5 or p_clarity_rating not between 1 and 5
    or p_source_alignment_rating not between 1 and 5 then
    raise exception 'Ratings must be between 1 and 5' using errcode = '22023';
  end if;
  if not exists (select 1 from public.questions where id = p_question_id) then
    raise exception 'Question not found' using errcode = 'P0002';
  end if;

  insert into public.question_quality_reviews (
    question_id, reviewer_id, accuracy_rating, clarity_rating,
    source_alignment_rating, notes, decision
  ) values (
    p_question_id, v_actor, p_accuracy_rating, p_clarity_rating,
    p_source_alignment_rating, nullif(trim(p_notes), ''), p_decision
  );

  if p_decision = 'approve' then
    perform private.activate_reviewed_question_metadata(p_question_id);
    perform public.reviewer_approve_question(p_question_id);
  elsif p_decision = 'reject' then
    update public.questions
    set review_status = 'rejected', status = 'inactive',
      approved_by = null, approved_at = null
    where id = p_question_id;
  else
    update public.questions
    set review_status = 'draft', status = 'draft',
      approved_by = null, approved_at = null
    where id = p_question_id;
  end if;
end;
$$;

revoke all on function private.activate_reviewed_question_metadata(uuid) from public;

comment on function private.activate_reviewed_question_metadata(uuid) is
  'Reviewer-approval helper that activates only the question-linked objective, primary concepts, and exam-scoped family before strict approval validation.';

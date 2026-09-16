create or replace function public.reviewer_save_question_with_classification(
  p_question_id uuid,
  p_payload jsonb,
  p_change_reason text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_version integer;
  v_chapter integer;
  v_weight numeric;
begin
  if v_actor is null or not private.can_review_content() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  v_chapter := nullif(p_payload->>'chapter_number', '')::integer;
  v_weight := coalesce(nullif(p_payload->>'final_exam_weight', '')::numeric, 0);

  if v_chapter is not null and v_chapter not between 1 and 99 then
    raise exception 'Chapter number must be between 1 and 99' using errcode = '22023';
  end if;

  if coalesce(p_payload->>'exam_likeness', '') not in ('', 'high', 'medium', 'low')
    or coalesce(p_payload->>'distractor_difficulty', '') not in ('', 'basic', 'moderate', 'close')
    or coalesce(p_payload->>'content_origin', '') not in (
      '', 'existing_original_bank', 'original_textbook_grounded'
    )
    or v_weight < 0 then
    raise exception 'Final-exam classification is invalid' using errcode = '22023';
  end if;

  v_version := public.reviewer_save_question(p_question_id, p_payload, p_change_reason);

  update public.questions set
    chapter_number = v_chapter,
    exam_likeness = nullif(p_payload->>'exam_likeness', ''),
    distractor_difficulty = nullif(p_payload->>'distractor_difficulty', ''),
    eligible_for_final_exam = coalesce((p_payload->>'eligible_for_final_exam')::boolean, false),
    final_exam_weight = v_weight,
    content_origin = nullif(p_payload->>'content_origin', ''),
    style_reference = nullif(p_payload->>'style_reference', '')
  where id = p_question_id;

  insert into public.audit_log (
    actor_id, action, entity_type, entity_id, after_summary
  ) values (
    v_actor, 'question.final_exam_classification_edited', 'question', p_question_id,
    jsonb_build_object(
      'chapter_number', v_chapter,
      'exam_likeness', nullif(p_payload->>'exam_likeness', ''),
      'eligible_for_final_exam', coalesce((p_payload->>'eligible_for_final_exam')::boolean, false),
      'final_exam_weight', v_weight
    )
  );

  return v_version;
end;
$$;

comment on function public.reviewer_save_question_with_classification(uuid, jsonb, text) is
  'Saves versioned reviewer edits and governed exam classifications; the questions table constraint is the single source of truth for style-reference provenance labels.';

revoke all on function public.reviewer_save_question_with_classification(uuid, jsonb, text)
  from public, anon;
grant execute on function public.reviewer_save_question_with_classification(uuid, jsonb, text)
  to authenticated;

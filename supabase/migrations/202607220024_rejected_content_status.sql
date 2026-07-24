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
    perform public.reviewer_approve_question(p_question_id);
  elsif p_decision = 'reject' then
    update public.questions set review_status = 'rejected', status = 'archived',
      approved_by = null, approved_at = null where id = p_question_id;
  else
    update public.questions set review_status = 'draft', status = 'draft',
      approved_by = null, approved_at = null where id = p_question_id;
  end if;
end;
$$;

revoke all on function public.reviewer_submit_question_review(
  uuid, smallint, smallint, smallint, text, public.review_decision
) from public;
grant execute on function public.reviewer_submit_question_review(
  uuid, smallint, smallint, smallint, text, public.review_decision
) to authenticated;

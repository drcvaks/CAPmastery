create or replace function private.question_is_editable(p_question_id uuid)
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
      and q.review_status <> 'approved'
  );
$$;

create or replace function private.validate_question_hierarchy()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.topics t
    where t.id = new.topic_id and t.exam_id = new.exam_id
  ) then
    raise exception 'Question topic must belong to the selected exam';
  end if;

  if new.learning_objective_id is not null and not exists (
    select 1
    from public.learning_objectives o
    where o.id = new.learning_objective_id and o.topic_id = new.topic_id
  ) then
    raise exception 'Question objective must belong to the selected topic';
  end if;

  return new;
end;
$$;

create or replace function private.prevent_approved_answer_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not private.question_is_editable(new.question_id) then
    raise exception 'Approved answer keys cannot be changed directly';
  end if;

  return new;
end;
$$;

create trigger questions_validate_hierarchy
before insert or update of exam_id, topic_id, learning_objective_id on public.questions
for each row execute function private.validate_question_hierarchy();

create trigger question_answer_keys_prevent_approved_change
before insert or update on private.question_answer_keys
for each row execute function private.prevent_approved_answer_change();

drop policy questions_manage_reviewer on public.questions;
create policy questions_insert_reviewer
on public.questions for insert to authenticated
with check (
  private.can_review_content()
  and review_status <> 'approved'
  and approved_by is null
  and approved_at is null
);
create policy questions_update_unapproved_reviewer
on public.questions for update to authenticated
using (private.can_review_content() and review_status <> 'approved')
with check (
  private.can_review_content()
  and review_status <> 'approved'
  and approved_by is null
  and approved_at is null
);
create policy questions_delete_unapproved_reviewer
on public.questions for delete to authenticated
using (private.can_review_content() and review_status <> 'approved');

drop policy choices_manage_reviewer on public.question_choices;
create policy choices_insert_editable_reviewer
on public.question_choices for insert to authenticated
with check (private.can_review_content() and private.question_is_editable(question_id));
create policy choices_update_editable_reviewer
on public.question_choices for update to authenticated
using (private.can_review_content() and private.question_is_editable(question_id))
with check (private.can_review_content() and private.question_is_editable(question_id));
create policy choices_delete_editable_reviewer
on public.question_choices for delete to authenticated
using (private.can_review_content() and private.question_is_editable(question_id));

revoke all on function private.question_is_editable(uuid) from public;
revoke all on function private.validate_question_hierarchy() from public;
revoke all on function private.prevent_approved_answer_change() from public;
grant execute on function private.question_is_editable(uuid) to authenticated;

comment on function private.question_is_editable is 'Prevents direct edits to approved questions and their choices.';

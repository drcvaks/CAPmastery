create type public.csv_import_status as enum ('validating', 'failed', 'completed');

create table public.csv_import_jobs (
  id uuid primary key default gen_random_uuid(),
  file_name text not null check (char_length(file_name) between 1 and 240),
  importer_id uuid not null references public.profiles (id) on delete restrict,
  rows_received integer not null check (rows_received >= 0),
  rows_accepted integer not null default 0 check (rows_accepted >= 0),
  rows_rejected integer not null default 0 check (rows_rejected >= 0),
  error_report jsonb not null default '[]'::jsonb check (jsonb_typeof(error_report) = 'array'),
  warning_report jsonb not null default '[]'::jsonb check (jsonb_typeof(warning_report) = 'array'),
  status public.csv_import_status not null default 'validating',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (
    (status = 'validating' and completed_at is null)
    or (status in ('failed', 'completed') and completed_at is not null)
  )
);

create index csv_import_jobs_importer_idx
  on public.csv_import_jobs (importer_id, created_at desc);

alter table public.csv_import_jobs enable row level security;

create policy csv_import_jobs_reviewer_select
on public.csv_import_jobs for select to authenticated
using (private.can_review_content());

revoke all on table public.csv_import_jobs from public, anon, authenticated;
grant select on table public.csv_import_jobs to authenticated;

create or replace function private.question_content_snapshot(p_question_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'question', to_jsonb(q),
    'choices', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'key', c.choice_key,
          'text', c.choice_text,
          'sort_order', c.sort_order,
          'feedback', f.feedback_text
        ) order by c.sort_order
      )
      from public.question_choices c
      left join private.question_choice_feedback f on f.choice_id = c.id
      where c.question_id = q.id
    ), '[]'::jsonb),
    'answer', (
      select jsonb_build_object(
        'correct_choice_id', k.correct_choice_id,
        'explanation', k.explanation,
        'remediation', k.remediation,
        'common_mistake', k.common_mistake
      )
      from private.question_answer_keys k
      where k.question_id = q.id
    ),
    'learning_support', (
      select to_jsonb(ls) - 'question_id'
      from private.question_learning_support ls
      where ls.question_id = q.id
    )
  )
  from public.questions q
  where q.id = p_question_id;
$$;

create or replace function public.reviewer_check_import_duplicates(p_rows jsonb)
returns table (row_number integer, external_id text, warning text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not private.can_review_content() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Rows must be a JSON array' using errcode = '22023';
  end if;

  return query
  with supplied as (
    select ordinality::integer + 1 as csv_row,
      nullif(trim(value->>'external_id'), '') as supplied_external_id,
      lower(regexp_replace(trim(coalesce(value->>'question_text', '')), '\s+', ' ', 'g')) as normalized_text,
      value->>'objective_code' as objective_code
    from jsonb_array_elements(p_rows) with ordinality
  )
  select s.csv_row, s.supplied_external_id,
    case
      when q.external_id = s.supplied_external_id then
        'external_id already exists as ' || q.review_status::text
      else 'similar question text already exists as ' || coalesce(q.external_id, q.id::text)
    end
  from supplied s
  join public.questions q on
    q.external_id = s.supplied_external_id
    or lower(regexp_replace(trim(q.question_text), '\s+', ' ', 'g')) = s.normalized_text
  where s.normalized_text <> ''
  order by s.csv_row, q.external_id nulls last;
end;
$$;

create or replace function public.reviewer_import_question_csv(
  p_file_name text,
  p_rows jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  v_actor uuid := (select auth.uid());
  v_job uuid;
  v_errors jsonb := '[]'::jsonb;
  v_warnings jsonb := '[]'::jsonb;
  v_row jsonb;
  v_row_number integer;
  v_external_id text;
  v_objective public.learning_objectives%rowtype;
  v_concept public.concepts%rowtype;
  v_family public.question_families%rowtype;
  v_exam_id uuid;
  v_pages text[];
  v_question_id uuid;
  v_choice_id uuid;
  v_correct_choice_id uuid;
  v_key text;
  v_choice_text text;
  v_feedback text;
  v_cognitive public.cognitive_level;
  v_purpose public.question_purpose;
  v_target text;
  v_target_id uuid;
begin
  if v_actor is null or not private.can_review_content() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if nullif(trim(p_file_name), '') is null or char_length(trim(p_file_name)) > 240 then
    raise exception 'A valid file name is required' using errcode = '22023';
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0
    or jsonb_array_length(p_rows) > 500 then
    raise exception 'Import must contain between 1 and 500 rows' using errcode = '22023';
  end if;

  insert into public.csv_import_jobs (file_name, importer_id, rows_received)
  values (trim(p_file_name), v_actor, jsonb_array_length(p_rows))
  returning id into v_job;

  for v_row, v_row_number in
    select value, ordinality::integer + 1
    from jsonb_array_elements(p_rows) with ordinality
  loop
    v_external_id := upper(trim(coalesce(v_row->>'external_id', '')));
    if v_external_id !~ '^[A-Z0-9][A-Z0-9_-]{2,119}$' then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object(
        'row', v_row_number, 'external_id', v_external_id,
        'message', 'external_id has an invalid format'
      ));
    elsif exists (select 1 from public.questions q where q.external_id = v_external_id) then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object(
        'row', v_row_number, 'external_id', v_external_id,
        'message', 'external_id already exists; edit it through the review workflow'
      ));
    end if;

    if nullif(trim(v_row->>'question_text'), '') is null then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object(
        'row', v_row_number, 'external_id', v_external_id, 'message', 'question_text is required'
      ));
    end if;
    if coalesce(v_row->>'review_status', '') <> 'draft' then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object(
        'row', v_row_number, 'external_id', v_external_id, 'message', 'imports must use review_status draft'
      ));
    end if;
    if coalesce(v_row->>'difficulty', '') not in ('easy', 'medium', 'hard') then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object(
        'row', v_row_number, 'external_id', v_external_id, 'message', 'difficulty is invalid'
      ));
    end if;
    if coalesce(v_row->>'cognitive_level', '') not in
      ('recall', 'recognition', 'understanding', 'application', 'analysis', 'scenario') then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object(
        'row', v_row_number, 'external_id', v_external_id, 'message', 'cognitive_level is invalid'
      ));
    end if;
    if coalesce(v_row->>'question_type', '') <> 'multiple_choice' then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object(
        'row', v_row_number, 'external_id', v_external_id,
        'message', 'this workflow currently accepts multiple_choice rows'
      ));
    end if;
    if coalesce(v_row->>'correct_letter', '') not in ('A', 'B', 'C', 'D') then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object(
        'row', v_row_number, 'external_id', v_external_id, 'message', 'correct_letter must be A, B, C, or D'
      ));
    end if;
    if nullif(trim(v_row->>'explanation'), '') is null
      or nullif(trim(v_row->>'source_reference_text'), '') is null then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object(
        'row', v_row_number, 'external_id', v_external_id,
        'message', 'explanation and source_reference_text are required'
      ));
    end if;
    if coalesce(v_row->>'estimated_time_seconds', '') !~ '^[0-9]+$'
      or coalesce((v_row->>'estimated_time_seconds')::integer, 0) < 1 then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object(
        'row', v_row_number, 'external_id', v_external_id,
        'message', 'estimated_time_seconds must be a positive integer'
      ));
    end if;
    v_pages := regexp_match(coalesce(v_row->>'source_pages', ''), '^([0-9]+)([[:space:]]*[-–—][[:space:]]*([0-9]+))?$');
    if v_pages is null or coalesce(v_pages[3], v_pages[1])::integer < v_pages[1]::integer then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object(
        'row', v_row_number, 'external_id', v_external_id, 'message', 'source_pages is invalid'
      ));
    end if;
    foreach v_key in array array['A', 'B', 'C', 'D'] loop
      if nullif(trim(v_row->>('choice_' || lower(v_key))), '') is null then
        v_errors := v_errors || jsonb_build_array(jsonb_build_object(
          'row', v_row_number, 'external_id', v_external_id,
          'message', 'choice_' || lower(v_key) || ' is required'
        ));
      end if;
    end loop;

    select o.* into v_objective
    from public.learning_objectives o
    where o.code = trim(v_row->>'objective_code')
    order by o.created_at
    limit 1;
    if not found then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object(
        'row', v_row_number, 'external_id', v_external_id, 'message', 'objective_code was not found'
      ));
    else
      select c.* into v_concept
      from public.concepts c
      where c.topic_id = v_objective.topic_id and c.code = trim(v_row->>'concept_code')
      limit 1;
      if not found then
        v_errors := v_errors || jsonb_build_array(jsonb_build_object(
          'row', v_row_number, 'external_id', v_external_id,
          'message', 'concept_code was not found under the objective topic'
        ));
      end if;
      select t.exam_id into v_exam_id from public.topics t where t.id = v_objective.topic_id;
      select f.* into v_family
      from public.question_families f
      where f.exam_id = v_exam_id
        and (f.source_code = trim(v_row->>'question_family_code')
          or f.code = trim(v_row->>'question_family_code'))
      order by f.created_at
      limit 1;
      if not found then
        v_errors := v_errors || jsonb_build_array(jsonb_build_object(
          'row', v_row_number, 'external_id', v_external_id, 'message', 'question_family_code was not found'
        ));
      end if;
    end if;

    if exists (
      select 1 from public.questions q
      where lower(regexp_replace(trim(q.question_text), '\s+', ' ', 'g')) =
        lower(regexp_replace(trim(coalesce(v_row->>'question_text', '')), '\s+', ' ', 'g'))
    ) then
      v_warnings := v_warnings || jsonb_build_array(jsonb_build_object(
        'row', v_row_number, 'external_id', v_external_id,
        'message', 'similar normalized question text already exists'
      ));
    end if;
  end loop;

  if jsonb_array_length(v_errors) > 0 then
    update public.csv_import_jobs set
      rows_rejected = rows_received,
      error_report = v_errors,
      warning_report = v_warnings,
      status = 'failed',
      completed_at = now()
    where id = v_job;
    return v_job;
  end if;

  for v_row, v_row_number in
    select value, ordinality::integer + 1
    from jsonb_array_elements(p_rows) with ordinality
  loop
    v_external_id := upper(trim(v_row->>'external_id'));
    select o.* into strict v_objective
    from public.learning_objectives o
    where o.code = trim(v_row->>'objective_code')
    order by o.created_at limit 1;
    select c.* into strict v_concept
    from public.concepts c
    where c.topic_id = v_objective.topic_id and c.code = trim(v_row->>'concept_code') limit 1;
    select t.exam_id into strict v_exam_id from public.topics t where t.id = v_objective.topic_id;
    select f.* into strict v_family
    from public.question_families f
    where f.exam_id = v_exam_id
      and (f.source_code = trim(v_row->>'question_family_code')
        or f.code = trim(v_row->>'question_family_code'))
    order by f.created_at limit 1;
    v_pages := regexp_match(v_row->>'source_pages', '^([0-9]+)([[:space:]]*[-–—][[:space:]]*([0-9]+))?$');
    v_cognitive := case v_row->>'cognitive_level'
      when 'recognition' then 'recall'::public.cognitive_level
      when 'analysis' then 'application'::public.cognitive_level
      else (v_row->>'cognitive_level')::public.cognitive_level end;
    v_purpose := case v_row->>'cognitive_level'
      when 'scenario' then 'scenario_judgment'::public.question_purpose
      else (v_row->>'cognitive_level')::public.question_purpose end;

    insert into public.questions (
      exam_id, topic_id, learning_objective_id, source_document_id,
      source_page_start, source_page_end, source_reference, question_text,
      question_type, difficulty, cognitive_level, purpose, question_family_id,
      estimated_time_seconds, created_by, external_id, pilot_batch, source_status,
      review_status, status
    ) values (
      v_exam_id, v_objective.topic_id, v_objective.id, v_concept.source_document_id,
      v_pages[1]::integer, coalesce(v_pages[3], v_pages[1])::integer,
      trim(v_row->>'source_reference_text'), trim(v_row->>'question_text'),
      'multiple_choice', (v_row->>'difficulty')::public.question_difficulty,
      v_cognitive, v_purpose, v_family.id,
      (v_row->>'estimated_time_seconds')::integer, v_actor, v_external_id,
      nullif(trim(v_row->>'pilot_batch'), ''), nullif(trim(v_row->>'source_status'), ''),
      'draft', 'draft'
    ) returning id into v_question_id;

    v_correct_choice_id := null;
    foreach v_key in array array['A', 'B', 'C', 'D'] loop
      v_choice_text := trim(v_row->>('choice_' || lower(v_key)));
      insert into public.question_choices (question_id, choice_key, choice_text, sort_order)
      values (v_question_id, v_key, v_choice_text, ascii(v_key) - ascii('A'))
      returning id into v_choice_id;
      if v_key = v_row->>'correct_letter' then v_correct_choice_id := v_choice_id; end if;
      v_feedback := nullif(trim(v_row->>('choice_' || lower(v_key) || '_explanation')), '');
      if v_feedback is not null then
        insert into private.question_choice_feedback (choice_id, feedback_text)
        values (v_choice_id, v_feedback);
      end if;
    end loop;

    insert into private.question_answer_keys (
      question_id, correct_choice_id, explanation, remediation, common_mistake, created_by
    ) values (
      v_question_id, v_correct_choice_id, trim(v_row->>'explanation'),
      nullif(trim(v_row->>'remediation_text'), ''), nullif(trim(v_row->>'common_mistake'), ''), v_actor
    );
    insert into public.question_concepts (question_id, concept_id, is_primary)
    values (v_question_id, v_concept.id, true);

    if nullif(trim(v_row->>'short_explanation'), '') is not null then
      insert into private.question_learning_support (
        question_id, short_explanation, feedback_display_version, memory_aid,
        visual_priority, visual_type, visual_display_mode, visual_asset_key,
        visual_brief, visual_caption, visual_alt_text
      ) values (
        v_question_id, trim(v_row->>'short_explanation'),
        greatest(1, coalesce(nullif(v_row->>'feedback_display_version', '')::integer, 1)),
        nullif(trim(v_row->>'memory_aid'), ''), nullif(trim(v_row->>'visual_priority'), ''),
        nullif(trim(v_row->>'visual_type'), ''), nullif(trim(v_row->>'visual_display_mode'), ''),
        nullif(trim(v_row->>'visual_asset_key'), ''), nullif(trim(v_row->>'visual_brief'), ''),
        nullif(trim(v_row->>'visual_caption'), ''), nullif(trim(v_row->>'visual_alt_text'), '')
      );
    end if;
  end loop;

  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    select q.id into strict v_question_id
    from public.questions q where q.external_id = upper(trim(v_row->>'external_id'));
    foreach v_target in array string_to_array(coalesce(v_row->>'reinforcement_question_ids', ''), ';')
    loop
      v_target := trim(v_target);
      if v_target <> '' then
        select q.id into v_target_id from public.questions q where q.external_id = upper(v_target);
        if v_target_id is null then
          v_warnings := v_warnings || jsonb_build_array(jsonb_build_object(
            'external_id', upper(trim(v_row->>'external_id')),
            'message', 'reinforcement target ' || upper(v_target) || ' was not found'
          ));
        elsif v_target_id <> v_question_id then
          insert into public.question_reinforcements (question_id, reinforcement_question_id)
          values (v_question_id, v_target_id) on conflict do nothing;
        end if;
      end if;
    end loop;
  end loop;

  update public.csv_import_jobs set
    rows_accepted = rows_received,
    warning_report = v_warnings,
    status = 'completed',
    completed_at = now()
  where id = v_job;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, after_summary)
  values (
    v_actor, 'question.csv_imported', 'csv_import_job', v_job,
    jsonb_build_object('file_name', trim(p_file_name), 'rows', jsonb_array_length(p_rows))
  );
  return v_job;
end;
$$;

create or replace function public.get_content_review_queue()
returns table (
  question_id uuid,
  external_id text,
  question_text text,
  exam_title text,
  topic_title text,
  review_status public.question_review_status,
  version integer,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not private.can_review_content() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  return query
  select q.id, q.external_id, q.question_text, e.title, t.title, q.review_status, q.version, q.updated_at
  from public.questions q
  join public.exams e on e.id = q.exam_id
  join public.topics t on t.id = q.topic_id
  order by
    case q.review_status when 'in_review' then 0 when 'draft' then 1 else 2 end,
    q.updated_at desc;
end;
$$;

create or replace function public.get_content_review_question(p_question_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_result jsonb;
begin
  if (select auth.uid()) is null or not private.can_review_content() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  select private.question_content_snapshot(p_question_id) into v_result;
  if v_result is null then raise exception 'Question not found' using errcode = 'P0002'; end if;
  return v_result;
end;
$$;

create or replace function public.reviewer_save_question(
  p_question_id uuid,
  p_payload jsonb,
  p_change_reason text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  v_actor uuid := (select auth.uid());
  v_question public.questions%rowtype;
  v_choice jsonb;
  v_choice_id uuid;
  v_correct_choice_id uuid;
  v_new_version integer;
begin
  if v_actor is null or not private.can_review_content() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Question payload must be an object' using errcode = '22023';
  end if;
  select * into v_question from public.questions where id = p_question_id for update;
  if not found then raise exception 'Question not found' using errcode = 'P0002'; end if;
  if nullif(trim(p_payload->>'question_text'), '') is null
    or nullif(trim(p_payload->>'explanation'), '') is null
    or nullif(trim(p_payload->>'source_reference'), '') is null then
    raise exception 'Question, explanation, and source reference are required' using errcode = '22023';
  end if;
  if coalesce(p_payload->>'difficulty', '') not in ('easy', 'medium', 'hard')
    or coalesce(p_payload->>'cognitive_level', '') not in ('recall', 'understanding', 'application', 'scenario') then
    raise exception 'Difficulty or cognitive level is invalid' using errcode = '22023';
  end if;
  if jsonb_typeof(p_payload->'choices') <> 'array' or jsonb_array_length(p_payload->'choices') <> 4 then
    raise exception 'Exactly four choices are required' using errcode = '22023';
  end if;
  if coalesce(p_payload->>'correct_letter', '') not in ('A', 'B', 'C', 'D') then
    raise exception 'Correct letter must be A, B, C, or D' using errcode = '22023';
  end if;

  v_new_version := v_question.version;
  if v_question.review_status = 'approved' then
    if nullif(trim(p_change_reason), '') is null then
      raise exception 'A change reason is required for an approved question' using errcode = '22023';
    end if;
    insert into public.question_versions (question_id, version, snapshot, change_reason, created_by)
    values (
      p_question_id, v_question.version, private.question_content_snapshot(p_question_id),
      trim(p_change_reason), v_actor
    ) on conflict (question_id, version) do nothing;
    v_new_version := v_question.version + 1;
  end if;

  update public.questions set
    question_text = trim(p_payload->>'question_text'),
    difficulty = (p_payload->>'difficulty')::public.question_difficulty,
    cognitive_level = (p_payload->>'cognitive_level')::public.cognitive_level,
    source_reference = trim(p_payload->>'source_reference'),
    source_page_start = nullif(p_payload->>'source_page_start', '')::integer,
    source_page_end = nullif(p_payload->>'source_page_end', '')::integer,
    estimated_time_seconds = nullif(p_payload->>'estimated_time_seconds', '')::integer,
    version = v_new_version,
    review_status = 'draft', status = 'draft', approved_by = null, approved_at = null
  where id = p_question_id;

  for v_choice in select value from jsonb_array_elements(p_payload->'choices')
  loop
    if coalesce(v_choice->>'key', '') not in ('A', 'B', 'C', 'D')
      or nullif(trim(v_choice->>'text'), '') is null then
      raise exception 'Every choice requires a unique A-D key and text' using errcode = '22023';
    end if;
    select c.id into v_choice_id from public.question_choices c
    where c.question_id = p_question_id and c.choice_key = v_choice->>'key';
    if v_choice_id is null then
      insert into public.question_choices (question_id, choice_key, choice_text, sort_order)
      values (p_question_id, v_choice->>'key', trim(v_choice->>'text'), ascii(v_choice->>'key') - ascii('A'))
      returning id into v_choice_id;
    else
      update public.question_choices set choice_text = trim(v_choice->>'text') where id = v_choice_id;
    end if;
    if nullif(trim(v_choice->>'feedback'), '') is null then
      delete from private.question_choice_feedback where choice_id = v_choice_id;
    else
      insert into private.question_choice_feedback (choice_id, feedback_text)
      values (v_choice_id, trim(v_choice->>'feedback'))
      on conflict (choice_id) do update set feedback_text = excluded.feedback_text;
    end if;
    if v_choice->>'key' = p_payload->>'correct_letter' then v_correct_choice_id := v_choice_id; end if;
  end loop;

  insert into private.question_answer_keys (
    question_id, correct_choice_id, explanation, remediation, common_mistake, created_by
  ) values (
    p_question_id, v_correct_choice_id, trim(p_payload->>'explanation'),
    nullif(trim(p_payload->>'remediation'), ''), nullif(trim(p_payload->>'common_mistake'), ''), v_actor
  ) on conflict (question_id) do update set
    correct_choice_id = excluded.correct_choice_id,
    explanation = excluded.explanation,
    remediation = excluded.remediation,
    common_mistake = excluded.common_mistake,
    created_by = excluded.created_by;

  delete from public.question_quality_reviews where question_id = p_question_id;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, before_summary, after_summary)
  values (
    v_actor, 'question.edited', 'question', p_question_id,
    jsonb_build_object('version', v_question.version, 'review_status', v_question.review_status),
    jsonb_build_object('version', v_new_version, 'review_status', 'draft')
  );
  return v_new_version;
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
    perform public.reviewer_approve_question(p_question_id);
  elsif p_decision = 'reject' then
    update public.questions set review_status = 'rejected', status = 'inactive',
      approved_by = null, approved_at = null where id = p_question_id;
  else
    update public.questions set review_status = 'draft', status = 'draft',
      approved_by = null, approved_at = null where id = p_question_id;
  end if;
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
  select * into v_question from public.questions where id = p_question_id for update;
  if not found then raise exception 'Question not found' using errcode = 'P0002'; end if;
  if v_question.learning_objective_id is null or v_question.source_document_id is null
    or nullif(trim(v_question.source_reference), '') is null then
    raise exception 'Approved questions require a learning objective and source reference' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.source_documents where id = v_question.source_document_id
      and authorization_status = 'approved' and status = 'active'
  ) then
    raise exception 'Question source must be active and authorized' using errcode = '22023';
  end if;
  select count(*) into v_choice_count from public.question_choices where question_id = p_question_id;
  if (v_question.question_type = 'true_false' and v_choice_count <> 2)
    or (v_question.question_type = 'multiple_choice' and v_choice_count < 3) then
    raise exception 'Question has an invalid number of choices' using errcode = '22023';
  end if;
  if not exists (
    select 1 from private.question_answer_keys
    where question_id = p_question_id and nullif(trim(explanation), '') is not null
  ) then
    raise exception 'Question requires a private answer key and explanation' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.question_quality_reviews
    where question_id = p_question_id and decision = 'approve'
  ) then
    raise exception 'Question requires an approving quality review' using errcode = '22023';
  end if;
  insert into public.question_versions (question_id, version, snapshot, change_reason, created_by)
  values (
    p_question_id, v_question.version, private.question_content_snapshot(p_question_id),
    'Approved for student delivery', (select auth.uid())
  ) on conflict (question_id, version) do update set snapshot = excluded.snapshot;
  update public.questions set review_status = 'approved', status = 'active',
    approved_by = (select auth.uid()), approved_at = now() where id = p_question_id;
  insert into public.audit_log (
    actor_id, action, entity_type, entity_id, before_summary, after_summary
  ) values (
    (select auth.uid()), 'question.approved', 'question', p_question_id,
    jsonb_build_object('review_status', v_question.review_status, 'status', v_question.status),
    jsonb_build_object('review_status', 'approved', 'status', 'active', 'version', v_question.version)
  );
end;
$$;

revoke all on function private.question_content_snapshot(uuid) from public;
revoke all on function public.reviewer_check_import_duplicates(jsonb) from public;
revoke all on function public.reviewer_import_question_csv(text, jsonb) from public;
revoke all on function public.get_content_review_queue() from public;
revoke all on function public.get_content_review_question(uuid) from public;
revoke all on function public.reviewer_save_question(uuid, jsonb, text) from public;
revoke all on function public.reviewer_submit_question_review(uuid, smallint, smallint, smallint, text, public.review_decision) from public;
revoke all on function public.reviewer_approve_question(uuid) from public;

grant execute on function public.reviewer_check_import_duplicates(jsonb) to authenticated;
grant execute on function public.reviewer_import_question_csv(text, jsonb) to authenticated;
grant execute on function public.get_content_review_queue() to authenticated;
grant execute on function public.get_content_review_question(uuid) to authenticated;
grant execute on function public.reviewer_save_question(uuid, jsonb, text) to authenticated;
grant execute on function public.reviewer_submit_question_review(uuid, smallint, smallint, smallint, text, public.review_decision) to authenticated;
grant execute on function public.reviewer_approve_question(uuid) to authenticated;

comment on table public.csv_import_jobs is
  'Reviewer-visible import summaries only; raw CSV and answer content are not retained in job records.';
comment on function public.reviewer_import_question_csv is
  'Validates an entire reviewed CSV payload and imports it atomically as draft content only.';
comment on function public.reviewer_save_question is
  'Reviewer-only edit path; approved edits snapshot the prior complete version and return the revision to draft.';

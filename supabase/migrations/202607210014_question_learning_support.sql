create type private.visual_asset_status as enum ('draft', 'approved', 'archived');

create table private.visual_assets (
  asset_key text primary key check (asset_key ~ '^[a-z0-9][a-z0-9_-]{2,119}$'),
  storage_path text not null unique check (char_length(storage_path) between 1 and 500),
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp', 'image/svg+xml')),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  alt_text text not null check (char_length(alt_text) between 1 and 1000),
  status private.visual_asset_status not null default 'draft',
  created_by uuid not null references public.profiles (id) on delete restrict,
  approved_by uuid references public.profiles (id) on delete restrict,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'approved' and approved_by is not null and approved_at is not null)
    or status <> 'approved'
  )
);

create table private.question_learning_support (
  question_id uuid primary key references public.questions (id) on delete cascade,
  short_explanation text not null check (char_length(short_explanation) between 1 and 2000),
  feedback_display_version integer not null default 1 check (feedback_display_version > 0),
  memory_aid text check (memory_aid is null or char_length(memory_aid) between 1 and 2000),
  visual_priority text check (visual_priority is null or visual_priority in ('low', 'medium', 'high')),
  visual_type text check (
    visual_type is null or visual_type ~ '^[a-z][a-z0-9_]{1,79}$'
  ),
  visual_display_mode text check (
    visual_display_mode is null or visual_display_mode ~ '^[a-z][a-z0-9_]{1,79}$'
  ),
  visual_asset_key text check (
    visual_asset_key is null or visual_asset_key ~ '^[a-z0-9][a-z0-9_-]{2,119}$'
  ),
  visual_brief text,
  visual_caption text,
  visual_alt_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    visual_asset_key is null
    or (
      nullif(trim(visual_brief), '') is not null
      and nullif(trim(visual_caption), '') is not null
      and nullif(trim(visual_alt_text), '') is not null
    )
  )
);

create trigger visual_assets_set_updated_at
before update on private.visual_assets
for each row execute function private.set_updated_at();

create trigger question_learning_support_set_updated_at
before update on private.question_learning_support
for each row execute function private.set_updated_at();

revoke all on table private.visual_assets from public, anon, authenticated;
revoke all on table private.question_learning_support from public, anon, authenticated;

drop function public.get_study_session_questions(uuid);

create function public.get_study_session_questions(p_session_id uuid)
returns table (
  session_id uuid,
  session_status public.study_session_status,
  question_count integer,
  answered_count integer,
  correct_count integer,
  session_question_id uuid,
  question_position integer,
  question_id uuid,
  question_text text,
  question_type public.question_type,
  difficulty public.question_difficulty,
  cognitive_level public.cognitive_level,
  source_reference text,
  choices jsonb,
  attempt_id uuid,
  selected_choice_id uuid,
  is_correct boolean,
  correct_choice_id uuid,
  explanation text,
  selected_choice_feedback text,
  remediation text,
  common_mistake text,
  short_explanation text,
  feedback_display_version integer,
  memory_aid text,
  visual_asset_key text,
  visual_caption text,
  visual_alt_text text,
  visual_storage_path text,
  visual_mime_type text,
  visual_width integer,
  visual_height integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not private.owns_study_session(p_session_id) then
    raise exception 'Study session not found' using errcode = 'P0002';
  end if;

  return query
  select
    s.id,
    s.status,
    s.question_count,
    s.answered_count,
    s.correct_count,
    sq.id,
    sq.position,
    q.id,
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
    ),
    a.id,
    a.selected_choice_id,
    a.is_correct,
    case when a.id is not null then k.correct_choice_id else null end,
    case when a.id is not null then k.explanation else null end,
    case when a.id is not null then f.feedback_text else null end,
    case when a.id is not null then k.remediation else null end,
    case when a.id is not null then k.common_mistake else null end,
    case when a.id is not null then ls.short_explanation else null end,
    case when a.id is not null then ls.feedback_display_version else null end,
    case when a.id is not null then ls.memory_aid else null end,
    case when a.id is not null and va.status = 'approved' then va.asset_key else null end,
    case when a.id is not null and va.status = 'approved' then ls.visual_caption else null end,
    case when a.id is not null and va.status = 'approved' then va.alt_text else null end,
    case when a.id is not null and va.status = 'approved' then va.storage_path else null end,
    case when a.id is not null and va.status = 'approved' then va.mime_type else null end,
    case when a.id is not null and va.status = 'approved' then va.width else null end,
    case when a.id is not null and va.status = 'approved' then va.height else null end
  from public.study_sessions s
  join public.study_session_questions sq on sq.session_id = s.id
  join public.questions q on q.id = sq.question_id
  left join public.question_choices c on c.question_id = q.id
  left join public.question_attempts a on a.session_question_id = sq.id
  left join private.question_answer_keys k on k.question_id = q.id
  left join private.question_choice_feedback f on f.choice_id = a.selected_choice_id
  left join private.question_learning_support ls on ls.question_id = q.id
  left join private.visual_assets va on va.asset_key = ls.visual_asset_key
  where s.id = p_session_id
  group by s.id, sq.id, q.id, a.id, k.question_id, f.choice_id, ls.question_id, va.asset_key
  order by sq.position;
end;
$$;

revoke all on function public.get_study_session_questions(uuid) from public;
grant execute on function public.get_study_session_questions(uuid) to authenticated;

comment on table private.question_learning_support is 'Reviewed post-answer short feedback, memory aids, and visual metadata; never expose before an attempt.';
comment on table private.visual_assets is 'Reviewed visual asset registry. Question metadata alone never makes a visual student-visible.';
comment on column private.question_learning_support.visual_brief is 'Internal reviewer/design guidance; never returned to students.';
comment on function public.get_study_session_questions is 'Returns owned session prompts and post-attempt learning support; visual metadata appears only for approved assets.';

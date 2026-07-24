alter table public.study_sessions
  drop constraint study_sessions_practice_configuration_check;

alter table public.study_sessions
  add constraint study_sessions_practice_configuration_check check (
    (
      mode in ('study', 'challenge')
      and blueprint_id is null
      and not timed
      and time_limit_seconds is null
      and not allow_pause_snapshot
      and paused_at is null
      and total_paused_seconds = 0
    )
    or (
      mode = 'practice_test'
      and blueprint_id is not null
      and (
        (timed and time_limit_seconds is not null)
        or (not timed and time_limit_seconds is null)
      )
    )
  );

alter table public.study_session_questions
  drop constraint study_session_questions_selection_reason_check;

alter table public.study_session_questions
  add constraint study_session_questions_selection_reason_check check (
    selection_reason in (
      'basic_ordered', 'private_pilot', 'weak_topic', 'recently_missed',
      'developing_topic', 'retention_check', 'new_or_harder',
      'same_session_remediation', 'practice_test_blueprint', 'challenge_shared'
    )
  );

comment on constraint study_sessions_practice_configuration_check
on public.study_sessions is
  'Study and challenge sessions remain untimed and unpaused; only practice tests may snapshot a blueprint and timer settings.';

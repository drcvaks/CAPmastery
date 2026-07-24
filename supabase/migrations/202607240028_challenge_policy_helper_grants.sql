grant execute on function private.can_view_motivation_student(uuid) to authenticated;
grant execute on function private.can_access_challenge(uuid) to authenticated;

comment on function private.can_view_motivation_student(uuid) is
  'RLS helper callable by authenticated policy evaluation; returns true only for self or an active progress-linked guardian.';
comment on function private.can_access_challenge(uuid) is
  'RLS helper callable by authenticated policy evaluation; returns true only for the challenge creator or a participant.';

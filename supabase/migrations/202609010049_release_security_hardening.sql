-- Checkpoint 10 defense in depth. PostgreSQL grants EXECUTE on new functions to
-- PUBLIC by default, so remove inherited API access and require every client RPC
-- to retain an explicit role grant in its owning migration.
revoke execute on all functions in schema public from public, anon;
revoke execute on all functions in schema private from public, anon;

-- Private answer, feedback, source-passage, tutor-note, and visual metadata are
-- available only through narrowly scoped security-definer functions.
revoke all on all tables in schema private from public, anon, authenticated;

-- Apply the same secure defaults to future objects created by the migration
-- owner. Migrations must opt a callable function or readable table back in.
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema private revoke execute on functions from public;
alter default privileges in schema private revoke all on tables from public, anon, authenticated;

comment on schema private is
  'Non-API answer, feedback, source, teaching-support, and protected helper data. Checkpoint 10 revokes inherited client access by default.';

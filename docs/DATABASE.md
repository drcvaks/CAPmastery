# Database Plan

## Principles

- A new CAP Mastery Supabase project; never connect to mySCP.
- UUID primary keys, timestamps, explicit status values, constraints, indexes, and foreign keys.
- Version-controlled migrations under `supabase/migrations/`; development seed material under `supabase/seed/`.
- RLS on every API-exposed table and grants reviewed alongside policies.
- Soft deletion/status for durable content and version snapshots for approved-question edits.
- Generated TypeScript database types checked into the repository after migrations are established.

## Checkpoint 2 identity/access schema

- `profiles`: one trigger-created profile per Auth user; users may update only their own display fields.
- `user_roles`: normalized global or organization-scoped roles; no direct client writes.
- `student_guardian_links`: explicit capability flags and active/inactive state; no direct client writes.
- `organizations` and `organization_memberships`: future-ready access scope; read only by members or administrators.
- `audit_log`: append-only safe summaries; readable only by administrators.
- `private.has_role` and `private.can_view_profile`: non-exposed security-definer policy helpers with empty `search_path`.
- `admin_set_user_role` and `admin_set_guardian_link`: authenticated but internally admin-authorized, audited mutation entrypoints.

All primary keys are UUIDs except the identity audit sequence. Enums and checks constrain status, role, scope, organization type, and relationship state. Foreign keys use deliberate cascade, restrict, or null behavior.

## Later domains

- Identity/access: profiles, user roles with scope, guardian links, organizations, memberships.
- Curriculum/content: programs, exams, courses, volumes, chapters, sections, topics, objectives, source documents/passages.
- Question bank: questions, choices, tags, versions, quality reviews, and reports.
- Study: sessions, session questions, attempts, per-question state, topic mastery, and readiness.
- Coaching/motivation: assignments, goals, achievements, private challenges, participants/results, and predefined encouragements.
- Operations: CSV import jobs, audit log, and feature flags.

Content and later-domain columns begin from the build plan but will be normalized and constrained during their scheduled checkpoint. Hierarchy links may be nullable where future exams omit a level.

## Secure grading transaction

The proposed `submit_answer` function accepts session, question, selected choice, response time, and optional confidence. It must authenticate the caller; verify student/session/question ownership; prevent duplicate or invalid submission; find the protected correct choice; insert the attempt with server-computed correctness; update session counters and mastery atomically; audit exceptional administrative actions; and return only post-submission feedback.

Clients cannot select answer-key columns or write `question_attempts.is_correct`. Practice tests defer returned explanations until session completion.

## Migration workflow

1. Develop against a local Supabase stack when available or a dedicated nonproduction CAP Mastery project.
2. Add ordered migration files and SQL tests in the same change.
3. Reset/replay migrations against a disposable database.
4. Generate types from the resulting schema.
5. Apply to shared environments only after review and record the result in `CHECKPOINT_LOG.md`.

Checkpoint 2 introduces three forward migrations: identity/access schema and triggers, RLS/grants, and audited admin functions. `supabase/seed.sql` intentionally contains no real accounts or credentials. SQL tests under `supabase/tests/` verify trigger behavior, RLS enablement, cross-user profile visibility, role visibility, and privilege escalation denial.

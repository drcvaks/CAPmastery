# Security and Permissions

## Security invariants

- Authorization is database-enforced; hidden routes are not a security control.
- Students access only their own sessions, attempts, mastery, goals, achievements, and permitted challenges.
- Guardians/coaches access only actively linked students and only capabilities granted on that relationship.
- Reviewers manage content but receive no implicit access to private student records.
- Squadron leaders have future-ready scoped membership and no default access to detailed answer history.
- Administrators use protected, audited workflows; ordinary users cannot assign roles.
- Students read approved active content only. Draft, rejected, archived, and answer-key data remain restricted.

## Client credential policy

The Expo client may receive only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. These identify a project but are not authorization; RLS is still mandatory. A service-role key, database password, Supabase access token, EAS token, or SMTP credential must never use the `EXPO_PUBLIC_` prefix, be bundled into the app, or be committed.

Server-side secrets, if later required, belong in Supabase Function secrets or approved CI/deployment secret stores with least privilege and rotation procedures.

## RLS workflow

- Enable RLS before granting client access to every exposed table.
- Define explicit policies by operation and role/scope; avoid broad authenticated-user policies.
- Review table grants and function execution grants as well as policies.
- Use schema-qualified references and a fixed safe `search_path` for security-definer functions.
- Revoke default public execution and grant only the specific callable functions required.
- Test cross-user, cross-family, content-state, role-escalation, and answer-key attacks using separate identities.

## Checkpoint 2 enforcement

- The dashboard Data API stays enabled, automatic table exposure stays disabled, and automatic RLS stays enabled as defense in depth.
- Migrations explicitly enable RLS and revoke `anon`/`authenticated` privileges before granting required reads and the four user-editable profile columns.
- Ordinary clients have no insert, update, or delete privilege on roles, relationships, organizations, memberships, or audit rows.
- A user reads their own profile/roles. An active guardian with `can_view_progress` reads the linked student's profile. An administrator reads identity/access and audit rows.
- Global administrator role changes and guardian-link changes use named functions that re-check `auth.uid()`, call a private role helper, validate input, use an empty `search_path`, and append safe audit summaries.
- The first administrator is bootstrapped once through the hosted SQL editor after account creation; subsequent changes use the audited function.
- The application requires a database role before entering a workspace. Student and admin route guards improve UX, while database policies remain authoritative against direct API calls.

## Answer protection

Question delivery uses a safe view/function or explicit field selection that cannot expose `question_choices.is_correct`. Grading is atomic and server-side. The client cannot submit `is_correct`, modify counters, or retrieve explanations/correct text early. Duplicate taps and replayed calls require idempotent or conflict-safe handling.

## Audit/privacy

Audit role changes, link changes, publishing, imports, question deactivation/version changes, and other sensitive administrative operations. Store safe summaries, not secrets or unnecessary private content. Minimize child data and define retention/export/deletion expectations before pilot data collection.

## Threats to test

ID substitution, guessed route/UUID access, changed role claims, direct REST queries, answer-table selection, duplicate answer submission, function calls on another session, draft-content reads, CSV injection/malformed input, unsafe logs, stale guardian links, and excessive admin grants.

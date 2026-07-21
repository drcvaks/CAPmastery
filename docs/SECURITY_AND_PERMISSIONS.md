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

Checkpoint 3 makes answer leakage structurally difficult: public questions and choices have no correctness fields. Answer keys, explanations, remediation, choice feedback, and source passages are private-schema tables with no `anon` or `authenticated` table grants. The student-safe `get_approved_questions` function is security-invoker and RLS-filtered; drafts and source-document records are hidden from students.

Reviewers write answer keys only through an authorized, audited function. Approval requires source authorization, an objective, valid choices, an answer/explanation, and an approving quality review. RLS prevents direct approval and direct edits to approved prompts/choices; a private trigger prevents changing an approved answer key. Server-side grading is intentionally deferred to Checkpoint 4.

## Checkpoint 4 grading enforcement

Authenticated clients receive select-only grants on their own sessions, session questions, and attempts. They cannot directly create an attempt, set `is_correct`, change a session score, or inspect another student's records. The security-definer study functions use an empty `search_path` and explicitly verify `auth.uid()`, student role, session ownership, question membership, selected-choice membership, active status, and input bounds.

Correct choices and teaching feedback are joined from private tables only after an owned attempt exists. A lost-response retry with the same choice returns the existing result without another attempt or count increment; a retry with a different choice is rejected.

Draft pilot delivery is package-scoped. Students cannot directly insert assignments and normal question RLS still returns no draft prompts. An audited administrator function assigns a package; the security-definer session function checks that assignment internally. It returns choices but withholds the private answer key and all teaching feedback until submission, exactly as it does for approved content.

## Audit/privacy

Audit role changes, link changes, publishing, imports, question deactivation/version changes, and other sensitive administrative operations. Store safe summaries, not secrets or unnecessary private content. Minimize child data and define retention/export/deletion expectations before pilot data collection.

## Threats to test

ID substitution, guessed route/UUID access, changed role claims, direct REST queries, answer-table selection, duplicate answer submission, function calls on another session, draft-content reads, CSV injection/malformed input, unsafe logs, stale guardian links, and excessive admin grants.

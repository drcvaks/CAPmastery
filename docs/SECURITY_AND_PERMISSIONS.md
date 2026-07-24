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

CSV import and review use reviewer-only security-definer functions with an explicit search path. Authenticated clients have no direct insert/update/delete grant on import jobs, questions, choices, private answer data, or snapshots. Import is draft-only and whole-payload validation prevents partial question writes for reported row errors. Students continue to receive only approved active projections, never draft content or answer keys. Administrator and `content_reviewer` access is checked in the database and every import, correction, approval, requested change, and rejection is audited.

An approving review may activate the question's already-linked objective, primary concept, and exam-scoped family inside the same transaction. The helper rechecks reviewer authorization and relationship consistency, is not client-executable, and records `question.learning_metadata_activated`. Failed approval rolls the metadata activation and quality review back together.

## Checkpoint 4 grading enforcement

Authenticated clients receive select-only grants on their own sessions, session questions, and attempts. They cannot directly create an attempt, set `is_correct`, change a session score, or inspect another student's records. The security-definer study functions use an empty `search_path` and explicitly verify `auth.uid()`, student role, session ownership, question membership, selected-choice membership, active status, and input bounds.

Correct choices and teaching feedback are joined from private tables only after an owned attempt exists. A lost-response retry with the same choice returns the existing result without another attempt or count increment; a retry with a different choice is rejected.

Draft pilot delivery is package-scoped. Students cannot directly insert assignments and normal question RLS still returns no draft prompts. An audited administrator function assigns a package; the security-definer session function checks that assignment internally. It returns choices but withholds the private answer key and all teaching feedback until submission, exactly as it does for approved content.

Short explanations, memory aids, internal visual briefs, and the visual-asset registry live in the private schema with no client table grants. Owned session delivery returns short explanations and memory aids only after an attempt. It never returns `visual_brief`; visual key/caption/alt/storage metadata remain null unless a separately registered asset has approved status. The client also hides the visual control if a signed image cannot be resolved, preventing broken-image disclosure.

## Checkpoint 5 mastery enforcement

Question state and topic mastery are private student records in API-exposed tables with RLS enabled. Authenticated users receive select-only access filtered to `student_id = auth.uid()`; they cannot insert, update, delete, forge scores, or inspect another student's rows. Reviewers receive no student-mastery access by role.

The security-definer grading transaction, not the client, supplies correctness to the mastery updater. The updater has an empty `search_path`, accepts the already-authorized student/question/result, clamps all score and interval ranges, and runs only for a newly inserted attempt. Adaptive session creation reads only the caller's state and continues to enforce approved-content or exact private-pilot-package eligibility.

## Audit/privacy

Audit role changes, link changes, publishing, imports, question deactivation/version changes, and other sensitive administrative operations. Store safe summaries, not secrets or unnecessary private content. Minimize child data and define retention/export/deletion expectations before pilot data collection.

## Threats to test

ID substitution, guessed route/UUID access, changed role claims, direct REST queries, answer-table selection, duplicate answer submission, function calls on another session, draft-content reads, CSV injection/malformed input, unsafe logs, stale guardian links, and excessive admin grants.
## Checkpoint 6 progress access

- A student can request only their own progress.
- A parent or coach can discover and request only students connected by an active guardian link with `can_view_progress = true`.
- Possessing an administrator or reviewer role does not implicitly grant access to student learning data.
- Every progress RPC authenticates the caller, validates the requested UUID and range, uses an empty `search_path`, and returns a student-safe projection. Direct mastery and attempt table policies remain unchanged.
- Client route guards and student tabs improve navigation only; the database authorization helper is the security boundary.

## Checkpoint 9 challenge and achievement access

- Only a parent/coach may create a challenge, and both selected students must have active links to that creator with `can_manage_challenges = true`.
- The database chooses mutually eligible questions with protected answer keys, snapshots one set, and creates a separately owned session for each participant. A student cannot select the other participant's session or attempts.
- Private pilot drafts may also enter a challenge only when both selected students hold the exact same `pilot_package_assignments` package. The database—not the parent client—computes this intersection. One student's private assignment never grants the other student access.
- The creator and two participants can read the private challenge summary. Unrelated students, reviewers, and administrators receive no implicit access.
- Challenge result rows are RLS-hidden until the challenge is complete. The read projection also nulls scores until both students finish, preventing an early score leak.
- Authenticated clients have no direct write grant on achievements, awards, challenges, participants, sets, results, or encouragements. Narrow security-definer functions use an empty `search_path` and explicit identity/link checks.
- Encouragement accepts an enum value only and has no free-text field. Challenge results contain no rank, winner, loser, or public-lowest-score field.
- Linked adults may read a child's achievement catalog only through the existing progress-view relationship. Awarding is idempotent and derived from server-owned sessions, attempts, mastery, and challenge results.
- Learning-history resets are exceptional admin-only operations, not a parent or
  student capability. The protected function requires explicit confirmation and a
  10–240 character reason, rejects non-student targets, locks the target profile,
  blocks any student participating in a shared challenge, and audits the counts
  removed. It preserves identity, authorization, family links, and package access.

## Checkpoint 7 practice-test enforcement

- Blueprint configuration is authenticated-read-only; clients cannot insert or alter blueprint rules.
- Every practice RPC verifies the authenticated student and session owner. Another student cannot read, pause, complete, or retrieve results for the session.
- The server enforces blueprint balance, time expiry, and pause policy. Client countdowns and hidden controls are usability aids only.
- Correctness, correct-choice IDs, explanations, remediation, memory support, and aggregate scores remain null during an active test, including immediately after answer submission.
- Completion releases feedback only for answered questions. Practice attempts cannot write normal mastery state and are excluded from normal recent-accuracy/trend calculations.

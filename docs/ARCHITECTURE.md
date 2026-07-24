# Proposed Architecture

## Decision summary

Use Expo SDK 57 and Expo Router for Android and responsive web, with React Native 0.86, React 19.2, and strict TypeScript 6. CAP Mastery will use a separate Supabase backend beginning in Checkpoint 2. Organize by domain feature, keep route files thin, isolate server state and database calls, and keep adaptive algorithms pure.

## Layers

1. `app/`: thin route groups and layouts. `(auth)` owns sign-in and recovery screens; `(student)` and `(admin)` use role-aware guards.
2. `components/`: accessible shared primitives and domain-neutral compositions.
3. `features/`: auth, content, study, adaptive, progress, challenges, and admin modules. Each feature owns UI, hooks, schemas, and pure logic that are specific to it.
4. `services/`: typed use-case-oriented calls such as question delivery, session creation, secure submission, mastery reads, and challenges.
5. `lib/`: Supabase client configuration, validation, constants, and utilities.
6. Supabase/PostgreSQL: source of truth for identity, authorization, content, sessions, grading, mastery state, and audit records.

## State strategy

- Supabase Auth session: `AuthProvider` restores the session, loads the RLS-filtered profile/roles, handles recovery deep links, and manages native foreground refresh. AsyncStorage persists native sessions; web uses the browser storage adapter.
- Same-user signed-in/token-refresh events update the token without clearing the already-authorized access context. This keeps the active Expo Router navigator and study route mounted when web focus or native foregrounding refreshes authentication.
- Server state: TanStack Query is approved for caching, invalidation, loading, and retry when Supabase integration begins. It is not installed before it is used.
- Form state: React Hook Form plus Zod.
- Local transient UI: component state or narrowly scoped context.
- Adaptive calculations: pure deterministic functions with injected time/randomness where necessary for deterministic tests.

Do not recreate mySCP's single global provider that loads unrelated tables at startup. Fetch per route/use case and invalidate narrow query keys after mutations.

## Backend boundary

The lazily created typed client uses only the Supabase URL and publishable key. Invalid or absent configuration produces a setup state rather than an import-time crash. Queries live in services, and RLS protects every exposed relation. Sensitive workflows use carefully scoped PostgreSQL functions with explicit authorization, empty `search_path`, minimal grants, validation, and audit entries.

Question delivery uses the typed `contentService`, narrow TanStack Query keys, and the RLS-filtered `get_approved_questions` projection. Correctness and teaching feedback are private-schema data and are not modeled in the client delivery type. The future `submit_answer` validates ownership and membership in the session, grades internally, writes the attempt and derived state atomically, and only then returns feedback.

## Navigation

- `(auth)`: email/password sign-in, reset request, and recovery password update.
- `(student)`: authenticated users with the global `student` role; Home and Progress consume the protected progress projection.
- The Study tab owns a nested stack containing the catalog and active session. Switching to Progress/Home preserves that stack, so returning to Study resumes the same question rather than targeting the catalog or creating another session.
- `(parent)`: authenticated users with a global `parent` or `coach` role; the family dashboard can select only students returned by the linked-progress projection.
- `(admin)`: authenticated users with the global `admin` role; administration features remain scheduled for later checkpoints.
- Every authenticated `AppScreen` includes a role-aware workspace switcher. It renders as a left rail on wide screens and a compact top row on smaller screens, and offers only Student, Family, or Admin destinations authorized by the loaded database roles. Route-group guards still independently recheck each destination.

The root restores the session and routes to `/admin`, `/home`, or `/unauthorized`. Direct URLs are checked by route-group guards. Client routing remains a usability boundary; RLS, revoked write grants, and protected functions remain authoritative.

## UI foundation

The shell uses a clean, encouraging navy/red visual direction without official CAP marks. `AppScreen`, `AppCard`, `AppLinkButton`, `RouteErrorBoundary`, shared theme tokens, safe-area handling, and responsive content widths form the initial component foundation. Source imports are explicit relative paths because the current Expo ESLint resolver does not reliably share TypeScript 6 path aliases.

## Repository and delivery

- `main` stays releasable and protected once a remote exists.
- One short-lived branch per checkpoint or focused change: `checkpoint/1-expo-skeleton`, `feature/...`, `fix/...`, `docs/...`.
- Use reviewable commits by concern; never mix generated migration changes with unrelated UI edits.
- Tag validated checkpoints as `checkpoint-0`, `checkpoint-1`, etc. after owner review.
- Migrations are forward-only in shared environments; corrective migrations replace edited history after application.
- No remote, commit, tag, or external deployment is created without the owner's normal repository workflow/authorization.

## Checkpoint 2 boundary

Identity, scoped roles, guardian links, future-ready organizations, audit logging, authentication, recovery, and route guards are in scope. Content, questions, study behavior, server-side grading, mastery, AI, and production infrastructure remain out of scope.

## Checkpoint 3 boundary

The content hierarchy, concepts/relationships, private tutor notes, question families/reinforcement metadata, protected question bank, catalog seed, approval gate, student-safe retrieval service, query hooks, and read-only Study catalog are implemented. Real CAP source ingestion and sample questions require owner authorization. Sessions, answer submission, grading, mastery, administrative editing/import UI, AI, Storage, and production infrastructure remain out of scope.

## Checkpoint 4 boundary

Basic owned study sessions use a protected creation function that snapshots an ordered set of approved question IDs and versions. A typed service and TanStack Query hooks deliver session prompts, retain selections across retry errors, and render post-answer feedback and final results. `submit_answer` accepts only the session-question ID, selected choice, response time, and optional confidence; PostgreSQL validates ownership and membership, computes correctness from the private answer key, records one attempt, and updates session counts atomically. Same-choice retries are idempotent, while changed duplicate answers are rejected.

Post-answer presentation is centralized in `AnswerResultCard`. A pure formatter removes substantially overlapping feedback and limits the default display to about 35 words. Correct answers show only the main explanation. Incorrect answers lead with selected-choice feedback and add a short correct-concept reminder only when needed. Remediation is collapsed behind an accessible help control, and the source remains visible in secondary text.

Reviewed `short_explanation` now takes precedence for default feedback. Memory aids and fuller explanation/remediation use independent accessible disclosure controls. Visual rendering requires both approved server metadata and a successfully resolved short-lived image URL; otherwise no visual control is shown. Repeated-concept escalation remains deferred to mastery/adaptive work rather than being inferred from component-local history.

## Checkpoint 5 boundary

Every newly recorded answer now updates per-question spaced-review state and topic mastery inside the same protected PostgreSQL transaction that grades the response. Same-choice retries return the existing attempt without applying mastery twice. The formulas are mirrored in the pure `features/adaptive/engine.ts` module with injected time and deterministic seeded tie-breaking so coefficients, boundaries, decay, allocation, and sparse-bank behavior can be tested without network state.

Checkpoint 8 keeps CSV parsing and early validation in the pure `features/admin/csv.ts` boundary, while authoritative validation, import, editing, and approval remain in reviewer-only PostgreSQL functions. The responsive admin route is a thin composition over typed services and TanStack Query hooks. An approved edit is snapshotted before the current question advances to a new draft version, so existing attempts continue to identify the exact version they presented.

Session creation classifies eligible questions as `weak_topic`, `recently_missed`, `developing_topic`, `retention_check`, or `new_or_harder`. A ten-question session targets 40/20/20/10/10, fills exhausted buckets deterministically, prioritizes less-seen/less-recent wording, and never duplicates a question within a session. An incorrect response marks an available later question on the same objective as `same_session_remediation` without changing the answer or exposing content.

Checkpoint 5 does not add the Checkpoint 6 Progress/readiness UI, practice-test mode, automatic visual-support escalation, or tunable remote configuration. The initial coefficients are pilot defaults and must not be treated as validated from two students.

## Checkpoint 6 boundary

Progress reads use four narrow security-definer projections: available students, dashboard summary, topic detail, and daily trends. The database rechecks self-or-active-guardian authorization on every call; selecting a different UUID in the client cannot expand access. Administrators and reviewers receive no implicit access to private student progress.

Readiness is a study estimate derived from coverage, recent accuracy, mastery, retention, and weak-topic count. Evidence caps prevent a high score from a small sample. The client mirrors the formula only for deterministic unit tests; PostgreSQL is authoritative for displayed data. Home shows a compact summary, Progress shows topic/trend detail, and the parent/coach route switches among explicitly linked students. Practice tests and official certification predictions remain outside this checkpoint.

## Checkpoint 7 boundary

Practice tests reuse the owned study-session infrastructure but have an explicit `practice_test` mode and immutable blueprint, timing, and pause snapshots. A thin launcher calls a typed service; the shared session component switches to neutral answer acknowledgements while the test is active and releases scoring, explanations, memory support, and topic analysis only after server-recorded completion.

The initial Leadership Chapter 1 blueprint is an unofficial pilot configuration: ten questions, optional 15-minute timer, no pause, difficulty targets 4 easy/4 medium/2 hard, and cognitive targets 4 recall/3 understanding/1 application/2 scenario. It is configuration data, not a claim about the official CAP exam. An approved official blueprint can replace it without changing the session model.

Normal study attempts continue to drive question state, topic mastery, recent accuracy, and ordinary trends. Practice attempts do not mutate those normal-study records. Completed practice scores contribute a distinct readiness component, while all attempts can contribute to coverage. AI, challenge mode, production deployment, and official-result claims remain outside this checkpoint.

## Checkpoint 9 boundary

Private family challenges reuse the owned study-session infrastructure with an explicit `challenge` mode. The parent/coach creates one immutable approved-question snapshot, and the database copies the same question IDs, versions, and order into one separately owned session per student. Active challenge submissions are graded on the server but return neutral acknowledgements; results unlock together only after both sessions finish.

`features/challenges/` owns schemas, pure positive scoring, TanStack Query hooks, and the shared parent/student workspace. Thin routes expose a student Challenge tab and a linked-parent Family Challenge screen. Challenge scoring recognizes completion, accuracy, and improvement without winner, rank, or lowest-score concepts. Achievements are derived from server evidence and include first steps, persistence, steady effort, topic mastery, comeback, improvement, and helping the team.

Challenge visibility does not broaden ordinary study access. Participants still own only their own session and attempt history. The creator and two participants can see the challenge summary, while unrelated identities cannot. Predefined reactions replace open messaging. AI, public competition, assignments/goals, notifications, production deployment, and broader challenge formats remain outside this checkpoint.

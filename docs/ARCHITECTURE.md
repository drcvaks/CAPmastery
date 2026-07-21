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
- `(student)`: authenticated users with the global `student` role; tabbed product screens remain placeholders for later checkpoints.
- `(admin)`: authenticated users with the global `admin` role; administration features remain scheduled for later checkpoints.

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

No mastery update, adaptive selection, spaced review, practice-test timing, or delayed practice-test feedback is implemented; those remain later checkpoints.

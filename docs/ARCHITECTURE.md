# Proposed Architecture

## Decision summary

Use Expo SDK 57 and Expo Router for Android and responsive web, with React Native 0.86, React 19.2, and strict TypeScript 6. CAP Mastery will use a separate Supabase backend beginning in Checkpoint 2. Organize by domain feature, keep route files thin, isolate server state and database calls, and keep adaptive algorithms pure.

## Layers

1. `app/`: route groups and layouts only. `(auth)`, `(student)`, and `(admin)` shells exist; authentication/authorization arrives later.
2. `components/`: accessible shared primitives and domain-neutral compositions.
3. `features/`: auth, content, study, adaptive, progress, challenges, and admin modules. Each feature owns UI, hooks, schemas, and pure logic that are specific to it.
4. `services/`: typed use-case-oriented calls such as question delivery, session creation, secure submission, mastery reads, and challenges.
5. `lib/`: Supabase client configuration, validation, constants, and utilities.
6. Supabase/PostgreSQL: source of truth for identity, authorization, content, sessions, grading, mastery state, and audit records.

## State strategy

- Supabase Auth session: a small auth provider with native session persistence and lifecycle refresh.
- Server state: TanStack Query is approved for caching, invalidation, loading, and retry when Supabase integration begins. It is not installed before it is used.
- Form state: React Hook Form plus Zod.
- Local transient UI: component state or narrowly scoped context.
- Adaptive calculations: pure deterministic functions with injected time/randomness where necessary for deterministic tests.

Do not recreate mySCP's single global provider that loads unrelated tables at startup. Fetch per route/use case and invalidate narrow query keys after mutations.

## Backend boundary

The public client uses only the Supabase URL and publishable key. RLS protects every exposed relation. Sensitive workflows use carefully scoped PostgreSQL functions or Edge Functions with explicit authorization, safe `search_path`, minimal grants, validation, idempotency where needed, and audit entries.

Question delivery must return safe question/choice fields without `is_correct`. `submit_answer` validates ownership and membership in the session, grades internally, writes the attempt and derived state atomically, and only then returns feedback.

## Navigation

- `(auth)`: sign-in placeholder now; recovery/reset later.
- `(student)`: tabbed home, study, and progress placeholders now; session/result, practice test, achievements, challenges, and settings later.
- `(admin)`: responsive administration placeholder now; parent/coach and authorized reviewer/admin screens later.

The landing page exposes preview links only while no backend exists. Checkpoint 2 replaces preview access with session restoration and role-aware routing. Client routing remains a usability boundary; RLS and protected functions remain authoritative.

## UI foundation

The shell uses a clean, encouraging navy/red visual direction without official CAP marks. `AppScreen`, `AppCard`, `AppLinkButton`, `RouteErrorBoundary`, shared theme tokens, safe-area handling, and responsive content widths form the initial component foundation. Source imports are explicit relative paths because the current Expo ESLint resolver does not reliably share TypeScript 6 path aliases.

## Repository and delivery

- `main` stays releasable and protected once a remote exists.
- One short-lived branch per checkpoint or focused change: `checkpoint/1-expo-skeleton`, `feature/...`, `fix/...`, `docs/...`.
- Use reviewable commits by concern; never mix generated migration changes with unrelated UI edits.
- Tag validated checkpoints as `checkpoint-0`, `checkpoint-1`, etc. after owner review.
- Migrations are forward-only in shared environments; corrective migrations replace edited history after application.
- No remote, commit, tag, or external deployment is created without the owner's normal repository workflow/authorization.

## Checkpoint 1 boundary

The Expo shell, navigation, quality tooling, and placeholder tests exist. There is no Supabase dependency, client, project, schema, authentication implementation, product feature, AI integration, or production database.

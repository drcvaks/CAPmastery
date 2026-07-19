# Proposed Architecture

## Decision summary

Use an Expo Router monorepository for Android and responsive web, with strict TypeScript and a separate Supabase backend. Organize by domain feature, keep route files thin, isolate server state and database calls, and keep adaptive algorithms pure.

## Layers

1. `app/`: route groups and layouts only. Planned groups are `(auth)`, `(student)`, and `(admin)`.
2. `components/`: accessible shared primitives and domain-neutral compositions.
3. `features/`: auth, content, study, adaptive, progress, challenges, and admin modules. Each feature owns UI, hooks, schemas, and pure logic that are specific to it.
4. `services/`: typed use-case-oriented calls such as question delivery, session creation, secure submission, mastery reads, and challenges.
5. `lib/`: Supabase client configuration, validation, constants, and utilities.
6. Supabase/PostgreSQL: source of truth for identity, authorization, content, sessions, grading, mastery state, and audit records.

## State strategy

- Supabase Auth session: a small auth provider with native session persistence and lifecycle refresh.
- Server state: TanStack Query is proposed for caching, invalidation, loading, and retry; confirm compatibility at Checkpoint 1.
- Form state: React Hook Form plus Zod.
- Local transient UI: component state or narrowly scoped context.
- Adaptive calculations: pure deterministic functions with injected time/randomness where necessary for deterministic tests.

Do not recreate mySCP's single global provider that loads unrelated tables at startup. Fetch per route/use case and invalidate narrow query keys after mutations.

## Backend boundary

The public client uses only the Supabase URL and publishable key. RLS protects every exposed relation. Sensitive workflows use carefully scoped PostgreSQL functions or Edge Functions with explicit authorization, safe `search_path`, minimal grants, validation, idempotency where needed, and audit entries.

Question delivery must return safe question/choice fields without `is_correct`. `submit_answer` validates ownership and membership in the session, grades internally, writes the attempt and derived state atomically, and only then returns feedback.

## Planned navigation

- `(auth)`: sign in, recovery, reset.
- `(student)`: home, study setup/session/result, practice test, progress, achievements, challenges, settings.
- `(admin)`: parent/coach views plus authorized reviewer/admin screens. Role and scope determine availability, but RLS/function checks remain authoritative.

## Repository and delivery

- `main` stays releasable and protected once a remote exists.
- One short-lived branch per checkpoint or focused change: `checkpoint/1-expo-skeleton`, `feature/...`, `fix/...`, `docs/...`.
- Use reviewable commits by concern; never mix generated migration changes with unrelated UI edits.
- Tag validated checkpoints as `checkpoint-0`, `checkpoint-1`, etc. after owner review.
- Migrations are forward-only in shared environments; corrective migrations replace edited history after application.
- No remote, commit, tag, or external deployment is created without the owner's normal repository workflow/authorization.

## Checkpoint 0 boundary

Only structure and documentation exist. No dependency selection has been installed, no Expo application has been generated, and no Supabase project or schema has been created.

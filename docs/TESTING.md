# Testing Strategy

## Checkpoint gates

From Checkpoint 1 onward, every checkpoint runs the configured TypeScript check, lint, unit/component/integration tests, and an Expo startup/config validation. Database checkpoints also replay migrations and run SQL/RLS tests. Report the exact command, exit code, counts, and any skipped/non-applicable check.

## Configured tools

- TypeScript 6 compiler in strict mode with unchecked indexed access.
- Expo ESLint flat configuration plus Prettier enforcement.
- Jest 29 with the official `jest-expo` preset.
- React Native Testing Library 14 and Expo Router testing utilities.
- Pure unit tests for algorithms and validators.
- Supabase CLI/local PostgreSQL tests for migrations, functions, and RLS when introduced.

## Coverage priorities

Unit: mastery, spaced dates, adaptive selection, readiness, practice blueprints, CSV validation, duplicate detection, role helpers.

Integration: session lifecycle, answer submission, linked-parent access, question approval, challenge lifecycle, and unauthorized content access.

RLS: Student A versus Student B, linked versus unrelated adult, reviewer versus private records, role escalation, draft/deactivated content, answer-key reads, and public-client calls to server-only operations.

Manual: Android sizes, responsive web admin, slow/offline transitions, background/resume, expired auth, duplicate taps, submission network loss, empty bank, missing citation, practice timeout, and partially completed challenge.

## Checkpoint 0 validation

No `package.json`, TypeScript source, Expo application, tests, migrations, or backend exists, so TypeScript, lint, unit tests, Expo startup, and RLS tests are not applicable. Checkpoint 0 instead validates documentation completeness, placeholder structure, secret scanning, Git separation, local tool versions, and mySCP unchanged state.

## Current commands

- `npm run check`: typecheck, lint, tests, and formatting check.
- `npm run validate:expo`: resolve and print public Expo configuration.
- `npx expo-doctor`: dependency/configuration compatibility checks.
- `npm run export:web`: production web bundle to ignored `dist/web`.
- `npm run export:android`: production Android/Hermes bundle to ignored `dist/android`.
- `npm run db:reset`: replay migrations and the intentionally empty development seed against the local stack.
- `npm run db:test`: execute pgTAP migration/RLS tests against the local stack.
- `npm run db:test:linked`: run the same pgTAP transaction directly against the linked development database when Docker is unavailable; supply `CAP_MASTERY_DB_PASSWORD` only in the invoking process.
- `npm run db:lint`: run PostgreSQL function/schema linting against the local stack.
- `npm run types:database`: regenerate database types from a successfully replayed local schema.

Checkpoint 1 includes a component contract test and a Router navigation test. Browser smoke testing verifies landing, student, and admin routes. A production bundle validates Metro/Hermes compilation but does not replace a later physical-device test.

Checkpoint 2 adds environment-validation, password-validation, and role-routing tests. `supabase/tests/identity_access_rls.test.sql` contains pgTAP coverage for all six API tables, profile creation, self/linked/admin reads, and direct/function-based role escalation denial. The linked runner executes the file in a rolled-back transaction and never persists its synthetic users.

Checkpoint 3 adds safe-projection parsing tests and `content_permissions.test.sql`. The SQL suite checks the content tables/RLS, private-table privilege denial, reviewer-only answer/approval entrypoints, draft hiding, safe approved-question delivery, self-owned reports, and reviewer visibility. The linked runner now discovers every `*.test.sql` file, validates each declared TAP plan, and reports per-file plus aggregate results.

Physical Expo Go on the owner's Android device is currently incompatible with this SDK 57 project. The owner chose to retain SDK 57. Web and Android production exports remain required compile gates, but physical interaction awaits a compatible Expo Go release or a later development-build decision.

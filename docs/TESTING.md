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

Checkpoint 4 adds pure parsing/error-message tests and `study_sessions.test.sql`. The SQL suite creates ten synthetic approved questions inside a transaction, completes a 10-question session, verifies correct and incorrect server grading, checks idempotent retry and changed-answer rejection, confirms feedback is withheld before submission, proves direct correctness/score writes are denied, and tests cross-student session/attempt isolation. All synthetic study data rolls back.

The Chapter 1 sample adds actual-file parser/validator tests and `pilot_package_access.test.sql`. Tests cover the ten stable unique IDs, all four choices and explanations, Windows-1252-to-Unicode punctuation conversion, page ranges, draft enforcement, 14 out-of-sample reinforcement warnings, RLS on assignments, admin-only assignment, unassigned-student denial, draft hiding through normal RLS, assigned session creation, and pre-submission answer protection.

`npm run content:import:pilot10` imports only `Content/LTL_V1_Chapter_1_Pilot_10_Questions_Complete_Learning_Support.csv` by default. `npm run content:import:adaptive30` explicitly imports and validates the supplied 30-row adaptive bank. Both require the database password in process-only `CAP_MASTERY_DB_PASSWORD`, validate every row before opening a transaction, and print inserted/updated/skipped/failed/warning counts.

The post-Checkpoint 4 feedback refinement adds pure tests for correct/incorrect selection, overlap suppression, and the 35-word default budget, plus a component test proving remediation remains hidden until the accessible “Need more help?” control is activated.

The complete learning-support sample updates actual-file validation for `short_explanation`, display version, memory aids, and coherent visual metadata. Component tests verify reviewed short feedback is the default, Memory trick and Explain more remain collapsed, and Show visual is absent without an approved asset. `learning_support.test.sql` checks private storage and privilege denial; the expanded study suite checks pre-answer withholding, post-answer memory delivery, and missing-asset suppression.

Checkpoint 5 adds pure deterministic tests for difficulty/cognitive/confidence coefficients, score clamping, repeated-miss status, spaced intervals, injected-time retention decay, exact bucket allocation, weakness frequency, seeded replay, recent duplicate avoidance, exhausted-bucket fallback, and sparse-bank errors. `adaptive_mastery.test.sql` verifies both mastery tables and RLS, server-only writes, the 40/20/20/10/10 composition, unique session questions, atomic mastery updates, next-day miss scheduling, idempotent retry, same-session related remediation, repeated misses, and cross-student isolation.

Checkpoint 6 adds pure readiness formula/cap tests and shared dashboard component tests for student metrics, weak-topic guidance, trends, the unofficial disclaimer, compact Home behavior, and switching between two linked children. `progress_readiness.test.sql` verifies all four progress RPCs, low-evidence caps, topic/trend output, parent access to two linked students, unrelated-user denial, lack of direct mastery-table access, and trend-range validation.

The adaptive-bank file tests verify 30 unique draft rows, five batches of six, the documented 11/14/5 difficulty distribution, all six supplied cognitive classifications, 20 intentionally blank optional support records, ten complete support records, safe recognition/analysis normalization, and exactly 22 out-of-bank reinforcement warnings.

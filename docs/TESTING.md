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

Checkpoint 8 adds pure parser/validator tests and reviewer-workspace component tests. `content_import_review.test.sql` covers grants, RLS, reviewer authorization, duplicate preview, all-or-nothing invalid imports, draft-only delivery, correction and review decisions, complete approved snapshots, version increments, and preservation of an attempt's original `question_version`. The linked aggregate is expected to increase from 240 to 290 assertions after the owner-run database gate.

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

Checkpoint 7 adds deterministic blueprint unit tests, active/completed practice-session component tests, delayed-feedback schema tests, and `practice_tests.test.sql`. The SQL suite checks blueprint/RLS grants, exact strata and topic balance, duplicate avoidance, active-test answer-key and score withholding, server timing/pause rules, cross-student denial, completion release, topic analysis, mastery isolation, ordinary-trend isolation, readiness integration, and sparse-stratum failure.

The adaptive-bank file tests verify 30 unique draft rows, five batches of six, the documented 11/14/5 difficulty distribution, all six supplied cognitive classifications, 20 intentionally blank optional support records, ten complete support records, safe recognition/analysis normalization, and exactly 22 out-of-bank reinforcement warnings.

The Volume 2 Chapter 4 file tests verify the UTF-8 BOM/tab format, 75 unique draft
rows, all four choices and aligned feedback, complete support metadata, 75 unique
visual keys, preserved mode/style classifications, safe misconception mapping, and
129 internal pipe-delimited reinforcement links. They also make the supplied
58-of-75 B answer-key imbalance visible without altering content.

The Volume 2 Chapter 5 file tests verify the UTF-8 BOM/tab format, 75 unique draft
rows, four distinct choices with aligned feedback, complete support metadata, 75
unique visual keys, supplied difficulty/cognitive/mode/style distributions,
comma-delimited non-contiguous citations, exact visible source text, and all 20
internal comma-delimited reinforcement links. They also record the supplied
A/B/C/D answer distribution without changing it.

The Volume 2 Chapter 6 file tests verify the UTF-8 BOM/tab format, 75 unique draft
rows, four distinct choices with aligned feedback, complete learning support, 75
unique visual keys, supplied difficulty/cognitive/mode/style distributions, and
all 225 internal reinforcement links. They preserve the A 25/B 39/C 11/D 0 answer
positions and require the missing-D quality warning.

The Volume 2 Chapter 7 file tests verify the UTF-8 BOM/tab format, 75 unique draft
rows, four distinct choices with aligned feedback, complete learning support, 75
unique visual keys, supplied difficulty/cognitive/mode/style distributions, and
all 150 internal reinforcement links. They preserve the A 46/B 25/C 3/D 1 answer
positions and require the dominant-A quality warning.
They also prove that comma-bearing Grid Theory identifiers and two family keys
longer than 100 characters map to valid, deterministic, collision-free database
keys while their supplied display values remain available.

The Volume 2 Chapter 8 file tests verify the UTF-8 BOM/tab format, 75 unique draft
rows, four distinct choices with aligned feedback, complete learning support, 75
unique visual keys, supplied difficulty/cognitive/mode/style distributions, all
150 internal reinforcement links, valid collision-free metadata keys, and the
balanced A 20/B 20/C 17/D 18 answer positions.

Checkpoint 9 adds pure positive-scoring and challenge-projection tests plus shared-session component coverage for neutral active-challenge feedback. `achievements_challenges.test.sql` declares 67 transaction-only assertions covering all seven tables and RLS, narrow policy-helper execution, client write denial, linked-student discovery, exactly-two validation, approved-or-mutually-assigned-package selection, one-student package leak prevention, identical question/version/order snapshots, separate session ownership, unrelated-family denial, predefined reactions, delayed score reveal, capped positive points, absence of rank/winner fields, and automatic team, improvement, first-session, and 25-answer persistence awards.

`admin_learning_reset.test.sql` declares 26 transaction-only assertions. It covers
admin-only execution, preview counts, explicit confirmation, shared-challenge
blocking, session/attempt/mastery/state/achievement deletion, preservation of
another student's history, and preservation of the target's role, family link, and
pilot-package assignment. It also verifies the reset audit record.

The full Jest process currently needs `--forceExit` because an existing test handle remains open after all suites report. The result summary remains authoritative; diagnosing that handle is tracked as Checkpoint 10 test-harness hardening rather than changing application behavior in Checkpoint 9.

The Mitchell 500-row actual-file tests verify the BOM/tab format, 500 unique IDs,
100 rows and 60 eligible rows per chapter, 25 new textbook-grounded rows per
chapter, complete choices/feedback/support/classification, and field-for-field
preservation of the five earlier 75-question files. `mitchell_full_exam.test.sql`
declares 34 transaction-only assertions covering the new columns/functions and
grants, secure 50-question creation, variable chapter distribution within 7–13,
unique families, objective spacing, frozen membership, owner-only persistent
flags, completion, objective-level weak-area results, and latest-test chapter
analysis access for the student, an authorized parent, and an unrelated student.
Shared-session component tests also cover prominent flag visibility, automatic
advance after answer save, results ordering, chapter study actions, wrong-only
review, and the Finish review exit. Progress component coverage verifies the
latest full-test card and chapter action while keeping compact home output small.

The Aerospace Module 1 actual-file suite verifies the BOM/tab format, 100 unique
draft rows, controlled defaults for specialized missing headers, 60/24/16 chapter
distribution, four choices with aligned feedback, complete learning support, 100
unique visual keys, 75 final-exam-eligible rows, 50 objective/concept/family
groups, all 100 internal sibling links, and supplied A 27/B 19/C 23/D 31 answer
positions. It also verifies that `medium_hard` normalizes to the supported `hard`
database enum without changing the richer classification fields. The content
import/review SQL suite adds schema and constraint assertions for module number
and Aerospace provenance. The Module 1 import gate passed all 23 Jest suites and
125/125 tests, and the owner-linked SQL suite passed 431/431 after migration 039.

Aerospace catalog unit coverage verifies module ordering, chapter ordering,
human-readable Module/Chapter labels, and recognition of both obsolete catalog
placeholder codes. The content import/review SQL suite also verifies migration
040 archives both placeholder rows.
The catalog follow-up passes 25 Jest suites and 128/128 tests; migration 040 adds
one linked SQL assertion, and the owner-linked post-push aggregate passed 432/432.
The pilot-package and study-session SQL suites explicitly activate their reused
seed topic inside their rolled-back transactions. This keeps fixtures independent
of the production catalog status while leaving the obsolete labels archived.

Access-aware catalog tests cover unassigned denial, exact private-package access,
another-student isolation, the no-argument projection contract, exam filtering,
and the ten-question session threshold. Migration 041 expands the pilot-package
plan from 19 to 23 and the expected linked aggregate from 432 to 436.
The access-aware catalog local gate passes all 25 Jest suites and 130/130 tests,
strict TypeScript, Expo ESLint, formatting, Expo Doctor 20/20, and web export.
Linked private-catalog assertions use each student's approved-content baseline so
persistent approved banks do not create false failures; the assigned draft must
increase only the assigned student's topic count by exactly one.
The owner-linked migration 041 regression run passed all suites at 436/436.

`study_sessions.test.sql` also verifies the narrow session-context function exists,
is executable by authenticated users, returns a topic label for every question to
the owning student, and rejects another student. Component coverage confirms the
chapter/title/topic banner and the signed-in student's page-header greeting.

Mitchell full-exam SQL coverage verifies the active 50-question blueprint uses a
3,600-second timer and permits pausing. Shared-session component coverage verifies
the active exam's visible timer and Pause control, hidden chapter cue,
Backâ€“Flagâ€“Next ordering, question-50-only completion action, and restored chapter
label during review.

Migration 042 expands `mitchell_full_exam.test.sql` from 36 to 56 assertions. It
checks the review columns and function grants, automatic tracking on new full
tests, pre-completion denial, wrong-answer counting, cross-student denial,
idempotent marking, aggregate-only parent visibility, 0-to-100 percent progress,
and explicit unavailability for historical sessions. Component coverage verifies that review
completion is saved on Finish review and that the latest Progress card displays
the reviewed/total percentage.
The local feature gate passes all 25 Jest suites and 130/130 tests, TypeScript,
Expo ESLint, formatting, public Expo configuration, a 1,582-module web export,
and a 1,700-module Android export. Expo Doctor passed 18 local checks; its Expo
schema and React Native Directory checks could not complete because the validation
service DNS endpoints were unavailable during the run.
The first linked run after migration 042 passed 49/56 Mitchell assertions. Its
incorrect-answer fixture had attempted to read a private draft choice through
student RLS and therefore supplied `NULL`; the fixture now retains that synthetic
choice ID in its granted rollback-only temporary table. The run also exposed a
real nullable-boolean result for historical sessions, corrected by forward
migration 043. The corrected linked rerun passed the Mitchell suite 56/56 and all
linked suites 456/456.

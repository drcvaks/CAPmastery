# Checkpoint Log

## Checkpoint 0 — Repository and mySCP review

Status: complete and owner-approved. Date: 2026-07-19.

Completed:

- Read the complete build plan and existing owner-preparation note.
- Inspected mySCP read-only, including repository/configuration, dependencies, routes, shared UI/theme, auth/state, Supabase client/types, migrations, functions, policies, grants, seeds, and test/lint indicators.
- Initialized a separate local Git repository on `main` and created the planned directory structure with placeholders only.
- Created permanent instructions, README, environment template, product/architecture/database/security/adaptive/content/testing/AI documentation, reuse audit, and the owner-input register.
- Established proposed branch/commit/tag and migration strategies.
- Did not initialize Expo, install dependencies, create product screens, create migrations, connect to Supabase, copy secrets, or initialize any database.

Database changes: none.

Toolchain observed: Node `v24.15.0`; npm `11.12.1`; Git `2.46.2.windows.1`; mySCP's local Expo CLI `54.0.25`. CAP-specific Expo and package versions are intentionally unpinned until Checkpoint 1 compatibility setup.

Validation results:

- Required documentation check: 14/14 required root/docs files present; 0 missing.
- Repository separation: `git rev-parse --show-toplevel` returned `C:/Users/Family/ws/CAPmastery`; branch is `main`; no commits exist yet.
- Planned structure: 23 `.gitkeep` placeholders found.
- Environment hygiene: `.env` is ignored and `.env.example` is trackable.
- Secret-pattern scan: 0 real-project-shaped Supabase URL hits, 0 JWT-like token hits, and 0 private-key header hits.
- mySCP integrity: HEAD remained `5403b711adce3931ce5741ebfba8257ce25c68c5`; tracked diff exit 0; staged diff exit 0; pre-existing untracked-file list unchanged.
- TypeScript: not applicable—no `package.json` or TypeScript application exists at this checkpoint.
- Lint: not applicable—no application/lint configuration exists at this checkpoint.
- Unit/component/integration tests: not applicable—no application or test harness exists at this checkpoint.
- Expo startup: not applicable—Checkpoint 1 owns Expo initialization; running mySCP's Expo CLI only confirmed version `54.0.25`.
- Migration/RLS tests: not applicable—no Supabase project or migrations were created.

Known limitations:

- Architecture and schema are proposals until implementation proves them.
- No remote repository or initial commit exists yet.
- No Expo application or test harness exists by design.
- No Supabase project or credentials exist in this repository.
- Windows Git reported repository ownership as “dubious” under the sandbox identity; commands use a per-command safe-directory override rather than changing the user's global Git configuration.
- Two `Learn to Lead` PDF files appeared in the workspace after the initial inventory. They were not opened, modified, staged, or classified as authorized; decide source rights/storage policy before committing source documents.

Recommended next checkpoint after owner approval: Checkpoint 1, Expo Application Skeleton.

## Checkpoint 1 — Expo application skeleton

Status: complete pending owner review. Date: 2026-07-19.

Completed:

- Initialized Expo SDK 57 with React Native 0.86, React 19.2, Expo Router, strict TypeScript 6, and npm lockfile.
- Applied the approved identifiers: slug `cap-mastery`, scheme `capmastery`, and Android package `com.chaimvaks.capmastery`.
- Added root, auth, student, admin, and not-found routes. Student navigation has Home, Study, and Progress tabs.
- Added responsive shared screen/card/link components, navy/red theme tokens, safe-area/gesture roots, status bar, and a route error boundary.
- Added placeholder-only auth, student, and administration screens; no application feature or Supabase dependency was added.
- Configured Expo ESLint flat config, Prettier, Jest/`jest-expo`, React Native Testing Library, and Expo Router test utilities.
- Added aggregate checks and platform export scripts and updated architecture, testing, setup, and README documentation.

Database changes: none. No Supabase project, client, migration, schema, seed, RLS policy, Storage bucket, function, or production database was created.

Validation results:

- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0 with 0 reported problems.
- `npm test`: exit 0; 2 suites passed, 2 tests passed, 0 failed, 0 snapshots.
- `npm run format:check`: exit 0; all matched files formatted.
- `npx expo-doctor`: exit 0; 20/20 checks passed.
- `npm run validate:expo`: exit 0; SDK 57 configuration resolved with the approved identifiers and Android/web platforms.
- Web production export: exit 0; 1,344 modules bundled to ignored `dist/web`.
- Android production export: initial sandbox run reached Metro but could not execute `hermesc.exe`; approved elevated rerun exit 0 with 1,706 modules and a 4.1 MB Hermes bytecode bundle in ignored `dist/android`.
- Expo startup probe: Metro reached `Waiting on http://localhost:8090`. The harness intentionally stopped the long-running server at 30 seconds (exit 124). Expo used fallback React Native DevTools after the sandbox denied its optional cache write; Metro still started.
- Browser smoke test: landing page rendered; student link opened the student tab shell; admin link opened the admin workspace shell; temporary browser tab/server closed.
- `npm audit --json`: exit 1; 10 moderate, 0 high, 0 critical advisories. The reported chain is in Expo CLI/config tooling through `xcode`/`uuid`; npm proposes an invalid major downgrade to Expo 46 rather than a safe SDK 57 fix, so no forced audit mutation was applied.

Post-completion dependency repair (2026-07-20):

- Expo development-mode web bundling exposed an upstream packaging regression in `@expo/log-box@57.0.1`: its published package omitted `src/Data/LogBoxData.tsx`, although `src/LogBox.ts` imports that module.
- Pinned the transitive package to `@expo/log-box@57.0.0` with an npm override; no application behavior, Supabase work, or feature scope was added.
- `npm ls @expo/log-box --all`: exit 0; all Expo dependency paths resolve to `57.0.0`.
- Clean development web export: exit 0; 1,430 modules bundled to ignored `dist/web-dev-check`, confirming the previously failing LogBox development bundle resolves.
- `npx expo-doctor`: exit 0; 20/20 checks passed after npm hoisted the pinned package to one installed copy.
- `npm install`: exit 0; audit remains 10 moderate, 0 high, 0 critical advisories.

Known limitations:

- All screens are placeholders; no authentication, persistence, study behavior, or administrative behavior exists.
- No physical Android device or emulator was available for interaction testing. Android Metro/Hermes production bundling passed.
- During Expo's SDK 57 transition, physical Expo Go availability may lag; use an SDK 57 development build or recheck Expo Go compatibility before device testing.
- The 10 moderate npm advisories have no acceptable nonbreaking automated fix in the current SDK 57 dependency graph and must be monitored.
- React Hook Form, Zod, TanStack Query, and Supabase remain intentionally uninstalled until used.

Manual action required: none for Checkpoint 1 review. The owner manages Git. Checkpoint 2 will require a separate CAP Mastery development Supabase project and client-safe URL/publishable key through ignored environment storage; do not create production infrastructure yet.

Recommended next checkpoint after owner approval: Checkpoint 2, Supabase Foundation and Authentication.

## Checkpoint 2 — Supabase foundation and authentication

Status: complete and owner-approved. Date: 2026-07-20.

Completed:

- Added Supabase JS, native AsyncStorage session persistence, URL polyfill, React Hook Form, Zod, TanStack Query, and repository-local Supabase CLI dependencies.
- Added lazy validated environment handling; only the project URL and publishable key are client-readable, and missing values render a configuration state.
- Added email/password sign-in, sign-out, reset request, recovery deep-link exchange, password update, session restoration, and native foreground token refresh.
- Replaced preview navigation with database-role-aware root routing and student/admin route-group guards.
- Added migrations for profiles, scoped roles, guardian links, organizations, memberships, audit log, profile/update triggers, explicit grants, RLS policies, private authorization helpers, and audited admin functions.
- Added an intentionally empty seed file and pgTAP identity/RLS/privilege-escalation tests.
- Linked the repository only to the new CAP Mastery development project in `us-east-1`, applied the three migrations in order, and generated authoritative TypeScript definitions from the hosted public schema.
- Bootstrapped confirmed development administrator and student roles through the documented one-time audited procedure.
- No production project, Storage, content schema, grading function, AI integration, or service-role client key was created.

Validation results:

- `npm run check`: exit 0; typecheck and lint passed; 5 Jest suites passed, 11 tests passed, 0 failed; formatting passed.
- `npm run validate:expo`: exit 0; SDK 57 public configuration resolved.
- `npm run export:web`: exit 0; 1,545 modules bundled to ignored `dist/web` with the client-safe development environment.
- `npm run export:android`: exit 0; 1,975 modules bundled and a 5.9 MB Hermes bytecode bundle written to ignored `dist/android`.
- `npx expo-doctor`: exit 0; 20/20 checks passed.
- Repository-local Supabase CLI: `2.109.1` installed and `supabase init` completed.
- `supabase migration list --linked`: exit 0; local and remote versions match for `202607200001`, `202607200002`, and `202607200003`.
- `supabase db lint --linked --level error`: exit 0; no schema errors found in `extensions`, `private`, or `public`.
- `npm run db:test:linked`: owner-executed exit 0; pgTAP 15/15 passed. The transaction rolled back all synthetic users and rows.
- Hosted manual auth: owner confirmed student and administrator sign-in, student redirect away from `/admin`, administrator access to `/admin`, and sign-out.
- Tracked-scope secret scan: 0 JWT-shaped hits and 0 privileged-secret assignment hits; `.env.local` and `supabase/.temp/` are ignored.
- `npm audit --json`: exit 1; 10 moderate, 0 high, 0 critical advisories. The existing Expo CLI/config chain through `xcode`/`uuid` remains without an acceptable SDK 57 fix; npm proposes an invalid downgrade to Expo 46.

Database changes:

- Development project only: six API tables, seven enums, indexes, four triggers, six functions (including two private RLS helpers and two public audited admin entrypoints), explicit grants, seven RLS policies, and three recorded migrations.
- Seed changes: none; `supabase/seed.sql` intentionally contains comments only.
- Production database changes: none; no production project was initialized.

Known limitations:

- Product screens remain placeholders; content, questions, study sessions, grading, progress, and administrative UI are later checkpoints.
- Password-recovery request, deep-link exchange, and update flows are implemented and compile/bundle, but real email delivery and recovery deep links still require target-device/browser testing.
- Docker is unavailable, so local `supabase db reset`, local pgTAP, and local database lint were not run. Migrations were dry-run/applied to the dedicated development project; linked lint and linked pgTAP passed.
- No physical Android device or emulator interaction was performed by Codex. The owner performed the hosted account/route checks, and the Android Hermes production export passed.
- The 10 moderate npm advisories remain in Expo tooling with no acceptable nonbreaking automated fix.

Manual action required for review: none. Keep `.env.local`, `supabase/.temp/`, account emails/passwords, and database credentials out of Git. The owner manages Git.

Recommended next checkpoint after owner approval: Checkpoint 3, Content Hierarchy and Question Bank.

## Checkpoint 3 — Content hierarchy and question bank

Status: complete and owner-approved. Date: 2026-07-20.

Completed:

- Added normalized programs, exams, courses, optional volumes, chapters/subsections, sections, topics, objectives, concepts, relationships, source documents, and private source passages/tutor notes with hierarchy validation.
- Added questions, choices, private answer keys/feedback, versions, quality reviews, reports, constraints, indexes, and update triggers.
- Added RLS and explicit grants for all 14 API-exposed content tables. Students see approved active prompts/choices only; drafts and source records are hidden; private answer/source tables have no client grants.
- Added audited reviewer answer entry and approval functions. Approval requires an authorized source, objective, valid choice count, private answer/explanation, and approving quality review.
- Hardened approved content against direct prompt, choice, or answer-key edits and validated exam/topic/objective consistency.
- Added catalog-only Leadership and Aerospace structure with explicit pending-source placeholders and no real questions, answers, scores, times, or source text.
- Added a typed content service, narrow TanStack Query hooks, strict Zod parsing of the safe choice projection, and a read-only student Study catalog with honest empty states.
- Updated the linked pgTAP runner to discover all SQL test files and validate their individual plans.

Database changes:

- Applied development-only migrations `202607200004` through `202607200010`. No production database exists or was initialized.
- Added 21 public content tables, four private content tables, content/question enums, RLS policies, reviewer/delivery functions, integrity helpers/triggers, and catalog-only seed rows.
- No workspace PDF, real CAP question, answer, source passage, or AI-generated content was imported.

Validation results so far:

- `npm run check`: exit 0; typecheck and lint passed; 6 Jest suites passed, 13 tests passed, 0 failed; formatting passed.
- `npm run validate:expo`: exit 0; SDK 57 public configuration resolved.
- `npx expo-doctor`: exit 0; 20/20 checks passed.
- `npm run export:web`: exit 0; 1,549 modules bundled to ignored `dist/web`.
- `npm run export:android`: exit 0 on isolated elevated rerun; 1,979 modules bundled and a 5.9 MB Hermes bytecode bundle written to ignored `dist/android`.
- `supabase db push --linked --dry-run`: exit 0 before each push; only the expected Checkpoint 3 migrations were listed.
- `supabase db push --linked`: migrations through `202607200010` applied. The CLI emitted a non-fatal Docker catalog-cache warning because Docker Desktop is unavailable.
- `supabase db lint --linked --level warning`: exit 0; no schema errors found.
- `supabase migration list --linked`: exit 0; local and remote versions match through `202607200010`.
- `npm run db:test:linked`: owner-executed exit 0; `content_permissions.test.sql` passed 32/32, `identity_access_rls.test.sql` passed 15/15, and the aggregate result was 47/47. Both suites rolled back their synthetic fixtures.
- An earlier run during implementation exposed two identity assertions that counted all hosted profiles. They were corrected to filter fixture UUIDs, and the runner now prints failing TAP lines.

Known limitations and required owner input:

- Physical Expo Go on the owner's Android device does not currently support this SDK 57 project. The owner chose to retain SDK 57; production web/Android bundles pass.
- The original build plan's sample-bank deliverable is deliberately deferred to the separately supplied `CAP_Mastery_Content_Development_Plan.md`, which requires structure/objective work before question generation. The app shows an honest empty state meanwhile. File presence remains insufficient source authorization.
- Docker is unavailable, so linked development-project migration/lint/pgTAP validation is used instead of local reset.
- Study sessions, submission, server-side grading, mastery, imports/admin editor UI, AI, Storage, and production infrastructure remain out of scope.

Recommended next checkpoint after completion and owner approval: Checkpoint 4, Study Sessions and Secure Answer Submission.

## Checkpoint 4 — Basic study session and secure answer submission

Status: implementation complete; awaiting owner review and an approved question bank for manual student acceptance. Date: 2026-07-20.

Completed:

- Added owned study sessions, ordered/versioned session questions, and one immutable server-created attempt per session question.
- Added RLS and select-only client grants for sessions, session questions, and attempts; another student receives no rows and cannot call owner-only delivery/submission successfully.
- Added protected 10-question session creation using approved active questions only.
- Added idempotent server-side `submit_answer`: validates session ownership and choice membership, reads the private key, computes correctness, records the attempt, and updates/completes session counters atomically.
- Added safe session delivery that returns answer/explanation/remediation fields only after that session question has an attempt.
- Added typed study services, Zod response validation, TanStack Query hooks, dynamic session route, question/choice UI, answer feedback, retry/offline error states, and final score results.
- Added a sparse-bank error state rather than persisting invented educational questions.

Database changes:

- Applied development-only migrations `202607200011` and `202607200012`; local and remote migration history match through `202607200012`.
- Added two enums, three public study tables, one private ownership helper, three public study functions, indexes, constraints, triggers, explicit grants, and three RLS policies.
- No production project, mastery/adaptive tables, AI integration, or real/synthetic persistent question bank was created.

Validation results so far:

- `npm run check`: exit 0; typecheck and lint passed; 7 Jest suites passed, 18 tests passed, 0 failed; formatting passed.
- `npm run validate:expo`: exit 0; SDK 57 public configuration resolved.
- `npx expo-doctor`: exit 0; 20/20 checks passed.
- `npm run export:web`: exit 0; 1,555 modules bundled to ignored `dist/web`.
- `npm run export:android`: exit 0; 1,985 modules bundled and a 6.0 MB Hermes bytecode bundle written to ignored `dist/android`.
- `supabase db push --linked --dry-run`: exit 0; only migrations `202607200011` and `202607200012` were listed.
- Initial function push: schema migration `202607200011` applied; PostgreSQL rejected reserved output name `position` in `202607200012`. The unapplied migration was corrected to `question_position` and then applied successfully.
- `supabase db lint --linked --level warning`: exit 0; no schema errors found.
- `supabase migration list --linked`: exit 0; local and remote versions match through `202607200012`.
- In-app browser smoke check: the running local web app reached the CAP Mastery sign-in screen. Authenticated session UI could not be exercised without using owner credentials.
- `npm run db:test:linked`: owner-executed exit 0; content passed 32/32, identity/access passed 15/15, study sessions passed 35/35, and the aggregate result was 82/82. All synthetic users, questions, sessions, and attempts rolled back.
- Initial owner run passed the existing 47 tests, then stopped because the `authenticated` test role lacked access to transaction-local helper tables. The temporary fixtures now receive narrow test-only grants; no application table policy or grant changed.
- The next run reached study submission and exposed PostgreSQL's lack of an implicit `integer`-to-`smallint` function-argument cast. Test confidence literals now use explicit `smallint` casts; the Supabase named RPC contract and hosted function were unchanged.
- A subsequent run proved the grading membership check by rejecting a fixture choice whose loop number did not match UUID-based session ordering. The test now maps actual session-question IDs/positions to their fixture choices and scopes session creation to the transaction-only topic; application behavior was unchanged.

Known limitations:

- The development project has no persistent approved question bank. The required 10-question lifecycle is covered with rolled-back synthetic SQL fixtures; Heshy/Avigail manual completion remains blocked until the separate content workflow publishes at least 10 approved questions.
- Owner web testing found that Supabase's plain RPC error object bypassed the initial `Error`-only sparse-bank message mapping. The parser now safely reads string `message` fields from plain objects, with a regression test, so the expected actionable empty-bank message is shown.
- The owner supplied and authorized a ten-question Learn to Lead Volume 1, Chapter 1 pilot sample for draft use. Migration `202607200013` adds stable external IDs, pilot/import/source provenance, supplied family codes, and RLS-protected package assignments without changing the existing normalized answer-key design.
- Added an idempotent transactional importer limited by default to the supplied ten-question file. It validates all 27 fields, converts the file's Windows-1252 typography to Unicode, updates drafts by stable ID, refuses to overwrite approved questions, preserves four choices and all explanations, and reports unresolved reinforcement targets as warnings.
- The ten-question file validates successfully: 10 rows, 10 unique external IDs, 9 objective codes, 10 concept codes, five pilot batches, no missing required values, and 14 reinforcement references to the not-yet-imported 65 questions.
- Applied development-only migration `202607200013`; local and remote histories match through `202607200013`, and linked database lint reports no errors.
- `npm run check`: exit 0; 8 Jest suites passed, 24 tests passed, 0 failed; typecheck, lint, and formatting passed.
- Import execution is pending because the database password is intentionally unavailable to Codex. The owner must run `npm run content:import:pilot10` and `npm run db:test:linked` with `CAP_MASTERY_DB_PASSWORD` set only for that process, then assign the pilot package to the intended students.
- Owner import run: 10 inserted, 0 updated, 0 skipped, 0 failed, and 14 expected unresolved-reinforcement warnings. The first post-import pgTAP run exposed a pre-existing fixture assertion that counted every reviewer-visible question; it saw the 10 persistent drafts plus its two fixtures. The assertion is now scoped to its two fixture UUIDs and awaits owner rerun.
- Owner idempotency run: 0 inserted, 10 updated, 0 skipped, 0 failed, and the same 14 expected warnings. Content permissions passed 32/32 and identity/access passed 15/15. The new pilot suite executed 19 successful assertions with no failures but declared an incorrect `1..17` plan; its plan is corrected to `1..19` and awaits owner rerun.
- The next linked run passed content 32/32, identity/access 15/15, and pilot access 19/19. Study sessions passed 34 assertions; its sparse-bank assertion still expected the earlier approved-only error text. The expected message now uses the accurate broader wording, “available questions,” because explicitly assigned pilot drafts are eligible.
- Final owner-linked pgTAP run: content permissions 32/32, identity/access 15/15, pilot package access 19/19, study sessions 35/35, aggregate 101/101 passed. All transaction fixtures rolled back; the ten authorized draft pilot questions remain persistent.
- Basic selection is ordered, not adaptive. Mastery, spaced review, practice-test behavior, progress calculations, and delayed feedback remain later checkpoints.
- Physical Expo Go remains incompatible with SDK 57 on the owner's current Android installation; production web/Android bundles pass.
- Docker is unavailable, so linked development-project validation replaces local reset/pgTAP.

Recommended next checkpoint after completion and owner approval: Checkpoint 5, Mastery and Adaptive Selection.

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

Status: complete and owner-approved. Date: 2026-07-20.

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
- Owner web acceptance: the private pilot package was assigned through the audited administrator function, and the assigned student successfully used the imported questions in the Study flow.
- Basic selection is ordered, not adaptive. Mastery, spaced review, practice-test behavior, progress calculations, and delayed feedback remain later checkpoints.
- Physical Expo Go remains incompatible with SDK 57 on the owner's current Android installation; production web/Android bundles pass.
- Docker is unavailable, so linked development-project validation replaces local reset/pgTAP.

Checkpoint 4 is complete. Stop here. Recommended next checkpoint after explicit owner authorization: Checkpoint 5, Mastery and Adaptive Selection.

### Post-completion feedback refinement — 2026-07-21

- Replaced the inline result block with a shared `AnswerResultCard` used by every study question.
- Correct answers show “Correct.” and only a concise main explanation. Incorrect answers show “Not quite.”, selected-choice feedback first, and a short correct-concept reminder only when the texts do not substantially overlap.
- Default feedback is deterministically limited to roughly 35 words and two sentences; remediation is hidden behind an accessible “Need more help?” control; source text remains visible but secondary.
- No database, grading, RLS, import, mastery, adaptive-selection, or AI behavior changed. Checkpoint 5 remains unstarted.
- `npm run check`: exit 0; typecheck, lint, and formatting passed; 10 Jest suites passed with 30/30 tests.
- `npm run validate:expo`: exit 0; SDK 57 public configuration resolved. `npm run export:web`: exit 0 with 1,557 modules. `npm run export:android`: initial sandboxed Hermes execution was denied, then the approved rerun passed with 1,987 modules and a 6 MB bytecode bundle.

### Post-completion learning-support extension — 2026-07-21

- Validated the supplied complete learning-support CSV: 10 rows, 10 unique existing IDs, reviewed short explanations of 11–15 words, memory aids for all ten, display version 1, and complete metadata/alt text for ten proposed visuals.
- Added private question learning-support storage and a separate private visual-asset approval registry. Internal visual briefs and all support fields remain unavailable before submission; visual delivery additionally requires a registered approved asset.
- Updated the idempotent pilot importer to use the complete support file, preserve optional blanks, import reviewed short explanations/memory/visual metadata, and warn rather than fail for missing/unapproved visual assets.
- Updated the shared result component with independently collapsible Memory trick, Show visual, and Explain more controls. Reviewed short text is the default. Broken or unavailable visuals remain hidden, and expanded explanation/remediation suppress substantially repeated text.
- Applied development-only migration `202607210014`; linked migration history matches through 014 and database lint reports no errors. No production database, Storage bucket, visual file, AI content, repeated-difficulty automation, or remaining 65 questions were added.
- `npm run check`: exit 0; typecheck, lint, formatting, and 10 Jest suites with 30/30 tests passed. Expo validation and web export passed with 1,557 modules. Updated import, linked pgTAP, Android export, and owner web acceptance remain pending.
- First owner-linked learning-support pgTAP run passed content 32/32, identity/access 15/15, and learning support 12/12. The pilot suite's audit assertion counted three real-plus-fixture assignment events; it is now isolated to the synthetic student UUID and awaits rerun.
- Final owner-linked pgTAP run passed content 32/32, identity/access 15/15, learning support 12/12, pilot package access 19/19, and study sessions 38/38: aggregate 116/116 passed.
- The first persistent learning-support import rolled back because the supplied `four-part_icon_card` visual type contains a hyphen while migration 014's controlled-key constraint allowed only underscores. Forward corrective migration `202607210015` permits both separators; importer validation now tests the same rule. No partial question updates were committed.
- Applied and linted corrective migration `202607210015`; local and remote migration history match through 015. The owner reran the transactional import successfully and received exactly 24 expected warnings: 14 unresolved future reinforcement targets and 10 unregistered visual assets. The ten questions remain usable, while Show visual stays hidden.
- Owner web review found expanded Memory trick content rendered after all support buttons. Each disclosure panel is now grouped directly beneath its own control, so the memory aid appears before Explain more; the component test verifies that containment.
- Owner web review also found that leaving and returning to the app reset the student navigator to Home. Same-user Supabase refresh/sign-in events no longer clear loaded access or unmount the navigator; a provider regression test verifies that token refresh preserves signed-in student state without refetching roles.
- Switching from an active session to the Progress tab still returned Study to its catalog because the session was modeled as a separate hidden tab. Study now owns a nested catalog/session stack, allowing the tab navigator to preserve the active question screen across normal tab switches.
- Owner web acceptance passed: reviewed short feedback, Memory trick placement/expansion, Explain more, hidden unavailable visuals, question advancement, app-focus return, and Study → Progress/Home → Study session preservation all worked as intended.
- Final application gate after navigation nesting: `npm run check` passed typecheck, lint, formatting, 11 Jest suites, and 33/33 tests. Web export passed with 1,558 modules. Android export remains unrerun because the elevated Hermes request was declined; the earlier pre-learning-support Android export passed.

## Checkpoint 5 — Mastery and adaptive selection

Status: complete; awaiting owner acceptance. Date: 2026-07-21.

Completed:

- Added deterministic pure mastery, retention, spaced-review, allocation, and adaptive-selection logic with injected time and stable seeded tie-breaking.
- Added owner-scoped per-question state and topic mastery. New topics begin at mastery 40 with zero confidence; all score/status/interval changes use documented bounded coefficients.
- Extended secure answer submission so the first server-graded attempt updates question and topic state atomically. Identical retries do not double-update mastery.
- Replaced basic ordered selection with a 40% weak, 20% recently missed, 20% developing, 10% retention, and 10% new/harder target for ten-question sessions. Exhausted buckets use deterministic fallback, recently seen wording is deprioritized, duplicate questions remain prohibited, and sparse banks still fail clearly.
- A miss marks an available later question on the same learning objective as `same_session_remediation`; answer keys remain private and no question is inserted or repeated.
- Kept Checkpoint 6 readiness/progress UI, practice-test mode, AI, production infrastructure, and coefficient tuning outside this checkpoint.

Database changes:

- Applied development-only migration `202607210016_mastery_adaptive_selection.sql`; local and remote migration histories match through 016.
- Added `student_question_state`, `student_topic_mastery`, two status enums, four indexes, owner-only RLS/select policies, server-only mastery helpers, adaptive session creation, and atomic grading/mastery integration.
- Linked database lint at warning level passed with no schema errors. No production database was created or changed.

Validation so far:

- `npm run check`: exit 0; typecheck, lint, formatting, 12 Jest suites, and 42/42 tests passed. The 9 new algorithm tests cover coefficients, confidence, decay, interval boundaries, exact allocation, deterministic replay, weakness frequency, duplicate avoidance, fallback, and sparse banks.
- `npm run validate:expo`: exit 0; SDK 57 public configuration resolved.
- `npx expo-doctor`: exit 0 on the approved registry/cache rerun; 20/20 checks passed.
- `npm run export:web`: exit 0; 1,558 modules bundled to ignored `dist/web`.
- `supabase db push --linked --dry-run`: exit 0 and listed only migration 016. The subsequent linked push applied 016; the nonfatal Docker catalog-cache warning remains because Docker Desktop is unavailable.
- `supabase db lint --linked --level warning`: exit 0; no schema errors. `supabase migration list --linked`: local and remote versions match through 016.
- Owner-executed `npm run db:test:linked`: exit 0. Adaptive mastery passed 34/34, content permissions 32/32, identity/access RLS 15/15, learning support 12/12, pilot package access 19/19, and study sessions 38/38: aggregate 150/150 passed. Every synthetic mastery/session fixture rolled back.

Known limitations and manual action:

- The original ten-question bank could not visibly demonstrate frequency changes because every ten-question session exhausted it. The later owner-supplied 30-question validation extension removes that limitation for Chapter 1 pilot testing; synthetic tests continue to cover controlled bucket mixes and fallback behavior.
- The initial coefficients are transparent defaults, not evidence-derived predictions. Do not tune them from only two students.
- Android export was not rerun in this checkpoint; web export and Expo validation pass, and the earlier Checkpoint 4 Android production export passed before the learning-support extension.
- No further account, secret, database, Storage, or content action is required for Checkpoint 5 review.

Checkpoint 5 implementation and automated acceptance gates are complete. Stop here. Recommended next checkpoint after explicit owner acceptance: Checkpoint 6, Progress and Readiness Dashboard.

### Checkpoint 5 adaptive 30-question validation extension — 2026-07-21

- Validated the owner-supplied tab-delimited bank: 30 unique draft rows; six questions in each of Pilot A–E; 11 easy, 14 medium, and 5 hard; and the documented cognitive distribution.
- The original ten rows retain complete reviewed short/memory/visual metadata. The additional twenty intentionally blank support rows create no empty private learning-support record and continue to receive concise post-answer main-explanation feedback.
- Recognition maps to the supported broad cognitive level `recall` while preserving purpose `recognition`; analysis maps to `application` while preserving purpose `analysis`. No enum/schema migration was required.
- Added `npm run content:import:adaptive30`; it uses the existing transactional, stable-ID importer and existing private package identifier, so assigned pilot students need no new assignment.
- File validation reports exactly 22 expected reinforcement references outside the 30-row bank. The ten existing unregistered visual assets remain hidden and are expected to produce ten additional import warnings.
- `npm run check`: exit 0; typecheck, lint, formatting, 12 Jest suites, and 46/46 tests passed.
- Owner persistent import completed successfully. The importer emitted exactly 32 expected nonfatal warnings: 22 reinforcement targets outside this 30-row subset and ten visual metadata records without approved registered assets. Warning output is printed only after the transaction commits.
- Post-import owner-linked pgTAP passed adaptive mastery 34/34, content permissions 32/32, identity/access RLS 15/15, learning support 12/12, pilot package access 19/19, and study sessions 38/38: aggregate 150/150 passed.
- The assigned pilot student now has 30 eligible Chapter 1 questions through the existing private package assignment. Checkpoint 5 remains complete; Checkpoint 6 has not started.

## Checkpoint 6 — Progress and readiness dashboard

Status: complete and owner accepted. Date: 2026-07-22.

Completed:

- Added a deterministic readiness calculation combining coverage, recent accuracy, mastery, retention, and a weak-topic penalty. Evidence caps prevent fewer than 10 attempts or less than 20% coverage from exceeding 40, with staged caps of 65 and 79 as evidence grows.
- Added protected student-list, dashboard, topic-detail, and 30-day trend projections. Every request is authorized for the student themself or an active guardian link with progress permission; administrator/reviewer roles do not implicitly expose private learning data.
- Replaced the student Home and Progress placeholders with compact and detailed dashboards showing readiness, coverage, recommended action, due review count, weak topics, topic evidence, and daily trends.
- Added a parent/coach family dashboard that switches among every linked student returned by the protected projection.
- Added the required unofficial-result disclaimer and explicit sparse-evidence caveat. Practice-test mode, official-result claims, AI, and production infrastructure remain out of scope.

Database changes:

- Applied development-only migration `202607210017_progress_readiness.sql`; local and remote migration histories match through 017.
- Added private authorization/readiness helpers and four authenticated security-definer RPCs. No new client-writable table or production database was added.
- Linked database lint at warning level passed with no schema errors.

Validation so far:

- `npm.cmd run check`: exit 0; TypeScript, Expo lint, formatting, 14 Jest suites, and 54/54 tests passed.
- `npx.cmd expo-doctor`: exit 0; 20/20 checks passed.
- `npm.cmd run validate:expo`: exit 0; SDK 57 public configuration resolved.
- `npm.cmd run export:web`: exit 0; 1,565 modules bundled to ignored `dist/web`.
- Owner-executed linked pgTAP passed adaptive mastery 34/34, content permissions 32/32, identity/access RLS 15/15, learning support 12/12, pilot package access 19/19, progress/readiness 30/30, and study sessions 38/38: aggregate 180/180 passed.
- The first linked run exposed a probabilistic assumption in the existing same-session-remediation fixture. The fixture now answers the earliest selected question in its synthetic topic and accepts any later related question; the production adaptive engine did not change.

Known limitations and manual action:

- Readiness coefficients and labels are transparent pilot defaults, not a validated CAP passing prediction.
- Topic trends use UTC days and currently present compact textual bars rather than charts.
- Android export was not rerun; web export and Expo Doctor pass, and physical Expo Go remains incompatible with the retained SDK 57 setup.
- A real family-view smoke test requires owner-approved parent/coach roles and active progress links; automated fixtures verify two-child and unrelated-user behavior without persisting identities.

Checkpoint 6 implementation and automated acceptance gates are complete. Stop here. Recommended next checkpoint after explicit owner acceptance: Checkpoint 7, Practice Test Mode.

### Checkpoint 6 student-dashboard validation fix — 2026-07-21

- Owner web review reached the safe `Progress unavailable` state after the protected database requests succeeded. PostgreSQL/PostgREST emits `timestamptz` values with offsets such as `+00:00`; the client’s narrow ISO validator accepted only the `Z` form.
- Topic progress now accepts valid ISO timestamps with explicit timezone offsets while continuing to reject timezone-free timestamps. No database, RLS, readiness formula, or authorization behavior changed.
- Added a regression test with PostgreSQL-style fractional seconds and `+00:00` offsets.

### Checkpoint 6 zero-evidence readiness correction — 2026-07-21

- Owner family-dashboard review found that an unpracticed student displayed 14% Developing because the neutral mastery prior of 40 contributed its 35% readiness weight.
- Zero attempts now explicitly produce `0% — Not started`. The normal weighted formula and evidence caps begin after the first answer.
- Applied forward migration `202607210018_zero_attempt_readiness.sql` to the linked development project; local and remote histories match through 018 and linked database lint reports no schema errors. No table, RLS, access, grading, or answer-key behavior changes.
- Owner-executed linked pgTAP passed adaptive mastery 34/34, content permissions 32/32, identity/access RLS 15/15, learning support 12/12, pilot package access 19/19, progress/readiness 34/34, and study sessions 38/38: aggregate 184/184 passed.
- Owner completed the Checkpoint 6 web review on 2026-07-22, including student progress, zero-attempt Not started behavior, topic detail, family progress, and linked-child switching. Checkpoint 6 is accepted.

### Post–Checkpoint 6 complete learning-support extension — 2026-07-22

- Validated the owner-supplied replacement adaptive bank: 30 rows, 30 stable unique external IDs, 30 short explanations, 30 memory aids, display version 1 throughout, and 30 unique complete visual metadata keys. Short explanations contain 9–16 words.
- Compared every field against the prior adaptive 30-row file. Only the ten learning-support fields changed; prompts, choices, answers, explanations, remediation, sources, adaptive metadata, and reinforcement references are identical.
- Updated the existing idempotent `content:import:adaptive30` command to use the complete-support file. No importer, schema, migration, RLS, grading, mastery, readiness, or AI change was required.
- All visual display modes remain optional after answering. No image files or approved visual-asset records were supplied, so Show visual remains hidden and missing assets should produce 30 nonfatal warnings.
- Owner persistent import completed and emitted exactly 52 expected nonfatal warnings: 22 reinforcement targets outside the current bank and 30 visual metadata keys without registered approved assets. Warning output occurs only after the transaction commits.
- Post-import linked pgTAP passed adaptive mastery 34/34, content permissions 32/32, identity/access RLS 15/15, learning support 12/12, pilot package access 19/19, progress/readiness 34/34, and study sessions 38/38: aggregate 184/184 passed.

## Checkpoint 7 — Practice test mode

Status: complete and owner accepted. Date: 2026-07-22.

Completed:

- Added an unofficial, configurable Leadership Chapter 1 pilot blueprint for ten questions with exact difficulty/cognitive strata, balanced deterministic selection, an optional 15-minute timer, and pause disabled.
- Added a practice-test launcher and extended the shared session flow with countdown/untimed display, server-enforced pause policy, early completion, neutral active-test acknowledgements, completed score/topic analysis, and answer review.
- Withheld correctness, answer keys, explanations, remediation, memory support, and aggregate score while a practice test is active. Only answered items release feedback after completion.
- Kept practice attempts out of normal question mastery, topic mastery, recent accuracy, and study trends. Completed practice scores contribute a separate readiness component; all eligible attempts contribute to coverage.
- Kept the blueprint explicitly unofficial. No AI, production database, official-result claim, or protected exam content was added.

Database changes:

- Applied development-only migrations `202607220019_practice_test_mode_enum.sql`, `202607220020_practice_test_mode.sql`, and `202607220021_practice_readiness_analytics.sql`; local and remote history match through 021.
- Added read-only blueprint tables with RLS, session timing/pause snapshots, protected create/pause/complete/results RPCs, delayed-feedback study projections, and practice-aware readiness/trend projections.
- Regenerated checked-in database TypeScript types from the linked development schema. Linked database lint at warning level reports no schema errors.

Validation so far:

- `npm.cmd run typecheck`: exit 0.
- `npm.cmd run lint`: exit 0.
- `npm.cmd test -- --runInBand`: exit 0; 17 suites and 66/66 tests passed.
- `npx.cmd supabase db lint --linked --level warning`: exit 0; no schema errors.
- `npx.cmd supabase migration list --linked`: exit 0; local and remote versions match through 021.
- `practice_tests.test.sql` declares 56 transaction-only assertions. Owner execution of the complete linked suite is pending because the database password remains process-only and unavailable to Codex.

Known limitations and manual decisions:

- The pilot count, timer, no-pause rule, and distributions are provisional product configuration, not an authorized official CAP exam blueprint. Owner/source review is required before broader or official-simulation claims.
- Linked pgTAP and owner browser acceptance remain to be completed before Checkpoint 7 can be marked complete.

Additional application validation:

- `npm.cmd run check`: exit 0; typecheck, lint, formatting, 17 Jest suites, and 66/66 tests passed.
- `npm.cmd run validate:expo`: exit 0; SDK 57 public configuration resolved.
- `npx.cmd expo-doctor`: exit 0; 20/20 checks passed.
- `npm.cmd run export:web`: exit 0; 1,569 modules bundled to ignored `dist/web`.
- `npm.cmd run export:android`: the sandboxed Hermes compiler was denied, then the approved rerun passed; 1,999 modules bundled and a 6 MB bytecode bundle was written to ignored `dist/android`.
- First owner-linked run passed every existing suite and 48/56 practice assertions. Eight blueprint-distribution assertions saw zero because the authenticated test role correctly could not join draft questions directly. The assertions now join their granted transaction-local metadata fixture instead; no application schema, RLS policy, blueprint, or selection behavior changed. `npm.cmd run check` still passes 17 suites and 66/66 tests; linked pgTAP rerun is pending.
- Second owner-linked run passed the new practice suite 56/56, then exposed a legacy progress fixture that represented five covered questions in mastery state but created only one attempt row. Forward migration `202607220022_practice_coverage_union.sql` now calculates coverage from the distinct union of normal mastery state and all server-recorded attempts, preserving prior dashboard behavior while adding practice coverage. Ordinary recent accuracy and trends remain study-only. Migration 022 is applied to development, linked lint has no errors, and histories match through 022; linked pgTAP rerun is pending.
- Final owner-linked pgTAP passed adaptive mastery 34/34, content permissions 32/32, identity/access RLS 15/15, learning support 12/12, pilot package access 19/19, practice tests 56/56, progress/readiness 34/34, and study sessions 38/38: aggregate 240/240 passed.
- Owner web acceptance passed the practice launcher, timed and untimed modes, delayed active-test feedback, tab/session preservation, early completion, score/topic analysis, post-completion answer review, and unofficial-result language.

Checkpoint 7 is complete. Stop here. Recommended next checkpoint after explicit owner authorization: Checkpoint 8.

## Checkpoint 8 — CSV question import and review workflow

Status: complete and owner accepted. Date: 2026-07-24.

Completed:

- Added the canonical 37-column CSV template, quoted comma/tab parsing, pre-import validation, five-row preview, within-file and database duplicate warnings, and explicit error/warning summaries.
- Added an authoritative reviewer-only, all-or-nothing import function. Invalid payloads retain a failed import report without question writes; accepted questions always begin as drafts.
- Replaced the admin placeholder with a responsive content workspace for draft correction, quality ratings, approval, requested changes, and rejection. Review decisions save the displayed corrections before recording the decision.
- Added complete private question snapshots and approved-edit versioning. Approved edits create the next draft version while existing attempts retain their recorded question version.
- Allowed the existing `content_reviewer` role to reach the admin content route without granting student-progress access. Database authorization and RLS remain the security boundaries.

Database changes:

- Applied development-only migrations `202607220023_csv_review_workflow.sql` and `202607220024_rejected_content_status.sql`.
- Added `csv_import_jobs`, its RLS policy, complete private snapshot helper, duplicate/import/queue/detail/save/review RPCs, and audited approval behavior.
- Regenerated checked-in database TypeScript types from the linked development schema. No production database, service-role client key, Storage bucket, AI service, or new environment variable was added.

Validation so far:

- `npm.cmd run check`: exit 0; typecheck, lint, formatting, 19 Jest suites, and 74/74 tests passed.
- `npm.cmd run validate:expo`: exit 0; SDK 57 public configuration resolved.
- Expo Doctor initially reported five SDK 57 compatibility updates. Updated Expo to 57.0.8, Expo Constants to 57.0.7, Expo Linking to 57.0.4, Expo Router to 57.0.8, and React Native Screens to the compatible 4.26 range; `npx.cmd expo-doctor` then passed 20/20 checks.
- `npm.cmd run export:web`: exit 0; 1,573 modules bundled to ignored `dist/web`.
- `npm.cmd run export:android`: the sandboxed Hermes compiler was denied, then the approved rerun passed; 2,009 modules bundled and a 6.1 MB bytecode bundle was written to ignored `dist/android`.
- `npx.cmd supabase migration list --linked`: exit 0; local and remote histories match through migration 024.
- `npx.cmd supabase db lint --linked --level warning`: exit 0 after migrations 023–024; no schema errors.
- `content_import_review.test.sql` declares 50 transaction-only assertions. The complete linked suite is expected to report 290/290 and awaits owner execution because the database password remains process-scoped and unavailable to Codex.
- First owner-linked run passed 44/50 import-review assertions. One revision fixture blanked the approval-required misconception field, and protected history/audit assertions were still executing as the intentionally restricted reviewer role. The fixture now supplies valid revision metadata and resets to the transaction owner only for direct protected-table verification; no application schema, RLS, audit, versioning, or approval behavior changed. `npm.cmd run check` remains green with 19 suites and 74/74 tests; linked pgTAP rerun is pending.
- Final owner-linked pgTAP passed adaptive mastery 34/34, content import/review 50/50, content permissions 32/32, identity/access RLS 15/15, learning support 12/12, pilot package access 19/19, practice tests 56/56, progress/readiness 34/34, and study sessions 38/38: aggregate 290/290 passed.
- Owner review found the editor rendered below the potentially long review queue. Selecting a question now replaces the queue with the editor immediately and provides a `Back to review queue` control, avoiding fragile scroll-to-position behavior across web and Android. Direct TypeScript, ESLint, and formatting checks passed; the reviewer-workspace component suite passed 2/2 and verifies the list-to-editor transition and return path.
- Owner web acceptance passed the CSV template/validation view, review queue, immediate list-to-editor navigation, editor fields and controls, and return-to-queue flow.

Known limitations and owner decisions:

- The importer intentionally supports multiple-choice rows only and requires objective, concept, and question-family codes to exist already. Automatic hierarchy creation is not authorized.
- The workspace uses a pasteable CSV text area and canonical blank template; it does not add a native document-picker dependency.
- In-app localhost inspection was blocked by the browser tool's URL policy. Component tests and Expo exports cover the implementation; an authenticated owner browser check remains required.
- Before real publication, the owner must confirm source authorization and the final reviewer-count, approval-authority, versioning, report, and audit-retention rules.

Manual actions completed: the owner ran the linked database suite and reviewed the workspace while signed in as an administrator. No production database was initialized.

Checkpoint 8 is complete. Stop here. Recommended next checkpoint after explicit owner authorization: Checkpoint 9, Achievements and Family Challenge.

## Checkpoint 9 — Achievements and Family Challenge

Status: implementation and linked pgTAP complete; owner web acceptance pending. Date: 2026-07-24.

Completed:

- Added seven evidence-backed achievement definitions for first-session, persistence, steady-effort, topic-mastery, comeback, improvement, and team completion recognition.
- Added a private two-student challenge workflow for linked parents/coaches. The database snapshots one approved question set and copies identical question IDs, versions, and order into separately owned student sessions.
- Added positive scoring that recognizes completion, accuracy, and improvement. Results contain no rank, winner, loser, or lowest-score display and stay hidden until both students finish.
- Added five predefined encouragement reactions with no open-message field.
- Added the student Challenge tab and parent Family Challenge screen, including creation, completion status, supportive results, reactions, and student achievements.
- Added a shared role-aware workspace switcher after owner review found that admin/parent accounts had no convenient cross-workspace route. Wide screens use a left rail and narrow screens use a top row. Admin-only users see only Admin; multi-role users see only their authorized Student, Family, and/or Admin destinations.
- The first web load of the switcher hit Expo Router's `Link asChild` style contract because the direct `Pressable` received an active-state style array. The switcher now passes a `StyleSheet.flatten` result at that boundary. TypeScript, targeted ESLint, 4/4 switcher/navigation tests, and the 1,581-module web export pass after the correction.
- Reused the shared study-session component with active challenge feedback withheld until the student's set completes. Challenge attempts remain separate from normal mastery updates.

Database changes:

- Applied development-only migration `202607240025_challenge_session_mode.sql`, adding the explicit challenge session enum value.
- Applied development-only migration `202607240026_achievements_family_challenges.sql`, adding seven RLS-enabled tables, indexes, policies, award/finalization triggers, and protected creation/read/reaction RPCs.
- Added forward correction `202607240027_challenge_session_constraints.sql` after the first linked test exposed that the Checkpoint 7 practice configuration and selection-reason checks did not yet admit the new challenge mode. It permits only untimed/unpaused challenge sessions and the `challenge_shared` selection reason.
- Added forward correction `202607240028_challenge_policy_helper_grants.sql` after the next linked run showed that authenticated RLS evaluation could not execute the otherwise-correct private challenge helper. Only the two boolean policy helpers receive authenticated execute permission; all mutation/award helpers remain revoked.
- Added forward migration `202607240029_activate_reviewed_question_metadata.sql` after owner challenge setup exposed that the original pilot importer correctly created families/concepts/objectives as drafts but the review UI had no governed activation action. An approving review now activates only its linked metadata, audits that transition, and then applies the unchanged strict approval gate.
- Linked database lint caught that migration 029 had copied the pre-Checkpoint-8 `inactive` rejection status instead of the corrected `archived` value. Forward migration `202607240030_preserve_archived_rejection_status.sql` restores the established rejection branch while retaining governed metadata activation.
- At owner direction, migration `202607240031_shared_private_package_challenges.sql` removes approval as a prerequisite for the existing family pilot. Challenge options and creation now use the intersection of both selected students' access: approved questions plus drafts from an exact pilot package assigned to both. Approval remains the general-publication gate.
- Regenerated checked-in database TypeScript types. Local and remote development histories match through migration 031; linked database lint reports no schema errors. No production database, service-role client key, Storage bucket, AI service, or new environment variable was added.

Validation so far:

- Direct TypeScript check: exit 0.
- Direct ESLint check: exit 0 with no warnings or errors. CommonJS/Jest globals and generated-file exclusions are explicit in the flat configuration.
- Targeted Prettier check across application, tests, configuration, types, and documentation: exit 0.
- Jest with `--runInBand --forceExit`: exit 0 after the workspace-switcher refinement; 22 suites and 82/82 tests passed. The existing runner leaves an open handle after reporting and therefore needs `--forceExit`.
- New focused suites: 3 suites and 8/8 tests passed.
- `npm.cmd run validate:expo`: exit 0; SDK 57 public configuration resolved.
- `npx.cmd expo-doctor`: exit 0; 20/20 checks passed.
- Final `npm.cmd run export:web`: exit 0; 1,581 modules bundled to ignored `dist/web`.
- Final `npm.cmd run export:android`: exit 0; 2,017 modules bundled and a 6.1 MB Hermes bytecode bundle was written to ignored `dist/android`.
- `npx.cmd supabase migration list --linked`: exit 0; local and remote histories match through migration 031.
- `npx.cmd supabase db lint --linked --level warning`: exit 0; no schema errors.
- Final owner-linked pgTAP passed achievements/challenges 66/66, adaptive mastery 34/34, content import/review 50/50, content permissions 32/32, identity/access RLS 15/15, learning support 12/12, pilot package access 19/19, practice tests 56/56, progress/readiness 34/34, and study sessions 38/38: aggregate 356/356 passed.
- The first owner-linked Checkpoint 9 run stopped when challenge creation reached the legacy `study_sessions_practice_configuration_check`. No challenge was persisted because the pgTAP file runs in a transaction. Migration 027 corrects both that constraint and the immediately downstream selection-reason constraint. It is applied to development; histories match and linked lint reports no schema errors. The pgTAP rerun is pending.
- The next linked run reached challenge access checks and exposed the missing authenticated execute grant on `private.can_access_challenge`. Migration 028 adds the same narrow policy-helper grant pattern already used by identity, content, and study RLS. The test now asserts both challenge policy-helper grants explicitly. Migration 028 is applied; histories match and linked lint reports no schema errors.
- The following linked run reached the final persistence-award fixture and correctly rejected its test-only `achievement_fixture` selection reason. The transaction rolled back. The fixture now uses the existing allowed `basic_ordered` value; no application schema, RLS, scoring, or challenge behavior changed.
- The content import/review suite now uses draft learning metadata and adds three assertions proving that explicit approval activates the linked objective, primary concept, and exam-scoped family. The challenge suite adds one assertion proving a one-student package assignment cannot leak a draft to another student. The expected full linked aggregate after migration 031 is 360 assertions.
- After the shared-package change, TypeScript, targeted ESLint, and the full 22-suite Jest run pass with 82/82 tests. Migration 031 is applied to development and linked database lint reports no schema errors.

Known limitations and owner decisions:

- Real challenge creation requires two existing linked students with `can_manage_challenges = true` and at least three questions that are approved or belong to a private pilot package assigned to both selected students.
- The seven-day duration, supported counts, point weights, achievements, and reaction set are provisional pilot product choices.
- There is no challenge cancellation UI, notification, public competition, free-form chat, assignment/goal system, or AI behavior in this checkpoint.
- A parent-created challenge smoke test, both-student completion, delayed result reveal, and unrelated-user isolation remain to be owner-checked before this checkpoint is marked complete. Unrelated-user isolation is already covered automatically by the passing linked suite.

Additional owner-data protection:

- Added migration `202607240032_admin_student_learning_reset.sql` for the owner's
  requested pre-pilot cleanup of one student's test history. The operation previews
  exact counts by default, requires explicit confirmation and an audit reason,
  preserves the account/roles/family links/package access, and refuses to run while
  the student belongs to a shared challenge.
- Added `admin_learning_reset.test.sql` with 26 transaction-only assertions. The
  expected complete linked aggregate is now 386 assertions. Applying migration 032,
  running the linked suite, previewing Heshy's exact target, and explicitly
  confirming the reset remain owner actions.
- The first linked run passed the new reset suite 26/26. It exposed three legacy
  content-permission assertions that counted the entire persistent approved bank
  instead of their two transaction-only fixtures. Those assertions now filter the
  synthetic question IDs; RLS and content delivery behavior are unchanged.
- The next linked run passed the reset, import/review, and corrected content suites.
  Three progress assertions similarly shared the real pilot exam, so persistent
  approved questions and its catalog topic entered their totals. The progress suite
  now creates and queries a transaction-only exam for deterministic isolation; no
  progress function or application behavior changed.
- Final owner-linked pgTAP passed achievements/challenges 67/67, adaptive mastery
  34/34, admin learning reset 26/26, content import/review 53/53, content
  permissions 32/32, identity/access RLS 15/15, learning support 12/12, pilot
  package access 19/19, practice tests 56/56, progress/readiness 34/34, and study
  sessions 38/38: aggregate 386/386 passed.
- Owner preview found one active, unanswered two-student test challenge. Both
  participant sessions contained zero answers and zero attempts, so the owner
  discarded only that empty challenge/session shell and then confirmed the audited
  reset. The reset removed 24 remaining sessions, 85 attempts, 30 question-state
  rows, one topic-mastery row, and four achievement awards. Heshy's account,
  profile, student role, family links, and pilot-package assignments were preserved.

# Owner Inputs, Accounts, Credentials, and Decisions

This is the complete known input register as of Checkpoint 0. Do not paste passwords, recovery codes, access tokens, service-role keys, database passwords, or SMTP credentials into chat or tracked files. When a later checkpoint needs a secret, enter it through the local ignored environment, Supabase secrets, EAS credentials, or an approved CI secret store.

## Checkpoint 1 decisions — completed

The owner approved these defaults on 2026-07-19. No account credential was required.

- Working name: CAP Mastery.
- Package manager: npm.
- Expo slug: `cap-mastery`.
- URL scheme: `capmastery`.
- Android package: `com.chaimvaks.capmastery`.
- Visual direction: clean, encouraging navy/red study interface without official CAP marks unless authorized.
- Device approach: responsive Android phone support now; record the actual pilot phone models and Android versions before physical-device pilot testing.
- Confirm Git hosting provider, remote repository name, owner/organization, and private/public visibility. No remote is required for local Checkpoint 1.
- Git hosting, branching, commits, and tags remain owner-managed.

## Accounts eventually required

- Git host account/organization with permission to create or connect a separate CAP Mastery repository, if remote hosting is wanted.
- Expo/EAS account and a distinct EAS project for later internal Android builds; do not reuse the mySCP EAS project ID.
- Supabase account/organization able to create a distinct nonproduction CAP Mastery project at Checkpoint 2. A separate production project is recommended only near pilot release, not now.
- Four pilot user email inboxes: Chaim, Rachel, Heshy, and Avigail. Decide whether minors use individual/guardian-managed addresses and obtain appropriate consent.
- Optional later custom email/SMTP provider account if Supabase's development email delivery is insufficient.
- No OpenAI or other AI provider account/API key is needed or permitted for the non-AI pilot.

## Environment values and credentials

Client values required at Checkpoint 2, stored in ignored local/deployment environments:

- `EXPO_PUBLIC_SUPABASE_URL`: URL for the new CAP Mastery project.
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable key (or legacy anon key if the project exposes that model) for that same project.

Developer/deployment credentials that may be needed later but must never enter the client bundle or `.env.example` as real values:

- Supabase CLI access token for authenticated project linking/deployment, only if CLI remote operations are authorized.
- Supabase project reference.
- Supabase database password/connection credential for migration tooling or CI, stored only in an approved secret store.
- Supabase service-role key only if a trusted server/administrative job later truly requires it; never in Expo, never `EXPO_PUBLIC_*`, and not required for current design work.
- Git host authentication (credential manager, SSH key, or narrowly scoped token) to create/push the remote.
- Expo/EAS login or narrowly scoped automation token and platform signing credentials for later builds.
- SMTP host/user/password or provider API credential only if custom auth email delivery is selected.

Potential non-secret configuration to decide later includes `APP_ENV`, public web origin, auth redirect URLs, EAS project ID, Expo owner, and error-monitoring DSN. These will not be invented or added until their checkpoint requires them.

## Supabase actions (Checkpoint 2 or later, not performed now)

1. Select Supabase organization, billing plan, project name, region, and a strong database password; create a new CAP Mastery development project.
2. Provide local access to the project URL and publishable key through an ignored environment file or approved environment UI.
3. Decide email-confirmation behavior for pilot development and configure site URL/deep-link/web redirect allowlists for password recovery.
4. Link the Supabase CLI if used, apply CAP Mastery migrations in order, and generate TypeScript database types.
5. Run migration replay and RLS/function tests with separate student, guardian, reviewer, and admin identities before shared use.
6. Bootstrap the first administrator through an audited, documented one-time server-side procedure after the schema exists.
7. Create Heshy, Avigail, Chaim, and Rachel auth users safely; assign scoped roles and guardian links through protected procedures. Decide whether accounts are self-sign-up, invitations, or admin-created.
8. Configure custom SMTP only if chosen, then test confirmation and recovery links.
9. Create Storage buckets only when a feature requires them, with private policies and migrations/configuration under version control.
10. Before a true pilot, decide whether to create a separate production Supabase project and apply the same migrations. Do not treat the development project as production by accident.

Codex can perform CLI/configuration steps when the account is authenticated and authorization is provided. The owner must handle account creation, billing acceptance, MFA, inbox confirmations, secret entry, and decisions that require ownership judgment.

## Product/content/privacy decisions before relevant checkpoints

- Exact Billy Mitchell Leadership and Aerospace editions, courses/volumes/chapters, exam blueprint, passing-score display, time limits, and priority weak objectives.
- Authorized source documents plus proof/statement of authorization, edition/publication metadata, allowed quotation/storage approach, and whether CAP names/marks are permitted.
- A small human-reviewed CSV sample for technical import tests, followed later by sufficient reviewed coverage. Do not provide recalled protected exam items.
- Initial roles for Chaim and Rachel (parent, coach, admin combinations), guardian-link capabilities, and whether either is a content reviewer.
- Account display names and whether surnames should be stored/displayed.
- Whether student sign-up is disabled/invite-only; password requirements; email confirmation; recovery policy; account deletion/export/retention expectations; parental consent and privacy notice.
- Student exam focus assignments and which content is available versus explicitly assigned.
- Challenge rules: participants, duration, results reveal behavior, scoring weights for score/improvement/completion, predefined encouragement set, and feature default.
- Confidence prompt frequency, daily/streak timezone, session sizes, pause policy, practice-test timer/blueprint, mastery/readiness coefficient review, and acceptable readiness language.
- Achievement names/thresholds and wording review to ensure supportive motivation.
- CSV controlled hierarchy-creation policy, required reviewer count, approval authority, versioning threshold, question-report workflow, and audit retention.

Checkpoint 8 requires no new account, environment variable, credential, Supabase Storage action, AI service, or production database. The development migrations must be applied and the linked pgTAP suite must be run with the existing process-scoped database password. An existing administrator can use the reviewer workspace; creating a dedicated `content_reviewer` account remains optional. Before real publication, the owner must still confirm source authorization, the controlled hierarchy codes, review authority/count, and retention policy.
- Pilot success thresholds, feedback collection method, support contact, backup/restore expectations, data retention, incident contact, and go/no-go approval.
- Web admin hosting and Android distribution choice for pilot; later error-monitoring provider and privacy configuration.

## Checkpoint 1 manual action

No secret, account creation, Supabase action, or production database action is required to review the shell. Before Checkpoint 2, choose/create the separate CAP Mastery development Supabase project and decide the pilot email-confirmation/account-creation approach. Do not create a production database yet.

## Checkpoint 2 setup status

Completed by the owner on 2026-07-20: created the separate nonproduction CAP Mastery Supabase project. Dashboard security choices are Data API enabled, automatic new-table exposure disabled, and automatic RLS enabled.

Approved development authentication defaults: invitation/admin-created accounts only, public email sign-up disabled, email confirmation enabled, password recovery enabled, and passwords at least 10 characters with letters and numbers. Local redirect targets are `http://localhost:8081/reset-password` and `capmastery://reset-password`; equivalent hosted dashboard redirect allowlists must be configured before recovery testing.

Completed by the owner and Codex:

1. Authorized the repository-local CLI and linked only the CAP Mastery development project.
2. Entered the project URL and publishable key in ignored `.env.local`; no privileged key was added to the client.
3. Applied all three Checkpoint 2 migrations and generated types from the hosted development schema.
4. Created confirmed development administrator and student Auth users and assigned their initial roles using `docs/AUTH_BOOTSTRAP.md`.
5. Verified administrator and student sign-in, student rejection from the admin route, administrator access to the admin route, and sign-out.

Remaining later-pilot configuration: exercise a real password-recovery email/deep link on the chosen Android and web targets, configure production-ready SMTP if Supabase development delivery is insufficient, and record retention/consent decisions before collecting pilot data.

No production project, Storage bucket, service-role client configuration, AI provider, or real content is required or authorized in Checkpoint 2.

## Checkpoint 3 content inputs

The development database now has the Leadership/Aerospace catalog and protected question workflow, but no real source or question rows. Before the separate content-development workflow imports its first manually reviewed sample bank, the owner must provide:

1. A written authorization decision for each source: exact title/edition/publication date, whether CAP Mastery may use it, whether full passages may be stored or only citations, and whether the two untracked workspace PDFs are authorized inputs. Codex will not infer authorization from file presence.
2. A small human-written and human-reviewed sample bank in the documented CSV shape (recommended minimum: three questions per track for a meaningful permission/browser smoke test). Do not provide recalled or protected exam items.
3. The reviewer/approver identity for the sample. An existing administrator can approve; assigning a separate `content_reviewer` is optional.
4. Confirmation of the exact volume/chapter/section/topic/objective mapping and source page/reference for each sample question.

No service-role key, production database, Storage bucket, AI API, or new account is needed. The database password is used only as a process-scoped value when the owner runs linked pgTAP and must not be pasted into chat or saved in the repository.

## Checkpoint 4 manual validation boundary

The owner authorized the supplied ten-question Chapter 1 sample for draft import on 2026-07-20. No PDF was opened or imported. The objective and concept files provide codes but not titles, so the importer uses the stable codes as temporary draft titles; a later reviewed metadata package may enrich them without changing the schema.

The linked development migration is applied. Import and SQL tests require the database password, which Codex cannot read and which must remain outside Git and chat. In a PowerShell process where `CAP_MASTERY_DB_PASSWORD` is set temporarily, run:

```powershell
npm run content:import:pilot10
npm run db:test:linked
Remove-Item Env:CAP_MASTERY_DB_PASSWORD
```

After a successful import, an authenticated administrator must assign `LTL1_C1_PILOT_10` to each intended student through `admin_set_pilot_package_assignment`. The student and administrator UUIDs/emails remain untracked owner data. Do not assign the package broadly; draft questions remain hidden from all unassigned students.

The owner confirmed the initial import (10 inserted) and idempotency run (10 updated, 0 inserted), followed by 101/101 passing linked pgTAP assertions. The private package was assigned through the audited administrator function, and the owner confirmed that the imported questions worked in the web Study flow. Checkpoint 4 manual acceptance is complete.

For the 2026-07-21 learning-support update, migration `202607210014` is applied to development. The owner must rerun `npm.cmd run content:import:pilot10` with the process-only database password to update the same ten drafts from `LTL_V1_Chapter_1_Pilot_10_Questions_Complete_Learning_Support.csv`, then run linked pgTAP. No visual files were supplied: all ten visual metadata records should warn and remain hidden. Approved image files, dimensions, MIME types, and an explicit approval decision are required before visual controls can become student-visible.

The owner confirmed the expanded linked database suite passes 116/116. Persistent import output and student web acceptance of the Memory trick and Explain more controls remain to be confirmed.

The complete learning-support import subsequently committed with the expected 24 nonfatal warnings (14 future reinforcement links and 10 missing visual assets). Student web acceptance remains pending. No approved visual file is currently available or displayed.

Owner web acceptance is complete for short feedback, Memory trick, Explain more, hidden unavailable visuals, and preservation of an active session across app focus and Home/Progress tab changes. The remaining manual input for visuals is a reviewed set of actual image files plus approval metadata; no visual should be shown until those assets are supplied and approved.

## Checkpoint 5 manual validation boundary

Migration `202607210016` is applied to the linked development project and requires no new account, credential, environment variable, Storage bucket, service-role key, production database, or AI provider. The owner-executed linked database suite passed 150/150, including 34/34 adaptive-mastery assertions. The initial mastery coefficients are explicit pilot defaults; coefficient tuning should wait for broader evidence and a documented owner decision rather than being inferred from only Heshy and Avigail.

The supplied adaptive 30-question bank reuses the existing `LTL1_C1_PILOT_10` private package identifier so already assigned pilot students receive the additional 20 questions without another access mutation. The owner completed the persistent import with the expected 32 nonfatal warnings and the post-import linked database suite passed 150/150. No new Supabase assignment, account, environment variable, or further database action is required.

## Checkpoint 6 manual validation boundary

Migration `202607210017` is applied to the linked development project. No new credential, environment variable, service-role key, Storage bucket, production database, AI provider, or content import is required. The database password is needed only as a process-scoped value for the owner-run linked pgTAP suite.

Student validation can use an existing assigned pilot account. A real family-dashboard smoke test additionally requires an existing adult account with the global `parent` or `coach` role and active `student_guardian_links` rows with `can_view_progress = true` for the intended students. Those identities and relationship decisions are owner data; do not create or broaden links merely to make the interface display data.

## Checkpoint 7 manual validation boundary

Migrations `202607220019`–`202607220022` are applied only to the linked development project. No new account, credential, environment variable, service-role key, Storage bucket, content import, production database, or AI provider is required. The database password is needed only as the existing process-scoped `CAP_MASTERY_DB_PASSWORD` for the owner-run linked pgTAP suite.

The ten-question, optional 15-minute, no-pause Chapter 1 configuration is a provisional product decision for pilot validation. Before broader use, the owner must approve or replace its question count, time limit, pause policy, and difficulty/cognitive distribution using an authorized exam blueprint. It must not be labeled an official simulation until that review occurs.

## Checkpoint 9 manual validation boundary

No new account, credential, environment variable, service-role key, Storage bucket, production database, AI provider, or content import is required.

The Vercel project must redeploy after changes to the checked-in `vercel.json`.
That configuration exports to `dist/web` and rewrites refreshed nested Expo Router
paths to the single-page root. The existing Vercel Supabase URL and publishable
key remain build-time environment variables.

To create a real family challenge, the existing adult account must have the global `parent` or `coach` role. Both intended student accounts must have active `student_guardian_links` to that adult with `can_manage_challenges = true`. At least three questions in the chosen exam must either be reviewed as `approved`/`active` or belong to the exact private pilot package assigned to both selected students.

The database password remains necessary only as process-scoped `CAP_MASTERY_DB_PASSWORD` for the owner-run linked pgTAP suite. Do not save it in `.env.local`, source files, Git, or chat.

The provisional pilot decisions are: exactly two students, a seven-day duration, selectable sets of 3/5/10/15/20 approved questions, and positive points weighted as completion 40, accuracy up to 40, and improvement up to 20. The five reactions are Great effort, Keep going, Proud of you, Nice comeback, and Team spirit. The owner should approve or revise these product choices before broader deployment.

### Volume 2 Chapter 4 private content package

The supplied `LTL_V2_Chapter_4_75_Questions_Complete_Support.csv` is imported only
to the linked development project with `npm.cmd run content:import:ltl2c4`.
Migration `202607240033` must be applied first. The importer validates all 75 rows,
upserts by `external_id`, skips approved records, and forces imported content to
remain draft inside private package `LTL2_C4_75`.

No new account, environment variable, service-role key, Storage bucket, production
database, AI API, or image file is required. The existing database password remains
process-only. All 75 visual metadata records should warn and remain hidden until
separately approved assets exist.

After import, an administrator must explicitly assign `LTL2_C4_75` only to the
intended pilot students through `admin_set_pilot_package_assignment`. The owner
must decide whether both Heshy and Avigail receive it. Before broader use, review
the answer-position imbalance (A 10, B 58, C 7, D 0); the importer intentionally
does not rewrite supplied answers or distractors.

### Volume 2 Chapter 5 private content package

The supplied `LTL_V2_Chapter_5_75_Questions_Complete_Support.csv` is imported only
to the linked development project with `npm.cmd run content:import:ltl2c5`.
Migration `202607240033` already supplies the required schema. The importer
validates all 75 rows, upserts by `external_id`, skips approved records, and forces
imported content to remain draft inside private package `LTL2_C5_75`.

The existing database password is required only in the importing PowerShell
process. No new account, environment variable, service-role key, Storage bucket,
production database, AI API, or image file is required. All 75 visual controls
remain hidden until independently approved assets are registered.

After import, an administrator must explicitly assign `LTL2_C5_75` only to the
intended pilot students through `admin_set_pilot_package_assignment`. Assignment
to Heshy, Avigail, or both remains an owner decision. The supplied answer
positions are A 21, B 30, C 20, and D 4; import preserves them unchanged.

### Volume 2 Chapter 6 private content package

The supplied `LTL_V2_Chapter_6_75_Questions_Complete_Support.csv` is imported only
to the linked development project with `npm.cmd run content:import:ltl2c6`.
Migration `202607240033` already supplies the required schema. The importer
validates all 75 rows, upserts by `external_id`, skips approved records, and forces
imported content to remain draft inside private package `LTL2_C6_75`.

No new account, migration, environment variable, service-role key, Storage bucket,
production database, AI API, or image file is required. The existing database
password remains process-only. Expect 75 missing-visual warnings plus one
answer-key coverage warning because D is not correct for any supplied row.

After import, an administrator must explicitly assign `LTL2_C6_75` through
`admin_set_pilot_package_assignment`. The owner requested the same pilot access as
Chapter 5: Heshy and Avigail only.

### Volume 2 Chapter 7 private content package

The supplied `LTL_V2_Chapter_7_75_Questions_Complete_Support.csv` is imported only
to the linked development project with `npm.cmd run content:import:ltl2c7`.
Migration `202607240033` already supplies the required schema. Import validates 75
rows, upserts by `external_id`, skips approved records, and forces imported content
to remain draft inside private package `LTL2_C7_75`.

No new account, migration, environment variable, service-role key, Storage bucket,
production database, AI API, or image file is required. The existing database
password remains process-only. Expect 75 missing-visual warnings and one
answer-key balance warning because A is correct for 46 of 75 supplied rows.

After import, an administrator must explicitly assign `LTL2_C7_75` through
`admin_set_pilot_package_assignment`. The owner requested the same pilot access as
Chapter 6: Heshy and Avigail only.

### Volume 2 Chapter 8 private content package

The supplied `LTL_V2_Chapter_8_75_Questions_Complete_Support.csv` is imported only
to the linked development project with `npm.cmd run content:import:ltl2c8`.
Migration `202607240033` already supplies the required schema. Import validates 75
rows, upserts by `external_id`, skips approved records, and forces imported content
to remain draft inside private package `LTL2_C8_75`.

No new account, migration, environment variable, service-role key, Storage bucket,
production database, AI API, or image file is required. The existing database
password remains process-only. Expect 75 missing-visual warnings and no
answer-position warning; supplied positions are A 20, B 20, C 17, and D 18.

After import, an administrator must explicitly assign `LTL2_C8_75` through
`admin_set_pilot_package_assignment`. Consistent with Chapters 6–7, the intended
pilot students are Heshy and Avigail only.

### Resetting pre-pilot student learning history

Migration `202607240032` provides a narrow reset for test history. It preserves the
Auth account, profile, roles, guardian links, and pilot-package assignments. It
deletes study/practice sessions and attempts, question state, topic mastery, and
earned achievements. A shared challenge blocks the reset and must be resolved
separately so another student's history is not affected.

Run a preview first in the development Supabase SQL Editor, replacing both email
placeholders with the real addresses:

```sql
begin;
select set_config(
  'request.jwt.claim.sub',
  (
    select id::text
    from auth.users
    where lower(email) = lower('ADMIN_EMAIL_HERE')
  ),
  true
);
select public.admin_reset_student_learning_progress(
  (
    select id
    from auth.users
    where lower(email) = lower('HESHY_EMAIL_HERE')
  ),
  'Remove pre-pilot testing history',
  false
);
rollback;
```

Verify the returned `student_id` and counts. If `blocked` is `false`, repeat the
same transaction with the final argument changed to `true` and replace `rollback`
with `commit`. This deletion is not reversible from the application.

### Chapters 4–8 combined final-exam bank

No new account, API key, environment variable, Storage bucket, service-role key,
AI service, or production database is required. Apply migration
`202608020034_mitchell_full_practice_exam.sql` to the linked development project,
then import the combined file once. Do not also import chapter-specific 100-row
files containing the same records.

```powershell
$env:CAP_MASTERY_DB_PASSWORD = Read-Host "Development database password"
npx.cmd supabase db push --linked
npm.cmd run content:import:mitchell500
npm.cmd run db:test:linked
Remove-Item Env:CAP_MASTERY_DB_PASSWORD -ErrorAction SilentlyContinue
```

### Study-session chapter and topic labels

Migration `202608020036_study_session_question_context.sql` was applied to the
linked development project and the linked suite passed 426/426. No further setup
is required before checking the chapter/title/topic banner for assigned draft
questions. It added no account, secret, environment variable, table, Storage
resource, or production dependency.

```powershell
$env:CAP_MASTERY_DB_PASSWORD = Read-Host "Development database password"
npx.cmd supabase db push --linked
npm.cmd run db:test:linked
Remove-Item Env:CAP_MASTERY_DB_PASSWORD -ErrorAction SilentlyContinue
```

The importer preserves the stable Chapter 4–8 package identifiers, so students
already assigned all five chapter packages automatically receive the 25 added
questions per chapter. Verify Heshy and Avigail each still have assignments for
`LTL2_C4_75` through `LTL2_C8_75`; a missing chapter assignment causes final-exam
creation to fail safely rather than leaking another package.

### Final-test review and Progress follow-up

Apply migration `202608020035_latest_practice_topic_progress.sql` before checking
the revised results or Progress page. It adds no account, secret, environment
variable, table, or production dependency.

```powershell
$env:CAP_MASTERY_DB_PASSWORD = Read-Host "Development database password"
npx.cmd supabase db push --linked
npm.cmd run db:test:linked
Remove-Item Env:CAP_MASTERY_DB_PASSWORD -ErrorAction SilentlyContinue
```

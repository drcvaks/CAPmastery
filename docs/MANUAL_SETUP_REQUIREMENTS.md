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

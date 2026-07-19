# CAP Mastery Agent Instructions

CAP Mastery is a standalone Expo/React Native and Supabase application. Read `CAP_Mastery_Codex_Build_Plan.md` and the applicable files in `docs/` before changing the project.

## Non-negotiable rules

- Work on one checkpoint at a time and stop after it. Do not begin the next checkpoint without explicit instruction.
- Inspect existing code before editing it; keep `docs/CHECKPOINT_LOG.md` and affected documentation current.
- Treat `C:\Users\Family\ws\mySCPcodex` as read-only. Never copy its secrets, identifiers, production data, or product-specific code blindly.
- CAP Mastery must have its own Git repository, Supabase project, environment values, application identifiers, and deployment configuration.
- Never commit secrets. Client configuration may use only the Supabase project URL and publishable/anon key. Never put a service-role key in Expo code or any `EXPO_PUBLIC_*` variable.
- Make database changes through versioned migrations. Enable and test Row Level Security on every API-exposed table.
- Grade answers in a secure PostgreSQL function or Edge Function. Never let the client write correctness and never expose answer keys before submission.
- Do not add an AI API until the non-AI pilot is stable and a later checkpoint explicitly authorizes it.
- Use only authorized sources and original or approved questions; never collect recalled protected CAP exam questions.
- Ask Chaim for manual work only when it cannot safely be performed from this workspace.

## Architecture constraints

- Keep route files thin and put domain behavior under `features/`.
- Put Supabase access behind typed modules in `services/` and `lib/supabase/`; do not scatter queries across screens.
- Keep deterministic adaptive, mastery, spaced-review, readiness, CSV-validation, and duplicate-detection logic pure and unit tested.
- Enforce authorization in the database. Client route guards and hidden navigation are usability measures, not security boundaries.
- Prefer small reusable accessible components over monolithic screens or a single global application-state provider.
- Use TypeScript strict mode, Zod at trust boundaries, React Hook Form for nontrivial forms, and TanStack Query for server state if confirmed at Checkpoint 1.

## Documentation map

- Product scope: `docs/PRODUCT_REQUIREMENTS.md`
- Proposed system design: `docs/ARCHITECTURE.md`
- Data plan: `docs/DATABASE.md`
- Security and RLS: `docs/SECURITY_AND_PERMISSIONS.md`
- Adaptive behavior: `docs/ADAPTIVE_ENGINE.md`
- Content rules: `docs/QUESTION_CONTENT_STANDARD.md`
- Quality gates: `docs/TESTING.md`
- Checkpoint history: `docs/CHECKPOINT_LOG.md`
- Deferred AI design: `docs/FUTURE_AI_INTEGRATION.md`
- mySCP audit: `docs/MYSCP_REUSE_REPORT.md`
- Required owner inputs: `docs/MANUAL_SETUP_REQUIREMENTS.md`

## Checkpoint completion report

For every checkpoint, report completed work, files changed, database changes, exact checks and results, known limitations, exact manual actions, and the recommended next checkpoint. A checkpoint is complete only when applicable types, lint, tests, Expo validation, migrations/RLS checks, and documentation have been addressed honestly.

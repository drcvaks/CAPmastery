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

Checkpoint 1 includes a component contract test and a Router navigation test. Browser smoke testing verifies landing, student, and admin routes. A production bundle validates Metro/Hermes compilation but does not replace a later physical-device test.

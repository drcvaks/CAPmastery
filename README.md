# CAP Mastery

CAP Mastery is a planned Android-first Expo application, with responsive web administration, that helps Civil Air Patrol cadets prepare for milestone examinations through adaptive study, explanations, progress tracking, and supportive private competition.

The repository is implementing **Checkpoint 9: Achievements and Family Challenge**. The development project includes evidence-backed achievements, private two-student challenges with identical approved question sets, predefined encouragement, delayed supportive results, and progress-based scoring without public rankings. No production database exists.

## Repository boundaries

- This is a standalone Git repository.
- The mySCP repository is an inspected, read-only reference; it is not a dependency or submodule.
- CAP Mastery will use a new Supabase project and distinct environment values.
- No production database has been initialized.

## Planned structure

```text
app/                    Thin Expo Router routes and layouts
components/             Reusable presentational components
features/               Domain modules and feature-specific UI/hooks
hooks/                  Cross-feature hooks
lib/                    Infrastructure, validation, constants, utilities
services/               Typed backend access boundary
supabase/migrations/    Versioned SQL migrations
supabase/seed/          Development-only seed assets
supabase/functions/     Edge Functions only when justified
tests/                  Cross-feature and integration tests
types/                  Shared application types
docs/                   Product, architecture, security, and runbooks
```

Some later-checkpoint directories still contain `.gitkeep` placeholders only.

## Local development

Requirements: Node `>=22.13.0` and npm. The Expo application was validated with Node `v24.15.0`, npm `11.12.1`, and Expo SDK 57. Database replay additionally requires Docker Desktop or a linked nonproduction Supabase project.

```powershell
npm install
npx supabase login --name cap-mastery-codex
npm start
```

Useful commands:

```powershell
npm run check
npm run validate:expo
npx expo-doctor
npm run export:web
npm run export:android
npm run db:reset
npm run db:test
npm run db:lint
npm run content:import:pilot10
npm run content:import:adaptive30
npm run content:import:ltl2c4
npm run content:import:ltl2c5
npm run content:import:ltl2c6
npm run content:import:ltl2c7
npm run content:import:ltl2c8
npm run content:import:mitchell500
npm run db:test:linked
```

Add the separate CAP Mastery development project URL and publishable key to ignored `.env.local`. With no valid client configuration, the app shows a safe setup screen rather than attempting a connection. Authenticated users are routed by database roles; client routing is not the authorization boundary.

The physical Expo Go version currently available to the owner is incompatible with SDK 57. SDK 57 is intentionally retained; use web/production export checks for now and revisit Expo Go or a development build before physical-device testing.

Vercel uses the checked-in `vercel.json` to build `dist/web` and rewrite every
direct or refreshed application route to the single-page entry point. Keep the
Supabase URL and publishable key in Vercel environment variables; never add a
service-role key.

## Documentation

Begin with [AGENTS.md](AGENTS.md), then read [the architecture](docs/ARCHITECTURE.md), [the mySCP reuse audit](docs/MYSCP_REUSE_REPORT.md), [security requirements](docs/SECURITY_AND_PERMISSIONS.md), and [the checkpoint log](docs/CHECKPOINT_LOG.md).

## Local status

Expo SDK 57, React Native 0.86, React 19.2, TypeScript 6, Expo Router, Supabase JS, AsyncStorage, React Hook Form, Zod, TanStack Query, Jest, React Native Testing Library, ESLint, Prettier, and the repository-local Supabase CLI are pinned through `package-lock.json`.

## Secrets

The ignored `.env.local` contains only client-safe placeholders until the owner enters the development project URL and publishable key. Never commit credentials or place a service-role key in a client-visible variable.

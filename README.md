# CAP Mastery

CAP Mastery is a planned Android-first Expo application, with responsive web administration, that helps Civil Air Patrol cadets prepare for milestone examinations through adaptive study, explanations, progress tracking, and supportive private competition.

The repository has completed **Checkpoint 1: Expo application skeleton**. It contains a dependency-free-from-Supabase shell with auth, student, and admin route groups, shared responsive components, an error boundary, and automated quality checks. Product behavior and backend integration remain intentionally deferred.

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

Unimplemented planned directories contain `.gitkeep` placeholders only.

## Local development

Requirements: Node `>=22.13.0` and npm. This checkpoint was validated with Node `v24.15.0`, npm `11.12.1`, and Expo SDK 57.

```powershell
npm install
npm start
```

Useful commands:

```powershell
npm run check
npm run validate:expo
npx expo-doctor
npm run export:web
npm run export:android
```

The landing page links to placeholder auth, student, and admin shells. No account or environment value is required yet.

## Documentation

Begin with [AGENTS.md](AGENTS.md), then read [the architecture](docs/ARCHITECTURE.md), [the mySCP reuse audit](docs/MYSCP_REUSE_REPORT.md), [security requirements](docs/SECURITY_AND_PERMISSIONS.md), and [the checkpoint log](docs/CHECKPOINT_LOG.md).

## Local status

Expo SDK 57, React Native 0.86, React 19.2, TypeScript 6, Expo Router, Jest, React Native Testing Library, ESLint, and Prettier are pinned through `package-lock.json`. Supabase, React Hook Form, Zod, and TanStack Query are intentionally not installed until the checkpoint that uses them.

## Secrets

Copy `.env.example` to an ignored `.env.local` only after a separate CAP Mastery Supabase project exists. Never commit credentials or place a service-role key in a client-visible variable.

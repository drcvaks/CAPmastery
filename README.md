# CAP Mastery

CAP Mastery is a planned Android-first Expo application, with responsive web administration, that helps Civil Air Patrol cadets prepare for milestone examinations through adaptive study, explanations, progress tracking, and supportive private competition.

The repository is currently at **Checkpoint 0: repository and architecture planning**. It intentionally contains no application implementation, dependency manifest, database migrations, or live backend connection yet.

## Repository boundaries

- This is a standalone Git repository.
- The mySCP repository is an inspected, read-only reference; it is not a dependency or submodule.
- CAP Mastery will use a new Supabase project and distinct environment values.
- No production database has been initialized.

## Planned structure

```text
app/                    Expo Router routes (from Checkpoint 1)
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

Empty planned directories contain `.gitkeep` placeholders only. They are not implemented features.

## Documentation

Begin with [AGENTS.md](AGENTS.md), then read [the architecture](docs/ARCHITECTURE.md), [the mySCP reuse audit](docs/MYSCP_REUSE_REPORT.md), [security requirements](docs/SECURITY_AND_PERMISSIONS.md), and [the checkpoint log](docs/CHECKPOINT_LOG.md).

## Local status

Checkpoint 0 confirmed Node `v24.15.0`, npm `11.12.1`, Git `2.46.2.windows.1`, and the installed mySCP Expo CLI `54.0.25`. The CAP Mastery Expo SDK and supported Node version will be pinned during Checkpoint 1; Node 24 should not be assumed compatible until Expo validation passes.

## Secrets

Copy `.env.example` to an ignored `.env.local` only after a separate CAP Mastery Supabase project exists. Never commit credentials or place a service-role key in a client-visible variable.

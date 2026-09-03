# Backup, Migration, and Restore Runbook

## Before a migration

1. Confirm the target project reference; never infer development versus production.
2. Commit migrations and tests, run local checks, and run linked schema lint/migration status.
3. Create a Supabase dashboard backup or platform-supported database backup appropriate to the plan. Record timestamp, project, retention, encryption/location, and operator without storing credentials in the repository.
4. Export irreplaceable reviewed content metadata through an authorized admin/database process. Keep private answers and child learning records encrypted with restricted access; do not use spreadsheets as the only backup.

## Apply and verify

Use the repository-local CLI from the workspace: `npx.cmd supabase db push`, then `npm.cmd run db:test:linked`. Treat Docker catalog-cache warnings separately from the migration result, but never ignore authentication or SQL failures. Run the app smoke checklist after database tests.

Migrations are forward-only. If an applied change is wrong, stop writes, preserve evidence/backup, and create a reviewed corrective migration. Do not edit an already-applied migration, delete migration-history rows, or use destructive reset commands against a shared project.

## Restore rehearsal

At least once before pilot collection, restore the backup into a new disposable Supabase project with no real outbound email. Apply any migrations newer than the backup, run the full pgTAP suite, point a temporary local client at the disposable project using its own publishable configuration, and verify representative admin/student/guardian flows and record counts. Destroy the disposable project through the dashboard after the owner confirms the rehearsal record.

## Incident restore

Pause pilot access, record the incident time and last known good point, preserve the affected database, select the owner-approved recovery point, restore to a new project when practical, apply migrations, test isolation/grading/content counts, rotate exposed credentials, update deployment configuration, and obtain owner go/no-go approval. Notify affected families according to the finalized privacy/incident policy.

Supabase plan capabilities and point-in-time retention can change; verify the current dashboard/plan at the time of release. No automated backup job is configured by this repository.

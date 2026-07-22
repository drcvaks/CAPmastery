# Database Plan

## Principles

- A new CAP Mastery Supabase project; never connect to mySCP.
- UUID primary keys, timestamps, explicit status values, constraints, indexes, and foreign keys.
- Version-controlled migrations under `supabase/migrations/`; development seed material under `supabase/seed/`.
- RLS on every API-exposed table and grants reviewed alongside policies.
- Soft deletion/status for durable content and version snapshots for approved-question edits.
- Generated TypeScript database types checked into the repository after migrations are established.

## Checkpoint 2 identity/access schema

- `profiles`: one trigger-created profile per Auth user; users may update only their own display fields.
- `user_roles`: normalized global or organization-scoped roles; no direct client writes.
- `student_guardian_links`: explicit capability flags and active/inactive state; no direct client writes.
- `organizations` and `organization_memberships`: future-ready access scope; read only by members or administrators.
- `audit_log`: append-only safe summaries; readable only by administrators.
- `private.has_role` and `private.can_view_profile`: non-exposed security-definer policy helpers with empty `search_path`.
- `admin_set_user_role` and `admin_set_guardian_link`: authenticated but internally admin-authorized, audited mutation entrypoints.

All primary keys are UUIDs except the identity audit sequence. Enums and checks constrain status, role, scope, organization type, and relationship state. Foreign keys use deliberate cascade, restrict, or null behavior.

## Checkpoint 3 content schema

- Curriculum is normalized as programs, exams, courses, optional volumes, chapters, sections, topics, and learning objectives. Validation triggers reject inconsistent cross-level links.
- `source_documents` records authorization and publication metadata. Full source passages are stored only in `private.source_passages`, which has no client grants.
- Concepts, objective/concept relationships, nested subsections, question families, purposes, concept tags, and reinforcement links implement the content-development plan's traceability model. Private tutor notes have no direct client grants.
- Public question rows contain prompts and delivery metadata only. Public choices contain text and ordering only; neither table has a correctness column.
- `private.question_answer_keys` and `private.question_choice_feedback` hold correctness and post-submission teaching material with no client table grants.
- Question versions, quality reviews, reports, approval metadata, constraints, and indexes support a human-reviewed workflow.
- `reviewer_approve_question` requires an authorized active source, objective, valid choice count, private answer/explanation, and approving quality review. Approved questions and choices cannot be edited directly.
- `get_approved_questions` is a security-invoker, RLS-filtered student projection containing only approved prompts, choices, and source references.

## Later domains

- Study later work: readiness calculations, progress trends, and practice-test evidence.
- Coaching/motivation: assignments, goals, achievements, private challenges, participants/results, and predefined encouragements.
- Operations: CSV import jobs, audit log, and feature flags.

Hierarchy links are nullable where an exam omits a level. Study, coaching, and operational schemas remain proposals until their checkpoints.

## Secure grading transaction

The `submit_answer` function accepts a session-question ID, selected choice, response time, and optional confidence. It authenticates the caller; verifies student/session/question ownership; prevents duplicate or invalid submission; finds the protected correct choice; inserts the attempt with server-computed correctness; updates session counters and mastery atomically; and returns only post-submission feedback.

Clients cannot select answer-key columns or write `question_attempts.is_correct`. Practice tests defer returned explanations until session completion.

## Checkpoint 4 study schema

- `study_sessions` owns status, requested/question/answered/correct counts, timestamps, exam/topic scope, and completion invariants.
- `study_session_questions` snapshots question membership, order, selection reason, and approved question version.
- `question_attempts` stores one server-created answer per session question, including server-computed correctness, response time, optional confidence, and submission time.
- Clients have owner-filtered select access only. Session creation and answer submission occur through protected functions with explicit authentication and student ownership checks.
- `get_study_session_questions` returns prompts and choices for the owner, but answer/explanation fields remain null until that specific session question has an attempt.
- `submit_answer` locks the session, rejects choice/question substitution, is idempotent for a repeated identical choice, rejects changed duplicates, and completes/scorers the session atomically.
- Imported questions use nullable-but-unique `external_id` values so existing test fixtures remain compatible while every real import is required to provide a stable key. Pilot batch, import package, source status, supplied family code, objective/concept codes, page range, difficulty, cognitive level, and estimated time are retained in normalized storage.
- `pilot_package_assignments` grants a student access to a named draft import package without publishing its questions. `create_study_session` may select draft content only when the current student has that exact package assignment.
- The Chapter 1 importer writes choices, correctness, main explanation, per-choice explanations, misconception, and remediation to the existing protected normalized tables. Re-import updates draft rows by `external_id`, skips approved rows, and creates reinforcement links only when both external IDs exist.
- `private.question_learning_support` stores the reviewed short explanation, display-rule version, memory aid, and visual metadata. `visual_brief` remains internal and no learning support is delivered before an answer attempt.
- `private.visual_assets` is a separate approval registry for actual image files. Importing a question's visual metadata does not create or approve an asset; student delivery returns visual fields only for an approved registered asset.

## Checkpoint 5 mastery and adaptive schema

- `student_question_state` stores owner-scoped times seen/correct, correct and incorrect streaks, last result/time, next review, ease factor, interval, and learning state. Incorrect answers schedule one day; correct streaks schedule 2, 5, 10, then expanding intervals capped at 60 days.
- `student_topic_mastery` begins at 40 with zero confidence and stores attempt totals, recent accuracy, deterministic 0–100 mastery/confidence/retention scores, streaks, review time, and status.
- Both tables have RLS, owner-only select policies, and no authenticated write grants. Only the protected answer transaction writes them.
- `submit_answer` updates question and topic state only when inserting the first attempt. A same-choice retry does not update mastery again.
- `create_study_session` records adaptive selection reasons, applies the standard ten-question bucket targets, falls back deterministically when a bucket is exhausted, deprioritizes questions seen in the last 12 hours, and preserves the existing explicit sparse-bank error.
- A miss labels one already-scheduled later question on the same objective as `same_session_remediation` when available. It does not insert an extra question or repeat the missed wording inside the session.

## Migration workflow

Checkpoint 4 migration `202607200013` adds import identity/provenance fields and private pilot package assignments. The import itself is deliberately an idempotent operator action, not a migration, so replaying migrations never inserts licensed or reviewable question content automatically.

Post-Checkpoint 4 migration `202607210014` adds the private learning-support and visual-asset tables and extends owned session delivery with post-attempt-only short feedback, memory aids, and approved-visual metadata. No production database or Storage bucket is created.

Checkpoint 5 migration `202607210016` adds the two mastery tables, status enums, indexes, RLS policies, deterministic server helpers, adaptive session composition, and atomic mastery updates. It changes only the linked development project; no production database is initialized.

1. Develop against a local Supabase stack when available or a dedicated nonproduction CAP Mastery project.
2. Add ordered migration files and SQL tests in the same change.
3. Reset/replay migrations against a disposable database.
4. Generate types from the resulting schema.
5. Apply to shared environments only after review and record the result in `CHECKPOINT_LOG.md`.

Checkpoint 3 adds seven forward migrations (`202607200004` through `202607200010`) for hierarchy, question storage, RLS/delivery functions, a catalog-only seed, approval/integrity hardening, learning metadata, and strict metadata/feedback approval gates. The seed contains track names and explicit pending-content placeholders only—no source text, questions, answers, scores, or timing claims. SQL tests use synthetic transaction-only content and roll it back.

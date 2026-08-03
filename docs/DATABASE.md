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

- Study later work: practice-test evidence.
- Coaching/motivation later work: assignments and goals.
- Operations: CSV import jobs, audit log, and feature flags.

Checkpoint 8 adds `csv_import_jobs` for safe import summaries, row-level errors, and warnings. `reviewer_import_question_csv` validates the entire payload before writing any question, forces accepted rows to draft, and records an audited job. `private.question_content_snapshot` captures the complete approved question, choices, answer feedback, and learning support before approval or an approved edit. Reviewer save and decision functions are the only supported mutation path; editing approved content creates the next draft version instead of rewriting history.

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
- The adaptive 30-row extension uses the same transactional importer and existing private package assignment. Rows without reviewed short/memory/visual support omit the optional private learning-support row; delivery falls back to the protected main explanation after submission.
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

## Checkpoint 6 progress projections

Migration `202607210017` adds no client-writable progress table. It adds a private self-or-active-guardian authorization helper, private readiness helpers, and four authenticated RPCs: `get_progress_students`, `get_progress_dashboard`, `get_topic_progress`, and `get_progress_trends`.

Dashboard coverage uses all questions the target student may actually study, including a draft package assigned to that exact student. Trends are UTC daily aggregates over a validated 7–180 day window. Retention is recalculated from stored mastery evidence at read time. Function execution is granted only to authenticated users, with explicit UUID authorization inside every target-specific function.

## Checkpoint 7 practice-test schema

Migrations `202607220019`–`202607220021` add the `practice_test` session mode, blueprint and blueprint-rule tables, immutable session timing/pause snapshots, and protected practice-test RPCs. Blueprint rules define exact difficulty/cognitive strata whose totals must equal the blueprint question count; creation fails rather than silently producing an unbalanced test.

Active practice delivery returns prompts and choices but nulls correctness, answer keys, explanations, learning support, and aggregate scores. `submit_answer` still grades and stores the attempt on the server, but its active-test response is neutral. `complete_practice_test` releases only submitted-answer feedback; unanswered items remain protected. `get_practice_test_results` provides owned completed-session score and topic analysis.

The readiness wrapper keeps ordinary recent accuracy and trends limited to `study` sessions, adds the mean of the last three completed practice tests as a separate 25% component, and applies the existing evidence caps. Coverage is the distinct union of normal mastery state and all server-recorded attempts. Practice sessions do not update `student_question_state` or `student_topic_mastery`. Forward correction `202607220022` preserves legacy mastery-state coverage while adding practice-attempt coverage.

## Checkpoint 9 achievements and challenges

Migrations `202607240025`–`202607240029` add the `challenge` study-session mode, compatible session constraints, policy-helper grants, governed metadata activation, and seven RLS-protected motivation tables:

- `achievements` and `student_achievements` hold predefined recognition and evidence-backed, idempotent awards.
- `challenges` stores the private two-student lifecycle, approved exam, duration, immutable scoring method, and private-family visibility.
- `challenge_question_sets` snapshots one shared ordered set of approved question IDs and versions.
- `challenge_participants` connects each student to a separately owned challenge session and snapshots a recent non-challenge accuracy baseline.
- `challenge_results` stores completion, accuracy, improvement, positive point components, and supportive recognition.
- `encouragements` accepts only the predefined reaction enum; no free-text message column exists.

`create_private_challenge` requires a parent/coach and exactly two active guardian links with `can_manage_challenges`. It creates both sessions atomically. Session-completion triggers calculate results and achievements from server data. One result may be stored privately while the other student is still working, but RLS and the challenge projection withhold both scores until every participant completes. Challenge attempts do not modify ordinary mastery, preserving normal adaptive evidence.

Forward migrations `202607240029`–`202607240030` close the review-workflow gap exposed by the first real challenge setup. An explicit approving review now atomically activates only that question's linked objective, primary concept, and exam-scoped family, records an audit event, and then runs the existing strict question approval gate. Import remains draft-only; request-changes and reject decisions never activate metadata. Migration 030 preserves the established `archived` content status for rejected questions.

Migration `202607240031` makes private challenge eligibility the intersection of the two selected students' access. A question is eligible when it has a protected answer key and is either approved/active or remains draft inside an `import_package` assigned to both students. A package assigned to only one participant cannot enter the shared set.

Migration `202607240032` adds `admin_reset_student_learning_progress`. Its default
`p_confirm = false` mode previews exact row counts. Confirmed resets delete only the
selected student's sessions (and cascading session questions/attempts), question
state, topic mastery, and achievement awards. The account, profile, roles, guardian
links, and pilot-package assignments remain intact. Existing shared challenge
participation blocks deletion because removing a participant session could damage
the other student's shared history. Every confirmed reset records an administrative
audit summary and reason.

Migration `202607240033` adds nullable, format-constrained `question_mode` and
`question_style` fields so source-bank delivery/style classifications are not
discarded. These are content metadata only and do not change study or practice-test
feedback rules. The Volume 2 Chapter 4 operator import creates its own Volume 2,
Chapter 4, topic, objective, concept, family, and authorized-source metadata and
stores all 75 rows as drafts in private package `LTL2_C4_75`.

The same migration-backed fields support the Volume 2 Chapter 5 operator import;
no additional schema migration is required. The importer creates the Chapter 5
hierarchy and authorized-source metadata as needed and stores all 75 rows as
drafts in private package `LTL2_C5_75`. Comma-separated citation pages are stored
in the existing numeric bounds while their exact text is retained in the visible
source reference.

Volume 2 Chapter 6 uses the same operator-import schema and requires no additional
migration. The importer creates the Chapter 6 hierarchy and authorized-source
metadata as needed and stores the 75 draft rows in private package `LTL2_C6_75`.

Volume 2 Chapter 7 also uses the migration 033 operator-import schema. The importer
creates its Chapter 7 hierarchy and source metadata as needed and stores the 75
draft rows in private package `LTL2_C7_75`; no additional migration is required.
Metadata database keys are normalized to the existing uppercase key alphabet and
long composite family keys receive a deterministic hash suffix. The original
author-supplied identifiers remain in titles/source metadata.

Volume 2 Chapter 8 uses the same migration 033 operator-import schema and requires
no additional migration. The importer creates the Chapter 8 hierarchy and source
metadata as needed and stores its 75 draft rows in private package `LTL2_C8_75`.

1. Develop against a local Supabase stack when available or a dedicated nonproduction CAP Mastery project.
2. Add ordered migration files and SQL tests in the same change.
3. Reset/replay migrations against a disposable database.
4. Generate types from the resulting schema.
5. Apply to shared environments only after review and record the result in `CHECKPOINT_LOG.md`.

## Mitchell full practice-exam extension

Migration `202608020034` adds question classification fields for chapter, exam
likeness, distractor difficulty, final-exam eligibility and weight, content origin,
and style reference. It adds an indexed final-exam pool, a practice-blueprint
selection strategy, and persistent review flags on session questions. Existing
question UUIDs, attempts, mastery, version snapshots, and session links are not
recreated.

`create_mitchell_full_practice_exam` accepts only an active 50-question Mitchell
blueprint and selects approved content or draft content from packages assigned to
the authenticated student. The selected question IDs, versions, and order are
frozen in `study_session_questions`. Weak-area results are completion-gated, flag
functions recheck ownership, and classification edits use an audited reviewer-only
wrapper around the existing versioned edit workflow.

Migration `202608020035` adds
`get_latest_practice_test_topic_results(student, exam)`. It selects only the most
recent completed `mitchell_full_exam` session, groups its frozen questions and
attempts by topic/chapter, and returns score labels plus completion time. A later
completed full test automatically replaces the prior Progress snapshot. Practice
attempts remain separate from ordinary mastery and adaptive-selection state.

Migration `202608020036` adds `get_study_session_question_context(session)`, a
narrow student-owned projection of session-question IDs and their chapter/topic
labels. It is separate from public content reads so an assigned draft can retain
its private-content boundary while the session UI still identifies what the
student is studying. The projection returns no prompt, choice, answer, feedback,
score, or classification field.

Migration `202608020037` changes the active Mitchell 50-question blueprint's
default timer from 3,000 to 3,600 seconds. The value is copied into each new
session, so an already-started session retains its immutable timer snapshot while
new tests receive 60 minutes.

Checkpoint 3 adds seven forward migrations (`202607200004` through `202607200010`) for hierarchy, question storage, RLS/delivery functions, a catalog-only seed, approval/integrity hardening, learning metadata, and strict metadata/feedback approval gates. The seed contains track names and explicit pending-content placeholders only—no source text, questions, answers, scores, or timing claims. SQL tests use synthetic transaction-only content and roll it back.

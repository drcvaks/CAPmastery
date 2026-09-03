# Checkpoint 10 Security Review

Date: 2026-09-01. Scope: the current nonproduction pilot schema through migration 049.

## Result

The application keeps authorization in PostgreSQL, grades only in protected functions, and stores answer keys and teaching feedback outside the API-exposed schema. Migration 049 removes inherited `PUBLIC`/anonymous function execution, removes all API-role access to private tables, and establishes secure defaults for future functions and private tables. Existing client RPCs retain their explicit `authenticated` grants.

The release test is intentionally global rather than a sample: every public table must have RLS, anonymous users must have no table or RPC access, private tables must have no API-role grants, every CAP Mastery security-definer routine must fix an empty search path, and students must be unable to mutate roles, attempts, or mastery or select answer keys. Supabase's platform-managed `rls_auto_enable()` helper is the single explicit exception: its exact `search_path=pg_catalog` configuration is fixed, restrictive, and required for the dashboard's automatic-RLS safeguard.

## Table-by-table review

| Data group | Tables | Client boundary reviewed |
| --- | --- | --- |
| Identity and access | `profiles`, `user_roles`, `student_guardian_links`, `organizations`, `organization_memberships`, `audit_log` | Self/active-link/admin reads only; role and relationship changes use audited admin RPCs; no ordinary direct writes. |
| Catalog | `programs`, `exams`, `courses`, `volumes`, `chapters`, `sections`, `topics`, `learning_objectives`, `concepts`, and relationship tables | Approved/active or reviewer-scoped reads; students cannot publish or alter hierarchy. |
| Questions and review | `questions`, `question_choices`, `question_families`, question mapping/version/report/review tables, `source_documents`, `csv_import_jobs`, `pilot_package_assignments` | Approved content or exact assigned draft package only; reviewer/admin mutations use validated audited RPCs; assignments are admin-only. |
| Study and mastery | `study_sessions`, `study_session_questions`, `question_attempts`, `student_question_state`, `student_topic_mastery` | Owner reads; creation/grading/mastery writes are protected server operations; no client correctness field exists. |
| Practice tests | `practice_test_blueprints`, `practice_test_blueprint_rules` | Authenticated read-only configuration; server freezes selection, timer, answers, flags, completion, and analysis. |
| Motivation | `achievements`, `student_achievements`, `challenges`, `challenge_participants`, `challenge_question_sets`, `challenge_results`, `encouragements` | Participant/authorized-linked-adult scope; no ranking leak or free text; awards/results are server-derived. |
| Private support | `private.question_answer_keys`, `question_choice_feedback`, `question_learning_support`, `source_passages`, `tutor_notes`, `visual_assets` | No API-role table grants. Narrow protected projections release only owned, timing-appropriate feedback. |

## Attacks covered

- Direct role escalation and forged guardian links.
- Cross-student session, attempt, mastery, progress, challenge, and review access.
- Draft-package inference and package substitution.
- Answer-key, choice-feedback, and pre-completion practice-result leakage.
- Forged correctness, mastery, achievements, test configuration, and flags.
- Inherited function execution, unsafe security-definer search paths, malformed CSV, formula injection, duplicate headers, and oversized imports.
- Client credential leakage through the repeatable `npm run security:client-secrets` gate.

## Remaining operational decisions

This is not a penetration test or compliance certification. Before collecting a broader pilot, the owner must finalize consent, retention/deletion, incident contact, source authorization, and whether to use a separate production project. Database migrations and linked pgTAP must be applied before pilot release; hiding a route never substitutes for RLS.

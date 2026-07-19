# Codex Master Build Plan: Adaptive CAP Milestone Study App

## Working Project Name

Use **CAP Mastery** as the temporary working name. The name can be changed later without affecting the architecture.

---

# 1. Instructions to Codex Before Beginning

You are building a new Expo React Native application that helps Civil Air Patrol cadets prepare for milestone and promotion examinations through adaptive study sessions, detailed explanations, progress tracking, and supportive competition.

The first users will be two cadets, Heshy and Avigail. The system must nevertheless be designed so it can later support families, squadrons, instructors, and additional CAP exams.

This is a new project, but an existing application named **mySCP** contains useful patterns for:

- Expo and React Native setup
- TypeScript
- Supabase connection
- Authentication
- User profiles and roles
- Question banks
- Review sessions
- Answer tracking
- Progress displays
- CSV imports
- Admin functions
- Reusable UI components

Before writing code:

1. Inspect the mySCP repository at C:\Users\Family\ws\mySCPcodex
2. Identify reusable architecture, components, database helpers, authentication patterns, and styling.
3. Do not modify the mySCP project.  For this project it will be considered read-only.
4. Do not copy features blindly.
5. Produce a brief reuse report listing:
   - Components that can be copied or adapted
   - Database patterns worth retaining
   - Code that should not be reused
   - Dependencies that can be shared
   - Security or technical debt discovered
6. Build CAP Mastery as its own repository and Supabase project.
7. Do not connect CAP Mastery to the production mySCP database.

---

# 2. Codex Working Rules

The working directory for this project will be at C:\Users\Family\ws\CAPmastery

Create an `AGENTS.md` file at the root of the repository. It should direct Codex to the detailed documentation in `/docs`.

Create and maintain:

```text
AGENTS.md
README.md
docs/
  PRODUCT_REQUIREMENTS.md
  ARCHITECTURE.md
  DATABASE.md
  SECURITY_AND_PERMISSIONS.md
  ADAPTIVE_ENGINE.md
  QUESTION_CONTENT_STANDARD.md
  TESTING.md
  CHECKPOINT_LOG.md
  FUTURE_AI_INTEGRATION.md
```

At every checkpoint:

1. Read `AGENTS.md` and the applicable documents.
2. Inspect existing code before changing it.
3. Make only the changes required for the current checkpoint.
4. Run TypeScript checks, linting, tests, and the Expo startup validation.
5. Update documentation when architecture or behavior changes.
6. Update `docs/CHECKPOINT_LOG.md`.
7. Stop after the checkpoint.
8. Report:
   - What was completed
   - Files created or changed
   - Database changes
   - Tests performed
   - Known limitations
   - Exact manual steps required from Chaim
   - Recommended next checkpoint
9. Do not begin the next checkpoint until instructed.

Do not place secrets in source code. Use environment variables and provide `.env.example`.

Do not use the Supabase service-role key in the mobile application.

Do not weaken Row Level Security merely to make testing easier.

Do not implement live AI generation during the initial release.

---

# 3. Product Vision

CAP Mastery is an adaptive study coach for CAP cadets.

It should help a cadet:

- Learn material rather than memorize isolated answers
- Identify weak chapters, sections, and concepts
- Receive more practice in weak areas
- Read clear explanations after mistakes
- Revisit missed concepts later
- Prepare under realistic practice-test conditions
- See measurable progress
- Remain motivated after unsuccessful exam attempts
- Encourage other cadets through positive advancement

The product is not intended to collect protected or recalled CAP examination questions. It will use authorized source materials, original study questions, approved sample questions, and reviewed content.

---

# 4. Initial Scope

## Included in Version 1

- Android-first Expo application
- Responsive web support for administration
- Supabase backend
- Email/password authentication
- Separate Heshy and Avigail accounts
- Parent/admin account
- Leadership and Aerospace study tracks
- Courses, volumes, chapters, sections, topics, and learning objectives
- Multiple-choice and true/false questions
- Study mode
- Quick review
- Weak-area review
- Practice-test mode
- Explanations
- Source references
- Attempt history
- Topic mastery
- Adaptive question selection
- Readiness dashboard
- Streaks and achievements
- Private family challenge mode
- CSV question import
- Admin question review and editing
- Database Row Level Security
- Automated tests for critical logic

## Explicitly Excluded From Version 1

- Direct AI API integration
- Automatic PDF ingestion
- Automatic publication of generated questions
- Public squadron leaderboards
- Messaging or open chat
- Actual CAP login integration
- Collection of questions remembered from protected exams
- Payment processing
- Push notifications
- App-store publication
- Broad multi-squadron deployment

---

# 5. Technology Stack

Use:

- Expo
- React Native
- Expo Router
- TypeScript with strict mode
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage only when needed
- React Hook Form
- Zod
- TanStack Query, if it fits the existing mySCP architecture
- Jest or Vitest for unit testing
- React Native Testing Library for component tests
- SQL migration files under version control

Prefer a straightforward architecture over excessive abstraction.

Suggested structure:

```text
app/
  (auth)/
  (student)/
  (admin)/
  index.tsx
components/
  common/
  quiz/
  progress/
  admin/
features/
  auth/
  content/
  study/
  adaptive/
  progress/
  challenges/
  admin/
lib/
  supabase/
  validation/
  constants/
  utilities/
services/
  questionService.ts
  studySessionService.ts
  masteryService.ts
  challengeService.ts
types/
hooks/
tests/
supabase/
  migrations/
  seed/
  functions/
docs/
```

Keep database access in service modules rather than scattering Supabase queries across screens.

---

# 6. User Roles

Use application roles stored in the database, not only in client-side state.

## Roles

### Student

Can:

- View assigned or available study content
- Start study sessions
- Submit answers
- Review explanations
- View personal progress
- Participate in approved private challenges
- View personal achievements

Cannot:

- View another student’s detailed answer history
- Edit questions
- Import content
- Change roles
- View administrative reports

### Parent or Coach

Can:

- View students explicitly linked to the parent/coach
- View linked students’ progress and weak areas
- Assign content or study goals
- Create a private challenge among linked students
- View challenge results
- Add encouragement
- Manage limited student settings

Cannot:

- View unrelated students
- Publish question content
- Change system roles
- Access service-level administration

### Content Reviewer

Can:

- Create and edit draft questions
- Import CSV files
- Review questions
- Approve or reject questions
- Correct explanations and source references
- Deactivate problematic questions

Cannot:

- Change system roles unless also an administrator
- View student details unless separately authorized

### Squadron Leader

Future-ready role, but implement only the basic schema and permissions in Version 1.

Eventually can:

- Manage an assigned study group
- Assign material
- View permitted aggregate progress
- Create positive group challenges

Should not automatically see private student answer history.

### Administrator

Can:

- Manage roles
- Manage courses and content
- Manage approved student-parent links
- Review audit records
- Deactivate content
- Manage feature flags

---

# 7. Permission and Security Model

Use Row Level Security on every table exposed through the Supabase API.

Never rely only on hidden screens or client-side checks.

## Core Security Principles

1. A student can read only the student’s own attempts, mastery, sessions, goals, and achievements.
2. A linked parent can read data only for students connected through an active relationship record.
3. A reviewer can manage content but does not automatically receive access to private student records.
4. An administrator can manage the system through policies or secure server-side functions.
5. Sensitive administrative actions should use audited database functions or Edge Functions.
6. Role changes must never be writable directly by ordinary users.
7. Approved questions are readable by students.
8. Draft, rejected, and archived questions are visible only to authorized reviewers and administrators.
9. Do not expose answer keys in the normal question-delivery query before an answer is submitted.
10. Grade answers through a secure PostgreSQL function or Edge Function.
11. Record important administrative changes in an audit log.
12. Use UUID primary keys.
13. Use `created_at`, `updated_at`, and where helpful `created_by`.
14. Use soft deletion or status fields for question content when deletion could damage history.

## Question Answer Protection

Do not send `correct_choice_id` or the full scoring key to the student client when loading a question.

Create a secure function such as:

```text
submit_answer(
  p_session_id uuid,
  p_question_id uuid,
  p_selected_choice_id uuid,
  p_response_time_ms integer,
  p_confidence smallint
)
```

The function should:

- Confirm the authenticated user owns the session
- Confirm the question belongs to the session
- Prevent unauthorized duplicate submissions
- Determine correctness inside the database
- Record the attempt
- Update session statistics
- Update mastery
- Return:
  - Correct or incorrect
  - Correct answer text
  - Explanation
  - Source reference
  - Remediation prompt
  - Updated session progress

Do not allow the client to directly write `is_correct`.

---

# 8. Database Structure

Codex should create migrations rather than making undocumented dashboard-only changes.

## Identity and Access Tables

### `profiles`

```text
id uuid primary key references auth.users
display_name text
first_name text
last_name text
avatar_url text nullable
status text
created_at timestamptz
updated_at timestamptz
```

### `user_roles`

```text
id uuid primary key
user_id uuid
role text
scope_type text
scope_id uuid nullable
created_at timestamptz
created_by uuid nullable
unique(user_id, role, scope_type, scope_id)
```

Possible roles:

```text
student
parent
coach
content_reviewer
squadron_leader
admin
```

### `student_guardian_links`

```text
id uuid primary key
student_id uuid
guardian_id uuid
relationship_type text
status text
can_view_progress boolean
can_assign_content boolean
can_manage_challenges boolean
created_at timestamptz
created_by uuid
```

### `organizations`

Future-ready:

```text
id uuid primary key
name text
organization_type text
parent_organization_id uuid nullable
status text
created_at timestamptz
```

### `organization_memberships`

```text
id uuid primary key
organization_id uuid
user_id uuid
membership_role text
status text
created_at timestamptz
```

---

## Content Hierarchy

### `programs`

Example: Civil Air Patrol Cadet Program.

### `exams`

Examples:

- Billy Mitchell Aerospace
- Billy Mitchell Leadership

Fields:

```text
id uuid primary key
program_id uuid
code text
title text
description text
passing_score numeric nullable
time_limit_minutes integer nullable
status text
created_at timestamptz
updated_at timestamptz
```

### `courses`

Examples:

- Aerospace Dimensions
- Learn to Lead

### `volumes`

### `chapters`

### `sections`

### `topics`

### `learning_objectives`

Each level should have:

```text
id
parent_id where applicable
code
title
description
sort_order
status
created_at
updated_at
```

Do not assume every future exam uses all hierarchy levels. Permit nullable hierarchy links where reasonable.

---

## Source Material Tables

### `source_documents`

```text
id uuid primary key
title text
document_type text
edition text nullable
publication_date date nullable
storage_path text nullable
external_reference text nullable
authorization_status text
status text
created_at timestamptz
created_by uuid
```

### `source_passages`

Future-ready for AI and citation grounding:

```text
id uuid primary key
source_document_id uuid
chapter_id uuid nullable
section_id uuid nullable
page_start integer nullable
page_end integer nullable
heading text nullable
passage_text text
content_hash text
status text
created_at timestamptz
```

Do not require PDF extraction in Version 1, but create the schema so it can be added later.

---

## Question Bank Tables

### `questions`

```text
id uuid primary key
exam_id uuid
course_id uuid nullable
volume_id uuid nullable
chapter_id uuid nullable
section_id uuid nullable
topic_id uuid
learning_objective_id uuid nullable
question_type text
question_text text
difficulty text
cognitive_level text
status text
review_status text
source_document_id uuid nullable
source_page_start integer nullable
source_page_end integer nullable
source_reference_text text
explanation text
remediation_text text nullable
common_mistake text nullable
is_exam_style boolean
version integer
created_by uuid
approved_by uuid nullable
approved_at timestamptz nullable
created_at timestamptz
updated_at timestamptz
```

Question types initially:

```text
multiple_choice
true_false
```

Difficulty:

```text
easy
medium
hard
```

Cognitive level:

```text
recall
understanding
application
scenario
```

Review status:

```text
draft
in_review
approved
rejected
archived
```

### `question_choices`

```text
id uuid primary key
question_id uuid
choice_key text
choice_text text
is_correct boolean
explanation text nullable
sort_order integer
created_at timestamptz
```

Students must not have direct access to `is_correct`.

### `question_tags`

### `tags`

Optional but useful for concepts such as:

- airspace
- chain of command
- communication
- situational leadership
- airport markings

### `question_versions`

Maintain a historical copy when approved questions are changed, especially after students have attempted them.

### `question_quality_reviews`

```text
id uuid primary key
question_id uuid
reviewer_id uuid
accuracy_rating integer
clarity_rating integer
test_alignment_rating integer
notes text
decision text
created_at timestamptz
```

### `question_reports`

Allows a user to report:

- unclear wording
- incorrect answer
- poor explanation
- source mismatch
- formatting problem

---

## Study and Attempt Tables

### `study_sessions`

```text
id uuid primary key
student_id uuid
exam_id uuid
session_mode text
status text
question_target integer
time_limit_seconds integer nullable
started_at timestamptz
completed_at timestamptz nullable
score_percent numeric nullable
correct_count integer default 0
incorrect_count integer default 0
metadata jsonb
created_at timestamptz
```

Session modes:

```text
quick_review
weak_area
chapter_review
custom
practice_test
challenge
remediation
```

### `study_session_questions`

```text
id uuid primary key
session_id uuid
question_id uuid
sequence_number integer
selection_reason text
served_at timestamptz nullable
answered_at timestamptz nullable
unique(session_id, question_id)
```

Selection reasons:

```text
weak_topic
recently_missed
scheduled_review
new_material
retention_check
practice_test_blueprint
challenge_shared
manual_assignment
```

### `question_attempts`

```text
id uuid primary key
session_id uuid
student_id uuid
question_id uuid
selected_choice_id uuid
is_correct boolean
response_time_ms integer nullable
confidence_rating smallint nullable
attempted_at timestamptz
question_version integer
```

### `student_question_state`

```text
id uuid primary key
student_id uuid
question_id uuid
times_seen integer
times_correct integer
consecutive_correct integer
consecutive_incorrect integer
last_result boolean nullable
last_seen_at timestamptz nullable
next_review_at timestamptz nullable
ease_factor numeric
interval_days numeric
state text
unique(student_id, question_id)
```

### `student_topic_mastery`

```text
id uuid primary key
student_id uuid
topic_id uuid
attempts_count integer
correct_count integer
recent_accuracy numeric
mastery_score numeric
confidence_score numeric
retention_score numeric
consecutive_correct integer
consecutive_incorrect integer
last_practiced_at timestamptz nullable
next_review_at timestamptz nullable
status text
updated_at timestamptz
unique(student_id, topic_id)
```

Mastery statuses:

```text
not_started
beginning
developing
proficient
mastered
needs_review
```

### `student_exam_readiness`

This may be a view or computed table:

```text
student_id
exam_id
overall_readiness
coverage_score
recent_accuracy_score
retention_score
practice_test_score
weak_topic_penalty
last_calculated_at
```

---

## Assignments and Goals

### `study_assignments`

```text
id uuid primary key
assigned_by uuid
student_id uuid
exam_id uuid
chapter_id uuid nullable
topic_id uuid nullable
assignment_type text
target_question_count integer nullable
target_minutes integer nullable
due_at timestamptz nullable
status text
notes text nullable
created_at timestamptz
```

### `student_goals`

Examples:

- Practice 10 minutes daily
- Complete 50 airspace questions
- Reach 80% readiness

---

## Motivation and Competition

### `achievements`

### `student_achievements`

Achievement categories:

- first session
- persistence
- improvement
- streak
- topic mastered
- comeback
- readiness milestone
- helping the team

Do not reward only perfect scores.

### `challenges`

```text
id uuid primary key
created_by uuid
title text
challenge_type text
exam_id uuid
status text
starts_at timestamptz
ends_at timestamptz
scoring_method text
visibility text
created_at timestamptz
```

### `challenge_participants`

### `challenge_question_sets`

### `challenge_results`

Supported Version 1 challenge:

- Same approved question set
- Heshy versus Avigail
- Results hidden until both finish, when practical
- Compare score, improvement, and completion
- No negative ranking language

### `encouragements`

Use predefined supportive reactions initially instead of free-form messaging.

---

## Administrative and Audit Tables

### `csv_import_jobs`

Track:

- file name
- importer
- rows received
- rows accepted
- rows rejected
- error report
- status

### `audit_log`

Record:

- actor
- action
- entity type
- entity ID
- safe before/after summary
- timestamp

Do not store secrets or unnecessary private content in logs.

### `feature_flags`

Examples:

- enable_challenges
- enable_readiness
- enable_ai_drafts
- enable_squadron_features

---

# 9. Adaptive Study Engine

Implement the initial engine deterministically without an AI API.

## Topic Mastery

Begin each topic at a neutral low-confidence score rather than assuming weakness.

Suggested mastery range:

```text
0 to 100
```

Initial score:

```text
40 with low confidence
```

Example update behavior:

- Correct easy question: modest increase
- Correct medium question: larger increase
- Correct hard or application question: larger increase
- Incorrect easy question: meaningful decrease
- Incorrect hard question: smaller decrease
- Repeated correct answers increase confidence
- Repeated incorrect answers mark `needs_review`
- Old mastery gradually loses retention confidence without resetting knowledge

Codex should isolate formulas in a tested module so coefficients can be tuned later.

## Session Composition

For a standard 10-question adaptive session:

- 40% weak topics
- 20% recently missed questions or equivalent concepts
- 20% developing topics
- 10% retention questions from previously strong topics
- 10% new or harder questions

Do not repeat the identical question too frequently unless the question bank is still small.

Prefer a related question on the same objective before repeating the exact wording.

## Spaced Review

Initial simple schedule:

- Incorrect: later in the same session when possible, then next day
- Correct once: review in 2 days
- Correct twice: review in 5 days
- Correct three times: review in 10 days
- Continued correct: expand interval
- Incorrect after prior mastery: mark for near-term review

## Remediation Flow

After an incorrect answer:

1. Show the correct answer.
2. Show a concise explanation.
3. Explain why the selected answer is not correct when that content exists.
4. Show the source reference.
5. Offer “Try a related question.”
6. Schedule a different question on the same objective.
7. Later recheck the concept without showing the explanation first.

## Confidence Rating

Optionally ask:

```text
How sure were you?
Guessing / Somewhat sure / Very sure
```

Use confidence carefully:

- Correct but guessing does not count as fully secure mastery.
- Incorrect but very sure may indicate a misconception and should trigger stronger remediation.
- Do not interrupt every question if it harms usability; make it configurable.

## Readiness Score

Do not present readiness as a guaranteed prediction of passing.

Calculate from:

- Topic coverage
- Recent accuracy
- Retention
- Unseen-question performance
- Practice-test consistency
- Timed performance
- Number and importance of weak objectives

Show:

```text
Developing
Getting Close
Practice-Test Ready
Strong Readiness
```

Also show a percentage, but include:

```text
This is a study estimate, not an official CAP result.
```

Require minimum topic coverage before a high readiness rating is possible.

---

# 10. Question Content Standard

Every approved question must:

1. Be supported by an authorized source.
2. Test one clear learning objective.
3. Have one unambiguously best answer.
4. Use plausible distractors.
5. Avoid trick wording unless the source itself requires a distinction.
6. Match the expected reading level.
7. Include an explanation that teaches the concept.
8. Include a source reference.
9. Be reviewed before publication.
10. Avoid claims of being an actual CAP exam question unless officially identified as such.

## Explanations

A good explanation should:

- State why the correct answer is correct
- Clarify the underlying concept
- Address a likely misunderstanding
- Remain concise
- Avoid saying only “This is stated in the chapter”

## CSV Import Format

Create an import template with columns:

```text
external_id
exam_code
course_code
volume_code
chapter_code
section_code
topic_code
learning_objective_code
difficulty
cognitive_level
question_type
question_text
choice_a
choice_b
choice_c
choice_d
correct_letter
explanation
choice_a_explanation
choice_b_explanation
choice_c_explanation
choice_d_explanation
common_mistake
remediation_text
source_document
source_pages
source_reference_text
is_exam_style
review_status
```

Validation rules:

- Multiple-choice questions require at least three nonblank choices.
- True/false questions use only TRUE and FALSE.
- `correct_letter` must point to a populated choice.
- Approved rows require explanation and source reference.
- Unknown hierarchy codes cause a validation error rather than silent creation, unless an admin explicitly chooses a controlled creation mode.
- Duplicate detection should use normalized question text plus exam and objective.
- Import errors must be downloadable or clearly displayed.

---

# 11. User Experience

## Student Home Screen

Show:

- Greeting
- Current exam focus
- Readiness estimate
- Recommended session
- Study streak
- Weakest two or three areas
- Recent improvement
- Challenge status
- Continue button

Avoid emphasizing failure counts.

## Study Modes

### Recommended Review

Automatically generated adaptive session.

### Quick Review

5 or 10 questions.

### Focus Area

Choose exam, chapter, or topic.

### Missed Questions

Review concepts missed recently, preferably with alternate questions.

### Practice Test

- Fixed blueprint
- Timed option
- No answer explanations until the end
- Realistic distribution
- Clear statement that it is unofficial

### Challenge

Private shared set with supportive results.

## Results Screen

Show:

- Score
- Improvement from recent sessions
- Topics strengthened
- Topics needing more review
- Recommended next action
- Explanations
- Encouraging message based on effort and progress

Examples:

- “You strengthened two airspace topics.”
- “You improved from your last session.”
- “One concept still needs another review.”
- “Persistence is part of promotion.”

## Parent Dashboard

Show:

- Heshy and Avigail separately
- Recent activity
- Readiness trend
- Weak and improving topics
- Assigned goals
- Challenge controls
- Encouragement controls

Do not encourage constant surveillance. Focus on coaching.

## Admin Dashboard

Web-friendly screens for:

- Content hierarchy
- Question list
- Draft review
- Question editing
- CSV import
- Import errors
- Question reports
- Basic content statistics
- User-role management
- Parent-student links
- Audit log

---

# 12. Checkpoint Build Plan

## Checkpoint 0: Repository and mySCP Review

Tasks:

- Create or open the new CAP Mastery repository.
- Inspect mySCP read-only if available.
- Create reuse report.
- Establish branch and commit strategy.
- Create `AGENTS.md`.
- Create initial documentation files.
- Create `.env.example`.
- Confirm Node, Expo, and package-manager versions.
- Do not implement product screens yet.

Acceptance criteria:

- Project documentation exists.
- Codex can explain the proposed architecture.
- mySCP is unchanged.
- Secrets are not copied.
- Chaim receives a list of required accounts and environment values.

Stop after this checkpoint.

## Checkpoint 1: Expo Application Skeleton

Tasks:

- Initialize Expo TypeScript app.
- Configure Expo Router.
- Create auth, student, and admin route groups.
- Add common layout and error boundary.
- Configure linting, formatting, strict TypeScript, and tests.
- Create placeholder screens.
- Verify Android, web, and TypeScript startup.

Acceptance criteria:

- App starts.
- Navigation works.
- Tests and type checks run.
- No Supabase dependency is required to view the shell.

Stop after this checkpoint.

## Checkpoint 2: Supabase Foundation and Authentication

Tasks:

- Create Supabase client.
- Add environment handling.
- Create migrations for profiles, roles, links, organizations, and audit log.
- Enable RLS.
- Add secure profile creation trigger.
- Implement login, logout, password reset, and session restoration.
- Add role-aware routing.
- Seed development users only through safe documented steps.

Acceptance criteria:

- Student and admin can sign in.
- Unauthorized role changes are impossible from the client.
- Student cannot enter admin routes merely by typing a URL.
- RLS tests cover profile and role access.

Stop after this checkpoint.

## Checkpoint 3: Content Hierarchy and Question Bank

Tasks:

- Add exam and content hierarchy migrations.
- Add questions, choices, versions, reviews, and reports.
- Add seed data for Leadership and Aerospace.
- Add a small manually reviewed sample bank.
- Create content service.
- Build read-only student content browsing.
- Ensure correct answers are not exposed.

Acceptance criteria:

- Student can view available exams and topics.
- Approved questions can be retrieved without answer keys.
- Draft questions remain hidden.
- Database tests verify permissions.

Stop after this checkpoint.

## Checkpoint 4: Basic Study Session

Tasks:

- Create session and attempt tables.
- Implement secure `submit_answer`.
- Build study-session creation.
- Build question screen.
- Build answer feedback.
- Build session completion and results.
- Prevent tampering with correctness.
- Add loading, retry, and offline-error states.

Acceptance criteria:

- Heshy or Avigail can complete a 10-question session.
- Answers are graded server-side.
- Attempts are recorded.
- Explanations appear after submission.
- Another student cannot view the attempts.

Stop after this checkpoint.

## Checkpoint 5: Mastery and Adaptive Selection

Tasks:

- Add question state and topic mastery.
- Implement deterministic mastery formulas.
- Implement spaced review.
- Implement adaptive session composition.
- Record selection reasons.
- Add unit tests for the algorithm.
- Add safeguards for small question banks.

Acceptance criteria:

- Repeated weaknesses increase related question frequency.
- Correct answers eventually reduce repetition.
- Missed concepts return later.
- Identical questions are not repeated excessively.
- Algorithm tests are deterministic.

Stop after this checkpoint.

## Checkpoint 6: Progress and Readiness Dashboard

Tasks:

- Add readiness calculation.
- Add coverage requirements.
- Build student dashboard.
- Build topic detail.
- Build trends.
- Add clear unofficial-estimate disclaimer.
- Build parent view for linked students.

Acceptance criteria:

- Each student sees only personal progress.
- Linked parent sees both linked children.
- Readiness cannot become high from only a few questions.
- Weak topics and recommended next study action are visible.

Stop after this checkpoint.

## Checkpoint 7: Practice Test Mode

Tasks:

- Create exam blueprint configuration.
- Generate practice tests by blueprint.
- Add optional timer.
- Hide feedback until completion.
- Provide end-of-test analysis.
- Separate practice-test results from ordinary review analytics while allowing both to influence readiness appropriately.

Acceptance criteria:

- Practice test has balanced coverage.
- No explanations are shown during test mode.
- Student can pause only if configured.
- Results identify topic strengths and weaknesses.

Stop after this checkpoint.

## Checkpoint 8: CSV Question Import and Review Workflow

Tasks:

- Build CSV template.
- Build validation.
- Build preview.
- Build draft import.
- Build reviewer approval screen.
- Build duplicate warnings.
- Build import error reporting.
- Version approved-question edits.

Acceptance criteria:

- Invalid rows do not silently import.
- Imported questions begin as drafts.
- Only approved questions reach students.
- Reviewer can correct and approve content.
- Historical attempts remain tied to question version.

Stop after this checkpoint.

## Checkpoint 9: Achievements and Family Challenge

Tasks:

- Add achievements.
- Add positive progress-based scoring.
- Add private Heshy-versus-Avigail challenge.
- Add predefined encouragement reactions.
- Add challenge results.
- Protect each student’s unrelated detailed history.

Acceptance criteria:

- Parent can create a private challenge.
- Both students receive the same question set.
- Challenge results are supportive.
- No public lowest-score display exists.
- Improvement and persistence can earn recognition.

Stop after this checkpoint.

## Checkpoint 10: Quality, Security, and Pilot Release

Tasks:

- Review RLS table by table.
- Test attempted privilege escalation.
- Test answer-key leakage.
- Test malformed CSV.
- Add error monitoring strategy.
- Improve accessibility.
- Improve keyboard and screen-size support.
- Create Android internal build instructions.
- Create pilot test checklist.
- Create backup and migration instructions.
- Document known limitations.

Acceptance criteria:

- No service key is included in client files.
- All exposed tables have reviewed RLS.
- Critical algorithms have tests.
- Heshy and Avigail can perform a real pilot.
- Admin can add and approve questions without editing SQL manually.

Stop after this checkpoint.

---

# 13. Pilot Plan

## Pilot Users

- Heshy
- Avigail
- Chaim as parent/admin
- Rachel as parent

## Initial Content

Begin with a deliberately limited but strong question bank:

- Billy Mitchell Aerospace
- Billy Mitchell Leadership
- Highest-priority weak areas first
- Questions tagged accurately by chapter, topic, and objective

Suggested minimum before evaluating adaptivity:

- 150 to 250 reviewed questions per exam
- Multiple questions for every important objective
- Easy, medium, and hard coverage
- Recall and application questions
- Explanations for every question

A smaller bank can be used for technical testing, but it should not be used to judge whether the adaptive engine truly works.

## Pilot Metrics

Track:

- Sessions completed
- Accuracy by topic
- Retention after several days
- Reduction in repeated mistakes
- Practice-test consistency
- Time spent per session
- Voluntary return rate
- Student-reported usefulness
- Frustration or confusion
- Question-quality reports

Ask the cadets:

- Did the explanation help?
- Did questions feel repetitive?
- Did the app identify what was difficult?
- Did the progress screen motivate you?
- Did competition feel encouraging?
- What made you want to stop?
- What made you want to continue?

---

# 14. Future AI Integration

Do not implement until the reviewed question-bank workflow and adaptive engine are stable.

## Future Phase A: AI Draft Generation

Admin uploads or selects approved source material.

System:

1. Extracts text.
2. Divides it into traceable passages.
3. Sends selected passages to an AI model.
4. Requires structured output.
5. Creates draft questions.
6. Links every draft to source passages.
7. Runs automated validation.
8. Requires human approval.

AI output should include:

- Objective
- Difficulty
- Cognitive level
- Question
- Choices
- Correct answer
- Explanation
- Distractor explanations
- Source passage IDs
- Confidence or review warnings

Never publish automatically.

## Future Phase B: AI Remediation

When a student repeatedly misses an objective, AI may generate a personalized explanation based only on approved source passages.

The prompt should include:

- Student-safe identifier, not unnecessary personal information
- Objective
- Approved source excerpts
- Recent errors
- Selected wrong answers
- Desired reading level
- Required concise structure

Store generated remediation separately and label it as AI-generated.

Do not let AI modify official mastery records directly.

## Future Phase C: Question Quality Analysis

AI may flag:

- Ambiguous wording
- Duplicate questions
- Implausible distractors
- Source mismatch
- Reading-level concerns
- Two potentially correct choices

Human review remains required.

## Future Phase D: Squadron Deployment

Only after family testing:

- Squadron organization
- Leader permissions
- Aggregate reporting
- Privacy settings
- Group challenges
- Content-sharing controls
- Additional milestone exams

---

# 15. Testing Requirements

## Unit Tests

Cover:

- Mastery update formulas
- Spaced repetition dates
- Adaptive selection
- Readiness calculation
- Practice-test blueprint selection
- CSV validation
- Duplicate detection
- Role helpers

## Integration Tests

Cover:

- Student session lifecycle
- Secure answer submission
- Parent linked-student access
- Reviewer question approval
- Unauthorized content access
- Challenge creation and completion

## RLS Tests

Verify:

- Student A cannot read Student B attempts.
- Student A cannot read answer keys.
- Parent can read only linked students.
- Reviewer can edit draft content but cannot view unrelated private records.
- Ordinary user cannot assign admin role.
- Draft questions are not visible to students.
- Deactivated questions are not used in new sessions.
- Service-only operations cannot be called from the public client.

## Manual Tests

Test:

- Android phone
- Different screen sizes
- Slow connection
- App resume after backgrounding
- Expired session
- Duplicate answer tap
- Network loss during submission
- Empty question bank
- Question with missing source reference
- Practice-test timeout
- Challenge where only one student finishes

---

# 16. Definition of Done

A checkpoint is complete only when:

- Code is implemented
- Types pass
- Lint passes
- Applicable tests pass
- RLS is verified
- Documentation is updated
- Migration files exist
- Manual setup steps are documented
- No secret is committed
- The app has meaningful error handling
- Codex reports remaining limitations honestly

The Version 1 pilot is complete when:

- Heshy and Avigail have separate accounts
- Chaim has an admin/parent account
- Both exams have reviewed content
- Students can study and take practice tests
- The app adapts to weak topics
- Explanations and source references work
- Progress and readiness are understandable
- Parent permissions work
- Private challenge mode works
- Question import and approval work
- Security review is complete
- A usable Android pilot build exists

---

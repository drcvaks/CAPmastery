# Codex Task: Import and Validate the Chapter 1 CAP Mastery Pilot

## Goal

Import the attached 75-question Chapter 1 pilot package into the CAP Mastery application as draft educational content.

The package covers Civil Air Patrol's Learn to Lead, Volume 1, Chapter 1: Character and the Air Force Tradition.

Do not publish these questions to general users yet. They must remain in a staging or draft state until technical validation and human review are complete.

## Input Files

Use either:

- `LTL_V1_Chapter_1_Pilot_75_Questions_Import.csv`
- `LTL_V1_Chapter_1_Pilot_75_Questions_Import.json`

The Excel workbook is primarily for review and validation.

## Required Import Behavior

1. Import all 75 records.
2. Treat `external_id` as the stable unique import key.
3. Make the import idempotent:
   - Re-importing the same file must update matching records rather than create duplicates.
   - Do not overwrite a human-approved question with a draft row unless an explicit force option is used.
4. Preserve UTF-8 punctuation and apostrophes.
5. Keep every imported question in `draft` status.
6. Do not expose correct answers through the normal client question payload before the student submits an answer.
7. Validate all required fields before committing the import.
8. Return a clear import summary:
   - inserted
   - updated
   - skipped
   - failed
   - warnings

## Required Question Fields

Map these columns:

- `external_id`
- `pilot_batch`
- `objective_code`
- `concept_code`
- `question_family_code`
- `difficulty`
- `cognitive_level`
- `question_type`
- `question_text`
- `choice_a`
- `choice_b`
- `choice_c`
- `choice_d`
- `correct_letter`
- `explanation`
- `choice_a_explanation`
- `choice_b_explanation`
- `choice_c_explanation`
- `choice_d_explanation`
- `common_mistake`
- `remediation_text`
- `source_reference_text`
- `source_pages`
- `source_status`
- `review_status`
- `reinforcement_question_ids`
- `estimated_time_seconds`

## Suggested Database Design

Use normalized tables if they already exist. Otherwise, use a structure similar to:

### `questions`

- `id` UUID primary key
- `external_id` text unique not null
- `exam_code` text
- `book_code` text
- `volume_code` text
- `chapter_code` text
- `pilot_batch` text
- `objective_code` text not null
- `concept_code` text not null
- `question_family_code` text
- `difficulty` text
- `cognitive_level` text
- `question_type` text
- `question_text` text not null
- `correct_letter` text not null
- `explanation` text not null
- `common_mistake` text
- `remediation_text` text
- `source_reference_text` text
- `source_pages` text
- `source_status` text
- `review_status` text default 'draft'
- `estimated_time_seconds` integer
- `created_at`
- `updated_at`

### `question_choices`

- `id` UUID primary key
- `question_id` UUID foreign key
- `choice_key` text constrained to A/B/C/D
- `choice_text` text not null
- `choice_explanation` text not null
- unique `(question_id, choice_key)`

### `question_reinforcement_links`

- `question_id`
- `reinforcement_question_id`
- unique pair

If the current schema stores choices as JSON, preserve all four choice explanations and ensure correct-answer data remains server-protected.

## Import Validation Rules

Reject or flag a row when:

- `external_id` is missing
- `objective_code` is missing
- `concept_code` is missing
- `question_text` is missing
- any answer choice is missing
- `correct_letter` is not A, B, C, or D
- the selected correct answer is blank
- the correct explanation is missing
- any distractor explanation is missing
- source pages are missing
- review status is not an allowed value
- estimated time is not a positive integer

Allowed values:

### Difficulty
- easy
- medium
- hard

### Review status
- draft
- in_review
- approved
- rejected
- archived

### Question type
- multiple_choice
- true_false

For this package, all rows should be `multiple_choice`.

## Reinforcement Links

The `reinforcement_question_ids` field contains semicolon-separated `external_id` values.

Import these links only after all questions have been inserted or updated.

If a referenced ID is missing:

- do not fail the entire import
- create a warning
- skip only that link

## Admin Review Screen

Create or confirm an admin review screen that allows a reviewer to:

- filter by pilot batch
- filter by objective
- filter by concept
- filter by difficulty
- filter by cognitive level
- see the source reference and page
- see the answer key
- see every choice explanation
- edit question text and choices
- mark clarity, accuracy, and test alignment
- add reviewer notes
- change status from draft to in_review, approved, rejected, or archived

Approved records should record:

- reviewer user ID
- review timestamp
- previous status
- optional review note

## Student Delivery

For draft testing with Heshy and Avigail:

1. Deliver only questions assigned to the private pilot group.
2. Randomize answer-choice order if the app supports it.
3. Preserve the answer-to-explanation mapping after randomization.
4. Do not show the correct answer before submission.
5. After submission, show:
   - whether the response was correct
   - the main explanation
   - the explanation for the selected answer
   - remediation when appropriate
6. Record:
   - question ID
   - selected answer
   - correctness
   - response time
   - confidence rating
   - whether the explanation helped
   - user feedback category
   - free-text feedback if provided

Suggested feedback categories:

- Clear
- Confusing
- Too easy
- Too hard
- Helpful explanation
- Explanation did not help
- Two answers seemed correct
- Did not seem connected to the material

## Technical Validation Checklist

After import, verify:

- exactly 75 unique questions exist
- every question has four choices
- every question has one valid correct answer
- all five pilot batches are present
- all objective and concept codes were preserved
- all source pages display correctly
- all choice explanations display correctly
- correct answers are protected from the pre-answer client payload
- reinforcement links resolve where referenced
- filters work
- re-importing the package creates no duplicates
- updating one draft row and re-importing updates the matching record
- approved questions are not silently overwritten by draft imports
- import errors produce row-level messages

## Deliverables from Codex

1. Database migration or schema update
2. Import script or admin import action
3. Validation report
4. Admin review screen
5. Private pilot assignment method
6. Test results proving:
   - 75 unique imports
   - no duplicate creation on repeat import
   - correct server-side grading
   - protected answer keys
   - preserved explanations and metadata
7. A brief note listing any fields that could not be mapped exactly

Do not redesign the educational content or rewrite the questions during import. Flag suspected content issues for human review instead.

# Codex Instructions: LTL Volume 2, Chapter 4 — 75-Question Bank

## Import File

Use:

`LTL_V2_Chapter_4_75_Questions_Complete_Support.csv`

The file is UTF-8 with BOM and tab-delimited, matching the earlier CAP Mastery import files.

## Scope

This bank contains 75 original questions based on *Learn to Lead, Volume 2, Chapter 4: The Cadet NCO & The Team*.

The National Cadet Competition question bank was used only as a style guide. These are not copied NCC questions.

## Question Design

The bank intentionally combines:

- concise CAP-style textbook questions
- recall and recognition
- understanding
- application
- misconception checks
- analysis
- realistic CAP scenarios

Distractors are intentionally more plausible than in the first pilot. At least one or two wrong choices often use:

- a neighboring but incorrect concept
- a reversed definition
- a true statement that does not answer the exact question
- an overbroad or overly absolute version of the correct idea

Do not simplify or replace the supplied distractors during import.

## Learning Support

Every question includes:

- `short_explanation`
- full `explanation`
- a separate explanation for each answer choice
- `memory_aid`
- `remediation_text`
- visual priority, type, asset key, brief, caption, and alt text
- source pages and objective code
- related reinforcement question IDs

### Study Mode

After an answer:

- show concise feedback
- for a wrong answer, show the selected-choice explanation and the concise correct principle
- suppress repeated wording
- keep Memory trick, Show visual, and Explain more optional
- allow adaptive remediation using `reinforcement_question_ids`

### Practice Test Mode

During the test:

- do not show correctness
- do not show explanations
- do not show mnemonics
- do not show visual help
- do not update visible mastery feedback until submission

After submission, the app may show review feedback and learning supports.

## Visual Assets

The CSV contains complete visual metadata but not image files.

Until an approved image is linked to `visual_asset_key`:

- hide Show visual in student mode
- allow an admin/development placeholder
- never show a broken image

## Import Safety

- Upsert by `external_id`.
- Preserve all fields.
- Keep `review_status=draft`.
- Do not silently overwrite approved records.
- Blank optional fields must remain valid for future banks.
- Report missing image assets as warnings, not failures.

## Validation

Confirm:

- 75 unique questions import
- each question has four choices
- each correct letter is A–D
- all four choice explanations stay aligned with the choices
- memory aids and visual metadata remain attached to the correct question
- adaptive selection can use all 75
- Practice Test Mode hides all support until submission

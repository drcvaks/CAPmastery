# Codex Instructions: LTL Volume 2, Chapter 5 — 75-Question Bank

## Import file

Use:

`LTL_V2_Chapter_5_75_Questions_Complete_Support.csv`

The file is UTF-8 with BOM and tab-delimited, matching the Chapter 4 import.

## Scope

This bank contains 75 original questions based on *Learn to Lead, Volume 2, Chapter 5: Brainpower for Leadership*.

It covers:

- critical thinking
- universal intellectual standards
- elements and modes of thought
- logical fallacies
- intellectual honesty
- creative thinking and resistance to change
- practical creative-thinking tools
- learning objectives and modalities
- teaching and training methods
- evaluation and demonstration-performance

## Preserve the supplied question design

The distractors are intentionally more plausible than the original Chapter 1 pilot. Do not simplify them during import.

Wrong choices may be:

- a neighboring term from the same chapter
- a true statement that does not answer the exact stem
- a reversed or incomplete definition
- a method that is useful, but serves a different purpose

## Study Mode

After answering:

- show `short_explanation`
- for an incorrect answer, show the explanation for the selected choice
- add the concise correct principle only when needed
- suppress duplicated wording
- keep `Memory trick`, `Show visual`, and `Explain more` optional
- use `reinforcement_question_ids` for related review

## Practice Test Mode

Until submission:

- hide correctness
- hide explanations and choice rationales
- hide mnemonics and remediation
- hide visual support
- do not reveal sources

After submission, allow full review.

## Visual assets

Every question includes visual metadata, but the file does not include actual image files.

Until an approved asset is linked to `visual_asset_key`:

- hide `Show visual` in student mode
- allow a development/admin placeholder
- never show a broken image

## Import safety

- Upsert by `external_id`
- preserve all fields
- keep `review_status=draft`
- do not silently overwrite approved records
- missing visual assets are warnings, not failures
- preserve UTF-8 punctuation and answer-choice alignment

## Validation checklist

Confirm:

- 75 unique questions import
- each has four unique choices and a valid A–D answer
- all four choice explanations remain aligned
- mnemonics, remediation, sources, and visual metadata attach to the correct row
- adaptive selection can use all 75
- Study Mode shows support correctly
- Practice Test Mode hides support until submission

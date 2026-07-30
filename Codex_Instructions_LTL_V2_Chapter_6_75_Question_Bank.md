# Codex Instructions: LTL Volume 2, Chapter 6 — 75-Question Bank

## Import File

Use:

`LTL_V2_Chapter_6_75_Questions_Complete_Support.csv`

The file is UTF-8 with BOM and tab-delimited, matching the Chapter 4 and Chapter 5 imports.

## Scope

This bank contains 75 original questions based on *Learn to Lead, Volume 2, Chapter 6: The Human Element*.

Coverage includes:

- personality
- nature and nurture
- birth order theory
- charisma
- Johari window
- Myers-Briggs Type Indicator
- Maslow’s hierarchy
- Hawthorne studies
- classical conditioning and reinforcement
- authority and the Milgram experiment
- defense mechanisms
- conflict and mediation
- diversity, prejudice, harassment, and retaliation

## Question Design

Preserve the supplied answer choices. The bank intentionally includes plausible distractors:

- a neighboring but incorrect Chapter 6 concept
- a reversed definition
- a true statement that does not answer the exact question
- an overly absolute version of a qualified principle
- a common misconception

Do not simplify the distractors during import.

## Learning Support

Every question includes:

- `short_explanation`
- full `explanation`
- four choice-specific explanations
- `memory_aid`
- `remediation_text`
- visual-support metadata
- source pages and objective codes
- reinforcement question IDs

### Study Mode

After an answer:

- show concise feedback
- if wrong, show the selected-choice explanation and concise correct principle
- suppress repeated wording
- leave Memory trick, Show visual, and Explain more optional
- use reinforcement IDs for adaptive remediation

### Practice Test Mode

Until submission:

- do not show correctness
- do not show explanations
- do not show memory aids
- do not show visual help

After submission, review feedback may become available.

## Visual Assets

The CSV includes visual briefs, captions, alt text, and asset keys but no image files.

Until an approved asset exists:

- hide Show visual in student mode
- permit an admin/development placeholder
- never display a broken image

## Import Safety

- Upsert by `external_id`.
- Preserve every field.
- Keep `review_status=draft`.
- Do not silently overwrite approved records.
- Report missing image assets as warnings rather than import failures.

## Validation

Confirm:

- 75 unique questions import
- every question has four choices
- correct letters remain A–D
- all choice explanations remain aligned
- memory aids and visual metadata remain attached
- adaptive selection can draw from all 75
- Practice Test Mode hides support until submission

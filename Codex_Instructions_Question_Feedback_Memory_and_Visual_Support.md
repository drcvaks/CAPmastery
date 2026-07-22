# Codex Instructions: Unified Question Feedback, Memory Aids, and Visual Support

## Current Scope

Use the attached file:

`LTL_V1_Chapter_1_Pilot_10_Questions_Complete_Learning_Support.csv`

This file contains the same 10 pilot questions already used in the app, plus:

- concise learner-facing explanations
- optional memory aids
- optional visual-support metadata
- deeper remediation text

Implement these features for the current 10-question pilot only. Keep the schema reusable so the remaining Chapter 1 questions can be imported later without redesigning the question system.

Do not generate new educational content inside Codex. Import and display the reviewed content supplied in the CSV.

---

## Purpose

The result screen must help students learn without overwhelming them.

The primary pilot users include a student with dyslexia, so the default feedback must:

- use minimal words
- avoid repeated text
- avoid large paragraphs
- present one idea at a time
- let the student request more help only when needed

The system should provide four levels of support:

1. short result feedback
2. optional memory aid
3. optional visual support
4. optional deeper explanation/remediation

---

## Relevant CSV Fields

### Core feedback fields

- `short_explanation`
  - the default learner-facing explanation
  - normally one or two short sentences
  - this is what should appear immediately after answering

- `explanation`
  - the fuller correct-concept explanation
  - normally hidden behind `Explain more`

- `choice_a_explanation`
- `choice_b_explanation`
- `choice_c_explanation`
- `choice_d_explanation`
  - explains why each specific choice is correct or incorrect
  - use the explanation corresponding to the student’s selected choice

- `common_mistake`
  - internal misconception metadata
  - do not display automatically as a heading to students

- `remediation_text`
  - deeper instructional prompt or corrective strategy
  - normally hidden
  - may appear after repeated difficulty or when the student selects `Explain more`

- `memory_aid`
  - short mnemonic, phrase, analogy, contrast, or recall cue
  - shown only when the student selects `Memory trick`

- `feedback_display_version`
  - current value is `1`
  - preserve this field for future display-rule changes

### Visual fields

- `visual_priority`
- `visual_type`
- `visual_display_mode`
- `visual_asset_key`
- `visual_brief`
- `visual_caption`
- `visual_alt_text`

`visual_brief` is internal design guidance and must not be displayed to students.

---

## Required Result-Screen Behavior

### When the student answers correctly

Show:

1. `Correct`
2. `short_explanation`

Do not automatically show:

- the selected-choice explanation when it repeats the same idea
- the full `explanation`
- `remediation_text`
- `memory_aid`
- the visual

Below the short explanation, show optional controls only when content is available:

- `Memory trick`
- `Show visual`
- `Explain more`

### When the student answers incorrectly

Show:

1. `Not quite`
2. the explanation for the answer the student selected
3. a short correction using `short_explanation`, but only when needed to make the correct idea clear

Avoid repeating the same sentence twice.

Then show optional controls:

- `Memory trick`
- `Show visual`
- `Explain more`

### Duplicate-Suppression Rule

Before displaying two pieces of feedback, compare them.

If the selected-choice explanation and `short_explanation` are identical or substantially repetitive:

- display only one
- prefer the wording that is shorter and clearer

The same rule applies to `explanation` and the correct-choice explanation.

---

## Expandable Support Controls

### Memory trick

Show this control only when `memory_aid` is not blank.

When opened:

- display only the `memory_aid`
- keep it visually separate from the explanation
- allow it to collapse again

Suggested label:

`Memory trick`

### Show visual

Show this control only when:

- `visual_asset_key` exists, and
- an approved asset is available

When opened, display:

- the image or diagram
- `visual_caption`
- accessible `visual_alt_text`
- a close or collapse control

Do not show a broken image.

If the metadata exists but the image has not yet been uploaded:

- show a placeholder only in admin/development mode
- hide the `Show visual` control from students

### Explain more

When opened, display:

1. the fuller `explanation`
2. `remediation_text` when useful

Do not repeat text already visible in the short explanation.

Keep the expanded content chunked into short paragraphs.

---

## Repeated-Difficulty Behavior

Track mistakes by `concept_code`.

Suggested behavior:

### First incorrect answer

- show short corrective feedback
- leave Memory trick, Show visual, and Explain more optional

### Second incorrect answer on the same concept

- automatically open `Memory trick` if available
- otherwise keep the control prominent

### Third incorrect answer on the same concept

- automatically open the visual if an approved visual is available
- also make `Explain more` prominent

This behavior should be configurable rather than permanently hard-coded.

Do not automatically open several large sections at the same time.

---

## Accessibility and Dyslexia-Friendly Design

- Keep the default explanation to approximately 10–30 words whenever possible.
- Use one or two short sentences.
- Use comfortable line spacing.
- Avoid full-width dense paragraphs.
- Left-align text.
- Do not use all caps for explanation content.
- Keep buttons clearly separated.
- Do not rely only on color to communicate correct or incorrect.
- Preserve text explanations even when a visual exists.
- Require meaningful alt text for every visual.
- Avoid putting large amounts of text inside images.

The student must be able to understand the essential concept without opening optional help.

---

## Suggested Result Layout

Correct example:

**Correct**

Faithful service means staying dependable and keeping your commitment over time.

[Memory trick] [Show visual] [Explain more]

Incorrect example:

**Not quite**

Perfect performance is not required.

Faithful service means staying dependable and keeping your commitment over time.

[Memory trick] [Show visual] [Explain more]

Do not show the source as a large content block. It may appear in small secondary text or behind a source-details control.

---

## Visual Asset Storage

Use a separate asset record or storage layer.

Suggested structure:

### `visual_assets`

- `id`
- `asset_key` unique
- `storage_path`
- `mime_type`
- `width`
- `height`
- `alt_text`
- `status`
- `created_at`
- `updated_at`

Allowed status values:

- `draft`
- `approved`
- `archived`

Question records should reference `visual_asset_key`, not a hard-coded public URL.

One approved visual may support several questions.

---

## Import Requirements

1. Preserve all existing question fields.
2. Import:
   - `short_explanation`
   - `feedback_display_version`
   - `memory_aid`
   - all visual fields
3. Blank optional-support fields must remain valid for future questions.
4. Re-importing the same `external_id` must update the draft record rather than create a duplicate.
5. Do not overwrite an approved question or approved visual silently.
6. Report missing visual assets as warnings, not question-import failures.
7. Preserve UTF-8 punctuation.
8. Confirm that all 10 questions remain usable even when no visual asset has been uploaded.

---

## Admin and Review Requirements

The reviewer should be able to see and edit:

- short explanation
- full explanation
- each choice explanation
- remediation
- memory aid
- visual priority
- visual type
- asset key
- visual brief
- visual caption
- alt text
- visual approval status

The review screen should make it easy to detect:

- repeated explanation text
- explanations that are too long
- unclear memory aids
- missing alt text
- decorative visuals that do not teach the concept

---

## Current Checkpoint Validation

Verify all of the following:

- the updated 10-question CSV imports successfully
- no duplicate questions are created
- `short_explanation` is the default visible explanation
- correct answers do not show duplicate explanations
- incorrect answers show the selected-choice explanation
- Memory trick appears only when requested
- Explain more remains collapsed by default
- Show visual is hidden when no approved asset exists
- missing visual assets do not break the question flow
- the result screen remains clear on a phone
- all controls are keyboard and screen-reader accessible
- the app still works when optional fields are blank

Do not import the remaining 65 questions yet. First validate this complete learning-support flow with the 10-question sample.

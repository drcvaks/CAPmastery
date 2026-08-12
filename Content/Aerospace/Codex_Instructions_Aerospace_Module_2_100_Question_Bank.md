# Codex Instructions: Aerospace Dimensions Module 2 — 100-Question Bank

## Files

- `Aerospace_Dimensions_Module_2_100_Questions_Complete_Support.csv`
- `Aerospace_Dimensions_Module_2_Visual_Asset_Manifest.csv`

The question CSV is UTF-8 with BOM and tab-delimited.

## Scope

100 original questions based on *Aerospace Dimensions Module 2: Aircraft Systems and Airports*.

- Chapter 1 — Airplane Systems: 52 questions
- Chapter 2 — Airports: 32 questions
- Chapter 3 — Airport to Airport / Aeronautical Charts: 16 questions

Total: 100 questions.

## Important

Use the CSV counts, not this prose, if there is any discrepancy. Upsert by `external_id`; do not plain-insert over existing data. Preserve database primary keys and learner history.

Every question includes four choices, correct letter, short and full explanation, an explanation for each choice, mnemonic, remediation, source pages, visual metadata, exam-likeness, final-exam eligibility, and a sibling reinforcement question.

## Study Mode

Use all Module 2 questions. After answering, show concise correctness feedback and the short explanation. Offer buttons for `Memory trick`, `Show visual`, and `Explain more`. Wrong-answer feedback should show the selected-choice explanation and avoid repeating the same wording twice.

## Practice / Final Exam Mode

Filter `eligible_for_final_exam = true`. Hide correctness, explanations, mnemonic, visual, and remediation until the test is submitted.

## Visuals

The bank uses shared visual groups rather than one image per question:

- `recip_engine_cycle`
- `fuel_carb_controls`
- `electrical_jet_engine`
- `engine_flight_instruments`
- `airport_layout_profile`
- `runway_signs_lights`
- `sectional_chart_basics`

Upload the matching PNGs to the paths in `visual_storage_path`. The seven PNG assets in this package are approved for Module 2 study use. Keep `Show visual` hidden only if an asset cannot be loaded from storage.

## Validation

- 100 unique `external_id` values
- all questions have four choices
- correct letters limited to A-D
- all four choice explanations aligned with their displayed choices
- reinforcement IDs point to the sibling question in the same family
- no duplicate questions created

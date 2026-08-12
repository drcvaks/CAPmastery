# Codex Instructions — Aerospace Dimensions Module 4: Rockets

## Package
`AD_M4_100`

## CSV format
- UTF-8 with BOM
- comma-delimited
- exactly one header row
- standard CSV quoting for commas, quotation marks, and line breaks
- preserves the established Module 3 field order; required `package_code` is appended as the final field

## Import files
- `Aerospace_Dimensions_Module_4_100_Questions_Complete_Support.csv`
- `Aerospace_Dimensions_Module_4_Visual_Asset_Manifest.csv`
- seven PNG visual assets listed in the manifest

## Import behavior
1. Upsert questions by `external_id`; do not plain-insert duplicates.
2. Preserve database primary keys and learner mastery/history records.
3. Do not strip any learning-support fields.
4. Register/upload the visual assets using the exact `visual_asset_key`, `visual_file_name`, and `visual_storage_path` values from the manifest.
5. `show_visual_button=true` exposes optional visual help after answer submission in Study Mode.
6. Hide mnemonics, explanations, and visuals during Practice Test / Final Exam mode until submission.
7. `eligible_for_final_exam=true` marks the higher-exam-likeness pool for future mixed Mitchell practice exams.

## Validation
Confirm:
- exactly 100 Module 4 rows
- 100 unique `external_id` values
- `package_code = AD_M4_100` for all rows
- `module_number = 4` for all rows
- chapter numbers only 1, 2, or 3
- four populated choices per question
- `correct_letter` only A, B, C, or D
- short/full explanations, all four choice explanations, mnemonic, remediation, and visual support fields populated
- every `visual_asset_key` exists in the visual manifest
- every question CSV image filename matches the manifest exactly
- sibling pairs share `question_family_code` and cross-link with `reinforcement_question_ids`

## Study behavior
Use all 100 questions for Module/Chapter Study with the existing adaptive mastery system. After submission, show concise feedback first. Keep `Memory Trick`, `Show Visual`, and `Explain More` optional.

## Visual behavior
Multiple related questions intentionally share one strong visual. If an asset cannot be resolved, hide `Show Visual` rather than displaying a broken image.

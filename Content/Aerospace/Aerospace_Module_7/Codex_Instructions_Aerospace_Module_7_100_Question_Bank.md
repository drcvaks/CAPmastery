# Codex Instructions — Aerospace Dimensions Module 7

## Package
`AD_M7_100`

## CSV format
- UTF-8 with BOM
- comma-delimited
- exactly one header row
- standard CSV quoting for fields containing commas, quotation marks, or line breaks
- preserve the established Module 6 column names and field order
- do not parse as tab-delimited

## Files
- `Aerospace_Dimensions_Module_7_100_Questions_Complete_Support.csv`
- `Aerospace_Dimensions_Module_7_Visual_Asset_Manifest.csv`
- `Aerospace_Dimensions_Module_7_100_Questions_Review_Workbook.xlsx`
- seven PNG visual assets

## Question bank
- exactly 100 questions
- 50 concept families
- 50 direct exam-style questions
- 50 paired application questions
- 75 `eligible_for_final_exam=true`
- 25 study/reinforcement questions
- answer positions balanced exactly A=25, B=25, C=25, D=25
- package code `AD_M7_100`

Chapter distribution:
- Chapter 1 — Introduction to Cyber Security: 24 questions
- Chapter 2 — Common Cyberattacks: Beware of the Attack: 20 questions
- Chapter 3 — Improving Your Personal Security: 20 questions
- Chapter 4 — Protecting Your Digital Footprint: 18 questions
- Chapter 5 — The Future of Cyber Security: 18 questions

## Supabase import
1. Upsert questions by `external_id`.
2. Preserve existing database primary keys and learner mastery/history.
3. Do not create duplicate records.
4. Preserve all learning-support fields.
5. Register visual assets using the exact `visual_asset_key`, `visual_file_name`, and `visual_storage_path` values in the manifest.
6. If an image is unavailable, hide the visual button rather than display a broken image.

## Learning-support behavior
In Study Mode, after answer submission:
- show Correct / Not quite
- show `short_explanation`
- on a wrong answer, show the selected-choice explanation
- provide an optional `Memory trick` button using `memory_aid`
- provide an optional `Show visual` button
- provide an optional `Explain more` action using the full explanation and remediation
- avoid duplicate wording

During Practice Test / Final Exam:
- hide correctness
- hide mnemonics
- hide visuals
- hide explanations
- reveal support only after submission/review

## Visual assets
Exact mappings:

- `module7_cyberspace_basics` → `cyberspace_and_cybersecurity_basics_infographic.png`
- `module7_common_cyberattacks` → `cybersecurity_attacks_and_defense_guide.png`
- `module7_quick_review_memory_aids` → `cyber_security_quick_review_infographic.png`
- `module7_personal_security_privacy` → `improving_personal_security_online_privacy.png`
- `module7_digital_footprint_safety` → `cybersecurity_protect_your_digital_footprint.png`
- `module7_cyber_careers_pathways` → `cyber_security_career_pathway_infographic.png`
- `module7_network_communication` → `how_networks_communicate_infographic.png`

Related questions intentionally share the same strong teaching visual.

## Validation
Before completing import, verify:
- 100 unique `external_id` values
- `module_number=7` on every row
- `package_code=AD_M7_100` on every row
- chapter numbers only 1, 2, 3, 4, 5
- exactly four populated choices per question
- `correct_letter` limited to A/B/C/D
- answer distribution A=25, B=25, C=25, D=25
- all short/full explanations populated
- all four choice explanations populated
- all mnemonics populated
- all remediation fields populated
- all visual fields populated
- every `visual_asset_key` matches a manifest row exactly
- all seven image filenames exist in storage
- 75 final-exam eligible, 25 reinforcement/study
- paired reinforcement IDs point to sibling questions

# Codex Update Instructions — Wright Brothers Chapter 1 Visual Upgrade

## Important current state
The Supabase importer has already been built, **but the user has NOT run the Chapter 1 Supabase import yet**.

Therefore, do **not** treat this as a post-import migration or patch. Use this upgraded package as the **first and only initial import** for `LTL1_C1_100`.

The 100-question CSV has intentionally been kept unchanged. The update is primarily the visual layer.

## What to do before the first import
1. Use `Learn_to_Lead_Vol1_Chapter_1_100_Questions_Complete_Support.csv` as the question source.
2. Replace the prior Chapter 1 question-linked visual manifest with `Learn_to_Lead_Vol1_Chapter_1_Visual_Asset_Manifest_UPDATED.csv`.
3. Upload the eight upgraded PNGs using the exact filenames in that manifest.
4. Keep the existing `visual_asset_key` values exactly as they are. The question CSV already points to those keys, so **no question remapping is required**.
5. Then run the existing Supabase import once.

## Do not do these things
- Do not import the old plain Chapter 1 visuals first.
- Do not run a visual replacement migration after the question import; it is unnecessary because the import has not run yet.
- Do not change the 100 question IDs.
- Do not change `package_code=LTL1_C1_100`.
- Do not create duplicate visual records for the same eight question-linked `visual_asset_key` values.

## Question-linked upgraded visuals
- `ltl1_c1_core_values` → `c1_core_values.png`
- `ltl1_c1_warrior_selfleadership` → `c1_warrior_selfleadership.png`
- `ltl1_c1_oath_chain_command` → `c1_oath_chain_command.png`
- `ltl1_c1_customs_flag_drill` → `c1_customs_flag_drill.png`
- `ltl1_c1_flag_etiquette_parts` → `c1_flag_etiquette_parts.png`
- `ltl1_c1_customs_courtesies_quick_chart` → `c1_customs_courtesies_quick_chart.png`
- `ltl1_c1_cadet_oath_breakdown` → `c1_cadet_oath_breakdown.png`
- `ltl1_c1_drill_terminology_purpose` → `c1_drill_terminology_purpose.png`

These upgraded images are intentionally more memorable: cadet scenes, visual cues, icons, simple mnemonics, and concrete examples rather than plain text cards.

## Bonus Cadet Grade Insignia visual
The package also contains:
- `c1_cadet_grade_insignia_guide.png`
- `Learn_to_Lead_Vol1_Chapter_1_Supplemental_Visual_Manifest.csv`

This is a **supplemental study reference**, not a required question-linked asset. If the app already has a Study Library / Extra Help / Reference Visuals area, register it there. If not, leave the file uploaded but do not force a question mapping.

Because exact CAP grade insignia artwork is a factual uniform reference, verify that bonus illustration against the current official CAP New Cadet Guide / uniform materials before displaying it as an authoritative insignia chart. It is fine to use the concept and layout, but exact insignia shapes should come from official CAP references.

## Study-mode behavior
Keep the same logic already implemented:
- after answer: short explanation
- wrong answer: selected-choice explanation
- optional Memory Trick
- optional Show Visual
- optional Explain More / remediation
- no visual or mnemonic before answering

## Exam-mode behavior
Do not show visual help, mnemonic help, correctness, or explanations until after submission.

## Validation before running the first Supabase import
Confirm:
- exactly 100 question rows
- `package_code=LTL1_C1_100`
- 8 question-linked visual keys resolve to the upgraded files
- no broken image paths
- no duplicate visual asset records
- supplemental insignia asset is not required for question import
- the old plain visuals are not being imported in parallel

## Recommended sequence
1. Replace local/staged old Chapter 1 visual files with the upgraded files from this package.
2. Load the updated question-linked visual manifest.
3. Optionally register the supplemental insignia reference.
4. Run the existing Supabase importer once.
5. Smoke-test one question from each visual group before enabling the bank for users.

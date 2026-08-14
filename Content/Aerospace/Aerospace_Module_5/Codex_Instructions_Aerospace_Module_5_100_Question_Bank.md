# Codex Instructions — Aerospace Dimensions Module 5 (AD_M5_100)

Import this package using the same handling as Module 4.

## Question bank
- File: `Aerospace_Dimensions_Module_5_100_Questions_Complete_Support.csv`
- Encoding: UTF-8 with BOM
- Delimiter: **comma**
- Rows: exactly **100**
- Columns: exactly **50**
- Unique key: `external_id`
- Package code: `AD_M5_100`

## Question-bank design
The Module 5 bank deliberately mirrors the Module 4 pattern:
- 50 `direct_exam_style` questions
- 50 `brief_application` reinforcement questions
- 50 `medium`
- 50 `medium_hard`
- 50 `recall`
- 50 `application`
- 75 questions eligible for the final exam
- 25 questions not eligible for the final exam
- Direct questions use `final_exam_weight = 1.0`
- Application questions use `final_exam_weight = 0.8`
- Correct letters are balanced: 25 A, 25 B, 25 C, 25 D
- Each concept has a paired reinforcement question through `reinforcement_question_ids`

## Chapters
- Chapter 1: `Space` — 24 questions
- Chapter 2: `Stars` — 24 questions
- Chapter 3: `Our Solar System: Sun, Moon, and More` — 26 questions
- Chapter 4: `Our Solar System: Planets` — 26 questions

## Learning support
Each question includes:
- `short_explanation`
- full `explanation`
- four choice-specific explanation fields
- `memory_aid`
- `remediation_text`
- source page/reference fields
- optional visual support metadata

## Visual assets
Use `Aerospace_Dimensions_Module_5_Visual_Asset_Manifest.csv`.

Visual keys:
- `module5_space_basics`
- `module5_galaxies_universe`
- `module5_stars_life_cycle`
- `module5_sun_moon_eclipses`
- `module5_small_bodies`
- `module5_inner_outer_planets`
- `module5_planet_dwarf_pluto`

The corresponding PNGs should be stored under `/assets/cap-visuals/` using the filenames in the manifest.

## Import behavior
1. Upsert visual manifest rows by `visual_asset_key`.
2. Upsert questions by `external_id`.
3. Do not deduplicate by question text.
4. Preserve all 50 column names exactly.
5. Parse quoted comma-containing fields correctly.
6. Keep `show_visual_button = true` only when the linked asset resolves.
7. Use `visual_caption` and `visual_alt_text` in the visual-help modal.

## Validation after import
Confirm:
- exactly 100 Module 5 questions
- exactly 7 visual assets
- all IDs unique
- every question has four answer choices
- every `correct_letter` is A/B/C/D
- every question has explanations, mnemonic, and remediation text
- all visual keys resolve
- 75/25 final-exam eligibility split
- 25 correct answers for each letter A/B/C/D

This bank is grounded in the official Aerospace Dimensions Module 5 PDF and follows the same question-bank structure as the Module 4 package.

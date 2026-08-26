# Codex Instructions — Corrected Chapter 3 Import

Package: `LTL1_C3_100`
Chapter: `3`

Use the corrected files in this ZIP as the source of truth.

## Corrections applied
1. Preserved all 100 original `external_id` values.
2. Preserved substantive question content.
3. Reordered choices and the matching choice explanations so correct answers are exactly:
   - A = 25
   - B = 25
   - C = 25
   - D = 25
4. Set exactly:
   - 75 `exam_type_question=yes` / `eligible_for_final_exam=true`
   - 25 `exam_type_question=no` / `eligible_for_final_exam=false`
5. Created exactly 50 two-question families:
   - `LTL1-C3-F01` through `LTL1-C3-F50`
   - each pair has reciprocal `reinforcement_question_ids`
6. Moved `ltl1_c3_drill_reference` into the primary visual manifest.
   - Primary manifest now has 10 linked assets.
   - Supplemental manifest is intentionally header-only.
7. Preserved package code `LTL1_C3_100`.
8. Preserved chapter number `3`.
9. Preserved all existing visual asset keys.

## Import behavior
- Upsert questions by `external_id`.
- Do not deduplicate by question text.
- Keep learner history/mastery on later re-imports.
- Use the corrected primary visual manifest for all 10 linked visuals.
- If a visual asset cannot resolve, hide the visual button rather than showing a broken image.

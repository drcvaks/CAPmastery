# Codex Instructions — Aerospace Dimensions Module 3 (Air Environment)

## Deliverables in this package
- `Aerospace_Dimensions_Module_3_100_Questions_Complete_Support.csv`
- `Aerospace_Dimensions_Module_3_100_Questions_Review_Workbook.xlsx`
- `Aerospace_Dimensions_Module_3_Visual_Asset_Manifest.csv`
- 7 visual PNG files referenced by the CSV and manifest

## What this bank contains
- 100 multiple-choice questions grounded in **Aerospace Dimensions Module 3: Air Environment**.
- Questions cover **all five chapters**:
  1. The Atmosphere
  2. Air Circulation
  3. Weather Elements
  4. Moisture and Clouds
  5. Weather Systems and Severe Weather
- Each concept family has **two linked questions**:
  - one **direct-definition / recognition** question
  - one **brief-application** question
- Every question includes:
  - correct answer letter
  - short explanation
  - fuller explanation
  - per-choice explanation
  - short mnemonic / memory aid
  - remediation prompt
  - source chapter/pages
  - visual asset mapping

## Important import guidance
This Module 3 bank is intended to work the same way as the Module 1 and Module 2 aerospace banks.

### Core assumptions
- `external_id` values are unique and begin with `AD-M3-...`.
- `question_family_code` groups sibling questions about the same concept.
- `reinforcement_question_ids` links the direct-definition question with its paired application question.
- `visual_asset_key` maps to the visual asset manifest.
- `show_visual_button=true` means the UI should allow the cadet to open the optional diagram after answering.

### Recommended import process
1. **Upload / stage the 7 PNG visual assets** in the location your app expects for static study images.
2. **Import the manifest** or otherwise register the visual assets so the app can resolve `visual_asset_key` and `visual_storage_path`.
3. **Import the 100-question CSV** into the same question table used for the earlier aerospace banks.
4. Preserve all existing columns. Do **not** strip out:
   - `memory_aid`
   - `choice_a_explanation` / `choice_b_explanation` / `choice_c_explanation` / `choice_d_explanation`
   - `visual_asset_key`
   - `visual_file_name`
   - `visual_storage_path`
   - `show_visual_button`
   - `eligible_for_final_exam`
5. Confirm that the review / remediation panel can display, at minimum:
   - whether the answer was correct
   - short explanation
   - memory aid
   - optional “Show visual help” button
   - optional per-choice explanation, if your UI already supports it

## Suggested study behavior
- **Study mode:** allow all 100 Module 3 questions to appear.
- **Adaptive mode:** use the same mastery logic already built for CAP Mastery.
- **Final-exam practice mode:** prefer items where `eligible_for_final_exam=true`.
- **Visual support:** only show the image on demand (after answer submission) so the image helps learning without giving away the answer too early.

## Visual assets included
- `module3_atmosphere_layers` → `module3_atmosphere_layers.png` — Atmosphere composition, standard lapse rate, and major layers from troposphere through thermosphere.
- `module3_solar_heating_seasons` → `module3_solar_heating_seasons.png` — Solar heating, unequal heating, Earth rotation and revolution, and the solstices and equinoxes.
- `module3_coriolis_winds_jetstream` → `module3_coriolis_winds_jetstream.png` — Coriolis deflection, trade winds, doldrums, prevailing westerlies, and the jet stream.
- `module3_weather_elements_heat_transfer` → `module3_weather_elements_heat_transfer.png` — Wind, knots, Beaufort scale, heat transfer methods, pressure, wind chill, and microburst concepts.
- `module3_moisture_clouds` → `module3_moisture_clouds.png` — Saturation, dew point, condensation, fog, precipitation, and cumulonimbus cloud formation.
- `module3_fronts_air_masses` → `module3_fronts_air_masses.png` — Major air masses and the structure of warm, cold, stationary, and occluded fronts.
- `module3_severe_weather_safety` → `module3_severe_weather_safety.png` — Thunderstorm life cycle, tornado awareness, and key hurricane structure and safety ideas.

## QA / validation checklist for Codex
After import, verify:
- 100 Module 3 rows imported
- 50 unique `question_family_code` values
- every family has 2 linked questions
- all rows have a non-empty `memory_aid`
- all rows have `show_visual_button=true`
- all rows resolve to one of the 7 asset keys in the manifest
- the app can display a question, accept an answer, show correctness, show the explanation, and open the optional visual support

## Notes on content style
- Wrong answers are intentionally plausible but still clearly wrong after review.
- The goal is test preparation in a style similar to the Mitchell aerospace samples without copying official CAP test questions verbatim.
- Explanations are intentionally concise for readability, while the memory aid provides an even shorter reinforcement hook.

# Codex Instructions: Aerospace Module 1 Visual Integration

## Files

Use these files together:

- `Aerospace_Dimensions_Module_1_100_Questions_With_Visual_Assets.csv`
- `Aerospace_Dimensions_Module_1_Visual_Asset_Manifest.csv`

These files extend the Module 1 question bank so the app can show real visual aids for matching questions.

## Purpose

The app already has support for:

- `memory_aid`
- `visual_asset_key`
- `visual_caption`
- `visual_alt_text`
- optional `Show visual` behavior

The only missing piece was a stable mapping between questions and actual image assets.

This file provides that mapping.

## What Changed

The updated question bank now includes these app-facing fields:

- `visual_group`
- `visual_file_name`
- `visual_storage_path`
- `visual_status`
- `show_visual_button`

It also updates many questions so their `visual_asset_key` points to a real shared asset instead of a family-specific placeholder.

## Visual Groups

This Module 1 pack uses six approved shared visuals:

1. `four_forces_of_flight`
2. `three_axes_of_flight`
3. `airfoil_basics`
4. `control_surfaces`
5. `gliders_and_thermals`
6. `hot_air_balloon_parts`

Many related questions reuse the same visual. This is intentional and preferred.

## Why Shared Visuals Are Better

Do **not** try to create one separate image per question.

For study support, it is better to let several related questions point to the same strong teaching image.

Example:

- lift
- gravity
- thrust
- drag
- balanced flight forces

can all use the same `four_forces_of_flight` visual.

This reduces asset bloat and keeps the app simpler.

## Import Behavior

Upsert by `external_id` as usual.

Preserve the existing question records and update the new visual mapping fields.

Do not create duplicate questions.

## Asset Storage

Store the actual image files in a predictable public or signed storage location.

Example target structure:

- `/assets/cap-visuals/four_forces_of_flight_infographic.png`
- `/assets/cap-visuals/three_axes_of_flight_infographic.png`
- `/assets/cap-visuals/airfoil_basics_wing_and_airflow_diagram.png`
- `/assets/cap-visuals/control_surfaces_flight_memory_aid.png`
- `/assets/cap-visuals/gliders_and_thermals_infographic.png`
- `/assets/cap-visuals/hot_air_balloon_parts_infographic.png`

If you use Supabase Storage instead, keep the same filenames and map them to public URLs or signed URLs in your app layer.

## Recommended Question Table Columns

If they do not already exist, add:

```sql
alter table public.questions
  add column if not exists visual_group text,
  add column if not exists visual_file_name text,
  add column if not exists visual_storage_path text,
  add column if not exists visual_status text,
  add column if not exists show_visual_button boolean default false;
```

These are optional convenience columns.

The app may also derive display behavior using only:

- `visual_asset_key`
- `visual_caption`
- `visual_alt_text`

but these added fields make integration easier.

## Student Display Behavior

### Study Mode

After answering:

- show short explanation
- show `Memory trick` if `memory_aid` exists
- show `Show visual` if `show_visual_button = true` and the asset exists
- show `Explain more` as before

When the cadet taps `Show visual`, display:

- the image
- `visual_caption`
- accessible `visual_alt_text`

The visual should appear in a modal or expandable card.

### Practice Test / Final Exam Mode

During the test:

- hide `Memory trick`
- hide `Show visual`
- hide explanations

After submission:

- allow the cadet to review each missed question
- show the visual then if available

## Visual Mapping Logic

When `show_visual_button = true`:

1. Try `visual_storage_path` first.
2. If the app uses a manifest or storage lookup table, match by `visual_asset_key`.
3. If the asset is missing, hide the button rather than showing a broken image.

## Validation Checklist

After import, confirm:

- questions still import as 100 unique records
- many questions now share the same `visual_asset_key`
- `show_visual_button = true` for supported questions
- the app shows the correct visual for lift/drag/weight/thrust questions
- the app shows the correct visual for roll/pitch/yaw questions
- the app shows the correct visual for control-surface questions
- the app shows the correct visual for glider/thermal questions
- the app shows the correct visual for balloon questions
- `Show visual` is hidden when an asset is missing
- visuals remain hidden during practice-test mode until review

## Good Integration Pattern

If you want the simplest implementation:

- upload the six PNGs to storage
- import the updated CSV
- render `Show visual` whenever `show_visual_button = true`
- load the image from `visual_storage_path`

That is enough to make Aerospace Module 1 visuals work in the app without redesigning the schema.

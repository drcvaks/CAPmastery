# Codex Notes: 30-Question Adaptive Bank with Complete Learning Support

Use:

`LTL_V1_Chapter_1_Adaptive_Test_30_Questions_Complete_Support.csv`

This file replaces the earlier 30-question adaptive-test CSV.

All 30 questions now include:

- `short_explanation`
- `memory_aid`
- `feedback_display_version`
- `visual_priority`
- `visual_type`
- `visual_display_mode`
- `visual_asset_key`
- `visual_brief`
- `visual_caption`
- `visual_alt_text`

The original full explanations, choice explanations, remediation, sources, mastery metadata, and reinforcement links remain unchanged.

## Testing Purpose

This allows the 30-question adaptive bank to test both:

1. mastery and spaced-review selection
2. the complete post-answer learning-support flow

For every question, verify:

- short explanation appears by default
- Memory trick is available
- Explain more remains optional
- visual metadata imports correctly
- Show visual appears only when an approved asset exists
- missing visual files do not break the question
- no duplicate explanation is shown
- optional supports remain associated with the correct question after adaptive selection

## Important Asset Note

The CSV contains complete visual briefs and asset keys, but it does not contain image files.

Until assets are uploaded:

- use development placeholders only in admin/development mode
- hide Show visual in normal student mode
- do not display broken images

Memory aids and short explanations can be fully tested immediately for all 30 questions.

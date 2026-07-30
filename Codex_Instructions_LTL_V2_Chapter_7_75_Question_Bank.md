# Codex Instructions: LTL Volume 2, Chapter 7 — 75-Question Bank

## Import File

Use `LTL_V2_Chapter_7_75_Questions_Complete_Support.csv`.

The file is UTF-8 with BOM and tab-delimited, matching the existing Chapter 4–6 imports.

## Scope

This bank contains 75 original questions based on *Learn to Lead, Volume 2, Chapter 7: Leadership Schools of Thought*.

It covers:

- emotional intelligence
- self-awareness, emotion management, self-motivation, empathy, and interpersonal skills
- transformational and transactional leadership
- the four transformational factors
- contingent reward and management by exception
- power and sources of power
- learning organizations and their five disciplines
- systems thinking, personal mastery, shared vision, team learning, and mental models
- inquiry and advocacy
- task and relationship behavior
- situational leadership
- path-goal leadership
- leadership grid theory

## Import and Display

Use the same schema and result-screen logic already implemented for Chapters 4–6.

- Upsert by `external_id`.
- Preserve every field.
- Keep `review_status=draft`.
- Do not overwrite approved records silently.
- In Study Mode, show concise feedback and optional Memory trick, Show visual, and Explain more.
- In Practice Test Mode, hide correctness and all learning support until submission.
- Missing image assets are warnings only; never show broken images.

## Distractors

Do not simplify the distractors. Many intentionally use:

- a neighboring leadership theory
- a partially true statement that does not answer the exact stem
- confusion between position and personal power
- confusion between transformational, transactional, and laissez-faire factors
- confusion among situational, path-goal, and grid approaches

## Validation

Confirm:

- 75 unique questions import
- four choices and valid correct letters
- all choice explanations remain aligned
- mnemonics, visual metadata, source pages, and reinforcement IDs remain attached
- adaptive selection can mix all Chapter 7 concepts

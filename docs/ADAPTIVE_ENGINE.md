# Adaptive Engine

## Initial deterministic model

The non-AI engine operates on a 0–100 topic mastery score. New topics begin at 40 with low confidence; this represents uncertainty rather than proven weakness. Coefficients remain named configuration and pure functions so pilot evidence can tune them.

Updates consider correctness, difficulty, cognitive level, confidence, streaks, prior mastery, recency, and sample count. Correct harder/application items may increase mastery more; missing an easy item decreases it more; confident wrong answers can flag likely misconception; old knowledge loses retention confidence without erasing mastery.

Statuses are `not_started`, `beginning`, `developing`, `proficient`, `mastered`, and `needs_review`.

## Standard 10-question target

- 40% weak topics.
- 20% recently missed questions or related objectives.
- 20% developing topics.
- 10% retention checks from previously strong topics.
- 10% new or harder questions.

Selection must handle rounding, exhausted buckets, exclusions, sparse banks, and deterministic tie-breaking. Prefer a different question on the objective before repeating identical wording. Store a selection reason for auditability.

## Spaced review baseline

- Incorrect: later in the session when possible using a related item, then next day.
- First correct: 2 days.
- Second consecutive correct: 5 days.
- Third: 10 days.
- Continued correctness: expand interval within configured limits.
- A miss after mastery schedules near-term review.

Time is injected into calculation functions. Scheduling is stored as UTC instants and tested at boundary conditions.

## Remediation

After a normal-study miss, return correct answer, concise teaching explanation, available selected-choice explanation, source reference, and remediation prompt. Offer a related question and later retest without showing the explanation first. Practice-test mode withholds all feedback until completion.

## Readiness

Readiness combines topic coverage, recent accuracy, retention, unseen-question performance, practice-test consistency, timed performance, and important weak-objective penalties. Minimum coverage caps the maximum score. Labels are Developing, Getting Close, Practice-Test Ready, and Strong Readiness, always with: “This is a study estimate, not an official CAP result.”

## Required tests

Test every coefficient path, confidence behavior, decay, status boundary, schedule interval, bucket allocation and fallback, duplicate avoidance, seeded ordering, sparse-bank handling, coverage cap, and deterministic replay. Do not tune from only two users without documenting the limitation.

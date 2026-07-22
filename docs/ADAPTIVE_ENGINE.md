# Adaptive Engine

## Initial deterministic model

The non-AI engine operates on a 0–100 topic mastery score. New topics begin at 40 with low confidence; this represents uncertainty rather than proven weakness. Coefficients remain named configuration and pure functions so pilot evidence can tune them.

Updates consider correctness, difficulty, cognitive level, confidence, streaks, prior mastery, recency, and sample count. Initial correct deltas are +5 easy, +7 medium, and +9 hard, with +2 for application/scenario. Initial incorrect deltas are -10 easy, -8 medium, and -6 hard. Correct answers at confidence 1–2 receive 70% of the gain; incorrect answers at confidence 4–5 receive an additional -2 misconception penalty. Scores are clamped to 0–100.

Recent accuracy uses a 75/25 exponential update. Confidence grows with evidence rather than being inferred from the starting score. Status boundaries are beginning below 35, developing below 60, proficient below 80, and mastered at 80 or above; two consecutive misses override the score with `needs_review`. These are transparent pilot defaults, not empirically validated predictions.

Statuses are `not_started`, `beginning`, `developing`, `proficient`, `mastered`, and `needs_review`.

## Standard 10-question target

- 40% weak topics.
- 20% recently missed questions or related objectives.
- 20% developing topics.
- 10% retention checks from previously strong topics.
- 10% new or harder questions.

Selection must handle rounding, exhausted buckets, exclusions, sparse banks, and deterministic tie-breaking. Prefer a different question on the objective before repeating identical wording. Store a selection reason for auditability.

For non-ten targets, floor each percentage and distribute remainder in bucket order. Eligible questions are ranked by bucket, recent 12-hour cooldown, times seen, oldest last-seen time, and a stable student/question hash. Exhausted buckets are filled from remaining eligible questions using the same deterministic priority. Sessions never contain the same question twice and fail clearly if the bank has fewer eligible questions than requested.

## Spaced review baseline

- Incorrect: later in the session when possible using a related item, then next day.
- First correct: 2 days.
- Second consecutive correct: 5 days.
- Third: 10 days.
- Continued correctness: expand interval within configured limits.
- A miss after mastery schedules near-term review.

Continued-correct intervals use `round(10 × 1.7^(streak-3))`, capped at 60 days. A miss also marks one already-selected later question on the same objective as same-session remediation when available. It never mutates the prompt, reveals an answer, or adds a duplicate question.

Time is injected into calculation functions. Scheduling is stored as UTC instants and tested at boundary conditions.

## Remediation

After a normal-study miss, return correct answer, concise teaching explanation, available selected-choice explanation, source reference, and remediation prompt. Offer a related question and later retest without showing the explanation first. Practice-test mode withholds all feedback until completion.

## Readiness

Readiness combines topic coverage, recent accuracy, retention, unseen-question performance, practice-test consistency, timed performance, and important weak-objective penalties. Minimum coverage caps the maximum score. Labels are Developing, Getting Close, Practice-Test Ready, and Strong Readiness, always with: “This is a study estimate, not an official CAP result.”

## Required tests

Test every coefficient path, confidence behavior, decay, status boundary, schedule interval, bucket allocation and fallback, duplicate avoidance, seeded ordering, sparse-bank handling, coverage cap, and deterministic replay. Do not tune from only two users without documenting the limitation.

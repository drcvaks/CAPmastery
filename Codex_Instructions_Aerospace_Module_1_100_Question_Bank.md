# Codex Instructions: Aerospace Dimensions Module 1 — 100-Question Bank

## Import File

Use:

`Aerospace_Dimensions_Module_1_100_Questions_Complete_Support.csv`

The file is UTF-8 with BOM and tab-delimited.

## Scope

This bank contains 100 original questions grounded in *Aerospace Dimensions Module 1: Introduction to Flight*:

- Chapter 1 — Flight: 60 questions
- Chapter 2 — To Fly by the Lifting Power of Rising Air: 24 questions
- Chapter 3 — Balloons: 16 questions

The three supplied Mitchell Aerospace exams were used only as a private style guide. No sample-test question was intentionally copied.

## Content Design

The bank uses 50 question families. Each family contains:

1. a concise direct-definition or exact-concept question
2. a brief application or distinction question

Distractors deliberately use neighboring aerospace terms. Do not simplify or replace them during import.

## Fields

The CSV includes:

- module and chapter fields
- objective, concept, and question-family codes
- four choices and correct letter
- short and full explanations
- separate explanation for every answer choice
- mnemonic
- remediation
- source pages
- visual metadata
- exam-likeness and final-exam eligibility
- reinforcement sibling IDs

## Supabase

Continue using the existing `questions` table. Add nullable columns only if they do not already exist:

```sql
alter table public.questions
  add column if not exists module_number integer,
  add column if not exists chapter_number integer,
  add column if not exists chapter_title text,
  add column if not exists exam_likeness text,
  add column if not exists distractor_difficulty text,
  add column if not exists eligible_for_final_exam boolean default false,
  add column if not exists final_exam_weight numeric default 0,
  add column if not exists content_origin text,
  add column if not exists style_reference text;
```

Upsert on `external_id`. Preserve existing primary keys and learner-history relationships.

## Study Mode

Filter:

```sql
where module_number = 1
```

Use all 100 questions with the existing adaptive mastery and spaced-review system.

After answering, show:

- concise correct/incorrect feedback
- selected-choice explanation
- short explanation
- optional Memory trick
- optional Show visual
- optional Explain more
- remediation and sibling reinforcement as appropriate

## Module Practice Test

Filter:

```sql
where module_number = 1
  and eligible_for_final_exam = true
```

During a practice test, hide:

- correctness
- explanations
- mnemonics
- visuals
- remediation

Reveal them after submission.

## Visual Assets

The file contains visual briefs and asset keys but no image files.

Until an approved asset is linked:

- hide Show visual in student mode
- allow development placeholders only in admin/development mode
- never display broken images

## Validation

After import verify:

- 100 unique `external_id` values
- 60 Chapter 1 questions
- 24 Chapter 2 questions
- 16 Chapter 3 questions
- 75 final-exam-eligible questions
- four nonblank choices per question
- correct letters limited to A–D
- all four choice explanations aligned
- reinforcement IDs point to the sibling question in the same family
- no duplicate question records

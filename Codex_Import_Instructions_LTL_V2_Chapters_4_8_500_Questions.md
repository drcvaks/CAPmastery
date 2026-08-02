# Codex Import Instructions
## Learn to Lead Volume 2 — Chapters 4–8, 500-Question Bank

## Files

You may import either:

- the five chapter-specific 100-question files, or
- `LTL_V2_Chapters_4_8_500_Questions_Final_Exam_Tagged.csv`

Do **not** import both paths, because the combined file contains the same records as the five chapter files.

All files are:

- UTF-8 with BOM
- tab-delimited
- one header row
- 100 questions per chapter
- 500 questions total

## What Changed

Each chapter previously contained 75 questions.

This package:

- preserves those existing 75 records and external IDs
- adds questions `Q076` through `Q100`
- adds 25 original, textbook-grounded, Mitchell-style questions per chapter
- adds final-exam classification fields to all records
- contains 60 final-exam-eligible questions per chapter
- contains 300 final-exam-eligible questions across Chapters 4–8

The three supplied Mitchell exams were used only to analyze style, structure, and distractor difficulty. The new questions are original and grounded in the textbook.

## Required Schema Additions

Continue using the existing `questions` table. Do not create separate study and exam question tables.

Add these nullable columns if they do not already exist:

```sql
alter table public.questions
  add column if not exists chapter_number integer,
  add column if not exists exam_likeness text,
  add column if not exists distractor_difficulty text,
  add column if not exists eligible_for_final_exam boolean default false,
  add column if not exists final_exam_weight numeric default 0,
  add column if not exists content_origin text,
  add column if not exists style_reference text;
```

Optional checks may be added later, but the initial migration should stay simple.

Suggested values:

- `exam_likeness`: `high`, `medium`, `low`
- `distractor_difficulty`: `basic`, `moderate`, `close`
- `content_origin`: `existing_original_bank`, `original_textbook_grounded`
- `style_reference`: `pre_sample_bank_review`, `Mitchell_sample_style_analysis`

## Import Behavior

1. Parse the files as tab-delimited, not comma-delimited.
2. Upsert by `external_id`.
3. Preserve the existing record ID when an `external_id` already exists.
4. Update the support and classification fields supplied in the CSV.
5. Do not create duplicates.
6. Keep `review_status=draft`.
7. Treat missing visual assets as warnings, not import failures.
8. Convert:
   - `chapter_number` to integer
   - `eligible_for_final_exam` to boolean
   - `final_exam_weight` to numeric
   - `estimated_time_seconds` to integer if the existing column is numeric
9. Preserve the four answer-choice explanations and keep them aligned with choices A–D.
10. Preserve `reinforcement_question_ids` as the format currently used by the app.


## Existing Supabase Data and Safe Upsert Requirements

The database may already contain the original 75 questions for each of Chapters 4–8.

The combined 500-question file intentionally contains:

- the same original 75 questions per chapter, using their existing `external_id` values
- 25 new questions per chapter, using new IDs `Q076` through `Q100`

The import must therefore be an **upsert**, not a plain insert.

### Required behavior

- Use `external_id` as the conflict key.
- Preserve the existing Supabase primary key for any matching question.
- Update only the question fields supplied by the CSV.
- Insert `Q076` through `Q100` as new records.
- Do not delete or recreate existing question records.
- Do not alter or detach learner mastery, responses, review history, saved exam attempts, or other records linked to the existing question primary keys.
- Abort the import and report the problem if duplicate `external_id` values already exist in Supabase.

### Pre-import duplicate check

Run:

```sql
select external_id, count(*)
from public.questions
group by external_id
having count(*) > 1;
```

The query must return no rows before import proceeds.

### Unique constraint

Confirm that `external_id` has a unique constraint or unique index.

Do not add a second constraint if one already exists.

If none exists, add one only after confirming there are no duplicate values:

```sql
alter table public.questions
add constraint questions_external_id_key unique (external_id);
```

### Supabase upsert example

Use the project’s existing Supabase client and equivalent error handling:

```ts
const { error } = await supabase
  .from("questions")
  .upsert(questionRows, {
    onConflict: "external_id",
    ignoreDuplicates: false,
  });

if (error) {
  throw new Error(`Question import failed: ${error.message}`);
}
```

Do not use a plain `.insert()` for this file.

### SQL equivalent

```sql
insert into public.questions (
  external_id,
  question_text
  -- additional supplied question fields
)
values (
  :external_id,
  :question_text
  -- additional supplied values
)
on conflict (external_id)
do update set
  question_text = excluded.question_text
  -- update only fields supplied by the CSV
;
```

Do not update the table’s generated primary key in the conflict clause.

### Post-import verification

After the import, confirm:

```sql
select chapter_number, count(*) as total_questions
from public.questions
where chapter_number between 4 and 8
group by chapter_number
order by chapter_number;
```

Expected result: 100 questions for each chapter.

Also confirm:

```sql
select count(*) as final_exam_eligible
from public.questions
where chapter_number between 4 and 8
  and eligible_for_final_exam = true;
```

Expected result: 300 final-exam-eligible questions.

Finally, rerun the duplicate check and confirm that it still returns no rows.


## Study Modes

### Chapter Study

Filter by the selected chapter:

```sql
where chapter_number = :selected_chapter
```

Chapter Study may use all 100 questions. Continue using the existing adaptive mastery and spaced-review system.

After an answer, Study Mode may show:

- short explanation
- selected-choice explanation
- Memory trick
- optional visual
- Explain more
- remediation
- a related reinforcement question

### Chapter Practice Test

Use the selected chapter and final-exam eligibility:

```sql
where chapter_number = :selected_chapter
  and eligible_for_final_exam = true
```

Suggested session sizes:

- 10 questions
- 20 questions
- 25 questions

During the session, hide:

- correctness
- explanations
- memory aids
- visuals
- remediation

Show those only after submission.

## Full Mitchell Practice Exam

Generate a new 50-question exam from Chapters 4–8:

```sql
where chapter_number between 4 and 8
  and eligible_for_final_exam = true
```

### Recommended chapter distribution

For each generated test:

- minimum 7 questions from every chapter
- maximum 13 questions from any chapter
- distribute the remaining questions randomly
- total exactly 50

Do not always select exactly 10 questions per chapter. The supplied sample forms varied in chapter distribution.

### Selection safeguards

- Prefer `exam_likeness=high`.
- Use `final_exam_weight` as a selection weight, not a guarantee.
- Do not include the same `question_family_code` more than once unless the available pool is too small.
- Avoid questions with nearly identical stems in the same test.
- Avoid placing multiple questions from the same objective consecutively.
- Randomize question order.
- Randomize choice display order only if the app also remaps:
  - `correct_letter`
  - each choice-specific explanation
- Store the selected question IDs when the exam begins so refreshing does not generate a different test.

### Exam presentation

During the exam:

- show question and four choices only
- allow Back and Next
- allow Flag for Review
- do not reveal correctness
- do not show learning support
- optionally use a 50-minute timer
- submit all answers together

After submission, show:

- total score
- chapter breakdown
- objective/concept weaknesses
- missed-question review
- selected-choice explanation
- correct explanation
- optional mnemonic and visual
- recommended targeted study session

## Question Classification

Each chapter includes:

- 100 total questions
- 60 marked `eligible_for_final_exam=true`
- 40 retained for study and remediation

The 25 new questions in each chapter are marked final-exam eligible because they were deliberately written in the concise Mitchell style with stronger, closer distractors.

The existing questions received a preliminary eligibility classification based on their concise, direct, test-like structure. Keep the field editable in the admin interface so the classification can be refined after student testing or CAP subject-matter review.

## Validation Checklist

After import, verify:

- 500 unique `external_id` values
- 100 questions in each chapter
- 60 final-exam-eligible questions in each chapter
- 300 final-exam-eligible questions overall
- every question has four nonblank choices
- every `correct_letter` is A, B, C, or D
- all four choice explanations remain aligned
- all new questions contain:
  - short explanation
  - full explanation
  - memory aid
  - remediation
  - visual metadata
  - source pages
- no duplicate rows were created for the original 75 questions
- Study Mode still uses all questions
- Full Exam uses only `eligible_for_final_exam=true`
- learning support remains hidden until an exam is submitted

## Recommended Development Test

Run these checks before Android export:

1. Import the combined 500-question file into a development database.
2. Confirm the row counts above.
3. Generate ten 50-question exams.
4. Confirm every test:
   - contains exactly 50 unique questions
   - contains 7–13 from each chapter
   - contains only eligible questions
   - does not change after refresh
5. Submit one test and verify the explanations, mnemonics, and visuals remain attached to the correct answer choices.
6. Run a Chapter Study session and confirm study-only questions can still appear.

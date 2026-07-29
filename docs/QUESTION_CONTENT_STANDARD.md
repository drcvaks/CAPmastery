# Question Content Standard

## Approval standard

Every approved question must use an authorized source, test one learning objective, have one unambiguously best answer, use plausible distractors, avoid tricks, match reading level, include a teaching explanation and precise source reference, pass human review, and avoid implying it is an actual CAP exam item unless officially designated.

Recalled or protected examination questions are prohibited. AI-generated content is prohibited in the non-AI pilot workflow.

## Explanation standard

State why the correct choice is correct, teach the underlying concept, address a likely misconception when useful, and stay concise. “This is stated in the chapter” alone is insufficient. Approved edits create a historical question version so existing attempts remain interpretable.

## CSV contract

The planned template columns are:

```text
external_id,pilot_batch,objective_code,concept_code,question_family_code,difficulty,cognitive_level,question_type,question_mode,question_style,question_text,choice_a,choice_b,choice_c,choice_d,correct_letter,explanation,short_explanation,feedback_display_version,choice_a_explanation,choice_b_explanation,choice_c_explanation,choice_d_explanation,common_mistake,remediation_text,memory_aid,visual_priority,visual_type,visual_display_mode,visual_asset_key,visual_brief,visual_caption,visual_alt_text,source_reference_text,source_pages,source_status,review_status,reinforcement_question_ids,estimated_time_seconds
```

Multiple choice requires at least three choices. True/false uses only TRUE and FALSE. The correct letter must identify a populated choice. Approved content requires explanation and source. Unknown hierarchy codes are errors unless an administrator deliberately uses a controlled creation workflow. Duplicate detection uses normalized text plus exam and objective and produces warnings rather than silent merges.

The adaptive 30-question technical bank may leave `short_explanation`, memory, and visual fields blank on rows that have not received reviewed learning support. Such rows use the existing concise main-explanation fallback and do not create an empty private support record. If memory or visual metadata is present, `short_explanation` remains required. Finer source classifications map to the existing delivery enum without losing purpose: recognition uses cognitive level `recall` plus purpose `recognition`, while analysis uses cognitive level `application` plus purpose `analysis`.

The replacement 30-question complete-support file supplies reviewed short explanations, memory aids, display version 1, and complete visual metadata for every row. It changes no prompt, choice, answer, full explanation, remediation, source, mastery, or reinforcement field from the prior adaptive file. Visual metadata alone never makes an image student-visible; an independently registered approved asset is still required.

`question_mode` and `question_style` are optional controlled source-bank
classifications. They preserve author intent but never override session-mode
security or release feedback early. Reinforcement IDs may use commas, semicolons,
or pipes. Source pages may be a page, range, or comma-delimited non-contiguous
list; the exact supplied page text remains part of the visible source reference.
The finer `misconception` cognitive label is stored as purpose
`misconception_check` and delivered through the supported `understanding`
cognitive category.

The supplied Volume 2 Chapter 4 bank contains 75 complete-support draft rows and
uses a dedicated private package. Its answer key is materially imbalanced: B is
correct for 58 questions, A for 10, C for 7, and D for none. Import preserves the
owner-supplied answers and emits a quality warning; a reviewer should rebalance
choice positions without changing correct concepts before broader pilot use.

The supplied Volume 2 Chapter 5 bank contains 75 complete-support draft rows in
private package `LTL2_C5_75`. It preserves the harder distractors, complete
choice-level feedback, memory and visual metadata, delivery/style classifications,
and all 20 internal reinforcement links. Its answer positions are A 21, B 30,
C 20, and D 4; import reports no dominant-answer warning and does not reposition
any answer.

## Workflow

Import validates and previews before writing. Accepted rows enter as drafts regardless of requested approval unless an explicitly authorized review workflow says otherwise. Reviewers correct, cite, rate, approve/reject, and version changes. Import jobs retain row counts and safe downloadable errors. Students receive only approved active content and never the answer key.

Checkpoint 8 implements the canonical 37-column template as a pasteable comma- or tab-delimited workflow. Client validation reports missing columns, malformed rows, unsafe spreadsheet formulas, duplicate external IDs, normalized duplicate prompts, and inconsistent support metadata before import. The server repeats authoritative checks and rejects the whole question payload when any row is invalid. Objective, concept, and family codes must already exist; hierarchy creation is intentionally a separate governed decision. This checkpoint imports multiple-choice questions only.

## Initial content decision

Checkpoint 3 seeds only the Leadership and Aerospace catalog structure. Database permission tests create synthetic questions inside a rolled-back transaction. No workspace PDF was opened or imported, and no real question will be published until the owner confirms source authorization/edition and supplies or approves a small human-reviewed bank that meets this standard.

Technical testing may use a small clearly labeled sample, but adaptivity evaluation requires broad objective coverage and approximately 150–250 reviewed questions per exam, including difficulty and cognitive-level variety.

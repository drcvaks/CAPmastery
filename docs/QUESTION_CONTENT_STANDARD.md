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

The supplied Volume 2 Chapter 6 bank contains 75 complete-support draft rows in
private package `LTL2_C6_75`. All 225 reinforcement links remain internal and all
learning-support metadata is preserved. Its supplied answer positions are A 25,
B 39, C 11, and D 0. Import does not reposition answers and emits a coverage
warning because D is never correct; a reviewer should address that pattern before
broader use.

The supplied Volume 2 Chapter 7 bank contains 75 complete-support draft rows in
private package `LTL2_C7_75`. All 150 reinforcement links remain internal and all
learning-support metadata is preserved. It contains 47 medium and 28 hard
questions with no easy rows. Supplied answer positions are A 46, B 25, C 3, and
D 1; import preserves them and emits a dominant-A quality warning for review.
Supplied objective, concept, and family identifiers remain visible as titles/source
metadata. When an identifier exceeds the database key limit or contains punctuation
outside the key alphabet, the importer derives a deterministic bounded key rather
than editing the supplied display value or weakening database constraints.

The supplied Volume 2 Chapter 8 bank contains 75 complete-support draft rows in
private package `LTL2_C8_75`. All 150 reinforcement links remain internal, all
learning support is complete, and the supplied answer positions are balanced:
A 20, B 20, C 17, and D 18. Import preserves every supplied content field.

## Workflow

Import validates and previews before writing. Accepted rows enter as drafts regardless of requested approval unless an explicitly authorized review workflow says otherwise. Reviewers correct, cite, rate, approve/reject, and version changes. Import jobs retain row counts and safe downloadable errors. Students receive only approved active content and never the answer key.

Checkpoint 8 implements the canonical 37-column template as a pasteable comma- or tab-delimited workflow. Client validation reports missing columns, malformed rows, unsafe spreadsheet formulas, duplicate external IDs, normalized duplicate prompts, and inconsistent support metadata before import. The server repeats authoritative checks and rejects the whole question payload when any row is invalid. Objective, concept, and family codes must already exist; hierarchy creation is intentionally a separate governed decision. This checkpoint imports multiple-choice questions only.

## Final-exam classification

Chapter study may use every accessible question. Practice-exam selection uses only
rows explicitly marked `eligible_for_final_exam=true` with a positive
`final_exam_weight`. `exam_likeness`, `distractor_difficulty`, `content_origin`,
and `style_reference` are reviewer-editable classifications; they do not constitute
CAP approval or reproduce protected exam content.

The combined Chapters 4–8 source must contain 500 unique stable external IDs, 100
rows per chapter, and exactly 60 eligible rows per chapter. Existing Q001–Q075
records are upserted by external ID without replacing their UUIDs; Q076–Q100 are
new original textbook-grounded rows. Four choices and their four explanations must
remain aligned, and missing visual files remain warnings rather than import errors.

## Aerospace Dimensions Module 1 bank

The owner-supplied Module 1 source is a UTF-8 BOM, tab-delimited 100-question
bank in private package `AD_M1_100`. It contains 60 Chapter 1 questions, 24
Chapter 2 questions, and 16 Chapter 3 questions; 50 two-question families; and
75 rows tagged as final-exam eligible. All supplied sibling reinforcement links
remain internal to the file.

The source's `medium_hard` difficulty is normalized to the database's existing
`hard` enum value. The more specific supplied `question_style` and
`distractor_difficulty` classifications remain unchanged. Controlled importer
defaults supply the package, feedback version, and authorized-source status that
are absent from this specialized export. Missing `common_mistake` values remain
null rather than being invented; a reviewer must add required misconception
metadata before approving a row. Visual metadata is retained, but no student
visual control appears until a corresponding reviewed asset is registered.
Supplied visual asset keys are normalized to lowercase at the import boundary to
meet the existing private asset registry contract; the database constraint is not
weakened.

The Module 1 visual extension preserves all 100 stable question IDs and changes
only visual-support metadata. Ninety-four questions intentionally reuse six
reviewed shared visuals; six questions retain their prior placeholder keys with
`visual_status=missing` and `show_visual_button=false`. Supabase object paths are
normalized from the source's leading-slash notation to
`assets/cap-visuals/<filename>`. Student visibility is derived from an approved
registry record and secure session state, not trusted from the CSV's convenience
status/button columns.

## Aerospace Dimensions Module 2 bank

The owner-supplied Module 2 source is a UTF-8 BOM, tab-delimited 100-question
bank in private package `AD_M2_100`. It contains 52 Chapter 1 Airplane Systems
questions, 32 Chapter 2 Airports questions, and 16 Chapter 3 Aeronautical Charts
questions. The bank has 50 two-question families, 100 internal sibling links,
and 75 rows tagged as final-exam eligible. All questions retain four aligned
choice explanations, short and full feedback, memory support, remediation, and
exact source-page text.

All 100 Module 2 questions map to seven reviewed shared PNG assets. The manifest
and question rows must agree on asset key, normalized private Storage path, and
question count before upload or import begins. Visual registration remains an
independent administrator action; CSV approval labels alone never make an asset
student-visible. The supplied `medium_hard` difficulty continues to map to the
supported `hard` enum without changing its source classification.

## Initial content decision

Checkpoint 3 seeds only the Leadership and Aerospace catalog structure. Database permission tests create synthetic questions inside a rolled-back transaction. No workspace PDF was opened or imported, and no real question will be published until the owner confirms source authorization/edition and supplies or approves a small human-reviewed bank that meets this standard.

Technical testing may use a small clearly labeled sample, but adaptivity evaluation requires broad objective coverage and approximately 150–250 reviewed questions per exam, including difficulty and cognitive-level variety.

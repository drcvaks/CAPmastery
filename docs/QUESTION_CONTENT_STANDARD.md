# Question Content Standard

## Approval standard

Every approved question must use an authorized source, test one learning objective, have one unambiguously best answer, use plausible distractors, avoid tricks, match reading level, include a teaching explanation and precise source reference, pass human review, and avoid implying it is an actual CAP exam item unless officially designated.

Recalled or protected examination questions are prohibited. AI-generated content is prohibited in the non-AI pilot workflow.

## Explanation standard

State why the correct choice is correct, teach the underlying concept, address a likely misconception when useful, and stay concise. “This is stated in the chapter” alone is insufficient. Approved edits create a historical question version so existing attempts remain interpretable.

## CSV contract

The planned template columns are:

```text
external_id,pilot_batch,objective_code,concept_code,question_family_code,difficulty,cognitive_level,question_type,question_text,choice_a,choice_b,choice_c,choice_d,correct_letter,explanation,short_explanation,feedback_display_version,choice_a_explanation,choice_b_explanation,choice_c_explanation,choice_d_explanation,common_mistake,remediation_text,memory_aid,visual_priority,visual_type,visual_display_mode,visual_asset_key,visual_brief,visual_caption,visual_alt_text,source_reference_text,source_pages,source_status,review_status,reinforcement_question_ids,estimated_time_seconds
```

Multiple choice requires at least three choices. True/false uses only TRUE and FALSE. The correct letter must identify a populated choice. Approved content requires explanation and source. Unknown hierarchy codes are errors unless an administrator deliberately uses a controlled creation workflow. Duplicate detection uses normalized text plus exam and objective and produces warnings rather than silent merges.

The adaptive 30-question technical bank may leave `short_explanation`, memory, and visual fields blank on rows that have not received reviewed learning support. Such rows use the existing concise main-explanation fallback and do not create an empty private support record. If memory or visual metadata is present, `short_explanation` remains required. Finer source classifications map to the existing delivery enum without losing purpose: recognition uses cognitive level `recall` plus purpose `recognition`, while analysis uses cognitive level `application` plus purpose `analysis`.

## Workflow

Import validates and previews before writing. Accepted rows enter as drafts regardless of requested approval unless an explicitly authorized review workflow says otherwise. Reviewers correct, cite, rate, approve/reject, and version changes. Import jobs retain row counts and safe downloadable errors. Students receive only approved active content and never the answer key.

## Initial content decision

Checkpoint 3 seeds only the Leadership and Aerospace catalog structure. Database permission tests create synthetic questions inside a rolled-back transaction. No workspace PDF was opened or imported, and no real question will be published until the owner confirms source authorization/edition and supplies or approves a small human-reviewed bank that meets this standard.

Technical testing may use a small clearly labeled sample, but adaptivity evaluation requires broad objective coverage and approximately 150–250 reviewed questions per exam, including difficulty and cognitive-level variety.

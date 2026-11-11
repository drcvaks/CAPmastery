# Reviewing questions by curriculum

Open Content Review → Review questions. Expand a test, then a module (Aerospace)
and chapter. Menus start closed. Search matches question IDs, prompts, and curriculum
labels; status buttons narrow the list. Each chapter starts with 20 questions and
offers Show next controls, so questions beyond the first 100 remain available.

Open a question to edit it. On wide web screens, all four choices use a two-by-two
card layout beside the explanation, source, and save/review controls. On smaller
screens the same fields stack vertically. Use Set as correct on the appropriate
choice. Classification settings, common-mistake/remediation, and review ratings
remain accessible through disclosure buttons. Hidden settings retain their values.

Save corrections as draft does not approve content. Approve/Request changes/Reject
save the displayed corrections first and then use the existing audited review
workflow. Editing approved content requires a reason and preserves version history.
Previous and Next step through the selected chapter's filtered results, including
questions beyond the currently expanded page. The editor shows the test, chapter
or module, question position, and review status instead of the internal ID.
Corrections saved during the current review tab session are marked as saved
drafts; this does not mark them approved or infer prior edits to older drafts.
Back, Previous, and Next offer to save or discard unsaved corrections, or keep
editing. Saving on navigation does not submit review ratings or notes.
Back returns to the same open chapter. Changing the overall workspace/tab is not covered by this local
confirmation; save before leaving the Review questions tab.

Assigned testers use a chapter-scoped, proposal-only version of this editor.
See [Content Review tester rollout](CONTENT_REVIEW_TESTERS.md). Tester access is
separate from Administration and from study packets.

## Apply migration 058

Use the existing process-only database-password setup, then run in CAP Mastery:

```powershell
npx.cmd supabase db push
npm.cmd run db:test:linked
```

The new migration is `202611030058_question_review_catalog.sql`. The linked suite
should include `question_review_catalog.test.sql` with 15 checks, bringing the
reported aggregate to 697 if all checks pass. These are expected counts, not a
claim of a remote run. Reload Expo after applying the migration. No content import,
new native dependency, or image upload is needed.

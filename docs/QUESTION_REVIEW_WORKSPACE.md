# Reviewing questions by curriculum

Open Administration → Review questions. Expand a test, then a module (Aerospace)
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
Back asks before discarding unsaved question corrections and returns to the same
open chapter. Changing the overall workspace/tab is not covered by this local Back
confirmation; save before leaving the Review questions tab.

This remains an administrator UI. The protected catalog/detail functions also
support the existing content-reviewer role, but this change does not grant tester
access or expose the administration route to a new role. Arrange tester permissions
separately; do not give someone administrator access solely to review wording.

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

# Content Review tester rollout

Administration contains User Access and CSV Import. Content Review is a separate
workspace with Review Questions, Image Library, and Pending Approvals for admins
or My Proposals for testers.

1. As an administrator, open Administration → User Access and select an existing
   account. Expand a test and a chapter or module in **Study & Content Review access**.
2. Use **Study packet**, **Review questions & answers**, and **Review images**
   independently, then select **Save access**. Counts distinguish questions in
   an individual packet from all reviewable questions and distinct registered
   images in that section. Aerospace study packets are assigned by module;
   module review switches select its current chapters, which can also be set
   individually. Whole-test and all-content review grants cover future chapters
   too. Remove a broader grant before narrowing its scope. Clearing all review
   grants removes the tester role without revoking Student access.
3. Have the tester sign out and back in, then open Content Review. Question testers
   can see and correct the answer key only for their assignments in this workspace.
   Do not give answer-visible review access to cadets studying the same material.
4. The tester edits a question or chooses a replacement PNG, adds a reason, and
   submits a proposal. The student-facing version does not change. A failed or
   unfinished image upload is not eligible for approval.
5. In Content Review → Pending Approvals, an admin compares the original and
   proposal, checks the affected chapters for shared images, and confirms Apply,
   Request changes, or Reject. Request changes includes feedback; the tester can
   submit a new proposal after revising it.

Applying a correction to an already approved question requires admin ratings and
uses the existing audited edit and publication workflow in one transaction.
Applying corrections to a draft leaves it a draft. Image approval keeps the
previous file and switches the registered image for all linked questions.
Stale proposals cannot overwrite intervening changes. Study and practice-test
answer-release rules are unchanged. Existing trusted content-reviewer accounts
retain their broader backend privileges and should not be used for limited testers.

## Deployment

Apply migrations `202611060059` through `202611060061` before deploying the frontend.
From the CAP Mastery PowerShell directory, use the database password only in
the current process and clear it after the migration and tests:

```powershell
$testerRolloutPassword = Read-Host "CAP Mastery Supabase database password" -AsSecureString
try {
    $env:SUPABASE_DB_PASSWORD = [System.Net.NetworkCredential]::new("", $testerRolloutPassword).Password
    $env:CAP_MASTERY_DB_PASSWORD = $env:SUPABASE_DB_PASSWORD
    npx.cmd supabase db push --linked
    if ($LASTEXITCODE -ne 0) { throw "Migration push failed; tests were not run." }
    npm.cmd run db:test:linked
} finally {
    Remove-Item Env:SUPABASE_DB_PASSWORD, Env:CAP_MASTERY_DB_PASSWORD -ErrorAction SilentlyContinue
    Remove-Variable testerRolloutPassword -ErrorAction SilentlyContinue
}
```

The linked suite should include 43 checks in `content_tester_proposals.test.sql`
(expected 740 total, based on the prior 733). Verify the linked result before
granting access. After deployment, test a question-only profile, an image-only
profile, and an admin decision using test accounts.

Revoking grants blocks new database and storage requests. Previously viewed
answers cannot be recalled, and previously issued image URLs may remain valid
until their normal expiry. Incomplete uploads remain in proposal history; this
release does not automatically purge abandoned files.

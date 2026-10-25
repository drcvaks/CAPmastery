# Administrator image library

In Administration, choose **Image library**, expand a test, and find the relevant
chapter/module, then expand that section to load its images. Every chapter/module
starts collapsed; closing it removes its previews and stops their signed-URL refresh
queries. Search finds matching sections without automatically loading their images.
Search also matches image descriptions, image keys, tests, and
chapter names. Open a thumbnail to inspect the larger image and use **Open full
screen and zoom** for posters. Other / unlinked images contains registered assets
that no question currently references; local-only supplemental images are not
uploaded by this screen.

## Replace an image

1. Check the **Used in** list. Replacement affects every question sharing this
   image, including uses in other chapters/modules.
2. Choose **Choose replacement PNG** and select a corrected PNG no larger than
   5 MB. Preview it before saving.
3. Enter an accurate accessible image description and a replacement reason of
   at least ten characters.
4. Choose **Save replacement**. Discard replacement leaves the current image alone.

The current file is not overwritten. A new private object is uploaded and the
existing image key switches to that object in an audited database transaction.
Previous files remain available for operator recovery. Approval status, question
wording, captions, links, answers, and student history do not change. Students may
need to reload an already-open session to receive the updated image.

A concurrent edit is rejected. If activation cannot be confirmed, refresh the
library before retrying; do not assume a lost network response means a save failed.
An unused upload can remain after a failed activation. There is no delete or
automatic restore button in this first version. Before re-running an older operator
manifest, reconcile its paths so it does not restore an outdated image.

## Apply the database update

From the CAP Mastery PowerShell directory, with the database password set only
for the current process:

```powershell
$imageLibraryPassword = Read-Host "CAP Mastery Supabase database password" -AsSecureString
$env:SUPABASE_DB_PASSWORD = [System.Net.NetworkCredential]::new("", $imageLibraryPassword).Password
$env:CAP_MASTERY_DB_PASSWORD = $env:SUPABASE_DB_PASSWORD
try {
  npx.cmd supabase db push
  if ($LASTEXITCODE -ne 0) { throw "Migration push failed; tests were not started." }
  npm.cmd run db:test:linked
} finally {
  Remove-Item Env:SUPABASE_DB_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:CAP_MASTERY_DB_PASSWORD -ErrorAction SilentlyContinue
  Remove-Variable imageLibraryPassword -ErrorAction SilentlyContinue
}
```

Migration `202610250057_admin_visual_library.sql` adds the two admin-only RPCs.
The linked suite should include `admin_visual_library.test.sql` with 23 assertions.
No question import or image re-upload is required to populate the library.

Reload Expo web after applying the migration. Existing standalone Android apps
need a new EAS build to include the native DocumentPicker dependency. First verify
the save flow on web and then on a physical Android device. Do not use a service
role key or disable Storage RLS.

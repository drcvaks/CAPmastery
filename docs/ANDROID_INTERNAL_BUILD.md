# Android Pilot Builds

The repository includes two Android profiles:

- `pilot` produces a directly installable APK for ordinary test devices.
- `play-internal` produces a signed Android App Bundle (`.aab`) for Google Play's private Internal testing track. Use this for devices with Advanced Protection because installation happens through Google Play.

Neither profile contains an Expo project ID or credentials from another application.

## One-time owner setup

1. Sign in to the intended Expo account with MFA: `npx.cmd eas-cli login`.
2. From this repository, create/link a new CAP Mastery EAS project: `npx.cmd eas-cli init`. Verify the displayed owner, slug `cap-mastery`, and Android package `com.chaimvaks.capmastery` before accepting. Never reuse the mySCP project ID.
3. In the EAS project dashboard, add only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the `production` environment used by `play-internal`. Add them to the environment used by `pilot` only if building the APK. Never add a service-role key or database password. Do not put values on a command line or in a tracked file.
4. Confirm the Supabase auth redirect allowlist supports `capmastery://reset-password` and test recovery on the pilot device.

## Build an AAB for Google Play Internal testing

1. Run `npm.cmd run release:check` and `npm.cmd run export:android`.
2. Build the store-signed bundle:

   `npx.cmd eas-cli build --platform android --profile play-internal`

3. Download the `.aab` from the EAS build page. An AAB cannot be installed directly.
4. In Google Play Console, create the CAP Mastery app with package `com.chaimvaks.capmastery`, complete the required app/content/data-safety declarations honestly, and open **Test and release → Testing → Internal testing**.
5. Create a release and upload the `.aab`. Add only the approved pilot Google accounts to the tester list, publish the internal release, and share its opt-in link.
6. On each protected Android device, open the opt-in link using the invited Google account, accept testing, and install CAP Mastery from Google Play.

The first Play submission and policy declarations are owner actions. After a Google Play service account is configured in EAS, later submissions can use `npx.cmd eas-cli submit --platform android --profile play-internal --latest`. Never commit the service-account JSON.

### Windows archive fallback

If EAS fails before upload with a local `git clone --no-checkout --no-hardlinks --depth 1` error, use EAS's no-VCS archive mode for that build. The repository's `.easignore` keeps development-only content, tests, documentation, and database files out of the app archive.

Keep repository-only exclusions root-anchored (for example, `/Content/`). On
Windows, an unanchored `Content/` rule can match the runtime
`features/content/` directory case-insensitively and make the remote Metro build
fail with a missing `ContentBrowser` module.

```powershell
$env:EAS_NO_VCS = "1"
npx.cmd eas-cli build --platform android --profile play-internal
Remove-Item Env:EAS_NO_VCS
```

The no-VCS setting applies only to the current PowerShell process and does not alter the repository or signing credentials.

## Build and install the direct APK alternative

Run `npm.cmd run release:check`, `npm.cmd run export:android`, then `npx.cmd eas-cli build --platform android --profile pilot`. Open the resulting private build link on each approved device and install the APK. Record device model, Android version, app version, installer, and tester. Do not publish to an app store during this checkpoint.

Do not disable Advanced Protection to install this APK. Use the Play Internal testing profile instead. Revoke the build link or remove testers when the pilot ends. A new binary is required for code or native dependency changes.

## Smoke check

Verify cold start, sign-in/sign-out, password recovery, responsive text, Study, answer persistence, all authorized comprehensive tests, wrong-answer review, Progress, Family Challenge, Admin import/review, refresh/deep links, airplane-mode recovery, and account isolation. Stop testing if the wrong student's name or data appears.

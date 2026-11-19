# Install CAP Mastery from the web

Deploy the updated web export to the existing HTTPS Vercel site. No Supabase
migration, Auth redirect change, Play Store release, or Apple account is needed.
The installed web app uses the same origin, authentication, and database rules.
It is separate from the native Expo/Google Play build.

## User flow

- Web users see **Install CAP Mastery**, using the sign-in logo, at the bottom of
  the left menu and inside the top-right account menu.
- The first eligible signed-in visit offers installation once per user, device,
  and browser storage. Dismissing does not hide the permanent menu actions.
  Storage clearing or a new device may show the invitation again. Existing users
  also receive it on their first visit after deployment.
- Chrome/Edge use the browser's install prompt when available. The event is
  single-use; if unavailable or declined, the guide offers manual browser steps.
- iPhone/iPad users get Safari → Share → Add to Home Screen guidance.
  Mac Safari also offers File → Add to Dock on supported versions.
- Installed/standalone windows and native Expo apps hide installation offers.
  Installation elsewhere on a device cannot always be detected from a browser tab.

## Security and limitations

The manifest and 180/192/512-pixel icons are public static branding only.
The service worker handles network navigation failures with a small offline notice,
never caches requests/responses, and does not intercept cross-origin Supabase
traffic. Internet access is still required for studying and answer submission.
It does not silently reload an active exam when a new deployment arrives.
Development Expo sessions do not register the worker.

Installing may require another sign-in, especially on iOS. Browser support,
private browsing and device policy can prevent installation. This does not bypass
Advanced Protection or other device restrictions.

## Deployment acceptance

1. Confirm the hosted `/manifest.webmanifest` is JSON, `/service-worker.js` is
   JavaScript and each `/icons/cap-mastery-*.png` returns a PNG, not the SPA HTML.
2. Confirm deep links such as `/sign-in` and `/reset-password` still load.
3. In a fresh browser profile, sign in and dismiss the one-time invitation.
   Reload: no automatic second invitation. Both menu entries still open the guide.
4. Chrome/Edge desktop and Android: install, launch, sign in, study, and submit
   a practice answer. Confirm standalone launch and the absence of Install offers.
5. iPhone/iPad Safari: add to Home Screen, launch and sign in. Check icon, safe
   areas, account menu and a study session. Browser guidance is not an App Store app.
6. Disconnect: the navigation fallback explains the connection requirement.
   Answer submissions must still surface the existing retry flow.
7. Reconnect and deploy an update: launch again and verify current content loads.
   Verify worker Cache Storage stays empty and no Supabase data is stored there.

Regenerate icons on Windows with `powershell.exe -NoProfile -ExecutionPolicy Bypass
-File scripts/generate-pwa-icons.ps1`. This only resizes the existing approved
logo into public install icons; it does not alter the source image.

References: [Expo PWA guide](https://docs.expo.dev/guides/progressive-web-apps/),
[browser installation prompts](https://web.dev/learn/pwa/installation-prompt).

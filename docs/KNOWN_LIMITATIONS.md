# Known Pilot Limitations

- The linked Supabase project is nonproduction. A separate production project, formal privacy/consent/retention policy, and restore rehearsal remain owner decisions.
- Remote error monitoring is deliberately not configured; pilot support relies on privacy-safe user reports and existing Supabase audit records.
- Android production export is automated, but a signed EAS internal APK and physical-device accessibility/acceptance pass require owner Expo credentials and devices.
- SDK 57 is intentionally retained; Expo Doctor may report current patch mismatches or fail remote directory/schema checks when Expo services are unavailable.
- Admin question CSV import, correction, review, and approval are available in the UI. Account creation, global role/family-link administration, package assignment, and exceptional learning-history reset still require protected operator workflows/SQL; they are not exposed to students or parents.
- Package content remains private draft content until exact assignment or governed approval. Assignment to one chapter/module does not imply access to another.
- Practice blueprints and some pilot scoring/achievement/challenge thresholds are provisional rather than official CAP exam specifications.
- No offline study synchronization, push notifications, challenge cancellation UI, public rankings/chat, automated retention/deletion/export portal, or AI feature exists.
- Visuals and question banks require ongoing human source/accuracy/accessibility review. The app is a study aid, not an official CAP product or guarantee of exam results.
- `npm audit fix` reduced the dependency report to 17 transitive advisories (13 moderate, 4 high, 0 critical). The remaining high chain is Metro's build-time `image-size` parser; the remaining moderate chains are Expo tooling/router dependencies. npm offers only incompatible Expo/Router downgrades for most remaining paths. Do not use `--force`; recheck supported SDK 57 patches before each build and avoid feeding untrusted files to build tooling.

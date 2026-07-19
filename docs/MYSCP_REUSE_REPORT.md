# mySCP Architecture and Reuse Report

## Audit scope and evidence

Read-only review performed against `C:\Users\Family\ws\mySCPcodex` at commit `5403b711adce3931ce5741ebfba8257ce25c68c5` on branch `main`. The worktree already contained untracked owner files before inspection; none were opened unless relevant to the tracked application inventory, and none were changed. Reviewed package/configuration, routes, authentication/state, shared UI/theme, Supabase client/types, migrations, RLS/functions, seed/readme, and query locations.

mySCP uses Expo SDK 54, Expo Router 6, React Native 0.81/React 19, strict TypeScript, Supabase JS 2, AsyncStorage auth persistence, responsive web/native navigation, SQL migrations, and generated database types.

## Reuse or adapt

- Expo Router layout/provider pattern, safe-area and gesture roots, typed routes, Android/web configuration concepts.
- Supabase client concepts: URL polyfill, AsyncStorage session persistence, auto-refresh, URL recovery handling, and native foreground/background token refresh. Reimplement with CAP-specific env names/configuration and tests.
- Small visual primitives such as Card, Pill, FilterChip, SearchField, form fields, ProgressBar, status banners, and responsive max-width content. Extract and redesign without mySCP branding or app-state coupling.
- Central theme tokens and responsive left-rail/bottom-navigation concept.
- Error formatting, refresh-on-focus, explicit loading/retry states, and accessible labels/roles.
- Migration-first PostgreSQL, auth-to-profile trigger, `updated_at` trigger, private helper functions, server-side answer checking, correct-answer storage separate from readable prompts, generated database types, private Storage policies, and RLS verification checklist concepts.
- Protected RPC patterns for role changes and administrative workflows, with tighter function grants and CAP-scoped roles.

## Do not copy/reuse

- Product-specific names, schema, content, CSVs, scraper, seed data, EAS project ID, Android package/scheme, Supabase URL/key, user data, brand/colors/text, or any untracked owner files.
- The 617-line `AppStateProvider` that loads many unrelated tables at login; CAP should fetch by feature/use case with query caching.
- Direct Supabase queries in screen files and 700–1000-line shared/admin screens; CAP should use services and smaller components/features.
- Roles stored as one mutable profile enum plus client helpers. CAP needs normalized, scoped `user_roles` and relationship permissions; database checks remain authoritative.
- Hiding tabs as the primary route guard. Keep client guards for UX, but design RLS/function authorization for direct-route/direct-API attacks.
- Review sessions that accept an entire client-produced answer set at completion as CAP's main grading model. CAP requires per-answer secure submission tied to a prebuilt owned session, duplicate prevention, version capture, and atomic derived updates.
- Blanket `grant execute on all functions in schema private to authenticated`; grant only explicitly required public entrypoints.
- Manual SQL import scripts as the long-term import workflow; CAP requires validated preview, draft import, error output, duplicate detection, approval, and versioning.
- mySCP's absent lint/test scripts and lack of committed automated tests. Dependency transitive Jest packages do not constitute a test setup.
- Raw backend error messages returned directly to UI and scattered hand-mapping of database rows.

## Dependencies

Good candidates, subject to Checkpoint 1 compatibility checks: Expo, Expo Router, React/React Native, Supabase JS, AsyncStorage, URL polyfill, safe-area context, screens, gesture handler, Reanimated, vector icons, TypeScript, and React Native Web. Add React Hook Form, Zod, TanStack Query, an Expo-aligned Jest setup, and React Native Testing Library as required by the build plan. Install versions using Expo's compatibility resolver rather than copying mySCP's lockfile.

## Security/technical-debt observations

Positive: mySCP separates answer records, uses server-side grading functions, enables RLS broadly, restricts profile role column updates, fixes `search_path` on security-definer functions, and documents verification.

Risks to avoid: broad private-function execution grants; large client reads such as broad `select('*')`; coupled client state; client-only route visibility; coarse roles; no automated RLS test harness visible; no lint/test scripts; very large screens; direct data access across UI/state; and migration documentation stating live application/testing was still pending. These are audit observations, not claims that mySCP's deployed backend is insecure.

## Reuse conclusion

Reuse architecture ideas and selected small patterns, not files wholesale. CAP Mastery's strongest inheritance should be migration-first/RLS/server-grading discipline; its main improvement should be feature boundaries, scoped authorization, answer-session integrity, and automated testing.

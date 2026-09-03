# Pilot Release Checklist

Use a separate row or copy for web and each Android device. A release is not approved until every required item is checked or recorded as an accepted limitation.

## Release and data

- [ ] Migration history matches the intended linked project through 049; linked lint and all pgTAP suites pass.
- [ ] `npm run release:check`, web export, and Android export pass from the release commit.
- [ ] Client credential scan passes; deployment contains only the project URL and publishable key.
- [ ] A recoverable backup exists and the restore rehearsal below has been completed on a disposable project.
- [ ] Source authorization, consent, privacy notice, retention/deletion, support contact, incident contact, and go/no-go owner are recorded.
- [ ] Pilot accounts, roles, family links, exact package assignments, and active blueprints are confirmed.

## Role and isolation checks

- [ ] Heshy and Avigail each see their own greeting, authorized catalog, progress, sessions, achievements, and tests only.
- [ ] Chaim/Rachel see only actively linked students and only allowed Family capabilities.
- [ ] Admin can import a CSV, preview duplicates/errors, edit a draft, submit review, and approve it in the UI without SQL.
- [ ] Student cannot open Admin/Family routes or another student's guessed session URL; unrelated adult cannot read progress.
- [ ] Active tests never reveal correctness, answers, explanations, scores, or topic clues early.

## Critical flows

- [ ] Study: choose track/module/chapter, answer, refresh, resume, view explanation/visual, and finish.
- [ ] Leadership and Aerospace: 50 questions, 60-minute server timer, pause/resume, flags, final submit, wrong-only review, and review percentage.
- [ ] Wright Brothers: 30 balanced questions, no clock/pause display, flags, final submit, wrong-only review, and Progress analysis.
- [ ] Progress chapter button opens the intended study context; guardian aggregates match the student without exposing individual answers.
- [ ] Challenge: create for two eligible students, complete independently, hide early result, reveal supportive result, and send predefined encouragement.
- [ ] Refresh/deep links, slow/offline network, retry, expired sign-in, empty state, and denied access recover without losing saved answers or exposing raw errors.

## Accessibility and feedback

- [ ] Complete keyboard-only web navigation with a visible focus indicator and logical order.
- [ ] Test Android screen reader labels for navigation, answer choices, loading/disabled buttons, errors, timer, pause, flags, and images.
- [ ] Test increased system text size and narrow phone/wide web layouts without clipped controls or horizontal page scrolling.
- [ ] Ask: Did explanations help? Were questions repetitive? Did weak areas feel accurate? What was confusing, frustrating, motivating, or made you stop?

## Go/no-go

- [ ] No unresolved privacy/security, data-loss, grading, cross-account, or answer-leak issue.
- [ ] Known lower-risk issues have an owner and workaround.
- [ ] Owner records release commit, deployment/build URL, date, testers, and decision.
- [ ] Advanced Protection devices install the signed `play-internal` AAB through Google Play Internal testing; no tester disables device protection or sideloads the APK.

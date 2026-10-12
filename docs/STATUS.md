# Arise: where things stand

The latest state of the project, written for whichever Claude session (or Mac) picks up next. Update this file at the end of every session. Last updated: **11 October 2026, night.**

## Right now

- **Demo Week presentation: Monday 12 October 2026, 9:00 am** (booked by the owner on Calendly). Graded on problem statement, solution design and a working APK. Demo is mandatory for graduation.
- Slides: `presentation/` (PDF, slide show with speaker notes, images). Talk, demo steps and likely questions: the owner's prep page on claude.ai (private, he has the link).
- **First thing next session: ask Uche how the presentation went**, and note any teacher feedback in `docs/DECISIONS.md`.

## What exists and works

| Part | State | Where |
| --- | --- | --- |
| Web app | Live and installable (PWA) | https://arise-morning.netlify.app, deployed by hand from `dist/` (not git-connected) |
| Android app | Built, signed, alarm passed on a Samsung A04e (Android 14) on 8 Oct | `mobile/`, release v1.0.0 on GitHub (85 MB APK) |
| iPhone alarm | Passed 4 tests on 30 Sep (locked, restart, airplane, Do Not Disturb) | branch `spike/alarm`, `docs/TECHNICAL-NOTES.md` |
| Claude pep talks | Supabase Edge Function `generate-affirmation`; free users get reviewed affirmations, Plus users get Claude | `supabase/functions/` |
| Arise Plus | $4.99 CAD/month, Stripe **test mode**; owner's test subscription active to 4 Nov | Plus tab on the web |
| Survey evidence | "Your Mornings", **18 responses** (22–27 Sep). PRD section 2 still says 17; update it | raw answers stay private (they contain emails) |

## Open items, in order

1. **Not yet deployed:** commit 5f9f5c5 fixes the web History bug (free users' mornings were deleted on reload because they were saved with the demo-data label `sample`). Deploy only with the owner's OK: `sh scripts/build-web.sh`, then the Netlify deploy command in the README notes.
2. **QubDrive (Lesson 12 submission):** the APK there is a broken 40 MB build. The fixed 45 MB APK (verified: opens on the Samsung, all native libraries valid) is on the owner's Desktop for him to upload in its place. Rule learned: run `./gradlew clean` before any build with the architecture flag, and check every `lib/*/*.so` starts with the ELF header before sharing.
3. **Google Play:** needs 12 testers for 14 days, Play Billing for Plus on Android (Stripe is not allowed for in-app digital subscriptions), store listing. The owner signs up for Play Console himself.
4. **App Store:** needs the $99/year Apple Developer account (owner's decision: personal or company).
5. **PRD update:** survey count 18; add the roadmap phases below to `docs/ROADMAP.md`.

## Roadmap as presented on 12 Oct (owner's words)

- **Phase 2:** Google Play and App Store with real payments; **Rhapsody of Realities** for Christian users in Plus (permission from Christ Embassy / LoveWorld Publishing not yet requested; until granted, only a button that opens the official Rhapsody app, nothing copied); lock-screen widget.
- **Phase 3 (Plus grows):** pep talks spoken by the AI **in the user's own language** (e.g. Igbo, Yoruba, Hausa, French); a companion that talks with a real voice, more voices and companions; send a morning to a friend.
- **Later:** choose pep-talk tone, calendar-aware day brief, more faiths in the quote library.

## Owner's standing rules (in addition to CLAUDE.md)

- Do everything you can alone; involve the owner only for money, passwords he must type, sending things to people, deleting data, and big product calls.
- Commit and push every working step separately; the course grades the history.
- Users' moods, notes and history stay on their device. No cloud sync. Arise email goes out as Nuuch Systems (hello@nuuchsystems.com), not Nezeville.
- Ask before every production deploy of the website.
- The owner works on two Macs: always `git pull` first and `git push` after.
- The smiley-face mood buttons are approved and must be used everywhere.

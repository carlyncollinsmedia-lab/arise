# Arise — Decisions log

One line per decision, newest at the bottom. Product decisions also update `PRD.md`; technical decisions also update `TECHNICAL-NOTES.md`.

| Date | Decision | Why |
| --- | --- | --- |
| 2026-09-17 | Version 1 includes the full concept: alarm, avatar, mood check-in, spoken affirmation, day brief with weather visuals, intention, reminders, evening check-out, history. | Owner wants a sellable product, not a demo. |
| 2026-09-17 | Devotional mode, encouragement tone, practical action, sharing, extra voices, calendar, payments, web version parked. See ROADMAP.md. | Keep version 1 buildable by one person. |
| 2026-09-17 | One platform for version 1: the owner's own phone. Second platform after the 14-day test. | Alarm reliability must be proven on one device first. |
| 2026-09-17 | Avatar chosen from presets; no gender question at setup. | Simpler, more inclusive, no identity data collected. |
| 2026-09-17 | Avatar speaks the affirmation aloud (ElevenLabs), tap-to-play by default, captions always. Build last. | Owner's request; it is the differentiator; must never block a morning. |
| 2026-09-17 | Note box ships together with "Get support", crisis response, and the sign-up notice. | A mood app with free text needs these from day one. |
| 2026-09-17 | Country for support lines is confirmed by the user, not inferred from the weather city. | Users are not only in Canada; the wrong number is worse than none. |
| 2026-09-17 | Stop silences the alarm immediately; the check-in is never a gate. | Forcing a check-in at 6am gets the app deleted. |
| 2026-09-17 | Weather, animations, and voice are "must have, build last". | The app must be submittable without them. |
| 2026-09-17 | Success gate: owner checks in on 10 of 14 mornings without forcing himself, starting when alarm + check-in + affirmation work. | Retention by the first user is the only real test of version 1. |
| 2026-09-17 | Assets made by the owner with Higgsfield and Adobe; not hiring an illustrator for version 1. | Subscriptions already owned; consistency proven before paying for polish. |
| 2026-09-14 | Arise (working name) is the QAF product, not the remittance app. Submitted on the QAF ideation form, bucket Everyday Solutions. | Owner's choice. |
| 2026-09-18 | Repo created at github.com/carlyncollinsmedia-lab/arise (public). Mac = real build with Claude Code; Windows = class work with OpenCode. Push before switching machines, pull when sitting down. | One repo, two working copies. |
| 2026-09-22 | Validation survey "Your Mornings" is live at mornings-survey.vercel.app; results in survey_responses in the nezeville-media-os Supabase project. | Evidence for PRD section 2 and the QAF submission. |
| 2026-09-23 | Version 1 platform is iPhone (the owner's own phone). Supersedes the earlier Android-first leaning. | It is the phone he carries; the PRD says version 1 ships on that one. |
| 2026-09-23 | Proposed split: Claude builds the backend, ChatGPT builds the frontend. Superseded on 2026-09-26. | Owner's idea while brainstorming. |
| 2026-09-26 | Claude Code builds the whole codebase, frontend and backend. No second AI edits the repository. | On a phone app the alarm, local storage and sync cut across front and back; one builder with full context avoids breakage. Owner: "you will build the whole thing." |
| 2026-09-26 | Front end follows the owner's two-screen mockup (docs/design/reference-mockup.png). | Owner's design direction. |
| 2026-09-26 | PRD.md lives at the repo root; supporting docs in docs/. | The QAF grader reads PRD.md from the repo root. |
| 2026-09-26 | The first build (Phase 1 prototype) follows the survey: wake gently, mood check-in, varied affirmation, then weather/outfit/umbrella before intention and next reminder. | 17 survey responses: mornings "depend on the day", outfit and to-do list are top concerns, repetition is a top reason routines stop. |
| 2026-09-26 | Devotional mode stays parked for version 1, flagged for review after the 14-day test. | 14 of 17 respondents pray or meditate before leaving, but the PRD parks devotional mode; the owner decides. |

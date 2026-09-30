# Arise

Arise is a mobile alarm app that turns the first five minutes after waking into a short, deliberate check-in with a familiar companion.

When the alarm stops, a personal avatar greets you, asks how you feel, and speaks a short affirmation written for that mood. It then shows the day's weather with outfit and umbrella guidance. Arise also includes daytime reminders, an evening check-out, and a history of past mornings.

## Try the prototype

Open `index.html` in a browser (test data only; add `?new` to the address to start as a first-time user). With a local `config.local.js`, pep talks are written live by Claude; without it, reviewed samples are shown. Design system: `design.html`. Prototype demo video: https://youtube.com/shorts/NobdEwUlwlQ

## Progress

| Date | Step | What was done | Evidence |
| --- | --- | --- | --- |
| 26 Sep | Phase 1 prototype | Clickable morning journey with test data; companion choice; seasonal scenes. | `index.html`, demo video above |
| 30 Sep | Claude integration | Supabase Edge Function `generate-affirmation` calls Claude with a checked fallback; key kept in Supabase Secrets. Tested live three ways. | `supabase/functions/generate-affirmation/`, `docs/integration-test-log.md` |
| 30 Sep | Prototype updates from owner testing | Alarm setup on first open, see and change today's mood, read the pep talk aloud; real Claude pep talks when connected. | `index.html`, PRD section 13 |
| 30 Sep | Step 0: alarm spike | Test iPhone app using Apple AlarmKit. Passed all four tests on a real iPhone: locked, after a restart, airplane mode, Do Not Disturb. | branch `spike/alarm`, `docs/TECHNICAL-NOTES.md` |
| 30 Sep | Step 1 backend | Database for accounts, alarms, mornings and reminders, each person seeing only their own rows (Row Level Security). | `supabase/migrations/`, `docs/TECHNICAL-NOTES.md` |

## Documents

| File | What it is |
| --- | --- |
| `CLAUDE.md` | Rules read at the start of every build session; the project's working rules and document hierarchy. |
| `docs/HANDOFF.md` | Bridge from planning to the first build session: what changed, what exists, what to do first. |
| `docs/docs-guide.md` | How the docs folder is used and how the repository was set up. |
| `PRD.md` | The product bible (kept at the repo root for the QAF grader) — what Arise version 1 is and must do. |
| `docs/PRD-full.md` | The release-grade specification. Reference only. |
| `docs/ROADMAP.md` | How Arise grows beyond version 1 — pilot, second platform, paid tier. |
| `docs/TECHNICAL-NOTES.md` | Architecture inputs and technical decisions once made. |
| `docs/DECISIONS.md` | Dated log of every product and technical decision. |
| `docs/SELF-TEST.md` | The owner's 14-day self-test log. |
| `docs/QAF-NOTES.md` | Program method and submission requirements. |
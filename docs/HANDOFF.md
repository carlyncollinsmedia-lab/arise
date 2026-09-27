# HANDOFF.md — Arise: where we are and how to continue

Written 26 September 2026 for Claude Code. Owner: Uche Azuike. Repo: https://github.com/carlyncollinsmedia-lab/arise

Read this once, fully, before anything else. Then follow `CLAUDE.md`. This file is the bridge between ten days of planning in chat and the first line of code. It does not replace the PRD; it tells you what the PRD doesn't: what changed since it was written, what's actually in the repo, what's broken, and exactly what to do first.

---

## 1. The product in one paragraph

Arise is a phone alarm app. The alarm rings; the user stops it; the app opens to an avatar that greets them and asks how they feel (one tap from five moods: rough, low, okay, good, great, plus an optional one-line note). An AI writes a 3–4 sentence affirmation for that mood and note; the avatar reads it aloud with captions. Then a day brief: weather, general outfit guidance, umbrella yes/no, with a weather animation and the avatar dressed to match. Also: daytime reminders (plain notifications), an evening one-tap check-out, and a history of past mornings. It is a **motivation and morning-routine** product, never described as health, therapy, or care. Full detail: `PRD.md`.

It is Uche's product for the **Qubators AI Foundry (QAF) Cohort 2** program, bucket "Everyday Solutions", and it is meant to become something he can sell, not just a class demo.

---

## 2. Who you are working for

- Uche is non-technical and learning fast. He wants to understand what you build well enough to explain and teach it. Explain every technical choice in one or two plain sentences.
- He prefers step-by-step click guidance for anything he has to do himself (Xcode, Apple settings, Supabase dashboard).
- He wants honest risk assessment. If something is a bad idea or behind schedule, say so.
- When he gives you a free hand, act decisively. Don't re-ask things answered in the docs.
- He sometimes writes with Nigerian phrasing. Read for meaning.
- **Hard rules (also in CLAUDE.md):** never ask him to paste API keys in chat (direct him to Supabase Secrets / EAS secrets); no Next.js or framework conversion, ever; nothing sends, publishes, or contacts anyone without his explicit approval; no emojis in anything you write for him.

---

## 3. What exists right now

### The repo (one commit: `3440c85 Initial version: product documents and README`)

All files are at the **repo root**. There is no code yet.

| File | Status |
| --- | --- |
| `CLAUDE.md` | Build rules. Good. **Paths are wrong** (see section 4). |
| `PRD.md` | The product bible, v1.1, 17 Sept. Authoritative. Sections 5 (features), 6 (acceptance checks), 10 (build order) are the ones you'll live in. |
| `PRD-full.md` | Release-grade spec written by a second AI critic. Reference only; do not build from it. |
| `ROADMAP.md` | v1 → v1.1 audience pilot → v1.5 second platform → v2 paid tier. |
| `TECHNICAL-NOTES.md` | Architecture inputs (alarm, scheduling rules, data model, generation/safety, weather rules, security, assets). "Decisions" table is empty. |
| `DECISIONS.md` | 11 product decisions dated 17 Sept. Needs the newer ones in section 5 below. |
| `SELF-TEST.md` | 14-day log template. Starts at build step 3. |
| `QAF-NOTES.md` | Program method and submission requirements. |
| `README.md` | Product summary and doc table. |
| `docs-guide.md` | How the docs were meant to be laid out, plus the original first prompt. |
| `.gitignore` | Present. Check it covers `.env*`, `ios/`, `android/` build output, `node_modules/`, `.expo/`. |

### Machines and workflow

- **Mac Studio** = the real build, in a clone of this repo, with Claude Code. That's you.
- **Windows PC** = class assignments only, in `Documents\arise`, using the OpenCode desktop app. Same GitHub account.
- Rule: **push before switching machines, pull when sitting down.** At session start, always `git pull` first and tell Uche if anything came in from the other machine.

### Supabase

The owner's account has two projects:

- `nezeville-media-os` (ref `yiwqnjsnvpsvarotpmqc`, active) — his business OS. It also holds the `survey_responses` table for the Arise validation survey. **Do not build Arise tables here.**
- `first-light` (ref `hvocqvnzrzbpktzfrmcn`, **paused/inactive**, created June 2026, unrelated to Arise as far as we know).

There is **no Supabase project for Arise yet.** Creating one (`arise`, free tier, nearest region to Edmonton) is part of the architecture step. Ask before creating it; it's a new resource on his account.

### Validation evidence

- A disguised 11-question "Your Mornings" survey went live 22 Sept at https://mornings-survey.vercel.app (Vercel project `mornings-survey`, team `nezeville-team`; responses in `survey_responses` in the nezeville-media-os Supabase project). When the PRD's "Evidence today" section is next revised, it should cite these results instead of "no interviews or surveys yet". Reading the results is fine; the survey is not yours to modify.

---

## 4. Problems in the repo to fix first (small, do them in the first session)

1. **Path mismatch.** `CLAUDE.md` says `PRD.md`, `docs/ROADMAP.md`, etc. The files are at the root. Fix: create `docs/`, `git mv` every doc except `CLAUDE.md` and `README.md` into it, update the links in `README.md`, commit as "Move product documents into docs/ to match CLAUDE.md". Also move this file to `docs/HANDOFF.md`.
2. **Stale platform language.** PRD section 3 and TECHNICAL-NOTES say the v1 phone is "confirmed at the architecture step". It is now known (iPhone, see below). Update both and log it.
3. **DECISIONS.md is behind.** Add the rows in section 5.

One commit per fix. Tell Uche what each one was, in a sentence.

---

## 5. Decisions made in chat after the repo was pushed

Add these to `DECISIONS.md` (date, decision, why), and the technical ones to `TECHNICAL-NOTES.md` → Decisions.

| Date | Decision | Why |
| --- | --- | --- |
| 2026-09-14 | Arise (working name) is the QAF product, not the remittance app. Submitted on the QAF ideation form, bucket Everyday Solutions. | Owner's choice. |
| 2026-09-18 | Repo created at github.com/carlyncollinsmedia-lab/arise (public). Mac = real build with Claude Code; Windows = class work with OpenCode. | One repo, two working copies. |
| 2026-09-22 | Validation survey "Your Mornings" is live; results in nezeville-media-os `survey_responses`. | Evidence for PRD section 2 and the QAF submission. |
| 2026-09-23 | **Version 1 platform is iPhone** (the owner's own phone). | It's the phone he carries; PRD says v1 ships on that one. |
| 2026-09-23 | Proposed split: Claude builds the backend, ChatGPT builds the frontend. **Still open; see section 8.** | Owner's idea while brainstorming. |

Earlier leaning, still not a decision: **Expo (React Native) + Supabase**. Android-first was the original plan; it's superseded by the iPhone decision.

---

## 6. The architecture I recommend (propose it to Uche, get approval, then record it)

Think of it as the engineer's opinion he can accept, push back on, or take to his facilitator.

### 6.1 The alarm decides everything

The alarm must ring with the app closed and the phone locked, after a restart, in airplane mode, with no sign-in. On iPhone the only honest way to do that is **Apple AlarmKit** (iOS 26+). Local notifications are not alarms: they're capped at a short sound and are silenced by Focus modes. A server push is out because it needs internet.

- Confirm Uche's iPhone is on iOS 26 or later before anything else. If it isn't, stop and discuss.
- There is no official Expo AlarmKit module. There are community ones, for example `expo-alarm-kit` (nickdeupree), `expo-alarm` (vall370, AlarmKit + Android AlarmManager), and `react-native-nitro-ios-alarm-kit`. They are young. Treat them as references, not dependencies you trust blind.
- **Recommendation:** write a small **local Expo module in Swift** (`modules/arise-alarm/`) that wraps only what we need: request authorization, schedule a repeating alarm with a snooze, cancel, list scheduled alarms, and report authorization state. It's maybe 200 lines, it's ours, and it's the one part of the app where we can't afford someone else's bug. Use a community module's source to learn from. If a community module proves solid in the spike, using it is an acceptable alternative; record why.

### 6.2 The alarm spike comes before the framework is final

TECHNICAL-NOTES says "prove the alarm on a real device before committing to a framework". Do exactly that:

**Build step 0 (spike, throwaway branch `spike/alarm`):** a bare Expo app with a development build, one button "ring in 2 minutes", via AlarmKit. Uche installs it, locks the phone, waits. Then: after a restart; in airplane mode; with Focus on. If it rings in all four, Expo + a Swift module is confirmed. If not, the fallback is a native SwiftUI app for v1 (the rest of the plan barely changes because the backend is the same).

### 6.3 The stack, if the spike passes

| Layer | Choice | Why, in plain words | Rejected alternative |
| --- | --- | --- | --- |
| App | Expo (React Native, TypeScript) with a **development build** (not Expo Go, which can't load custom native code) | One codebase that can later reach Android; he's already set on it. | Native SwiftUI: best alarm access, but no Android later without a rewrite. |
| Alarm | Local Swift Expo module over AlarmKit | Only reliable way to ring a locked iPhone. | Local notifications: not a real alarm. |
| Reminders, evening check-out | `expo-notifications` local scheduled notifications, generic lock-screen text by default | They're plain notifications by design (PRD F11, F12). | AlarmKit for these: overkill and intrusive. |
| Local storage | SQLite (`expo-sqlite`) as the source of truth on the phone, synced to Supabase | PRD says "save locally first, sync after" and mood must survive a force-close. | Supabase only: breaks offline mornings. |
| Accounts, cloud data | New Supabase project `arise`, Auth (email magic link or Sign in with Apple), Postgres with Row Level Security on every table | He already uses Supabase; RLS gives "a user sees only their own history" for free. | Firebase: another platform to learn for no gain. |
| AI affirmation | Supabase **Edge Function** `generate-affirmation` calling Claude (Anthropic API) server-side; key in Supabase Secrets | Keys never touch the phone; one place to add safety checks, cost caps, logging without note content. | Calling the AI from the app: leaks the key. |
| Voice | Edge Function `speak-affirmation` → ElevenLabs, one stock calm voice, audio cached in Supabase Storage per entry | Replays cost nothing; tap-to-play; text stands alone if it fails. | On-device text-to-speech: free but not the "companion voice" he wants. |
| Weather | Open-Meteo (free, no key), called from the app, cached, rules computed on device | No key to protect, works worldwide. | OpenWeather: needs a key and billing. |
| Assets | PNG/WebP (or Lottie) avatar and weather art he makes in Higgsfield + Adobe, all identical dimensions, stored in the repo | PRD: no daily image generation. | Generating avatars per day: slow, costly, inconsistent. |
| Builds to his phone | EAS Build + TestFlight | Standard path to a real iPhone. | Free Apple ID sideload: expires every 7 days, which would break a 14-day test. |

### 6.4 Data model (first draft; refine against TECHNICAL-NOTES "Data")

- `profiles` — user_id, avatar_preset, weather_city / lat / lon, support_country, notice_accepted_at, nudge_enabled, lock_screen_full_text, evening_time.
- `alarm_schedules` — per device: time, weekdays, snooze_minutes, enabled. Server copy is informational; the phone's AlarmKit schedule is the truth, reconciled on every app open.
- `entries` — id (UUID generated on the phone), user_id, routine_date (device-local date, never changes), morning_mood, morning_note, affirmation_text, affirmation_status (generated / fallback / crisis), intention, intention_outcome, evening_mood, weather_snapshot (JSON), created_at, updated_at, deleted_at. Unique on (user_id, routine_date).
- `reminders` — id, user_id, text, fire_at, cancelled_at.
- `support_lines` — country_code, line_text, source_url, last_verified. Reviewed by a human; the AI never writes numbers.
- `fallback_affirmations` — mood, text. Reviewed copy for offline or failure.

RLS on all user tables: `user_id = auth.uid()`. Account deletion is an Edge Function that deletes rows, storage files, and the auth user.

### 6.5 Making the morning prompt reliable with no human checking it

This was Uche's own question in class (15 Sept): the prompting techniques assume someone reads and pushes back, but this prompt runs unattended at 6am. The engineering answer:

1. **Structured output.** The Edge Function asks for JSON only: `{ "affirmation": string, "sentence_count": number, "mentions_mood": boolean }`, with a short system prompt built on his class P-R-O-M-P-T framework (Role: a warm, grounded morning companion; Parameters: second person, 3–4 sentences, no scripture, no diagnosis, no clinical words, no phone numbers).
2. **Few-shot.** Two or three reviewed example affirmations per mood in the system prompt.
3. **The note is data, not instructions.** Pass it inside a clearly delimited field and tell the model to treat it as the user's words only.
4. **Validate in code, not in hope.** Parse the JSON; check 3–4 sentences, length limits, a banned-words list (therapy, diagnosis, disorder, numbers that look like phone lines). Fail any check → reviewed fallback for that mood. No retry loop at 6am; the 8-second budget in the PRD is a hard timeout.
5. **Crisis screen before and after.** A cheap keyword pass on the note plus a model classification; anything flagged skips generation and shows the fixed crisis copy with the country's line.
6. **Context kept small.** Mood, note, last three days' moods (for the low-mood nudge). Never the whole history.
7. **Cost caps.** One generation per user per routine date; returning the same day reuses it (PRD requires this anyway). Log token counts, never note text.

Tell him this is the answer to his class question; it's good material for his QAF explanation.

---

## 7. Schedule reality check

Today is **Saturday 26 September**. No code exists. The class build schedule is:

| Date | Class milestone | Where Arise should be |
| --- | --- | --- |
| 17 Sept | Foundation (plan, setup, first journey) | Done: PRD, repo. |
| 24 Sept | Full stack (accounts, stored data) | **Behind.** |
| 29 Sept | Workflows (admin actions, integrations) | Spike passed, step 1 (account + setup) done. |
| 1 Oct | Extensions (AI, payments, automation) | Step 2 alarm done, step 3 affirmation working. **Start the 14-day self-test.** |
| 6 Oct | Launch (deployment, operation) | Steps 4–6 (history, reminders, evening). TestFlight build on his phone. |
| 8 Oct | Review | Step 7 (safety) done. Weather/voice/animations may still be pending; that's allowed ("build last"). |
| 17 Oct | Qubators Global Conference | 14-day test finishes around 15 Oct if it starts 1 Oct. |

Honest assessment: the full v1 (11 steps) will not fit by 8 Oct. A submittable app will, if steps 0–3 happen this week. Protect steps 0–3 above everything. The PRD already allows weather, animations, and voice to land after submission.

Things that cost real time outside code, flag them early:

- **Apple Developer Program** (US$99/year) is needed for TestFlight. Without it, builds signed with a free Apple ID expire after 7 days, which breaks the 14-day test. Tell him on day one; enrolment can take a day or two.
- Xcode on the Mac Studio, an EAS (Expo) account, the iPhone in developer mode.
- The QAF certificate needs **one real outside user** who has used it and given feedback. That needs TestFlight too.
- Placeholder avatar and weather art until he makes the real set; don't block on assets.

---

## 8. Open decisions to settle with Uche (one at a time, with your recommendation)

1. **Frontend/backend split with ChatGPT.** He floated: Claude builds the backend, ChatGPT the frontend. Recommendation: keep **one builder owning the repo** (you), because the alarm, local storage, and sync cut across "frontend" and "backend" in a phone app, and two AIs editing the same Expo project without shared context will break things. If he still wants ChatGPT involved, give it bounded work with a written contract: screen designs, copy, and self-contained UI components delivered as files that you review and integrate on a branch. Write the contract (`docs/API-CONTRACT.md`: tables, Edge Function inputs/outputs, TypeScript types) either way; it's good practice and good for the submission.
2. **iOS version on his phone** (must be 26+ for AlarmKit).
3. **Apple Developer account**: enrol now or not.
4. **Sign-in method**: email magic link (simplest) vs Sign in with Apple (smoother on iPhone; Apple requires it if any other social login is offered). Recommend magic link for v1.
5. **Which AI model** for affirmations. Recommend a fast, low-cost Claude model via the Anthropic API; key in Supabase Secrets.
6. **Name.** "Arise" is a working name. Check it in the App Store before any store listing (not urgent).

---

## 9. How to work each session

- `git pull`. Read `CLAUDE.md`, `PRD.md`, last five lines of `docs/DECISIONS.md`. `git log --oneline -10`. State the current build step and a three-line plan. Wait for a go-ahead.
- Work on a branch per step (`step-01-account`, …), merge to `main` when the step's section 6 checks pass. Small commits, plain-language messages; the commit history is graded.
- After every step: list the checks only his phone can do (lock screen, restart, airplane mode) as numbered click-by-click instructions, and wait for his result before moving on.
- Anything you'd log (errors, analytics) must never include moods, notes, or affirmations.
- When you finish a session, update `DECISIONS.md` / `TECHNICAL-NOTES.md` if anything was decided, commit, push, and give him a two-line summary of where things stand.

---

## 10. Your first session, exactly

Uche can paste this as the first message:

> Read HANDOFF.md, then CLAUDE.md and PRD.md. Don't write app code yet. First do the repo fixes in HANDOFF section 4, one commit each, and add the decisions in section 5. Then explain the architecture in HANDOFF section 6 to me in plain language, including why the alarm has to be tested first, and ask me the open questions in section 8 one at a time with your recommendation. When I approve, record the decisions in docs/TECHNICAL-NOTES.md and docs/DECISIONS.md, commit, push, and start build step 0: the alarm spike on a branch. Give me step-by-step instructions for anything I have to do on my Mac, my iPhone, or in Apple, Expo or Supabase.

---

## 11. Class material you can draw on

Uche is taking "Generative AI and Prompt Mastery" and "AI Design Thinking" with facilitator Freda. Useful for prompts and for explaining the build in his submission:

- **P-R-O-M-P-T**: Purpose, Role, Objective, Method, Parameters, Target output. Use it to structure the affirmation system prompt and show him it's the framework from class.
- **Techniques**: chain-of-thought, few-shot, role prompting, structured output, iteration.
- **Design thinking**: Empathize → Define → Ideate → Prototype → Test. The survey is Empathize; the PRD is Define; the spike and steps are Prototype; the 14-day self-test and outside tester are Test.
- **Submission needs**: testing, debugging, version history (commits per step), and an explanation of the build; AI assistance must be disclosed, and he must understand and be able to test what you wrote. So explain as you go.

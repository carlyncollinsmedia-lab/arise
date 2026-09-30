# Arise — Technical Notes

Inputs to the architecture step, and the technical decisions once they are made. This file exists so `PRD.md` can stay free of technical detail, as the program's brainstorming method requires.

Everything under "Inputs" is a constraint or a proposal to weigh, not a decision. Everything under "Decisions" is settled and dated. Move items from the first to the second as they are decided, and log each in `DECISIONS.md`.

---

## Inputs

### Fixed constraints from the owner

- Backend and accounts: Supabase. All keys and secrets live in Supabase Secrets or the device's secure store, never in code or chat.
- No Next.js. No framework conversion at any point.
- One platform for version 1: iPhone, the owner's own phone (decided 2026-09-23). Second platform after the 14-day test passes.
- Built with Claude Code from this repo. Assets made by the owner with Higgsfield and Adobe. Voice via the owner's ElevenLabs account.

### The alarm (the decision that shapes everything else)

- Must ring with the phone locked and the app closed, including after a restart. This rules out a server push notification or a JavaScript background timer as the alarm. It needs the platform's native alarm capability.
- On iPhone, third-party alarms use Apple's AlarmKit, available from iOS 26 and requiring user authorization. On Android, exact alarms have their own permission and scheduling rules that vary by manufacturer. Both must be verified against current platform and store rules during implementation.
- Framework choice follows from this. A shared UI framework is fine if it can reach the native alarm properly; if it cannot, the alarm layer is native and the rest can be shared. Prove the alarm on a real device before committing to a framework, not after.
- Prior leaning, not a decision: Expo (React Native) for the UI with Supabase behind it. Test whether Expo can drive the native alarm on the chosen platform first.

### Scheduling rules the alarm must meet (from PRD-full section 6)

- One active morning schedule per device with selected weekdays; snooze five minutes by default.
- Alarm time follows the device's local time zone; the next scheduled ring is always shown.
- Daylight-saving transitions produce one occurrence per scheduled day.
- Schedules are reconciled after edits, restart, app update, time-zone change, and permission changes; no duplicates.
- Never show "active" unless scheduling succeeded and permission is known; recheck on every foreground.
- Sign-out cancels that account's device schedules after a clear notice; token expiry alone does not.
- Signing in on another device does not silently enable alarms there.

### Data (from PRD-full section 9)

- One entry per account per routine date, with a stable ID, nullable morning and evening moods, optional note and intention, the displayed affirmation and its generation status, and the weather snapshot at the time.
- Entry date is the device-local date at creation and stays fixed through travel.
- Save locally first, sync after. Conflicting edits keep both for the user to resolve; deletion wins over stale updates.
- Weekly summary compares only dates with both moods; missing is never treated as a value.

### Generation, voice, and safety

- Save the mood the instant it is tapped, then allow at most eight seconds for safety check plus generation. On failure, show a reviewed fallback for that mood and say nothing about the note.
- The note is untrusted input. It is passed as data, never as instructions.
- Crisis handling: check input and output; anything suspicious routes to fixed reviewed copy, never to a second generation. Support numbers come from a small reviewed table (country, line, source, last-verified date). The AI never generates a phone number.
- Voice: one calm stock ElevenLabs voice. Generate on demand after the affirmation text exists; cache the audio for that entry so replays cost nothing. Tap-to-play by default. Captions always shown. If voice fails, text stands alone.
- Do not send the whole history to the model by default; mood, note, and the last few days' moods are enough.

### Weather (from PRD-full section 8)

- One weather provider (Open-Meteo is free without a key; decide at the architecture step). Cache per location; refresh on entry if older than 60 minutes; after three hours without refresh, mark stale and give no outfit advice.
- Deterministic clothing rules on the lowest apparent temperature in the next 12 hours: below 0°C winter; 0–9°C warm; 10–19°C layers; 20°C and above light. Rain protection is an overlay.
- Umbrella: recommend at 40% or higher rain probability in the next 12 hours; with gusts of 40 km/h or more, prefer waterproof guidance and note the umbrella may be impractical. Missing data is "unavailable", never zero.
- The same computed weather state drives the animation, the avatar outfit, and the text.

### Security minimums (from PRD-full section 10)

- Encrypted transport and storage; server-side per-user access checks; keys held server-side; no advertising trackers; no notes or moods in logs, diagnostics, or push payloads.
- Lock-screen notifications use generic text unless the user opts in.
- Account deletion cancels schedules, clears local data, and deletes server data; verify actual provider retention before promising a window to users.

### Assets

- Avatar: six presets, five outfit states (light, layers, warm, winter, waterproof), umbrella overlay, one two-second greeting clip per preset. Made once with Higgsfield, cleaned and sized with Adobe, stored in the repo. No daily image generation.
- Weather: six animations (sun, cloud, rain, thunderstorm, snow, wind), fixed set.
- All assets the same dimensions so outfits swap without layout shifts. Respect reduced-motion settings; provide a static fallback.

---

## Decisions

_Still to decide: framework; alarm approach; weather provider; asset dimensions._

| Date | Decision | Why | Recorded by |
| --- | --- | --- | --- |
| 2026-09-23 | Version 1 platform is iPhone. | It is the phone the owner carries; the PRD says version 1 ships on that one. The alarm will use Apple AlarmKit (iOS 26+). | Owner, recorded by Claude 2026-09-26 |

## Alarm spike test report (build step 0)

Test app: `spike/AlarmTest` on branch `spike/alarm` (SwiftUI + Apple AlarmKit, one-time alarm, no snooze). Phone: iPhone 14 Pro Max, iOS 26.7 (owner's wife's phone, with her agreement). Installed with the owner's free Apple ID (personal team, 7-day signing).

| # | Test | Date | Result |
| --- | --- | --- | --- |
| 1 | Phone locked, app closed, "ring in 2 minutes" | 2026-09-30 | **Passed.** Rang and showed the alarm screen (owner: "it worked"). |
| 2 | After a restart (alarm set, then phone powered off and on, unlocked once, app not opened) | 2026-09-30 | **Passed.** Rang after the restart. |
| 3 | Airplane mode on | 2026-09-30 | **Passed.** Rang with no network. |
| 4 | Focus / Do Not Disturb on | 2026-09-30 | **Passed.** Rang through Do Not Disturb. |

Problem found and fixed: the first build silently ignored the button because Xcode's generated Info.plist dropped `NSAlarmKitUsageDescription`, so iOS never showed the permission prompt. Fixed with an explicit Info.plist; the real app must include this key.

**Verdict (2026-09-30): the spike passed all four tests.** Apple AlarmKit rings a locked iPhone after a restart, with no network, and through Do Not Disturb. The alarm approach is confirmed. Not yet tested, to cover in build step 2: repeating weekly alarms, snooze (needs a Live Activity widget for the countdown), silent switch on, very low battery, time-zone and daylight-saving changes, and the Expo wrapper around the Swift code.

## Database (created 2026-09-30, Supabase project `arise`)

Migrations in `supabase/migrations/`. Tables: `profiles` (made automatically at sign-up), `alarm_schedules` (informational copy; the phone's AlarmKit schedule is the truth), `entries` (one per person per local date, id made on the phone), `reminders`, `support_lines` (empty until a person verifies each line; the AI never writes numbers), `fallback_affirmations` (the five reviewed fallbacks). Row Level Security on every table: each person reads and writes only their own rows. Checked with two test users in a rolled-back transaction: user A saw 1 entry (their own), 0 of user B's, and their own auto-created profile. Supabase security advisor: no issues after revoking direct calls to `handle_new_user`. Sign-in method is not configured yet (owner decision pending; recommendation: email link plus Sign in with Apple). The schema does not depend on it.

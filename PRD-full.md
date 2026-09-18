# Arise — Product Requirements Document

Version 2.0 · 17 September 2026 · Product owner: Uche · Qubators AI Foundry 2.0

Status: Revised implementation brief. Selected features are confirmed; proposed engineering defaults and launch gates below are recommendations, not claims of completed validation. This document replaces version 1.0.

## 1. Purpose and product hypothesis

Arise turns the first phone interaction after waking into a short, deliberate routine: a familiar avatar, a mood check-in, relevant encouragement, one optional practical step, and a useful weather brief. Daytime reminders and an evening check-out complete the daily experience.

The product hypothesis is that this combination helps working adults start their day with greater direction and is useful enough to revisit voluntarily. Neither demand, improved wellbeing, nor willingness to pay has been established. Arise is a motivation and routine product, not therapy, diagnosis, counselling, or a monitored crisis service.

Target core morning duration: at most two minutes, excluding optional note writing. More time in the app is not a success metric.

## 2. Confirmed scope and proposed defaults

The first complete release includes every feature in section 4 on both iPhone and Android. Staged implementation does not move the avatar, weather, reminders, or evening experience out of version 1. Early prototypes are explicitly incomplete.

Confirmed owner selections:

- Avatar appearance chosen directly, without asking gender.
- Weather-based clothing and umbrella; subtle opening greeting animation.
- Remembered avatar preferences.
- Selectable encouragement tone.
- Gentle low-mood nudge with opt-out.
- Editable and deletable entries.
- One optional daily intention and one practical action accompanying encouragement.
- Both iPhone and Android in the first release.

Proposed defaults for implementation planning:

- English-language, adult-only initial pilot; Uche first, followed by working adults with busy mornings, including parents.
- Neutral, secular content; three tone choices: Gentle, Practical, Uplifting.
- One recurring morning alarm; multiple one-time daytime reminders.
- Account-backed private history with an offline local cache. Scheduling remains device-local.
- Initial supported minimums: iOS 26 and Android 12, subject to a documented feasibility gate. These are product proposals, not assertions that all devices running these versions behave identically.
- Global time-zone support; public country availability expands only where weather coverage, support resources, privacy review, and operating support are ready. Worldwide release is not implied by worldwide travel support.

Audio playback was not selected and remains out of scope. Evening check-out remains in scope; no extra evening notification customization is introduced beyond permission control and changing the originally requested time.

## 3. Audience and differentiation to test

First user: Uche. Initial research segment: working adults who already use their phone shortly after waking and want a brief, practical alternative to unplanned scrolling. Recruit external testers across both platforms, including people outside the owner's audience.

The proposed distinction is a familiar visual morning companion combining emotional acknowledgement and practical preparation in a short flow. It is a positioning hypothesis, not proof of uniqueness. Existing products already offer morning reflection and mood tracking; feature aggregation alone is not defensibility.

Before the external pilot, interview at least five prospective users about actual recent mornings, existing tools, frustrations, and abandoned routines. Record evidence and disagreements rather than asking only whether they like the idea.

## 4. Release feature contract

| ID | Required feature | Release behaviour |
| --- | --- | --- |
| F01 | Account and setup | Sign-up, sign-in, recovery, sign-out, privacy explanation, deletion, preferences. |
| F02 | Opening avatar | Saved appearance, brief greeting animation, forecast-based clothing; never blocks controls. |
| F03 | Morning alarm | Local native scheduling, repeat days, stop, snooze, edit, disable, next-ring status. |
| F04 | Mood check-in | Rough, low, okay, good, great; optional note of up to 280 characters. |
| F05 | Encouragement | Three or four concise sentences using the selected tone; safe offline fallback. |
| F06 | Practical action | One brief, optional, low-risk action relevant to the check-in. |
| F07 | Daily intention | Optional user-entered intention, up to 120 characters; editable. |
| F08 | Day brief | Forecast, clothing guidance, umbrella recommendation, location and update time. |
| F09 | Weather visuals | Sun, cloud, rain, thunderstorm, snow, wind; corresponding avatar outfit states. |
| F10 | Daytime reminders | Text, explicit date/time, create/edit/cancel; ordinary notifications. |
| F11 | Evening check-out | Scheduled notification and one-tap mood; usable without morning entry. |
| F12 | History | Newest first, detail view, edits, deletions, deterministic weekly counts. |
| F13 | Low-mood nudge | Gentle capped prompt after qualifying sequence; user can disable. |
| F14 | Sensitive-input handling | Reviewed response routes, support access, country confirmation, failure handling. |

## 5. User experience

### Setup

1. See a short preview with the default avatar and product purpose.
2. Create an account; read the concise scope and privacy notice. Explain cloud AI processing separately before enabling it. Declining AI keeps reviewed mood-based encouragement available.
3. Choose an avatar preset or accept the default; select encouragement tone. Do not require demographic information.
4. Choose a weather city or allow approximate location while using the app. No background location tracking. Confirm the country used for support information separately.
5. Choose morning alarm time, repeat days, and evening check-out time. Request alarm and notification permissions when relevant, explain denial, and offer a test alarm.
6. Show the home screen. Optional preferences can be changed later.

### Morning

The native alarm offers stop and snooze. Stop always silences the alarm without requiring a check-in. Opening Arise leads to the avatar home screen with a prominent “Start my morning” action. A supported alarm action may deep-link there after authentication; the design must not depend on silently opening an unlocked app from the lock screen.

The user taps a mood. A note can be added before continuing; the mood saves immediately. The app presents encouragement and one optional action, then the weather brief. The user may add an intention and finish. No mandatory task completion, streak reward, or guilt message.

Returning during the same day resumes the existing entry. Repeat opens show the saved encouragement rather than generating a new message. The day brief can refresh independently. A user may skip reflection and view weather or reminders directly.

### Avatar and visual design

Use a finite collection of bundled, layered illustrations, not daily generated images or a 3D character system. Proposed initial asset budget: six appearance presets, five clothing states, umbrella overlay, and a short greeting animation. Presets should offer varied skin tones and hair/presentation choices without inferring identity.

Greeting plays once per foreground session, lasts no more than two seconds, and never delays interaction. Honour system reduced-motion settings and offer an animation toggle. Appearance choice persists across sessions; account sync may restore it on another device.

The avatar greets neutrally before check-in and never pretends to know how the user feels. No punitive expressions or rewards tied to mood. When forecast data is unavailable, use a neutral outfit with an explicit unavailable label. If an asset fails, show a bundled static fallback and keep the routine usable.

### Evening and reminders

Evening notification opens the check-out for its intended date. Recording an evening mood does not require completing a morning routine. The user can optionally mark the intention done, partly done, or not done; this is not a score and can be left blank.

Reminder text is entered separately from an explicit date/time picker. Version 1 does not promise natural-language time extraction. Reminders use normal notification delivery and do not claim alarm-level timing guarantees. Past times require correction. Editing cancels the old schedule before scheduling its replacement.

## 6. Alarm and platform requirements

Use a shared mobile UI where practical, with native alarm integrations. Framework selection follows the feasibility work, not the reverse. Do not implement the wake alarm as a server push notification or JavaScript background timer.

Apple's AlarmKit is available from iOS/iPadOS 26, requires user authorization, and provides alarm actions. Android exact alarms have platform-specific permission and scheduling rules. Verify applicable store policy and target-SDK requirements during implementation. [Apple AlarmKit](https://developer.apple.com/videos/play/wwdc2025/230/) · [Android alarms](https://developer.android.com/develop/background-work/services/alarms)

Required scheduling rules:

- One active morning schedule per device, with selected weekdays; default snooze five minutes, configurable to ten.
- Alarm time follows the device's local time zone. Show the next scheduled date/time explicitly.
- On daylight-saving transitions, target one occurrence per local scheduled day: first occurrence for repeated times, next valid local time for nonexistent times. Verify actual native behaviour; any unavoidable difference must be documented before support is claimed.
- Reconcile schedules after edits, restart where permitted, app update, time-zone change, and permission changes. No duplicate alarms.
- Show scheduling errors and revoked permissions prominently when detectable; never display “active” without successful scheduling and known authorization. Status is rechecked on foreground entry.
- Alarm operation must not depend on internet access, an AI service, or a valid cloud session. Explicit sign-out cancels that account's device schedules after clear notice; token expiry alone does not.
- A powered-off device cannot be promised to ring. Force-stop and manufacturer restrictions must be tested and documented rather than concealed.
- Logging in on another device does not silently enable alarms there. The user configures that device explicitly.

Feasibility gate: prototype schedule, lock-screen stop/snooze, app entry, repeat, and permission-denial handling on a real iPhone and at least Pixel and Samsung Android devices before committing to the final support matrix or delivery estimate.

## 7. Encouragement, actions, and safety

Output uses the current mood, selected tone, and optional note when processing is enabled. Do not transmit the entire history by default. Notes are untrusted input, never instructions that override product rules.

Encouragement acknowledges the situation without diagnosing, promising success, affirming harmful beliefs, or unnecessarily repeating private details. Variation is desirable; meaningful relevance takes priority over never repeating wording. Practical actions must be brief, optional, feasible, and avoid medical, legal, financial, or crisis-treatment instructions.

Proposed performance rule: save locally immediately, then allow at most eight seconds for the complete safety-and-generation pipeline. If it fails, show a reviewed generic message and optional generic action. Do not claim a fallback interpreted the note. Do not upload queued private notes later without a fresh user action.

Evaluate a curated set of at least 40 synthetic scenarios spanning all moods and tones, grief, conflict, ordinary stress, indirect distress, figurative expressions, and hostile instructions. Review relevance, groundedness, tone, action suitability, and safety. Provider or prompt changes require re-evaluation.

Safety handling ships with note-based generation:

- Check relevant input and generated output; suspicious or unsafe results route to reviewed fixed copy, not a second uncontrolled generation.
- For indications of immediate danger or self-harm, show calm support guidance and reviewed local resources. Keep the rest of the app accessible. No automatic contact with others.
- Provide a persistent “Get support” entry independent of detection. State that entries are not monitored and detection is not guaranteed.
- Country is user-confirmed and changeable, never assumed solely from a weather city. Resource records include country, language, contact method, source, and last verification date. Never generate phone numbers.
- Offline or uncertain processing uses reviewed neutral copy and available support access. An offline resource directory covers supported launch countries. Resource review ownership and cadence are launch requirements.
- Low-mood nudge: rough/low on three consecutive local calendar dates; skipped dates break the sequence. Show once when eligible, at most once per seven days. An edited history does not trigger retrospective notifications. Opt-out suppresses this nudge immediately but does not remove support access. The threshold is a product heuristic, not a clinical finding.

## 8. Weather and clothing rules

Use one contracted weather provider and deterministic rules. AI must not invent weather, choose resource numbers, or calculate weekly statistics.

Forecast window: the remaining local day, with attention to the next 12 hours. Show location, forecast period, units, and last update. Offer Celsius/Fahrenheit. Cache per location; refresh on entry if older than 60 minutes. After three hours without refresh, mark the data outdated and suspend actionable clothing/umbrella guidance.

Proposed initial clothing rules use the lowest forecast apparent temperature in the next 12 hours: below 0°C winter; 0–9°C warm; 10–19°C layers; 20°C or above light. Rain protection is an overlay. These are comfort defaults to test, not safety advice; handle extreme conditions with a factual caution and link to the provider's alert where available.

Proposed umbrella rule: recommend for forecast rain probability of at least 40% in the next 12 hours. For forecast gusts at least 40 km/h, prefer waterproof guidance and caution that an umbrella may be impractical. Missing precipitation or wind data must not be interpreted as zero. Support “unavailable” as a third state. Thresholds must be reviewed against the chosen provider's fields before release.

Use the same calculated state for avatar clothing, weather animation, and text. Test fixture forecasts, including freezing rain and mixed conditions. General garment categories are permitted; brand and shopping recommendations are not.

## 9. History, editing, and dates

Each daily entry has a stable ID, account ID, routine date, creation time zone, UTC timestamps, nullable morning/evening moods, optional note/intention, displayed encouragement/action, generation status/version, and original weather snapshot.

- One entry per account and routine date; retries update rather than duplicate it.
- Normal entry date is the device-local date at creation and stays fixed through travel. A scheduled evening action retains its target date; after midnight, ask whether the response is for that date or today.
- Morning and evening can exist independently. Skipping both creates no row.
- Users can edit their moods, note, and intention, and delete an entry. Counts recalculate. Saved generated text is not silently rewritten after edits; label it as based on the earlier check-in and allow its removal. No automatic generation from historical edits.
- Removing a note offers removal of its derived encouragement/action so private details are not accidentally retained there.
- Weekly summaries use the last seven routine dates, report response counts, and compare only dates with both moods. Example: “Evening rating was higher on 3 of 4 days with both check-ins.” Missing is never treated as low or okay. Do not imply causation or diagnosis.
- Sync uses record revisions; conflicting edits preserve both alternatives for user resolution. Deletion wins over stale updates and cannot be undone by offline sync.

## 10. Privacy, security, and operations

Create an explicit data map before external testing: device cache, account database, AI processor, weather provider, logs, and backups. Explain purposes and service-provider processing honestly. Do not promise that nothing ever leaves the device if cloud processing occurs.

Minimum requirements: encrypted transport and storage, secure device credential storage, server-side per-user access checks, server-held API keys, least-privilege administrative access, no advertising trackers, and no notes/moods in diagnostics or push payloads. Lock-screen notifications use generic text by default; displaying reminder content requires a setting.

Account deletion must be easy to initiate, cancel future schedules, and clear local account data. Proposed retention targets: local deletion immediately; active-server deletion within 24 hours; backup expiry within 30 days. Verify these against actual providers before making them user promises. Delete dependent generated content and enforce deletions after any restore. Document any legally required exception rather than inventing one.

Apple requires an in-app account-deletion initiation option for apps supporting account creation. [Apple deletion guidance](https://developer.apple.com/support/offering-account-deletion-in-your-app/)

Select providers only after reviewing retention, training-use settings, processing regions, and deletion capability. Set a maintenance owner for operating-system changes, resource verification, incident response, support, and provider failures. Public release requires applicable privacy and product-claims review; the motivation disclaimer is not a substitute.

## 11. Acceptance and release gates

| Area | Required evidence |
| --- | --- |
| Avatar | Preference survives restart and sign-in; each weather state maps consistently; reduced motion and failed assets work. |
| Alarms | Real-device matrix covers locked/background/terminated states, offline, restart, Focus/DND, battery settings, time-zone/DST changes, denial/revocation, stop/snooze, and updates. Unsupported states are explicit. |
| Reliability | Zero unresolved missed or duplicate alarms under supported conditions in scripted testing and pilot. A short successful trial does not prove universal reliability. |
| Check-in | Save survives app termination and network loss; repeated submission creates one entry. |
| AI/safety | Reviewed scenario suite passes; timeout, classifier failure, rejected output, country correction, and offline fallbacks verified. No critical unsafe output remains unresolved. |
| Weather | Known forecast fixtures produce expected text/outfits; stale, missing, and changed-city states are handled. |
| Reminders | Create/edit/cancel persists and cancels obsolete notifications; time-zone policy is shown. One-time reminders preserve the selected instant after travel. |
| History | Missing halves, late check-out, edits, deletion, sync conflict, and weekly denominators produce correct results. |
| Privacy | API-level cross-account access attempts fail; account deletion and stale-device sync cannot restore deleted content. |
| Accessibility | Screen reader labels, large text, adequate contrast, non-colour mood labels, and reduced motion tested on both platforms. |
| Speed | On declared test devices, cached home is interactive within two seconds in at least 95% of measured launches; timeout fallback appears within eight seconds of submission. |
| Completion | Pilot median core morning duration at most two minutes, excluding optional writing. |

Record device models, OS versions, app build, results, and known limitations. Define supported configurations from evidence. No public release with unresolved critical security, data-loss, safety, or supported-alarm defects.

## 12. Validation and commercial questions

Start the 14-day owner test only after the entire measured routine, history, safeguards, and telemetry are ready. Keep a stable build except for necessary fixes. Targets: at least 10 morning completions, seven evening responses, no unresolved supported-alarm failures, and useful feedback on encouragement and avatar experience. Passing establishes personal utility only.

Next run a four-week pilot with 10–15 consenting adults, split across platforms. Proposed exploratory continuation gate: at least half of all enrolled testers complete three mornings in week four without researcher chasing, and at least 70% of rated messages are marked useful, with rating response rate reported. These are owner-reviewable decision thresholds, not industry benchmarks or proof of market fit.

Track completion, return, latency, fallback rate, optional usefulness rating, notification permission state, and cost without collecting note content. Separate scheduled product notifications from researcher reminders. Interview dropouts and record what retained users would miss. Small samples support learning, not strong statistical claims.

Payments remain out of scope. Before funding expansion, test a concrete paid proposition, alternatives, recruitment channels, and ongoing operating cost. Include inference, moderation, weather, hosting, storage, support, maintenance, and store costs. Model 100, 1,000, and 10,000 daily users using current provider quotes; do not invent revenue forecasts.

## 13. Delivery plan

| Stage | Deliverable and exit condition |
| --- | --- |
| 0 — Feasibility | Native alarm prototypes on both platforms; device/support matrix, vendor shortlist, asset specification, staffing and estimate. |
| 1 — Foundation | Accounts, data model, local cache, privacy controls, deletion, static avatar home, design system. |
| 2 — Core routine | Mood, note, tone, intention, actions, safe generation/fallback, history editing; safety ships here. |
| 3 — Daily utilities | Production alarm integrations, reminders, evening check-out, deterministic summaries, sync handling. |
| 4 — Full visual brief | Weather rules, outfit overlays, umbrella, weather animations, saved avatar preferences and greeting. |
| 5 — Verification | Complete acceptance matrix, accessibility, deletion/security review, resource verification, provider cost limits. |
| 6 — Pilot and release | Owner test, external pilot, evidence review, store preparation and support readiness. |

Each stage is committed and demonstrated before proceeding. A visually complete demo is not a release candidate until verification passes. Both platforms remain required; a failed platform gate changes the plan through an explicit scope decision, not a silent downgrade.

No defensible delivery date or budget exists until stage 0 resolves native integration, asset effort, provider selection, and available developer capacity. Shared UI reduces duplicate work but does not eliminate platform testing.

## 14. Out of scope and remaining decisions

Deferred: spoken affirmations, devotional mode, avatar conversation, daily image generation, social sharing, calendar ingestion, subscriptions, shared accounts, desktop/web product, and clinical interpretation.

Before implementation commitment, confirm proposed OS minimums, initial launch countries, illustration style/presets, cloud providers, team capacity, and budget. Before external testing, assign safety/resource and privacy owners and finalize consent. Before public release, verify current store policies, operating costs, incident handling, and support coverage.

The next deliverable is a technical feasibility result and screen prototype against this PRD. Building proceeds with the full concept intact, while uncertainty is resolved through explicit tests and release gates.

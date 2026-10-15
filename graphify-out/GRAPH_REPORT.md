# Graph Report - arise  (2026-10-15)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 568 nodes · 908 edges · 39 communities (29 shown, 10 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d64c5f74`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Web App Morning Flow
- Android Alarm Screens
- Mobile App Packages
- Plus Checkout & AI Functions
- Android Alarm Service
- Android Alarm Store
- Project Documents
- App Icons & Permissions
- Alarm Module (TypeScript)
- Design Tokens & UI
- Decisions Log
- Database Schema
- iPhone AlarmKit Module
- Build Rules
- Architecture & Tech Notes
- QAF Class Notes
- Version 1 Features
- Roadmap
- Web App Data & Reminders
- Arise Plus & Privacy
- Release-Grade PRD
- Reminder Chimes
- Planning Handoff
- Affirmations & AI Costs
- Data Model & Fallbacks
- Crisis Safety Lines
- Weather & Outfit
- On-Device Storage
- Expo Agent Notes
- TypeScript Config
- Subscriptions Table
- Per-User AI Limit
- Plus Edge Functions
- Daily AI Cap
- Web Build Script
- Stripe Config
- Offline Service Worker

## God Nodes (most connected - your core abstractions)
1. `App()` - 32 edges
2. `Arise web app (index.html)` - 28 edges
3. `Arise PRD v1.1 (product bible)` - 20 edges
4. `AlarmStore` - 18 edges
5. `Arise mobile alarm app` - 18 edges
6. `AlarmService` - 15 edges
7. `Decisions log` - 15 edges
8. `Arise Demo Day slide deck (HTML)` - 15 edges
9. `Reminders()` - 12 edges
10. `expo` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Principles across every version` --semantically_similar_to--> `The alarm is the product`  [INFERRED] [semantically similar]
  docs/ROADMAP.md → CLAUDE.md
- `Encouragement, actions and safety` --semantically_similar_to--> `Safety and protection (section 7)`  [INFERRED] [semantically similar]
  docs/PRD-full.md → PRD.md
- `Arise Demo Day slides (PDF export)` --semantically_similar_to--> `Arise Demo Day slide deck (HTML)`  [INFERRED] [semantically similar]
  presentation/Arise-Demo-Day.pdf → presentation/Arise-Demo-Day.html
- `Arise Plus $4.99 CAD/month (Stripe test)` --conceptually_related_to--> `Out of scope / parked (section 8)`  [AMBIGUOUS]
  docs/STATUS.md → PRD.md
- `support_lines table` --implements--> `F15 Get support and crisis response`  [INFERRED]
  docs/TECHNICAL-NOTES.md → PRD.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Morning routine flow: alarm, mood, affirmation, day brief, intention** — prd_f04_morning_alarm, prd_f05_mood_check_in, prd_f06_affirmation, prd_f07_avatar_speaks, prd_f09_day_brief, prd_f08_daily_intention [EXTRACTED 1.00]
- **One weather state drives brief, visuals and avatar outfit** — docs_technical_notes_weather_clothing_rules, prd_f09_day_brief, prd_f10_weather_visuals, prd_f03_avatar, prd_seasonal_backgrounds [EXTRACTED 1.00]
- **Affirmation generation with safety and fallback** — docs_technical_notes_generate_affirmation_edge_function, prd_reviewed_fallback_affirmation, docs_technical_notes_fallback_affirmations_table, prd_f15_support_and_crisis_response, docs_technical_notes_support_lines_table, docs_handoff_reliable_unattended_prompt [INFERRED 0.85]
- **Crisis safety path** — index_crisis_regex, index_generate, index_rendersupport, index_support_lines_json, presentation_arise_demo_day_crisis_safety [INFERRED 0.85]
- **Arise Plus AI pep talk flow** — index_refreshplus, index_askclaude, docs_integration_test_log_generate_affirmation, index_subscriptions_table, index_arise_plus [INFERRED 0.85]
- **Shared reminder system across windows** — index_checkreminders, index_syncreminders, index_firereminder, reminders_check, index_local_store [INFERRED 0.85]

## Communities (39 total, 10 thin omitted)

### Community 0 - "Web App Morning Flow"
Cohesion: 0.06
Nodes (66): allEntries(), App(), applyAlarm(), continueToPepTalk(), speak(), brief(), Card(), Choice() (+58 more)

### Community 1 - "Android Alarm Screens"
Cohesion: 0.07
Nodes (4): onCreate(), AlarmReceiver, RescheduleReceiver, AriseAlarmModule

### Community 2 - "Mobile App Packages"
Cohesion: 0.06
Nodes (34): dependencies, expo, expo-build-properties, expo-dev-client, expo-haptics, expo-notifications, expo-speech, expo-sqlite (+26 more)

### Community 3 - "Plus Checkout & AI Functions"
Cohesion: 0.08
Nodes (15): ALLOWED_RETURN, CORS, claimAiCall(), CORS, fallback(), FALLBACKS, json(), Mood (+7 more)

### Community 6 - "Project Documents"
Cohesion: 0.10
Nodes (22): Arise project documents guide, CLAUDE.md (session rules), DECISIONS.md, First Claude Code prompt (architecture before code), PRD-full.md, PRD.md (product bible), QAF-NOTES.md, ROADMAP.md (+14 more)

### Community 7 - "App Icons & Permissions"
Cohesion: 0.07
Nodes (27): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, blockedPermissions, package, predictiveBackGestureEnabled (+19 more)

### Community 8 - "Alarm Module (TypeScript)"
Cohesion: 0.12
Nodes (10): AlarmPermission, ScheduledAlarm, AriseAlarmNative, native, requestAuthorization(), { withEntitlementsPlist }, { withAppBuildGradle }, expo (+2 more)

### Community 9 - "Design Tokens & UI"
Cohesion: 0.12
Nodes (20): Arise design tokens (night-to-dawn palette), Button styles (primary gold, secondary, pill), Arise design preview page, Note (280) and intention (120) inputs, Live note character counter script, Nunito typography scale, Tab bar: Today, Reminders, History, Weather card component (+12 more)

### Community 10 - "Decisions Log"
Cohesion: 0.14
Nodes (10): Decisions log, Faith quotes feature (paid tier), Version 2 public release and paid tier, STATUS.md project state, Google Play release requirements, Open items (history bug, QubDrive APK, Play, App Store), Roadmap as presented 12 Oct (phases 2-3), F04 Morning alarm (+2 more)

### Community 11 - "Database Schema"
Cohesion: 0.22
Nodes (14): alarm_schedules_touch, entries_touch, entries_user_date_idx, on_auth_user_created, profiles_touch, public.alarm_schedules, public.entries, public.fallback_affirmations (+6 more)

### Community 12 - "iPhone AlarmKit Module"
Cohesion: 0.15
Nodes (5): AlarmKit, ExpoModulesCore, AriseAlarmMetadata, AriseAlarmModule, SwiftUI

### Community 13 - "Build Rules"
Cohesion: 0.13
Nodes (8): P-R-O-M-P-T prompting framework, Reliable unattended morning prompt design, Arise Plus $4.99 CAD/month (Stripe test), generate-affirmation Edge Function, F15 Get support and crisis response, Arise README, Progress table, Prototype demo video

### Community 14 - "Architecture & Tech Notes"
Cohesion: 0.17
Nodes (15): EAS Build + TestFlight, Recommended architecture (Expo + Supabase + AlarmKit), Alarm and platform requirements, Weather and clothing rules spec, Alarm scheduling rules, Alarm spike test report (step 0), Apple AlarmKit, Calgary wrong outfit advice bug (+7 more)

### Community 15 - "QAF Class Notes"
Cohesion: 0.16
Nodes (15): Design thinking: Empathize to Test, Brainstorming method (one question at a time), Complete product map (plan to operate), QAF class notes, PRD structure used in class, Qubators AI Foundry 2.0 Cohort 2, Build order (section 10), Arise PRD v1.1 (product bible) (+7 more)

### Community 16 - "Version 1 Features"
Cohesion: 0.20
Nodes (12): Smiley-face mood chips, Arise mobile alarm app, F01 Account, F02 Sign-up notice, F05 Mood check-in (five moods), F06 Affirmation, F08 Daily intention, F11 Daytime reminders (+4 more)

### Community 17 - "Roadmap"
Cohesion: 0.23
Nodes (11): Practical action feature, Release feature contract F01-F14, Validation and commercial questions, Arise roadmap, Selectable encouragement tone, Version 1.1 audience pilot, Version 1.5 second platform and hardening, Version 1 program build (+3 more)

### Community 18 - "Web App Data & Reminders"
Cohesion: 0.23
Nodes (8): Arise web app (index.html), checkReminders(), ensureToday(), entryToday(), load(), rank(), renderHistory(), syncReminders()

### Community 19 - "Arise Plus & Privacy"
Cohesion: 0.18
Nodes (12): refreshPlus(), renderPlus(), Supabase subscriptions table, Arise Privacy Policy (draft), GDPR rights (EU/UK), Nezeville Media Inc. (owner), Not a medical or crisis service, Nuuch Systems (technology operator) (+4 more)

### Community 20 - "Release-Grade PRD"
Cohesion: 0.20
Nodes (10): Acceptance and release gates, Delivery plan stages 0-6, PRD-full v2.0 release-grade spec, Encouragement, actions and safety, History, editing and dates, Privacy, security and operations, 40 synthetic safety scenarios evaluation, Entry data model (local first, sync after) (+2 more)

### Community 21 - "Reminder Chimes"
Cohesion: 0.29
Nodes (7): checkAlarm(), chime(), fireReminder(), Arise Reminders window (reminders.html), check(), chime(), fire()

### Community 22 - "Planning Handoff"
Cohesion: 0.29
Nodes (6): CLAUDE.md build rules, Session start checklist, HANDOFF.md planning-to-build bridge, Open decisions for owner, Repo path fixes to do first, Schedule reality check

### Community 23 - "Affirmations & AI Costs"
Cohesion: 0.25
Nodes (8): Reviewed affirmation library (AFF), Arise Plus ($4.99 CAD/month), askClaude(), assets/faith/quotes.json, faithQuote(), generate(), AI cost control (300 calls/day, 2 per Plus member), Anthropic Claude AI

### Community 24 - "Data Model & Fallbacks"
Cohesion: 0.33
Nodes (6): Data model first draft (profiles, entries, reminders), fallback_affirmations table, Row Level Security, Supabase arise database schema with RLS, support_lines table, Reviewed fallback affirmation

### Community 25 - "Crisis Safety Lines"
Cohesion: 0.33
Nodes (6): CRISIS note check, renderSupport(), assets/support/lines.json, supportCountry(), supportLine(), Crisis safety: help lines for 15 countries, no invented numbers

### Community 26 - "Weather & Outfit"
Cohesion: 0.40
Nodes (5): getForecast(), liveLook(), Open-Meteo forecast and geocoding API, refreshWeather(), Morning flow (alarm, companion, mood, pep talk, day brief)

### Community 27 - "On-Device Storage"
Cohesion: 0.40
Nodes (5): localStorage store arise-prototype-v1, save(), Architecture: feelings on phone, minimal server, On-device data (check-ins, notes, history, reminders), load()

### Community 28 - "Expo Agent Notes"
Cohesion: 0.40
Nodes (3): Mobile AGENTS.md (Expo/React Native rules), EAS build/submit/update, Expo Router (src/app routes)

### Community 29 - "TypeScript Config"
Cohesion: 0.40
Nodes (4): compilerOptions, strict, extends, expo/tsconfig.base

### Community 32 - "Plus Edge Functions"
Cohesion: 0.67
Nodes (3): callFn(), create-checkout edge function, manage-plus edge function

## Ambiguous Edges - Review These
- `Out of scope / parked (section 8)` → `Arise Plus $4.99 CAD/month (Stripe test)`  [AMBIGUOUS]
  docs/STATUS.md · relation: conceptually_related_to
- `Owner's standing rules` → `Entry data model (local first, sync after)`  [AMBIGUOUS]
  docs/STATUS.md · relation: conceptually_related_to

## Knowledge Gaps
- **45 isolated node(s):** `AlarmKit`, `ExpoModulesCore`, `SwiftUI`, `expo-build-properties`, `expo-dev-client` (+40 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 208 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Arise PRD v1.1 (product bible)` connect `QAF Class Notes` to `Design Tokens & UI`, `Decisions Log`, `Build Rules`, `Architecture & Tech Notes`, `Version 1 Features`, `Roadmap`, `Release-Grade PRD`, `Planning Handoff`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `App()` (e.g. with `loadEntry()` and `mobile/index.ts`) actually correct?**
  _`App()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `AlarmKit`, `ExpoModulesCore`, `SwiftUI` to the rest of the system?**
  _45 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Web App Morning Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.058385093167701865 - nodes in this community are weakly interconnected._
- **Why does `Arise web app (index.html)` connect `Web App Data & Reminders` to `Plus Edge Functions`, `Arise Plus & Privacy`, `Reminder Chimes`, `Affirmations & AI Costs`, `Crisis Safety Lines`, `Weather & Outfit`, `On-Device Storage`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Out of scope / parked (section 8)` and `Arise Plus $4.99 CAD/month (Stripe test)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Owner's standing rules` and `Entry data model (local first, sync after)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
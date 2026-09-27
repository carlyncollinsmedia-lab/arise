# Arise — Roadmap

17 September 2026 · Product owner: Uche Azuike

How Arise grows from the program build into something people pay for. Each release earns the next with evidence, not enthusiasm. `PRD.md` is what is being built now; `PRD-full.md` is the release-grade specification the later releases are drawn from.

---

## Version 1 — The program build (now)

**Goal:** a working app on the builder's own phone that he opens on at least 10 of 14 mornings without forcing himself.

**Platform:** one, the builder's phone.

**Scope:** everything in `PRD.md` section 5. Alarm, avatar with greeting, mood check-in, spoken affirmation with fallback, day brief with weather visuals, intention, daytime reminders, evening check-out, history with edit and delete, low-mood nudge, "Get support" and crisis response, account deletion.

**Gate to pass:** the 14-day self-test in `PRD.md` section 9, plus every acceptance check in section 6 on a real, locked phone.

**Deliverables:** GitHub repo with commit history per build step; QAF submission; installed build on the builder's phone through the platform's internal testing channel.

---

## Version 1.1 — Audience pilot (after the self-test passes)

**Goal:** find out whether people who are not the builder come back on day eight.

**Who:** 10 to 15 adults from the builder's own audiences, recruited with consent, told plainly it is a test.

**Duration:** four weeks.

**What changes in the app:** bug fixes and wording improvements from the self-test only. No new features. A simple optional "was this useful?" tap after the affirmation, and basic counts (check-ins, evening responses, alarm failures, fallback rate) with no note content ever collected.

**Gate to pass (proposed, owner-reviewed):** at least half of testers complete three mornings in week four without being chased, and at least 70% of rated affirmations marked useful. Interview everyone who dropped out.

**Costs to set up before this:** Apple developer account or Google Play account, a privacy policy page, a support email.

---

## Version 1.5 — Second platform and hardening

**Goal:** the same app, equally reliable, on the other phone.

**Scope:**

- Second platform, with the full alarm test matrix from `PRD-full.md` section 11 (locked, background, killed, restart, airplane mode, Do Not Disturb, battery restrictions, time-zone and daylight-saving changes, permission revoked).
- Selectable encouragement tone: gentle, practical, uplifting.
- Practical action offered with the affirmation (one brief, optional, low-risk step).
- Accessibility pass: screen reader labels, large text, contrast, non-colour mood labels, reduced motion.
- Privacy and operations requirements from `PRD-full.md` section 10: data map, retention, deletion within stated windows, provider review.

**Gate to pass:** zero unresolved missed or duplicate alarms across the supported device list; deletion and privacy checks pass; lawyer review of the notice, terms, and store listing.

---

## Version 2 — Public release and paid tier

**Goal:** on the app stores, free to use, with a premium tier worth paying for.

**Free tier:** everything in version 1.5.

**Premium tier (proposed, to be tested with real pricing before build):**

- Devotional mode: scripture-based affirmations as an optional companion mode.
- Extra voices and avatar packs.
- Send one on: share today's affirmation as an image or to one person.
- Calendar awareness: the brief mentions the day's first event.

**Before committing:** model running cost at 100, 1,000, and 10,000 daily users using current provider prices (voice, generation, weather, hosting, storage, support), test one concrete paid proposition with pilot users, and confirm store policies of the day. No revenue forecast until there is retention data.

---

## Not planned

Web or desktop version. Shared or family accounts. Clinical interpretation of any kind. Avatar conversation beyond the daily routine.

---

## Principles that hold across every version

1. The alarm is the product. Nothing ships that makes it less reliable.
2. The avatar is the differentiator. Invest there before anywhere else.
3. Every release earns the next with evidence from real mornings.
4. Safety features ship with the feature that needs them, never after.
5. Scope changes are written down here and in `PRD.md`, never made silently in the build.

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
- Accessibility check on the second platform: screen reader labels, large text, contrast, non-colour mood labels, reduced motion. (On the first platform this is built from version 1; owner decision 30 September 2026.)
- Privacy and operations requirements from `PRD-full.md` section 10: data map, retention, deletion within stated windows, provider review.

**Gate to pass:** zero unresolved missed or duplicate alarms across the supported device list; deletion and privacy checks pass; lawyer review of the notice, terms, and store listing.

---

## Version 2 — Public release and paid tier

**Goal:** on the app stores, free to use, with a premium tier worth paying for.

**Free tier:** everything in version 1.5, plus:

- **Lock-screen and home-screen widget** (owner pick, 30 September 2026): today's affirmation and weather without opening the app. Free, because it brings people back every day and that is what sells the paid tier.

**Premium tier (proposed, to be tested with real pricing before build):**

- **Faith quotes for every faith** (owner decision, 30 September 2026; replaces the earlier "devotional mode"). See the section below.
- Extra voices and avatar packs.
- Send one on: share today's affirmation as an image or to one person.
- Calendar awareness: the brief mentions the day's first event.

**Before committing:** model running cost at 100, 1,000, and 10,000 daily users using current provider prices (voice, generation, weather, hosting, storage, support), test one concrete paid proposition with pilot users, and confirm store policies of the day. No revenue forecast until there is retention data.

---

## Faith quotes (Version 2, paid tier)

**The idea (owner's words):** "the app will give you an inspiring quote from our religion. This is for the paid." One feature that works for Christians, Muslims and people of other faiths, instead of a single-church feature.

**How it works**

1. In Settings (and offered once at setup to paid users) the user picks a faith, or none: Buddhist, Christian, Hindu, Jewish, Muslim, Sikh, Other, or None. Listed alphabetically so no faith is ranked first. "None" is the default. Changeable any time.
2. Each morning, after the affirmation, the companion shares one short quote from that faith, always with its reference (for example "Philippians 4:13" or "Qur'an 94:5"). Shown as text and read aloud with the same voice setting.
3. Christians can choose "Bible verse" or, if permission is granted, "Rhapsody of Realities" (see below).

**Rules that make it safe**

| What could go wrong | What we do about it |
| --- | --- |
| The AI rewords or invents a verse. Misquoting scripture offends people and destroys trust. | The AI never writes, edits or paraphrases a quote. Quotes come only from a fixed, reviewed library stored as exact text with its reference. The AI (or a simple rule) only chooses which quote fits today's mood. The affirmation itself stays neutral, as PRD F06 requires, so the existing banned-words check on the affirmation stays as it is. |
| A quote about judgement, war or punishment appears on a rough morning. | The library holds only encouraging quotes (strength, comfort, hope, gratitude, patience), each tagged with the moods it suits. Nothing is shown untagged. |
| We use a translation we do not have the right to use, and the app is taken down. | Use only translations that are free for anyone to use or that we have written permission for. Record the source and licence of every quote in the library. Check each one before launch; no translation is added "for now". |
| Rhapsody of Realities is shown without permission. It belongs to Christ Embassy / LoveWorld Publishing. | Nothing from Rhapsody is copied into the app without written permission. Until permission arrives, Christian users can tap "Open today's Rhapsody", which opens the official Rhapsody app or website and copies nothing. Owner to write to LoveWorld Publishing asking for permission, with credit to them. |
| Someone gets a quote from the wrong faith, or feels pushed toward one. | Off unless the user chooses a faith. Never mixed: a user only ever sees their own faith. No quote appears for "None". No faith content in notifications unless the user turns that on. |
| A quote sits next to the crisis message. | On a crisis morning (PRD F15) no quote is shown; only the fixed support message. |
| A religion is private information. | The chosen faith is stored only as a setting for that user, protected like the rest of their data, never shared, never used for advertising, and deleted with the account. The privacy notice says so. It is not sent to the AI. |
| A quote is wrong or badly chosen. | A person of each faith reviews that faith's list before it goes live (50 to 100 quotes per faith to start). Each quote has a "report this quote" link that hides it for that user and flags it for review. |
| Store reviewers or users see it as the app "preaching". | Store text describes it as an optional quote of the day from the user's own faith. The app stays described as motivation and a morning routine (CLAUDE.md rule 12). |

**Pairs well with:** pep talks in the user's own language (owner shortlist, not yet decided), for example a Qur'an verse followed by a pep talk in Hausa.

**Before building:** library sources and licences confirmed per faith, reviewers named, Rhapsody permission asked (answer recorded here), price tested with pilot users.

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

# CLAUDE.md — Rules for building Arise

Read this file at the start of every session. Then read `PRD.md`. Do not start work until both are read.

## What this project is

Arise is a mobile alarm app. When the alarm rings, an avatar greets the user, asks how they feel, speaks a short affirmation written for that mood, and shows the weather with outfit and umbrella guidance. Daytime reminders, an evening check-out, and a history of past mornings complete it. The product owner is Uche Azuike. It is his Qubators AI Foundry 2.0 submission and is intended to become a sellable product.

## The documents, and which one wins

- `PRD.md` (repo root, where the course's automated grader reads it) — the product bible. What we are building now. If code and this document disagree, the document wins; if the document is wrong, we change the document first, then the code.
- `docs/ROADMAP.md` — what comes after version 1, in order. Nothing from later versions is built now.
- `docs/PRD-full.md` — the release-grade specification. Reference only. Use it when a detail in PRD.md needs more depth; do not treat it as the build list.
- `docs/TECHNICAL-NOTES.md` — inputs to the architecture and the technical decisions once made. Update it when a technical decision is taken.
- `docs/DECISIONS.md` — dated log of product and technical decisions. Add a line whenever one is made.
- `docs/SELF-TEST.md` — the 14-day self-test log the owner fills in.

## Working rules

1. **Build in the order in PRD.md section 10.** Finish a step, check it against section 6, commit, then start the next. Do not begin a later step early because it looks easy.
2. **No new scope without a written decision.** If something seems missing or a better idea appears, say so and stop. The owner decides; the decision goes in `DECISIONS.md` and, if it changes the product, in `PRD.md`. Then build it.
3. **Commit after every working step** with a message that says what changed and why, in plain language. Version history is part of the program submission. Never batch a day's work into one commit.
4. **Never put keys, tokens, or passwords in code, config files, or chat.** They live in Supabase Secrets (or the platform's secure store on device). If a key is needed, tell the owner where to add it; never ask him to paste it.
5. **No Next.js, ever.** Do not propose or perform any framework conversion. Framework choice is made once, at the architecture step, and recorded in `TECHNICAL-NOTES.md`.
6. **Nothing sends, publishes, or contacts anyone without the owner's explicit approval** — no emails, no store submissions, no messages from the app on the user's behalf.
7. **The alarm is the product.** No change that makes the alarm less reliable is acceptable, however small. The alarm must never depend on internet, an AI service, or a signed-in session to ring.
8. **Safety features ship with the feature that needs them.** The note box does not ship without the crisis response and "Get support". No exceptions.
9. **Explain as you go.** The owner is non-technical and learning. When you make a technical choice, say in one or two plain sentences what it is and why. When he asks how something works, answer at the level of someone who wants to understand it, not just accept it.
10. **Ask when the PRD is unclear.** One question at a time, with your recommendation. Do not guess and build.
11. **Test what a computer can test; tell the owner what only a phone can test.** After each step, list the checks from section 6 that need him to try it on his device.
12. **Keep the app describable as motivation and a morning routine.** Never write copy, comments, or store text that calls it therapy, wellness treatment, mental-health support, or care.

## Session start checklist

- Read this file and `PRD.md`.
- Read the last five lines of `docs/DECISIONS.md`.
- Run `git log --oneline -10` and state which build step is current.
- State what you plan to do this session in three lines, then wait for a go-ahead.

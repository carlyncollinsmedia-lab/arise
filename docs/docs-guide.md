# Arise — project documents

Everything Claude Code needs to build Arise from start to finish. Keep this folder as `docs/` inside the `arise` repository, with `CLAUDE.md` copied to the repository root.

| File | What it is | Who changes it |
| --- | --- | --- |
| `CLAUDE.md` | Rules Claude Code reads at the start of every session. Goes in the repo root. | Owner, with Claude |
| `PRD.md` | The product bible. What is being built now. No technical detail. | Owner, with Claude |
| `ROADMAP.md` | Version 1 → audience pilot → second platform → paid tier. | Owner, with Claude |
| `PRD-full.md` | Release-grade specification. Reference only. | Rarely |
| `TECHNICAL-NOTES.md` | Inputs to the architecture step, and technical decisions once made. | Claude Code, approved by owner |
| `DECISIONS.md` | Dated log of every product and technical decision. | Anyone who makes a decision |
| `SELF-TEST.md` | The 14-day self-test log. | Owner, daily |
| `QAF-NOTES.md` | Program method and submission requirements. | Rarely |

## Setting up the repository

1. On github.com: New repository → name `arise` → Private → Create.
2. In Terminal on the Mac: `git clone <repo URL>` then `cd arise`.
3. Copy this folder in as `docs/`. Copy `docs/CLAUDE.md` to the repo root as `CLAUDE.md`.
4. First commit: `git add .` then `git commit -m "Add product documents"` then `git push`.
5. Start Claude Code in the `arise` folder.

## The first prompt for Claude Code

Paste this as the first message:

> Read CLAUDE.md, then PRD.md, docs/ROADMAP.md and docs/TECHNICAL-NOTES.md. Do not write any code yet. First, tell me in plain language which phone platform you recommend for version 1 and why, then propose the application architecture: the framework, how the alarm will be made to ring with the phone locked and the app closed, how accounts and history will be stored, and how the affirmation, voice, and weather services will be connected. For each choice give me the reason and one alternative you rejected. Ask me one question at a time if anything in the documents is unclear. When I approve, record the decisions in docs/TECHNICAL-NOTES.md and docs/DECISIONS.md, commit, and then start build step 1 from PRD.md section 10.

## The working loop

Decide in the documents → build in the repo with Claude Code → test on the phone → write what you learned into `SELF-TEST.md` and `DECISIONS.md` → update the documents → repeat.

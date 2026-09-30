# Integration test log: generate-affirmation (Claude)

Every test call of the affirmation function, in order. Written by scripts/test-affirmation.sh.

### Test 3: fallback (no Claude key added yet) — 2026-09-30 12:13

- Sent: `{"mood":"rough","note":"did not sleep well, exam at 9"}`
- Got back (1.4s): `{"source":"fallback","mood":"rough","affirmation":"Some mornings are heavy, and this sounds like one of them. You do not have to fix the whole day right now. Take the next small step, then the one after that. That is enough for today.","reason":"no_key"}`

### Attempt (key saved under the wrong box, still fallback): mood rough, with a note — 2026-09-30 12:20

- Sent: `{"mood":"rough","note":"did not sleep well, exam at 9"}`
- Got back (1.2s): `{"source":"fallback","mood":"rough","affirmation":"Some mornings are heavy, and this sounds like one of them. You do not have to fix the whole day right now. Take the next small step, then the one after that. That is enough for today.","reason":"no_key"}`

### Attempt (key saved under the wrong box, still fallback): mood great, no note — 2026-09-30 12:21

- Sent: `{"mood":"great"}`
- Got back (0.9s): `{"source":"fallback","mood":"great","affirmation":"What a way to start the day. Put that energy somewhere it counts. Share a little of it with someone who needs it.","reason":"no_key"}`

### Test 1: mood rough, with a note — 2026-09-30 12:34

- Sent: `{"mood":"rough","note":"did not sleep well, exam at 9"}`
- Got back (6.0s): `{"source":"claude","mood":"rough","affirmation":"A short night before an early exam is a rough start, and you're allowed to feel it. Your knowledge did not leave you overnight; it's still there, waiting for the first question. Get something to eat, move slowly, and let the room settle around you. Answer what you know first, and the rest will come easier than you expect."}`

### Test 2: mood great, no note — 2026-09-30 12:34

- Sent: `{"mood":"great"}`
- Got back (8.2s): `{"source":"claude","mood":"great","affirmation":"You woke up feeling good, and that's worth using. Pick the thing you've been circling for days and start it now, while the energy is here. Move at your own pace, but move. Mornings like this don't need much from you beyond showing up."}`


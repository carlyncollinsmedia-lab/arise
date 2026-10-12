# Arise Demo Day: speaker notes

## 1. cover

Good morning. My name is Uche Azuike and this is Arise. I'll cover three things you're grading: the problem, the solution design, and the working Android APK, which I'll demo live.

## 2. problem

Most of us pick up our phone within minutes of waking. I do: I wake at six, and I'm on my phone straight away. Whatever shows up sets the mood for the day, and none of us chose it. That's the problem Arise solves.

## 3. survey-wake

Before building anything, I ran a survey called Your Mornings. 18 people answered, and the survey never mentioned Arise, so the answers weren't biased. 13 of 18 wake between 5 and 6:30, the exact window Arise is built for.

## 4. survey-mind

Half the people, 9 of 18, said their first thought is their to-do list. And the most common answer to how you feel was "it depends on the day". So Arise asks your mood every morning instead of assuming it, and gives you a one-line intention for the day.

## 5. survey-habits

15 of 18 pray or meditate before leaving. 11 choose an outfit and 6 check the weather. 11 have tried affirmations and 10 have tried a new alarm app. So every part of Arise answers something people already do.

## 6. survey-fail

The reasons routines failed were "it got repetitive", "I kept forgetting" and "I lost motivation". So: the words change every day, the alarm starts the routine so you can't forget it, and the whole thing takes two minutes or less.

## 7. design

Here's the design. The alarm rings, the companion greets you, you tap your mood, you get a pep talk for that mood, and you see the weather and what to wear. All under two minutes. During the day there's an intention and reminders, in the evening a short check-in, and History shows your week.

## 8. screens1

These are real screenshots, taken last night. Home greets me by name, one tap for my mood, and then a pep talk written for that mood, which it can read out loud.

## 9. screens2

Last night it was 0 degrees in Calgary, so the companion is in a winter coat and the app says dress for winter, no umbrella needed. The weather tab has the next 24 hours and 7 days. And Get support is always one tap away, with the right help line for your country.

## 10. alarm-proof

The alarm is the riskiest part. If it fails once, the user is gone. So I tested it before building anything else. On iPhone it passed four tests: locked, after a restart, in airplane mode and on Do Not Disturb. On my Samsung it rang on the minute and opened the full-screen alarm. The full report is in the GitHub repo.

## 11. demo

Now the live demo. You're seeing my real phone screen. First I'll set a real alarm for one minute from now: Settings, test alarm. While we wait, I'll tap my mood and get my pep talk. When the alarm rings I'll show the full-screen alarm and press I'm up. Then the weather and History. If the alarm doesn't ring: it passed on this phone on 8 October and the iPhone version passed four tests. Move on.

## 12. built

I followed the course method: PRD first, then building with Claude Code. The design choice I'm proudest of: your moods and notes stay on your own phone. The server only keeps your sign-in email, whether you pay, and a count of AI uses. The Claude key stays on the server, never inside the app.

## 13. proof-build

The course asks for version history, so every working step is its own commit: 67 so far. The tests have real results: the Claude pep talk answered in 6 and 8 seconds, the Stripe test payment created a real subscription record, and all 10 database tables are locked so people only see their own rows. While making these slides I even found a bug, where the website's History lost free users' mornings, and fixed it the same night.

## 14. safety

Someone will eventually type something serious into a mood app. Arise says plainly it is not therapy. If a note sounds like a crisis, it skips the pep talk and shows a help line for your country. The AI is never allowed to make up a phone number. And your feelings stay on your phone.

## 15. plus

Arise is free to start. Arise Plus is 4.99 Canadian a month and pays for the AI: a pep talk written by Claude each morning and a faith quote, since 15 of 18 people in my survey pray or meditate. Payments go through Stripe in test mode, and my test purchase worked.

## 16. next

Phase 1 is done: the Android APK, the tested iPhone alarm, the live web app and Arise Plus in test mode. Phase 2: Google Play and the App Store, and Rhapsody of Realities for Christian users in Plus. I haven't spoken to Christ Embassy yet, so I'll ask LoveWorld for permission; until then a button opens the official Rhapsody app, and nothing is copied. Also a lock-screen widget. Phase 3 grows Plus: the AI speaks your pep talk in your own language, like Igbo, Yoruba, Hausa or French, a companion that talks with a real voice, and sending a morning to a friend.

## 17. thanks

Thank you. I'm happy to take questions. The prep page has short answers to the likely ones: did you write the code, what if the AI says something harmful, where is the data stored, and why it isn't in the stores yet.

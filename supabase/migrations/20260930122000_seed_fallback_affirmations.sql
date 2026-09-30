-- Reviewed fallback pep talks, one per mood, the same text the generate-affirmation
-- function returns on failure. Clearly generic: they never pretend to have read the note.
insert into public.fallback_affirmations (mood, text) values
  ('rough', 'Some mornings are heavy, and this sounds like one of them. You do not have to fix the whole day right now. Take the next small step, then the one after that. That is enough for today.'),
  ('low',   'It is okay to start slowly. You showed up and checked in, and that counts. Be as kind to yourself this morning as you would be to a friend.'),
  ('okay',  'An okay morning is a steady place to start. Pick one thing that matters today and give it your best attention. Let the rest take care of itself.'),
  ('good',  'You are starting from a good place today. Carry that energy into the first thing you do. Notice what is going right and let it build.'),
  ('great', 'What a way to start the day. Put that energy somewhere it counts. Share a little of it with someone who needs it.');

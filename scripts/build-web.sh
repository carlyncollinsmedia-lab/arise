#!/bin/sh
# Builds the web version of Arise into dist/ for Netlify.
# Only the customer-facing pages and their pictures go out; docs, design.html
# (Lesson 6 design sheet), the phone app and
# database files stay in the repo.
# The Claude key never ships: the page only gets the address of the
# generate-affirmation function and Supabase's public (publishable) key.
# Where those come from, in order:
#   1. Netlify environment variables ARISE_AFFIRMATION_URL and ARISE_ANON_KEY
#   2. the local, gitignored config.local.js
#   3. neither: the page still works with its built-in reviewed affirmations
set -e
cd "$(dirname "$0")/.."
rm -rf dist
mkdir -p dist/assets/companions
cp index.html reminders.html manifest.webmanifest sw.js dist/
cp -R assets/icons dist/assets/
cp -R assets/companions/web dist/assets/companions/
find dist -name '._*' -delete

if [ -n "$ARISE_AFFIRMATION_URL" ] && [ -n "$ARISE_ANON_KEY" ]; then
  printf 'window.ARISE_CONFIG = { affirmationUrl: "%s", anonKey: "%s" };\n' \
    "$ARISE_AFFIRMATION_URL" "$ARISE_ANON_KEY" > dist/config.local.js
  echo "build-web: live Claude pep talks ON (from environment)"
elif [ -f config.local.js ]; then
  cp config.local.js dist/
  echo "build-web: live Claude pep talks ON (from config.local.js)"
else
  echo "// No live AI configured; the page uses its built-in affirmations." > dist/config.local.js
  echo "build-web: live Claude pep talks OFF (built-in affirmations only)"
fi

#!/bin/bash
# Calls the generate-affirmation function and appends the result to
# docs/integration-test-log.md. Usage: scripts/test-affirmation.sh "<label>" '<json body>'
set -e
cd "$(dirname "$0")/.."
source .env.local
LABEL="$1"; BODY="$2"
START=$(python3 -c 'import time;print(time.time())')
OUT=$(curl -s -X POST "$SUPABASE_URL/functions/v1/generate-affirmation" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" -H "Content-Type: application/json" -d "$BODY")
SECS=$(python3 -c "import time;print(round(time.time()-$START,1))")
echo "$OUT"
{ echo "### $LABEL — $(date '+%Y-%m-%d %H:%M')"; echo; echo "- Sent: \`$BODY\`"; echo "- Got back (${SECS}s): \`$OUT\`"; echo; } >> docs/integration-test-log.md

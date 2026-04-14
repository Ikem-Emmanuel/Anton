#!/bin/bash
set -euo pipefail

# Reads SLACK_BOT_TOKEN from environment or prompts for it.
# Usage:
#   SLACK_BOT_TOKEN=... bash scripts/slack-setup.sh
#   Or just run it and paste when prompted.

TOKEN="${SLACK_BOT_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  if [ -t 0 ]; then
    echo "Enter your Slack Bot Token:"
    read -r TOKEN
  else
    read -r TOKEN
  fi
fi

if [ -z "$TOKEN" ]; then
  echo "Error: No token provided"
  exit 1
fi

echo "Testing connection..."
RESULT=$(curl -s -X POST https://slack.com/api/auth.test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if echo "$RESULT" | grep -q '"ok":true'; then
  BOT_NAME=$(echo "$RESULT" | grep -o '"user":"[^"]*"' | cut -d'"' -f4)
  TEAM=$(echo "$RESULT" | grep -o '"team":"[^"]*"' | cut -d'"' -f4)
  echo "Connected as: $BOT_NAME @ $TEAM"
else
  echo "Connection failed: $RESULT"
  exit 1
fi

CHANNELS=(
  "anton-standup"
  "anton-sprint-updates"
  "anton-blockers"
  "anton-cross-dept"
  "anton-engineering"
  "anton-pull-requests"
  "anton-qa-results"
  "anton-deployments"
  "anton-marketing"
  "anton-seo"
  "anton-data"
  "anton-automation"
  "anton-growth"
  "anton-feature-requests"
)

echo ""
echo "Creating 14 channels..."
CHANNEL_MAP=""

for CH in "${CHANNELS[@]}"; do
  RESULT=$(curl -s -X POST https://slack.com/api/conversations.create \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$CH\",\"is_private\":false}")

  if echo "$RESULT" | grep -q '"ok":true'; then
    ID=$(echo "$RESULT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "  Created #$CH -> $ID"
    CHANNEL_MAP="${CHANNEL_MAP}${CH}=${ID}\n"
  elif echo "$RESULT" | grep -q 'name_taken'; then
    # Already exists — find and join it
    LIST=$(curl -s "https://slack.com/api/conversations.list?limit=200" \
      -H "Authorization: Bearer $TOKEN")
    ID=$(echo "$LIST" | grep -o "\"id\":\"[^\"]*\",\"[^\"]*\":\"[^\"]*\",\"[^\"]*\":\"[^\"]*\",\"[^\"]*\":\"[^\"]*\",\"name\":\"$CH\"" | head -1 | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    if [ -z "$ID" ]; then
      # Simpler extraction
      ID=$(echo "$LIST" | python3 -c "
import sys,json
data=json.load(sys.stdin)
for c in data.get('channels',[]):
    if c['name']=='$CH':
        print(c['id'])
        break
" 2>/dev/null || echo "")
    fi
    if [ -n "$ID" ]; then
      curl -s -X POST https://slack.com/api/conversations.join \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"channel\":\"$ID\"}" > /dev/null
      echo "  Exists #$CH -> $ID (joined)"
      CHANNEL_MAP="${CHANNEL_MAP}${CH}=${ID}\n"
    else
      echo "  Warning: #$CH exists but could not get ID"
    fi
  else
    ERROR=$(echo "$RESULT" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo "  Failed #$CH: $ERROR"
  fi
done

# Save channel map (no secrets in this file)
printf "%b" "$CHANNEL_MAP" | grep -v '^$' > slack-channels.env
echo ""
echo "Channel map saved to slack-channels.env"

# Post welcome message to engineering channel
ENG_ID=$(grep "anton-engineering" slack-channels.env 2>/dev/null | cut -d= -f2)
if [ -n "$ENG_ID" ]; then
  curl -s -X POST https://slack.com/api/chat.postMessage \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"channel\":\"$ENG_ID\",\"text\":\"Anton AI Org is online. 26 agents across 6 departments ready. Type here to direct the engineering team.\"}" > /dev/null
  echo "Welcome message posted to #anton-engineering"
fi

echo ""
echo "========================================="
echo "DONE. Next steps:"
echo "  1. Add SLACK_BOT_TOKEN to your secrets manager (SOPS)"
echo "  2. Source it in your shell profile"
echo "  3. Channels are ready for agent posting"
echo "========================================="

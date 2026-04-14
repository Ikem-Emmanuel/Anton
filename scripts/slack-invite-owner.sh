#!/bin/bash
set -euo pipefail

# Invites the workspace owner to all anton-* channels.
# Usage: bash .anton/scripts/slack-invite-owner.sh
# Requires SLACK_BOT_TOKEN in environment or .anton/.env

if [ -z "${SLACK_BOT_TOKEN:-}" ]; then
  [ -f ".anton/.env" ] && source .anton/.env
fi

if [ -z "${SLACK_BOT_TOKEN:-}" ]; then
  echo "Error: SLACK_BOT_TOKEN not set"
  exit 1
fi

# Find the workspace owner (first non-bot, non-slackbot user)
echo "Finding workspace owner..."
USER_ID=$(curl -s "https://slack.com/api/users.list?limit=20" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
for u in data.get('members', []):
    if not u.get('is_bot') and not u.get('deleted') and u.get('id') != 'USLACKBOT':
        print(u['id'])
        break
")

if [ -z "$USER_ID" ]; then
  echo "Error: Could not find workspace owner"
  exit 1
fi

echo "Found user: $USER_ID"
echo ""
echo "Inviting to all channels..."

while IFS='=' read -r NAME ID; do
  [ -z "$NAME" ] && continue
  RESULT=$(curl -s -X POST https://slack.com/api/conversations.invite \
    -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"channel\":\"$ID\",\"users\":\"$USER_ID\"}")

  if echo "$RESULT" | grep -q '"ok":true'; then
    echo "  Invited to #$NAME"
  elif echo "$RESULT" | grep -q 'already_in_channel'; then
    echo "  Already in #$NAME"
  else
    ERROR=$(echo "$RESULT" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo "  Failed #$NAME: $ERROR"
  fi
done < .anton/slack-channels.env

echo ""
echo "Done! Check your Slack sidebar — all channels should appear."

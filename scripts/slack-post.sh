#!/bin/bash
# Post a message to a Slack channel.
# Usage: bash scripts/slack-post.sh <channel-name> "message"
# Example: bash scripts/slack-post.sh anton-engineering "[Backend] Starting: health endpoint"
#
# Requires SLACK_BOT_TOKEN in environment.

set -euo pipefail

CHANNEL_NAME="${1:-}"
MESSAGE="${2:-}"
CHANNEL_MAP="slack-channels.env"

if [ -z "$CHANNEL_NAME" ] || [ -z "$MESSAGE" ]; then
  echo "Usage: slack-post.sh <channel-name> \"message\""
  echo "Channels: $(cut -d= -f1 "$CHANNEL_MAP" | tr '\n' ', ')"
  exit 1
fi

if [ -z "${SLACK_BOT_TOKEN:-}" ]; then
  [ -f ".env" ] && source .env
  if [ -z "${SLACK_BOT_TOKEN:-}" ]; then
    echo "Error: SLACK_BOT_TOKEN not set"
    exit 1
  fi
fi

CHANNEL_ID=$(grep "^${CHANNEL_NAME}=" "$CHANNEL_MAP" 2>/dev/null | cut -d= -f2)
if [ -z "$CHANNEL_ID" ]; then
  echo "Error: Channel '$CHANNEL_NAME' not found in $CHANNEL_MAP"
  exit 1
fi

RESPONSE=$(curl -s -X POST https://slack.com/api/chat.postMessage \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"channel\":\"$CHANNEL_ID\",\"text\":$(echo "$MESSAGE" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read().strip()))')}")

if echo "$RESPONSE" | grep -q '"ok":true'; then
  exit 0
else
  echo "Slack post failed: $RESPONSE" >&2
  exit 1
fi

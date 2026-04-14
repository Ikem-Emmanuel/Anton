#!/bin/bash
# Read recent messages from a Slack channel.
# Usage: bash scripts/slack-read.sh <channel-name> [count]
# Example: bash scripts/slack-read.sh anton-engineering 5
#
# Requires SLACK_BOT_TOKEN in environment.

set -euo pipefail

CHANNEL_NAME="${1:-}"
LIMIT="${2:-5}"
CHANNEL_MAP="slack-channels.env"

if [ -z "$CHANNEL_NAME" ]; then
  echo "Usage: slack-read.sh <channel-name> [count]"
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
  echo "Error: Channel '$CHANNEL_NAME' not found"
  exit 1
fi

curl -s "https://slack.com/api/conversations.history?channel=${CHANNEL_ID}&limit=${LIMIT}" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" | \
  python3 -c "
import sys, json, datetime
data = json.load(sys.stdin)
if not data.get('ok'):
    print('Error:', data.get('error'))
    sys.exit(1)
for msg in reversed(data.get('messages', [])):
    ts = datetime.datetime.fromtimestamp(float(msg['ts'])).strftime('%H:%M')
    user = msg.get('user', msg.get('bot_id', 'unknown'))
    text = msg.get('text', '')
    print(f'[{ts}] {text}')
"

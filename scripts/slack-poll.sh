#!/bin/bash
# Poll a Slack channel for new commands directed at agents.
# Writes new commands to data/inbox/
# Usage: bash scripts/slack-poll.sh [channel-name]
# Default: polls anton-engineering
#
# Requires SLACK_BOT_TOKEN in environment.

set -euo pipefail

CHANNEL_NAME="${1:-anton-engineering}"
CHANNEL_MAP="slack-channels.env"
INBOX="data/inbox"
LAST_TS_FILE="data/inbox/.last-ts-${CHANNEL_NAME}"

mkdir -p "$INBOX"

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

# Get last seen timestamp
OLDEST=""
if [ -f "$LAST_TS_FILE" ]; then
  OLDEST="&oldest=$(cat "$LAST_TS_FILE")"
fi

# Fetch messages
RESULT=$(curl -s "https://slack.com/api/conversations.history?channel=${CHANNEL_ID}&limit=20${OLDEST}" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN")

# Parse and save new human messages (skip bot messages)
python3 -c "
import sys, json, os

data = json.load(sys.stdin)
if not data.get('ok'):
    sys.exit(0)

messages = data.get('messages', [])
inbox = '$INBOX'
last_ts_file = '$LAST_TS_FILE'
channel = '$CHANNEL_NAME'
new_count = 0
latest_ts = ''

for msg in reversed(messages):
    # Skip bot messages — only human commands
    if msg.get('bot_id') or msg.get('subtype'):
        continue

    ts = msg['ts']
    text = msg.get('text', '').strip()
    user = msg.get('user', 'unknown')

    if not text:
        continue

    # Write command to inbox
    filename = f'{inbox}/{ts}-{channel}.md'
    if not os.path.exists(filename):
        with open(filename, 'w') as f:
            f.write(f'---\n')
            f.write(f'from: {user}\n')
            f.write(f'channel: {channel}\n')
            f.write(f'timestamp: {ts}\n')
            f.write(f'status: pending\n')
            f.write(f'---\n\n')
            f.write(text + '\n')
        new_count += 1

    latest_ts = ts

if latest_ts:
    with open(last_ts_file, 'w') as f:
        f.write(latest_ts)

if new_count > 0:
    print(f'{new_count} new command(s) from #{channel}')
" <<< "$RESULT"

#!/bin/bash
set -euo pipefail
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
cd "$(dirname "$0")/../" || { echo "Error: could not cd to repo root" >&2; exit 1; }

claude --model opus -p "
Create an agent team called 'marketing'.

Spawn these teammates:
1. A teammate named 'writer' using the mktg--content-writer agent type. Use Sonnet.
2. A teammate named 'social' using the mktg--social-media-manager agent type. Use Sonnet.
3. A teammate named 'email' using the mktg--email-marketing agent type. Use Sonnet.

Read from data/shared/engineering-to-marketing/ and data/shared/seo-to-marketing/.
Wait for all teammates to complete. When done, clean up the team.
"

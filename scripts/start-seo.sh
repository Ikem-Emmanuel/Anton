#!/bin/bash
set -euo pipefail
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
cd "$(dirname "$0")/../../" || { echo "Error: could not cd to repo root" >&2; exit 1; }

claude --model opus -p "
Create an agent team called 'seo'.

Spawn these teammates:
1. A teammate named 'content-seo' using the seo--content-seo agent type. Use Sonnet.
2. A teammate named 'analytics' using the seo--seo-analytics agent type. Use Haiku.

Write priority fixes to .anton/shared/seo-to-engineering/priority-fixes.md.
Write content briefs to .anton/shared/seo-to-marketing/content-briefs/.
Wait for all teammates. When done, clean up the team.
"

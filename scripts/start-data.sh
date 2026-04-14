#!/bin/bash
set -euo pipefail
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
cd "$(dirname "$0")/../../" || { echo "Error: could not cd to repo root" >&2; exit 1; }

claude --model opus -p "
Create an agent team called 'data'.

Spawn these teammates:
1. A teammate named 'analyst' using the data--data-analyst agent type. Use Haiku.
2. A teammate named 'ml' using the data--ml-engineer agent type. Use Sonnet.
3. A teammate named 'eng' using the data--data-engineer agent type. Use Sonnet.

Require plan approval for ml before model training.
Write insights to .anton/shared/data-to-all/.
Wait for all teammates. When done, clean up the team.
"

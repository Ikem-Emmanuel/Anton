#!/bin/bash
set -euo pipefail
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
cd "$(dirname "$0")/../" || { echo "Error: could not cd to repo root" >&2; exit 1; }

claude --model opus -p "
Create an agent team called 'automation'.

Spawn these teammates:
1. A teammate named 'workflows' using the auto--workflow-agent agent type. Use Sonnet.
2. A teammate named 'integrations' using the auto--integration-agent agent type. Use Sonnet.

Write status to data/shared/automation-to-all/.
Wait for all teammates. When done, clean up the team.
"

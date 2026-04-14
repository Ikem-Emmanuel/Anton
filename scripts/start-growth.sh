#!/bin/bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
cd "$(dirname "$0")/../../"

claude --model opus -p "
Create an agent team called 'growth'.

Spawn these teammates:
1. A teammate named 'tracking' using the growth--tracking-taxonomy-agent agent type. Use Sonnet.
2. A teammate named 'attribution' using the growth--attribution-agent agent type. Use Sonnet.
3. A teammate named 'experiments' using the growth--experimentation-agent agent type. Use Sonnet.
4. A teammate named 'campaigns' using the growth--campaign-segmentation-agent agent type. Use Sonnet.

Require plan approval for attribution and experiments before changes.
Have teammates share findings with each other.
Write reports to .anton/shared/growth-to-all/.
Wait for all teammates. When done, clean up the team.
"

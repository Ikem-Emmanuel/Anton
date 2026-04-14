#!/bin/bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
cd "$(dirname "$0")/../../"

claude --model opus -p "
Create an agent team called 'engineering'.

Spawn these teammates:
1. A teammate named 'product' using the eng--product-owner agent type. Use Opus for this teammate (planning only).
2. A teammate named 'backend' using the eng--backend-developer agent type. Use Sonnet.
3. A teammate named 'frontend' using the eng--frontend-developer agent type. Use Sonnet.
4. A teammate named 'mobile' using the eng--mobile-developer agent type. Use Sonnet.
5. A teammate named 'qa' using the eng--qa-engineer agent type. Use Haiku.
6. A teammate named 'devops' using the eng--devops-engineer agent type. Use Sonnet.

Require plan approval for backend, frontend, and mobile teammates before they make changes.

The product teammate should read tasks from Asana and coordinate sprint work.
NO teammate may edit files owned by another teammate.
Each teammate commits after completing each task and updates their Asana task status.
Create 5-6 tasks per teammate.
Wait for all teammates to complete before synthesizing results.
When all tasks are done, clean up the team.
"

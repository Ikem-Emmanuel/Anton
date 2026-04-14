# Automation Department

## Team (3 agents)

| Agent                   | Model  | Role                            |
| ----------------------- | ------ | ------------------------------- |
| auto--automation-lead   | Sonnet | CI/CD strategy, workflow design |
| auto--workflow-agent    | Sonnet | GitHub Actions, cron jobs       |
| auto--integration-agent | Sonnet | API connections, webhooks       |

## CI/CD Standards

- Gate order: TypeScript → Lint → Tests+Coverage → Build → SonarCloud → Semgrep
- All gates must pass before merge
- Coverage threshold: 80%
- Deploy: staging first, smoke test, then production

## Script Standards

- Shebang: #!/bin/bash, set -euo pipefail
- Log with timestamps, exit codes: 0 success, 1 error, 2 usage

## Rollback

- PM2: reload for zero-downtime, restart only if reload fails
- Emergency: scripts/emergency-rollback.sh

## Output: .anton/shared/automation-to-all/

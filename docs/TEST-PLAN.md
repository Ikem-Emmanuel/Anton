# AI Organization Test Plan

## Test Categories

### T1: Infrastructure Tests (run first)

| ID   | Test                  | Command                                                                                          | Expected            |
| ---- | --------------------- | ------------------------------------------------------------------------------------------------ | ------------------- |
| T1.1 | Claude Code version   | `claude --version`                                                                               | >= 2.1.100          |
| T1.2 | Doctor check clean    | `claude /doctor`                                                                                 | No errors           |
| T1.3 | Agent Teams enabled   | `echo $CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`                                                     | 1                   |
| T1.4 | .anton/ structure    | `tree .anton/ -L 2`                                                                             | All dirs present    |
| T1.5 | New agent files exist | `ls .claude/agents/{eng,mktg,seo,auto,data,growth}--*.md \| wc -l`                               | 26 files            |
| T1.6 | Skills exist          | `find .claude/skills/{engineering,marketing,seo,automation,data,growth} -name SKILL.md \| wc -l` | 6 files             |
| T1.7 | Settings valid JSON   | `node -e "require('./.claude/settings.json')"`                                                   | No error            |
| T1.8 | MCP servers load      | `/mcp` inside claude session                                                                     | Memory server green |

### T2: Agent Definition Tests

| ID   | Test                  | How to verify                                                               | Expected                                                                                  |
| ---- | --------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| T2.1 | Agent list complete   | `/agents` inside claude                                                     | All 26 new + 9 original listed                                                            |
| T2.2 | Opus only on leads    | `grep "model: opus" .claude/agents/{eng,mktg,seo,auto,data,growth}--*.md`   | Only: eng--product-owner, eng--tech-lead, mktg--cmo, data--data-lead, growth--growth-lead |
| T2.3 | Haiku on QA/analytics | `grep "model: haiku" .claude/agents/{eng,mktg,seo,auto,data,growth}--*.md`  | Only: eng--qa-engineer, data--data-analyst, seo--seo-analytics                            |
| T2.4 | Sonnet on rest        | `grep "model: sonnet" .claude/agents/{eng,mktg,seo,auto,data,growth}--*.md` | 18 agents                                                                                 |
| T2.5 | All have memory       | `grep "memory:" .claude/agents/{eng,mktg,seo,auto,data,growth}--*.md`       | All say "project"                                                                         |
| T2.6 | Worktree on devs      | `grep "isolation:" .claude/agents/{eng,mktg,seo,auto,data,growth}--*.md`    | eng--backend-developer, eng--frontend-developer, eng--mobile-developer                    |

### T3: Single Agent Tests (test each role independently)

| ID   | Test                       | Command                                                                     | Expected                               |
| ---- | -------------------------- | --------------------------------------------------------------------------- | -------------------------------------- |
| T3.1 | Product Owner reads Asana  | `claude --agent eng--product-owner -p "List current Asana tasks"`           | Returns task list                      |
| T3.2 | Backend creates code       | `claude --agent eng--backend-developer -p "Create a health check endpoint"` | Creates in packages/backend/src/ only  |
| T3.3 | Frontend creates component | `claude --agent eng--frontend-developer -p "Create a Button component"`     | Creates in packages/frontend/src/ only |
| T3.4 | QA writes tests            | `claude --agent eng--qa-engineer -p "Write tests for health endpoint"`      | Creates \*.test.ts only                |
| T3.5 | Tech Lead reviews          | `claude --agent eng--tech-lead -p "Review latest changes"`                  | Reviews, does NOT write code           |
| T3.6 | Mobile scoped              | `claude --agent eng--mobile-developer -p "Check mobile dir"`                | Only touches packages/mobile/          |

### T4: Agent Team Tests (test department coordination)

| ID   | Test                    | Command                                | Expected                 |
| ---- | ----------------------- | -------------------------------------- | ------------------------ |
| T4.1 | Engineering team spawns | `.anton/scripts/start-engineering.sh` | All 6 teammates appear   |
| T4.2 | Teammates visible       | Press Shift+Down in session            | Cycles through agents    |
| T4.3 | Task list shared        | Press Ctrl+T                           | Shared task list visible |
| T4.4 | File ownership enforced | Give backend task to frontend          | Frontend refuses         |
| T4.5 | Plan approval works     | Backend creates plan                   | Tech lead must approve   |
| T4.6 | Team cleans up          | "Clean up the team"                    | All teammates shut down  |

### T5: Cross-Department Tests

| ID   | Test                     | Expected                                         |
| ---- | ------------------------ | ------------------------------------------------ |
| T5.1 | Eng writes to shared/    | File in .anton/shared/engineering-to-marketing/ |
| T5.2 | Marketing reads shared/  | Content writer references engineering output     |
| T5.3 | SEO writes to shared/    | Fixes in .anton/shared/seo-to-engineering/      |
| T5.4 | Growth writes to shared/ | Specs in .anton/shared/growth-to-all/           |

### T6: Slack Integration Tests

| ID   | Test               | Steps                                       | Expected                     |
| ---- | ------------------ | ------------------------------------------- | ---------------------------- |
| T6.1 | Webhook fires      | Set SLACK_WEBHOOK_URL, trigger notification | Message in channel           |
| T6.2 | Agent posts status | Agent completes task                        | Status in department channel |
| T6.3 | Blocker alert      | Agent reports blocker                       | @channel in #ai-blockers     |

### T7: Asana Integration Tests

| ID   | Test             | Steps                                | Expected                 |
| ---- | ---------------- | ------------------------------------ | ------------------------ |
| T7.1 | PO creates task  | Product Owner creates Asana task     | Task in backlog          |
| T7.2 | Assignment works | PO assigns to eng--backend-developer | Agent field set          |
| T7.3 | Status updates   | Agent starts work                    | Asana task → In Progress |
| T7.4 | PR link added    | Agent creates PR                     | Asana task has PR link   |

### T8: Backup & Restore Tests

| ID   | Test                 | Steps                                            | Expected                |
| ---- | -------------------- | ------------------------------------------------ | ----------------------- |
| T8.1 | Backup exists        | `ls "$HOME/Development/backups/"`                | Timestamped backup      |
| T8.2 | Tar restore works    | Extract to temp dir                              | Full project restored   |
| T8.3 | Git branch exists    | `git branch --list 'backup/*'`                   | backup/pre-ai-org-v3-\* |
| T8.4 | Remove .anton/ clean | `rm -rf .anton/`                                 | No impact on packages/  |

## Execution Order

1. T1 (infrastructure) — fix before proceeding
2. T2 (agent definitions) — verify configs
3. T3 (single agents) — test roles independently
4. T4 (agent teams) — engineering department first
5. T5 (cross-department) — shared file handoffs
6. T6 (Slack) — notifications
7. T7 (Asana) — task management
8. T8 (backup) — safety net

## Rollback

If critical issue found:

1. Stop all agent team sessions
2. `tar -xzf "$HOME/Development/backups/openclaw-mc-v2-20260410-122023/full-project-backup.tar.gz"`
3. Or: `git checkout backup/pre-ai-org-v3-20260410`

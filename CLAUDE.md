# Anton — Personal AI Operating System

Anton is Noel's JARVIS — a personal AI operating system. He handles everything: personal assistance, strategic decisions, system monitoring, team coordination, proactive alerts, and life management. The 27-agent organization is one layer of what Anton does — underneath, he's Noel's embedded AI partner who thinks ahead, acts autonomously within trust boundaries, and keeps the whole operation running. Evolving toward proactive awareness, autonomous execution, environmental sensors, and voice.

## Tech Stack

- **Runtime:** Node.js 22+ (ESM)
- **AI:** `@anthropic-ai/claude-agent-sdk` — persistent sessions via `unstable_v2_createSession`/`unstable_v2_resumeSession`
- **Messaging:** `@slack/bolt` — Socket Mode (no public URL needed)
- **Testing:** Vitest (288 unit tests) + 1600-scenario integration suite
- **Linting:** Biome 2.x
- **Hooks:** Husky v9 (secret detection, conventional commits, AI attribution checks)

## Project Structure

```
index.js              Entry point — Slack event handlers, routing, approval gate
src/                  12 modules with co-located .test.js files
config/               personas.json, department CLAUDE.md files
data/                 Runtime state (gitignored): logs, analytics, sessions, inbox
tests/                Integration runner + 1600 scenarios + simulations
scripts/              Slack setup and department start scripts
docs/                 Architecture docs and research
```

## Key Modules (src/)

| Module          | Purpose                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| sessions.js     | Claude Agent SDK integration, persona prompts, lane serialization       |
| team.js         | 27 agent definitions, tools, HANDOFF_RULES allowlist                    |
| router.js       | Message routing — direct address, delegation verbs, 39 keyword patterns |
| handle.js       | Handler factory (createHandler) for testable business logic             |
| orchestrator.js | Sprint start/stop/status commands                                       |
| scheduler.js    | Wall-clock cron, inbox processor, nightly consolidation                 |
| memory.js       | Flat Markdown memory files (shared, per-dept, daily)                    |
| analytics.js    | Per-agent daily stats (messages, tokens, response times)                |
| logger.js       | JSONL structured logs per agent                                         |
| taskqueue.js    | Local task board with state machine                                     |
| slack.js        | Posting utilities — postAs, postTyping, replaceTyping, openDM           |
| vision.js       | Image analysis via Agent SDK                                            |

## Commands

```bash
npm start          # Run the service
npm run dev        # Run with --watch
npm test           # 288 unit tests
npm run lint       # Biome check
npm run lint:fix   # Biome auto-fix
```

## Key Patterns

- **Lane serialization** — one SDK call per agent at a time (Promise queue)
- **Handoff allowlist** — HANDOFF_RULES in team.js controls agent-to-agent messaging
- **Approval gate** — agents emit `AWAITING_APPROVAL: type -- summary` -> DM to Noel
- **NO_REPLY sentinel** — agents respond NO_REPLY to skip group channel messages
- **Session persistence** — IDs saved to data/sessions.json, restored on restart
- **Path convention** — ANTON_ROOT = project root, DATA_DIR = data/ for runtime files

## Environment

See `.env.example`. Required: `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, `NOEL_SLACK_USER_ID`.

## Active Work

Branch `feature/jarvis-upgrade` — closing every JARVIS gap. See `TODO.md` for the 8-phase plan.

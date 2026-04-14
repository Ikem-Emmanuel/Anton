# Anton JARVIS Upgrade — Master TODO

> Closing every gap between "a tab you have to open" and an embedded nervous system.
> Branch: `feature/jarvis-upgrade`
> Started: 2026-04-14

---

## Current State (What Already Exists)

- [x] 27-agent team with Slack integration
- [x] Scheduler (wall-clock cron, daily jobs, persisted to schedule.json)
- [x] Approval gate (text-based yes/no in DM)
- [x] Session health + retry/backoff (3 attempts, exponential)
- [x] Memory module + nightly consolidation
- [x] Cross-dept handoff rules (27 entries)
- [x] Analytics tracking per agent
- [x] Logger with structured output
- [x] Vision module (image analysis)
- [x] Orchestrator (team start/stop, sprint commands)
- [x] DM routing — all DMs go to Anton (PA) by default
- [x] NO_REPLY sentinel for group channel silence
- [x] Rate limiting per channel
- [x] Intent classification (system_command, approval, status, personal, task)
- [x] 1600-scenario test suite, 288 unit tests passing

---

## JARVIS Gap Analysis & Implementation Plan

### Phase 1: Proactive Awareness (Week 1)

> "JARVIS monitors without being asked. I wait for a message."

- [ ] **1.1 — Watcher module** (`service/src/watcher.js`)
  - [ ] PM2 health monitor — poll `pm2 list` every 60s, alert on crash/restart
  - [ ] Error log tailer — watch `logs/` for ERROR/FATAL, surface to Noel
  - [ ] Git activity watcher — poll for new commits/PRs on key repos
  - [ ] Disk/memory/CPU check — `os` module, alert on thresholds (>85%)
  - [ ] Asana webhook listener — new tasks, status changes, blockers
  - [ ] Integration with scheduler — register watchers as recurring jobs

- [ ] **1.2 — Morning briefing** (`service/src/briefing.js`)
  - [ ] Auto-trigger at configured time (default 8:30 AM)
  - [ ] Contents: overnight commits, open PRs, blocked tasks, system health, calendar
  - [ ] Post to Noel DM unprompted via `chat.postMessage`
  - [ ] Configurable sections via `schedule.json`

- [ ] **1.3 — Proactive Slack push**
  - [ ] `notifyNoel(severity, message)` function (P0/P1/P2/P3)
  - [ ] P0: immediate DM + Pushover mobile push
  - [ ] P1: immediate DM
  - [ ] P2: batch into hourly digest
  - [ ] P3: include in morning briefing only

---

### Phase 2: Real-Time Interrupts (Week 1-2)

> "He breaks in mid-conversation when something's urgent. I can't push to you unprompted."

- [ ] **2.1 — Push notification gateway**
  - [ ] Pushover integration for P0 alerts (phone buzz)
  - [ ] Slack DM for P1 (with `@` mention for notification)
  - [ ] Digest channel for P2/P3
  - [ ] Configurable quiet hours (no P1/P2 between 11pm-7am)

- [ ] **2.2 — Interrupt priority engine**
  - [ ] Service crash → P0
  - [ ] CI/CD failure on main → P0
  - [ ] PR approval needed (blocking deploy) → P1
  - [ ] Agent stuck/looping → P1
  - [ ] New Asana task assigned → P2
  - [ ] Daily metrics anomaly → P2
  - [ ] FYI updates → P3

- [ ] **2.3 — Event bus** (`service/src/eventbus.js`)
  - [ ] In-process pub/sub for decoupled alerts
  - [ ] Watchers emit events → interrupt engine evaluates priority → notify

---

### Phase 3: Three-Tier Trust Model (Week 2)

> "JARVIS acts, then reports. I ask first."
> Keeping: "I can't touch infrastructure without your sign-off" but with THREE options.

- [ ] **3.1 — Trust tier definitions** (`service/src/trust.js`)

  ```
  TIER 1 — AUTO (act, then report)
    - Restart a crashed PM2 process
    - Send a Slack message to a team channel
    - Create/update an Asana task
    - Run test suites
    - Generate reports/analytics
    - Respond in channels Anton is asked in
    - Merge a PR that passed ALL gates (tests, review, CI)

  TIER 2 — ANTON DECIDES (Anton evaluates, acts if confident, else escalates)
    - Deploy to staging
    - Create a new branch + PR
    - Install/update a non-breaking dependency
    - Schedule a meeting
    - Send external emails (non-sensitive)
    - Archive completed sprints

  TIER 3 — NOEL APPROVES (must get explicit human sign-off)
    - Deploy to production
    - Delete data / drop tables
    - Change permissions / access control
    - Force push / rewrite git history
    - Spend money (any amount)
    - Modify trust tier definitions
    - Disable monitoring / alerting
    - Access sensitive credentials
  ```

- [ ] **3.2 — Classification engine**
  - [ ] Rule-based tier lookup for known actions
  - [ ] LLM fallback for ambiguous actions (classify with reasoning)
  - [ ] Always default to highest tier when uncertain

- [ ] **3.3 — Upgrade approval UX**
  - [ ] Slack Block Kit buttons (Approve / Deny / Escalate)
  - [ ] Timeout escalation — no response in 15min → re-ping, 1hr → P0 push
  - [ ] Batch approvals — "approve all 3 pending" option
  - [ ] Approval context — show what will happen, what the rollback is

- [ ] **3.4 — Audit log** (`service/src/audit.js`)
  - [ ] SQLite table: timestamp, action, tier, agent, status, reasoning, outcome
  - [ ] Every autonomous action logged — even Tier 1
  - [ ] Weekly audit summary posted to Noel
  - [ ] Tamper detection (hash chain)

---

### Phase 4: Autonomous Execution (Week 2-3)

> "JARVIS acts, then reports. I ask first."

- [ ] **4.1 — Action executor** (`service/src/executor.js`)
  - [ ] Takes classified action + tier → executes or requests approval
  - [ ] Tier 1: execute immediately, post "Done: restarted X" to audit
  - [ ] Tier 2: Anton evaluates confidence → execute or escalate
  - [ ] Tier 3: queue approval, wait for response

- [ ] **4.2 — Infrastructure control module** (`service/src/infra.js`)
  - [ ] PM2 programmatic API — restart, scale, describe, logs
  - [ ] Git operations via simple-git — branch, commit, push, PR
  - [ ] GitHub API via octokit — PR status, merge, checks
  - [ ] All ops wrapped in trust tier checks

- [ ] **4.3 — Rollback system**
  - [ ] Checkpoint before every Tier 1/2 action
  - [ ] PM2: snapshot process state before restart
  - [ ] Git: save SHA before any push
  - [ ] Auto-rollback on failure (configurable)

- [ ] **4.4 — Standing orders**
  - [ ] Persistent rules: "always restart X if it crashes"
  - [ ] "If CI fails on main, notify me and revert"
  - [ ] Stored in `standing-orders.json`, editable via Slack command

---

### Phase 5: Environmental Sensors (Week 3)

> "He sees the room, reads vitals, tracks threats. I'm blind outside this chat."

- [ ] **5.1 — System sensors** (`service/src/sensors.js`)
  - [ ] macOS: battery, screen state, WiFi, active app (via osascript)
  - [ ] Calendar: next meeting time (CalDAV / macOS Calendar API)
  - [ ] Working hours detection: is Noel active or away?
  - [ ] Git: uncommitted changes, branch state across repos

- [ ] **5.2 — External event sources**
  - [ ] GitHub webhooks → PR reviews, CI status, security alerts
  - [ ] Asana webhooks → task updates, blockers
  - [ ] Email: Gmail API watch for important threads
  - [ ] Uptime monitor: HTTP pings for production services

- [ ] **5.3 — Context engine** (`service/src/context.js`)
  - [ ] Aggregate all sensor data into "current situation" object
  - [ ] Feed into morning briefing and agent prompts
  - [ ] "Anton, what's going on?" → full situational report

---

### Phase 6: Predictive Modeling (Week 3-4)

> "He anticipates what Tony needs before Tony knows. I'm reactive."

- [ ] **6.1 — Pattern learning** (`service/src/patterns.js`)
  - [ ] Track: time-of-day actions, day-of-week routines, post-event actions
  - [ ] "Noel always checks PRs at 10am" → pre-fetch PR summaries at 9:50
  - [ ] "After a deploy, Noel checks Sentry" → auto-pull error rates post-deploy
  - [ ] Store patterns in SQLite, re-evaluate weekly

- [ ] **6.2 — Proactive suggestions**
  - [ ] "You have 3 PRs waiting for review" (at predicted review time)
  - [ ] "Sprint ends Thursday, 2 tasks still in progress"
  - [ ] "Server memory trending up, may need attention by tomorrow"
  - [ ] Suggestions are P3 (in briefing) unless urgent

- [ ] **6.3 — Anomaly detection**
  - [ ] Baseline metrics: response times, error rates, deploy frequency
  - [ ] Alert on deviation: "Error rate 3x normal in last hour"
  - [ ] Simple statistical (moving average + stddev), not ML

---

### Phase 7: Voice Interface (Week 4)

> "JARVIS talks. I type."

- [ ] **7.1 — Text-to-Speech** (`service/src/voice.js`)
  - [ ] OpenAI TTS API integration (Nova or Alloy voice)
  - [ ] Stream audio to: macOS `afplay`, or web player
  - [ ] Option: ElevenLabs for custom Anton voice
  - [ ] Audio notifications for P0/P1 alerts

- [ ] **7.2 — Speech-to-Text**
  - [ ] OpenAI Whisper API for audio transcription
  - [ ] Capture via: macOS microphone (sox/rec), or web MediaRecorder
  - [ ] Voice command flow: record → transcribe → process as text → TTS response
  - [ ] Push-to-talk vs wake word (wake word is stretch goal)

- [ ] **7.3 — Voice delivery channel**
  - [ ] Option A: macOS menu bar app (Electron/Tauri) with mic + speaker
  - [ ] Option B: Web app (Next.js PWA) with WebSocket to Anton
  - [ ] Option C: Slack Huddle integration (if API supports it)
  - [ ] Start with Option A — most JARVIS-like experience

---

### Phase 8: Rich Interface (Week 4+)

> "3D interface — holographics. I have Slack."

- [ ] **8.1 — Slack App Home**
  - [ ] Dashboard tab: system health, active agents, recent actions
  - [ ] Quick actions: approve/deny queue, run commands
  - [ ] Uses Block Kit for rich formatting

- [ ] **8.2 — Web dashboard** (stretch)
  - [ ] Next.js dashboard app at localhost:3000
  - [ ] SSE stream from Anton for live updates
  - [ ] Agent activity timeline
  - [ ] System health gauges
  - [ ] Approval queue with one-click actions
  - [ ] Bridge to Mission Control v2.5 dashboard

- [ ] **8.3 — macOS integration** (stretch)
  - [ ] Menu bar icon with status
  - [ ] Native notifications via `terminal-notifier`
  - [ ] Touch Bar controls (if applicable)

---

## Migration TODO (from openclaw-mc-v2)

> Carried over from previous session.

- [x] Create /Users/EI/Development/anton/
- [x] Copy all .anton/ contents
- [x] Copy .claude/ folder
- [x] Initialize git repo
- [x] Create .gitignore
- [x] Initial commit
- [x] **Restructure project** — flattened service/ to root, created src/, config/, data/
- [x] **Fix path references in index.js** — ANTON_ROOT = \_\_dirname, DATA_DIR for runtime
- [x] **Update all src/\*.js files** — sessions, analytics, logger, scheduler, taskqueue, orchestrator, memory
- [x] **Fix simulations and test runner** — updated imports and paths
- [x] **Update ecosystem.config.cjs** — PM2 paths point to root
- [x] **Verify 576 unit tests pass** (was 288 — test count grew)
- [ ] **Create CLAUDE.md** for standalone project
- [ ] **Test npm run dev** from new location (needs Slack tokens)

---

## Patterns Adopted from Research (Hermes Agent, isair/jarvis, microsoft/JARVIS)

- [ ] **Auxiliary client** — use Haiku for side tasks (consolidation, summaries, analytics)
- [ ] **Memory injection scanning** — scan writes for prompt injection before storing
- [ ] **Error classification** — rate-limited vs context-overflow vs billing-exhausted, different recovery per type
- [ ] **Smart model routing** — simple queries (short, no code) route to Haiku per-turn
- [ ] **Tool result size budget** — oversized results stored to disk, agent gets preview + path
- [ ] **Session search (FTS5)** — SQLite full-text search across past conversations
- [ ] **Approval cooldowns** — session-scoped trust ("approve this type for 1 hour")
- [ ] **Haiku pre-router** (from isair/jarvis) — classify intent semantically before keyword matching
- [ ] **Task dependency graph** (from microsoft/JARVIS) — DAG for complex multi-agent requests
- [ ] **Agent capability registry** — structured JSON profiles per agent for semantic routing

---

## Reality Check — What's Not Happening

- Physical room awareness (camera, biometrics, temperature) — no hardware sensors, skip for now
- Voice through Slack — API can't play audio or capture mic, needs separate interface
- True Slack DND bypass — Pushover is the only path to real interrupts
- Full infrastructure control — each integration is manual, not general "fly the suit"
- Predictive anticipation without data — need monitoring running first
- Asana/GitHub/Gmail real-time webhooks — no public URL, use polling instead
- 3D holographic interface

---

## Priority Order (Revised)

```
Phase 1: Proactive Awareness    ← Anton sees without being asked
  ↓
Phase 2: Real-Time Interrupts   ← Anton reaches you when it matters (Pushover for P0)
  ↓
Phase 3: Three-Tier Trust       ← Anton acts, not just proposes
  ↓
Phase 4: Autonomous Execution   ← PM2 + git ops (not full infra)
  ↓
Phase 5: Environmental Sensors  ← macOS local sensors + API polling (no webhooks)
  ↓
Phase 6: Predictive Modeling    ← build after 2+ weeks of data from Phases 1-5
  ↓
Phase 7: Voice Interface        ← separate web/app interface, not Slack
  ↓
Phase 8: Rich Interface         ← stretch goals
```

---

## Progress Log

| Date       | What                                                   | Phase     |
| ---------- | ------------------------------------------------------ | --------- |
| 2026-04-14 | Initial commit on main, branch created                 | Setup     |
| 2026-04-14 | Cross-dept handoffs expanded (27 entries)              | Pre-work  |
| 2026-04-14 | Session health + retry/backoff                         | Pre-work  |
| 2026-04-14 | Memory module + nightly consolidation                  | Pre-work  |
| 2026-04-14 | DM routing to Anton, text-parse handoffs disabled      | Pre-work  |
| 2026-04-14 | TODO.md created with full JARVIS gap plan              | Setup     |
| 2026-04-14 | Project restructured: service/ to root, data/, config/ | Migration |
| 2026-04-14 | All path refs updated, 288 tests passing               | Migration |
| 2026-04-14 | Research: jarvis-upgrade, agent-teams, hermes-agent    | Research  |
| 2026-04-14 | Husky v9, Biome, lint-staged, .claude/ cleanup         | Tooling   |
| 2026-04-14 | Dead code removed, classifyIntent deduplicated         | Cleanup   |
| 2026-04-14 | Reality check: honest assessment of achievable vs not  | Planning  |
|            |                                                        |           |

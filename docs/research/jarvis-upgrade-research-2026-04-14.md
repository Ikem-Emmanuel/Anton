# JARVIS Upgrade Research — 2026-04-14

> Parallel research across 4 agents. Findings synthesized below.

---

## What Already Exists in Anton

| Component                            | File                                        | Status |
| ------------------------------------ | ------------------------------------------- | ------ |
| 26-agent team definitions            | `service/src/team.js`                       | Built  |
| Slack socket mode (Bolt)             | `service/index.js`                          | Built  |
| Approval gate (text-based yes/no DM) | `service/index.js` lines 183-199            | Built  |
| Session management + retry/backoff   | `service/src/sessions.js`                   | Built  |
| Wall-clock scheduler                 | `service/src/scheduler.js`                  | Built  |
| Router (39 keyword patterns)         | `service/src/router.js`                     | Built  |
| Memory (flat Markdown)               | `service/src/memory.js`                     | Built  |
| Analytics per agent                  | `service/src/analytics.js`                  | Built  |
| Structured JSONL logger              | `service/src/logger.js`                     | Built  |
| Vision (image classification)        | `service/src/vision.js`                     | Built  |
| Sprint orchestrator                  | `service/src/orchestrator.js`               | Built  |
| Task queue / board                   | `service/src/taskqueue.js`                  | Built  |
| Inbox file processor (30s poll)      | `service/src/scheduler.js`                  | Built  |
| Nightly consolidation (23:30)        | `service/src/scheduler.js`                  | Built  |
| Proactive DM primitives              | `service/src/slack.js` (`openDM`, `postAs`) | Built  |

---

## Phase 1: Proactive Awareness

### How proactive Slack push works

Anton already has `openDM(client, userId)` + `postAs()` in `slack.js`. To push a proactive alert from any context (cron, file watcher, PM2 event):

```js
async function pushAlert(client, userId, text) {
  const dm = await openDM(client, userId);
  return client.chat.postMessage({ channel: dm, text });
}
```

**Key detail:** Passing a User ID directly as `channel` opens a DM with Slackbot, not the app. Must call `conversations.open` first — Anton already does this correctly.

### What's missing

`scheduler.js` fires jobs but has no reference to the Slack client. The solution: pass `client` into the job fn at registration time via closure in `index.js`:

```js
scheduleJob("morning-brief", 9, 0, () =>
  pushAlert(slackClient, NOEL_USER_ID, morningBriefText()),
);
```

### System monitoring

**PM2 real-time event bus** — catches crashes as they happen:

```js
import pm2 from "pm2";

pm2.connect(() => {
  pm2.launchBus((err, bus) => {
    bus.on("process:event", (data) => {
      if (data.event === "exit" || data.event === "restart") {
        pushAlert(
          client,
          userId,
          `PM2: \`${data.process.name}\` ${data.event}. Restarts: ${data.process.restart_time}`,
        );
      }
    });
  });
});
```

**System metrics** — `systeminformation` npm (zero native deps):

```js
import si from "systeminformation";

async function getSystemSnapshot() {
  const [load, mem, disk] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
  ]);
  return {
    cpuPercent: Math.round(load.currentLoad),
    memUsedPercent: Math.round((mem.used / mem.total) * 100),
    diskUsedPercent: Math.round(disk[0]?.use || 0),
  };
}
```

**Log tailing** — `tail` npm package:

```js
import { Tail } from "tail";
const errorLog = new Tail("/path/to/error.log", { follow: true });
errorLog.on("line", (line) => {
  if (/ERROR|FATAL/.test(line))
    pushAlert(client, userId, `Log: ${line.slice(0, 200)}`);
});
```

---

## Phase 2: Real-Time Interrupts

### Slack has no native urgency flag

Urgency is achieved through message composition:

| Level    | Mechanism                 | Effect               |
| -------- | ------------------------- | -------------------- |
| Info     | Channel post (no mention) | No notification      |
| Standard | DM to Noel                | Badge + notification |
| High     | DM with `<@U...>` mention | Forces notification  |
| Critical | DM + red attachment color | Visual urgency       |

```js
await client.chat.postMessage({
  channel: dm,
  attachments: [
    {
      color: "danger",
      title: "CRITICAL: Production is down",
      text: "PM2 reports 3 restarts in 60 seconds.",
    },
  ],
});
```

### Pushover for true emergencies

Priority 2 (emergency) repeats every N seconds until acknowledged:

```js
// POST to https://api.pushover.net/1/messages.json
{ token, user, message, title, priority: 2, retry: 60, expire: 3600, sound: 'siren' }
```

### Priority tiers

- P0: Pushover emergency + Slack DM (service down, production crash)
- P1: Slack DM with `<@U>` mention (PR blocking deploy, agent stuck)
- P2: Batch into hourly digest (new Asana task, metrics anomaly)
- P3: Include in morning briefing only (FYI updates)

---

## Phase 3: Three-Tier Trust Model

### Tier Definitions

```
TIER 1 — AUTO (act, then report)
  pm2:restart, pm2:status, slack:message:send, asana:task:create,
  git:branch:create, git:commit, git:pr:create, tests:run, logs:read

TIER 2 — ANTON DECIDES (evaluate criteria, act if met, else escalate)
  git:pr:merge (if all checks green + 1 approval + not to main),
  deploy:staging (if tests pass), pm2:scale (within limits)

TIER 3 — NOEL APPROVES (explicit human sign-off required)
  deploy:production, database:delete, git:force-push, permission:change,
  billing:change, secrets:rotate, env:variable:write
```

### Architecture

```
Action Request → Rule Engine (static map, handles 80%)
                     ↓ unknown?
                 LLM Classifier (Anton evaluates, defaults to Tier 3)
                     ↓
              TIER1 → Execute + Log
              TIER2 → Check criteria → Execute or Escalate
              TIER3 → Block Kit approval DM → Wait for Noel
```

### Integration with existing code

The `AWAITING_APPROVAL` sentinel in `handle.js` is already Tier 3. Wrap it with tier classification:

```js
const tier = classifyAction(approvalMatch[1].trim());
if (tier === "auto") {
  // Execute directly, log it
} else if (tier === "approval") {
  // Existing approval gate
} else {
  // Block and explain
}
```

### Tier 2 criteria (deterministic, NOT LLM-judged)

```js
'git:pr:merge': async (context) => {
  return pr.mergeable && pr.checks_passed && pr.approvals >= 1 && pr.base !== 'main';
},
'deploy:staging': async (context) => {
  return pipeline.tests_passed && pipeline.lint_passed;
},
```

---

## Phase 4: Autonomous Execution

### PM2 Programmatic API

```js
// Process status
pm2.list((err, list) => {
  for (const proc of list) {
    // proc.pm2_env.status — 'online' | 'errored' | 'stopped'
    // proc.pm2_env.restart_time
    // proc.monit.memory, proc.monit.cpu
  }
});

// Restart
pm2.restart("api-service", callback);

// Graceful reload (zero-downtime, cluster mode)
pm2.reload("api-service", callback);

// Scale
pm2.scale("api-service", 4, callback);
```

### Git operations via simple-git + octokit

```js
const git = simpleGit(repoPath);
await git.checkoutLocalBranch("feat/auto-fix");
await git.add(["src/handler.js"]);
await git.commit("fix: auto-fix by Anton");
await git.push("origin", "feat/auto-fix");

// Create PR via GitHub API
const pr = await octokit.rest.pulls.create({
  owner,
  repo,
  title,
  body,
  head,
  base,
});
```

**Safety:** Install pre-push hook blocking direct pushes to main. GitHub API branch protection as backup.

### Audit log — hash-chained SQLite

```sql
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_id TEXT NOT NULL UNIQUE,
  timestamp TEXT NOT NULL,
  agent TEXT NOT NULL,
  action_type TEXT NOT NULL,
  tier INTEGER NOT NULL,
  context TEXT NOT NULL,
  approval_status TEXT NOT NULL,
  reasoning TEXT,
  outcome TEXT,
  prev_hash TEXT NOT NULL,
  row_hash TEXT NOT NULL
);
```

Each row's hash = SHA-256(prev_hash + canonical(row_content)). Genesis row uses 'GENESIS' as prev_hash. Tamper detection via chain verification.

### Rollback patterns

- **PM2:** Capture pre-restart state, health-check after restart, auto-rollback on failure
- **Git:** `git.revert()` creates a revert commit (never force push), opens PR for the revert
- **Saga pattern:** Multi-step deploys register compensating transactions for each step, undo in reverse on failure

---

## Phase 5: Environmental Sensors

### macOS sensors available from Node.js

| Signal            | Method                     | Package                                       |
| ----------------- | -------------------------- | --------------------------------------------- |
| CPU/Memory/Disk   | `systeminformation`        | `si.currentLoad()`, `si.mem()`, `si.fsSize()` |
| Battery           | `systeminformation`        | `si.battery()`                                |
| WiFi SSID         | `systeminformation`        | `si.wifiConnections()`                        |
| Active app        | `osascript`                | AppleScript via `child_process.exec`          |
| Calendar events   | `osascript`                | AppleScript targeting Calendar.app            |
| Focus/DND mode    | `macos-notification-state` | npm package                                   |
| Screen lock       | `osascript` + `CGSession`  | AppleScript                                   |
| Bluetooth devices | `noble`                    | BLE scanning                                  |

### Context injection

Poll every 60s, inject as system prompt prefix on every `ask()` call:

```js
// [Battery: 42%, WiFi: HomeOffice, App: VS Code, Next meeting: standup in 23min, Focus: ON]
```

### External event sources

- **GitHub webhooks** — push, PR, CI status, security alerts
- **Asana webhooks** — task created/completed/updated (replaces current polling)
- **Gmail API watch** — Pub/Sub push notifications for new emails
- **Google Calendar push** — event change notifications

---

## Phase 6: Predictive Modeling

### Pattern learning

Track time-of-day actions, learn routines:

```js
// "Noel always checks PRs at 10am" → pre-fetch PR summaries at 9:50
// Store in memory/pattern-store.json, re-evaluate weekly
```

### Anomaly detection (statistical, not ML)

Rolling z-score over a 30-sample window:

```js
class RollingZScore {
  constructor(windowSize = 30) {
    this.window = [];
    this.windowSize = windowSize;
  }
  push(value) {
    this.window.push(value);
    if (this.window.length > this.windowSize) this.window.shift();
    if (this.window.length < 3) return null;
    const mean = this.window.reduce((a, b) => a + b, 0) / this.window.length;
    const std = Math.sqrt(
      this.window.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
        this.window.length,
    );
    return std === 0 ? null : (value - mean) / std;
  }
}
// Alert on |z| > 2.5 with 5-minute cooldown per metric
```

---

## Phase 7: Voice Interface

### TTS options

| Service           | Latency | Cost         | Quality                           |
| ----------------- | ------- | ------------ | --------------------------------- |
| macOS `say`       | Instant | Free         | Good (Neural voices on macOS 14+) |
| OpenAI TTS-1      | ~0.5s   | $15/1M chars | Very good                         |
| ElevenLabs Flash  | ~75ms   | $5-22/mo     | Best (custom voice cloning)       |
| Piper TTS (local) | ~1s     | Free         | Decent                            |

### STT options

| Service             | Latency    | Cost        | Quality          |
| ------------------- | ---------- | ----------- | ---------------- |
| Deepgram Nova-3     | <300ms     | $0.0077/min | Best (5.26% WER) |
| OpenAI Whisper API  | Batch only | $0.006/min  | Good (10.6% WER) |
| Whisper.cpp (local) | ~2s        | Free        | Good             |

### Minimum viable voice: $7/month

macOS `say` (free TTS) + Deepgram Nova-3 ($7/mo STT).

### Delivery channel

**Slack cannot play audio.** Need a separate interface:

1. **Local web page** (1-3 days) — `localhost:3000/voice.html`, MediaRecorder for mic, WebSocket to Anton
2. **Menu bar app** (3-5 days) — Electron `menubar` npm wrapping the web page
3. **Tauri app** (1-2 weeks) — smaller binary but more setup

### Voice architecture

```
Browser mic → MediaRecorder → WebSocket → Deepgram STT → transcript
  → inject into handle() as if Slack message
  → agent response → TTS API → audio back to browser
```

---

## Phase 8: Rich Interface

### Slack App Home

Block Kit dashboard tab — system health, active agents, approval queue. No new infrastructure, uses existing Bolt connection.

### Web dashboard (stretch)

Next.js at localhost:3000. SSE stream from Anton for live updates. Agent activity timeline, system health gauges, one-click approvals.

### macOS menu bar (stretch)

Electron `menubar` package — tray icon, floating window with web view. Always one click away.

---

## New Dependencies Needed

| Package                  | Purpose                             | Phase |
| ------------------------ | ----------------------------------- | ----- |
| `systeminformation`      | CPU/memory/disk/battery/WiFi        | 1, 5  |
| `tail`                   | Log file tailing                    | 1     |
| `chokidar`               | File system watching                | 1     |
| `pm2`                    | Programmatic process control        | 1, 4  |
| `better-sqlite3`         | Audit log database                  | 3     |
| `simple-git`             | Git automation                      | 4     |
| `@octokit/rest`          | GitHub API (PRs, branch protection) | 4     |
| `pushover-notifications` | Emergency phone alerts              | 2     |
| `@deepgram/sdk`          | Speech-to-text                      | 7     |
| `openai`                 | Text-to-speech                      | 7     |
| `ws`                     | WebSocket for voice interface       | 7     |
| `menubar`                | Electron tray app                   | 8     |

---

## Sources

### Slack

- [chat.postMessage](https://docs.slack.dev/reference/methods/chat.postMessage)
- [Block Kit](https://docs.slack.dev/reference/block-kit/blocks/)
- [Bolt for JS](https://github.com/slackapi/bolt-js)

### Monitoring

- [PM2 Programmatic API](https://pm2.io/docs/runtime/reference/pm2-programmatic/)
- [systeminformation](https://www.npmjs.com/package/systeminformation)
- [chokidar v4](https://github.com/paulmillr/chokidar)
- [node-tail](https://github.com/lucagrulla/node-tail)

### Trust & Security

- [LangChain human-in-the-loop](https://docs.langchain.com/oss/python/deepagents/human-in-the-loop)
- [Microsoft Agent Governance Toolkit](https://opensource.microsoft.com/blog/2026/04/02/introducing-the-agent-governance-toolkit-open-source-runtime-security-for-ai-agents/)
- [Tamper-evident audit logs with SHA-256 hash chains](https://dev.to/veritaschain/building-a-tamper-evident-audit-log-with-sha-256-hash-chains-zero-dependencies-h0b)
- [Saga pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga)

### Voice

- [OpenAI TTS](https://developers.openai.com/api/docs/guides/text-to-speech)
- [ElevenLabs streaming](https://elevenlabs.io/docs/api-reference/streaming)
- [Deepgram Nova-3](https://developers.deepgram.com/reference/speech-to-text/listen-streaming)
- [Whisper.cpp Node.js](https://github.com/ariym/whisper-node)

### Sensors

- [node-mac-permissions](https://github.com/codebytere/node-mac-permissions)
- [macos-notification-state](https://www.npmjs.com/package/macos-notification-state)
- [node-osascript](https://github.com/mikaelbr/node-osascript)

### Infrastructure

- [simple-git](https://github.com/steveukx/git-js)
- [octokit](https://github.com/octokit/octokit.js/)
- [Pushover API](https://pushover.net/api)

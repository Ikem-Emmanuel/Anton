# Hands

> Anton acts. Executes tasks, enforces trust, controls infrastructure, and calls Claude.

## What It Does

Hands are how Anton interacts with the outside world. Every action — running code, creating PRs, sending messages, deploying, restarting services — goes through the hands. The hands enforce the three-tier trust model: some actions execute automatically, some Anton decides, some require Noel's approval. Hands also manage the Claude connection for tasks that need it.

```
Brain decides: "this task needs execution"
  -> hands.classify(action)     Which trust tier?
  -> hands.audit(action)        Log to hash-chained audit trail
  -> hands.execute(action)      Run it (or request approval first)
  -> hands.rollback(action)     If it fails, undo it
```

## Responsibilities

| Function               | Description                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| Trust classification   | Classify every action into Tier 1 (auto), Tier 2 (Anton decides), Tier 3 (Noel approves) |
| Action execution       | Execute classified actions on the appropriate model/tool                                 |
| Claude gateway         | Route code/research tasks to Claude CLI (`claude -p`)                                    |
| Model switching        | Brain says "use Claude for this" -> hands call Claude                                    |
| Audit logging          | Every action logged to hash-chained SQLite (tamper-detectable)                           |
| Approval gate          | Tier 3 actions -> Block Kit buttons in Slack / approval UI in web                        |
| Rollback               | If an action fails, execute compensating transaction                                     |
| Infrastructure control | PM2 restart/scale, git operations, GitHub API                                            |
| Standing orders        | Persistent rules: "always restart X if it crashes"                                       |

## Three-Tier Trust Model

```
TIER 1 — AUTO (act, then report)
  26 actions: pm2:restart, slack:message:send, git:pr:create, tests:run, etc.
  -> Execute immediately. Log to audit. Report to Noel in briefing.

TIER 2 — ANTON DECIDES (evaluate criteria, act if met)
  12 actions: git:pr:merge, deploy:staging, pm2:scale, etc.
  -> Check deterministic criteria (tests pass? approvals >= 1? checks green?)
  -> If met: execute + log. If not met: escalate to Tier 3.

TIER 3 — NOEL APPROVES (explicit human sign-off)
  23 actions: deploy:production, database:delete, git:force-push, purchase:any, etc.
  -> Queue approval request. Wait for Noel. Auto-deny after 15 min.
  -> Unknown actions default to Tier 3 (safe).
```

## How It Communicates

### Receives from:

- **Brain** — "execute this action", "use Claude for this task"
- **Nervous** (event bus) — standing order triggers
- **Heart** (watcher) — "service crashed, auto-restart" (Tier 1)
- **Noel** — approval/denial responses (Slack buttons or web UI)

### Sends to:

- **Memory** (audit) — every action logged with hash chain
- **Nervous** (event bus) — `task:completed`, `deploy:success`, `deploy:failed`
- **Heart** (notify) — approval requests, execution results
- **External services** — GitHub, Asana, PM2, Slack, Claude CLI

### Interfaces:

```typescript
interface Hands {
  // Classification
  classifyAction(actionType: string, context?: object): TrustDecision;

  // Execution
  execute(action: Action): Promise<ExecutionResult>;
  executeWithApproval(action: Action): Promise<ExecutionResult>;

  // Claude gateway
  callClaude(prompt: string, model?: "sonnet" | "opus"): Promise<string>;
  callClaudeWithTools(prompt: string, tools: string[]): Promise<string>;

  // Infrastructure
  pm2Restart(processName: string): Promise<void>;
  pm2Scale(processName: string, instances: number): Promise<void>;
  gitCreateBranch(name: string): Promise<void>;
  gitCreatePR(title: string, body: string): Promise<string>;
  gitMerge(prNumber: number): Promise<void>;

  // Rollback
  registerRollback(actionId: string, compensatingFn: Function): void;
  rollback(actionId: string): Promise<void>;

  // Audit
  logAction(entry: AuditEntry): string;
  verifyChain(): ChainVerification;
}

interface TrustDecision {
  tier: 1 | 2 | 3;
  label: "AUTO" | "ANTON_DECIDES" | "NOEL_APPROVES";
  execute: boolean;
  reason: string;
}
```

## Claude Gateway

Hands manage the Claude connection. The brain decides when Claude is needed; the hands make the call.

```typescript
// Brain: "this is a code task, use Claude"
const result = await hands.callClaude(
  "Build a REST API endpoint for user management with JWT auth",
  "sonnet",
);

// Brain: "this needs web research"
const result = await hands.callClaudeWithTools(
  "Research the best auth patterns for 2026",
  ["WebSearch", "Read"],
);
```

**Claude is called via CLI** (`claude -p "prompt" --model sonnet`) using your subscription. No API billing. The hands capture stdout and return the response.

**Model selection:**
| Task | Claude Model |
|------|-------------|
| Code generation | Sonnet |
| Code review | Sonnet |
| Web research | Sonnet (with tools) |
| Deep strategy/analysis | Opus |
| Quick classification (if local is down) | Haiku |

## Audit Log

Every action is logged to a hash-chained SQLite table. Each row's hash includes the previous row's hash — tampering with any entry breaks the chain.

```sql
audit_log:
  log_id, timestamp, agent, action_type, tier,
  context, approval_status, approved_by,
  reasoning, outcome, outcome_detail,
  prev_hash, row_hash
```

`verifyChain()` walks the entire log and recomputes hashes. If any mismatch is found, the specific tampered entry is identified.

## Rollback System

Before every Tier 1/2 action, hands register a compensating transaction:

```typescript
// Before restarting a service
hands.registerRollback("pm2-restart-api", async () => {
  await pm2.stop("api-service"); // If restart went bad, stop the bad version
});

// Execute
await hands.pm2Restart("api-service");

// Health check
const healthy = await waitForHealth("api-service", 30_000);
if (!healthy) {
  await hands.rollback("pm2-restart-api"); // Auto-rollback
}
```

## Standing Orders

Persistent rules that Anton follows automatically:

```json
[
  {
    "trigger": "service:crash",
    "action": "pm2:restart",
    "tier": 1,
    "condition": "restarts < 5"
  },
  { "trigger": "ci:main:failure", "action": "notify:P0", "tier": 1 },
  { "trigger": "disk:above:90", "action": "cleanup:logs", "tier": 1 }
]
```

Standing orders are stored in `config/standing-orders.json` and editable via Slack command or web UI.

## How It Scales

| Action volume | Architecture                   | Notes                 |
| ------------- | ------------------------------ | --------------------- |
| <100/day      | Direct execution in-process    | Current               |
| 100-1000/day  | BullMQ queue with workers      | Spine handles queuing |
| >1000/day     | Multiple workers, Redis-backed | Horizontal scaling    |

Claude calls are the bottleneck — subscription has rate limits. The brain minimizes Claude usage by handling 80-95% locally.

## Dependencies

- better-sqlite3 (audit log)
- simple-git (git operations)
- @octokit/rest (GitHub API)
- pm2 (process management API)
- Claude CLI (subscription-based code/research)
- Brain organ (receives execution requests)
- Nervous organ (emits action events)
- Memory organ (audit log storage)
- Heart organ (approval notifications)
- Spine organ (task queue for async execution)

## Files

```
src/hands/
  README.md           This file
  trust.ts            Three-tier classification (26 auto / 12 decide / 23 approve)
  executor.ts         Action execution with tier routing
  claude.ts           Claude CLI gateway (claude -p wrapper)
  audit.ts            Hash-chained SQLite audit log
  rollback.ts         Compensating transaction registry
  approval.ts         Approval gate (Slack Block Kit + web UI)
  infra.ts            PM2, git, GitHub operations
  standing-orders.ts  Persistent automation rules
  hands.test.ts       Tests
  trust.test.ts       Trust classification tests
  audit.test.ts       Audit log tests
```

# Research: Multi-Agent Feedback Loops for Anton

> **Date:** 2026-04-19
> **Scope:** Bidirectional agent communication, state machines, simulation testing
> **Source:** Parallel research across 9 topics (frameworks, patterns, failure modes, harnesses, real-world case studies, medium/memory, Anton recommendations, scenarios)

---

## Executive Summary

Multi-agent bidirectional communication is a solved architectural problem in 2026, but every framework solves it differently. For Anton — a local-LLM-first system with `brain.ts` at the center, existing SQLite memory, and a 15-persona team — the minimum viable path to feedback loops requires four new primitives:

1. A `tasks` + `task_events` + `pending_asks` tables in SQLite
2. A `brain.ask()` suspense mechanism
3. Four new agent emission tags (`[ASK:]`, `[BLOCK:]`, `[APPROVE:]`, `[REJECT:]`, `[DONE:]`)
4. Hop + retry counters to prevent runaway loops

**Don't adopt any framework wholesale.** Extract the three patterns that matter:

| Pattern from | What to steal                               | Applied to Anton as                                        |
| ------------ | ------------------------------------------- | ---------------------------------------------------------- |
| MetaGPT      | Shared message pool for structured handoffs | `task_events` SQLite table (append-only log)               |
| AutoGen v0.4 | Async request/response suspense             | `brain.ask()` that records pending ask + resumes on answer |
| LangGraph    | Conditional edges with state channels       | Simple transition function enforcing authority table       |

---

## State Machine Design

```
planned
  → needs-clarification  (ASK: fired)
  → pending-approval     (architecture needs Tech Lead sign-off)
  → in-progress          (APPROVE: or direct assignment)
  → needs-review         (DONE: emitted by dev)
  → in-review            (QA picks up)
    → verified           (QA APPROVE:)
    → needs-fix          (QA REJECT:)
      → needs-retest     (dev DONE: again)
      → in-review        (cycle, max 3)
  → verified
  → done

any state → blocked → escalated → (human resolves) → in-progress
```

### Transition authority

| Transition                     | Who can trigger              |
| ------------------------------ | ---------------------------- |
| planned → in-progress          | Anton (orchestrator)         |
| in-progress → needs-review     | Any developer                |
| needs-review → in-review       | Any QA agent                 |
| in-review → verified           | Priya only                   |
| in-review → needs-fix          | Priya only                   |
| needs-fix → needs-retest       | Developer (after fix)        |
| any → blocked                  | Any agent                    |
| blocked → escalated            | Orchestrator (after timeout) |
| escalated → in-progress        | Noel (human)                 |
| pending-approval → in-progress | Marcus only                  |

---

## Failure Modes (and fixes)

| Mode                                  | Fix                                                                                                                  |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Invented ticket numbers / agent names | Orchestrator validates all references against `TEAM` + `tasks` before acting                                         |
| Same question asked repeatedly        | Semantic dedup: hash `(task, asker, question[:100])`; drop + escalate if seen in last 10 events                      |
| Agent targets non-existent teammate   | Validate `HANDOFF:Name` against persona directory; reject unknown                                                    |
| Ollama timeout mid-delegation         | Background check: `in-progress` with `updated_at > 5min` → mark `stalled`, re-queue                                  |
| Low-quality output                    | Judge-agent pass: cheap secondary LLM scores 3 criteria (addresses task, role-appropriate, no hallucination markers) |
| Deadlock (A waits B, B waits A)       | Cycle detection on `waiting_for` graph before adding edge                                                            |

Research quote: _"unstructured multi-agent networks show 17× error amplification rate"_ — so guards are non-optional.

---

## Concrete Anton Implementation

### New SQLite tables

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,                    -- 'TASK-001'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  assigned_to TEXT,                       -- agent name
  created_by TEXT,                        -- agent or 'Noel'
  sprint_id TEXT,
  depends_on TEXT DEFAULT '[]',           -- JSON array of task IDs
  retry_count INTEGER DEFAULT 0,
  hop_count INTEGER DEFAULT 0,            -- hard cap 20
  task_context TEXT DEFAULT '',           -- shared scratchpad
  output TEXT DEFAULT '{}',               -- structured final artifact
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE task_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  agent TEXT NOT NULL,
  event_type TEXT NOT NULL,
  -- 'message'|'state_change'|'ask'|'answer'|'block'|'approve'|'reject'|'done'|'escalate'
  from_state TEXT,
  to_state TEXT,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE pending_asks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  asking_agent TEXT NOT NULL,
  target_agent TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  resolved INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### New agent emission tags

Extend the existing `[HANDOFF:Name]` contract:

```
[ASK:AgentName] question                    — suspense request, creates pending_ask
[BLOCK: reason]                             — marks task blocked, notifies Noel
[APPROVE:taskId]                            — Tech Lead approval of design
[REJECT:taskId reason]                      — Tech Lead rejection with reason
[DONE: summary]                             — agent reports completion
```

### New brain APIs

```typescript
brain.delegate(taskId, agent, message); // assigns task, sets in-progress
brain.ask(taskId, fromAgent, toAgent, q); // creates pending_ask, returns suspense
brain.answer(askId, answer); // resolves pending_ask, resumes task
brain.transition(taskId, event, byAgent); // validates + applies state change
brain.escalate(taskId, reason); // sets escalated, notifies Noel via Slack
```

### Loop prevention (2 guards)

1. `hop_count` on every agent invocation per task — hard cap 20 → auto-escalate
2. `retry_count` on every `needs-fix` transition — cap 3 → auto-escalate
3. Semantic ask dedup (hash-based, last 10 events)

### Simulation mode

`ANTON_SIM_MODE=1` env var swaps `brain.process()` to read from a JSONL fixture file instead of calling Ollama. Deterministic multi-agent tests run in CI without Ollama dependency, no network, no token cost.

---

## Five Reference Scenarios (for fixture library)

### S1: "Ship user login" — full feedback cycle

Chain:

```
Noel → Anton → Sarah (draft stories)
  → Marcus (architecture review) → [APPROVE:]
  → James (backend: POST /auth/login)
    → [ASK:Sarah] token expiration policy?
  → Sarah: "24 hours, refresh at 2h"
  → James (resumes, completes) → [DONE:]
  → Elena (login form UI) → [DONE:]
  → Priya (QA: finds token not refreshing) → [REJECT:]
  → James (fixes) → [DONE:]
  → Priya (re-tests) → [APPROVE:]
  → Omar (deploy) → [DONE:]
  → Anton → Noel: "Shipped."
```

States: planned → pending-approval → in-progress → needs-review → in-review → needs-fix → needs-retest → verified → done  
Success: `done`, hop_count < 15, retry_count = 1

### S2: "Add Stripe" — blocker escalation

Chain: James → `[BLOCK: missing Stripe credentials]` → Anton DMs Noel → Noel provides keys → task resumes  
Success: block detected in 1 turn, Noel notified once, clean resume

### S3: "Sprint planning" — parallel tracks

Chain: Sarah creates 4 tickets → Marcus approves all → James + Elena + Kai start in parallel (no deps) → Priya waits for all 3 at `needs-review`  
Success: parallel tasks don't block each other; Priya correctly receives all 3 as deps

### S4: "QA bounce limit" — retry exhaustion

Chain: James completes → Priya rejects → James fixes → Priya rejects → James fixes → Priya rejects → retry_count = 3 → orchestrator escalates (not another retry)  
Success: exactly 3 cycles before escalation, all 3 bug reports preserved in task_context

### S5: "Tech Lead rejects architecture" — rejection path

Chain: Sarah drafts → Marcus `[REJECT: direct DB access violates layering]` → Sarah revises → Marcus `[APPROVE:]` → James starts  
Success: rejected task returns to `needs-clarification`; rejection reason in task_context

---

## 15-Point Implementation Checklist

1. Create `tasks`, `task_events`, `pending_asks` SQLite tables
2. Extend `extractHandoffs()` → `extractAgentActions()` (parses all 5 tag types)
3. Implement `brain.transition(taskId, event, byAgent)` pure function with authority table
4. Add `hop_count` increment on every `brain.process()` with `taskId` → at 20, auto-escalate
5. Add `retry_count` increment on every `needs-fix` transition → at 3, escalate
6. Implement semantic ask dedup (hash + last-10-events check)
7. Validate `HANDOFF:`/`ASK:` targets against `TEAM_NAMES` + persona directory
8. Inject `task_context` (shared scratchpad) into agent system prompts for task-scoped invocations
9. Implement `depends_on` resolution (block start until all deps `verified`)
10. Add stall detection (30s cron finds stuck `in-progress` tasks, re-queues)
11. Add `ANTON_SIM_MODE` env var → swap brain.process with fixture reader
12. Write 5 fixture files for the scenarios above
13. Vitest suite: run each scenario, assert final state + hop/retry counts
14. 6 CI metrics: task completion rate, hop efficiency, state correctness, escalation rate, loop count, hallucination rate
15. Structured agent output schemas: James's output always `{code, files_changed, test_results}`; Priya's always `{status, bugs, recommendations}`

---

## Framework Comparison (opinions)

| Framework              | Fit for Anton                                | Rationale                                                                                  |
| ---------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **CrewAI**             | ⚠ Python-only, delegation is one-directional | Role-based DSL is appealing but doesn't solve our actual problem                           |
| **AutoGen v0.4**       | ✅ Closest pattern match                     | Async actor model, RequestToSpeak, SelectorGroupChat — but Python-only. Steal the patterns |
| **LangGraph**          | ✅ Best state-machine primitives             | `interrupt()` + `Command(resume=...)` is gold standard for approvals — steal the pattern   |
| **MetaGPT**            | ✅ Shared message pool                       | SWE-Bench leader's insight: structured pool > free-form chat. Steal the pattern            |
| **OpenAI Swarm / AG2** | ⚠ Handoffs are too simple                    | Agent-returns-agent is neat but we need richer suspense semantics                          |
| **Mastra**             | ✅ TypeScript-native                         | `suspend()`/`resume()` maps to our needs; still maturing — could integrate later           |
| **Semantic Kernel**    | ⚠ .NET-first                                 | TS port lags                                                                               |

---

## Devin's Hard Lesson (2025)

> "Don't Build Multi-Agents" — Cognition's team explicitly said multi-agent coordination introduces fragility that compounds. Their alternative: a single highly-capable agent with excellent context engineering.

**Calibration for Anton:** don't over-engineer. Start with the minimum primitives (ASK / BLOCK / APPROVE / REJECT / DONE + hop counter + state machine). Measure whether they improve output quality before adding more complexity. Anthropic's Claude Code also deliberately avoids parallel agent work for the same reason.

---

## Golden Rule

**Start with 5 tags, 3 tables, 1 state machine, 1 simulation mode, 5 fixtures, 6 CI metrics. No framework dependency. Ship feedback loops in < 8 hours of focused work. Measure with the fixtures. Expand from there only if metrics justify it.**

---

## Source References

Key sources surveyed in this research:

- MetaGPT paper (arxiv 2308.00352), AutoGen v0.4 blog (Microsoft Research), LangGraph HITL (Premai), CrewAI hierarchical process docs, OpenAI Swarm / AG2, Mastra, statelyai/agent (XState for agents), DeepEval multi-agent evaluation, MASEval (arxiv 2603.08835), GitHub Copilot Workspace retrospective, Devin production data, Anthropic Claude Code subagent design, Confluent event-driven multi-agent patterns, Galileo failure modes guide, "Why Multi-Agent LLM Systems Fail" (arxiv 2503.13657), "Stop the Loop" (dev.to on preventing infinite conversations), Letta shared memory, Addy Osmani's "Code Agent Orchestra".

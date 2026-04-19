# Anton Brain V2.1 — Master TODO

> Local LLM as the operating system. Claude for heavy lifting. Anton as JARVIS.
> Timeline: 14 weeks (12 V2 + 2 Phase 2.5). Current: 16GB Mac. Target: Mac Studio 128GB.
> **Active branch:** `phase2/memory` — stabilize before continuing.

---

## 1. Reality Check (2026-04-18 audit)

### What's actually working

- V1 (Claude Agent SDK) 27-agent team with Slack + Web + notifications + briefings — fully operational
- V2 brain module exists at `src/brain/*` and is wired into Slack + web paths
- SQLite memory store at `src/memory/sqlite.ts` (WAL mode, FTS5, ACID) — functional
- Brain's `storeConversation()` and `buildMemoryContext()` are called per turn
- `data/brain/anton.db` populated (74KB, conversations + memories tables)
- 421 V1 tests + 5 V2 `extractResponse` tests passing
- Ollama bound to `127.0.0.1:11434` (CVE-2025-63389 mitigated)
- V1 code reorganized into organ folders (`src/brain/`, `src/memory/`, `src/nervous/`, `src/heart/`, `src/hands/`, `src/eyes/`, `src/spine/`)

### What's BROKEN in the current branch

- **`think: true` hardcoded** at `src/brain/brain.ts:128` → every message takes 15–60s even greetings
- **Dead classifier**: `src/brain/classifier.ts` is 147 lines, zero callers
- **Dead thinking controls**: `getThinkingDepth`, `buildThinkingPrompt`, `getMaxTokensForDepth` in `src/brain/thinking.ts` — never called
- **`[NEEDS_CLAUDE]` self-tagging** at `brain.ts:142` — non-deterministic Claude routing depends on Qwen3 output
- **No Ollama timeouts** — `ollamaConfig.timeout: 30_000` defined but never passed; a hung generation blocks Slack forever
- **Soft JSON mode** — `chatJSON` uses `format: 'json'`, not schema-constrained `format: <schema>`
- **Hardcoded `'local-fast'`** at `brain.ts:120` → `taskRouting` table never consulted → hardware upgrade won't auto-propagate
- **Handoff false positives** — NL fallback at `brain.ts:222` triggers on "let me check with Sarah"
- **Two memory systems**: V2 SQLite vs V1 `config/departments/*/MEMORY.md` — don't share
- **Voice drift**: local path uses `getAntonSystem()`; Claude fallback uses V1 `personas.json`
- **Regex still in index.js**: system cmds (`567`), schedule (`416`), approval (`357`), Sarah auto-dispatch (`380`)
- **`claudeConfig` dead** — CLI path promised, never invoked (SDK path used instead)
- **Tests**: only 5 unit tests cover the brain (`extractResponse` only); `tests/brain-e2e.md` is a checklist with zero assertions

### What's NOT started

- No circuit breaker / retry policy
- No Langfuse tracing
- No ChromaDB / LightRAG / Obsidian vault
- No `config/agents/` schemas
- No `src/hands/claude.ts` CLI fallback
- No proactive trigger loop
- No eval harness
- No web/mobile design
- No voice / finance / self-training

---

## 2. Revised Phase Plan

### Phase 0: Foundation — COMPLETE WITH GAPS

- [x] Install Ollama natively (`brew install --cask ollama`)
- [x] Pull models: `qwen3:8b`, `qwen2.5-coder:7b`, `nomic-embed-text`
- [x] Verify MLX backend (Ollama 0.20.7)
- [x] Init TypeScript project with Zod, tsx
- [x] `config/models.ts` with model routing config
- [x] Bind Ollama to localhost only (CVE-2025-63389 fix)
- [x] Organ system READMEs created
- [x] V1 code reorganized into organ folders — `src/brain/`, `src/memory/`, `src/nervous/`, `src/heart/`, `src/hands/`, `src/eyes/`, `src/spine/`
- [ ] Docker Compose: Redis, ChromaDB, Nginx, Langfuse — **deferred to Phase 5**
- [ ] `config/agents/` Zod schemas — **moved to Phase 3**
- [ ] Langfuse observability — **deferred to Phase 4**
- [ ] Obsidian vault — **moved to Phase 3**

### Phase 1: Brain Core + Routing — STRUCTURALLY DONE, BEHAVIORALLY BROKEN

- [x] `src/brain/ollama-client.ts` — functional HTTP wrapper
- [x] `src/brain/classifier.ts` — built (but DEAD CODE, no callers)
- [x] `src/brain/brain.ts` — single-pass architecture wired into Slack + web
- [x] Wire brain into web + Slack pipelines
- [x] Override prefixes `@claude` / `@local`
- [x] `thinking.ts` built (but DISCONNECTED)
- [x] Brain responds AS agents (personas.ts, 15 agents)
- [ ] **Stabilize in Phase 2.5 — see §3 below**

### Phase 2: Memory System — SQLite DONE, REST NOT STARTED

- [x] SQLite schema: memories, conversations, tasks, training_data (WAL mode)
- [x] `src/memory/sqlite.ts` with ACID transactions
- [x] FTS5 keyword search implemented
- [x] Memory injection wired into brain (`buildMemoryContext` called per turn)
- [ ] **Migrate existing V1 markdown memories to SQLite** — Phase 2.5
- [ ] **Auto-summarize after every conversation** — Phase 3
- [ ] **Cache Claude results** — Phase 3
- [ ] ChromaDB / RAG — **replaced with sqlite-vec in Phase 3 (cheaper)**
- [ ] LightRAG knowledge graph — **deferred to Phase 5 (overkill for single user)**
- [ ] Obsidian vault — Phase 3
- [ ] Vault file watcher — Phase 3
- [ ] Daily / weekly note generation — Phase 3
- [ ] Vault Git commits — Phase 3
- [ ] **Memory injection scanning / spotlighting** — Phase 2.5

---

## 3. Phase 2.5 — STABILIZE (NEXT 3–5 DAYS, ~20 hours)

> Goal: the brain _feels_ connected. Greetings in <3s. Deterministic Claude routing. One voice across paths. Branch PR-ready.

**Execute in this order. Every task references `docs/BRAIN-V2.1-PLAN.md`.**

### 3.1 Safety first — circuit breaker + timeouts (2 hrs)

- [ ] `npm install opossum`
- [ ] Wrap `chat()` in `src/brain/ollama-client.ts` with `AbortController` (10s min depth, 60s deep depth)
- [ ] Add opossum circuit breaker: open after 3 failures in 60s, half-open probe after 30s
- [ ] Catch circuit-open in `brain.ts` → fall through to Claude
- [ ] Add startup retry loop in `initBrain()` — Ollama takes 10-15s to warm after Mac wake

### 3.2 Make taskRouting live — one-line unlock (1 hr)

- [ ] Delete hardcoded `models['local-fast']` at `brain.ts:120`
- [ ] Lookup model via `taskRouting[logicalName]` based on classification
- [ ] Hardware upgrade now = edit `config/models.ts` only

### 3.3 Wire adaptive thinking — speed (2 hrs)

- [ ] Classify first (cheap pre-pass), then responder at computed depth
- [ ] `think: true` only for `detailed` / `deep`
- [ ] Pass `getMaxTokensForDepth(depth)` instead of hardcoded 2048
- [ ] Pass `getTemperatureForDepth(depth)`
- [ ] Target: greeting <3s, simple Q <6s, analysis <15s on Tier 1

### 3.4 Schema-constrained classifier — reliability (3 hrs)

- [ ] Add `schema?: object` param to `ChatOptions`
- [ ] Change `chatJSON` to pass `format: <schema>` when schema provided (Ollama 0.5+)
- [ ] `npm install zod-to-json-schema`
- [ ] In `classifier.ts`, pass `zodToJsonSchema(ClassificationSchema)` to chatJSON
- [ ] Remove the "moderate"/"medium" preprocessor hack (no longer needed)
- [ ] Restore classifier as first step in brain.process()

### 3.5 Deterministic pre-gate — skip LLM on obvious cases (2 hrs)

- [ ] New file `src/brain/pre-gate.ts`:
  - `@claude ` prefix → force Claude
  - `@local ` prefix → force local
  - ` ``` ` code block → `needsClaude: true`
  - token count > 400 → `needsClaude: true`
  - `^(yes|no|approve|deny|ok|👍|👎)` → intent: approval
  - `^(schedule|remind|at \d)` → intent: schedule
- [ ] Call pre-gate in `brain.ts` before classifier
- [ ] If pre-gate returns intent, skip classifier entirely

### 3.6 Delete handoff NL fallback (30 min)

- [ ] Remove `brain.ts:222-234` (natural-language delegation detection)
- [ ] Only accept explicit `[HANDOFF:Name]` tags
- [ ] Classifier already produces explicit `handoffs[]` when needed

### 3.7 Unified Claude fallback path (3 hrs)

- [ ] New file `src/brain/claude-fallback.ts` — one entry point for Claude calls
- [ ] Wraps either Anthropic SDK (current V1 path) OR `claude -p` CLI
- [ ] Uses SAME persona source as local path
- [ ] Every Claude response written to SQLite via `storeConversation()`
- [ ] `index.js` flow: brain.process() handles both cases internally; remove branch to `trackedAsk`

### 3.8 Eval harness — confidence (3 hrs)

- [ ] Convert `tests/brain-e2e.md` checklist into `tests/brain.eval.ts`
- [ ] 20 test cases minimum, assertable via `vitest`
- [ ] Cases: greeting, simple Q, code-block, long-input, explicit handoff, yes/no approval, schedule, research request
- [ ] Asserts: intent, needsClaude, handoffs, handledLocally, latency
- [ ] Add to `npm test`

### 3.9 Memory injection scanning + spotlighting (2 hrs)

- [ ] Wrap all external content in `<EXTERNAL_CONTENT>` tags before injection
- [ ] Strip `<|im_start|>`, `[SYSTEM]`, `</s>` and other system-marker tokens from retrieved memories
- [ ] Audit all `console.log()` calls in brain subsystem — remove content logging, keep classifications

### 3.10 V1 markdown memory migration (2 hrs)

- [ ] Script: read `config/departments/*/MEMORY.md` files
- [ ] Parse dated entries into SQLite `memories` table with `type: 'journal'`
- [ ] Brain's `buildMemoryContext` already reads from `memories` — now gets V1 context too
- [ ] V1 `appendDeptMemory` rewritten to INSERT into SQLite (markdown export becomes a daily cron)

### Phase 2.5 Definition of Done

- [ ] Greeting round-trip < 5s on 16GB
- [ ] Code-block message routes to Claude without LLM classification
- [ ] Classifier returns valid JSON on 100/100 manual cases (schema-constrained)
- [ ] Ollama hang does not block Slack handler (circuit breaker fires)
- [ ] Same question produces same voice regardless of local/Claude path
- [ ] 20 eval cases green in CI
- [ ] Branch committed and PR-ready

---

## 4. Phase 3 — Intelligence + Jarvis Feel (weeks 2–3, ~30 hrs)

> Memory becomes continuous. Anton speaks first. Persona unified.

### 4.1 Memory distillation

- [ ] After-turn async fact extraction (local Qwen3 8B, think:false)
- [ ] Schema: `{type: 'fact'|'decision'|'preference'|'commitment', text, confidence}`
- [ ] FTS5 + vector retrieval top-5 injected into next turn

### 4.2 sqlite-vec hybrid retrieval (SKIP ChromaDB)

- [ ] `npm install sqlite-vec`
- [ ] Extend `src/memory/sqlite.ts`: `embeddings` table, nomic-embed-text indexing
- [ ] Nightly embeds new memories
- [ ] RRF-merge BM25 (FTS5) + vector similarity
- [ ] Returns top-5 in <1ms — no separate service, no Docker

### 4.3 Proactive trigger loop (the Jarvis feel)

- [ ] `src/nervous/scheduler.ts` — node-cron daemon, separate from Slack handlers
- [ ] 08:00 morning briefing (sprint + calendar + overnight Slack)
- [ ] 18:00 EOD summary (done + stuck + tomorrow)
- [ ] Every 15m event scan (CI fails, Asana changes, watchlist messages)
- [ ] Every 1h stalled-task surfacer
- [ ] Every 4h distillation batch
- [ ] Output through same `_slackBrain` — consistent voice

### 4.4 Ambient context persona modulation

- [ ] `src/brain/ambient-context.ts` — builds "Anton, it is 23:45 Saturday..."
- [ ] Injected into every system prompt
- [ ] Includes: time, idle duration, recent pattern, open items

### 4.5 Persona unification

- [ ] New file per department: `config/agents/engineering.ts`, `marketing.ts`, etc.
- [ ] Zod schemas per agent (name, role, model, tools, delegates_to)
- [ ] `personas.ts` and V1 `personas.json` become generated from this single source
- [ ] Both local brain and Claude fallback build prompts from the same data
- [ ] Delete orphan agent names that exist in V1 but not in brain

### 4.6 Wire EOD consolidation through brain

- [ ] Replace V1 `appendDeptMemory` with SQLite INSERT
- [ ] Nightly Qwen3 8B pass summarizes day's conversations per agent
- [ ] Stored in `agent_journals` table
- [ ] Markdown export becomes a daily cron (`data/memory/YYYY-MM-DD.md`) — human-readable only

### 4.7 Phase 3A — Feedback primitives (see `docs/RESEARCH-MULTI-AGENT.md`)

- [ ] (4.7.1) Add SQLite tables: `tasks`, `task_events`, `pending_asks`
- [ ] (4.7.2) Extend `extractHandoffs()` → `extractAgentActions()`: parses `[ASK:]`, `[BLOCK:]`, `[APPROVE:]`, `[REJECT:]`, `[DONE:]`
- [ ] (4.7.3) Implement `brain.transition(taskId, event, byAgent)` — pure function with authority table
- [ ] (4.7.4) Add `hop_count` increment (cap 20 → auto-escalate)
- [ ] (4.7.5) Add `retry_count` increment on `needs-fix` (cap 3 → auto-escalate)
- [ ] (4.7.6) Semantic ask dedup — hash(task + asker + question[:100]), check last 10 events
- [ ] (4.7.7) Validate `HANDOFF`/`ASK` targets against `TEAM_NAMES`

### 4.8 Phase 3B — Simulation mode + fixtures

- [ ] (4.8.1) `ANTON_SIM_MODE=1` env var — swap `brain.process()` to read fixtures
- [ ] (4.8.2) JSONL fixture format + loader
- [ ] (4.8.3) Scenario S1: "Ship user login" — full cycle (Sarah→Marcus→James ASK Sarah→Elena→Priya REJECT→James fix→Priya APPROVE→Omar deploy)
- [ ] (4.8.4) Scenario S2: "Add Stripe" — blocker escalation (James BLOCK → Noel resumes)
- [ ] (4.8.5) Scenario S3: "Sprint planning" — parallel tracks with shared QA gate
- [ ] (4.8.6) Scenario S4: "QA bounce limit" — retry exhaustion after 3 cycles
- [ ] (4.8.7) Scenario S5: "Tech lead rejects" — rejection path with revision
- [ ] (4.8.8) Vitest suite runs all 5 in < 30s total; assert final state + hop + retry counts
- [ ] (4.8.9) CI metrics: task completion, hop efficiency, state correctness, escalation rate, loop count, hallucination rate

---

## 4.5. Phase 3.5 — Skill Loop (Hermes-inspired, ~12 hrs)

> Slot between memory (Phase 2/3) and training (Phase 6). Skills improve _within-session_; DPO improves weights _across weeks_. See `docs/BRAIN-V2.1-PLAN.md §4.5.`

### 4.5.1 Named skill library with `context_pattern → approach` keying (3 hrs)

- [ ] (4.5.1a) Create `skills` SQLite table (`context_pattern`, `approach` JSON, `owner_agent`, `success/failure_count`, `supersedes_id`, `deprecated`, `embedding`)
- [ ] (4.5.1b) Create `src/memory/skills.ts` module: `storeSkill`, `retrieveApplicableSkills(request, agent, topK=3)`, `markSkillUsed(id, outcome)`, `deprecateSkill(id)`
- [ ] (4.5.1c) Wire `retrieveApplicableSkills()` into `brain.process()` — injected as `[APPLICABLE SKILLS]` block distinct from `[ORG MEMORY]`

### 4.5.2 Outcome-evaluation pass (2 hrs)

- [ ] (4.5.2a) Create `turn_evaluations` SQLite table (4 scores + verdict + implicit_signal)
- [ ] (4.5.2b) Create `src/brain/evaluate.ts` — Qwen3 8B judge pass, schema-constrained, 4 criteria (task-addressed, role-appropriate, hallucination-free, action-ready)
- [ ] (4.5.2c) Fire-and-forget from `brain.process()` after every successful turn (local + Claude)
- [ ] (4.5.2d) Write verdict to `turn_evaluations`; update skill success/failure counts when skill was used

### 4.5.3 Implicit feedback capture (1.5 hrs)

- [ ] (4.5.3a) Create `src/brain/feedback-capture.ts` — `captureImplicitFeedback(prevAgentTurn, currentUserTurn)` returning `'accepted' | 'corrected' | 'ambiguous'`
- [ ] (4.5.3b) Three-stage signal pipeline: explicit keywords → edit-distance → semantic similarity
- [ ] (4.5.3c) Writes to `turn_evaluations.implicit_signal`; runs on every incoming user turn before the next `brain.process()` call

### 4.5.4 Skill refinement via supersedes chain (2 hrs)

- [ ] (4.5.4a) On `good` verdict + positive implicit signal + novel approach for existing `context_pattern` → create candidate skill with `supersedes_id` pointing to prior
- [ ] (4.5.4b) Candidate becomes preferred after 3 successful uses (vs existing's last-5 success rate)
- [ ] (4.5.4c) Retrieval returns newest non-deprecated per lineage

### 4.5.5 Structured user model (2 hrs)

- [ ] (4.5.5a) Create `user_model` SQLite table — 4 dimensions (`output_format`, `decision`, `task_pattern`, `feedback`)
- [ ] (4.5.5b) Per-dimension evolution rules: `output_format` requires 3 consistent observations; `decision` locks at first explicit choice with override history; `task_pattern` time-of-day indexed; `feedback` trends feed into skill success rates
- [ ] (4.5.5c) Inject high-confidence rows as `[USER MODEL]` block in `buildAmbientContext()`, 6-line cap

### 4.5.6 Cross-agent skill sharing (1.5 hrs)

- [ ] (4.5.6a) Add `shared` (bool) + `tags` (JSON array) columns to `skills`
- [ ] (4.5.6b) Auto-surface share proposals when skill hits success_rate > 0.8 AND evidence > 5
- [ ] (4.5.6c) Anton DMs Noel proposal; on approval, skill moves to shared pool; retrieval filter includes `owner_agent = X OR (shared = 1 AND tags ∩ my_domain)`

### 4.5.7 Integration wiring

- [ ] (4.5.7a) Extend `distillConversation()` (already shipped) to also emit skill candidates when `verdict = good` + novel `context_pattern`
- [ ] (4.5.7b) Phase 3B feedback state machine: `verified` transition can require eval-pass verdict ≥ 0.6 (configurable per agent)
- [ ] (4.5.7c) Phase 6 self-training: reuse `turn_evaluations.verdict` + `implicit_signal` as the DPO quality signal — delete the planned separate detector

### 4.5.8 Acceptance criteria

- [ ] Every completed turn writes a `turn_evaluations` row with 4 scores + verdict
- [ ] Every `good`-verdict turn with novel `context_pattern` creates a skill
- [ ] `retrieveApplicableSkills()` returns ≤ 3 skills, < 2k tokens, < 200ms
- [ ] Implicit-feedback capture catches ≥ 70% of Noel's corrections on replay
- [ ] `user_model` populates 4 dimensions with ≥ 2 rows each within a week
- [ ] At least 1 skill shared across agents via review flow
- [ ] Phase 3.5 demo: same task asked twice — second time retrieves and uses skill, observably faster + more consistent

---

## 5. Phase 4 — Web + Mobile Design and Build (weeks 4–6, ~60 hrs)

> Anton gets a proper interface. Not ChatGPT-clone. See `docs/DESIGN-PROMPT.md`.

### 5.1 Design — research-backed brief

- [x] Research design patterns (Granola, Linear, Arc, Raycast, Superhuman, Cursor) — DONE 2026-04-18
- [ ] Review `docs/DESIGN-PROMPT.md` with Noel
- [ ] High-fidelity mockups in Figma: 5 key web screens, 4 mobile screens
- [ ] Motion spec: animation timings, easing curves, micro-interactions
- [ ] Design system: tokens, components, states
- [ ] Accessibility review: keyboard nav, screen reader, color contrast

### 5.2 Web app (desktop, Noel's daily workspace)

- [ ] **Stack**: Next.js 15 + shadcn/ui primitives + custom tokens + Framer Motion
- [ ] **Fonts**: Söhne (or Geist Sans) + Berkeley Mono (or JetBrains Mono)
- [ ] **Screens**: Mission Control (agent grid) / Briefing / Approvals Tray / Memory Browser / Activity Timeline
- [ ] **Command palette**: Cmd+K everywhere, fuzzy + context-scored, monospaced font
- [ ] **Agent cards**: 26 in a grid, trust-tier badges, status glow, click-to-expand
- [ ] **Approval tray**: right sidebar, persistent, never modal, diff view for high-risk
- [ ] **Activity timeline**: filterable verbosity slider, permalinkable blocks
- [ ] **Memory browser**: searchable, scope filters, confidence indicator, highlight patterns (Readwise-style)
- [ ] **Keyboard shortcuts**: G+A (agents), G+B (briefing), G+P (pending), G+L (log), G+M (memory)
- [ ] WebSocket for real-time updates (upgrade existing `src/spine/web.js`)

### 5.3 Mobile app (iOS-first, voice-forward)

- [ ] **Stack**: Expo SDK 54 + React Native + Reanimated 3 + NativeWind
- [ ] **4 tabs**: Briefing / Agents / Approvals / Voice
- [ ] **Voice mode**: full-screen takeover, waveform visualizer, push-to-talk default
- [ ] **Rich notifications**: iOS 26 interactive widgets, inline approve/reject
- [ ] **Home screen widget**: medium (2×4), active count + approvals badge + mic
- [ ] **Gestures**: swipe right = approve, left = reject (every card)
- [ ] **Biometric auth**: FaceID required on every open, no PIN fallback
- [ ] **Offline mode**: queue actions, sync on reconnect
- [ ] **Expo push notifications** with rich content + action buttons

### 5.4 API + transport

- [ ] REST API: `/api/v1/message`, `/api/v1/agents`, `/api/v1/approvals`, `/api/v1/memory/search`
- [ ] WebSocket: real-time agent state, new approvals, activity stream
- [ ] JWT + refresh tokens
- [ ] Cloudflare Tunnel for remote access (no open ports)
- [ ] Rate limiting on auth endpoint only (30/min general, 5/min auth)

---

## 5.5. Phase 4.5 — Live Data Transport (REST hydrate + WebSocket deltas)

> The web UI was built against static mocks. This phase gives it live brain
> data via a hybrid transport — REST snapshots on mount, WebSocket deltas
> thereafter. Polling is explicitly rejected (wasteful + laggy for event-
> driven state). See `docs/ARCHITECTURE-BRAIN.md` → "Web Transport Layer".

### 5.5.1 Backend transport (DONE, see commits 9fd6e52 / fa7d2f2 / 5277cd6 / a5b2e5b)

- [x] `GET /api/approvals` — current pending approval records, mirrors `Approval` type
- [x] `GET /api/memories` — facts / decisions / preferences, mirrors `Memory` type
- [x] `GET /api/tasks` — kanban items, mirrors `Task` type
- [x] Each endpoint accepts an optional `*Source` callback via `initWeb(...)`; falls back to `DEFAULT_*` mock so the channel is live before brain grows real exports
- [x] WebSocket `hello` handshake on connect so clients can flip a connected indicator
- [x] Exported emit helpers: `emit(type, data)`, `emitApprovalCreated`, `emitApprovalResolved`, `emitMemoryWritten`, `emitTaskCreated`, `emitTaskUpdated`, `emitEventLogged` — all wrap `wss.broadcast({type, data, timestamp})`

### 5.5.2 Web-side transport (DONE, see commits above)

- [x] `web/lib/api/chat.ts` — typed client for POST `/api/chat`
- [x] `web/lib/api/approvals.ts`, `memory.ts`, `tasks.ts` — typed GET clients
- [x] `web/lib/api/stream.ts` — singleton `AntonStream`: one WS per page, ref-counted, auto-reconnect w/ exponential backoff + jitter, multiplexes handlers by event type. URL via `NEXT_PUBLIC_ANTON_WS_URL`
- [x] `web/hooks/use-anton-stream.ts` — React wrapper exposing `{ connected, subscribe }`
- [x] `web/hooks/use-approvals.ts` — REST hydrate + subscribe to `approval.created` / `approval.resolved`
- [x] `web/hooks/use-memories.ts` — REST hydrate + subscribe to `memory.written`
- [x] `web/hooks/use-tasks.ts` — REST hydrate + subscribe to `task.created` / `task.updated`
- [x] Components consume hooks (loading / `offline · showing cached` / live count states)

### 5.5.3 Brain-side emit wiring (DONE)

- [x] `src/memory/sqlite.ts` — `emitMemoryWritten(record)` fires after every successful `storeMemory()` insert (commit d643122)
- [x] `src/brain/brain.ts` — `reportActions()` helper consolidates the action-log and emits `event.logged` per action (HANDOFF / ASK / BLOCK / APPROVE / REJECT / DONE), replacing the two duplicated log blocks (commit a941ee4)
- [x] `index.js` — Slack approval gate now mirrors to web: `emitApprovalCreated` on queue, `emitApprovalResolved` on yes/no reply; `approvalsSource` passed to `initWeb` so GET /api/approvals returns the live queue instead of DEFAULT_APPROVALS (commit cd9ca99)
- [x] `src/memory/sqlite.ts` — `listMemories(limit)` export; `index.js` wires `memoriesSource: () => listMemories(50)` into `initWeb` so GET /api/memories pulls live SQLite state (commit 5d3a498)
- [x] **Task store** — new `tasks` table in SQLite (mirrors web `Task` type verbatim), `createTask` / `updateTask` / `transitionTask` / `listTasks` / `seedTasksIfEmpty` exports, all CRUD broadcasts `task.created` / `task.updated` (commit 893805e). `tasksSource` wired into `initWeb`; 4-task demo seed runs on empty DB.
- [x] **Brain → tasks** — `reportActions()` now calls `createTask` for qualifying actions: HANDOFF → flight row for target; ASK:Noel → incoming row for Noel; ASK:Agent → flight for agent; DONE → done row; BLOCK → blocked row with why (commit 8ab76b7).
- [ ] Follow-up: lifecycle linking. DONE arrives as a new row rather than transitioning the original HANDOFF row. Needs action tags to carry task_ids so a HANDOFF response's DONE/BLOCK can update the originating task. Deferred — requires extending the action-tag schema.

### 5.5.4 Approve / reject POST endpoints (DONE — commit f7b5278)

- [x] `POST /api/approvals/:id/approve` — forwards to `resolveApproval` callback, emits `approval.resolved`, notifies agent via fire-and-forget `trackedAsk`
- [x] `POST /api/approvals/:id/reject` — same path, decision='denied'
- [x] `web/lib/api/approvals.ts` — `approveApproval(id)` + `rejectApproval(id)` typed clients
- [x] `web/components/layout/approval-tray.tsx` — buttons wired with per-id busy state; card removal driven by WS `approval.resolved` (single source of truth); failed resolves surface as tray header error
- [ ] Follow-up: Slack-thread parity. Web-initiated approve/reject doesn't post "Approved." back to the Slack channel the way DM-initiated ones do. OK for MVP; fix when both channels care about the other's decisions.

### 5.5.5 Events stream (DONE — commit c88e486)

- [x] In-process 200-event ring buffer in `src/spine/web.js` populated by `emitEventLogged`
- [x] `GET /api/events` — default `eventsSource` taps the ring; callers can override
- [x] `web/lib/api/events.ts` — `fetchEvents()` typed client
- [x] `web/hooks/use-events.ts` — REST hydrate + WS subscribe to `event.logged`; client-side cap at 200
- [x] `web/components/modules/activity-timeline.tsx` — uses the hook; status line shows loading / offline-cached / live count
- [x] `/event/[id]` route made dynamic. `EventDetail` now hydrates from `useEvents()` (same hook as the timeline); `generateStaticParams` / `dynamicParams` dropped; `BASELINE_EVENT_COUNT` guard in the timeline removed so every row deep-links. Tradeoff: id is an index into the live list, so a new arrival while on a detail page shifts the row — acceptable for a single-session drill-down.

### 5.5.6 Definition of Done

- [ ] A chat from the web UI that triggers an agent memory write shows up in the Memory Browser without a refresh
- [ ] An agent emitting `AWAITING_APPROVAL:` lights up the Approval Tray within ~100ms
- [ ] Approve or Reject from the tray round-trips through the backend, closes out the approval, and the tray count drops
- [ ] Closing the Anton service shows `offline · showing cached` in every hybrid hook; reopening reconnects and backfills via REST

---

## 6. Phase 5 — Hardware Upgrade (weeks 7–8)

> Mac Studio arrives. Scale to 32B/72B. Push local handling to 95%+.

- [ ] Set up Mac Studio (macOS, Ollama, Node 22, Git)
- [ ] Install MLX-backend Ollama (auto on >32GB RAM)
- [ ] Pull: **`qwen3.6:35b-a3b`** (primary reasoning, replaces qwen3:72b), `qwen2.5-coder:32b`, `deepseek-r1:14b`, keep `qwen3:8b` hot
- [ ] Update `config/models.ts` — SINGLE file change (thanks to §11.1)
- [ ] Migrate data: rsync SQLite DB, `~/vault`, `config/`
- [ ] Run full eval suite — should remain green
- [ ] Benchmark: 72B vs 8B on held-out test cases
- [ ] Gradually lower Claude fallback threshold (20% → 10% → 5%)
- [ ] Monitor for 1 week, adjust

---

## 7. Phase 6 — Self-Training (weeks 9–10)

> Anton learns from interactions. DPO with mandatory eval gate.

- [ ] Training data collector: every turn → JSONL with user/agent/rating/source
- [ ] Quality signal detector: "thanks" / "perfect" → positive; corrections → negative
- [ ] DPO pair generator: user edit → {chosen: edited, rejected: original}
- [ ] Benchmark suite: 100+ cases covering routing, delegation, summarization
- [ ] **Mandatory eval gate**: new adapter must pass 100% of benchmark with <5% regression on any metric
- [ ] Idle-time scheduler: train only when Noel idle 5min AND CPU <40% AND no pending tasks
- [ ] First DPO run with `mlx-lm-lora` on Mac Studio (~60 min)
- [ ] Weekly training cron (if >100 new pairs)
- [ ] Training dashboard (Langfuse or custom)

---

## 8. Phase 7 — Voice (weeks 10–11)

> Local-only voice loop. Streaming LLM → TTS for <1.5s e2e latency.

- [ ] Whisper.cpp STT container (base.en model for speed)
- [ ] Piper or Kokoro TTS (Kokoro if quality > speed)
- [ ] OpenWakeWord "Hey Anton" model (train custom)
- [ ] Silero VAD for end-of-speech detection
- [ ] Voice pipeline: mic → VAD → STT → brain → streaming TTS → speaker
- [ ] Mobile: push-to-talk via WebSocket audio streaming
- [ ] Brain streaming mode: `process()` returns async iterator of tokens

---

## 9. Phase 8 — Finance (weeks 11–12)

> Market analysis. LLM never does math; Python does.

- [ ] Finance Docker container: OpenBB + pandas-ta + FinBERT + EdgarTools
- [ ] Technical analysis pipeline (200+ indicators)
- [ ] Sentiment analysis (FinBERT on RSS headlines)
- [ ] Fundamental analysis (SEC filings via EdgarTools)
- [ ] Report generation: LLM interprets pre-computed data
- [ ] Finance agents: analyst, market-researcher
- [ ] Mobile finance dashboard (charts, analysis cards)
- [ ] Daily 8am pre-market briefing (auto-push)
- [ ] Mandatory disclaimer on every output

---

## 10. Phase 9 — Production Hardening (week 13+)

- [ ] Daily SQLite dump + `~/vault` Git commit to `~/Backups/anton/`
- [ ] Monitoring alerts (Ollama down, disk full, high latency, cert expiry)
- [ ] System status dashboard (at `/status` in web app)
- [ ] Load test: 50 concurrent agent tasks without drops
- [ ] Security audit (endpoint review, auth flows, secret rotation)
- [ ] Ops runbook: restart, recover, rollback, backup restore
- [ ] Watchtower for Docker auto-updates (if containerized services in use)

---

## 11. Security Checklist (scoped to single-user local)

**Active:**

- [x] Ollama bound to `127.0.0.1` (CVE-2025-63389)
- [x] SQLite WAL mode for crash safety
- [x] `.env` gitignored + Husky secret detection
- [x] Agent name allowlist validated pre-dispatch
- [ ] **Phase 2.5**: Spotlighting on external content
- [ ] **Phase 2.5**: Remove content logging from console.log
- [ ] **Phase 3**: Audit log (what/when/who/why, no raw content)
- [ ] **Phase 5**: macOS Keychain via keytar when Anton runs as service
- [ ] **Phase 6**: LoRA evaluation gate (prevent silent degradation)
- [ ] **Phase 6**: Training data — positive signals + human-curated only
- [ ] **Phase 9**: CI/CD gate before any auto-merge
- [ ] **Phase 9**: Deterministic validation for critical actions (email send, PR merge)

**Deliberately skipped (overkill for threat model):**

- ~~HMAC-SHA256 agent message signing~~ — in-process, single-user
- ~~TLS between in-process services~~ — meaningless
- ~~Rate-limiting against Noel himself~~ — meaningless
- ~~Zero-trust multi-tenant architecture~~ — not applicable

---

## 12. Model Switching Strategy (Tier-Aware)

Route by LOGICAL name (`'local-fast'`, `'local-reason'`, `'local-coder'`), not model string. `config/models.ts` maps logical → actual per tier.

| Task Type               | Tier 1 (16GB)         | Tier 2 (64GB)                      | Tier 3 (128GB)                         |
| ----------------------- | --------------------- | ---------------------------------- | -------------------------------------- |
| Routing, classification | qwen3:8b              | qwen3:8b                           | qwen3:8b                               |
| Simple Q&A              | qwen3:8b              | qwen3:8b                           | qwen3:8b                               |
| Analysis, strategy      | qwen3:8b (think:deep) | **qwen3.6:35b-a3b**                | **qwen3.6:35b-a3b**                    |
| Math/logic              | qwen3:8b              | deepseek-r1:14b                    | deepseek-r1:14b                        |
| Code generation         | **Claude Sonnet**     | **qwen3.6:35b-a3b** (SWE-B 73.4%)  | qwen3.6:35b-a3b + coder:32b spot-check |
| Code review             | **Claude Sonnet**     | qwen3.6:35b-a3b                    | qwen3.6:35b-a3b                        |
| Deep research           | **Claude Sonnet**     | qwen3.6:35b-a3b + web tools        | qwen3.6:35b-a3b + web tools            |
| Architecture            | **Claude Opus**       | qwen3.6:35b-a3b + Claude Opus spot | qwen3.6:35b-a3b primary                |
| Embeddings              | nomic-embed-text      | nomic-embed-text                   | bge-m3                                 |

**Claude % target:** Tier 1: 20–30%, Tier 2: <10%, Tier 3: <5%.

### Qwen3.6-35B-A3B — primary Tier 2/3 brain (released 2026-04-16)

- **MoE architecture**: 35B total / ~3B active per token → 3B-model compute cost, 35B-model quality
- **Benchmarks**: 73.4% SWE-Bench Verified, 51.5% Terminal-Bench 2.0, 37% MCPMark (tool use)
- **Context**: 262K native, 1M+ via YaRN scaling
- **Hardware minimum**: 64 GB unified memory (cannot run on current 16 GB — stay on qwen3:8b until Mac Studio)
- **Speed**: 35–50 tok/s Apple Silicon native; 70–80 tok/s with MLX on M4+
- **Size on disk**: Q4_K_M ~21 GB, Q8_0 ~36 GB, FP16 ~70 GB
- **Licence**: Apache 2.0, commercial use permitted
- **Install**: `ollama pull qwen3.6:35b-a3b` (Ollama native support since 2026-04-16)
- **Capabilities**: tool calling, vision, "thinking preservation" (retains reasoning across multi-turn agent loops — perfect for Anton's handoff chains)

---

## 13. Scalability Ladder (Hardware)

| Tier    | RAM      | Active models (simultaneous)                                      | Claude % | Est. cost/mo |
| ------- | -------- | ----------------------------------------------------------------- | -------- | ------------ |
| 1 (now) | 16GB     | qwen3:8b hot + nomic-embed                                        | 20-30%   | $20 Pro      |
| 2       | 48-64GB  | qwen3:8b + **qwen3.6:35b-a3b** + nomic-embed                      | <10%     | $0-20        |
| 3       | 96-128GB | qwen3:8b + **qwen3.6:35b-a3b** + coder:32b + r1:14b + bge-m3      | <5%      | $0-20        |
| 4       | 192GB+   | qwen3:8b + 35b-a3b + coder:32b + r1:70b + qwen3:72b spot + bge-m3 | <2%      | $0           |

**Tier 3 residency math (128 GB):** qwen3.6:35b-a3b ~21 GB + qwen2.5-coder:32b ~20 GB + qwen3:8b ~5 GB + deepseek-r1:14b ~9 GB + bge-m3 ~1 GB + OS/Docker/KV cache ~40 GB = ~96 GB used, 32 GB headroom.

Upgrade path = edit `config/models.ts` only.

---

## 14. Progress Log

| Date       | What                                                                                                                                              | Phase    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 2026-04-14 | V1 built: notify, watcher, briefing, events, trust, audit, handoffs, context, web UI                                                              | V1       |
| 2026-04-14 | V2 architecture researched and documented                                                                                                         | Planning |
| 2026-04-14 | V2 implementation plan created (8 phases, 12 weeks)                                                                                               | Planning |
| 2026-04-14 | Mac Studio 128GB ordered                                                                                                                          | Hardware |
| 2026-04-14 | Organ system + READMEs (brain, memory, nervous, heart, voice, eyes, hands, spine)                                                                 | 0        |
| 2026-04-14 | Ollama 0.20.7 + 3 models + localhost bind                                                                                                         | 0        |
| 2026-04-14 | TypeScript scaffold + `config/models.ts`                                                                                                          | 0        |
| 2026-04-14 | Brain core: ollama-client.ts + classifier.ts + brain.ts + thinking.ts                                                                             | 1        |
| 2026-04-14 | Brain wired into Slack + web paths                                                                                                                | 1        |
| 2026-04-14 | `@claude` / `@local` override prefixes                                                                                                            | 1        |
| 2026-04-14 | V1 code moved to `src/v1-archive/` (43 files preserved)                                                                                           | 1        |
| 2026-04-19 | V1 code reorganized into organ folders (brain/memory/nervous/heart/hands/eyes/spine); v1-archive removed                                          | 4.5      |
| 2026-04-15 | Phase 2: SQLite memory with FTS5 + WAL + ACID                                                                                                     | 2        |
| 2026-04-15 | SQLite integrated — `storeConversation` + `buildMemoryContext` per turn                                                                           | 2        |
| 2026-04-15 | Agent personas in brain (15 agents, `buildAgentPrompt`)                                                                                           | 1        |
| 2026-04-18 | **Audit**: identified 11 broken/disconnected pieces in phase 1+2 code                                                                             | 2.5      |
| 2026-04-18 | Research: local LLM orchestration, UX/UI 2026 patterns — complete                                                                                 | 2.5      |
| 2026-04-18 | Revised plan written: `docs/BRAIN-V2.1-PLAN.md`                                                                                                   | 2.5      |
| 2026-04-18 | Design prompt written: `docs/DESIGN-PROMPT.md`                                                                                                    | 4        |
| 2026-04-18 | TODO rewritten to reflect reality + Phase 2.5 insert                                                                                              | —        |
|            | **NEXT: Execute Phase 2.5 — circuit breaker → routing → thinking → classifier → pre-gate → handoff → fallback → eval → spotlighting → migration** | 2.5      |

---

## 15. Canonical References

- `docs/BRAIN-V2.1-PLAN.md` — revised architecture + Phase 2.5 fixes (THIS IS THE SOURCE OF TRUTH)
- `docs/ARCHITECTURE-BRAIN.md` — original Phase 1 design (historical)
- `docs/DESIGN-PROMPT.md` — web + mobile design brief
- `src/brain/*` — current implementation (branch `phase2/memory`)
- `tests/brain.eval.ts` — routing eval harness (Phase 2.5 §3.8)
- `data/brain/anton.db` — SQLite memory (WAL mode, FTS5)

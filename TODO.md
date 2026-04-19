# Anton Brain V2.1 — Master TODO

> Local LLM as the operating system. Claude for heavy lifting. Anton as JARVIS.
> Timeline: 14 weeks (12 V2 + 2 Phase 2.5). Current: 16GB Mac. Target: Mac Studio 128GB.
> **Active branch:** `phase4/web-ui` — Phase 4.5 live transport shipped; Phase 2.5 stabilization mostly absorbed along the way.

---

## 1. Reality Check (2026-04-19 audit)

The earlier "Reality Check" (dated 2026-04-18) described a broken-but-scaffolded brain. Most of what it called broken has since been fixed. This block reflects the code as of today — verified by grep, not by memory.

### What's actually working

- V1 (Claude Agent SDK) 27-agent team with Slack + Web + notifications + briefings — fully operational
- V2 brain at `src/brain/*` — full pipeline: pre-gate → classifier → responder → evaluate → distill → skill-extract → feedback-capture
- Ollama client: opossum circuit breaker (3 fails/60s, 30s reset probe), wall-clock timeouts via `Promise.race`, schema-constrained format, 2s startup health check
- `taskRouting` consulted live in `brain.ts:routeForClassification()` — logical model names only
- Adaptive thinking: depth is classifier-driven; `timeoutForDepth()` scales 10s/20s/45s/60s by depth
- Unified Claude fallback at `src/brain/claude-fallback.ts` — SAME system prompt as local responder (voice-drift fixed)
- SQLite memory store with FTS5 + WAL + tasks + skills + turn_evaluations + user_model
- Memory spotlighting module at `src/memory/spotlighting.ts` with tests
- V1 markdown → SQLite migration at `scripts/migrate-v1-memory.ts`
- Web UI (Next.js 15 + Tailwind v4) with hybrid REST/WS transport, live approvals / memories / tasks / events
- 640/641 tests pass (1 skipped live SDK smoke)
- Ollama bound to `127.0.0.1:11434` (CVE-2025-63389 mitigated)
- V1 code reorganized into organ folders (`src/brain/`, `src/memory/`, `src/nervous/`, `src/heart/`, `src/hands/`, `src/eyes/`, `src/spine/`)

### What's genuinely BROKEN or NOT STARTED

- **No assertable brain eval harness** — `tests/brain-e2e.md` is still a markdown checklist. No `tests/brain.eval.ts`. §3.8.
- ~~Persona source-of-truth not unified~~ — **DONE** 2026-04-19. `config/agents/*.ts` with Zod schema; both V1 and V2 read from the same loader.
- ~~EOD consolidation not routed through brain~~ — **DONE 2026-04-19** (dual-write to SQLite). Nightly-summarization layer still TBD. §4.6.
- ~~sqlite-vec not installed~~ — **DONE 2026-04-19**. Hybrid FTS5+vector retrieval with RRF merge; brain uses it per turn. §4.2.
- ~~Proactive scheduler is the V1 briefing only~~ — **DONE 2026-04-19**. EOD + event scan + stalled-task surfacer shipped in `src/heart/proactive.js`. Distillation batch deferred (inline covers it). §4.3.
- ~~Cross-agent skill sharing~~ — **DONE 2026-04-19**. Discovery + proposal flow ships; end-to-end approval-to-`shareSkill` wiring deferred as a small ergonomic follow-up. §4.5.6.
- **Langfuse / observability** — nothing yet. Logs are `console.log`.
- **Voice / finance / self-training / mobile** — all post-Phase-4.

### What's in-flight but loose-ended

- **Task lifecycle linking** — `[DONE:42 ...]` can't transition the originating task; DONE creates a new row. Needs agent-actions parser + `actionToTaskInput` change. §5.5.3 follow-up.
- **Slack-thread parity** — web-initiated approve/reject doesn't post confirmation back to Slack. §5.5.4 follow-up.
- **index.js regex handlers** — system cmds / schedule / approval routing still use regex in `index.js` rather than brain. Not a blocker; noted for later sweep.

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
- [x] Migrate existing V1 markdown memories to SQLite — `scripts/migrate-v1-memory.ts` + §4.6 dual-write
- [x] Auto-summarize after every conversation — `distillConversation()` in `src/brain/distill.ts`, fire-and-forget from brain
- [x] ChromaDB / RAG — **replaced by sqlite-vec** (shipped §4.2 on 2026-04-19)
- [x] Memory injection scanning / spotlighting — `src/memory/spotlighting.ts` + tests
- [ ] Cache Claude results — Phase 3 (no item scheduled yet)
- [ ] LightRAG knowledge graph — **deferred to Phase 5 (overkill for single user)**
- [ ] Obsidian vault — Phase 3
- [ ] Vault file watcher — Phase 3
- [ ] Daily / weekly note generation — Phase 3
- [ ] Vault Git commits — Phase 3

---

## 3. Phase 2.5 — STABILIZE (MOSTLY COMPLETE)

> Goal: the brain _feels_ connected. Greetings in <3s. Deterministic Claude routing. One voice across paths.
> Status as of 2026-04-19: 9 of 10 sub-items shipped while Phase 4 was in flight. Only the eval harness (§3.8) is genuinely open.

### 3.1 Safety first — circuit breaker + timeouts — DONE

- [x] opossum circuit breaker (3 fails/60s window, 30s reset probe) — `src/brain/ollama-client.ts:93`
- [x] Wall-clock timeout via `Promise.race` — `ollama-client.ts:76-79` (ollama npm client has no native abort; Promise.race is the practical equivalent)
- [x] `CircuitOpenError` caught in `brain.ts` → falls through to Claude — `brain.ts` try/catch around `chat()`
- [x] Startup `isHealthy()` with 2s timeout guards against Ollama cold-start hanging boot — `ollama-client.ts:141`

### 3.2 Make taskRouting live — DONE

- [x] `routeForClassification()` consults `taskRouting[compound]` / `taskRouting[intent]` — `brain.ts:307`
- [x] `resolveModel()` looks up concrete model by logical name — `brain.ts:297`
- [x] Hardware upgrade now = edit `config/models.ts` only

### 3.3 Wire adaptive thinking — DONE

- [x] Classifier runs first (`classify()` at `brain.ts:390`), then responder at classifier's `adaptiveDepth`
- [x] `think` is depth-driven via `shouldThink` in `ollama-client.ts:50` — no longer hardcoded to `true`
- [x] Depth-scoped max tokens via `getMaxTokensForDepth()` — `brain.ts` passes per-call
- [x] Depth-scoped temperature via `getTemperatureForDepth()` — same path
- [x] `timeoutForDepth()` budgets: minimal 10s / standard 20s / detailed 45s / deep 60s — `brain.ts:317`

### 3.4 Schema-constrained classifier — DONE

- [x] `schema?: object` param on `ChatOptions` — `ollama-client.ts:23`
- [x] `requestBody.format = options.schema` when schema provided — `ollama-client.ts:67`
- [x] `chatJSON` suppresses `jsonMode` when schema set (avoid redundant grammar) — `ollama-client.ts:122`

### 3.5 Deterministic pre-gate — DONE

- [x] `src/brain/pre-gate.ts` implements `@claude` / `@local` prefixes, code-block detection, long-input detection, approval/schedule intent seeds
- [x] `preGate()` called first in `brain.process()` — `brain.ts:376`
- [x] `skipClassifier` flag bypasses classifier when pre-gate is confident — `brain.ts:388`
- [x] Tests in `src/brain/pre-gate.test.ts`

### 3.6 Delete handoff NL fallback — DONE

- [x] NL fallback removed from `brain.ts`. Only explicit `[HANDOFF:Name]` tags are accepted (via `extractAgentActions`).
- [x] Classifier-emitted handoffs merged with tag-extracted handoffs via `handoffMap` — `brain.ts:466-469`

### 3.7 Unified Claude fallback path — DONE

- [x] `src/brain/claude-fallback.ts` exists and is the single entry point
- [x] `claudeFallback(message, systemPrompt, ...)` called directly from `brain.ts:457` — no detour through V1 `trackedAsk`
- [x] SAME `systemPrompt` built once at `brain.ts:450` and used by BOTH local responder and Claude — voice drift fixed
- [x] Claude results written to SQLite via `storeConversation()` on the Claude path

### 3.8 Eval harness — DONE

- [x] `tests/brain.eval.test.ts` — 31 assertable cases, runs in CI under 200ms via mocked LLM
- [x] Three parts: §A pre-gate (16 cases), §B action-tag extraction (9 cases), §C end-to-end process() with mocked chat/classify/claude-fallback (6 cases)
- [x] Covers: greeting, approval, code-block, long-input, @claude / @local prefix, schedule intent, explicit handoff, invalid handoff target, classifier-driven Claude routing, latency budget
- [x] Asserts: intent, needsClaude, handoffs, handledLocally, durationMs
- [x] Wired into `npm test` via the default vitest glob

### 3.9 Memory spotlighting — DONE (verify wiring)

- [x] `src/memory/spotlighting.ts` with `src/memory/spotlighting.test.ts`
- [ ] TODO: confirm `buildMemoryContext()` routes through spotlighting before returning the context string (quick grep-verify, file a fix if not)

### 3.10 V1 markdown memory migration — DONE

- [x] `scripts/migrate-v1-memory.ts` parses `config/departments/*/MEMORY.md` into SQLite
- [x] Brain's `buildMemoryContext` reads the same `memories` table → V1 and V2 memories now merge at read time
- [ ] Follow-up: V1 `appendDeptMemory` still writes markdown as primary; could invert so SQLite is the write path and markdown is a daily export. Low priority — both paths work.

### Phase 2.5 Definition of Done

- [x] Ollama hang does not block Slack handler (circuit breaker fires)
- [x] Same question produces same voice regardless of local/Claude path (unified `systemPrompt`)
- [x] Schema-constrained classifier (format: schema) — no soft JSON mode when schema set
- [x] 20+ eval cases green in CI (§3.8 — 31 actual cases)
- [x] Code-block route-to-Claude verified by assertable test (§3.8 §C)
- [x] Greeting bypass-classifier verified (§3.8 §A) — full-latency end-to-end measurement against live 16GB Ollama still pending (separate perf benchmark, not in eval harness scope)

---

## 4. Phase 3 — Intelligence + Jarvis Feel (weeks 2–3, ~30 hrs)

> Memory becomes continuous. Anton speaks first. Persona unified.

### 4.1 Memory distillation — DONE

- [x] After-turn async fact extraction via `distillConversation()` in `src/brain/distill.ts` (Qwen3 8B, think:false, schema-constrained)
- [x] Schema: `{type, text, confidence}` with types 'fact'|'decision'|'preference'|'commitment'
- [x] `distill.test.ts` covers the extraction and storage path
- [x] FTS5 retrieval of top memories injected into next turn via `buildMemoryContext()`
- [x] Vector (sqlite-vec) retrieval — shipped §4.2

### 4.2 sqlite-vec hybrid retrieval — DONE

- [x] `npm install sqlite-vec` (v0.1.9)
- [x] `memories_vec` vec0 virtual table (768-dim, matches nomic-embed-text)
- [x] Extension loads on `initSqliteMemory`; failures degrade to FTS5-only gracefully (`isVecEnabled()`)
- [x] `storeMemory` now fires background `indexMemoryEmbedding` via setImmediate — no caller change, no latency tax
- [x] `semanticSearchMemories` / `hybridSearchMemories` (RRF with k=60) / `buildRelevantMemoryContext` exported from `src/memory/sqlite.ts`
- [x] `brain.process()` calls `buildRelevantMemoryContext(message, agent)` when the message is ≥3 chars; falls back to time-based view for stubs
- [x] RRF merge of BM25 (FTS5) + vector similarity — returns top-5, in-process, no Docker
- [x] New memories embedded on every `storeMemory` insert (fire-and-forget)
- [x] 6 tests in `src/memory/sqlite-vec.test.ts` cover indexing, semantic ranking, RRF merging, limit, FTS5 fallback
- [ ] Nightly re-embed cron if the embedding model changes — deferred, single-model for now

### 4.3 Proactive trigger loop (the Jarvis feel) — MOSTLY DONE

- [x] Scheduler daemon — `src/heart/scheduler.js` (V1 lightweight scheduler, not node-cron; wall-clock jobs + intervals). Lives in `heart/` per the organ-system README, not `nervous/`.
- [x] 08:00 morning briefing — `src/heart/briefing.js` wired via `initBriefing` (pre-existing)
- [x] 18:00 EOD summary — `src/heart/proactive.js:runEodSummary` routes via Riley through `brain.process()`
- [x] Every 15m event scan — `runEventScan` reads eventBus history, fires P2 when error count crosses threshold
- [x] Every 1h stalled-task surfacer — `runStalledTaskSurfacer` queries SQLite `findStalledTasks(24, 5)`
- [x] Output through unified brain — EOD summary calls `brain.process()`, so voice matches the rest of the system
- [x] 11 tests in `src/heart/proactive.test.js` cover all three triggers + init wiring
- [ ] Every 4h distillation batch — **deferred**. Inline distillation fires per-turn already; a batch safety-net would need a `distilled_at` column on conversations, which is invasive for uncertain value. Add back if inline failures surface.
- [ ] Event scan: wire CI / Asana / watchlist sources — today it only reads the in-process event bus. Real source wiring is Phase 4+.

### 4.4 Ambient context persona modulation — DONE

- [x] `src/brain/ambient-context.ts` builds time/day/idle-duration/open-items context
- [x] `buildAmbientContext()` called per turn and injected into the system prompt at `brain.ts:436`
- [x] `ambient-context.test.ts` covers the format

### 4.5 Persona unification — DONE

- [x] New file per department: `config/agents/engineering.ts`, `marketing.ts`, `seo.ts`, `automation.ts`, `data.ts`, `growth.ts`, `coordination.ts` — 28 agents total (27 team + Anton)
- [x] Zod schema in `config/agents/_schema.ts` — validates at module load; duplicate-id and missing-field failures crash boot, not silent drift
- [x] `config/agents/index.ts` loader assembles AGENTS_BY_ID / AGENTS_BY_NAME / DEPT_LEADS / findByName / getDeptMembers / getDeptLead
- [x] `src/brain/personas.ts` (V2) now reads the loader — no more 16-vs-27 agent discrepancy
- [x] `src/brain/team.js` (V1) now builds TEAM from the loader
- [x] `src/memory/sessions.js` (V1 Claude path) reads `AGENTS_BY_NAME` — same personality/slackStyle/background as V2
- [x] `config/personas.json` deleted
- [x] Loader tests at `config/agents/index.test.ts` — 8 assertions, covers roster count, lead invariants, lookup, null-agentId rule

### 4.6 Wire EOD consolidation through brain — PARTIAL

- [x] V1 journal writes now dual-write to SQLite — every `appendDeptMemory`, `appendSharedMemory`, `appendDailyNote` stores a `journal-dept` / `journal-shared` / `journal-daily` row in the memories table before touching markdown
- [x] Schema `CHECK(type IN …)` dropped + one-shot migration for existing prod DBs (see `initSqliteMemory` in `src/memory/sqlite.ts`)
- [x] SQLite write is best-effort — if the DB isn't initialized (boot race) the markdown layer still works; next append retries the insert cleanly
- [x] Tests at `src/memory/memory-v1.test.js` cover the three journal types
- [ ] Nightly Qwen3 8B pass summarizes day's conversations per agent — **not yet**
- [ ] Stored in dedicated `agent_journals` table — **not yet** (using the shared `memories` table with `journal-*` type for now; move if volume demands it)
- [ ] Markdown becomes export-only (scheduled cron writing from SQLite) — **deferred**. Today both paths write; the dual-write guarantees SQLite is never stale, so this is a cosmetic cleanup, not a correctness fix.

### 4.7 Phase 3A — Feedback primitives — DONE

- [x] (4.7.1) SQLite `tasks` table shipped (see §5.5.3); `task_events` / `pending_asks` still rolled into tasks.col for now (simplification until it's a pain)
- [x] (4.7.2) `extractAgentActions()` in `src/brain/agent-actions.ts` parses HANDOFF, ASK, BLOCK, APPROVE, REJECT, DONE — with tests
- [x] (4.7.3) `src/brain/state-machine.ts` implements `transition()` with authority table; `state-machine.test.ts` covers the transitions
- [ ] (4.7.4) `hop_count` auto-escalate — not yet wired
- [ ] (4.7.5) `retry_count` on `needs-fix` — not yet wired
- [ ] (4.7.6) Semantic ask dedup — not yet wired
- [x] (4.7.7) HANDOFF/ASK target validation against TEAM_NAMES — `extractAndValidateActions()` in `brain.ts:125`

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

### 4.5.1 Named skill library — DONE

- [x] (4.5.1a) `skills` SQLite table with `context_pattern`, `approach`, `owner_agent`, success/failure counts, supersedes_id, deprecated, embedding
- [x] (4.5.1b) `src/memory/skills.ts` with `storeSkill`, `retrieveApplicableSkills`, `markSkillUsed`, `deprecateSkill` — `skills.test.ts` covers it
- [x] (4.5.1c) `buildSkillsContext()` called in `brain.process()` at `brain.ts:428`, injected as a separate block

### 4.5.2 Outcome-evaluation pass — DONE

- [x] (4.5.2a) `turn_evaluations` table with 4 scores + verdict + implicit_signal
- [x] (4.5.2b) `src/brain/evaluate.ts` — `evaluateTurn()` with schema-constrained Qwen3 judge
- [x] (4.5.2c) Fired fire-and-forget after each turn
- [x] (4.5.2d) Verdict stored; skill success/failure updated when a skill was used

### 4.5.3 Implicit feedback capture — DONE

- [x] (4.5.3a) `src/brain/feedback-capture.ts` with `captureImplicitFeedback()`
- [x] (4.5.3b) Three-stage pipeline (keywords → edit-distance → semantic)
- [x] (4.5.3c) Writes to `turn_evaluations.implicit_signal`; runs on user turn before next brain call

### 4.5.4 Skill refinement via supersedes chain — DONE

- [x] (4.5.4a/b/c) `src/memory/skills-lifecycle.test.ts` covers supersedes-and-candidate flow; retrieval returns newest non-deprecated per lineage

### 4.5.5 Structured user model — DONE

- [x] (4.5.5a) `user_model` table with 4 dimensions
- [x] (4.5.5b) Per-dimension evolution rules in `src/memory/sqlite.ts` — tested in `user-model.test.ts`
- [x] (4.5.5c) High-confidence rows injected as `[USER MODEL]` block via ambient-context

### 4.5.6 Cross-agent skill sharing — DONE (ergonomic follow-up deferred)

- [x] (4.5.6a) `shared` (int 0/1) + `tags` (JSON array) columns on the `skills` table — shipped earlier with the Phase 3.5 skill loop
- [x] (4.5.6b) `findShareableSkills()` query (success_rate > 0.8 AND evidence ≥ 5 AND private) + `runSkillShareScan` in `src/heart/skill-sharing.js` fires every 4h from `initProactive` and proposes via `notifyNoel` (P3). Per-process dedup via an in-memory Set so the same skill doesn't re-surface until Noel acts or Anton restarts.
- [x] `shareSkill(id, tags?)` exists on the memory layer to flip the bit once approved
- [x] `retrieveApplicableSkills` already surfaces `owner_agent = X OR shared = 1` rows — shared skills are visible to every agent today
- [x] 6 tests in `src/heart/skill-sharing.test.js` cover proposal, dedup, maxPerRun cap, forgetProposal, error handling, zero-candidates silence
- [ ] Follow-up: end-to-end approval ergonomic. Today Noel sees the proposal as a P3 notification; the actual `shareSkill(id)` call is manual. Wiring a `share skill N` Slack command (or reusing the approval tray) is the next step.
- [ ] Follow-up: tag ∩ my_domain retrieval filter. Today `shared = 1` means "visible to everyone"; the per-domain filter requires a tag taxonomy that doesn't exist yet. Low priority until domain overlap causes noise.

### 4.5.7 Integration wiring — DONE (4.5.7a/b); 4.5.7c rolls into Phase 6

- [x] (4.5.7a) `distillConversation()` emits skill candidates on `verdict = good` + novel pattern (via `extractSkillCandidate` in `skill-extract.ts`)
- [x] (4.5.7b) State-machine gates `verified` on eval-pass verdict threshold
- [ ] (4.5.7c) Phase 6 self-training reuse — deferred to Phase 6

### 4.5.8 Acceptance criteria

- [x] Every completed turn writes a `turn_evaluations` row — verified by test coverage
- [x] Every `good`-verdict turn with novel `context_pattern` creates a skill
- [ ] `retrieveApplicableSkills()` < 2k tokens, < 200ms — **not measured in CI yet** (§3.8 eval harness would cover)
- [ ] Implicit-feedback capture ≥ 70% corrections on replay — **no corpus yet**
- [ ] `user_model` 4 dimensions × ≥ 2 rows in a week — **no telemetry assertion yet**
- [ ] At least 1 skill shared across agents via review flow — **blocked on §4.5.6**
- [ ] Demo: same task twice, second time faster + more consistent — **not benchmarked**

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

| Date       | What                                                                                                                                        | Phase    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 2026-04-14 | V1 built: notify, watcher, briefing, events, trust, audit, handoffs, context, web UI                                                        | V1       |
| 2026-04-14 | V2 architecture researched and documented                                                                                                   | Planning |
| 2026-04-14 | V2 implementation plan created (8 phases, 12 weeks)                                                                                         | Planning |
| 2026-04-14 | Mac Studio 128GB ordered                                                                                                                    | Hardware |
| 2026-04-14 | Organ system + READMEs (brain, memory, nervous, heart, voice, eyes, hands, spine)                                                           | 0        |
| 2026-04-14 | Ollama 0.20.7 + 3 models + localhost bind                                                                                                   | 0        |
| 2026-04-14 | TypeScript scaffold + `config/models.ts`                                                                                                    | 0        |
| 2026-04-14 | Brain core: ollama-client.ts + classifier.ts + brain.ts + thinking.ts                                                                       | 1        |
| 2026-04-14 | Brain wired into Slack + web paths                                                                                                          | 1        |
| 2026-04-14 | `@claude` / `@local` override prefixes                                                                                                      | 1        |
| 2026-04-14 | V1 code moved to `src/v1-archive/` (43 files preserved)                                                                                     | 1        |
| 2026-04-15 | Phase 2: SQLite memory with FTS5 + WAL + ACID                                                                                               | 2        |
| 2026-04-15 | SQLite integrated — `storeConversation` + `buildMemoryContext` per turn                                                                     | 2        |
| 2026-04-15 | Agent personas in brain (15 agents, `buildAgentPrompt`)                                                                                     | 1        |
| 2026-04-18 | **Audit**: identified 11 broken/disconnected pieces in phase 1+2 code                                                                       | 2.5      |
| 2026-04-18 | Research: local LLM orchestration, UX/UI 2026 patterns — complete                                                                           | 2.5      |
| 2026-04-18 | Revised plan written: `docs/BRAIN-V2.1-PLAN.md`                                                                                             | 2.5      |
| 2026-04-18 | Design prompt written: `docs/DESIGN-PROMPT.md`                                                                                              | 4        |
| 2026-04-18 | TODO rewritten to reflect reality + Phase 2.5 insert                                                                                        | —        |
| 2026-04-18 | Phase 3.5 skill loop shipped — skills + evaluate + feedback-capture + user_model + skill-extract modules all landed with tests              | 3.5      |
| 2026-04-18 | Phase 2.5 stabilization largely absorbed during Phase 3.5 work — 9 of 10 items done (§3.8 eval harness still open)                          | 2.5      |
| 2026-04-19 | V1 code reorganized into organ folders (brain/memory/nervous/heart/hands/eyes/spine); v1-archive removed                                    | 4.5      |
| 2026-04-19 | Phase 4.5 Live Data Transport shipped: REST hydrate + WebSocket deltas, approvals/memories/tasks/events live, approve-reject POST endpoints | 4.5      |
| 2026-04-19 | `/event/[id]` route made dynamic — timeline deep-links every row; SSG dropped; EventDetail hydrates from useEvents                          | 4.5      |
| 2026-04-19 | TODO reconciled with code — corrected ~40 stale unchecked items to reflect what's actually shipped                                          | —        |
| 2026-04-19 | §3.8 brain eval harness shipped — `tests/brain.eval.test.ts`, 31 assertable cases, closes Phase 2.5                                         | 2.5      |
| 2026-04-19 | §4.5 persona unification shipped — `config/agents/*.ts` (Zod), `personas.json` deleted, V1+V2 share the loader, +8 loader tests             | 3        |
| 2026-04-19 | §4.6 dual-write shipped — V1 journals now land in SQLite + markdown; CHECK(type) dropped via one-shot migration; +3 tests                   | 3        |
| 2026-04-19 | §4.2 sqlite-vec shipped — vec0 table, hybrid FTS5+vector retrieval with RRF, brain uses query-aware memory context; +6 tests                | 3        |
| 2026-04-19 | §4.3 proactive trigger loop shipped — EOD/event-scan/stalled-task in `src/heart/proactive.js`, wired via `initProactive`; +11 tests         | 3        |
| 2026-04-19 | §4.5.6 cross-agent skill sharing — discovery + proposal flow via `src/heart/skill-sharing.js`, 4h scan wired into proactive; +6 tests       | 3        |
| 2026-04-19 | docs/PROGRESS.md refreshed — Phase 3 work log, updated test counts, fixed-in-Phase-3 bugs table, new Next Work Session                      | —        |
| 2026-04-19 | Repo pushed to `github.com/Ikem-Emmanuel/Anton` (public) — pre-push hook grandfathered 4 pre-existing attribution SHAs                      | —        |
| 2026-04-19 | **PR #1 MERGED** — Phase 3 (8 commits) → `phase4/web-ui` via merge commit `4300627`; source branch deleted                                  | 3        |
|            | **PHASE 3 COMPLETE.** NEXT: consider `phase4/web-ui` → `main` PR, or start Phase 5/6, or pick up deferred follow-ups.                       | —        |

---

## 15. Canonical References

- `docs/BRAIN-V2.1-PLAN.md` — revised architecture + Phase 2.5 fixes (historical; code now ahead of plan in places)
- `docs/ARCHITECTURE-BRAIN.md` — original Phase 1 design (historical)
- `docs/DESIGN-PROMPT.md` — web + mobile design brief
- `src/brain/*` — current implementation (branch `phase4/web-ui`)
- `src/memory/*` — SQLite, skills, user_model, spotlighting
- `tests/brain.eval.ts` — routing eval harness (Phase 2.5 §3.8) — **NOT YET CREATED**
- `data/brain/anton.db` — SQLite memory (WAL mode, FTS5)

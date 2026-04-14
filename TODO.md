# Anton Brain V2 — Master TODO

> Local LLM as the operating system. Claude for code and smart tasks.
> Timeline: 12 weeks. Current hardware: 16GB Mac. Target: Mac Studio M4 Max 64GB.

---

## Current Status

### What's Built (V1 — Claude Agent SDK)

- [x] 27-agent team with Slack + Web interface
- [x] Notification system (P0-P3 severity tiers)
- [x] System watcher (CPU/MEM/DISK/battery monitoring)
- [x] Morning briefing (scheduled daily push)
- [x] Event bus + priority engine (23 rules)
- [x] Three-tier trust model (Auto/Anton Decides/Noel Approves)
- [x] Hash-chained SQLite audit log
- [x] Smart handoff detection (vocative, delegation, referral patterns)
- [x] Context manager (memory injection, smart model routing)
- [x] Web chat UI (localhost:3000, agent routing, images, markdown)
- [x] Channel switching (ANTON_CHANNELS=web,slack)
- [x] 421 tests passing

### What's Wrong (V1 Gaps — From Architecture Audit)

- [ ] JSON memory has zero crash safety, zero concurrency, zero indexing
- [ ] No LoRA evaluation gate (model can silently degrade)
- [ ] Ollama unauthenticated (CVE-2025-63389)
- [ ] No CI/CD integration for agent-generated PRs
- [ ] No retry cap on QA (infinite loop risk)
- [ ] No rollback strategy for failed deploys
- [ ] Regex-based routing (300+ lines, brittle, doesn't scale)
- [ ] Memory written but never read back into sessions
- [ ] All processing through Claude (100% paid)
- [ ] No voice, no mobile, no finance module
- [ ] No self-training capability

---

## V2 Implementation Plan

### Phase 0: Foundation (Week 1)

> Dev environment, Ollama, Docker, Obsidian vault

- [ ] Install Ollama natively (`brew install --cask ollama`)
- [ ] Pull models: `qwen3:8b`, `qwen2.5-coder:7b`, `nomic-embed-text`
- [ ] Verify MLX backend (Ollama 0.19+)
- [ ] Init TypeScript project with Zod, Mastra
- [ ] Docker Compose: Redis, ChromaDB, Nginx, Langfuse
- [ ] Create `config/models.ts` with model routing config
- [ ] Create `config/agents/` with Zod-validated agent schemas
- [ ] Set up Langfuse for observability from day 1
- [ ] Init Obsidian vault at `~/vault/` with PARA structure
- [ ] Install kepano/obsidian-skills
- [ ] Create note templates (daily, meeting, decision, research)
- [ ] Symlink vault into project
- [ ] Health check script for all services
- [ ] Bind Ollama to localhost only (CVE-2025-63389 fix)

### Phase 1: Brain Core + Routing (Week 2)

> Local LLM replaces all regex. Claude kept for code via model switching.

- [ ] Build `src/brain.ts` — Ollama client with structured JSON output
- [ ] Build system prompt for intent classification
- [ ] Build `src/router.ts` — intent -> model -> agent routing
- [ ] Implement circuit breaker for Ollama failures
- [ ] Wire brain into message pipeline (brain processes first)
- [ ] Keep regex as fallback (confidence < 70%)
- [ ] Build Claude CLI fallback (`claude -p` wrapper)
- [ ] **Model switching**: brain decides local vs Claude per task
  - Simple Q&A, routing, memory -> local (free)
  - Code generation, complex analysis -> Claude (subscription)
  - Research, web search -> Claude with tools
- [ ] **Adaptive thinking**: brain adjusts response depth based on complexity
  - Short questions -> concise local response
  - Complex questions -> deeper reasoning, may escalate to Claude
- [ ] Add Langfuse tracing to every brain call
- [ ] 50+ routing test cases
- [ ] A/B test: brain vs regex (log both, compare accuracy)

### Phase 2: Memory System (Weeks 3-4)

> SQLite + ChromaDB + LightRAG + Obsidian vault

**Week 3: SQLite + Conversation Memory**

- [ ] SQLite schema: memories, conversations, tasks, training_data (WAL mode)
- [ ] Build `src/memory/sqlite.ts` with ACID transactions
- [ ] Migrate existing Markdown memories to SQLite
- [ ] Auto-summarize after every conversation
- [ ] Cache Claude results for future reference
- [ ] FTS5 keyword search
- [ ] Wire memory into brain (context injection before every response)

**Week 4: RAG + Knowledge Graph + Vault**

- [ ] ChromaDB RAG pipeline with hybrid search (BM25 + vector + reranker)
- [ ] Document chunking (512 tokens, 50 overlap)
- [ ] Reranking with cross-encoder
- [ ] Index codebase + vault into ChromaDB
- [ ] LightRAG knowledge graph (entity relationships)
- [ ] Hourly entity extraction cron
- [ ] Obsidian vault read/write with proper frontmatter + wikilinks
- [ ] Vault file watcher (chokidar -> real-time RAG reindexing)
- [ ] Auto-generate daily notes (morning briefing)
- [ ] Auto-generate weekly reviews
- [ ] Git commit vault changes daily
- [ ] **Memory injection scanning** (prompt injection prevention)
- [ ] **Spotlighting** (untrusted input wrapped in DATA tags)

### Phase 3: Agent Framework (Weeks 5-6)

> 26 agents on local models. Claude for code tasks via model switching.

**Week 5: Execution Engine**

- [ ] Migrate 26 agent definitions to `config/agents/*.ts`
- [ ] Build agent executor (Ollama + Claude fallback)
- [ ] Redis Pub/Sub with HMAC-SHA256 signed messages
- [ ] SDLC handoff chain (PM -> Architect -> Dev -> QA -> DevOps)
- [ ] BullMQ task queue with checkpointing
- [ ] Job recovery (resume from checkpoint after crash)

**Week 6: SDLC Pipeline**

- [ ] PRD generation (PM agent -> local model)
- [ ] Plan mode (3 options, user selects)
- [ ] Asana ticket creation
- [ ] GitHub PR creation (Developer -> branch -> PR)
  - **Code tasks use Claude** via model switching (not local)
- [ ] QA review flow (max 3 retries -> human escalation)
- [ ] Deploy flow (staging -> smoke test -> production)
- [ ] CI/CD gate (mandatory before merge)
- [ ] PR size guard (>500 lines -> flag for human review)

### Phase 4: API + Voice + Mobile (Weeks 7-8)

> Access Anton from anywhere

**Week 7: API + Voice**

- [ ] REST API with JWT auth
- [ ] WebSocket server for real-time events
- [ ] Nginx SSL termination + rate limiting
- [ ] Cloudflare Tunnel for remote access
- [ ] Voice: Whisper.cpp STT (local)
- [ ] Voice: Piper TTS (local)
- [ ] Voice: OpenWakeWord ("Hey Anton")
- [ ] Full voice loop: mic -> STT -> brain -> TTS -> speaker

**Week 8: Mobile App**

- [ ] React Native + Expo project
- [ ] Chat screen (WebSocket to Anton)
- [ ] Dashboard screen (sprint status, agent activity)
- [ ] Voice screen (push-to-talk)
- [ ] Offline mode
- [ ] Push notifications
- [ ] Biometric auth (FaceID / Touch ID)

### Phase 5: Hardware Upgrade (Weeks 9-10)

> Mac Studio arrives. Scale to 70B. Push to 95%+ local.

- [ ] Set up Mac Studio (macOS, Ollama, Docker)
- [ ] Pull: `qwen3:70b`, `qwen2.5-coder:32b`
- [ ] Update `config/models.ts` (one-line change)
- [ ] Migrate data (SQLite, ChromaDB, Redis)
- [ ] Run full benchmark suite
- [ ] Compare 70B vs 8B quality
- [ ] Reduce Claude fallback threshold
- [ ] Monitor Claude fallback rate for 1 week

### Phase 6: Self-Training (Weeks 10-11)

> Anton learns from every interaction

- [ ] Training data collector (auto-log every interaction)
- [ ] Quality signal detector (positive/negative from feedback)
- [ ] DPO pair generator (user edits -> chosen/rejected)
- [ ] Evaluation benchmark suite (100+ test cases)
- [ ] **Mandatory evaluation gate** (reject regressing adapters)
- [ ] Idle-time training scheduler (train only when idle)
- [ ] First DPO training run (mlx-lm-lora on Apple Silicon)
- [ ] Weekly training cron
- [ ] Training dashboard in Langfuse

### Phase 7: Finance Module (Weeks 11-12)

> Market analysis as a decision support system

- [ ] Finance Docker container (OpenBB, pandas-ta, FinBERT)
- [ ] Technical analysis pipeline (200+ indicators)
- [ ] Sentiment analysis (FinBERT on news)
- [ ] Fundamental analysis (EdgarTools for SEC filings)
- [ ] Report generation (LLM interprets pre-computed data, never does math)
- [ ] Finance agents (analyst, researcher)
- [ ] Mobile finance dashboard
- [ ] Daily pre-market briefing
- [ ] Disclaimer system on all outputs

### Phase 8: Production Hardening (Week 12+)

> Reliability, monitoring, backup

- [ ] Daily automated backups (SQLite, ChromaDB, vault Git)
- [ ] Monitoring alerts (Ollama down, high latency, disk full)
- [ ] System status dashboard
- [ ] Load test (50 concurrent agent tasks)
- [ ] Security audit (all endpoints, auth flows)
- [ ] Ops runbook
- [ ] Watchtower for Docker auto-updates

---

## Security Checklist

- [ ] Ollama bound to localhost (CVE-2025-63389)
- [ ] HMAC-SHA256 agent message signing
- [ ] Spotlighting on untrusted inputs (DATA tags)
- [ ] LoRA evaluation gate (prevent silent degradation)
- [ ] Training data: positive signals only
- [ ] Max 3 QA retries before human escalation
- [ ] PR merge requires CI/CD pass (never LLM judgment alone)
- [ ] Deterministic validation for critical actions
- [ ] TLS 1.3 on all external traffic
- [ ] Rate limiting (30 req/min API, 5 req/min auth)
- [ ] Docker internal-only network
- [ ] SQLite WAL mode for crash safety

---

## Model Switching Strategy

| Task Type               | Model                      | Why                       |
| ----------------------- | -------------------------- | ------------------------- |
| Routing, classification | local-fast (8B)            | Free, instant             |
| Simple Q&A, memory      | local-fast (8B)            | Free, instant             |
| Complex reasoning       | local-70b                  | Free, deep thinking       |
| **Code generation**     | **Claude Sonnet**          | Best code quality         |
| **Code review**         | **Claude Sonnet**          | Reads and analyzes code   |
| **Web research**        | **Claude Sonnet**          | Tool use for search       |
| **Deep analysis**       | **Claude Opus**            | Highest quality reasoning |
| Math/logic              | local-reason (DeepSeek R1) | Good chain-of-thought     |
| Embeddings              | nomic-embed-text           | Free, local               |

**Key: The local brain decides when to call Claude.** It's not a fallback — it's a deliberate routing decision. "This needs code" -> Claude. "This is a greeting" -> local.

---

## Adaptive Thinking

The brain adjusts response depth based on message complexity:

```
"hey" -> local-fast, 1-2 words, <100ms
"what time is standup?" -> local-fast, one sentence, <200ms
"review the auth architecture" -> local-70b, detailed analysis, <5s
"build a REST API for users" -> route to Claude Sonnet, full implementation
"design the data model for multi-tenancy" -> route to Claude Opus, deep reasoning
```

The brain learns which tasks need which depth by tracking outcomes.

---

## Hardware

| Tier   | Machine                | RAM   | Primary Model                       | Claude Usage |
| ------ | ---------------------- | ----- | ----------------------------------- | ------------ |
| Now    | Mac M-series 16GB      | 16GB  | Qwen 3 8B                           | 20%          |
| Target | Mac Studio M4 Max 64GB | 64GB  | 70B Q4 (tight) or 32B (comfortable) | 5%           |
| Future | Mac Studio 128GB+      | 128GB | 70B + 32B + 8B simultaneously       | 3%           |

---

## Cost

| Current (all Claude) | V2 (local brain + Claude for code) |
| -------------------- | ---------------------------------- |
| $200-2000+/month     | $15-48/month                       |

---

## Progress Log

| Date       | What                                                                                 | Phase    |
| ---------- | ------------------------------------------------------------------------------------ | -------- |
| 2026-04-14 | V1 built: notify, watcher, briefing, events, trust, audit, handoffs, context, web UI | V1       |
| 2026-04-14 | Architecture V2 researched and documented by Noel                                    | Planning |
| 2026-04-14 | Implementation plan V2 created (8 phases, 12 weeks)                                  | Planning |
| 2026-04-14 | Hardware decision: Mac Studio M4 Max 64GB ordered                                    | Hardware |
|            |                                                                                      |          |

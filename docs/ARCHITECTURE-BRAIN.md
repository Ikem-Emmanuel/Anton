# Anton Brain Architecture — Local LLM as the Operating System

> The local LLM IS Anton. Claude is a tool Anton uses when he needs heavy lifting.

## Vision

Anton today is a router that passes messages to Claude sessions. Anton tomorrow is an intelligent local AI that thinks, remembers, learns, and acts — calling Claude only when the task exceeds local capability.

```
Today:  User -> regex router -> Claude session -> response
Tomorrow: User -> Local LLM (Anton's brain) -> response (80% of the time)
                                              -> Claude (20%, complex tasks)
                                              -> tools (web, files, APIs)
                                              -> memory (learn and recall)
```

---


## System Architecture

```
                          +-----------------------+
                          |      Noel (User)       |
                          +----------+------------+
                                     |
                          +----------v------------+
                          |    Input Channels       |
                          |  Web UI | Slack | Voice |
                          +----------+------------+
                                     |
                    +----------------v-----------------+
                    |                                    |
                    |    ANTON BRAIN (Local LLM 7-8B)    |
                    |    Always running, free, instant    |
                    |                                    |
                    |  +------------------------------+  |
                    |  |  Intent Classifier            |  |
                    |  |  "Is this simple or complex?" |  |
                    |  +------+-----------+-----------+  |
                    |         |           |               |
                    |    Simple      Complex         Tool Use
                    |         |           |               |
                    |  +------v------+ +--v-----------+ +--v----------+
                    |  | Handle      | | Route to     | | Execute     |
                    |  | Locally     | | Claude       | | Tools       |
                    |  | (free)      | | (paid)       | | (local)     |
                    |  +-------------+ +--------------+ +-------------+
                    |                                    |
                    |  +------------------------------+  |
                    |  |  Memory Manager               |  |
                    |  |  - Conversation history        |  |
                    |  |  - User preferences            |  |
                    |  |  - Agent knowledge base         |  |
                    |  |  - Task patterns                |  |
                    |  +------------------------------+  |
                    |                                    |
                    |  +------------------------------+  |
                    |  |  Agent Coordinator             |  |
                    |  |  - Handoff detection (NLU)     |  |
                    |  |  - Team routing                |  |
                    |  |  - Group chat management        |  |
                    |  |  - Task delegation              |  |
                    |  +------------------------------+  |
                    |                                    |
                    |  +------------------------------+  |
                    |  |  Self-Training Pipeline        |  |
                    |  |  - Collect conversation data   |  |
                    |  |  - Learn Noel's patterns       |  |
                    |  |  - LoRA fine-tune weekly        |  |
                    |  |  - Improve over time            |  |
                    |  +------------------------------+  |
                    |                                    |
                    +-----------------------------------+
                                     |
              +----------------------+----------------------+
              |                      |                      |
     +--------v--------+   +--------v--------+   +--------v--------+
     | Claude Sonnet    |   | Claude Opus     |   | Tool Services   |
     | Code, analysis,  |   | Deep reasoning, |   | Web search,     |
     | research, review |   | strategy,       |   | file ops,       |
     |                  |   | complex tasks   |   | APIs, git,      |
     |  Called by brain  |   | Rare, expensive |   | PM2, system     |
     +------------------+   +-----------------+   +-----------------+
```

---

## The Three Layers

### Layer 1: Anton Brain (Local LLM)

**What it is:** A 7-8B parameter model running locally via Ollama. Always on, zero cost per call, ~50 tokens/sec on Apple Silicon.

**Recommended models (pick one):**

| Model                       | Why                                    | Download                       |
| --------------------------- | -------------------------------------- | ------------------------------ |
| Llama 3.1 8B Instruct       | Best all-rounder, great tool use       | `ollama pull llama3.1:8b`      |
| Qwen2.5-7B Instruct         | Best at structured JSON output         | `ollama pull qwen2.5:7b`       |
| DeepSeek-R1-Distill-Qwen-7B | Strongest reasoning for the size       | `ollama pull deepseek-r1:7b`   |
| Qwen2.5-Coder-7B            | Best if you want local code capability | `ollama pull qwen2.5-coder:7b` |

**What it handles (free, instant):**

1. **All conversation routing** — understands who should handle what, no regex
2. **Handoff detection** — "Elena, can you jump in?" detected naturally
3. **Simple Q&A** — "What time is standup?", "Who's on the engineering team?"
4. **Memory operations** — summarize conversations, store facts, retrieve context
5. **Morning briefings** — generate the daily briefing text locally
6. **Intent classification** — task, question, delegation, approval, status
7. **Agent coordination** — manage group chats, track who's working on what
8. **Routine responses** — greetings, acknowledgments, status updates
9. **Task management** — create, assign, track, prioritize
10. **Pattern detection** — "Noel usually checks PRs at 10am"

**What it delegates to Claude:**

- "Build the auth endpoint" -> Claude (code generation)
- "Research React 19 patterns" -> Claude (web research)
- "Review this PR for security issues" -> Claude (deep analysis)
- "Write the investor update email" -> Claude (quality writing)
- "Analyze why the error rate spiked" -> Claude (complex reasoning)

**How it decides:** The brain classifies every input:

```
Input: "hey"
Brain: Simple greeting -> handle locally -> "Hey. What's up?"

Input: "who's on the engineering team?"
Brain: Knowledge query -> check memory -> respond locally

Input: "build a REST API for user management"
Brain: Complex code task -> delegate to Claude Sonnet -> get result -> store in memory

Input: "can you reach out to Elena about the interview?"
Brain: Handoff request -> route to Elena -> coordinate response

Input: "what happened in yesterday's sprint?"
Brain: Memory query -> check logs + summaries -> respond locally

Input: "research the best auth patterns for 2026"
Brain: Research task -> delegate to Claude with web tools -> get result -> summarize -> store
```

### Layer 2: Claude (Smart Worker)

**What it is:** Anthropic's Claude API, called on-demand for tasks the local model can't handle well.

**Model selection per task:**

| Task Type             | Model  | Why                               |
| --------------------- | ------ | --------------------------------- |
| Code generation       | Sonnet | Good balance of speed and quality |
| Code review           | Sonnet | Reads and analyzes code           |
| Web research          | Sonnet | Tool use for web search           |
| Deep analysis         | Opus   | Complex multi-step reasoning      |
| Strategy and planning | Opus   | Highest quality thinking          |
| Email/content writing | Sonnet | Quality writing                   |
| Quick classification  | Haiku  | When local model is overloaded    |

**How it's called:**

```javascript
// The brain decides to call Claude
const result = await callClaude({
  model: "sonnet", // or 'opus' for hard tasks
  task: "code",
  prompt: "Build a REST API for user management with JWT auth...",
  context: brain.getRelevantMemory(prompt),
  tools: ["Read", "Write", "Edit", "Bash", "WebSearch"],
});

// Brain processes the result
brain.storeMemory("task", result.summary);
brain.respondToUser(result.response);
```

### Layer 3: Tool Services

**Available tools the brain can use directly:**

| Tool            | How                    | Cost      |
| --------------- | ---------------------- | --------- |
| File read/write | Node.js fs             | Free      |
| Web search      | Brave/DuckDuckGo API   | Free tier |
| Git operations  | simple-git             | Free      |
| System info     | systeminformation      | Free      |
| PM2 control     | pm2 API                | Free      |
| Asana           | REST API               | Free      |
| Slack           | Bolt API               | Free      |
| Calendar        | osascript / Google API | Free      |

---

## Memory Architecture

The brain manages all memory. No more flat Markdown files — structured, searchable, learnable.

```
data/brain/
  memory/
    conversations/        # Conversation summaries per agent
      marcus-2026-04-14.json
      elena-2026-04-14.json
    knowledge/            # Facts the brain has learned
      team-structure.json
      noel-preferences.json
      project-context.json
      common-tasks.json
    patterns/             # Learned behavioral patterns
      daily-routines.json
      task-patterns.json
      communication-style.json
    training/             # Fine-tuning data
      good-examples.jsonl   # Curated training pairs
      trajectories.jsonl    # Raw conversation logs
      rewards.jsonl         # What Noel liked/disliked
```

**Memory operations the brain performs:**

1. **After every conversation:** Summarize and store key facts
2. **After every Claude call:** Store the result for future reference
3. **Daily:** Consolidate the day's learnings
4. **Weekly:** Run LoRA fine-tune on collected data
5. **On query:** Retrieve relevant memory for context injection

---

## Self-Training Pipeline

The brain improves over time by learning from Noel.

### Data Collection (Automatic)

Every conversation is logged:

```json
{
  "input": "what should I focus on today?",
  "output": "Sprint 8 has 3 tasks in progress. James is blocked on the API contract...",
  "rating": null,
  "source": "anton-brain",
  "timestamp": "2026-04-14T10:30:00Z"
}
```

### Quality Signals

How the brain knows what's good:

- **Positive:** Noel follows the suggestion, says "thanks", "perfect", "do that"
- **Negative:** Noel corrects the response, says "no", "wrong", reroutes to Claude
- **Neutral:** No feedback

### Training Loop

```
Week 1: Base model (Llama 3.1 8B) handles 60% of messages
         Collects 500+ conversation pairs
         30% get implicit positive signal

Week 2: LoRA fine-tune on positive examples
         Model now knows Noel's greeting style, common questions
         Handles 70% of messages

Week 4: Second fine-tune with 2000+ pairs
         Model knows team structure, project context, Noel's priorities
         Handles 80% of messages

Month 2: Model knows most routine patterns
          Handles 90% of messages
          Claude called only for genuinely new/complex tasks
```

### LoRA Fine-Tuning (Local, on Mac)

```bash
# Using unsloth or similar (runs on Apple Silicon)
python train.py \
  --base-model meta-llama/Llama-3.1-8B-Instruct \
  --data data/brain/training/good-examples.jsonl \
  --lora-rank 16 \
  --epochs 3 \
  --output models/anton-v2

# Then load in Ollama
ollama create anton-brain -f Modelfile
```

**Training time:** ~30-60 minutes on M-series Mac for a LoRA adapter.

---

## Communication Flow (Replaces All Regex)

### Before (Current — Regex)

```
Message arrives
  -> 39 keyword patterns in router.js
  -> 5 intent patterns in handle.js
  -> 60+ delegation verbs in handoff.js
  -> 35+ past-tense patterns
  -> 22 referral patterns
  -> vocative detection
  -> @mention detection
  -> HANDOFF_RULES static allowlist
  -> result: maybe routes correctly
```

### After (Brain)

```
Message arrives
  -> brain.process(message)
  -> brain returns JSON:
     {
       "intent": "delegation",
       "handle_locally": false,
       "route_to": "Elena",
       "handoffs": [{"agent": "Elena", "message": "Prep for interview with Noel"}],
       "needs_claude": false,
       "response": "Routing to Elena — she'll prep the interview doc."
     }
  -> system dispatches based on structured output
```

**One call replaces 300+ lines of regex.** Adding a new agent = update team.js. The brain figures out routing from the team description.

---

## API Design

### brain.js — The Core Module

```javascript
import { Brain } from "./brain.js";

const brain = new Brain({
  model: "llama3.1:8b", // Ollama model name
  ollamaUrl: "http://localhost:11434",
  memoryDir: "data/brain/memory",
  team: TEAM, // From team.js
  systemPrompt: ANTON_SYSTEM_PROMPT,
});

// Process any message
const result = await brain.process({
  text: "ask Elena to prep for the interview",
  from: "Noel",
  channel: "web",
  context: brain.getRecentContext(),
});

// result.intent        = 'delegation'
// result.handleLocally = false
// result.routeTo       = 'Elena'
// result.handoffs      = [{ agent: 'Elena', message: '...' }]
// result.needsClaude   = false
// result.response      = 'Routing to Elena...'

// Simple query — handled locally
const result2 = await brain.process({
  text: "what time is standup?",
  from: "Noel",
});
// result2.handleLocally = true
// result2.response      = 'Standup is at 8:30 AM daily.'

// Complex task — delegates to Claude
const result3 = await brain.process({
  text: "build a REST API for user management",
  from: "Noel",
});
// result3.needsClaude   = true
// result3.claudeModel   = 'sonnet'
// result3.claudePrompt  = '...'  // enriched with memory context
```

### Memory API

```javascript
// Store a fact
brain.remember("fact", "Noel prefers morning standups at 8:30 AM");

// Store a conversation summary
brain.remember("conversation", {
  agent: "Marcus",
  summary: "Discussed auth architecture. Decision: JWT with refresh tokens.",
  date: "2026-04-14",
});

// Retrieve relevant memory
const context = brain.recall("auth architecture");
// Returns relevant facts, conversations, and patterns

// Learn from feedback
brain.feedback({
  input: "what should I focus on?",
  output: "Check the 3 blocked tasks in sprint 8.",
  rating: "positive", // Noel said "perfect"
});
```

### Training API

```javascript
// Export training data
brain.exportTrainingData("data/brain/training/batch-001.jsonl");

// Trigger fine-tune (runs locally)
await brain.fineTune({
  data: "data/brain/training/batch-001.jsonl",
  epochs: 3,
  loraRank: 16,
});

// Load fine-tuned model
brain.loadModel("anton-brain-v2");
```

---

## Implementation Plan

### Phase A: Foundation (Week 1)

1. Install Ollama + pull base model
2. Build `src/brain.js` — Ollama client with structured output
3. Build the system prompt for Anton's brain
4. Wire into index.js — brain processes all messages first
5. Brain handles simple queries locally, routes complex to Claude
6. Replace `router.js` regex with brain routing
7. Replace `handoff.js` regex with brain handoff detection

### Phase B: Memory (Week 2)

1. Build `data/brain/memory/` structure
2. After every conversation, brain summarizes and stores
3. Before every response, brain retrieves relevant context
4. Replace flat Markdown memory with structured JSON
5. Add memory search (keyword + semantic via embeddings)
6. Wire memory into Claude calls (inject context)

### Phase C: Self-Training (Week 3)

1. Collect conversation data in JSONL format
2. Detect positive/negative signals from Noel's responses
3. Build training data curation pipeline
4. First LoRA fine-tune on collected data
5. A/B test: base model vs fine-tuned on held-out examples
6. Set up weekly training cron job

### Phase D: Advanced Capabilities (Week 4)

1. Brain uses tools directly (web search, file read, git)
2. Brain generates its own tasks ("I should check the deploy status")
3. Brain detects patterns ("Noel checks PRs every morning at 10am")
4. Brain proactively suggests ("You have 3 PRs waiting — want me to summarize?")
5. Group chat coordination (brain manages multi-agent conversations)
6. Brain-to-brain: if multiple instances, they coordinate

---

## Cost Comparison

### Current (All Claude)

| Operation       | Model  | Cost per call | Daily calls | Daily cost    |
| --------------- | ------ | ------------- | ----------- | ------------- |
| Every message   | Sonnet | ~$0.01-0.05   | 100         | $1-5          |
| Agent sessions  | Sonnet | ~$0.05-0.20   | 50          | $2.50-10      |
| Handoff routing | Sonnet | ~$0.01-0.05   | 30          | $0.30-1.50    |
| **Total**       |        |               |             | **$4-17/day** |

### Proposed (Local Brain + Claude)

| Operation              | Model    | Cost per call | Daily calls | Daily cost      |
| ---------------------- | -------- | ------------- | ----------- | --------------- |
| Routing/classification | Local 7B | $0            | 100         | $0              |
| Simple Q&A             | Local 7B | $0            | 60          | $0              |
| Handoffs               | Local 7B | $0            | 30          | $0              |
| Memory ops             | Local 7B | $0            | 50          | $0              |
| Complex tasks          | Sonnet   | ~$0.05-0.20   | 15          | $0.75-3         |
| Deep research          | Opus     | ~$0.10-0.50   | 3           | $0.30-1.50      |
| **Total**              |          |               |             | **$1-4.50/day** |

**Savings: 60-75% reduction in API costs.**

---

## Hardware Requirements

### Minimum (your current setup)

- Mac with M-series chip (you have this)
- 16GB RAM (you have this)
- ~10GB free disk for model + data
- Ollama installed

### Recommended for best experience

- 32GB RAM (run 14B model + Chrome + VS Code comfortably)
- Or: close Chrome tabs when running Anton (frees 3GB)

### Model RAM usage

| Model      | Quantization | RAM needed | Speed     |
| ---------- | ------------ | ---------- | --------- |
| 7B Q4_K_M  | 4-bit        | ~5GB       | ~50 tok/s |
| 7B Q5_K_M  | 5-bit        | ~6GB       | ~45 tok/s |
| 7B Q8_0    | 8-bit        | ~8GB       | ~35 tok/s |
| 14B Q4_K_M | 4-bit        | ~9GB       | ~25 tok/s |

---

## Key Design Decisions

### 1. Ollama over llama.cpp directly

Ollama wraps llama.cpp with an HTTP API, model management, and auto-loading. No need to manage GGUF files manually. The OpenAI-compatible API at `localhost:11434` means any tool that works with OpenAI also works with Anton's brain.

### 2. Structured JSON output over free text

The brain always returns JSON. This makes routing deterministic:

```json
{
  "intent": "task",
  "complexity": "complex",
  "handleLocally": false,
  "needsClaude": true,
  "claudeModel": "sonnet",
  "agents": ["James"],
  "response": "This needs James. Routing to him with context.",
  "memoryUpdate": {
    "type": "task_assigned",
    "agent": "James",
    "task": "REST API"
  }
}
```

### 3. LoRA over full fine-tuning

LoRA (Low-Rank Adaptation) modifies ~1-2% of model weights. Benefits:

- Trains in 30-60 min on a Mac
- Adapter is ~50MB (vs 5GB for full model)
- Can stack multiple adapters (one for style, one for knowledge)
- Easy to revert if training goes wrong

### 4. Memory in JSON over SQLite for the brain

The brain's memory is JSON files, not SQLite. Reasons:

- The LLM reads/writes JSON natively
- Files are version-controllable
- Easy to inspect, edit, backup
- SQLite stays for audit log (structured queries needed there)

### 5. Gradual migration, not big bang

The brain doesn't replace everything on day 1:

- Week 1: Brain handles routing only (regex as fallback)
- Week 2: Brain handles simple Q&A + memory
- Week 3: Brain handles most conversations
- Week 4: Brain is primary, Claude is secondary

---

## Risks and Mitigations

| Risk                            | Mitigation                                               |
| ------------------------------- | -------------------------------------------------------- |
| 7B model gives bad routing      | Keep regex as fallback, A/B test, log accuracy           |
| Fine-tuning makes model worse   | Always keep base model, eval before deploying            |
| Ollama crashes/hangs            | Health check + auto-restart via PM2, fall back to Claude |
| RAM pressure (16GB tight)       | Monitor with watcher, alert when brain is slow           |
| Model hallucinates team members | Validate all agent names against TEAM before dispatch    |
| Training data quality           | Only train on positive-signal conversations              |

---

## Files to Create/Modify

### New files

```
src/brain.js            — Core local LLM interface (Ollama client)
src/brain.test.js       — Tests
src/brain-prompt.js     — System prompt for the brain
src/brain-memory.js     — Memory manager for the brain
src/brain-training.js   — Training data collection + fine-tune trigger
data/brain/             — Brain's memory and training data
scripts/train-brain.js  — Manual fine-tuning script
scripts/test-brain.js   — Manual brain test
```

### Modified files

```
index.js                — Wire brain as the primary processor
src/router.js           — Brain replaces regex routing (keep as fallback)
src/handoff.js          — Brain replaces pattern matching (keep as fallback)
src/sessions.js         — Brain injects memory context
src/context.js          — Brain manages context instead of static injection
```

### Removed (eventually)

```
src/handoff.js          — 300+ lines of regex, replaced by one brain call
src/router.js           — 39 keyword patterns, replaced by brain routing
classifyIntent()        — 5 static patterns, replaced by brain classification
```

---

## Questions to Decide Before Building

1. **Which base model?** Llama 3.1 8B (best all-round) or Qwen2.5-7B (best JSON output)?
2. **When to start?** Now (parallel to remaining phases) or after Phase 4?
3. **Training priority?** Start collecting data immediately, or wait for enough conversations?
4. **RAM budget?** Are you willing to close Chrome when running Anton, or should we target a smaller model (3B)?
5. **Voice for the brain?** Should the local model also handle TTS routing (Phase 7)?

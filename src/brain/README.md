# Brain

> The intelligence layer. Thinks, decides, routes, and adapts.

## What It Does

The brain is Anton's central intelligence. Every message passes through the brain first. It classifies intent, decides which model handles the task, routes to the right agent, and adapts its response depth based on complexity.

```
Message arrives
  -> brain.classify()     Intent + complexity + confidence
  -> brain.route()        Which model? Which agent? Local or Claude?
  -> brain.think()        Generate response (or delegate)
  -> brain.learn()        Store outcome for future improvement
```

## Responsibilities

| Function              | Description                                                             |
| --------------------- | ----------------------------------------------------------------------- |
| Intent classification | "Is this a task, question, delegation, greeting, or finance query?"     |
| Complexity assessment | "Simple (local-fast), complex (local-70b), or extreme (Claude)?"        |
| Model routing         | "Which model handles this? 8B, 32B, 70B, coder, or Claude?"             |
| Adaptive thinking     | Short questions get short answers. Complex questions get deep analysis. |
| Confidence scoring    | 0.0-1.0 confidence on every decision. Below 0.70 triggers fallback.     |
| Agent selection       | "Which of the 26 agents is best for this request?"                      |

## How It Communicates

### Receives from:

- **Spine** (queue) — incoming messages from all channels (web, Slack, voice, mobile)
- **Memory** — context injection before every response
- **Nervous** (event bus) — system events that need brain attention

### Sends to:

- **Hands** (executor) — "execute this task with model X"
- **Memory** — "store this conversation summary"
- **Nervous** (event bus) — "I classified this as a delegation, dispatch handoff"
- **Heart** (notify) — "this is urgent, alert Noel"

### Message format:

```typescript
interface BrainDecision {
  intent:
    | "task"
    | "question"
    | "delegation"
    | "approval"
    | "status"
    | "greeting"
    | "finance";
  complexity: "simple" | "complex" | "extreme";
  confidence: number; // 0.0 - 1.0
  handleLocally: boolean;
  model: "local-fast" | "local-70b" | "local-coder" | "local-reason" | "claude";
  agent: string | null; // agent ID or null (brain handles directly)
  adaptiveDepth: "minimal" | "standard" | "detailed" | "deep";
  memoryContext: string[]; // relevant memories injected
}
```

## How It Scales

| Hardware         | Brain Model  | Speed     | Capability                    |
| ---------------- | ------------ | --------- | ----------------------------- |
| 16GB Mac         | qwen3:8b Q4  | ~50 tok/s | Basic routing, simple Q&A     |
| 64GB Mac Studio  | qwen3:32b Q4 | ~35 tok/s | Complex reasoning, most tasks |
| 128GB Mac Studio | qwen3:70b Q4 | ~25 tok/s | Near-Claude reasoning locally |

Scaling is a config change in `config/models.ts`. No code changes.

## Adaptive Thinking

The brain doesn't give every message the same treatment:

```
"hey"                          -> minimal: 1-2 words, <100ms
"what time is standup?"        -> standard: one sentence, <200ms
"review the auth architecture" -> detailed: multi-paragraph, <5s
"build a REST API for users"   -> deep: route to Claude, full implementation
```

The brain learns which depth works for which patterns by tracking user satisfaction signals (did Noel follow the suggestion? did he correct it?).

## Model Switching

The brain decides when to use Claude vs local:

```
Local (free):     greetings, routing, status, simple Q&A, memory queries
Claude (paid):    code generation, code review, web research, deep analysis
```

This is not a fallback — it's a deliberate routing decision. The brain knows that code tasks need Claude's quality.

## Dependencies

- Ollama (localhost:11434) for local inference
- Memory organ for context injection
- Nervous organ for event dispatch
- Config: `config/models.ts`, `config/prompts/`

## Files

```
src/brain/
  README.md          This file
  brain.ts           Core orchestrator — classify, route, think
  classifier.ts      Intent classification logic
  router.ts          Model and agent routing
  adaptive.ts        Response depth scaling
  fallback.ts        Claude CLI wrapper (claude -p)
  brain.test.ts      Tests
```

## Configuration

```typescript
// config/models.ts
export const models = {
  "local-fast": { model: "qwen3:8b", maxTokens: 2048 },
  "local-70b": { model: "qwen3:70b", maxTokens: 4096 },
  "local-coder": { model: "qwen2.5-coder:32b", maxTokens: 8192 },
  "local-reason": { model: "deepseek-r1:14b", maxTokens: 4096 },
  claude: { command: "claude -p", model: "sonnet" },
};
```

## Testing

```bash
npm test -- src/brain/         # Unit tests
node scripts/test-brain.js     # Manual routing test
```

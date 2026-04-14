# Anton — Organ System

> Anton is built like a body. Each organ has one job, communicates through defined interfaces, and scales independently.

## The Organs

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│    ┌──────────┐     ┌──────────┐     ┌──────────┐                  │
│    │  BRAIN   │────>│  HANDS   │────>│ External │                  │
│    │ thinks   │     │ executes │     │ Services │                  │
│    │ routes   │     │ controls │     │ (Claude, │                  │
│    │ decides  │<────│ audits   │<────│  GitHub, │                  │
│    └────┬─────┘     └────┬─────┘     │  Asana)  │                  │
│         │                │           └──────────┘                  │
│         │                │                                          │
│    ┌────v────────────────v──────────────────────┐                  │
│    │              NERVOUS SYSTEM                 │                  │
│    │    event bus + handoffs + agent comms        │                  │
│    └────┬──────────┬──────────┬──────────┬──────┘                  │
│         │          │          │          │                          │
│    ┌────v─────┐ ┌──v───┐ ┌───v──┐ ┌────v─────┐                   │
│    │  MEMORY  │ │ HEART│ │ EYES │ │  VOICE   │                   │
│    │ stores   │ │ beats│ │ sees │ │ listens  │                   │
│    │ recalls  │ │ alerts│ │ senses│ │ speaks  │                   │
│    │ learns   │ │ briefs│ │ reads │ │ wakes   │                   │
│    └──────────┘ └──────┘ └──────┘ └──────────┘                   │
│                                                                     │
│    ┌────────────────────────────────────────────┐                  │
│    │                 SPINE                        │                  │
│    │    queue + checkpoint + circuit breaker      │                  │
│    │    API + WebSocket + auth + health           │                  │
│    └────────────────────────────────────────────┘                  │
│                                                                     │
│    ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐                 │
│    │  Web   │  │ Slack  │  │ Mobile │  │  Mic/  │                 │
│    │  UI    │  │        │  │  App   │  │Speaker │                 │
│    └────────┘  └────────┘  └────────┘  └────────┘                 │
│                     Channels (input/output)                         │
└─────────────────────────────────────────────────────────────────────┘
```

## Organ Directory

| Organ       | Path           | Purpose                                                                       | README                      |
| ----------- | -------------- | ----------------------------------------------------------------------------- | --------------------------- |
| **Brain**   | `src/brain/`   | Intelligence: LLM routing, classification, model switching, adaptive thinking | [README](brain/README.md)   |
| **Memory**  | `src/memory/`  | Knowledge: SQLite, ChromaDB RAG, LightRAG graph, Obsidian vault               | [README](memory/README.md)  |
| **Nervous** | `src/nervous/` | Communication: event bus, priority engine, handoffs, agent messaging          | [README](nervous/README.md) |
| **Heart**   | `src/heart/`   | Life support: monitoring, alerting, scheduling, briefings, notifications      | [README](heart/README.md)   |
| **Voice**   | `src/voice/`   | Audio: Whisper STT, Piper TTS, wake word, voice pipeline                      | [README](voice/README.md)   |
| **Eyes**    | `src/eyes/`    | Perception: image analysis, environment sensing, screen reading               | [README](eyes/README.md)    |
| **Hands**   | `src/hands/`   | Action: trust tiers, execution, Claude gateway, audit, rollback               | [README](hands/README.md)   |
| **Spine**   | `src/spine/`   | Structure: queue, checkpoints, circuit breaker, API, WebSocket, auth          | [README](spine/README.md)   |

## Communication Rules

1. **Organs never call each other directly.** All communication goes through defined interfaces.
2. **Events go through the nervous system.** If organ A needs to tell organ B something happened, it emits an event.
3. **Tasks go through the spine.** If organ A needs organ B to do work, it queues a task.
4. **Data goes through memory.** If organ A needs to store or retrieve knowledge, it uses the memory interfaces.
5. **The brain is the decision-maker.** Other organs provide data and capabilities; the brain decides what to do with them.

## Data Flow: A Message From Noel

```
1. Noel types "build a REST API for users" in web UI

2. SPINE receives via WebSocket
   -> Validates JWT auth
   -> Enqueues to brain queue

3. BRAIN classifies
   -> Intent: task
   -> Complexity: complex
   -> Model: claude (code task)
   -> Agent: backend-developer
   -> Adaptive depth: deep

4. MEMORY provides context
   -> "Last sprint: auth module shipped"
   -> "Backend uses Fastify + SQLite"
   -> "James is the backend developer"

5. BRAIN routes to HANDS
   -> "Execute this code task via Claude Sonnet"
   -> "Assign to James (backend-developer)"

6. HANDS executes
   -> classifyAction('code:generate') -> Tier 1 (auto)
   -> logAction() -> audit trail
   -> callClaude('Build REST API...', 'sonnet') -> code result

7. NERVOUS emits
   -> 'task:completed' event
   -> 'agent:session:created' for James

8. MEMORY stores
   -> Conversation summary
   -> Code result cached
   -> Vault note: "API endpoint created for users"

9. HEART checks
   -> No alerts triggered
   -> Will include in daily briefing

10. SPINE sends response
    -> WebSocket -> web UI
    -> James's response appears in chat
```

## Data Flow: A P0 Emergency

```
1. HEART watcher detects CPU at 98% for 3 consecutive checks

2. NERVOUS receives event
   -> eventBus.emit('health:cpu:critical', { percent: 98 })

3. NERVOUS priority engine classifies
   -> P0 (emergency)

4. HEART notifies
   -> Slack DM to Noel (red attachment)
   -> Pushover emergency (phone buzzes, repeats until ack)
   -> Web UI notification banner

5. BRAIN evaluates
   -> Standing order: "if CPU > 95%, check what's consuming resources"
   -> Routes to HANDS

6. HANDS executes
   -> Tier 1 (auto): check running processes
   -> Reports: "Chrome using 3GB RAM, Ollama using 2GB"

7. BRAIN suggests
   -> "Chrome is the biggest consumer. Close some tabs?"

8. MEMORY logs
   -> Pattern: "CPU spikes correlate with Chrome tab count"
   -> Training signal: if Noel follows suggestion, positive
```

## Adding a New Organ

To add a new organ (e.g., `src/legs/` for physical robot control):

1. Create `src/legs/` directory
2. Write `README.md` following the same structure (what, how, communicates, scales)
3. Define TypeScript interfaces for the organ's capabilities
4. Register event listeners with the nervous system
5. Add queue workers to the spine if needed
6. Add health check to the spine health aggregator
7. Update this README with the new organ

## Design Principles

1. **Single responsibility** — each organ does one thing well
2. **Loose coupling** — organs communicate through events and queues, not direct imports
3. **Graceful degradation** — if one organ fails, others continue (voice down doesn't break chat)
4. **Observable** — every organ reports health to spine, every action is auditable
5. **Testable** — each organ is independently testable with mocked dependencies
6. **Scalable** — organs can be moved to separate processes or machines without code changes

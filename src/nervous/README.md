# Nervous System

> Communication backbone. Events, handoffs, agent-to-agent messaging.

## What It Does

The nervous system carries signals between all organs and agents. It handles event dispatch, handoff detection, agent-to-agent messaging, and group coordination. Nothing moves in Anton without a nervous signal.

```
Signal originates (watcher detects CPU spike)
  -> nervous.emit('health:cpu:critical', { percent: 95 })
  -> priority engine classifies severity (P1)
  -> heart.notify(P1, message)
  -> web UI receives notification
```

## Responsibilities

| Function           | Description                                                      |
| ------------------ | ---------------------------------------------------------------- |
| Event bus          | Pub/sub for all internal events (health, tasks, deploys, errors) |
| Priority engine    | Maps events to P0-P3 severity, routes to notification system     |
| Handoff detection  | Analyzes agent responses for delegation intent (NLP, not regex)  |
| Agent messaging    | Redis Pub/Sub with HMAC-SHA256 signed messages                   |
| Group coordination | Multi-agent conversations, participant tracking                  |
| Event history      | Last 500 events stored for debugging and status queries          |

## How It Communicates

### The nervous system connects EVERYTHING:

```
Brain  <---->  Nervous  <---->  Heart
  |               |               |
  v               v               v
Hands  <---->  Nervous  <---->  Memory
  |               |               |
  v               v               v
Eyes   <---->  Nervous  <---->  Voice
                  |
                  v
               Spine (queue)
```

Every organ emits events to the nervous system. Every organ listens for events it cares about.

### Event categories:

```
health:*          — system health (CPU, memory, disk, battery)
agent:*           — agent lifecycle (created, stuck, error, completed)
task:*            — task management (assigned, blocked, completed)
handoff:*         — agent delegation (detected, dispatched, received)
deploy:*          — deployment events (started, success, failed, rollback)
pr:*              — pull request events (created, reviewed, merged)
security:*        — security events (alert, blocked action)
training:*        — self-training events (data collected, training started)
user:*            — user events (message, feedback, correction)
```

### Agent message format (Redis Pub/Sub):

```typescript
interface AgentMessage {
  id: string; // UUID
  type: "task" | "handoff" | "result" | "status" | "question";
  from: string; // agent ID
  to: string; // agent ID or 'brain'
  payload: Record<string, any>;
  context: {
    conversationId: string;
    memory: MemoryChunk[];
    parentTaskId?: string;
  };
  signature: string; // HMAC-SHA256(payload, AGENT_SECRET)
  timestamp: string;
}
```

## Handoff Detection

The nervous system detects when an agent wants to involve another agent. Six detection methods, no rigid format required:

| Signal            | Example                           | Confidence |
| ----------------- | --------------------------------- | ---------- |
| Explicit          | `HANDOFF: Elena -- do the thing`  | 1.0        |
| @mention          | `@Elena check this out`           | 0.95       |
| Vocative          | `Elena, can you reach out?`       | 0.92       |
| Direct delegation | `ask Elena to prepare interviews` | 0.90       |
| Future delegation | `I'll ping James`                 | 0.80       |
| Past delegation   | `Pinged Elena about it`           | 0.70       |
| Referral          | `that's Elena's area`             | 0.60       |

60+ delegation verbs, 35+ past-tense forms, 22 referral patterns, vocative detection with em-dash and @mention support.

## How It Scales

- Event bus: in-process Node.js EventEmitter (single machine) -> Redis Pub/Sub (multi-machine)
- Agent messaging: already Redis-based, scales horizontally
- Handoff detection: pure string analysis, O(1) per message, no LLM call needed
- Event history: bounded ring buffer (500 events), no memory growth

## Priority Levels

| Level | Meaning   | Delivery                         | Example                        |
| ----- | --------- | -------------------------------- | ------------------------------ |
| P0    | Emergency | Slack DM + Pushover (phone buzz) | Service crash                  |
| P1    | Urgent    | Slack DM                         | CPU > 85%, PR blocking deploy  |
| P2    | Important | Hourly digest                    | New task assigned, anomaly     |
| P3    | Info      | Morning briefing                 | Task completed, deploy success |

23 event-to-severity rules. Unknown events are logged but not notified.

## Dependencies

- Node.js EventEmitter (in-process events)
- Redis (agent-to-agent messaging when scaled)
- Heart organ (receives priority notifications)
- Brain organ (emits classification events, receives routing decisions)
- All other organs (emit and receive events)

## Files

```
src/nervous/
  README.md           This file
  eventbus.ts         In-process pub/sub with history
  priority.ts         Event -> severity mapping (23 rules)
  handoff.ts          NLP handoff detection (6 signal types)
  comms.ts            Redis Pub/Sub agent messaging (HMAC signed)
  groups.ts           Group conversation management
  nervous.test.ts     Tests
  handoff.test.ts     Handoff detection tests
  priority.test.ts    Priority engine tests
```

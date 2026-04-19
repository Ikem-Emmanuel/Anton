# Spine

> The structural backbone. Queuing, checkpointing, circuit breaking, and resilience.

## What It Does

The spine holds everything together. It manages task queuing (so work doesn't get lost), checkpointing (so crashes don't mean starting over), circuit breaking (so one failure doesn't cascade), and the API layer (so external clients connect reliably). If the brain decides what to do and the hands do it, the spine makes sure nothing falls through the cracks.

```
Task submitted
  -> spine.queue(task)          Add to BullMQ with priority
  -> spine.checkpoint(step)     Save progress after each step
  -> spine.execute(worker)      Worker picks up task
  -> on failure:
     -> spine.circuitBreaker()  Too many failures? Open circuit.
     -> spine.retry(task)       Retry with backoff (max 3)
     -> spine.resume(checkpoint) Crash recovery from last checkpoint
```

## Responsibilities

| Function            | Description                                                     |
| ------------------- | --------------------------------------------------------------- |
| Task queue          | BullMQ + Redis for reliable async task processing               |
| Checkpointing       | Save progress after each pipeline step (survives crashes)       |
| Circuit breaker     | After N failures, stop calling failing service and use fallback |
| Job scheduling      | Cron-like recurring jobs (briefing, consolidation, training)    |
| Retry logic         | Exponential backoff, max attempts, dead letter queue            |
| API gateway         | REST API + WebSocket server for external clients                |
| Authentication      | JWT + refresh tokens for API access                             |
| Rate limiting       | Nginx rate limiting (30 req/min API, 5 req/min auth)            |
| Health endpoint     | `/health` returns status of all organs and services             |
| WebSocket broadcast | Real-time events to web UI and mobile app                       |
| Configuration       | Centralized config loading, hot-reload support                  |

## How It Communicates

### Receives from:

- **All organs** — tasks to queue, status to broadcast
- **External clients** — REST API requests, WebSocket connections
- **Brain** — "queue this multi-step SDLC pipeline"
- **Hands** — "checkpoint after this execution step"

### Sends to:

- **All organs** — dispatches queued tasks to the right organ
- **External clients** — API responses, WebSocket events, health status
- **Heart** (notify) — "circuit breaker opened for Ollama, falling back"
- **Memory** — task state persistence

### Queue architecture:

```
Redis
  ├── bull:anton:brain        Brain classification tasks
  ├── bull:anton:agents       Agent execution tasks
  ├── bull:anton:sdlc         Multi-step SDLC pipeline
  ├── bull:anton:training     Training data processing
  ├── bull:anton:maintenance  Hourly/daily maintenance jobs
  └── bull:anton:deadletter   Failed tasks after max retries
```

### Interfaces:

```typescript
interface Spine {
  // Queue
  enqueue(queue: string, task: Task, options?: JobOptions): Promise<string>;
  getQueueStatus(): Promise<QueueStats>;

  // Checkpointing
  checkpoint(jobId: string, step: string, state: object): void;
  getCheckpoint(jobId: string): Checkpoint | null;
  resumeFromCheckpoint(jobId: string): Promise<void>;

  // Circuit breaker
  isCircuitOpen(service: string): boolean;
  recordSuccess(service: string): void;
  recordFailure(service: string): void;
  getCircuitState(service: string): CircuitState;

  // API
  startAPI(port: number): void;
  broadcast(event: string, data: object): void;

  // Health
  getSystemHealth(): Promise<SystemHealth>;
}

interface CircuitState {
  state: "closed" | "open" | "half-open";
  failures: number;
  lastFailure: string | null;
  cooldownUntil: string | null;
}

interface SystemHealth {
  organs: Record<string, "healthy" | "degraded" | "down">;
  ollama: { status: string; models: string[]; speed: number };
  redis: { status: string; memory: string };
  chromadb: { status: string; documents: number };
  docker: Record<string, "running" | "stopped">;
  uptime: number;
}
```

## Circuit Breaker

Prevents cascading failures when a service goes down:

```
Closed (normal)
  -> 5 consecutive failures
  -> Open (stop calling, use fallback)
  -> Wait 60 seconds cooldown
  -> Half-Open (try one request)
  -> Success? -> Closed (recovered)
  -> Failure? -> Open (still broken)
```

**Fallback chain:**

```
Primary: Ollama local-70b
  -> Fallback 1: Ollama local-8b (smaller, more stable)
  -> Fallback 2: Claude CLI (subscription)
  -> Fallback 3: Cached response from memory
  -> Fallback 4: "I'm having trouble, let me get back to you" + queue for retry
```

## Checkpointing

For multi-step pipelines (SDLC: requirements -> design -> code -> QA -> deploy), each step saves a checkpoint. If Ollama crashes mid-pipeline, the spine resumes from the last completed step.

```typescript
// SDLC pipeline with checkpoints
async function sdlcPipeline(feature: string) {
  const job = await spine.enqueue("sdlc", { feature });

  // Step 1: Requirements
  const prd = await pmAgent.generatePRD(feature);
  spine.checkpoint(job.id, "requirements", { prd });

  // Step 2: Architecture (if crash here, resumes from step 1 checkpoint)
  const design = await architectAgent.design(prd);
  spine.checkpoint(job.id, "architecture", { prd, design });

  // Step 3: Implementation
  const code = await developerAgent.implement(design);
  spine.checkpoint(job.id, "implementation", { prd, design, code });

  // ... QA, deploy
}
```

Checkpoints stored in Redis with 24h TTL. After completion, checkpoint is cleared.

## How It Scales

| Component   | Single machine         | Multi-machine                  |
| ----------- | ---------------------- | ------------------------------ |
| Task queue  | BullMQ + local Redis   | BullMQ + Redis cluster         |
| Workers     | In-process             | Separate worker processes      |
| API         | Single Express/Fastify | Nginx load balancer            |
| WebSocket   | Single server          | Redis adapter for multi-server |
| Checkpoints | Redis single instance  | Redis cluster                  |

On a single Mac Studio, the spine handles hundreds of concurrent tasks. Multi-machine scaling is designed in but not needed until Anton manages multiple projects simultaneously.

## API Layer

### REST Endpoints

```
POST   /api/v1/message          Send a message to Anton
GET    /api/v1/agents           List all agents and status
POST   /api/v1/agents/:id/task  Assign task to specific agent
GET    /api/v1/tasks            List tasks (filtered by status, agent)
GET    /api/v1/health           System health (all organs, services)
GET    /api/v1/audit            Recent audit log entries
POST   /api/v1/approve/:id      Approve a pending action
POST   /api/v1/deny/:id         Deny a pending action
GET    /api/v1/memory/search    Search memory (keyword + semantic)
```

### WebSocket Events

```
Connected:     { type: 'connected', organs: SystemHealth }
Health update: { type: 'health', cpu, mem, disk, battery }
Agent message: { type: 'response', agent, text, timestamp }
Notification:  { type: 'notification', severity, message }
Task update:   { type: 'task:update', taskId, status }
Approval:      { type: 'approval:request', actionType, summary }
```

### Authentication

```
POST /api/v1/auth/login     -> { accessToken, refreshToken }
POST /api/v1/auth/refresh   -> { accessToken }

All other endpoints require: Authorization: Bearer <accessToken>
Tokens: JWT, 15min access, 7d refresh, HMAC-SHA256 signed
```

## BullMQ Configuration

```typescript
// Spine queue config
const queueOptions = {
  connection: { host: "localhost", port: 6379 },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100, // Keep last 100 completed
    removeOnFail: 500, // Keep last 500 failed for debugging
  },
};

// LLM tasks need longer lock duration (default 30s too short)
const llmJobOptions = {
  ...queueOptions.defaultJobOptions,
  lockDuration: 120_000, // 2 minutes (LLM can be slow)
};
```

## Dependencies

- BullMQ (task queue)
- ioredis (Redis client)
- Express or Fastify (API server)
- ws (WebSocket server)
- jsonwebtoken (JWT auth)
- Nginx (SSL termination, rate limiting — Docker)
- All other organs (spine connects them all)

## Files

```
src/spine/
  README.md            This file
  queue.ts             BullMQ queue management
  workers.ts           Task workers per queue type
  checkpoint.ts        Job checkpointing (Redis-backed)
  circuit-breaker.ts   Circuit breaker for service failures
  api.ts               REST API routes
  websocket.ts         WebSocket server + broadcast
  auth.ts              JWT authentication
  health.ts            System health aggregator
  config.ts            Centralized configuration loading
  spine.test.ts        Tests
```

## Configuration

```typescript
// config/spine.ts
export const spineConfig = {
  redis: {
    host: "localhost",
    port: 6379,
    password: process.env.REDIS_PASSWORD,
  },
  api: { port: 3000, corsOrigins: ["http://localhost:3000"] },
  jwt: { secret: process.env.JWT_SECRET, accessTtl: "15m", refreshTtl: "7d" },
  circuitBreaker: { failureThreshold: 5, cooldownMs: 60_000 },
  queues: {
    brain: { concurrency: 5 },
    agents: { concurrency: 3 },
    sdlc: { concurrency: 1 }, // SDLC pipeline is sequential
    training: { concurrency: 1 }, // Training is single-threaded
    maintenance: { concurrency: 2 },
  },
};
```

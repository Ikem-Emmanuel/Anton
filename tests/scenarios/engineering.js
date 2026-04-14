/**
 * engineering.js — 200 deep, realistic Engineering department scenarios (ENG-A through ENG-T).
 *
 * Department: Engineering (7 agents)
 *   marcus  — Tech Lead, architecture, code review, technical decisions. Does NOT write code.
 *   sarah   — Product Manager, sprint planning, Asana tasks, requirements. Does NOT write code.
 *   james   — Backend Dev, Fastify APIs, SQLite, TypeScript. WRITES code.
 *   elena   — Frontend Dev, Next.js 15, React, shadcn/ui, Tailwind, Zustand. WRITES code.
 *   kai     — Mobile Dev, Expo 52, React Native, Expo Router. WRITES code.
 *   priya   — QA Engineer, Vitest, Playwright, test strategy. Writes TEST code only.
 *   omar    — DevOps, PM2, GitHub Actions, PF firewall, SOPS, Tailscale. WRITES infra code.
 *
 * 20 blocks × 10 scenarios = 200 total
 */

export const scenarios = [
  {
    "id": "ENG-A1",
    "block": "ENG-A",
    "blockName": "Backend API Development",
    "title": "CRUD endpoints for agents resource",
    "agentKey": "james",
    "message": "james i need the full CRUD for agents — GET /agents, GET /agents/:id, POST /agents, PATCH /agents/:id, DELETE /agents/:id. all in `packages/backend/src/routes/agents.ts`. use Zod schemas for body validation. make sure DELETE returns 204 and GET list returns paginated results with a `meta` field",
    "tags": [
      "backend",
      "api",
      "crud",
      "fastify",
      "zod"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-A2",
    "block": "ENG-A",
    "blockName": "Backend API Development",
    "title": "Zod schema for agent config payload",
    "agentKey": "james",
    "message": "james the POST /agents body schema in `packages/backend/src/routes/agents.ts` is too loose. i need strict Zod validation: name is 1–100 chars, domain must be one of [\"trading\",\"research\",\"productivity\",\"system\"], model is a non-empty string, config is optional but if present it must match a nested schema. export the inferred TypeScript types too",
    "tags": [
      "backend",
      "zod",
      "validation",
      "typescript"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-A3",
    "block": "ENG-A",
    "blockName": "Backend API Development",
    "title": "Error handler returning typed error shapes",
    "agentKey": "james",
    "message": "james our API is returning raw fastify errors. i want a global error handler in `packages/backend/src/plugins/error-handler.ts` that catches MissionControlError subclasses and maps them to the correct HTTP status + `{ error: { code, message } }` shape. unknown errors should return 500 and log with systemLogger. register it as a fastify plugin",
    "tags": [
      "backend",
      "error-handling",
      "fastify",
      "plugin"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-A4",
    "block": "ENG-A",
    "blockName": "Backend API Development",
    "title": "Route registration via plugin pattern",
    "agentKey": "james",
    "message": "james i want all routes loaded through fastify plugins with a consistent prefix. update `packages/backend/src/app.ts` so it registers `/api/v1/agents`, `/api/v1/sessions`, `/api/v1/budgets` as separate plugins. each plugin file should live in `src/routes/`. no inline route registration in app.ts",
    "tags": [
      "backend",
      "fastify",
      "plugin",
      "routing"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-A5",
    "block": "ENG-A",
    "blockName": "Backend API Development",
    "title": "Pagination helper for list endpoints",
    "agentKey": "james",
    "message": "james every list endpoint is doing pagination differently. create a reusable `paginate` helper in `packages/backend/src/utils/paginate.ts`. it should accept `page` and `limit` query params (default 1 and 20, max limit 100), return `{ items, meta: { page, limit, total, totalPages } }`. add Zod schema for the query params too",
    "tags": [
      "backend",
      "pagination",
      "utility",
      "zod"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-A6",
    "block": "ENG-A",
    "blockName": "Backend API Development",
    "title": "Request ID middleware",
    "agentKey": "james",
    "message": "james i need every request to get a unique `x-request-id` header injected — use it as the Pino log correlation ID. if the client sends one already, pass it through. write this as a Fastify hook in `packages/backend/src/hooks/request-id.ts` and register it in app.ts before route registration",
    "tags": [
      "backend",
      "middleware",
      "logging",
      "fastify"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-A7",
    "block": "ENG-A",
    "blockName": "Backend API Development",
    "title": "Repository layer for agents",
    "agentKey": "james",
    "message": "james i want a proper repository pattern for agents. create `packages/backend/src/repositories/agentRepo.ts` with functions: `findAll(filters)`, `findById(id)`, `create(input)`, `update(id, input)`, `remove(id)`. all writes must go through `writeTransaction()` from write-mutex. no SQL in route handlers",
    "tags": [
      "backend",
      "repository",
      "sqlite",
      "pattern"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-A8",
    "block": "ENG-A",
    "blockName": "Backend API Development",
    "title": "Rate limiting per agent endpoint",
    "agentKey": "james",
    "message": "james add rate limiting to POST /api/v1/agents/execute — max 10 requests per minute per IP. use `@fastify/rate-limit`. if the limit is hit return 429 with `Retry-After` header. configure the store to use in-memory (sqlite for persistent is overkill here). add the plugin to `packages/backend/src/plugins/`",
    "tags": [
      "backend",
      "rate-limiting",
      "fastify",
      "security"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-A9",
    "block": "ENG-A",
    "blockName": "Backend API Development",
    "title": "Health check endpoint with DB probe",
    "agentKey": "james",
    "message": "james the `GET /health` endpoint just returns 200. i need it to actually probe the DB with a `SELECT 1` and include `{ status: \"ok\"|\"degraded\", db: \"ok\"|\"error\", uptime, version }` in the response. if the DB probe fails return 503. put this in `packages/backend/src/routes/health.ts`",
    "tags": [
      "backend",
      "health-check",
      "fastify",
      "monitoring"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-A10",
    "block": "ENG-A",
    "blockName": "Backend API Development",
    "title": "Audit log endpoint for admin",
    "agentKey": "james",
    "message": "james add GET /api/v1/admin/audit-log — returns paginated rows from `audit_log` table. support query params: `event_type`, `actor`, `severity`, `from`, `to` (ISO dates). only accessible to admin sessions. put it in `packages/backend/src/routes/admin.ts` and lock it behind the auth middleware",
    "tags": [
      "backend",
      "audit",
      "admin",
      "fastify",
      "auth"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-B1",
    "block": "ENG-B",
    "blockName": "Database & SQLite",
    "title": "Write-mutex usage audit",
    "agentKey": "james",
    "message": "james i need you to grep through `packages/backend/src/` and find every place we're doing a direct SQLite write (INSERT, UPDATE, DELETE, BEGIN) outside of `writeTransaction()`. list them all and fix each one to go through the mutex. this is a hard rule — no exceptions",
    "tags": [
      "backend",
      "sqlite",
      "write-mutex",
      "audit"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-B2",
    "block": "ENG-B",
    "blockName": "Database & SQLite",
    "title": "Migration script for agents table v2",
    "agentKey": "james",
    "message": "james i need a migration to add a `config` JSON column and a `last_active_at` INTEGER (unix timestamp) to the `agents` table. write it as `packages/backend/src/db/migrations/002_agents_v2.sql`. also update the migration runner in `packages/backend/src/db/migrate.ts` to apply it idempotently",
    "tags": [
      "backend",
      "sqlite",
      "migration",
      "schema"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-B3",
    "block": "ENG-B",
    "blockName": "Database & SQLite",
    "title": "Compound index for audit_log queries",
    "agentKey": "james",
    "message": "james the audit_log table has millions of rows and `GET /admin/audit-log` queries are timing out. i need a compound index on `(actor, event_type, created_at)` and another on `(severity, created_at)`. add them to the migration file and explain in a comment why each ordering matters",
    "tags": [
      "backend",
      "sqlite",
      "indexes",
      "performance"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-B4",
    "block": "ENG-B",
    "blockName": "Database & SQLite",
    "title": "WAL checkpoint configuration",
    "agentKey": "james",
    "message": "james we're running better-sqlite3 in WAL mode but i don't think we've configured the checkpoint threshold. in `packages/backend/src/db/connection.ts` set `PRAGMA wal_autocheckpoint = 1000` and `PRAGMA journal_size_limit = 67108864` (64MB). explain in a comment what these do and why these values are reasonable for our write volume",
    "tags": [
      "backend",
      "sqlite",
      "wal",
      "performance",
      "configuration"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-B5",
    "block": "ENG-B",
    "blockName": "Database & SQLite",
    "title": "writeBatch for bulk agent status updates",
    "agentKey": "james",
    "message": "james i need a bulk status update for agents — when the orchestrator shuts down it needs to mark all running agents as \"idle\" in one shot. use `writeBatch` from write-mutex. add a function `bulkUpdateStatus(agentIds: string[], status: string)` in `packages/backend/src/repositories/agentRepo.ts`",
    "tags": [
      "backend",
      "sqlite",
      "write-batch",
      "repository"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-B6",
    "block": "ENG-B",
    "blockName": "Database & SQLite",
    "title": "Soft delete pattern for agents",
    "agentKey": "james",
    "message": "james we should never hard-delete agents because audit logs reference them. implement soft delete: add a `deleted_at` INTEGER column (migration), update `remove()` in agentRepo to set it, update `findAll()` to exclude soft-deleted by default, add a `withDeleted: true` option for admin views. update `packages/backend/src/repositories/agentRepo.ts`",
    "tags": [
      "backend",
      "sqlite",
      "soft-delete",
      "repository",
      "pattern"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-B7",
    "block": "ENG-B",
    "blockName": "Database & SQLite",
    "title": "Database backup utility",
    "agentKey": "james",
    "message": "james write a `backupDatabase()` function in `packages/backend/src/db/backup.ts` using better-sqlite3's `.backup()` API. it should write to `/var/openclaw/backups/db-{timestamp}.sqlite`, keep the last 7 backups (delete older ones), and log completion with dbLogger. this will be called by a PM2 cron job",
    "tags": [
      "backend",
      "sqlite",
      "backup",
      "utility"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-B8",
    "block": "ENG-B",
    "blockName": "Database & SQLite",
    "title": "Read replica pattern for heavy queries",
    "agentKey": "james",
    "message": "james heavy analytics queries are blocking the write path. i want to open a second read-only better-sqlite3 connection to the same DB file for read queries. update `packages/backend/src/db/connection.ts` to export both `getDatabase()` (write) and `getReadonlyDatabase()` (read-only). document when each should be used",
    "tags": [
      "backend",
      "sqlite",
      "read-replica",
      "performance",
      "pattern"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-B9",
    "block": "ENG-B",
    "blockName": "Database & SQLite",
    "title": "Schema validation on startup",
    "agentKey": "james",
    "message": "james i want the server to fail fast on startup if the DB schema doesn't match what we expect. add a `validateSchema()` function in `packages/backend/src/db/validate.ts` that checks all required tables exist using `sqlite_master`. call it in `packages/backend/src/app.ts` before registering routes",
    "tags": [
      "backend",
      "sqlite",
      "validation",
      "startup",
      "safety"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-B10",
    "block": "ENG-B",
    "blockName": "Database & SQLite",
    "title": "Foreign key enforcement",
    "agentKey": "james",
    "message": "james SQLite doesn't enforce foreign keys by default. make sure we set `PRAGMA foreign_keys = ON` in `packages/backend/src/db/connection.ts` right after opening the connection. then check if any of our existing INSERT statements will break — list any you find in a code comment",
    "tags": [
      "backend",
      "sqlite",
      "foreign-keys",
      "integrity"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-C1",
    "block": "ENG-C",
    "blockName": "Authentication & Security",
    "title": "HMAC inter-service auth middleware",
    "agentKey": "james",
    "message": "james write the HMAC-SHA256 middleware in `packages/backend/src/middleware/hmac.ts`. it should: (1) read `x-signature` and `x-timestamp` headers, (2) reject requests older than 5 minutes, (3) recompute HMAC over `{method}:{path}:{timestamp}:{body}`, (4) compare with crypto.timingSafeEqual. never use `===` for signature comparison. reject with 401 if invalid",
    "tags": [
      "backend",
      "security",
      "hmac",
      "middleware",
      "auth"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-C2",
    "block": "ENG-C",
    "blockName": "Authentication & Security",
    "title": "Session token generation",
    "agentKey": "james",
    "message": "james the session tokens in `packages/backend/src/auth/session.ts` are using Math.random(). fix that — use `crypto.randomBytes(32).toString('hex')` for the token, store a `sha256(token)` hash in the DB (never the raw token), and add a `createdAt`/`expiresAt` with a 24h TTL. update `packages/backend/src/repositories/authRepo.ts` too",
    "tags": [
      "backend",
      "auth",
      "session",
      "security",
      "crypto"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-C3",
    "block": "ENG-C",
    "blockName": "Authentication & Security",
    "title": "Timing-safe token comparison audit",
    "agentKey": "marcus",
    "message": "marcus i need a review of all token/signature comparison code in `packages/backend/src/`. find every place where we compare secret values — HMAC signatures, session tokens, API keys. check that each uses `crypto.timingSafeEqual` and not `===` or `.includes()`. give me a list of violations and how to fix them",
    "tags": [
      "security",
      "auth",
      "code-review",
      "timing-safe",
      "crypto"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-C4",
    "block": "ENG-C",
    "blockName": "Authentication & Security",
    "title": "Auth middleware for protected routes",
    "agentKey": "james",
    "message": "james update `packages/backend/src/middleware/auth.ts` to: (1) read the session token from `Authorization: Bearer <token>` header, (2) hash it with SHA-256, (3) look it up in the DB via authRepo, (4) check expiry, (5) attach `request.session` with userId + role. return 401 if missing, 403 if expired",
    "tags": [
      "backend",
      "auth",
      "middleware",
      "session",
      "fastify"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-C5",
    "block": "ENG-C",
    "blockName": "Authentication & Security",
    "title": "RBAC role check decorator",
    "agentKey": "james",
    "message": "james i need a Fastify decorator `requireRole(role: \"admin\"|\"operator\"|\"viewer\")` that acts as a preHandler. it reads `request.session.role` and throws Forbidden if the role doesn't match. use it on POST /agents (requires operator), DELETE /agents/:id (requires admin), GET /admin/audit-log (requires admin). add it to `packages/backend/src/middleware/rbac.ts`",
    "tags": [
      "backend",
      "auth",
      "rbac",
      "fastify",
      "security"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-C6",
    "block": "ENG-C",
    "blockName": "Authentication & Security",
    "title": "API key hashing for openclaw-shield",
    "agentKey": "james",
    "message": "james openclaw-shield API keys need to be stored as `sha256(key)` in the DB. the raw key is only shown once on creation. update `packages/backend/src/routes/auth.ts` so POST /auth/api-keys: (1) generates `crypto.randomBytes(32).toString('hex')` as the raw key, (2) stores `sha256(rawKey)` in DB, (3) returns the raw key ONLY in the response, (4) never logs the raw key",
    "tags": [
      "backend",
      "auth",
      "api-key",
      "security",
      "crypto"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-C7",
    "block": "ENG-C",
    "blockName": "Authentication & Security",
    "title": "SQL injection prevention review",
    "agentKey": "marcus",
    "message": "marcus review `packages/backend/src/repositories/` for any SQL injection risks. look for: string concatenation in queries, dynamic table/column names, unvalidated user input in WHERE clauses. flag each one. we must use parameterized queries everywhere — better-sqlite3's `prepare().run(params)` pattern. also check for any `db.exec()` calls with user-controlled input",
    "tags": [
      "security",
      "sql-injection",
      "code-review",
      "sqlite"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-C8",
    "block": "ENG-C",
    "blockName": "Authentication & Security",
    "title": "Session cleanup cron",
    "agentKey": "james",
    "message": "james expired sessions are piling up in the DB. add a `cleanExpiredSessions()` function in `packages/backend/src/repositories/authRepo.ts` that deletes sessions where `expires_at < unixepoch()`. then register a Fastify plugin in `packages/backend/src/plugins/session-cleanup.ts` that calls it every hour using `setInterval`",
    "tags": [
      "backend",
      "auth",
      "session",
      "cleanup",
      "cron"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-C9",
    "block": "ENG-C",
    "blockName": "Authentication & Security",
    "title": "Secret leak detection in logs",
    "agentKey": "marcus",
    "message": "marcus i'm worried we might be accidentally logging secrets. review the Pino config in `packages/backend/src/config/logger.ts` and check that redaction paths cover: `req.headers.authorization`, `*.apiKey`, `*.token`, `*.password`, `*.secret`, `*.sessionToken`. also check if any route handlers log req.body without filtering — list every violation",
    "tags": [
      "security",
      "logging",
      "pino",
      "secrets",
      "code-review"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-C10",
    "block": "ENG-C",
    "blockName": "Authentication & Security",
    "title": "CORS policy for BFF proxy",
    "agentKey": "james",
    "message": "james our Fastify server currently has CORS wide open. in `packages/backend/src/plugins/cors.ts` configure `@fastify/cors` to: allow only `http://localhost:3000` in dev and the Tailscale hostname in prod, allow credentials, allowed methods GET/POST/PATCH/DELETE, max age 3600. read the origin from env var `ALLOWED_ORIGIN`",
    "tags": [
      "backend",
      "security",
      "cors",
      "fastify",
      "plugin"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-D1",
    "block": "ENG-D",
    "blockName": "Frontend Pages & Components",
    "title": "Agent detail page layout",
    "agentKey": "elena",
    "message": "elena i need the agent detail page at `packages/frontend/src/app/(protected)/agents/[id]/page.tsx`. it should be a Server Component that fetches the agent by ID from `/api/v1/agents/:id`. layout: left column has agent info (name, domain, model, status badge), right column is a tabbed area (Overview | Config | Logs | Budget). use shadcn Tabs. skeleton loading states too",
    "tags": [
      "frontend",
      "next-js",
      "server-component",
      "page",
      "shadcn"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-D2",
    "block": "ENG-D",
    "blockName": "Frontend Pages & Components",
    "title": "Agent status badge component",
    "agentKey": "elena",
    "message": "elena create a `<StatusBadge>` component in `packages/frontend/src/components/agents/status-badge.tsx`. it accepts `status: \"idle\" | \"running\" | \"error\" | \"paused\"` and renders a colored dot + label using shadcn Badge. idle=zinc, running=emerald (with a pulse animation), error=red, paused=amber. export the status type from the component file",
    "tags": [
      "frontend",
      "component",
      "shadcn",
      "tailwind"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-D3",
    "block": "ENG-D",
    "blockName": "Frontend Pages & Components",
    "title": "Agent list page with search",
    "agentKey": "elena",
    "message": "elena the agents list at `packages/frontend/src/app/(protected)/agents/page.tsx` needs a search bar and domain filter. search should filter by agent name (client-side, instant). domain filter is a Select with options: all, trading, research, productivity, system. keep both as URL search params so the state survives a refresh. use `useSearchParams` and `useRouter`",
    "tags": [
      "frontend",
      "next-js",
      "search",
      "filter",
      "url-state"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-D4",
    "block": "ENG-D",
    "blockName": "Frontend Pages & Components",
    "title": "Create agent modal",
    "agentKey": "elena",
    "message": "elena build a \"Create Agent\" modal in `packages/frontend/src/components/agents/create-agent-modal.tsx`. use shadcn Dialog. form fields: name (text), domain (Select), model (Select with options: claude-opus-4-5, claude-sonnet-4-5, claude-haiku-4-5). use react-hook-form + zod resolver. on submit call POST /api/v1/agents. show toast on success/error",
    "tags": [
      "frontend",
      "modal",
      "form",
      "react-hook-form",
      "zod",
      "shadcn"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-D5",
    "block": "ENG-D",
    "blockName": "Frontend Pages & Components",
    "title": "Confirmation dialog for destructive actions",
    "agentKey": "elena",
    "message": "elena we need a reusable `<ConfirmDialog>` in `packages/frontend/src/components/shared/confirm-dialog.tsx`. it wraps shadcn AlertDialog. props: title, description, confirmLabel (default \"Confirm\"), confirmVariant (\"destructive\" | \"default\"), onConfirm, onCancel. the delete agent button should use it with confirmVariant=\"destructive\" and a warning message",
    "tags": [
      "frontend",
      "component",
      "dialog",
      "shadcn",
      "ux"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-D6",
    "block": "ENG-D",
    "blockName": "Frontend Pages & Components",
    "title": "Empty state component",
    "agentKey": "elena",
    "message": "elena the agent list has no empty state when there are no agents. create `packages/frontend/src/components/shared/empty-state.tsx` — accepts props: icon (Lucide icon component), title, description, action (optional: { label, onClick }). use it on the agents list page, the sessions list, and the audit log. consistent styling: centered, muted text, optional CTA button",
    "tags": [
      "frontend",
      "component",
      "empty-state",
      "ux",
      "shadcn"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-D7",
    "block": "ENG-D",
    "blockName": "Frontend Pages & Components",
    "title": "Dashboard metrics cards",
    "agentKey": "elena",
    "message": "elena add 4 KPI cards to the dashboard at `packages/frontend/src/app/(protected)/dashboard/page.tsx`: Total Agents, Running Agents, Total Sessions (last 24h), Budget Used Today. each is a Server Component that fetches its number from the backend. use shadcn Card. show a skeleton while loading. use Suspense boundaries so they load independently",
    "tags": [
      "frontend",
      "dashboard",
      "server-component",
      "suspense",
      "shadcn"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-D8",
    "block": "ENG-D",
    "blockName": "Frontend Pages & Components",
    "title": "Sidebar navigation with active state",
    "agentKey": "elena",
    "message": "elena the sidebar in `packages/frontend/src/components/layout/sidebar.tsx` doesn't highlight the active nav item. use `usePathname()` to check the current route and apply `bg-zinc-800 text-white` to the active link. nav items: Dashboard (/dashboard), Agents (/agents), Sessions (/sessions), Budgets (/budgets), Audit Log (/admin/audit-log). mark Audit Log as admin-only (hide if role !== \"admin\")",
    "tags": [
      "frontend",
      "navigation",
      "sidebar",
      "next-js",
      "ux"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-D9",
    "block": "ENG-D",
    "blockName": "Frontend Pages & Components",
    "title": "Data table with sorting",
    "agentKey": "elena",
    "message": "elena i need a reusable `<DataTable>` component in `packages/frontend/src/components/shared/data-table.tsx` using TanStack Table (already in deps). it should support: column sorting (click header), optional row click handler, loading skeleton (shimmer rows), empty state slot. use it for the agents list and audit log. keep the column definitions outside the component",
    "tags": [
      "frontend",
      "table",
      "tanstack-table",
      "component",
      "shadcn"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-D10",
    "block": "ENG-D",
    "blockName": "Frontend Pages & Components",
    "title": "Budget progress bar component",
    "agentKey": "elena",
    "message": "elena create `packages/frontend/src/components/budgets/budget-progress.tsx`. it shows a progress bar for token budget consumption. props: used (number), total (number), label (string). the bar fills proportionally, color changes: green <60%, amber 60-85%, red >85%. also show \"`used` / `total` tokens\" text below. use shadcn Progress but customize the color with Tailwind",
    "tags": [
      "frontend",
      "component",
      "budget",
      "progress",
      "tailwind"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-E1",
    "block": "ENG-E",
    "blockName": "Frontend State & Data",
    "title": "Zustand agent store",
    "agentKey": "elena",
    "message": "elena create a Zustand store for agents in `packages/frontend/src/stores/agent-store.ts`. state: `agents: Agent[]`, `selectedAgentId: string | null`, `isLoading: boolean`, `error: string | null`. actions: `setAgents`, `selectAgent`, `updateAgentStatus(id, status)`, `removeAgent(id)`. use immer for immutable updates. no async calls in the store — just pure state",
    "tags": [
      "frontend",
      "zustand",
      "state",
      "store"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-E2",
    "block": "ENG-E",
    "blockName": "Frontend State & Data",
    "title": "SSE hook for agent status updates",
    "agentKey": "elena",
    "message": "elena write a `useAgentSSE(agentId: string)` hook in `packages/frontend/src/hooks/use-agent-sse.ts`. it opens an EventSource to `/api/v1/agents/:id/events`, listens for `status_change`, `execution_log`, and `budget_update` events, and updates the Zustand store accordingly. handle reconnect with exponential backoff (max 5 retries). cleanup on unmount",
    "tags": [
      "frontend",
      "sse",
      "hooks",
      "zustand",
      "real-time"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-E3",
    "block": "ENG-E",
    "blockName": "Frontend State & Data",
    "title": "Data fetching with SWR for agent list",
    "agentKey": "elena",
    "message": "elena replace the ad-hoc fetch calls in the agents list page with SWR. create a `useAgents(filters)` hook in `packages/frontend/src/hooks/use-agents.ts`. it should handle pagination (pass page/limit as params), support the domain filter, and revalidate every 30 seconds. on mutation (create/delete), call `mutate()` to refresh. return `{ agents, meta, isLoading, error }`",
    "tags": [
      "frontend",
      "swr",
      "data-fetching",
      "hooks"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-E4",
    "block": "ENG-E",
    "blockName": "Frontend State & Data",
    "title": "Optimistic update on agent delete",
    "agentKey": "elena",
    "message": "elena the delete agent action in `packages/frontend/src/components/agents/agent-list.tsx` waits for the API response before removing the row — that makes it feel slow. implement an optimistic delete: immediately remove from the Zustand store, show a toast \"Agent deleted\", then if the API call fails, restore the agent and show an error toast",
    "tags": [
      "frontend",
      "optimistic-update",
      "zustand",
      "ux"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-E5",
    "block": "ENG-E",
    "blockName": "Frontend State & Data",
    "title": "Global API client with auth headers",
    "agentKey": "elena",
    "message": "elena create a typed API client in `packages/frontend/src/lib/api-client.ts`. it should: (1) always send `Authorization: Bearer {token}` from the session cookie, (2) handle 401 by redirecting to /login, (3) handle 429 with a \"rate limited\" toast, (4) type the response generically `ApiResponse<T>`. wrap fetch, don't use axios",
    "tags": [
      "frontend",
      "api-client",
      "auth",
      "fetch",
      "typescript"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-E6",
    "block": "ENG-E",
    "blockName": "Frontend State & Data",
    "title": "Toast notification system",
    "agentKey": "elena",
    "message": "elena we're using shadcn Toaster but the calls are inconsistent across components. create a `useAppToast` hook in `packages/frontend/src/hooks/use-app-toast.ts` that wraps `useToast` with typed helpers: `toast.success(msg)`, `toast.error(msg)`, `toast.warning(msg)`, `toast.info(msg)`. each sets the appropriate variant and a max duration. use this everywhere instead of raw `useToast`",
    "tags": [
      "frontend",
      "toast",
      "hooks",
      "shadcn",
      "ux"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-E7",
    "block": "ENG-E",
    "blockName": "Frontend State & Data",
    "title": "Session store and auth context",
    "agentKey": "elena",
    "message": "elena we need a client-side session store in `packages/frontend/src/stores/session-store.ts`. it should hold `{ userId, role, email, expiresAt }`. it reads from a `/api/v1/auth/me` call on mount. also write a `useSession()` hook that returns the session or redirects to /login if not authenticated. other components should use this hook, not fetch /auth/me directly",
    "tags": [
      "frontend",
      "auth",
      "session",
      "zustand",
      "hooks"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-E8",
    "block": "ENG-E",
    "blockName": "Frontend State & Data",
    "title": "Infinite scroll for execution logs",
    "agentKey": "elena",
    "message": "elena the agent execution log tab needs infinite scroll — logs can be thousands of entries. use the Intersection Observer API in a `useInfiniteScroll` hook in `packages/frontend/src/hooks/use-infinite-scroll.ts`. the hook takes a `fetchMore` callback and a ref for the sentinel element. trigger fetch when sentinel enters viewport. debounce to avoid hammering the API",
    "tags": [
      "frontend",
      "infinite-scroll",
      "hooks",
      "performance"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-E9",
    "block": "ENG-E",
    "blockName": "Frontend State & Data",
    "title": "URL state sync for filters",
    "agentKey": "elena",
    "message": "elena create a `useUrlFilters` hook in `packages/frontend/src/hooks/use-url-filters.ts`. it manages filter state (domain, status, search) as URL search params using Next.js router. changes update the URL without a full page reload. the hook returns `[filters, setFilters]` where setFilters does a shallow push. this makes filters shareable via URL",
    "tags": [
      "frontend",
      "url-state",
      "filters",
      "hooks",
      "next-js"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-E10",
    "block": "ENG-E",
    "blockName": "Frontend State & Data",
    "title": "Budget store with real-time updates",
    "agentKey": "elena",
    "message": "elena create `packages/frontend/src/stores/budget-store.ts` for budget tracking. state: map of `agentId → { used, total, currency }`. actions: `setBudget`, `updateUsed`. the SSE hook should push `budget_update` events into this store. the BudgetProgress component should subscribe to this store via `useBudgetStore(state => state.budgets[agentId])` — no prop drilling",
    "tags": [
      "frontend",
      "zustand",
      "budget",
      "sse",
      "real-time"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-F1",
    "block": "ENG-F",
    "blockName": "Mobile Development",
    "title": "Expo Router tab layout setup",
    "agentKey": "kai",
    "message": "kai set up the Expo Router tab layout in `packages/mobile/app/(tabs)/_layout.tsx`. 4 tabs: Dashboard, Agents, Alerts, Settings. each tab has a Lucide icon (via `lucide-react-native`). active tab color is `#10b981` (emerald-500), inactive is zinc-400. use NativeWind for styling. make sure the tab bar has a dark background to match the Mission Control theme",
    "tags": [
      "mobile",
      "expo-router",
      "navigation",
      "nativewind"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-F2",
    "block": "ENG-F",
    "blockName": "Mobile Development",
    "title": "Agent list screen with pull-to-refresh",
    "agentKey": "kai",
    "message": "kai build the agents list screen at `packages/mobile/app/(tabs)/agents/index.tsx`. use FlashList (not FlatList) for performance. each row shows agent name, domain badge, status dot, and last active time (relative, e.g. \"3m ago\"). add pull-to-refresh using RefreshControl. tap a row navigates to `/agents/:id`. empty state shows a placeholder if no agents",
    "tags": [
      "mobile",
      "expo",
      "flashlist",
      "pull-to-refresh",
      "nativewind"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-F3",
    "block": "ENG-F",
    "blockName": "Mobile Development",
    "title": "Secure token storage with Expo SecureStore",
    "agentKey": "kai",
    "message": "kai the mobile app is storing the auth token in AsyncStorage which is plain text. fix this — use `expo-secure-store` instead. create `packages/mobile/src/lib/secure-storage.ts` with `storeToken(token)`, `getToken()`, `clearToken()`. update the auth flow in `packages/mobile/src/hooks/use-auth.ts` to use these functions. add a comment explaining why SecureStore vs AsyncStorage",
    "tags": [
      "mobile",
      "expo",
      "security",
      "secure-store",
      "auth"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-F4",
    "block": "ENG-F",
    "blockName": "Mobile Development",
    "title": "Offline-first agent status cache",
    "agentKey": "kai",
    "message": "kai i want the mobile app to show the last-known agent list when offline, not a blank screen. use `expo-sqlite` to cache the agents list locally in `packages/mobile/src/db/agent-cache.ts`. on app launch, load from cache immediately, then fetch fresh data in the background and update. show a banner \"Offline — showing cached data\" when `NetInfo.isConnected` is false",
    "tags": [
      "mobile",
      "expo",
      "offline-first",
      "sqlite",
      "cache"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-F5",
    "block": "ENG-F",
    "blockName": "Mobile Development",
    "title": "Push notifications for agent alerts",
    "agentKey": "kai",
    "message": "kai set up Expo Push Notifications in `packages/mobile/src/services/push-notifications.ts`. on app launch: request permission, get push token, send it to `POST /api/v1/mobile/push-token`. handle foreground notifications with a custom in-app banner (not the OS notification). handle taps on background notifications to deep-link to the relevant agent screen",
    "tags": [
      "mobile",
      "expo",
      "push-notifications",
      "deep-linking"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-F6",
    "block": "ENG-F",
    "blockName": "Mobile Development",
    "title": "Biometric auth gate",
    "agentKey": "kai",
    "message": "kai add a biometric auth gate that runs on app resume (not just launch). use `expo-local-authentication`. if the device supports FaceID/TouchID and the user has it enabled in our Settings screen, require biometric auth when the app comes back from background after >5 minutes. store the \"last active\" timestamp in memory, not in storage. fail gracefully if biometrics unavailable",
    "tags": [
      "mobile",
      "expo",
      "biometric",
      "security",
      "auth"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-F7",
    "block": "ENG-F",
    "blockName": "Mobile Development",
    "title": "Agent detail screen with execution log",
    "agentKey": "kai",
    "message": "kai build the agent detail screen at `packages/mobile/app/(tabs)/agents/[id].tsx`. top section: agent name, domain, status, model. bottom section: a scrollable execution log using FlashList (latest entries at the top). each log entry shows timestamp, level badge (info/warning/error), and message. use NativeWind. add a \"Run Agent\" FAB button that's disabled when status is \"running\"",
    "tags": [
      "mobile",
      "expo-router",
      "flashlist",
      "nativewind"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-F8",
    "block": "ENG-F",
    "blockName": "Mobile Development",
    "title": "Network-aware API client",
    "agentKey": "kai",
    "message": "kai create `packages/mobile/src/lib/api-client.ts`. it should: (1) check `NetInfo.isConnected` before every request, throw an OfflineError if not, (2) get the auth token from SecureStore and add the `Authorization` header, (3) handle 401 by clearing the token and redirecting to login, (4) add a 10s timeout. make it typed with generics",
    "tags": [
      "mobile",
      "expo",
      "api-client",
      "network",
      "auth"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-F9",
    "block": "ENG-F",
    "blockName": "Mobile Development",
    "title": "Settings screen with theme toggle",
    "agentKey": "kai",
    "message": "kai build the Settings screen at `packages/mobile/app/(tabs)/settings/index.tsx`. sections: Account (show email, logout button), Preferences (enable biometrics toggle, push notifications toggle), About (version, build number). use a SectionList. the biometrics toggle should check `expo-local-authentication` support and disable itself if unavailable. use NativeWind",
    "tags": [
      "mobile",
      "expo",
      "settings",
      "nativewind",
      "ux"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-F10",
    "block": "ENG-F",
    "blockName": "Mobile Development",
    "title": "Error boundary for mobile screens",
    "agentKey": "kai",
    "message": "kai i need an error boundary for the mobile app. create `packages/mobile/src/components/error-boundary.tsx` — a React class component that catches render errors. it should show a \"Something went wrong\" screen with a \"Retry\" button that resets the error state. wrap each tab's stack navigator root in this boundary. also log the error to the backend via `POST /api/v1/mobile/errors`",
    "tags": [
      "mobile",
      "expo",
      "error-boundary",
      "error-handling"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-G1",
    "block": "ENG-G",
    "blockName": "API Design & Architecture",
    "title": "RESTful resource naming review",
    "agentKey": "marcus",
    "message": "marcus can you review our API naming across `packages/backend/src/routes/`? i want to confirm we're following REST conventions: plural nouns, no verbs in paths, proper use of HTTP methods. specifically flag: any actions that should be sub-resources, any GET endpoints that mutate state, any inconsistencies between how we name things. give me a before/after table",
    "tags": [
      "architecture",
      "api-design",
      "rest",
      "review"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-G2",
    "block": "ENG-G",
    "blockName": "API Design & Architecture",
    "title": "SSE event schema design",
    "agentKey": "marcus",
    "message": "marcus design the SSE event schema for the agent execution channel. we need events for: status changes, log entries, budget updates, task completions, errors. each event needs: `type`, `agentId`, `timestamp`, and a typed `data` payload. give me the TypeScript interfaces and document what triggers each event. this will go in `agent_docs/sse_events.md`",
    "tags": [
      "architecture",
      "sse",
      "api-design",
      "typescript"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-G3",
    "block": "ENG-G",
    "blockName": "API Design & Architecture",
    "title": "API versioning strategy",
    "agentKey": "marcus",
    "message": "marcus should we version our API as URL prefix (/v1, /v2), Accept header, or query param? we're still early but i want to plan for deprecations. consider: we have a web client, mobile app, and slack service all hitting the backend. what's the recommendation and what does a breaking change look like for us?",
    "tags": [
      "architecture",
      "api-design",
      "versioning",
      "planning"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-G4",
    "block": "ENG-G",
    "blockName": "API Design & Architecture",
    "title": "BFF pattern for frontend API calls",
    "agentKey": "marcus",
    "message": "marcus i want to make sure we're following the BFF (Backend for Frontend) pattern correctly. the frontend should never call the gateway directly — all gateway calls go through the backend. review the frontend code in `packages/frontend/src/` and flag any direct calls to external services. also document the intended data flow: browser → Next.js → Fastify → gateway",
    "tags": [
      "architecture",
      "bff",
      "security",
      "review"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-G5",
    "block": "ENG-G",
    "blockName": "API Design & Architecture",
    "title": "Error response contract",
    "agentKey": "james",
    "message": "james define and document our API error response contract. every error response should be `{ error: { code: string, message: string, details?: unknown } }`. create the Zod schema for this in `packages/shared/src/schemas/error.ts` and export it. update the error handler plugin to use this schema. make sure the frontend API client types responses against it",
    "tags": [
      "api-design",
      "error-handling",
      "zod",
      "shared",
      "contract"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-G6",
    "block": "ENG-G",
    "blockName": "API Design & Architecture",
    "title": "Webhook contract for agent events",
    "agentKey": "marcus",
    "message": "marcus i want to add webhook support so external systems can subscribe to agent events. design the webhook contract: payload shape, delivery semantics (at-least-once), retry policy, HMAC signature for verification, the registration endpoint (`POST /webhooks`). document it as an ADR in `agent_docs/api_specification.md`. don't implement it yet — just the design",
    "tags": [
      "architecture",
      "webhook",
      "api-design",
      "adr"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-G7",
    "block": "ENG-G",
    "blockName": "API Design & Architecture",
    "title": "Shared Zod schemas between packages",
    "agentKey": "james",
    "message": "james we have duplicate Zod schemas — one in the backend routes and one in the frontend hooks. move the canonical schemas to `packages/shared/src/schemas/`. start with: AgentSchema, CreateAgentSchema, UpdateAgentSchema, PaginationSchema, ErrorResponseSchema. export them all from `packages/shared/src/index.ts`. the backend and frontend both import from `@openclaw/shared`",
    "tags": [
      "shared",
      "zod",
      "typescript",
      "api-design",
      "monorepo"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-G8",
    "block": "ENG-G",
    "blockName": "API Design & Architecture",
    "title": "Request/response logging middleware",
    "agentKey": "james",
    "message": "james add structured request/response logging in `packages/backend/src/hooks/request-logging.ts`. log: method, url, statusCode, responseTime (ms), requestId. for POST/PATCH log the request body keys (not values, to avoid accidental secret logging). for errors log the full error. skip logging for GET /health. register as fastify hooks onRequest + onResponse",
    "tags": [
      "backend",
      "logging",
      "middleware",
      "fastify",
      "observability"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-G9",
    "block": "ENG-G",
    "blockName": "API Design & Architecture",
    "title": "API contract tests between frontend and backend",
    "agentKey": "marcus",
    "message": "marcus i want confidence that the frontend API client and the backend route schemas are in sync. design a contract testing approach — should we use Pact, shared OpenAPI spec, or just shared Zod schemas? given our monorepo setup with shared package, what's the lightest-weight option that catches breaking changes in CI?",
    "tags": [
      "architecture",
      "contract-testing",
      "api-design",
      "ci"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-G10",
    "block": "ENG-G",
    "blockName": "API Design & Architecture",
    "title": "Mobile-specific API endpoints",
    "agentKey": "james",
    "message": "james the mobile app needs some data shaped differently than the web frontend — it needs denormalized responses to avoid multiple round trips. add mobile-specific endpoints under `/api/v1/mobile/`: GET /mobile/dashboard (agents summary + recent alerts in one call), POST /mobile/push-token, POST /mobile/errors. put them in `packages/backend/src/routes/mobile.ts`",
    "tags": [
      "backend",
      "api-design",
      "mobile",
      "bff",
      "fastify"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-H1",
    "block": "ENG-H",
    "blockName": "Code Review",
    "title": "Review backend auth routes PR",
    "agentKey": "marcus",
    "message": "marcus can you review the auth routes in `packages/backend/src/routes/auth.ts`? specifically looking at: (1) are we hashing passwords/tokens before storing? (2) are session token comparisons timing-safe? (3) is there proper error handling or are we leaking error details to the client? (4) any obvious race conditions in the session creation flow? give me specific line-by-line feedback",
    "tags": [
      "code-review",
      "security",
      "auth",
      "backend"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-H2",
    "block": "ENG-H",
    "blockName": "Code Review",
    "title": "Review for N+1 query patterns",
    "agentKey": "marcus",
    "message": "marcus look at the route handlers in `packages/backend/src/routes/` and find any N+1 query patterns — places where we're querying in a loop or making one DB query per item in a list. flag each one and suggest how to fix it with a single JOIN or a batch query. this is killing performance on the agents list when there are 50+ agents",
    "tags": [
      "code-review",
      "performance",
      "sqlite",
      "n+1"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-H3",
    "block": "ENG-H",
    "blockName": "Code Review",
    "title": "Review async/await error handling",
    "agentKey": "marcus",
    "message": "marcus review `packages/backend/src/` for unhandled Promise rejections — places where we're using async/await without try/catch, or where we're using `.then()` without `.catch()`. also look for fire-and-forget async calls that could fail silently. list every violation. unhandled rejections will crash the Node.js process",
    "tags": [
      "code-review",
      "async",
      "error-handling",
      "backend"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-H4",
    "block": "ENG-H",
    "blockName": "Code Review",
    "title": "Frontend component review for hooks rules violations",
    "agentKey": "marcus",
    "message": "marcus review the frontend components in `packages/frontend/src/components/` for React hooks rule violations: hooks called conditionally, hooks inside loops, hooks inside callbacks, `useEffect` with missing dependencies. list each one with the file path and line number. also flag any components mixing Server Component and Client Component patterns incorrectly",
    "tags": [
      "code-review",
      "react",
      "hooks",
      "frontend"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-H5",
    "block": "ENG-H",
    "blockName": "Code Review",
    "title": "TypeScript strict mode compliance review",
    "agentKey": "marcus",
    "message": "marcus do a review of `packages/backend/src/` for TypeScript strict mode violations: any usage of `any` type (should be `unknown`), missing return type annotations on exported functions, unsafe type assertions (as), non-null assertions (!) without justification. we run strict mode so these should be zero — just tell me where they are",
    "tags": [
      "code-review",
      "typescript",
      "strict",
      "quality"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-H6",
    "block": "ENG-H",
    "blockName": "Code Review",
    "title": "Review write-mutex compliance",
    "agentKey": "marcus",
    "message": "marcus audit the entire backend codebase for write-mutex compliance. every SQLite write (INSERT, UPDATE, DELETE) must go through `writeTransaction()` or `writeBatch()` from `src/db/write-mutex.ts`. find any direct `db.prepare().run()` calls that are writes but outside the mutex. list file + function + line number for every violation",
    "tags": [
      "code-review",
      "sqlite",
      "write-mutex",
      "compliance"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-H7",
    "block": "ENG-H",
    "blockName": "Code Review",
    "title": "Review frontend bundle size impact",
    "agentKey": "marcus",
    "message": "marcus look at our Next.js 15 frontend dependencies in `packages/frontend/package.json`. i'm worried about bundle size. identify: any large libraries we could lazy-load, any deps that have lighter alternatives, any client-side imports that should be server-only. specifically check if we're importing heavy chart libraries, full icon sets, or date libraries on every page",
    "tags": [
      "code-review",
      "performance",
      "frontend",
      "bundle-size",
      "next-js"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-H8",
    "block": "ENG-H",
    "blockName": "Code Review",
    "title": "Dependency injection pattern review",
    "agentKey": "marcus",
    "message": "marcus review the service layer in `packages/backend/src/services/` — are we hardcoding dependencies (direct module imports in functions) or using a proper injection pattern? tightly coupled code makes testing harder. flag any service that can't be unit tested without mocking the entire module. suggest which ones need refactoring for testability",
    "tags": [
      "code-review",
      "architecture",
      "testing",
      "di"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-H9",
    "block": "ENG-H",
    "blockName": "Code Review",
    "title": "Review SSE implementation for memory leaks",
    "agentKey": "marcus",
    "message": "marcus review the SSE route handler in `packages/backend/src/routes/events.ts`. i'm worried about memory leaks: are we cleaning up event listeners when clients disconnect? are we tracking all active connections and removing them on close? is there a max connection limit? what happens if a client disconnects mid-stream? give me a threat model for the SSE endpoint",
    "tags": [
      "code-review",
      "sse",
      "memory-leak",
      "backend"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-H10",
    "block": "ENG-H",
    "blockName": "Code Review",
    "title": "Zod schema validation gaps",
    "agentKey": "marcus",
    "message": "marcus review all route handlers in `packages/backend/src/routes/` and check that every request body, query string, and URL param is validated with Zod before touching the DB. flag any route that passes unvalidated input to a repository function. also check that we're returning 400 (not 500) for validation failures",
    "tags": [
      "code-review",
      "validation",
      "zod",
      "security",
      "backend"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-I1",
    "block": "ENG-I",
    "blockName": "Testing Strategy",
    "title": "Unit tests for agentRepo",
    "agentKey": "priya",
    "message": "priya write unit tests for `packages/backend/src/repositories/agentRepo.ts`. use an in-memory better-sqlite3 database (not a mock). test all functions: findAll (with filters), findById (found + not found), create, update, remove (soft delete). use the AAA pattern. aim for 100% branch coverage on this file since it's critical path",
    "tags": [
      "testing",
      "vitest",
      "unit",
      "repository",
      "sqlite"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-I2",
    "block": "ENG-I",
    "blockName": "Testing Strategy",
    "title": "Integration tests for auth routes",
    "agentKey": "priya",
    "message": "priya write integration tests for `packages/backend/src/routes/auth.ts` using Fastify's `inject()` method with an in-memory SQLite DB. test: POST /auth/login success, POST /auth/login wrong password, POST /auth/logout, GET /auth/me with valid session, GET /auth/me with expired session. put them in `packages/backend/src/routes/auth.integration.test.ts`",
    "tags": [
      "testing",
      "vitest",
      "integration",
      "auth",
      "fastify"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-I3",
    "block": "ENG-I",
    "blockName": "Testing Strategy",
    "title": "Coverage gap analysis",
    "agentKey": "priya",
    "message": "priya run the test coverage report for `packages/backend/` and find all files below 80% line coverage. list them ranked by coverage percentage (lowest first). for the top 5 worst files, identify which specific branches or lines are uncovered and write a brief testing plan for each. we need to hit 80% overall for the CI gate to pass",
    "tags": [
      "testing",
      "coverage",
      "vitest",
      "ci",
      "analysis"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-I4",
    "block": "ENG-I",
    "blockName": "Testing Strategy",
    "title": "E2E test for agent creation flow",
    "agentKey": "priya",
    "message": "priya write a Playwright E2E test in `packages/frontend/tests/e2e/agents/create-agent.spec.ts`. flow: login → navigate to /agents → click \"Create Agent\" → fill form (name: \"Test Agent\", domain: \"research\", model: \"claude-haiku-4-5\") → submit → verify agent appears in list → verify toast \"Agent created\". use page object model. mock the API with Playwright's route intercept",
    "tags": [
      "testing",
      "playwright",
      "e2e",
      "frontend"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-I5",
    "block": "ENG-I",
    "blockName": "Testing Strategy",
    "title": "Mock factory for test fixtures",
    "agentKey": "priya",
    "message": "priya we're repeating agent/session fixture creation across dozens of test files. create a test factory in `packages/backend/src/test/factories.ts` with `createMockAgent(overrides?)`, `createMockSession(overrides?)`, `createMockAuditLog(overrides?)`. each returns a complete object with sensible defaults. export a `createTestDb()` helper too that sets up an in-memory DB with the schema",
    "tags": [
      "testing",
      "factory",
      "fixtures",
      "vitest",
      "backend"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-I6",
    "block": "ENG-I",
    "blockName": "Testing Strategy",
    "title": "HMAC middleware unit tests",
    "agentKey": "priya",
    "message": "priya write comprehensive unit tests for `packages/backend/src/middleware/hmac.ts`. test cases must include: valid signature passes, expired timestamp rejected (>5 min old), wrong signature rejected, missing headers rejected, replay attack (duplicate x-timestamp) rejected. use 100% branch coverage. this is security-critical code — no untested branches",
    "tags": [
      "testing",
      "security",
      "hmac",
      "unit",
      "vitest"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-I7",
    "block": "ENG-I",
    "blockName": "Testing Strategy",
    "title": "Frontend component tests with Testing Library",
    "agentKey": "priya",
    "message": "priya write component tests for `packages/frontend/src/components/agents/create-agent-modal.tsx` using Vitest + React Testing Library. test: renders correctly, form validation shows errors for empty name, domain select works, submit calls API with correct payload, success closes modal + shows toast, error shows error toast. mock the API client",
    "tags": [
      "testing",
      "vitest",
      "react-testing-library",
      "frontend",
      "component"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-I8",
    "block": "ENG-I",
    "blockName": "Testing Strategy",
    "title": "Test architecture for SSE endpoints",
    "agentKey": "priya",
    "message": "priya how do we test the SSE endpoint in `packages/backend/src/routes/events.ts`? it's currently untested. design a test approach: can we use Fastify inject()? do we need a real HTTP server? how do we verify event delivery? write at least 3 tests: client receives events, client disconnect cleans up, multiple clients receive same event. put them in events.test.ts",
    "tags": [
      "testing",
      "sse",
      "vitest",
      "backend",
      "architecture"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-I9",
    "block": "ENG-I",
    "blockName": "Testing Strategy",
    "title": "Load test budget enforcer",
    "agentKey": "priya",
    "message": "priya the budget enforcer at `packages/backend/src/services/budget-enforcer.ts` is called before every gateway invocation. write a load test using Vitest + `performance.now()` to benchmark it: run `checkBudgetSync()` 10,000 times and assert it completes in under 100ms total (< 0.01ms per call). this is critical path — it must not add latency",
    "tags": [
      "testing",
      "performance",
      "budget",
      "vitest",
      "benchmark"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-I10",
    "block": "ENG-I",
    "blockName": "Testing Strategy",
    "title": "Snapshot tests for API response shapes",
    "agentKey": "priya",
    "message": "priya add Vitest snapshot tests for the API response shapes of the agent endpoints. for each endpoint (GET /agents, GET /agents/:id, POST /agents) write a test that hits the endpoint via Fastify inject() and snapshots the response shape. this catches accidental breaking changes to the API contract. put them in `packages/backend/src/routes/agents.snapshot.test.ts`",
    "tags": [
      "testing",
      "snapshot",
      "api",
      "vitest",
      "contract"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-J1",
    "block": "ENG-J",
    "blockName": "CI/CD & Deployment",
    "title": "GitHub Actions CI pipeline",
    "agentKey": "omar",
    "message": "omar update `.github/workflows/ci.yml` to enforce the correct gate order: TypeScript → Lint → Tests+Coverage → Build → SonarCloud → Semgrep. tests run only from `packages/backend/` with `--coverage`. LCOV is uploaded as an artifact. fail fast if TypeScript or lint fail. each job should only run if the previous one passed",
    "tags": [
      "devops",
      "ci",
      "github-actions",
      "testing"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-J2",
    "block": "ENG-J",
    "blockName": "CI/CD & Deployment",
    "title": "PM2 ecosystem config for production",
    "agentKey": "omar",
    "message": "omar write the PM2 ecosystem config in `infra/pm2-ecosystem.config.cjs`. apps: `backend` (port 18800, 1 instance, restart on crash), `frontend` (next start, port 3000, 1 instance), `slack-service` (bolt socket mode, 1 instance). for backend: watch `packages/backend/dist/`, env vars from `secrets/.env`. log files in `/var/log/openclaw/`. enable crash restart with max_restarts: 10",
    "tags": [
      "devops",
      "pm2",
      "deployment",
      "infrastructure"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-J3",
    "block": "ENG-J",
    "blockName": "CI/CD & Deployment",
    "title": "Zero-downtime deploy script",
    "agentKey": "omar",
    "message": "omar write `scripts/deploy.sh` for zero-downtime deploys. steps: (1) git pull on server, (2) npm install from root (turbo), (3) build all packages, (4) run migrations, (5) `pm2 reload backend --update-env` (not restart — reload does zero-downtime), (6) health check `GET /health` with retry (3 attempts, 5s between), (7) rollback if health check fails",
    "tags": [
      "devops",
      "deployment",
      "pm2",
      "shell",
      "rollback"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-J4",
    "block": "ENG-J",
    "blockName": "CI/CD & Deployment",
    "title": "SOPS secret decryption in CI",
    "agentKey": "omar",
    "message": "omar in the GitHub Actions CI workflow we need to decrypt SOPS secrets for the integration tests. add a step to `.github/workflows/ci.yml` that: (1) installs `sops` and `age`, (2) writes the age private key from GitHub secret `SOPS_AGE_KEY` to a temp file, (3) decrypts `secrets/.env` to a temp location, (4) exports vars as env vars for the test job. clean up the temp files after",
    "tags": [
      "devops",
      "ci",
      "sops",
      "secrets",
      "github-actions"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-J5",
    "block": "ENG-J",
    "blockName": "CI/CD & Deployment",
    "title": "Litestream SQLite replication config",
    "agentKey": "omar",
    "message": "omar configure Litestream for continuous SQLite replication in `infra/litestream.yml`. replicate the main DB from `/var/openclaw/db/mission-control.db` to an S3-compatible bucket (Backblaze B2 — creds from env vars). snapshot every hour, retain 7 days of WAL segments. write a launchd plist in `infra/launchd/com.openclaw.litestream.plist` to keep it running",
    "tags": [
      "devops",
      "litestream",
      "sqlite",
      "backup",
      "launchd"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-J6",
    "block": "ENG-J",
    "blockName": "CI/CD & Deployment",
    "title": "PF firewall rules for Tailscale-only access",
    "agentKey": "omar",
    "message": "omar write the PF firewall rules in `infra/pf/openclaw.conf`. requirements: (1) block all inbound by default, (2) allow Tailscale interface (utun*) for ports 18800, 3000, 22, (3) allow loopback, (4) block 18800 and 3000 on all other interfaces, (5) allow outbound HTTPS (443) for gateway calls. add a launchd plist to load these rules on boot",
    "tags": [
      "devops",
      "pf-firewall",
      "security",
      "tailscale",
      "infra"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-J7",
    "block": "ENG-J",
    "blockName": "CI/CD & Deployment",
    "title": "Health check monitoring script",
    "agentKey": "omar",
    "message": "omar write `scripts/monitor.sh` — a monitoring script that runs every minute via launchd. it checks: (1) `GET /health` on port 18800 returns 200, (2) `pm2 list` shows all 3 processes online, (3) disk usage below 80%, (4) DB file is writable. if any check fails, write to `/var/log/openclaw/alerts.log` with timestamp + what failed. also send a Slack webhook alert",
    "tags": [
      "devops",
      "monitoring",
      "shell",
      "launchd",
      "health-check"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-J8",
    "block": "ENG-J",
    "blockName": "CI/CD & Deployment",
    "title": "Rollback procedure documentation and script",
    "agentKey": "omar",
    "message": "omar write a rollback script `scripts/rollback.sh` that reverts a failed deploy. it should: (1) accept a git SHA as argument, (2) `git checkout {sha}` on the server, (3) rebuild, (4) `pm2 reload` all services, (5) run health check. also document the full rollback runbook in `infra/RUNBOOK.md` — what to check, when to rollback, how to verify the rollback worked",
    "tags": [
      "devops",
      "rollback",
      "deployment",
      "shell",
      "runbook"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-J9",
    "block": "ENG-J",
    "blockName": "CI/CD & Deployment",
    "title": "Turbo build caching in CI",
    "agentKey": "omar",
    "message": "omar our CI builds are taking 4+ minutes because Turbo isn't caching properly. update `.github/workflows/ci.yml` to: (1) enable Turbo remote caching with the Vercel remote cache (set TURBO_TOKEN and TURBO_TEAM secrets), (2) configure the cache key to include package-lock.json hashes, (3) restore cache on pull_request and push to main. also add a `turbo prune` step to limit what gets installed",
    "tags": [
      "devops",
      "ci",
      "turbo",
      "caching",
      "performance"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-J10",
    "block": "ENG-J",
    "blockName": "CI/CD & Deployment",
    "title": "Automated database migration in deploy",
    "agentKey": "omar",
    "message": "omar add an automated migration step to `scripts/deploy.sh`. before reloading PM2: run `node packages/backend/dist/db/migrate.js` and capture the exit code. if migrations fail (non-zero exit), abort the deploy and trigger rollback immediately. log migration output to `/var/log/openclaw/migrations.log` with timestamp. never reload PM2 if migrations fail",
    "tags": [
      "devops",
      "deployment",
      "database",
      "migration",
      "safety"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-K1",
    "block": "ENG-K",
    "blockName": "Infrastructure & Monitoring",
    "title": "PF firewall rule review after Tailscale update",
    "agentKey": "omar",
    "message": "omar just upgraded Tailscale to 1.82 and now i'm seeing some weird traffic patterns in the PF logs. can you review `infra/pf/rules.pf` and make sure the Tailscale interface rules are still tight? specifically worried about whether utun interfaces are still blocked from reaching the DB port 5432 directly",
    "tags": [
      "infra",
      "pf-firewall",
      "tailscale",
      "security"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-K2",
    "block": "ENG-K",
    "blockName": "Infrastructure & Monitoring",
    "title": "Litestream backup verification script",
    "agentKey": "omar",
    "message": "omar we've had Litestream running for 3 weeks but nobody's ever actually tested a restore. can you write a shell script at `scripts/verify-backup.sh` that does a test restore to a temp dir, checks row counts in the key tables (agents, budgets, audit_log), and sends a Slack alert if anything looks off? runs nightly at 3am",
    "tags": [
      "infra",
      "litestream",
      "backup",
      "monitoring",
      "shell"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-K3",
    "block": "ENG-K",
    "blockName": "Infrastructure & Monitoring",
    "title": "PM2 memory threshold alert",
    "agentKey": "omar",
    "message": "omar the backend process hit 800MB last night before PM2 auto-restarted it. memory limit in `infra/pm2/ecosystem.config.js` is set to 1GB. can you lower the threshold to 512MB and also add a `max_restarts: 5` + `restart_delay: 5000` so we don't end up in a crash loop if there's a real leak?",
    "tags": [
      "infra",
      "pm2",
      "monitoring",
      "memory"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-K4",
    "block": "ENG-K",
    "blockName": "Infrastructure & Monitoring",
    "title": "Pino log rotation with launchd",
    "agentKey": "omar",
    "message": "omar logs in `/var/log/openclaw/` are growing fast. currently no rotation at all. can you set up log rotation via launchd plist — keep 7 days of compressed logs, delete anything older. also make sure the plist is in `infra/launchd/` so it's tracked in git",
    "tags": [
      "infra",
      "logging",
      "launchd",
      "pino",
      "log-rotation"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-K5",
    "block": "ENG-K",
    "blockName": "Infrastructure & Monitoring",
    "title": "SOPS secret rotation workflow",
    "agentKey": "omar",
    "message": "omar we need to rotate the HMAC_SHARED_SECRET in `secrets/.env`. it's SOPS-encrypted with age. walk me through the full rotation: decrypt, update the value, re-encrypt, redeploy backend without downtime using PM2. also what do we need to update on the frontend side (if anything)?",
    "tags": [
      "infra",
      "sops",
      "secrets",
      "rotation",
      "security"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-K6",
    "block": "ENG-K",
    "blockName": "Infrastructure & Monitoring",
    "title": "GitHub Actions CI timeout tuning",
    "agentKey": "omar",
    "message": "omar the CI pipeline in `.github/workflows/ci.yml` keeps timing out at the Playwright step — it's set to 10 mins but E2E tests are consistently taking 12-14 mins now. can you bump the E2E job timeout, add test sharding across 2 runners to speed it up, and cache the Playwright browsers between runs?",
    "tags": [
      "infra",
      "ci",
      "github-actions",
      "playwright",
      "performance"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-K7",
    "block": "ENG-K",
    "blockName": "Infrastructure & Monitoring",
    "title": "Tailscale ACL audit for new agent service",
    "agentKey": "omar",
    "message": "omar we're about to deploy the new slack-service on port 13900. need to update the Tailscale ACL so the Mac Mini can reach it from within the tailnet, but no external devices can. can you draft the ACL changes and also add the new port to `infra/pf/rules.pf`? document the change in `agent_docs/` too",
    "tags": [
      "infra",
      "tailscale",
      "acl",
      "networking",
      "security"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-K8",
    "block": "ENG-K",
    "blockName": "Infrastructure & Monitoring",
    "title": "Restic backup for agent state files",
    "agentKey": "omar",
    "message": "omar `/var/openclaw/agents/` has SOUL.md and MEMORY.md files for all our agents. these aren't in git and if the disk dies we lose all agent personality/memory. can you add a Restic backup job that snapshots `/var/openclaw/` daily to the local B2 bucket, with 30-day retention? add it to `infra/launchd/`",
    "tags": [
      "infra",
      "restic",
      "backup",
      "agent-state"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-K9",
    "block": "ENG-K",
    "blockName": "Infrastructure & Monitoring",
    "title": "Health check endpoint for external monitoring",
    "agentKey": "omar",
    "message": "omar i want to add a `/health/deep` endpoint to the backend that PM2 and any external ping service can hit. it should check: DB connection (read test), disk space > 10% free, memory < 90%, Litestream WAL lag < 30s. return 200 with JSON breakdown if healthy, 503 if any check fails. james handles the actual route but you set up the PM2 health check hook",
    "tags": [
      "infra",
      "monitoring",
      "health-check",
      "pm2"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-K10",
    "block": "ENG-K",
    "blockName": "Infrastructure & Monitoring",
    "title": "OrbStack container networking isolation",
    "agentKey": "omar",
    "message": "omar the browser sandbox container in OrbStack (Playwright) needs to be completely isolated from our main backend — it should only be able to reach the public internet, not `127.0.0.1:18800`. can you verify the OrbStack network config enforces this and add a test that confirms the container can't curl our API? put findings in a runbook at `infra/runbooks/browser-sandbox-isolation.md`",
    "tags": [
      "infra",
      "orbstack",
      "docker",
      "security",
      "isolation"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-L1",
    "block": "ENG-L",
    "blockName": "Performance & Optimization",
    "title": "SQLite WAL checkpoint tuning",
    "agentKey": "marcus",
    "message": "marcus DB queries are getting slow on read-heavy pages — p95 is ~200ms which seems too high for SQLite. i suspect WAL checkpointing is happening mid-request. can you review the WAL config in `packages/backend/src/db/connection.ts` and recommend PRAGMA changes? also want your take on whether we should run checkpoints on a timer vs passive mode",
    "tags": [
      "performance",
      "sqlite",
      "wal",
      "database",
      "optimization"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-L2",
    "block": "ENG-L",
    "blockName": "Performance & Optimization",
    "title": "Next.js bundle size regression",
    "agentKey": "elena",
    "message": "elena ran `next build` and the dashboard bundle jumped from 340kb to 680kb after the last merge. can you use the Next.js bundle analyzer to find what caused the spike? my guess is we accidentally imported the full recharts package somewhere. fix it and make sure we're using tree-shakeable imports",
    "tags": [
      "performance",
      "nextjs",
      "bundle-size",
      "optimization"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-L3",
    "block": "ENG-L",
    "blockName": "Performance & Optimization",
    "title": "SSE throttle tuning for agent dashboard",
    "agentKey": "james",
    "message": "james the agent dashboard is getting hammered with SSE events when multiple agents are running — i'm seeing 50+ events/second come through. the throttle in `packages/backend/src/routes/sse.ts` is set to 100/s which is way too loose. can you implement per-client debouncing at 10 events/sec with a leading-edge flush so the first event is always immediate?",
    "tags": [
      "performance",
      "sse",
      "throttling",
      "realtime"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-L4",
    "block": "ENG-L",
    "blockName": "Performance & Optimization",
    "title": "Memory leak investigation in backend process",
    "agentKey": "marcus",
    "message": "marcus PM2 logs show backend memory growing ~5MB/hour since we added the SSE handler. never drops between requests. can you look at `packages/backend/src/routes/sse.ts` and `packages/backend/src/services/event-bus.ts` — i suspect we're not cleaning up listeners when SSE clients disconnect. what's your analysis and what should james fix?",
    "tags": [
      "performance",
      "memory-leak",
      "sse",
      "debugging"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-L5",
    "block": "ENG-L",
    "blockName": "Performance & Optimization",
    "title": "SQLite index strategy for audit log queries",
    "agentKey": "james",
    "message": "james the audit log page is running EXPLAIN QUERY PLAN and showing full table scans on the `audit_log` table. we query by `agent_id`, `event_type`, and date range constantly. can you add the right composite indexes in a migration file at `packages/backend/src/db/migrations/`? make sure you test with EXPLAIN to confirm they're actually being used",
    "tags": [
      "performance",
      "sqlite",
      "indexes",
      "database",
      "query-optimization"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-L6",
    "block": "ENG-L",
    "blockName": "Performance & Optimization",
    "title": "Expo app cold start optimization",
    "agentKey": "kai",
    "message": "kai the mobile app cold start is at 4.2 seconds on my iPhone 15 Pro — way too slow. can you profile what's happening during startup? i suspect we're doing too much in the root layout before navigation is ready. look at `packages/mobile/app/_layout.tsx` and see if we can defer the Zustand store hydration and auth check until after the shell renders",
    "tags": [
      "performance",
      "expo",
      "cold-start",
      "mobile",
      "optimization"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-L7",
    "block": "ENG-L",
    "blockName": "Performance & Optimization",
    "title": "HTTP keep-alive and connection pooling",
    "agentKey": "james",
    "message": "james every API call from frontend to backend is creating a new TCP connection — no keep-alive. can you configure undici connection pooling in the backend's HTTP client at `packages/backend/src/lib/http-client.ts`? want persistent connections with a pool of 10, 60s timeout, and proper cleanup on server shutdown",
    "tags": [
      "performance",
      "http",
      "connection-pooling",
      "undici"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-L8",
    "block": "ENG-L",
    "blockName": "Performance & Optimization",
    "title": "Zustand store selector over-rendering",
    "agentKey": "elena",
    "message": "elena the agent list page is re-rendering 8 times per SSE event — i can see it in React DevTools. tracked it down to a selector in `packages/frontend/src/stores/agent-store.ts` that returns a new object every render. can you fix the selector to use shallow equality and add a `useShallow` wrapper? also check if the AgentCard components need React.memo",
    "tags": [
      "performance",
      "zustand",
      "react",
      "rendering",
      "optimization"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-L9",
    "block": "ENG-L",
    "blockName": "Performance & Optimization",
    "title": "Vitest test suite speed",
    "agentKey": "priya",
    "message": "priya our full test suite takes 4 minutes to run. CI is slow because of it. can you look at the Vitest config in `packages/backend/vitest.config.ts` and figure out how to speed things up? specifically interested in: parallel workers, shared DB setup vs per-test, and whether any tests are doing real I/O they shouldn't be",
    "tags": [
      "performance",
      "vitest",
      "testing",
      "ci",
      "optimization"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-L10",
    "block": "ENG-L",
    "blockName": "Performance & Optimization",
    "title": "Fastify request parsing overhead",
    "agentKey": "marcus",
    "message": "marcus profiling shows 40ms average overhead on all API routes before any business logic runs. that seems way too high for Fastify which should be sub-5ms. can you review the middleware chain in `packages/backend/src/app.ts` — specifically the auth middleware and the Zod validation hooks? i want to know which middleware is expensive before asking james to optimize",
    "tags": [
      "performance",
      "fastify",
      "middleware",
      "profiling"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-M1",
    "block": "ENG-M",
    "blockName": "Bug Triage & Debugging",
    "title": "SQLITE_BUSY error under concurrent writes",
    "agentKey": "james",
    "message": "james getting intermittent `SQLITE_BUSY: database is locked` errors in prod. error trace points to `packages/backend/src/db/write-mutex.ts`. the mutex should be serializing writes but something is bypassing it. can you audit all the write paths and find any direct `db.prepare().run()` calls that aren't going through `writeTransaction()`? there might be one in the budget enforcer",
    "tags": [
      "bug",
      "sqlite",
      "concurrency",
      "debugging",
      "write-mutex"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-M2",
    "block": "ENG-M",
    "blockName": "Bug Triage & Debugging",
    "title": "Session cookie not persisting in Safari",
    "agentKey": "elena",
    "message": "elena users on Safari are getting logged out on every page refresh. Chrome works fine. the session cookie is HttpOnly + Secure + SameSite=Lax. my guess is Safari's ITP is stripping it. can you check `packages/backend/src/auth/session.ts` — do we need SameSite=None + Secure for Tailscale cross-origin? also check if there's a domain mismatch",
    "tags": [
      "bug",
      "auth",
      "safari",
      "cookies",
      "session"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-M3",
    "block": "ENG-M",
    "blockName": "Bug Triage & Debugging",
    "title": "Race condition in agent status update",
    "agentKey": "james",
    "message": "james there's a race where an agent's status shows \"running\" in the UI for 10-15 seconds after it's already completed. looks like the SSE event fires before the DB write commits. can you look at `packages/backend/src/services/agent-runner.ts` — i think we're emitting the event and writing to DB in parallel instead of awaiting the write first",
    "tags": [
      "bug",
      "race-condition",
      "sse",
      "sqlite",
      "async"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-M4",
    "block": "ENG-M",
    "blockName": "Bug Triage & Debugging",
    "title": "TypeScript strict mode breaking the build",
    "agentKey": "marcus",
    "message": "marcus just enabled `strictNullChecks` in `packages/shared/tsconfig.json` and now the build fails with 47 type errors across packages. before james and elena spend hours fixing these, can you categorize the errors? i want to know: how many are real bugs vs just missing null checks, and what's the priority order to fix them? pull the error output from `npm run typecheck`",
    "tags": [
      "bug",
      "typescript",
      "strict-mode",
      "build",
      "triage"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-M5",
    "block": "ENG-M",
    "blockName": "Bug Triage & Debugging",
    "title": "Zod validation silently passing invalid data",
    "agentKey": "james",
    "message": "james found a bug where agents are being created with empty string names — should be blocked by the Zod schema in `packages/shared/src/schemas/agent.ts`. the schema has `z.string().min(1)` but somehow empty strings are getting through. can you write a failing test that reproduces it and then figure out what's stripping validation? my guess is something's calling `.parse()` with a transform upstream",
    "tags": [
      "bug",
      "zod",
      "validation",
      "testing"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-M6",
    "block": "ENG-M",
    "blockName": "Bug Triage & Debugging",
    "title": "Expo Router navigation crash on deep link",
    "agentKey": "kai",
    "message": "kai the mobile app crashes with `Error: Cannot read property 'params' of undefined` when opened via a deep link to `openclaw://agents/123`. works fine with normal navigation. can you look at `packages/mobile/app/(tabs)/agents/[id].tsx` — i think we're accessing route params before the navigator is initialized. what's the fix?",
    "tags": [
      "bug",
      "expo",
      "deep-link",
      "crash",
      "navigation"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-M7",
    "block": "ENG-M",
    "blockName": "Bug Triage & Debugging",
    "title": "HMAC signature mismatch in CI but not local",
    "agentKey": "james",
    "message": "james CI integration tests are failing with 401 `INVALID_SIGNATURE` on HMAC-authenticated routes, but tests pass locally. the HMAC secret in CI env is set correctly. could this be a timing issue — is `crypto.timingSafeEqual` doing something different? or is the message being serialized differently in CI? check `packages/backend/src/middleware/hmac.ts` and the test setup",
    "tags": [
      "bug",
      "hmac",
      "auth",
      "ci",
      "testing"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-M8",
    "block": "ENG-M",
    "blockName": "Bug Triage & Debugging",
    "title": "Next.js hydration mismatch on agent cards",
    "agentKey": "elena",
    "message": "elena getting React hydration errors on the agents dashboard — `Hydration failed because the server rendered HTML didn't match the client`. error is in `packages/frontend/src/components/agents/AgentCard.tsx`. the card shows an agent's \"last run\" timestamp and i think the server and client are formatting dates differently. how do we fix this without removing SSR?",
    "tags": [
      "bug",
      "nextjs",
      "hydration",
      "ssr",
      "react"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-M9",
    "block": "ENG-M",
    "blockName": "Bug Triage & Debugging",
    "title": "Budget enforcer allowing negative token balance",
    "agentKey": "james",
    "message": "james found a critical bug: an agent ran 200k tokens over budget without being stopped. looking at `packages/backend/src/services/budget-enforcer.ts` — the `checkBudgetSync` function checks before the call but there's no deduction on completion, so if two requests come in simultaneously they both pass the check. this needs a fix using writeTransaction to make check+deduct atomic",
    "tags": [
      "bug",
      "critical",
      "budget-enforcer",
      "concurrency",
      "sqlite"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-M10",
    "block": "ENG-M",
    "blockName": "Bug Triage & Debugging",
    "title": "Playwright tests flaky on headless CI",
    "agentKey": "priya",
    "message": "priya E2E tests in `packages/frontend/tests/e2e/` are flaking ~30% of the time in CI — always the same 3 tests that involve SSE. locally they pass 100% of the time. my theory: the backend SSE stream isn't fully ready when Playwright tries to assert on it. can you add proper wait conditions and maybe a retry config to `playwright.config.ts` to stabilize them?",
    "tags": [
      "bug",
      "playwright",
      "flaky-tests",
      "sse",
      "ci"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-N1",
    "block": "ENG-N",
    "blockName": "Technical Debt",
    "title": "Audit direct DB access patterns",
    "agentKey": "marcus",
    "message": "marcus before we scale the team i want to audit the codebase for any patterns that bypass our architectural rules. specifically: (1) direct SQLite writes outside writeTransaction, (2) any console.log instead of pino, (3) `any` types in TypeScript. can you do a cross-package audit and give me a prioritized list of what to fix first?",
    "tags": [
      "tech-debt",
      "audit",
      "architecture",
      "code-quality"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-N2",
    "block": "ENG-N",
    "blockName": "Technical Debt",
    "title": "Migrate from CommonJS to ESM in backend",
    "agentKey": "marcus",
    "message": "marcus half the backend is CJS (`require()`) and half is ESM (`import`). the inconsistency is causing issues with some packages. can you design the migration path to full ESM? i need to know: what files to change, what tsconfig changes are needed, whether we need `.js` extensions in imports, and which packages might break (better-sqlite3, pino, fastify). give me the plan before james starts",
    "tags": [
      "tech-debt",
      "esm",
      "typescript",
      "migration",
      "architecture"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-N3",
    "block": "ENG-N",
    "blockName": "Technical Debt",
    "title": "Dead code removal pass",
    "agentKey": "marcus",
    "message": "marcus we've got routes and services that were scaffolded but never fully implemented — they're just stubs with TODO comments. can you identify dead code across `packages/backend/src/` that's safe to delete? specifically looking for: unused exports, routes with no tests, and service files that are imported nowhere. give me a list, then james will do the actual deletion",
    "tags": [
      "tech-debt",
      "dead-code",
      "cleanup",
      "refactoring"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-N4",
    "block": "ENG-N",
    "blockName": "Technical Debt",
    "title": "Consolidate duplicated Zod schemas",
    "agentKey": "marcus",
    "message": "marcus we have the same Agent schema defined in 3 places: `packages/shared/src/schemas/`, `packages/backend/src/routes/agents.ts`, and `packages/frontend/src/lib/api.ts`. they've drifted and now have subtle differences. can you audit all three, identify the diffs, and spec out the consolidation into @openclaw/shared so james and elena can implement?",
    "tags": [
      "tech-debt",
      "zod",
      "schemas",
      "duplication",
      "shared"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-N5",
    "block": "ENG-N",
    "blockName": "Technical Debt",
    "title": "Upgrade better-sqlite3 to Node 22 native binding",
    "agentKey": "marcus",
    "message": "marcus better-sqlite3 is pinned to 9.4.3 from when we were on Node 18. now we're on Node 22 and there's a newer version with N-API improvements that should be faster. what are the risks of upgrading? check the release notes for breaking changes and tell me what tests we'd need to run to validate the upgrade. i'll have omar do the infra prep and james do the code changes",
    "tags": [
      "tech-debt",
      "dependency",
      "upgrade",
      "sqlite",
      "nodejs"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-N6",
    "block": "ENG-N",
    "blockName": "Technical Debt",
    "title": "Replace custom error classes with shared ones",
    "agentKey": "marcus",
    "message": "marcus the backend has its own `ApiError` class in `packages/backend/src/utils/errors.ts` that duplicates what's in `@openclaw/shared`. the frontend also has a third version. can you design the refactor to use only the shared error classes everywhere? i need the full dependency graph before anyone touches code — specifically which services instantiate these errors",
    "tags": [
      "tech-debt",
      "error-handling",
      "refactoring",
      "shared-types"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-N7",
    "block": "ENG-N",
    "blockName": "Technical Debt",
    "title": "Remove hardcoded timeouts and magic numbers",
    "agentKey": "marcus",
    "message": "marcus spotted at least 12 places in the codebase with hardcoded numbers like `setTimeout(fn, 5000)` or `maxRetries = 3` that should be config constants. can you find all of them across packages and suggest what should be an env var, what should be a named constant, and what should stay inline? this is for a junior engineer so i need clear justifications",
    "tags": [
      "tech-debt",
      "constants",
      "config",
      "code-quality"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-N8",
    "block": "ENG-N",
    "blockName": "Technical Debt",
    "title": "Migrate Zustand v4 to v5 store patterns",
    "agentKey": "marcus",
    "message": "marcus Zustand 5.0 dropped and it removes the deprecated selectors API we're using in like 15 components. elena needs to do the migration but i want your analysis first: what's the new API, what's the diff in our usage pattern, and are there any stores that will need significant rethinking? particularly worried about the agent-store which has a lot of derived state",
    "tags": [
      "tech-debt",
      "zustand",
      "migration",
      "frontend",
      "state-management"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-N9",
    "block": "ENG-N",
    "blockName": "Technical Debt",
    "title": "Audit and pin all dependency versions",
    "agentKey": "marcus",
    "message": "marcus found 30+ packages using `^` or `~` version prefixes in package.json files. our coding standards say exact pins only. can you audit all three package.json files (backend, frontend, mobile) and give me the list of packages that need pinning? also flag any that are already out of date and might have security issues",
    "tags": [
      "tech-debt",
      "dependencies",
      "versioning",
      "security",
      "audit"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-N10",
    "block": "ENG-N",
    "blockName": "Technical Debt",
    "title": "Unify logging approach across all packages",
    "agentKey": "marcus",
    "message": "marcus right now we have 3 different logger setups: the backend uses pino with redaction, the frontend uses console.log everywhere, and the mobile app has a mix. can you design the unified logging approach? frontend needs structured logging that works in both browser and SSR, mobile needs something that works with Expo logging. give me the architecture before anyone writes code",
    "tags": [
      "tech-debt",
      "logging",
      "pino",
      "architecture",
      "consistency"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-O1",
    "block": "ENG-O",
    "blockName": "Agent Architecture",
    "title": "Supervisor model hierarchical routing",
    "agentKey": "marcus",
    "message": "marcus i want to understand how the supervisor model should handle routing when a sub-agent escalates to its supervisor. specifically: if a trading agent fails confidence check and needs to escalate, who decides which supervisor handles it? can you map out the decision tree from the agent_architecture.md and tell me if our current implementation in `packages/backend/src/services/` matches the spec?",
    "tags": [
      "agent",
      "architecture",
      "supervisor",
      "escalation",
      "routing"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-O2",
    "block": "ENG-O",
    "blockName": "Agent Architecture",
    "title": "Confidence classifier threshold tuning",
    "agentKey": "james",
    "message": "james the confidence classifier in `packages/backend/src/services/confidence-classifier.ts` is rejecting too many routine actions as \"approval required\". can you look at the threshold logic — we want autonomous for scores >= 0.8, approval for 0.5-0.8, and hard-stop below 0.5. also add a test for each boundary condition. what are the current thresholds?",
    "tags": [
      "agent",
      "confidence-classifier",
      "thresholds",
      "testing"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-O3",
    "block": "ENG-O",
    "blockName": "Agent Architecture",
    "title": "Budget enforcer per-project token allocation",
    "agentKey": "james",
    "message": "james we need to support per-project budget allocation on top of per-agent budgets. so an agent might have a 100k token daily limit, but project A can only use 40k of that. can you spec out the DB schema changes needed in `agent_docs/database_schema.md` and implement them? the `checkBudgetSync` function in `packages/backend/src/services/budget-enforcer.ts` needs to check both limits",
    "tags": [
      "agent",
      "budget-enforcer",
      "database",
      "schema",
      "tokens"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-O4",
    "block": "ENG-O",
    "blockName": "Agent Architecture",
    "title": "Gateway retry with exponential backoff",
    "agentKey": "james",
    "message": "james the gateway client in `packages/backend/src/services/gateway/client.ts` currently fails immediately on any non-200 response. we need retry logic: 3 attempts, exponential backoff starting at 500ms, jitter to avoid thundering herd, and don't retry on 4xx errors (only 5xx and network errors). also update the audit log to track retry attempts",
    "tags": [
      "agent",
      "gateway",
      "retry",
      "resilience",
      "error-handling"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-O5",
    "block": "ENG-O",
    "blockName": "Agent Architecture",
    "title": "Approval manager queue overflow handling",
    "agentKey": "james",
    "message": "james if a lot of agents trigger approval requests simultaneously, the approval queue could back up for hours. what happens to agents that are waiting? do they hold open DB connections? do they time out? can you look at `packages/backend/src/services/approval-manager.ts` and implement a queue size limit (max 50 pending) with proper rejection handling when the limit is hit?",
    "tags": [
      "agent",
      "approval-manager",
      "queue",
      "resilience"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-O6",
    "block": "ENG-O",
    "blockName": "Agent Architecture",
    "title": "Agent SOUL.md hot reload without restart",
    "agentKey": "james",
    "message": "james right now if we update an agent's SOUL.md at `/var/openclaw/agents/{id}/SOUL.md`, the running agent doesn't pick up the changes until it's restarted. can you implement a file watcher using `node:fs` FSWatcher that detects SOUL.md changes and triggers a soft reload of the agent config? it shouldn't interrupt active runs, only apply to new executions",
    "tags": [
      "agent",
      "soul",
      "hot-reload",
      "file-watcher",
      "config"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-O7",
    "block": "ENG-O",
    "blockName": "Agent Architecture",
    "title": "Cross-agent artifact handoff validation",
    "agentKey": "marcus",
    "message": "marcus agents are supposed to write artifacts to `/var/openclaw/artifacts/{date}/{agent-id}/` and cross-agent handoffs go to `/var/openclaw/artifacts/{date}/shared/`. but there's no validation that the files are in the right format. can you design a schema validation layer that runs when an agent writes to the shared dir? james would implement it but i need the architecture first",
    "tags": [
      "agent",
      "artifacts",
      "validation",
      "cross-agent",
      "architecture"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-O8",
    "block": "ENG-O",
    "blockName": "Agent Architecture",
    "title": "Memory consolidation from MEMORY.md to MEMORY.json",
    "agentKey": "james",
    "message": "james agents accumulate knowledge in `MEMORY.md` but the structured version in `MEMORY.json` is supposed to stay in sync. right now they're out of sync because we don't have a consolidation job. can you implement a nightly job that reads MEMORY.md, extracts key-value facts using a simple regex pattern, and writes them to MEMORY.json? it should be idempotent and not clobber manually added JSON entries",
    "tags": [
      "agent",
      "memory",
      "consolidation",
      "scheduled-job"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-O9",
    "block": "ENG-O",
    "blockName": "Agent Architecture",
    "title": "Model routing — Haiku vs Sonnet vs Opus",
    "agentKey": "marcus",
    "message": "marcus the model routing logic needs to be formalized. right now everything defaults to Sonnet but we should be using Haiku for analytics/reporting and Opus only for planning/architecture review. can you write the decision matrix and then tell james where in the codebase to implement the routing? it should be based on agent domain + action type, not hardcoded per-agent",
    "tags": [
      "agent",
      "model-routing",
      "architecture",
      "cost-optimization"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-O10",
    "block": "ENG-O",
    "blockName": "Agent Architecture",
    "title": "Agent lifecycle state machine",
    "agentKey": "marcus",
    "message": "marcus agents have states (idle, queued, running, paused, completed, failed) but there's no formal state machine enforcing valid transitions. right now code is doing arbitrary state updates which is causing weird UI states. can you design the state machine with valid transitions and guard conditions? draw it out as a table. james will implement the enforcer in TypeScript once you've spec'd it",
    "tags": [
      "agent",
      "state-machine",
      "lifecycle",
      "architecture"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-P1",
    "block": "ENG-P",
    "blockName": "SSE & Real-time",
    "title": "SSE reconnection with last-event-id",
    "agentKey": "james",
    "message": "james our SSE implementation in `packages/backend/src/routes/sse.ts` doesn't support `Last-Event-ID` so when a client reconnects it misses all events from the gap. can you implement event buffering for the last 100 events per channel and replay missed events on reconnection? the event ID format should be `{timestamp}-{sequence}` for ordering",
    "tags": [
      "sse",
      "realtime",
      "reconnection",
      "event-buffering"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-P2",
    "block": "ENG-P",
    "blockName": "SSE & Real-time",
    "title": "SSE channel architecture for multi-agent dashboard",
    "agentKey": "marcus",
    "message": "marcus right now every client subscribes to a single `/api/events` stream and gets all agent events. this won't scale when we have 26 agents running simultaneously. can you design the channel architecture — should we do per-agent channels, per-department channels, or a filtered fan-out pattern? i need the architecture decision with tradeoffs before james implements anything",
    "tags": [
      "sse",
      "architecture",
      "channels",
      "scalability",
      "realtime"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-P3",
    "block": "ENG-P",
    "blockName": "SSE & Real-time",
    "title": "SSE heartbeat to detect dead connections",
    "agentKey": "james",
    "message": "james we're leaking SSE connections when clients close their browser without the close event firing (e.g. network drop). can you add a heartbeat mechanism: server sends a comment `: ping` every 30 seconds, and if writing fails it cleans up the client from the connection registry? make sure the heartbeat doesn't count toward the 10 events/second throttle limit",
    "tags": [
      "sse",
      "heartbeat",
      "connection-management",
      "realtime"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-P4",
    "block": "ENG-P",
    "blockName": "SSE & Real-time",
    "title": "Frontend SSE hook with automatic reconnection",
    "agentKey": "elena",
    "message": "elena the SSE hook in `packages/frontend/src/hooks/use-sse.ts` doesn't auto-reconnect when the connection drops. i need it to: (1) attempt reconnect with exponential backoff up to 30s, (2) pass the last event ID on reconnect, (3) show a \"reconnecting...\" status in the UI, (4) stop reconnecting after 5 failed attempts and show an error state",
    "tags": [
      "sse",
      "frontend",
      "reconnection",
      "hooks",
      "react"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-P5",
    "block": "ENG-P",
    "blockName": "SSE & Real-time",
    "title": "SSE authentication and token refresh",
    "agentKey": "james",
    "message": "james SSE connections currently auth via session cookie. but sessions expire after 24 hours and long-running SSE connections get silently dropped. can you implement token-based SSE auth: client passes a short-lived token as a query param, backend validates it, and we send a `token-expiring` event 5 minutes before expiry so the client can refresh without dropping the connection?",
    "tags": [
      "sse",
      "auth",
      "token-refresh",
      "session",
      "security"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-P6",
    "block": "ENG-P",
    "blockName": "SSE & Real-time",
    "title": "Agent log streaming via SSE",
    "agentKey": "james",
    "message": "james i want to stream live agent execution logs through SSE. when an agent is running, its stdout/stderr should appear in real-time in the UI. can you add a `agent.log` event type to the SSE channel that carries log line + timestamp + log level? it needs the 10 events/sec throttle but with a higher priority for `ERROR` level lines (never throttle errors)",
    "tags": [
      "sse",
      "logging",
      "streaming",
      "agent",
      "realtime"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-P7",
    "block": "ENG-P",
    "blockName": "SSE & Real-time",
    "title": "React Native SSE support in Expo",
    "agentKey": "kai",
    "message": "kai the mobile app needs to receive real-time agent status updates too. React Native doesn't natively support EventSource. can you add SSE support using `react-native-sse` or a polling fallback? it should work the same as the web hook interface — same event types, same reconnection logic. put the hook in `packages/mobile/src/hooks/use-sse.ts`",
    "tags": [
      "sse",
      "mobile",
      "expo",
      "react-native",
      "realtime"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-P8",
    "block": "ENG-P",
    "blockName": "SSE & Real-time",
    "title": "SSE event deduplication on reconnect",
    "agentKey": "elena",
    "message": "elena when the SSE connection drops and reconnects, we sometimes get duplicate events displayed in the UI — the backend replays the buffer but some events were already processed. can you add client-side deduplication in `packages/frontend/src/hooks/use-sse.ts`? keep the last 200 event IDs in a Set and skip rendering any event with an ID we've already seen",
    "tags": [
      "sse",
      "deduplication",
      "frontend",
      "hooks"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-P9",
    "block": "ENG-P",
    "blockName": "SSE & Real-time",
    "title": "SSE load testing strategy",
    "agentKey": "priya",
    "message": "priya i want to know how many concurrent SSE connections our backend can handle before it falls over. can you write a load test using autocannon or k6 that ramps from 10 to 500 concurrent SSE connections and measures: connection establishment time, event latency, and memory growth per client? put the test in `packages/backend/tests/load/sse-load.ts`",
    "tags": [
      "sse",
      "load-testing",
      "performance",
      "testing"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-P10",
    "block": "ENG-P",
    "blockName": "SSE & Real-time",
    "title": "SSE event schema versioning",
    "agentKey": "marcus",
    "message": "marcus as we add new event types to SSE, older mobile and frontend clients might not know how to handle them and could crash. can you design an event versioning strategy? i'm thinking each event should carry a `v` field and clients should gracefully ignore unknown event types or fields. what's the minimal schema we should standardize on before we have multiple clients in prod?",
    "tags": [
      "sse",
      "versioning",
      "schema",
      "architecture",
      "compatibility"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-Q1",
    "block": "ENG-Q",
    "blockName": "Sprint Planning",
    "title": "Sprint 8 goal setting",
    "agentKey": "sarah",
    "message": "sarah we finished sprint 7. backend auth and session management are done. for sprint 8 i want to focus on agent execution core — running agents, budget enforcement, confidence classifier, and approval workflow. can you pull the relevant tasks from the Asana backend project (GID: 1213281083480354) and draft sprint goals with acceptance criteria? need story point estimates too",
    "tags": [
      "sprint",
      "planning",
      "asana",
      "backend",
      "agent-execution"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-Q2",
    "block": "ENG-Q",
    "blockName": "Sprint Planning",
    "title": "Dependency mapping for SSE feature",
    "agentKey": "sarah",
    "message": "sarah we want to ship the SSE real-time dashboard in sprint 9. help me map out all the dependencies — what backend work does james need to complete before elena can start the frontend hooks? are there any API contracts we need to define first? create the dependency graph and flag anything that blocks parallel work",
    "tags": [
      "sprint",
      "planning",
      "dependencies",
      "sse",
      "coordination"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-Q3",
    "block": "ENG-Q",
    "blockName": "Sprint Planning",
    "title": "Breaking down the mobile onboarding task",
    "agentKey": "sarah",
    "message": "sarah the Asana task \"Mobile onboarding flow\" is currently one giant task worth 13 story points. that's too big for one sprint. can you break it down into subtasks — biometric setup, agent selection screen, permissions walkthrough, and notifications opt-in? create the subtasks in Asana under the mobile project (GID: 1213281098780271) with proper estimates",
    "tags": [
      "sprint",
      "planning",
      "asana",
      "mobile",
      "task-breakdown"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-Q4",
    "block": "ENG-Q",
    "blockName": "Sprint Planning",
    "title": "Velocity analysis and sprint capacity",
    "agentKey": "sarah",
    "message": "sarah our last 3 sprints completed 32, 28, and 35 story points respectively. we have 7 agents but marcus and sarah don't write code so effective coding capacity is 5. next sprint has 2 days off for infra maintenance. can you calculate realistic sprint capacity and tell me how many points we can commit to? also flag if we're showing any velocity trends",
    "tags": [
      "sprint",
      "velocity",
      "capacity",
      "planning"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-Q5",
    "block": "ENG-Q",
    "blockName": "Sprint Planning",
    "title": "Technical debt sprint allocation",
    "agentKey": "sarah",
    "message": "sarah marcus wants to allocate 20% of each sprint to technical debt. i want to formalize this in our sprint planning process. can you create a standing Asana section for tech debt work in the backend project and create 3 initial tasks for the highest-priority items marcus identified? also add a sprint planning template that includes the 20% allocation rule",
    "tags": [
      "sprint",
      "tech-debt",
      "asana",
      "planning",
      "process"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-Q6",
    "block": "ENG-Q",
    "blockName": "Sprint Planning",
    "title": "Cross-package task coordination",
    "agentKey": "sarah",
    "message": "sarah we have a situation where the trading pipeline feature requires changes in backend (james), frontend (elena), and mobile (kai) simultaneously. how do i structure the Asana tasks so the dependencies are clear and engineers aren't blocked on each other? i want james to define the API contract first, then elena and kai can work in parallel. set this up in Asana",
    "tags": [
      "sprint",
      "planning",
      "cross-team",
      "dependencies",
      "asana"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-Q7",
    "block": "ENG-Q",
    "blockName": "Sprint Planning",
    "title": "QA cycle integration into sprints",
    "agentKey": "sarah",
    "message": "sarah right now priya is doing QA at the end of each sprint and always running out of time. i want to integrate QA into the sprint — each feature should have a corresponding test task that priya works on in parallel, not after. can you restructure the sprint template in Asana so every feature task automatically gets a QA subtask assigned to priya?",
    "tags": [
      "sprint",
      "qa",
      "process",
      "asana",
      "planning"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-Q8",
    "block": "ENG-Q",
    "blockName": "Sprint Planning",
    "title": "Sprint 10 preview — DevOps focus",
    "agentKey": "sarah",
    "message": "sarah omar has been doing ad-hoc infra work every sprint. i want sprint 10 to be a dedicated DevOps sprint: CI hardening, backup verification, log rotation, Tailscale ACL updates, and PM2 reliability. can you pull all open DevOps tasks from Asana (GID: 1213281097771440), prioritize them, and draft sprint 10 goals? omar's capacity is roughly 40 points",
    "tags": [
      "sprint",
      "devops",
      "planning",
      "asana",
      "infra"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-Q9",
    "block": "ENG-Q",
    "blockName": "Sprint Planning",
    "title": "Blocking issue escalation process",
    "agentKey": "sarah",
    "message": "sarah last sprint james was blocked for 2 days waiting on an API contract from marcus and nobody caught it in standup. can you define a formal blocking escalation process? if an engineer is blocked for more than 4 hours, what should happen? i want it documented and also create a blocked task template in Asana with the escalation steps baked in",
    "tags": [
      "sprint",
      "process",
      "blockers",
      "escalation",
      "asana"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-Q10",
    "block": "ENG-Q",
    "blockName": "Sprint Planning",
    "title": "MVP readiness assessment",
    "agentKey": "sarah",
    "message": "sarah the target launch is May 2026 on ProductHunt. we have roughly 6 weeks left. can you do an honest MVP readiness assessment? look at all 5 Asana projects, identify what's critical path for launch vs what can wait for v2, and tell me if 6 weeks is realistic. flag anything that's a single point of failure if it slips",
    "tags": [
      "sprint",
      "mvp",
      "planning",
      "launch",
      "assessment"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-R1",
    "block": "ENG-R",
    "blockName": "Cross-Team Handoffs",
    "title": "Backend→Frontend API contract for agent list",
    "agentKey": "marcus",
    "message": "marcus james is done with the agents CRUD API. before elena starts the frontend, i need a formal API contract defined. can you review `packages/backend/src/routes/agents.ts` and produce a typed contract — request/response shapes, error codes, pagination format, and the exact Zod schema. elena needs this as a source of truth before she writes a single fetch call",
    "tags": [
      "handoff",
      "api-contract",
      "backend",
      "frontend",
      "types"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-R2",
    "block": "ENG-R",
    "blockName": "Cross-Team Handoffs",
    "title": "Mobile API compatibility check",
    "agentKey": "marcus",
    "message": "marcus kai started implementing the mobile agent list screen and hit a problem — the API returns snake_case field names but the mobile store expects camelCase. instead of having two different response formats, can you design a consistent naming convention and tell me where the transformation should happen? i don't want transforms scattered across both frontend and mobile",
    "tags": [
      "handoff",
      "api-contract",
      "mobile",
      "naming-convention",
      "consistency"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-R3",
    "block": "ENG-R",
    "blockName": "Cross-Team Handoffs",
    "title": "DevOps pre-deployment checklist",
    "agentKey": "marcus",
    "message": "marcus before omar deploys a new backend release, what's the checklist? i want a formal handoff process: what signals does james need to give omar (e.g. \"all tests green, migration file checked in, env vars documented\"), what does omar check before running `pm2 reload`, and what's the rollback procedure if something breaks post-deploy?",
    "tags": [
      "handoff",
      "deployment",
      "process",
      "devops",
      "backend"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-R4",
    "block": "ENG-R",
    "blockName": "Cross-Team Handoffs",
    "title": "Backend SSE contract for frontend hooks",
    "agentKey": "james",
    "message": "james before elena builds the frontend SSE hooks, i need you to document the exact SSE event contract: all event types, their payload shapes (TypeScript interfaces), which channels they appear on, and any client-side ordering guarantees. put this in `agent_docs/sse_events.md` so elena has a stable reference and we don't end up with mismatched event handling",
    "tags": [
      "handoff",
      "sse",
      "contract",
      "documentation",
      "types"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-R5",
    "block": "ENG-R",
    "blockName": "Cross-Team Handoffs",
    "title": "Frontend→Backend error handling alignment",
    "agentKey": "marcus",
    "message": "marcus the frontend is showing generic \"Something went wrong\" for all API errors because the error codes from the backend aren't being mapped to user-friendly messages. can you audit the error codes in `packages/shared/src/constants/error-codes.ts` and produce a mapping guide for elena? she needs to know which codes are user-actionable vs internal, and what message to show for each",
    "tags": [
      "handoff",
      "error-handling",
      "frontend",
      "backend",
      "ux"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-R6",
    "block": "ENG-R",
    "blockName": "Cross-Team Handoffs",
    "title": "Slack service integration with backend",
    "agentKey": "marcus",
    "message": "marcus the slack-service needs to call backend APIs to trigger agent runs. can you design the inter-service auth protocol? it should use HMAC-SHA256 signing (we already have the middleware in `packages/backend/src/middleware/hmac.ts`). james handles the backend side, omar sets up the secret sharing, but you need to design the protocol first so both sides implement it consistently",
    "tags": [
      "handoff",
      "slack",
      "hmac",
      "inter-service",
      "auth"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-R7",
    "block": "ENG-R",
    "blockName": "Cross-Team Handoffs",
    "title": "Shared types package update workflow",
    "agentKey": "sarah",
    "message": "sarah when james adds a new type to `packages/shared`, what's the process for elena and kai to know they need to update? right now it's just word of mouth. can you define a formal shared-package update workflow — maybe a CHANGELOG in shared/, a PR template that tags frontend/mobile reviewers, and a Asana task template for cross-package type changes?",
    "tags": [
      "handoff",
      "shared-types",
      "process",
      "communication",
      "workflow"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-R8",
    "block": "ENG-R",
    "blockName": "Cross-Team Handoffs",
    "title": "QA handoff: what makes a feature testable",
    "agentKey": "sarah",
    "message": "sarah priya keeps getting features handed to her that are hard to test — no test IDs on UI elements, no API mock data, no documented edge cases. can you create a \"QA-ready checklist\" that james and elena must complete before handing a feature to priya? include things like: data-testid attributes, documented error scenarios, seeded test data for E2E",
    "tags": [
      "handoff",
      "qa",
      "process",
      "checklist",
      "testing"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-R9",
    "block": "ENG-R",
    "blockName": "Cross-Team Handoffs",
    "title": "Database migration coordination",
    "agentKey": "marcus",
    "message": "marcus whenever james adds a DB migration, omar needs to know to run it before the next deploy and kai/elena need to know if any existing API shapes changed. can you design the migration communication process? i want: migration file naming convention, a way to flag breaking vs non-breaking schema changes, and the exact sequence of \"who does what\" for a migration that changes a column type",
    "tags": [
      "handoff",
      "database",
      "migration",
      "coordination",
      "process"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-R10",
    "block": "ENG-R",
    "blockName": "Cross-Team Handoffs",
    "title": "Feature flag rollout coordination",
    "agentKey": "sarah",
    "message": "sarah we're shipping the confidence classifier behind a feature flag. james adds the flag to the backend, elena needs to respect it on the frontend, and omar controls when it's enabled in prod. can you coordinate this handoff? create the Asana tasks for each engineer, document the flag name and expected behavior in each package, and define the rollout sequence",
    "tags": [
      "handoff",
      "feature-flag",
      "coordination",
      "asana",
      "rollout"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-S1",
    "block": "ENG-S",
    "blockName": "Documentation",
    "title": "API specification update for agent routes",
    "agentKey": "marcus",
    "message": "marcus the `agent_docs/api_specification.md` is 3 sprints out of date — it's missing the pagination, filter, and sort params we added to the agents endpoint. can you review the current route implementations in `packages/backend/src/routes/agents.ts` and update the spec? use OpenAPI-style format with request/response examples. this is the source of truth for frontend and mobile",
    "tags": [
      "docs",
      "api-spec",
      "agents",
      "openapi"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-S2",
    "block": "ENG-S",
    "blockName": "Documentation",
    "title": "Architecture decision record for SQLite choice",
    "agentKey": "marcus",
    "message": "marcus i get asked \"why SQLite not Postgres?\" at least once a week. can you write a proper ADR (Architecture Decision Record) for the SQLite choice? format: context, decision, consequences (positive and negative), and alternatives considered. put it in `agent_docs/` as `adr-001-sqlite-over-postgres.md`. be honest about the tradeoffs — this isn't a marketing doc",
    "tags": [
      "docs",
      "adr",
      "architecture",
      "sqlite",
      "decision"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-S3",
    "block": "ENG-S",
    "blockName": "Documentation",
    "title": "Onboarding guide for new engineers",
    "agentKey": "sarah",
    "message": "sarah if we bring on a new engineer tomorrow, what do they need to read to be productive? can you write a 1-2 page onboarding guide that covers: repo structure, dev environment setup, which CLAUDE.md to read first, how to run tests, the deployment process, and who to ask for what? put it somewhere they'll actually find it — maybe as a new `ONBOARDING.md` at the repo root",
    "tags": [
      "docs",
      "onboarding",
      "new-engineer",
      "guide"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-S4",
    "block": "ENG-S",
    "blockName": "Documentation",
    "title": "Database schema documentation update",
    "agentKey": "marcus",
    "message": "marcus `agent_docs/database_schema.md` doesn't reflect the 6 new tables james added in the last sprint (agent_executions, budget_allocations, approval_queue, confidence_scores, agent_skills, agent_reviews). can you update the schema doc with full column definitions, types, indexes, and foreign keys for each new table? pull from the migration files in `packages/backend/src/db/migrations/`",
    "tags": [
      "docs",
      "database-schema",
      "sqlite",
      "migrations"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-S5",
    "block": "ENG-S",
    "blockName": "Documentation",
    "title": "Incident runbook for SQLITE_BUSY",
    "agentKey": "marcus",
    "message": "marcus we've hit SQLITE_BUSY twice in production. can you write an incident runbook at `infra/runbooks/sqlite-busy.md`? cover: how to detect it (log patterns), immediate mitigation steps, root cause analysis checklist, and how to verify the fix worked. omar and james should both be able to follow it without calling each other",
    "tags": [
      "docs",
      "runbook",
      "incident",
      "sqlite",
      "operations"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-S6",
    "block": "ENG-S",
    "blockName": "Documentation",
    "title": "HMAC authentication implementation guide",
    "agentKey": "marcus",
    "message": "marcus any new service that needs to talk to the backend has to implement HMAC auth. can you write a clear implementation guide that a developer can follow without reading the source? include: the signing algorithm, the header format, timestamp validation window, the exact test vector to verify your implementation, and a TypeScript code snippet. add to `agent_docs/security_requirements.md`",
    "tags": [
      "docs",
      "hmac",
      "auth",
      "security",
      "implementation-guide"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-S7",
    "block": "ENG-S",
    "blockName": "Documentation",
    "title": "Agent architecture overview for non-engineers",
    "agentKey": "sarah",
    "message": "sarah the marketing team keeps asking \"how does the agent system actually work?\" and getting lost in the technical docs. can you write a plain-English overview of the agent architecture — what's a supervisor vs sub-agent, how does confidence scoring work in plain terms, what does \"approval required\" mean for the user? max 500 words, no jargon. they want to use it in marketing copy",
    "tags": [
      "docs",
      "agent-architecture",
      "plain-english",
      "marketing",
      "communication"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-S8",
    "block": "ENG-S",
    "blockName": "Documentation",
    "title": "SOPS secret management runbook",
    "agentKey": "marcus",
    "message": "marcus nobody except omar fully understands the SOPS+age secret management setup. if omar is unavailable during an incident that requires a secret rotation, we're stuck. can you write a complete runbook at `infra/runbooks/sops-secrets.md`? cover: how to decrypt/encrypt secrets, add a new secret, rotate an existing one, and what to do if the age key is lost",
    "tags": [
      "docs",
      "sops",
      "secrets",
      "runbook",
      "security"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-S9",
    "block": "ENG-S",
    "blockName": "Documentation",
    "title": "ADR for SSE over WebSockets",
    "agentKey": "marcus",
    "message": "marcus before someone asks \"why not WebSockets?\" for the 5th time, can you write ADR-002 for our SSE decision? cover the technical tradeoffs honestly — SSE is unidirectional which is fine for our read-heavy dashboard, but document the cases where we'd need to add WebSockets in the future (e.g. agent control panel that needs bidirectional comms). put in `agent_docs/`",
    "tags": [
      "docs",
      "adr",
      "sse",
      "websocket",
      "architecture",
      "decision"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-S10",
    "block": "ENG-S",
    "blockName": "Documentation",
    "title": "Deployment checklist documentation",
    "agentKey": "sarah",
    "message": "sarah omar does every deployment from memory and there's no written checklist. if omar is sick we can't deploy. can you create a formal deployment checklist at `infra/runbooks/deployment-checklist.md`? include: pre-deployment (tests green, migration staged, secrets updated), deployment steps (pm2 reload sequence), smoke tests, and rollback steps. verify with omar before finalizing",
    "tags": [
      "docs",
      "deployment",
      "checklist",
      "runbook",
      "operations"
    ],
    "difficulty": "basic"
  },
  {
    "id": "ENG-T1",
    "block": "ENG-T",
    "blockName": "Edge Cases & Stress",
    "title": "Impossible ask: real-time collaboration between agents",
    "agentKey": "marcus",
    "message": "marcus i want two agents to share a working memory in real-time — like Google Docs but for agent context. they should both read and write to the same state simultaneously without conflicts. can you implement this? oh and it needs to work offline too",
    "tags": [
      "edge-case",
      "impossible-ask",
      "agent",
      "architecture",
      "offline"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-T2",
    "block": "ENG-T",
    "blockName": "Edge Cases & Stress",
    "title": "Conflicting requirements: zero downtime + SQLite migrations",
    "agentKey": "james",
    "message": "james i want zero-downtime deployments AND i want to be able to rename columns in SQLite. the migration for next sprint renames `agent_status` to `execution_state` across 3 tables. how do we do this without taking the app down? SQLite doesn't support RENAME COLUMN in the version we're on. figure it out",
    "tags": [
      "edge-case",
      "conflicting-requirements",
      "sqlite",
      "migration",
      "zero-downtime"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-T3",
    "block": "ENG-T",
    "blockName": "Edge Cases & Stress",
    "title": "Scope creep: simple config page becomes multi-tenant",
    "agentKey": "sarah",
    "message": "sarah the Asana task for \"agent config page\" is a 3-point story. in the sprint review someone said \"oh we should support multiple users per org so each user has their own agent configs.\" can you assess the scope impact? what was 3 points, what is it now, what's the risk of doing it now vs later, and what's your recommendation? i need to push back or accept the change before tomorrow's standup",
    "tags": [
      "edge-case",
      "scope-creep",
      "multi-tenant",
      "sprint",
      "planning"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-T4",
    "block": "ENG-T",
    "blockName": "Edge Cases & Stress",
    "title": "Missing context: \"fix the agent thing\"",
    "agentKey": "marcus",
    "message": "marcus the production alert says \"agent thing broken\" from the PM's Slack message. no stack trace, no logs, no reproduction steps. what's your debugging process? what information do you need to gather before assigning this to anyone, and what are the 3 most likely things that could be broken based on what we've shipped recently?",
    "tags": [
      "edge-case",
      "missing-context",
      "debugging",
      "triage",
      "production"
    ],
    "difficulty": "intermediate"
  },
  {
    "id": "ENG-T5",
    "block": "ENG-T",
    "blockName": "Edge Cases & Stress",
    "title": "Security vs feature: HMAC on internal health check",
    "agentKey": "james",
    "message": "james PM says the `/health` endpoint needs to be public so our uptime monitoring service can hit it without auth. security says all endpoints need HMAC. who's right? what's the actual threat model here — the health endpoint only returns 200/503 with no sensitive data. what's your recommendation and how do you implement it without setting a bad precedent for bypassing auth?",
    "tags": [
      "edge-case",
      "security-vs-feature",
      "hmac",
      "health-check",
      "tradeoff"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-T6",
    "block": "ENG-T",
    "blockName": "Edge Cases & Stress",
    "title": "Concurrent sprint emergencies",
    "agentKey": "sarah",
    "message": "sarah it's wednesday of sprint 8. we have a P0 prod bug (james and priya needed), a deadline for a demo on friday (elena working on it), and omar just told me the backup system has been silently failing for 4 days. everything is urgent. how do you prioritize? who works on what, what gets deferred, and how do you communicate the tradeoffs to me?",
    "tags": [
      "edge-case",
      "prioritization",
      "sprint",
      "concurrent-emergencies",
      "leadership"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-T7",
    "block": "ENG-T",
    "blockName": "Edge Cases & Stress",
    "title": "Impossible performance ask",
    "agentKey": "marcus",
    "message": "marcus the stakeholder says API p99 latency must be under 10ms. we're on SQLite with WAL mode, pino logging, Zod validation, and HMAC middleware on every request. current p99 is 45ms. can you get it under 10ms without removing any of the core features? be honest about what's physically possible",
    "tags": [
      "edge-case",
      "impossible-ask",
      "performance",
      "latency",
      "realistic-expectations"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-T8",
    "block": "ENG-T",
    "blockName": "Edge Cases & Stress",
    "title": "Dependency upgrade breaks 40% of tests",
    "agentKey": "priya",
    "message": "priya james upgraded better-sqlite3 from 9.4.3 to 10.1.0 and now 40% of tests fail with `Error: Module did not self-register` — looks like a native binding issue. the upgrade was supposed to be non-breaking. can you quickly triage which tests are actually broken vs just failing due to the native module issue? we need to know if we should roll back or just fix the test setup",
    "tags": [
      "edge-case",
      "dependency-upgrade",
      "native-modules",
      "triage",
      "testing"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-T9",
    "block": "ENG-T",
    "blockName": "Edge Cases & Stress",
    "title": "Disk full at 2am during agent run",
    "agentKey": "omar",
    "message": "omar just got paged — the Mac Mini disk is at 99.8% capacity. a trading agent is mid-run and the DB WAL file can't grow. what do you do in the next 10 minutes to stabilize without corrupting the DB? and after the incident is resolved, what monitoring and alerting should have prevented this?",
    "tags": [
      "edge-case",
      "incident",
      "disk-full",
      "sqlite",
      "emergency"
    ],
    "difficulty": "advanced"
  },
  {
    "id": "ENG-T10",
    "block": "ENG-T",
    "blockName": "Edge Cases & Stress",
    "title": "Contradictory security requirements",
    "agentKey": "marcus",
    "message": "marcus i have two requirements that directly conflict: (1) the security policy says all API responses must include a `request-id` header for auditability, (2) the privacy requirements say we must not include any persistent identifiers in responses that could be correlated across sessions. a UUID request ID satisfies (1) but violates (2) if the client stores it. how do we satisfy both?",
    "tags": [
      "edge-case",
      "security",
      "privacy",
      "contradictory-requirements",
      "architecture"
    ],
    "difficulty": "advanced"
  }
];

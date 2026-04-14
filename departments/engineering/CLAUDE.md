# Engineering Department

## Team (7 agents)

| Agent              | Model  | Role                                                   |
| ------------------ | ------ | ------------------------------------------------------ |
| product-owner      | Opus   | Sprint planning, Asana backlog, user stories (NO code) |
| tech-lead          | Opus   | Architecture, PR review, approvals (NO code)           |
| backend-developer  | Sonnet | API, database, server logic                            |
| frontend-developer | Sonnet | React/Next.js components, pages                        |
| mobile-developer   | Sonnet | React Native / Expo                                    |
| qa-engineer        | Haiku  | Tests, coverage, bug reports                           |
| devops-engineer    | Sonnet | CI/CD, infra, deployment                               |

## Tech Stack

- Backend: Node.js 22, TypeScript 5.x strict, Fastify, better-sqlite3 (WAL), Pino, Zod
- Frontend: Next.js 15 (App Router + Turbopack), Tailwind CSS, shadcn/ui, Zustand
- Mobile: Expo, React Native (placeholder)
- Testing: Vitest (unit/integration), Playwright (E2E)
- CI: GitHub Actions — TypeScript → Lint → Tests+Coverage → Build → SonarCloud → Semgrep

## Code Location

- `packages/backend/src/` — Fastify API, services, DB layer
- `packages/frontend/src/` — Next.js pages, components, hooks
- `packages/shared/src/` — Shared types and Zod schemas
- `packages/slack-service/src/` — Bolt.js Slack service

## Asana Workflow

- Product Owner manages backlog: Backlog → Sprint Planning → In Progress → In Review → QA → Done
- Dev agents update Asana task status when starting work and creating PRs
- QA moves tasks to Done on pass, back to In Progress on fail

## Quality Gates

- 80% coverage minimum, 100% for critical paths (auth, budget, HMAC, trading)
- All writes through writeTransaction() from @/db/write-mutex.js
- Zod validation at API boundaries
- Parameterized queries only
- Conventional commits: feat(<scope>):, fix(<scope>):, refactor(<scope>):, test(<scope>): — scope is required

## PR Checklist

- [ ] TypeScript compiles clean
- [ ] ESLint passes
- [ ] Tests pass with coverage target met
- [ ] No secrets in code
- [ ] Reviewed by tech-lead

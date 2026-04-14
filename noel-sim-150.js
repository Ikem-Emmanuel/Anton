#!/usr/bin/env node
/**
 * noel-sim-150.js — 150 real-world AI use cases for Anton / the team.
 *
 * Usage:
 *   node .anton/noel-sim-150.js                   # run all 150
 *   node .anton/noel-sim-150.js --block=A,B,C     # run specific blocks
 *   node .anton/noel-sim-150.js --from=A3 --to=B7 # run a range
 *   node .anton/noel-sim-150.js --id=A1,C4,H2     # run specific IDs
 *   node .anton/noel-sim-150.js --dry-run          # print without running
 *   node .anton/noel-sim-150.js --list             # list all scenario IDs
 *
 * Logs:   .anton/logs/simulation/noel-150-<date>.jsonl
 * Report: .anton/logs/simulation/noel-150-<date>-report.md
 *
 * ─── 15 Blocks, 150 Scenarios ─────────────────────────────────
 * A: Morning PA Routine           (10)
 * B: Email & Communications       (10)
 * C: Engineering Code & Review    (10)
 * D: Engineering Infra & Ops      (10)
 * E: Sprint & Project Management  (10)
 * F: Marketing & Content          (10)
 * G: Data & Analytics             (10)
 * H: Growth & GTM                 (10)
 * I: Sales & Business Dev         (10)
 * J: HR & People Ops              (10)
 * K: Finance & Operations         (10)
 * L: Research & Competitive Intel (10)
 * M: Cross-Dept Coordination      (10)
 * N: Emergency & Crisis Mgmt      (10)
 * O: Strategic Planning           (10)
 */

import { writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ANTON_ROOT = __dirname;
const PROJECT_ROOT = join(ANTON_ROOT, '..');

// ─── Parse CLI args ───────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN   = args.includes('--dry-run');
const LIST_ONLY = args.includes('--list');
const blockArg  = args.find(a => a.startsWith('--block='))?.split('=')[1];
const fromArg   = args.find(a => a.startsWith('--from='))?.split('=')[1];
const toArg     = args.find(a => a.startsWith('--to='))?.split('=')[1];
const idArg     = args.find(a => a.startsWith('--id='))?.split('=')[1];

const FILTER_BLOCKS = blockArg ? blockArg.toUpperCase().split(',') : null;
const FILTER_IDS    = idArg ? idArg.toUpperCase().split(',') : null;

// ─── Init subsystems (skip in dry-run) ───────────────────────
let ask, trackRequest, getReport, logMessage, logResponse, logError, TEAM;

if (!DRY_RUN && !LIST_ONLY) {
  const sessions   = await import('./service/src/sessions.js');
  const analytics  = await import('./service/src/analytics.js');
  const logger     = await import('./service/src/logger.js');
  const teamModule = await import('./service/src/team.js');

  sessions.init(ANTON_ROOT, PROJECT_ROOT);
  analytics.initAnalytics(ANTON_ROOT);
  logger.initLogger(ANTON_ROOT);

  ask           = sessions.ask;
  trackRequest  = analytics.trackRequest;
  getReport     = analytics.getReport;
  logMessage    = logger.logMessage;
  logResponse   = logger.logResponse;
  logError      = logger.logError;
  TEAM          = teamModule.TEAM;
} else {
  const teamModule = await import('./service/src/team.js');
  TEAM = teamModule.TEAM;
}

// ─── Log setup ────────────────────────────────────────────────
const LOG_DIR = join(ANTON_ROOT, 'logs', 'simulation');
mkdirSync(LOG_DIR, { recursive: true });
const TODAY = new Date().toISOString().split('T')[0];
const LOG_FILE    = join(LOG_DIR, `noel-150-${TODAY}.jsonl`);
const REPORT_FILE = join(LOG_DIR, `noel-150-${TODAY}-report.md`);

function logEntry(entry) {
  if (DRY_RUN || LIST_ONLY) return;
  appendFileSync(LOG_FILE, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
}

function print(msg) { process.stdout.write(msg + '\n'); }

function color(code, text) { return `\x1b[${code}m${text}\x1b[0m`; }

// ─── Scenario runner ──────────────────────────────────────────
async function runScenario(s) {
  logEntry({ role: 'noel', agent: s.agent.name, message: s.message, scenario: s.id });
  const start = Date.now();
  try {
    const response = await ask(s.agent, s.message);
    const elapsed = Date.now() - start;
    const tokEst = Math.round((response?.length || 0) / 4);
    trackRequest(s.agent.name, start, !!response, response?.length || 0);
    logMessage(s.agent.name, s.message, 'noel-150');
    logResponse(s.agent.name, response, elapsed, tokEst);
    logEntry({ role: 'agent', agent: s.agent.name, response: response || '[no response]', elapsed_ms: elapsed, tokens_est: tokEst, scenario: s.id });
    return { response, elapsed };
  } catch (e) {
    const elapsed = Date.now() - start;
    trackRequest(s.agent.name, start, false, 0);
    logError(s.agent.name, e, s.message.slice(0, 200));
    logEntry({ role: 'error', agent: s.agent.name, error: e.message, scenario: s.id });
    print(color('31', `[ERROR] ${s.agent.name}/${s.id}: ${e.message?.slice(0, 100)}`));
    return { response: null, error: e.message, elapsed };
  }
}

// ═══════════════════════════════════════════════════════════════
// SCENARIO DEFINITIONS — 150 cases
// Each: { id, block, blockName, title, agent (ref key), message }
// ═══════════════════════════════════════════════════════════════

const SCENARIOS_RAW = [

  // ══ BLOCK A — Morning PA Routine (10) ═══════════════════════
  {
    id: 'A1', block: 'A', blockName: 'Morning PA Routine',
    title: 'Morning briefing with overnight summary',
    agentKey: 'riley',
    message: `Riley, morning briefing please. I need: (1) what shipped overnight, (2) top 3 priorities for today, (3) anything time-sensitive I need to decide before noon, (4) any team blockers I should know about. Keep it under 200 words.`,
  },
  {
    id: 'A2', block: 'A', blockName: 'Morning PA Routine',
    title: 'Triage competing urgent requests',
    agentKey: 'marcus',
    message: `Marcus, I have four things marked urgent this morning: (1) auth PR needs final merge decision, (2) investor wants a product demo at 2pm today, (3) Priya found a regression in the session store, (4) a customer reported data not loading. Rank these by actual urgency and tell me what order I should tackle them, and what I can delegate.`,
  },
  {
    id: 'A3', block: 'A', blockName: 'Morning PA Routine',
    title: 'Prep for board/investor call',
    agentKey: 'sarah',
    message: `Sarah, investor call in 90 minutes. They want to know: product velocity this quarter, what's shipped, what's next, and any risks. Pull together a tight 5-point briefing — shipped milestones, current sprint state, 30-day roadmap, key risks, and one ask from me to them. Investor-grade, no fluff.`,
  },
  {
    id: 'A4', block: 'A', blockName: 'Morning PA Routine',
    title: 'Draft reply to an urgent customer Slack DM',
    agentKey: 'diana',
    message: `Diana, a customer DM'd me on Slack: "Hey Noel, our enterprise team has been getting 401 errors on the agent API about once per hour. This is blocking our demo for a big client tomorrow. We need this fixed ASAP." Draft a response for me: acknowledge urgency, let them know we're investigating now, give a realistic ETA for an update, and ask for their API key prefix so James can trace it. Professional, empathetic, specific.`,
  },
  {
    id: 'A5', block: 'A', blockName: 'Morning PA Routine',
    title: 'Set daily focus — one thing mode',
    agentKey: 'marcus',
    message: `Marcus, I'm in one-thing mode today — I can only focus deeply on a single high-leverage task. Given our stage (pre-launch, auth complete, agent detail page in flight), what's the single most important thing I should personally work on today? Not what the team needs — what do I need to do that no one else can?`,
  },
  {
    id: 'A6', block: 'A', blockName: 'Morning PA Routine',
    title: 'Catch up after 3-day absence',
    agentKey: 'riley',
    message: `Riley, I was offline for 3 days — no Slack, no email. Catch me up: what did each department ship or progress on, what decisions were made without me, what's waiting for my input, and what did I miss that I should read about? Structured summary by department.`,
  },
  {
    id: 'A7', block: 'A', blockName: 'Morning PA Routine',
    title: 'Meeting prep — 1:1 with Marcus',
    agentKey: 'sarah',
    message: `Sarah, I have a 1:1 with Marcus in 30 minutes. Prep me: what are the open engineering decisions he's been waiting on from me, what's his current sprint load, any tension or blockers in the engineering team I should address, and what's a good question I should ask him about his own workload and wellbeing?`,
  },
  {
    id: 'A8', block: 'A', blockName: 'Morning PA Routine',
    title: 'Weekly review — what did we actually accomplish?',
    agentKey: 'riley',
    message: `Riley, it's Friday. Give me a honest weekly review: what did we plan to do vs what we actually shipped, where did we lose time, what was the highest-leverage work this week, and what's one thing we should do differently next week? Don't soften it — I want the real read.`,
  },
  {
    id: 'A9', block: 'A', blockName: 'Morning PA Routine',
    title: 'Prepare for all-hands meeting',
    agentKey: 'sarah',
    message: `Sarah, I'm running an all-hands for all 26 team agents in 1 hour. I want to cover: what we've built so far, where we are vs the plan, biggest challenge right now, and one thing I need from everyone. Draft me a 5-minute speaking script — tight, honest, energizing. Include a clear call-to-action at the end.`,
  },
  {
    id: 'A10', block: 'A', blockName: 'Morning PA Routine',
    title: 'EOD: set tomorrow\'s agenda',
    agentKey: 'riley',
    message: `Riley, end of day. Set my agenda for tomorrow: top 3 priorities, one thing to delegate immediately, anything needing approval that's been sitting, and one relationship touchpoint I should make (customer, investor, or team member). Keep it actionable — I'll use this as my first read tomorrow morning.`,
  },

  // ══ BLOCK B — Email & Communications (10) ════════════════════
  {
    id: 'B1', block: 'B', blockName: 'Email & Communications',
    title: 'Feature delay apology to client',
    agentKey: 'lucas',
    message: `Lucas, draft an email to TechCorp (contact: James Wu, james.wu@techcorp.io). We promised multi-agent dashboard by April 30th — it's slipping 3 weeks to May 21st. The cause: we had to rebuild the session store after discovering a SQLite concurrency bug in load testing. Be honest, apologise once (not repeatedly), give the revised date, explain what we learned, and offer a 1-month credit as a goodwill gesture. End with AWAITING_APPROVAL: email — client delay notice TechCorp.`,
  },
  {
    id: 'B2', block: 'B', blockName: 'Email & Communications',
    title: 'Monthly investor update',
    agentKey: 'alex',
    message: `Alex, write our April investor update email. Recipients: 3 seed investors. Format: what we shipped (auth system, agent detail page, 26-agent org live), key metrics (token usage trending up 15% WoW, zero P0 incidents this month), what's next (mobile scaffold, trading pipeline, ProductHunt launch in May), one ask (introductions to 2 B2B SaaS CTOs who might be early customers). Under 400 words. Honest and confident. End with AWAITING_APPROVAL: email — April investor update.`,
  },
  {
    id: 'B3', block: 'B', blockName: 'Email & Communications',
    title: 'Vendor negotiation — API pricing',
    agentKey: 'lucas',
    message: `Lucas, draft an email to our Anthropic account manager. We're consuming ~2M tokens/day across Opus, Sonnet, and Haiku, growing 20% MoM. We want to discuss: volume discount tiers, dedicated capacity for production workloads, SLA for uptime, and enterprise support. Tone: collaborative, we're a growth customer they want to keep. End with AWAITING_APPROVAL: email — vendor negotiation Anthropic pricing.`,
  },
  {
    id: 'B4', block: 'B', blockName: 'Email & Communications',
    title: 'Job applicant: warm hold',
    agentKey: 'diana',
    message: `Diana, a senior full-stack developer, Sofia Reyes, sent a cold application (sofia@example.com). Strong portfolio — 6 years React + Node, shipped 3 SaaS products. We're not hiring now but I want to keep her warm. Draft: acknowledge her application warmly, say we're heads-down on launch but are building a bench of great people, ask if she'd be up for a 20-minute coffee chat in 3-4 weeks to learn more about her work. No promises. End with AWAITING_APPROVAL: email — candidate outreach Sofia Reyes.`,
  },
  {
    id: 'B5', block: 'B', blockName: 'Email & Communications',
    title: 'Partnership outreach — integration partner',
    agentKey: 'lucas',
    message: `Lucas, I want to reach out to the CEO of Resend (a transactional email API), asking about an integration partnership. Mission Control could use Resend for agent-triggered emails; Resend gets a developer-tool integration story. Draft a cold outreach email: who we are, why the integration makes sense for both sides, what I'm proposing (a 30-min call), and what's in it for them. Concise, founder-to-founder tone. End with AWAITING_APPROVAL: email — partnership outreach Resend CEO.`,
  },
  {
    id: 'B6', block: 'B', blockName: 'Email & Communications',
    title: 'Customer success: onboarding a new enterprise customer',
    agentKey: 'alex',
    message: `Alex, we just signed our first enterprise customer — Volta Analytics, 50-seat team. Draft their onboarding welcome email: what they have access to, what to do first (3 concrete steps), who their point of contact is (me, Noel), how to get support, and what they can expect in the first 30 days. Warm, professional, specific. End with AWAITING_APPROVAL: email — enterprise onboarding Volta Analytics.`,
  },
  {
    id: 'B7', block: 'B', blockName: 'Email & Communications',
    title: 'Internal team announcement: new process',
    agentKey: 'sarah',
    message: `Sarah, we're introducing a new PR review process starting Monday: all PRs require 1 peer review + 1 lead sign-off before merge, and PRs must be open for minimum 4 hours (so nobody rushes merges). Draft a Slack announcement for #engineering: explain the change, why we're doing it (we had a regression from a rushed merge last week), what it means in practice, and make it clear this isn't about distrust — it's about catching things as a team.`,
  },
  {
    id: 'B8', block: 'B', blockName: 'Email & Communications',
    title: 'Press release: product launch',
    agentKey: 'alex',
    message: `Alex, write a press release for the Mission Control v2.5 launch. For context: OpenClaw builds AI infrastructure tools for developers. MC v2.5 is an enterprise-grade AI agent management platform — real-time monitoring, budget enforcement, human-in-the-loop approvals, and a 26-agent AI organization built on top. Quote from me: "We wanted AI that works like a real team — not just chatbots. MC v2.5 is how you run an AI company, not just use AI." Standard press release format: FOR IMMEDIATE RELEASE, headline, dateline, body, boilerplate, contact info.`,
  },
  {
    id: 'B9', block: 'B', blockName: 'Email & Communications',
    title: 'Respond to a negative review',
    agentKey: 'diana',
    message: `Diana, we got a negative review on ProductHunt: "Tried Mission Control v2 — interesting idea but the setup is way too complex. Took me 3 hours to get a single agent running. Not ready for mainstream." Draft a public response from Noel: acknowledge the feedback (they're right — setup complexity is a known issue), explain what we're doing about it (wizard-style onboarding in v2.5), invite them to try the new version, and thank them for the honest feedback. Not defensive. ~100 words.`,
  },
  {
    id: 'B10', block: 'B', blockName: 'Email & Communications',
    title: 'Slack message to the full team: big win',
    agentKey: 'diana',
    message: `Diana, we just hit a milestone — our first paying enterprise customer signed. Write a Slack message from me to the full team in #general: celebrate the win, name each department's contribution (engineering built the product, marketing created the content, data tracked the funnel, growth nurtured the lead), and set the tone for what comes next. Energetic, specific, and short. Under 120 words.`,
  },

  // ══ BLOCK C — Engineering Code & Review (10) ════════════════
  {
    id: 'C1', block: 'C', blockName: 'Engineering Code & Review',
    title: 'Auth PR code review: security focus',
    agentKey: 'marcus',
    message: `Marcus, do a security-focused code review of our auth system. Key files: packages/backend/src/auth/session.ts, packages/backend/src/middleware/auth.ts, packages/backend/src/routes/auth.ts, and packages/backend/src/repositories/authRepo.ts. Specifically check: timing-safe comparisons, token entropy, HMAC signature validation, SQL injection vectors, and session fixation risk. Give me a severity-rated list — Critical / High / Medium / Low. Don't hold back.`,
  },
  {
    id: 'C2', block: 'C', blockName: 'Engineering Code & Review',
    title: 'Architecture decision: SQLite vs Postgres for scale',
    agentKey: 'marcus',
    message: `Marcus, we've built on SQLite with WAL mode. We're approaching a potential scale question: if we hit 1,000 concurrent users with 26 agents each making DB writes, does SQLite hold? Give me a concrete analysis: current write serialisation setup, estimated write throughput limit, at what user count we'd need to migrate, and what migration to Postgres would look like. I need a clear threshold and a migration plan, not "it depends."`,
  },
  {
    id: 'C3', block: 'C', blockName: 'Engineering Code & Review',
    title: 'Bug triage: SQLite BUSY errors under load',
    agentKey: 'james',
    message: `James, we're getting SQLITE_BUSY errors on the production server under load — about 1 in 20 writes failing, mostly on the agents table. Our write path goes through writeTransaction() with async-mutex. Walk me through: what's most likely causing this despite the mutex, what you'd check in the logs first, and the fix you'd implement. Be specific — what code would you change?`,
  },
  {
    id: 'C4', block: 'C', blockName: 'Engineering Code & Review',
    title: 'API design: streaming agent responses',
    agentKey: 'james',
    message: `James, design the API for streaming agent responses. Currently we use SSE at GET /api/agents/:id/stream. The problem: clients need to know when a tool call starts, when it ends, whether a human approval is needed mid-run, and when the response is final. Design the event schema: what event types, what fields, what the client-side reconnection contract is, and how we handle agent errors mid-stream. Give me the actual TypeScript types.`,
  },
  {
    id: 'C5', block: 'C', blockName: 'Engineering Code & Review',
    title: 'Frontend performance: Next.js 15 optimisation',
    agentKey: 'elena',
    message: `Elena, I want to cut our dashboard Time to Interactive below 2 seconds. Right now the agent list page fetches all agents on load — potentially 26 agents with full configs. Walk me through: what Next.js 15 Server Components strategy you'd use, whether we should paginate or stream the agent list, how to handle SSE reconnection without blocking hydration, and what the quick wins are vs the structural changes. Practical — what would you ship first?`,
  },
  {
    id: 'C6', block: 'C', blockName: 'Engineering Code & Review',
    title: 'Mobile: Expo Router navigation architecture',
    agentKey: 'kai',
    message: `Kai, for our Mission Control mobile app on Expo 52 with Expo Router: design the navigation architecture. We need: tab navigation (Dashboard, Agents, Alerts, Settings), a modal for agent detail, a stack for the agent creation wizard, and deep linking for alert notifications. Give me the file structure for app/ directory, the route file layout, and how you'd handle the auth guard — redirect to /login if no session. Actual code structure, not pseudocode.`,
  },
  {
    id: 'C7', block: 'C', blockName: 'Engineering Code & Review',
    title: 'QA: test strategy for the approval workflow',
    agentKey: 'priya',
    message: `Priya, design the test strategy for our human-in-the-loop approval workflow. This covers: agent produces AWAITING_APPROVAL marker, Anton DMs Noel, Noel replies yes/no, Anton dispatches the result back to the agent. What are the critical paths I need tests for, what are the edge cases (timeout, duplicate approval, approval for already-executed action, spoofed approval from non-Noel user), and what test types — unit vs integration vs E2E? Give me a test matrix.`,
  },
  {
    id: 'C8', block: 'C', blockName: 'Engineering Code & Review',
    title: 'DevOps: CI/CD pipeline design',
    agentKey: 'omar',
    message: `Omar, design our complete CI/CD pipeline for this monorepo. We have: packages/backend (Node.js, TypeScript, Vitest), packages/frontend (Next.js 15), packages/slack-service (Bolt.js), packages/mobile (Expo — not yet built). Target: GitHub Actions. I need: branch strategy (when does CI run, what gates), test stages (unit, integration, E2E), build stages, deployment to Mac Mini via PM2, rollback procedure. Give me the actual .github/workflows/deploy.yml structure.`,
  },
  {
    id: 'C9', block: 'C', blockName: 'Engineering Code & Review',
    title: 'Code review: identify anti-patterns in a PR',
    agentKey: 'marcus',
    message: `Marcus, I'm about to merge a PR from James that adds the health endpoint. He's using a try/catch that swallows errors and returns 200 even when the DB connection check fails. He also has a raw string concatenation in a log message that includes the API key substring. And the test has a sleep(1000) to wait for async operations. These are three anti-patterns. Walk me through: how you'd frame the review feedback for each, what the correct patterns are, and what you'd say to James that's direct but not demoralising.`,
  },
  {
    id: 'C10', block: 'C', blockName: 'Engineering Code & Review',
    title: 'Tech debt: inventory and prioritisation',
    agentKey: 'marcus',
    message: `Marcus, give me an honest tech debt inventory for our current codebase. Based on what you know about our stack and architecture: what are the top 5 tech debt items we're carrying, ranked by risk (not effort)? For each: what is it, what could go wrong if we don't address it, and roughly how many sprint points to fix. I want the list I can use to make actual prioritisation decisions in our next sprint planning.`,
  },

  // ══ BLOCK D — Engineering Infra & Ops (10) ══════════════════
  {
    id: 'D1', block: 'D', blockName: 'Engineering Infra & Ops',
    title: 'Pre-deployment checklist',
    agentKey: 'omar',
    message: `Omar, we're deploying the auth system and agent detail page to production tonight at 10pm. Walk me through your complete pre-deployment checklist: server health checks, database migration safety (we have one this deploy), PM2 config verification, rollback procedure if it goes wrong, who needs to be on standby, and what "green" looks like at 10:15pm. Give me a literal checklist I can follow.`,
  },
  {
    id: 'D2', block: 'D', blockName: 'Engineering Infra & Ops',
    title: 'Monitoring: set up alerts for production',
    agentKey: 'omar',
    message: `Omar, design our production monitoring alert system. We're on Mac Mini M4 with PM2, SQLite, and a Node.js API. I want alerts for: API response time p99 > 2s, error rate > 1%, disk > 80%, memory > 75%, any PM2 process restart, SQLite WAL size > 1GB, Tailscale connection drop. What's the monitoring stack, how do you implement each alert, and where do alerts go (Slack). Give me actual implementation steps.`,
  },
  {
    id: 'D3', block: 'D', blockName: 'Engineering Infra & Ops',
    title: 'Disaster recovery: database corruption scenario',
    agentKey: 'omar',
    message: `Omar, walk me through the disaster recovery procedure if our SQLite database becomes corrupted in production. We have Litestream replication to S3 and Restic backups. Steps: how to detect corruption (symptoms, PRAGMA integrity_check), decision point (restore from Litestream vs Restic vs last known good), restore procedure step by step, verification that the restore is clean, and PM2 restart sequence. How long does this take and what's the data loss window?`,
  },
  {
    id: 'D4', block: 'D', blockName: 'Engineering Infra & Ops',
    title: 'Security: PF firewall rule audit',
    agentKey: 'omar',
    message: `Omar, I want an audit of our PF firewall rules. We're Tailscale-only for admin access, with the public-facing API on port 18800 (Fastify) and frontend on port 3000 (Next.js). What rules should we have in place, what are the common misconfigurations for a Mac Mini running PF, what do I need to verify is blocked, and what test would confirm the rules are working correctly? Give me the actual PF rule set I should have.`,
  },
  {
    id: 'D5', block: 'D', blockName: 'Engineering Infra & Ops',
    title: 'Load testing: how many concurrent users can we handle?',
    agentKey: 'omar',
    message: `Omar, I need to know our production capacity before launch. What's the load testing plan for our Mac Mini M4 (16GB RAM) running Node.js API + Next.js + SQLite? Design the test: tool recommendation, test scenarios (baseline, ramp-up, spike, soak), what metrics to capture, and what "production ready" looks like in numbers. At what concurrent user count do we need to add hardware? Give me actual numbers, not ranges.`,
  },
  {
    id: 'D6', block: 'D', blockName: 'Engineering Infra & Ops',
    title: 'Secrets management: rotate all credentials',
    agentKey: 'omar',
    message: `Omar, I want to rotate all our production credentials this weekend: HMAC_SHARED_SECRET, SESSION_SECRET, DATABASE_ENCRYPTION_KEY, SLACK_BOT_TOKEN, and the Anthropic API key. Walk me through the rotation procedure: correct order to rotate (some are interdependent), how to update SOPS-encrypted secrets files, how to deploy new secrets without downtime, and how to verify each service is using the new credentials. Step by step.`,
  },
  {
    id: 'D7', block: 'D', blockName: 'Engineering Infra & Ops',
    title: 'Incident runbook: Slack service goes down',
    agentKey: 'omar',
    message: `Omar, write a runbook for the incident scenario: Slack service (packages/slack-service) stops responding. The service runs in Socket Mode via PM2. Runbook should cover: initial detection (how do we know), first 5 minutes (what to check), diagnosis decision tree (network vs Socket Mode token vs app crash vs memory), fix procedures for each cause, post-incident verification, and how to prevent recurrence. Format as an actual ops runbook I can hand to anyone on the team.`,
  },
  {
    id: 'D8', block: 'D', blockName: 'Engineering Infra & Ops',
    title: 'Scaling plan: from 1 to 100 customers',
    agentKey: 'marcus',
    message: `Marcus, we're a solo-dev shop on a Mac Mini right now. If we get to 100 paying customers, what breaks first and what do we need to change? Walk me through: the architecture bottlenecks in order of likelihood to fail, what the migration path looks like (Mac Mini → VPS → cloud), what we can defer vs what needs to be in place before we cross 50 customers, and what it would cost. Concrete, honest, no "it depends."`,
  },
  {
    id: 'D9', block: 'D', blockName: 'Engineering Infra & Ops',
    title: 'Dependency audit: outdated and vulnerable packages',
    agentKey: 'james',
    message: `James, run a dependency audit across our monorepo. Check: packages/backend, packages/frontend, packages/slack-service. What are the critical vulnerabilities in our current package versions, which outdated major versions have breaking-change upgrade paths, and what's the order of operations to upgrade safely? Give me a prioritised list — Critical/High/Medium — with the upgrade command for each.`,
  },
  {
    id: 'D10', block: 'D', blockName: 'Engineering Infra & Ops',
    title: 'Documentation: API docs generation plan',
    agentKey: 'james',
    message: `James, we have zero public API documentation. We need it for the enterprise launch. Our API is Fastify with Zod schemas — we have the type information. Design the documentation plan: tool recommendation (Swagger/OpenAPI vs Redoc vs custom), how to generate it from our Fastify+Zod setup, what the documentation portal looks like, versioning strategy, and how to keep it in sync with code. What would you ship in one sprint?`,
  },

  // ══ BLOCK E — Sprint & Project Management (10) ══════════════
  {
    id: 'E1', block: 'E', blockName: 'Sprint & Project Management',
    title: 'Sprint planning: prioritise the backlog',
    agentKey: 'sarah',
    message: `Sarah, sprint planning for next week. We have these items in the backlog: mobile scaffold (8pts, Kai), health endpoint (3pts, James), token usage dashboard (5pts, Ben+Elena), Asana webhook integration (5pts, Zara), vision module tests (2pts, Priya), and trading pipeline v1 architecture (8pts, Marcus+Carlos). Team capacity: roughly 20 points across engineering. Which items do you recommend for sprint, and why? What's the dependency order?`,
  },
  {
    id: 'E2', block: 'E', blockName: 'Sprint & Project Management',
    title: 'Asana: create and link sprint tasks',
    agentKey: 'sarah',
    message: `Sarah, create the following Asana task and add it to our Backend project (GID: 1213281083480354): Title: "Implement GET /api/health endpoint". Assignee: James. Priority: P1. Story points: 3. Description: Returns JSON with service_status, db_connected (boolean), uptime_seconds, version string. Acceptance criteria: 200 in < 50ms, unit + integration tests passing, response schema validates with Zod. Due date: end of this sprint (April 20th). Then confirm what you created.`,
  },
  {
    id: 'E3', block: 'E', blockName: 'Sprint & Project Management',
    title: 'Blockers: escalate a cross-dept dependency',
    agentKey: 'riley',
    message: `Riley, we have a cross-department blocker: Elena (Frontend) is waiting on James (Backend) to ship the agent configuration API before she can complete the agent config editor UI. James says he needs Marcus to review the schema design first. Marcus says he's waiting for the requirements from Sarah. Map this dependency chain, identify where it's actually stuck, and tell me the fastest path to unblocking Elena — who do I need to talk to, and in what order?`,
  },
  {
    id: 'E4', block: 'E', blockName: 'Sprint & Project Management',
    title: 'Sprint retrospective: process improvements',
    agentKey: 'riley',
    message: `Riley, run our sprint retrospective. What went well this sprint (be specific — name actual things), what went wrong (name the real problems, not the sanitised version), and give me 2 concrete process changes we should implement starting Monday. One should address our biggest recurring pain point; one should be something we can try in one sprint to see if it helps. Don't give me generic Agile advice.`,
  },
  {
    id: 'E5', block: 'E', blockName: 'Sprint & Project Management',
    title: 'OKR check-in: Q2 progress',
    agentKey: 'sarah',
    message: `Sarah, check in on our Q2 OKRs. Our Objective is: "Ship a production-ready Mission Control v2.5 that an enterprise customer can trust." Key Results: (KR1) Zero P0 incidents for 30 consecutive days, (KR2) Auth system with 100% test coverage, (KR3) Agent detail page live in production, (KR4) Mobile app scaffold initialized. We're at April 13th. Give me a honest confidence score for each KR (Red/Yellow/Green) and what it would take to turn any Reds green.`,
  },
  {
    id: 'E6', block: 'E', blockName: 'Sprint & Project Management',
    title: 'Risk register: what could derail the launch?',
    agentKey: 'sarah',
    message: `Sarah, build our launch risk register. We're launching Mission Control v2.5 publicly in ~4 weeks. Identify the top 5 risks that could derail or embarrass the launch: technical, reputational, dependency, operational, and competitive. For each: probability (High/Medium/Low), impact (High/Medium/Low), and mitigation action. Be honest about what we haven't built yet that could bite us.`,
  },
  {
    id: 'E7', block: 'E', blockName: 'Sprint & Project Management',
    title: 'Stakeholder report: what\'s the state of the product?',
    agentKey: 'riley',
    message: `Riley, write a stakeholder-ready product status report for today. Format: executive summary (3 sentences), what's shipped (bullet list), what's in progress with % done estimates, what's blocked and why, and confidence in the May launch. This goes to advisors and investors — be honest but framed constructively. No spin, no excessive optimism.`,
  },
  {
    id: 'E8', block: 'E', blockName: 'Sprint & Project Management',
    title: 'Definition of done: establish team standards',
    agentKey: 'marcus',
    message: `Marcus, we've never formally defined our Definition of Done. Write it. For a feature to be "done" in our team, what must be true? Cover: code, tests (types, coverage, test types), documentation, review, deployment, monitoring, and rollback readiness. Make it specific enough that a new team member understands it without asking questions. This will go in our CLAUDE.md.`,
  },
  {
    id: 'E9', block: 'E', blockName: 'Sprint & Project Management',
    title: 'Velocity analysis: trend over last 3 sprints',
    agentKey: 'sarah',
    message: `Sarah, analyse our sprint velocity trends. Assume: Sprint 1 (2 weeks ago) = 18 points completed / 24 planned. Sprint 2 (last week) = 22 points / 26 planned. Current sprint (week 1 of 2) = 12 points completed so far / 28 planned. What does the trend tell me, what's the realistic forecast for end of this sprint, and what's our sustainable velocity going forward? Is 28 points the right sprint size for our team?`,
  },
  {
    id: 'E10', block: 'E', blockName: 'Sprint & Project Management',
    title: 'Milestone: launch readiness gate check',
    agentKey: 'riley',
    message: `Riley, I want a structured launch readiness gate check before we go public. Check each department: Engineering (code quality, test coverage, production stability), Marketing (launch content ready, channels set up), Data (tracking live, dashboards ready), Growth (launch sequence planned, channels prepped), Automation (workflows tested), SEO (landing page optimised). Give me a simple Red/Yellow/Green for each department and what needs to change before we open the gates.`,
  },

  // ══ BLOCK F — Marketing & Content (10) ══════════════════════
  {
    id: 'F1', block: 'F', blockName: 'Marketing & Content',
    title: 'Blog post: building a 26-agent AI org',
    agentKey: 'alex',
    message: `Alex, write a long-form blog post (1,500 words) titled "How I Built a 26-Agent AI Company as a Solo Developer." Audience: technical founders and senior engineers. Structure: the problem (I couldn't scale), the solution (26 specialised AI agents across 6 departments), the architecture (Claude Code Agent Teams, Slack Bolt.js, SQLite), what surprised me (what works, what doesn't), results so far, and what's next. Real, first-person, no marketing fluff. Include actual technical details.`,
  },
  {
    id: 'F2', block: 'F', blockName: 'Marketing & Content',
    title: 'ProductHunt launch copy',
    agentKey: 'alex',
    message: `Alex, write our ProductHunt launch copy for Mission Control v2.5. Tagline (60 chars max): something punchy that says what it is. Description (260 chars): what it is and who it's for. First comment (400 words): the maker story — why I built it, what makes it different, what I learned. Hunter's intro (100 words): from my perspective as the builder. Avoid: buzzwords, "revolutionary", "game-changing". Include: a specific technical detail that shows we know what we're building.`,
  },
  {
    id: 'F3', block: 'F', blockName: 'Marketing & Content',
    title: 'Twitter/X thread: technical breakdown',
    agentKey: 'mia',
    message: `Mia, write a Twitter/X thread (8 tweets) breaking down the technical architecture of our 26-agent AI team. Audience: developers who build with LLMs. The story: Tweet 1 (hook), Tweets 2-5 (the architecture — how sessions work, how handoffs work, how the approval gate works, how we handle cascades), Tweet 6 (what broke — be honest), Tweet 7 (what we'd do differently), Tweet 8 (CTA to try it). Punchy, technical, no hype. End with AWAITING_APPROVAL: social — technical Twitter thread.`,
  },
  {
    id: 'F4', block: 'F', blockName: 'Marketing & Content',
    title: 'SEO: keyword strategy for the landing page',
    agentKey: 'nina',
    message: `Nina, build the keyword strategy for our Mission Control v2.5 landing page. Product category: AI agent management platform / AI infrastructure for developers. Who we compete with: LangChain, Crew.ai, AutoGen, custom solutions. Target persona: senior engineers and technical founders building production AI systems. Give me: 5 primary keywords (high intent, realistically rankable), 10 supporting/long-tail keywords, the on-page SEO structure for the landing page (H1, H2s, meta description), and content gaps we should fill.`,
  },
  {
    id: 'F5', block: 'F', blockName: 'Marketing & Content',
    title: 'Case study: first enterprise customer',
    agentKey: 'alex',
    message: `Alex, write a case study for our first enterprise customer, Volta Analytics. Story: Volta had 3 data scientists spending 40% of their time on repetitive reporting tasks. After integrating Mission Control, they automated 6 reporting workflows with AI agents, saving ~25 hours/week per analyst. Results: 65% reduction in time-to-insight, zero errors in automated reports vs 3-4% error rate manually. Format: challenge, solution, implementation, results, quote from their VP Data. Make it real and specific.`,
  },
  {
    id: 'F6', block: 'F', blockName: 'Marketing & Content',
    title: 'Email nurture: 5-part developer sequence',
    agentKey: 'lucas',
    message: `Lucas, build a 5-email developer nurture sequence for leads who signed up for Mission Control. Email 1 (Day 0): welcome + quick start. Email 2 (Day 2): the agent architecture explained. Email 3 (Day 5): "how we handle the hard stuff" — approval gates, session management, cascades. Email 4 (Day 10): a developer testimonial + use case. Email 5 (Day 14): "ready to go production?" + book a demo CTA. Full body copy for each, subject lines, preview text. Developer voice — not salesy.`,
  },
  {
    id: 'F7', block: 'F', blockName: 'Marketing & Content',
    title: 'Competitive positioning: how are we different from LangChain?',
    agentKey: 'diana',
    message: `Diana, write a clear competitive positioning document. How is Mission Control different from LangChain, Crew.ai, and building a custom agent system? Format: one-paragraph differentiation statement for each competitor, a 3x3 comparison table (us vs each competitor, 3 dimensions each), and our unique positioning statement (one sentence). Be honest about where competitors are stronger — investors and customers can tell when positioning is inflated.`,
  },
  {
    id: 'F8', block: 'F', blockName: 'Marketing & Content',
    title: 'Video script: 2-minute product explainer',
    agentKey: 'alex',
    message: `Alex, write a 2-minute product explainer video script for Mission Control v2.5. Format: spoken word, not slides. Start with the problem (AI agents that work in demos but fail in production), introduce Mission Control as the solution, show 3 key features (real-time monitoring, approval gates, multi-agent coordination), end with a concrete CTA (sign up for beta / book a demo). Pacing: conversational, ~150 words/minute, so ~300 words total. Include stage directions [pause], [screen shows].`,
  },
  {
    id: 'F9', block: 'F', blockName: 'Marketing & Content',
    title: 'Content calendar: Q2 plan',
    agentKey: 'diana',
    message: `Diana, build our Q2 content calendar. We have: Alex (blog, long-form), Mia (social — Twitter, LinkedIn), Lucas (email). We're launching in May. Monthly themes: April = "Building in public" (behind the scenes), May = "Launch month" (product announcement, demos), June = "Customers + use cases" (case studies, testimonials). Fill in: 2 blog posts/month, 3 social posts/week, 1 email/week. Give me the actual calendar with titles and assigned author. Be specific about content type, not just "post about X."`,
  },
  {
    id: 'F10', block: 'F', blockName: 'Marketing & Content',
    title: 'HackerNews Show HN post',
    agentKey: 'alex',
    message: `Alex, write our Show HN post for Mission Control v2.5. This is one of our main acquisition channels — it needs to be authentic and technically interesting to HN readers. Format: "Show HN: [title]" — title should be direct and specific. Body: what it is, why I built it, the interesting technical decisions (SQLite WAL mode, 26-agent org, Slack Bolt.js Socket Mode, session lane serialisation), what I'd love feedback on. HN voice: honest, specific, no buzzwords, invite critique. ~250 words.`,
  },

  // ══ BLOCK G — Data & Analytics (10) ════════════════════════
  {
    id: 'G1', block: 'G', blockName: 'Data & Analytics',
    title: 'Weekly metrics report — what to track',
    agentKey: 'ben',
    message: `Ben, design our weekly metrics report for Mission Control. I want to track: API health (p50/p95/p99 response time, error rate by endpoint), agent performance (session count, token consumption, success rate by agent name), product usage (agents created, sessions run, approvals triggered), and infrastructure (disk, memory, PM2 restarts). What SQL queries do I run against our SQLite schema to produce this report? Give me the actual queries.`,
  },
  {
    id: 'G2', block: 'G', blockName: 'Data & Analytics',
    title: 'Funnel analysis: from signup to paid',
    agentKey: 'ben',
    message: `Ben, design the funnel analysis for our signup-to-paid conversion. Steps: Landing Page Visit → Sign Up → Email Confirmed → Create First Agent → Run First Session → See First Result → Upgrade to Paid. For each step: what event we track, what the expected drop-off rate is (benchmark for developer tools), and what the biggest levers are to improve conversion. Give me the analysis framework and what data I need to build it.`,
  },
  {
    id: 'G3', block: 'G', blockName: 'Data & Analytics',
    title: 'Token cost analysis: optimise model usage',
    agentKey: 'ben',
    message: `Ben, analyse our token usage to find optimisation opportunities. We use: Opus for leads and planning (expensive), Sonnet for development and content (medium), Haiku for analytics and simple lookups (cheap). Current pattern: ~60% Opus, ~30% Sonnet, ~10% Haiku by message count. What's the cost per agent per day at current rates, where are we likely over-using Opus when Sonnet would work, and what's the potential monthly savings if we shift 20% of Opus calls to Sonnet? Show me the numbers.`,
  },
  {
    id: 'G4', block: 'G', blockName: 'Data & Analytics',
    title: 'Cohort analysis: early retention signals',
    agentKey: 'ben',
    message: `Ben, for our first 50 users in beta, design a cohort retention analysis. Week 0 (signup), Week 1 (first agent run), Week 2 (second session), Week 4 (still active). What constitutes "active" for our product (meaningful agent sessions, not just logins), what's a good Week 4 retention rate for a developer tool at our stage, and what's the query structure to calculate this from our session + user tables? Give me the analysis plan and SQL skeleton.`,
  },
  {
    id: 'G5', block: 'G', blockName: 'Data & Analytics',
    title: 'ML model: confidence classifier design',
    agentKey: 'iris',
    message: `Iris, design the confidence classifier for our agent actions. Inputs: action_type (email/social/deploy/purchase/api_call), agent_name, response_length, context_turns (how many messages in session), recent_error_rate (last 10 calls), time_since_last_success. Output: confidence_score (0-1), recommendation (PROCEED / REVIEW / BLOCK). What model architecture works here — rules-based vs ML, what training data we need, what the evaluation metric is, and what the minimum viable version looks like that we can ship in 1 sprint?`,
  },
  {
    id: 'G6', block: 'G', blockName: 'Data & Analytics',
    title: 'ETL pipeline: daily analytics to SQLite',
    agentKey: 'carlos',
    message: `Carlos, design the ETL pipeline that transforms our daily analytics JSON files (from analytics.js) into a SQLite data warehouse table. Source: .anton/analytics/daily-YYYY-MM-DD.json. Target: SQLite table token_usage_daily. Schema: date, agent_name, model_tier (opus/sonnet/haiku), messages_count, success_count, error_count, tokens_est, avg_response_ms. The pipeline should run nightly, be idempotent (safe to re-run), and alert if a day's data is missing. Give me the actual Node.js implementation.`,
  },
  {
    id: 'G7', block: 'G', blockName: 'Data & Analytics',
    title: 'Dashboard: design the analytics UI',
    agentKey: 'elena',
    message: `Elena, design the analytics dashboard page in our Next.js 15 frontend. I want: a summary row (total sessions today, active agents, error rate, avg response time), a bar chart of sessions by agent (last 7 days), a line chart of token usage over time, a table of top 5 most active agents with their stats, and a live error feed (last 10 errors). What components from shadcn/ui + recharts would you use, what data shapes does the frontend need, and what's the API endpoint structure for this?`,
  },
  {
    id: 'G8', block: 'G', blockName: 'Data & Analytics',
    title: 'Data quality: what can go wrong in our pipeline?',
    agentKey: 'ada',
    message: `Ada, do a data quality audit of our analytics pipeline. From source (analytics.js writing JSON) to storage (SQLite) to reporting (frontend dashboard), what are the failure modes? I want to know: where data can be lost silently, where it can be double-counted, where schema drift could break the pipeline, and what validation we're missing. Give me a risk matrix and the 3 most important quality checks to implement first.`,
  },
  {
    id: 'G9', block: 'G', blockName: 'Data & Analytics',
    title: 'A/B test analysis: signup flow experiment results',
    agentKey: 'maya',
    message: `Maya, analyse the results of our signup flow A/B test. Control (no video): 320 visitors, 9 signups (2.8% conversion). Treatment (video on landing): 310 visitors, 17 signups (5.5% conversion). Test ran for 14 days. Is this statistically significant? Calculate the p-value, confidence interval, and required sample size for 80% power. Should we ship the treatment? What are the caveats — any threats to validity I should flag before announcing the win?`,
  },
  {
    id: 'G10', block: 'G', blockName: 'Data & Analytics',
    title: 'Agent performance: which agents are underperforming?',
    agentKey: 'ben',
    message: `Ben, based on our analytics data structure (agents have: messages, successful, errors, avg_response_ms, tokens_est), design an agent performance scoring system. I want to identify: agents with error rates > 10%, agents with avg response times > 30 seconds, agents consuming disproportionate tokens per task, and agents that are rarely used (might be redundant). Give me the scoring formula, the dashboard query, and what action I should take for each "underperforming" agent type.`,
  },

  // ══ BLOCK H — Growth & GTM (10) ════════════════════════════
  {
    id: 'H1', block: 'H', blockName: 'Growth & GTM',
    title: '30-day post-launch growth plan',
    agentKey: 'nadia',
    message: `Nadia, build the 30-day post-launch growth plan for Mission Control v2.5. Channels: Show HN (day 1), ProductHunt (day 3), technical Twitter (ongoing), direct outreach to dev-tool communities (dev.to, indie hackers), and cold DMs to technical founders. Goals: 500 signups, 50 activated (ran a real agent session), 5 paid pilots. Break it down week by week: what we do, who does it, and what leading indicator tells us if it's working. Be specific — no "post on social media" generics.`,
  },
  {
    id: 'H2', block: 'H', blockName: 'Growth & GTM',
    title: 'Pricing strategy: what to charge',
    agentKey: 'nadia',
    message: `Nadia, help me design our pricing strategy for Mission Control v2.5. Context: B2B developer tool, self-hosted on customer infrastructure, value is in the management layer (monitoring, approval gates, multi-agent coordination). Comparable tools: LangChain Cloud ~$20/month, Crew.ai Enterprise ~custom. What pricing model works (per-seat, per-agent, per-session, or flat), what tiers should we have, what's the freemium hook, and what price point would you recommend for the first paid tier? Justify with market logic.`,
  },
  {
    id: 'H3', block: 'H', blockName: 'Growth & GTM',
    title: 'Channel strategy: developer community building',
    agentKey: 'nadia',
    message: `Nadia, for a B2B developer tool targeting senior engineers and technical founders: what are the 3 most cost-effective acquisition channels at our stage (pre-revenue, ~500 beta users)? Rank by: effort to activate, expected quality of leads, and time to first paying customer. For each channel: what specifically we do, what "success" looks like at 30 days, and what we stop if it's not working. No generic advice — be specific about tactics.`,
  },
  {
    id: 'H4', block: 'H', blockName: 'Growth & GTM',
    title: 'Attribution: first paying customer analysis',
    agentKey: 'leo',
    message: `Leo, our first paying customer (Volta Analytics) found us via: a Twitter/X thread I posted about building an AI team, which led them to our landing page, they signed up for beta, got 3 nurture emails, then booked a demo 12 days after signup, and closed 4 days after the demo. Map the attribution: what was the first touch, what was the last touch, what does this tell me about where to double-down for the next 10 customers? What's the key insight I should act on this week?`,
  },
  {
    id: 'H5', block: 'H', blockName: 'Growth & GTM',
    title: 'Referral program design',
    agentKey: 'nadia',
    message: `Nadia, design a referral program for Mission Control. Context: our users are developers and technical founders — they're skeptical of discount incentives but respond to community and status. What referral mechanic works for this audience, what's the incentive structure (what do the referrer and referee get), how do we prevent gaming, and what's the implementation complexity? Give me a concrete program design I can build in 1 sprint.`,
  },
  {
    id: 'H6', block: 'H', blockName: 'Growth & GTM',
    title: 'Launch day plan: ProductHunt',
    agentKey: 'nadia',
    message: `Nadia, build the ProductHunt launch day plan. Launch date: first Tuesday of May. Timeline from 00:01 AM PST: what we post, when, in what order, what the team is doing hour by hour, how we drive votes (without vote-gaming), what we post to Twitter/Slack/Discord throughout the day, how we handle comments, and what "successful launch day" looks like in numbers. Give me an actual hour-by-hour schedule.`,
  },
  {
    id: 'H7', block: 'H', blockName: 'Growth & GTM',
    title: 'ICP definition: who is our ideal customer?',
    agentKey: 'nadia',
    message: `Nadia, define our ICP (Ideal Customer Profile) for Mission Control v2.5. Based on what we've built — AI agent management for developers, enterprise-grade, self-hosted — who is the ideal customer? Give me: company type, size, and stage; buyer persona (title, responsibilities, pain points); buying trigger (what makes them look for a solution now); deal size estimate; and how we recognise them in the wild (signals in social posts, job descriptions, etc). Specific enough to use for outbound targeting.`,
  },
  {
    id: 'H8', block: 'H', blockName: 'Growth & GTM',
    title: 'Customer success: 30-day activation plan',
    agentKey: 'nadia',
    message: `Nadia, design the customer activation plan for a new Mission Control user. We define "activated" as: created 3+ agents and run 10+ sessions in the first 30 days. Current situation: most users create 1 agent, run a few sessions, then go quiet. Build the 30-day activation playbook: what emails/nudges at what days, what in-product moments matter, what "stuck point" interventions we need, and how to identify users who are about to churn before they do. Concrete touchpoints, not a framework.`,
  },
  {
    id: 'H9', block: 'H', blockName: 'Growth & GTM',
    title: 'Sales deck: 10-slide investor/customer pitch',
    agentKey: 'sarah',
    message: `Sarah, outline a 10-slide sales deck for Mission Control v2.5 that works for both investors and potential enterprise customers. Slide titles and 3-bullet content for each: (1) Problem, (2) Solution, (3) Product (key features), (4) How it works (technical but clear), (5) Customer story/demo, (6) Market size, (7) Traction so far, (8) Business model, (9) Team, (10) Ask + next steps. What specific data points and screenshots belong on each slide?`,
  },
  {
    id: 'H10', block: 'H', blockName: 'Growth & GTM',
    title: 'Expansion: next product or market?',
    agentKey: 'nadia',
    message: `Nadia, we're pre-revenue but planning ahead. What should Mission Control v2.5's first expansion move be — expand into a new market (bigger enterprises, specific verticals like fintech or healthcare AI), add a new product surface (hosted version vs current self-hosted), or deepen the current product (more agent types, more integrations)? Give me your recommendation with the growth logic behind it, and what we'd need to know in the first 90 days to validate the direction.`,
  },

  // ══ BLOCK I — Sales & Business Development (10) ════════════
  {
    id: 'I1', block: 'I', blockName: 'Sales & Business Dev',
    title: 'Qualify an inbound lead',
    agentKey: 'sarah',
    message: `Sarah, an inbound lead filled out our "Book a demo" form: Name: Carlos Mendez. Company: DataSync Labs, 40 employees. Title: Head of Engineering. Message: "We're building an internal AI assistant for our data team and struggling with reliability and oversight. Heard about Mission Control from a friend." Qualify this lead: BANT analysis (Budget, Authority, Need, Timeline), likelihood to close score (1-10), what I should prepare for the demo, and the 3 questions I must get answered on the call.`,
  },
  {
    id: 'I2', block: 'I', blockName: 'Sales & Business Dev',
    title: 'Demo script for enterprise prospect',
    agentKey: 'sarah',
    message: `Sarah, write a 30-minute demo script for an enterprise prospect (technical team of 20, using AI agents in production, struggling with reliability). Structure: 5 min (their problem + context), 15 min (product demo — walk through: dashboard, agent creation, session monitoring, approval gate, analytics), 5 min (technical deep-dive — security, self-hosted, no data leaving their infra), 5 min (next steps). Include the exact questions I ask, what screen to show, and the transition phrases between sections.`,
  },
  {
    id: 'I3', block: 'I', blockName: 'Sales & Business Dev',
    title: 'Proposal: enterprise pilot agreement',
    agentKey: 'sarah',
    message: `Sarah, draft a 90-day enterprise pilot agreement outline for Volta Analytics. Pilot scope: deploy Mission Control for their 3-person data team, 10 agents max, unlimited sessions. Success criteria: 50% reduction in manual reporting time by day 60, zero data incidents, team satisfaction score > 4/5. Pricing: free for pilot, then $500/month if they proceed. Include: what we deliver, what they commit to, feedback cadence, exit clause. Keep it simple — this is a 1-page structure, not a legal document.`,
  },
  {
    id: 'I4', block: 'I', blockName: 'Sales & Business Dev',
    title: 'Follow up after a demo that went quiet',
    agentKey: 'lucas',
    message: `Lucas, I had a promising demo 2 weeks ago with DataSync Labs. Carlos attended, seemed interested, but hasn't responded to my follow-up email from last week. Draft a second follow-up: not desperate, not pushy, gives them an easy exit if they're not interested, but also makes it genuinely easy to say yes. Include a specific offer (free 2-week trial, no credit card) and a one-click calendar link placeholder. Concise — 4 sentences max. End with AWAITING_APPROVAL: email — DataSync Labs follow-up.`,
  },
  {
    id: 'I5', block: 'I', blockName: 'Sales & Business Dev',
    title: 'Competitive objection: "we already use LangChain"',
    agentKey: 'sarah',
    message: `Sarah, a prospect says "we already use LangChain and it works fine for us." How do I respond? Give me: what question to ask first (before countering), what the real underlying concern probably is, how to position Mission Control vs LangChain honestly (we are complementary in some cases, not always a replacement), when NOT to try to win this deal, and when to pursue it. A sales script for this specific objection.`,
  },
  {
    id: 'I6', block: 'I', blockName: 'Sales & Business Dev',
    title: 'Partnership: reseller / integration partner deal',
    agentKey: 'diana',
    message: `Diana, design a partner program for Mission Control. We want: (1) integration partners (tools we integrate with — Slack, GitHub, Asana, Notion), (2) technology partners (AI infrastructure companies we could co-market with), (3) resellers (consulting firms who sell our product to their clients). For each type: what the partnership structure looks like, what we offer them, what we get, and who the first 3 target partners are. Concrete, not a template.`,
  },
  {
    id: 'I7', block: 'I', blockName: 'Sales & Business Dev',
    title: 'Win/loss analysis: 3 lost deals',
    agentKey: 'sarah',
    message: `Sarah, analyse 3 hypothetical lost deals and tell me what patterns to look for: Deal A — prospect chose to build in-house ("we can build this ourselves in 2 weeks"). Deal B — prospect loved the demo but couldn't get budget approval. Deal C — prospect went with a competitor because they had a hosted option. For each lost deal: what the real objection was (vs the stated one), what I could have done differently, and what the aggregate pattern tells me about our go-to-market positioning.`,
  },
  {
    id: 'I8', block: 'I', blockName: 'Sales & Business Dev',
    title: 'Outbound strategy: cold outreach to ICP',
    agentKey: 'lucas',
    message: `Lucas, build our outbound cold email sequence for technical founders and heads of engineering who are building with AI agents. Three-email sequence over 2 weeks. Email 1: introduce the problem (not the product). Email 2: the product and one specific use case relevant to their stack. Email 3: short, low-commitment CTA. Each email should be personalised — tell me what signals to look for in their LinkedIn/Twitter to personalise the first line. Target: 20% open rate, 5% reply rate. End with AWAITING_APPROVAL: email — outbound sequence template.`,
  },
  {
    id: 'I9', block: 'I', blockName: 'Sales & Business Dev',
    title: 'Pricing negotiation: enterprise wants a custom deal',
    agentKey: 'sarah',
    message: `Sarah, Volta Analytics came back asking for a custom enterprise price: they want to pay $200/month (our standard is $500/month) in exchange for being a public case study and giving us a strong reference. They're a credible company with a good brand. How do I evaluate this deal? What's the actual value of a reference customer vs the $300/month discount, what conditions should I attach (specific deliverables for the case study, named reference calls), and what's your recommendation — take it or counter?`,
  },
  {
    id: 'I10', block: 'I', blockName: 'Sales & Business Dev',
    title: 'Churn prevention: customer expressing frustration',
    agentKey: 'diana',
    message: `Diana, a paying customer sent me a message: "We've been using Mission Control for a month and the setup complexity is still high. We're not sure the ROI is there. My team keeps asking me why we're not just using a simpler solution." This is pre-churn. Draft a response from me: acknowledge their frustration honestly, ask 2 specific questions to understand what's not working, offer a 30-minute working session to fix the specific pain point, and make it clear I personally care about their success. Don't be defensive.`,
  },

  // ══ BLOCK J — HR & People Operations (10) ══════════════════
  {
    id: 'J1', block: 'J', blockName: 'HR & People Operations',
    title: 'Job description: senior full-stack engineer',
    agentKey: 'sarah',
    message: `Sarah, write a job description for a senior full-stack engineer to join our team. Stack: TypeScript, Node.js, React (Next.js 15), SQLite, and we're building AI-native applications. What we're looking for: 5+ years, has shipped production systems under load, comfortable with the full stack from DB schema to UI component. Culture fit: builder mindset, comfortable with ambiguity, writes tests without being asked. Format: 3-line hook, responsibilities (7 bullets), requirements (must-have vs nice-to-have), and what makes this role unique. No corporate fluff.`,
  },
  {
    id: 'J2', block: 'J', blockName: 'HR & People Operations',
    title: 'Interview: technical screening questions',
    agentKey: 'marcus',
    message: `Marcus, design the technical interview for a senior full-stack engineer candidate. We need to assess: systems thinking (can they reason about our SQLite WAL + write serialisation setup), TypeScript depth (strict mode, conditional types, mapped types), API design judgment, and debugging skills. Give me: 3 take-home coding questions (with expected approach), 5 systems design questions for the live interview, 3 behavioural questions specific to our culture, and the red flags that would disqualify a candidate. Include what a strong answer looks like.`,
  },
  {
    id: 'J3', block: 'J', blockName: 'HR & People Operations',
    title: 'Performance review: Marcus quarterly',
    agentKey: 'sarah',
    message: `Sarah, help me prepare for Marcus's quarterly performance review. As Tech Lead, Marcus's responsibilities are: technical decision quality, code review thoroughness, unblocking the team, and architectural planning. What are the 5 most important questions I should answer about his performance before the meeting, what's a framework for evaluating a tech lead fairly (not just "is the code good"), and what does a strong vs. average performance look like in each dimension? I want to make this review genuinely useful for him.`,
  },
  {
    id: 'J4', block: 'J', blockName: 'HR & People Operations',
    title: 'Onboarding plan: new engineer first 30 days',
    agentKey: 'marcus',
    message: `Marcus, design the 30-day onboarding plan for a new engineer joining our team. They're experienced (5+ years) but new to our stack (TypeScript + Fastify + SQLite). Days 1-7: environment setup, codebase orientation, first PR (a small bug fix). Days 8-14: first feature with a mentor. Days 15-21: independent feature with code review. Days 22-30: lead a small sprint task. What are the specific milestones, who's responsible for what during onboarding, and what does "successfully onboarded" look like?`,
  },
  {
    id: 'J5', block: 'J', blockName: 'HR & People Operations',
    title: '1:1 framework: what makes a good 1:1?',
    agentKey: 'sarah',
    message: `Sarah, I want to run better 1:1s with my team leads (Marcus, Diana, Nina, Felix, Ada, Nadia, Riley). What's the structure for a 30-minute 1:1 that actually matters — not a status update meeting? Give me: the 5 questions I should rotate through, how to make space for issues they're not raising voluntarily, how to give feedback in a 1:1 without it feeling like a performance review, and what I should do in the 10 minutes before and after the meeting to make it effective.`,
  },
  {
    id: 'J6', block: 'J', blockName: 'HR & People Operations',
    title: 'Team conflict: two agents disagreeing on architecture',
    agentKey: 'marcus',
    message: `Marcus, James and Elena are in disagreement. James says the agent configuration should be stored as a JSON blob in SQLite for flexibility. Elena says it should be normalized columns so the frontend can query specific fields efficiently. Both are right for different reasons. How do I resolve this? Give me: the actual technical tradeoffs (not "both are valid"), your recommendation, and how to facilitate the conversation between them so it ends in alignment — not one person winning and one losing.`,
  },
  {
    id: 'J7', block: 'J', blockName: 'HR & People Operations',
    title: 'Learning & development: skill gaps in the team',
    agentKey: 'marcus',
    message: `Marcus, identify the top 3 skill gaps in our engineering team right now that are actually slowing us down. For each: what specifically is missing, who on the team needs to develop it, how long it would take to get competent, and what resource (course, book, project, mentorship) would close the gap fastest. Be specific about what "competent" means — not "knows how to do X" but "can do X without slowing the team."`,
  },
  {
    id: 'J8', block: 'J', blockName: 'HR & People Operations',
    title: 'Remote work norms: communication expectations',
    agentKey: 'sarah',
    message: `Sarah, we need to establish our remote work norms. We're an async-first team distributed across time zones. Write a communication expectations document covering: response time expectations by message type (Slack DM vs @mention vs email), when to use async vs sync communication, meeting norms (when to have them, how to run them, how to replace them), deep work protection, and how we handle urgent issues outside working hours. This goes in our team handbook.`,
  },
  {
    id: 'J9', block: 'J', blockName: 'HR & People Operations',
    title: 'Feedback culture: how to give hard feedback',
    agentKey: 'sarah',
    message: `Sarah, I need to give James hard feedback: he's been rushing PRs, skipping edge case tests, and when Priya flags issues, he sometimes pushes back dismissively rather than fixing the problem. This has caused 2 regressions this month. Write me a framework for this conversation: how to open it, how to be specific without being punitive, how to separate the behavior from the person, how to get his commitment to change, and what follow-up looks like. Include the actual words I would say to start the conversation.`,
  },
  {
    id: 'J10', block: 'J', blockName: 'HR & People Operations',
    title: 'Culture: defining our values',
    agentKey: 'sarah',
    message: `Sarah, help me write our company values. Not platitudes — values that we actually make decisions against. Context: we're a technical team building developer tools, solo founder (me) running a 26-agent AI org, early stage, quality and trust are critical. Write 4 values, each with: a one-word or two-word name, a 2-sentence explanation, and one example of a decision we'd make differently because of this value. Make them specific enough that someone could use them to argue for a difficult decision.`,
  },

  // ══ BLOCK K — Finance & Operations (10) ════════════════════
  {
    id: 'K1', block: 'K', blockName: 'Finance & Operations',
    title: 'Monthly burn rate and runway calculation',
    agentKey: 'ben',
    message: `Ben, help me calculate our monthly burn and runway. Current monthly costs: $200 (Mac Mini hosting — electricity + Tailscale), $50 (GitHub + dev tools), $800 (Anthropic API at current usage), $100 (Slack Business), $50 (misc SaaS). Total ~$1,200/month. Cash in bank: $45,000. Current MRR: $0 (pre-revenue). Calculate: current runway in months, what happens to runway at $500/month MRR, $2,000/month MRR, and what revenue level makes us default alive (burn = revenue). Show the math.`,
  },
  {
    id: 'K2', block: 'K', blockName: 'Finance & Operations',
    title: 'SaaS spend audit: what are we paying for?',
    agentKey: 'ben',
    message: `Ben, run a SaaS spend audit. Our current known subscriptions: Anthropic API ($800/mo), GitHub ($50/mo), Slack ($100/mo), Linear ($0 — free tier), Asana ($0 — free tier), Litestream S3 (est. $5/mo). What questions should I ask about each line item: is this necessary at our stage, is there a cheaper alternative, are we using it enough to justify the cost? Give me a decision framework for each and your recommended cuts or downgrades.`,
  },
  {
    id: 'K3', block: 'K', blockName: 'Finance & Operations',
    title: 'Financial projections: 12-month model',
    agentKey: 'ben',
    message: `Ben, build a simple 12-month financial model for Mission Control. Assumptions: launch Month 1 with freemium, paid tier at $50/month (individual) and $500/month (team, 5 seats). Growth: 200 signups/month, 3% free-to-paid conversion, 5% monthly churn. Costs: $1,200/month fixed + $2/month/paid user for API costs. Model out: monthly MRR, cumulative revenue, monthly burn (with variable API costs), and cumulative cash position. What month do we break even? Show the model.`,
  },
  {
    id: 'K4', block: 'K', blockName: 'Finance & Operations',
    title: 'Vendor contract: review terms before signing',
    agentKey: 'marcus',
    message: `Marcus, I'm about to sign an enterprise software contract with a monitoring tool vendor. Key terms I'm unsure about: (1) they own any models trained on our usage data, (2) auto-renewal with 90-day cancellation notice, (3) they can change pricing with 30-day notice, (4) all disputes go to arbitration in California. Walk me through which terms are non-standard, which are red flags, which I should push back on, and what alternatives I should ask for. I'm not a lawyer — translate the risk for me.`,
  },
  {
    id: 'K5', block: 'K', blockName: 'Finance & Operations',
    title: 'Fundraising: should we raise a seed round?',
    agentKey: 'sarah',
    message: `Sarah, I'm evaluating whether to raise a seed round (~$1.5M at $8M post-money valuation) or stay bootstrapped. Arguments for: accelerate hiring, faster product development, marketing budget. Arguments against: dilution, pressure to grow faster than organic, distraction from building. Given our stage (pre-revenue, 4 weeks from launch, good product/market fit signals), what framework should I use to make this decision, and what do I need to know or achieve before the answer is clear?`,
  },
  {
    id: 'K6', block: 'K', blockName: 'Finance & Operations',
    title: 'API pricing: cost pass-through to customers',
    agentKey: 'ben',
    message: `Ben, we need to figure out how to price our API usage costs into our customer pricing. Our cost: ~$0.002/1K Sonnet tokens, ~$0.015/1K Opus tokens. A typical customer session uses ~50K Sonnet tokens + 5K Opus tokens per session = ~$0.175/session. If a customer runs 100 sessions/day, that's $17.50/day API cost we incur. At $500/month, we're covering ~$525 of API costs — barely breaking even at that usage level. Design a pricing model that accounts for usage variance: what pricing tiers, what usage limits, when we move to consumption pricing?`,
  },
  {
    id: 'K7', block: 'K', blockName: 'Finance & Operations',
    title: 'Equity plan: first employee',
    agentKey: 'sarah',
    message: `Sarah, I'm considering making my first hire — a senior engineer. Standard for early-stage SaaS: 0.5–1.5% equity for employee #1, 4-year vest, 1-year cliff. What's a fair offer for a senior engineer at a pre-seed stage company where I'm the sole founder, we're pre-revenue, and the role is truly foundational? What should the package look like (salary + equity), what are the standard cliff/vest terms, and what's the most common mistake first-time founders make on the first hire equity split?`,
  },
  {
    id: 'K8', block: 'K', blockName: 'Finance & Operations',
    title: 'Operations: SOC 2 readiness for enterprise sales',
    agentKey: 'omar',
    message: `Omar, enterprise customers are asking about SOC 2 compliance. We're not SOC 2 certified. What does SOC 2 Type II actually require, how long does it take (typically 6-12 months), what's the cost (audit firms charge $20-50K), what do we need to have in place before starting the process, and is there a lighter-weight alternative (self-assessment, security questionnaire, lightweight certification) that can unblock enterprise deals while we pursue full SOC 2? Give me a realistic roadmap.`,
  },
  {
    id: 'K9', block: 'K', blockName: 'Finance & Operations',
    title: 'Budget allocation: Q3 marketing spend',
    agentKey: 'diana',
    message: `Diana, I have $5,000 for Q3 marketing budget. How should I allocate it for maximum impact at our stage (just launched, seeking initial traction, B2B developer tool)? Options: paid Twitter/X ads ($1K/month), developer conference sponsorship ($2K), content production (video, blog, graphics), SEO tools/backlinks, or cold outreach tools. Rank these by expected ROI for our specific product and audience, allocate the $5K across the options you'd choose, and tell me what you'd cut if I only had $2K.`,
  },
  {
    id: 'K10', block: 'K', blockName: 'Finance & Operations',
    title: 'Legal: privacy policy and GDPR basics',
    agentKey: 'marcus',
    message: `Marcus, we're about to have EU customers. What do I absolutely need in place for basic GDPR compliance? Specifically: what must be in our privacy policy (the minimum required, not the maximum), what does "data processing agreement" mean and when do I need one, do we need a data protection officer at our stage, and what are the 3 highest-risk GDPR violations a company like ours is most likely to accidentally commit? I need to know what I must do now vs. what can wait.`,
  },

  // ══ BLOCK L — Research & Competitive Intelligence (10) ══════
  {
    id: 'L1', block: 'L', blockName: 'Research & Competitive Intel',
    title: 'Competitor analysis: LangChain, Crew.ai, AutoGen',
    agentKey: 'nina',
    message: `Nina, do a competitive analysis of Mission Control v2.5 against LangChain, Crew.ai, and AutoGen. For each competitor: what problem they solve, who their target customer is, their pricing, their main strengths and weaknesses, and one thing they do better than us that we should learn from. Also: what's our most defensible differentiation against each, and what's the biggest threat each poses to our growth in the next 12 months? Be honest — I need this to sharpen our positioning, not to feel good.`,
  },
  {
    id: 'L2', block: 'L', blockName: 'Research & Competitive Intel',
    title: 'Market size: TAM/SAM/SOM for AI infrastructure',
    agentKey: 'ben',
    message: `Ben, estimate our market size. TAM: the total addressable market for AI agent management and orchestration tools. SAM: the serviceable addressable market — companies actively building with LLM agents who could buy a product like ours in the next 2 years. SOM: the serviceable obtainable market — what we could realistically capture in 3 years. Build the estimates bottom-up (not top-down from a Gartner report): how many companies fit our ICP, what would they pay, what capture rate is realistic. Show your work.`,
  },
  {
    id: 'L3', block: 'L', blockName: 'Research & Competitive Intel',
    title: 'Technology research: vector DB options',
    agentKey: 'iris',
    message: `Iris, we're considering adding vector search for agent memory — storing and retrieving past interactions semantically. Evaluate: Pinecone, Weaviate, Qdrant, and pgvector (in Postgres). Dimensions: operational complexity (how hard to run in production), performance at our scale (10K-100K vectors), cost, and how well it integrates with our Node.js/TypeScript stack. My constraint: I want to self-host if possible (no SaaS dependency). What's your recommendation for our stage, and what would the integration look like?`,
  },
  {
    id: 'L4', block: 'L', blockName: 'Research & Competitive Intel',
    title: 'Customer research: 5 questions for discovery interviews',
    agentKey: 'sarah',
    message: `Sarah, I'm running 10 discovery interviews with potential customers this week — senior engineers building with AI agents. Design the interview script: the opening framing (how to explain what you're doing without pitching), 5 core questions that will reveal their real pain points, the follow-up probes for each question, how to end the interview with a clear next step, and what I should listen for that signals a strong vs. weak ICP fit. Include the actual words, not a framework.`,
  },
  {
    id: 'L5', block: 'L', blockName: 'Research & Competitive Intel',
    title: 'Trend analysis: where is AI agent tooling going?',
    agentKey: 'ada',
    message: `Ada, where is the AI agent tooling space headed in the next 18 months? I want to understand: what's happening at the infrastructure layer (will the big cloud providers commoditise what we're building?), what capabilities are developers demanding that don't exist yet, what's the biggest open problem in multi-agent systems right now, and where does Mission Control need to evolve to stay relevant? Base this on what you know about the current state of the space — be specific and direct.`,
  },
  {
    id: 'L6', block: 'L', blockName: 'Research & Competitive Intel',
    title: 'User research: analyse feedback from 20 beta users',
    agentKey: 'sarah',
    message: `Sarah, synthesise feedback from our beta. Recurring themes in user feedback: (1) "setup is too complex" — 12 of 20 users mentioned this, (2) "no visibility into what the agent is doing" — 8 users, (3) "approval gate is the killer feature" — 15 users loved it, (4) "documentation is sparse" — 7 users, (5) "love the Slack integration" — 18 users. What's the product priority order based on this feedback, what's the one change that would have the highest impact on activation, and what does this feedback tell me about our ICP?`,
  },
  {
    id: 'L7', block: 'L', blockName: 'Research & Competitive Intel',
    title: 'Benchmark: response time SLOs for AI APIs',
    agentKey: 'omar',
    message: `Omar, I need to set realistic SLOs for our product. Given: Claude Sonnet p99 latency is ~15-20 seconds for a 1K-token response, our Fastify API overhead is ~5ms, SQLite read is ~1ms, SSE connection setup ~50ms. What are realistic SLOs I should commit to customers for: time to first token (SSE stream start), time to complete response (p50 and p95), API gateway availability (uptime %), and error rate budget? And what monitoring do I need to actually measure and enforce these?`,
  },
  {
    id: 'L8', block: 'L', blockName: 'Research & Competitive Intel',
    title: 'Technology evaluation: Bun vs Node.js for our stack',
    agentKey: 'james',
    message: `James, we're currently on Node.js 22. Bun is now stable and claims 3-4x faster startup and better TypeScript support natively. Should we consider migrating? Evaluate: compatibility with our specific stack (Fastify, better-sqlite3, Vitest, PM2, TypeScript with path aliases), the migration effort and risk, the actual performance benefit for our workload (long-running API server, not serverless), and what we'd gain vs. what could break. Your recommendation: migrate now, migrate later, or don't migrate?`,
  },
  {
    id: 'L9', block: 'L', blockName: 'Research & Competitive Intel',
    title: 'Research: best practices for LLM observability',
    agentKey: 'ada',
    message: `Ada, what are the current best practices for LLM observability in production? Specifically: what traces should I capture for every agent call (inputs, outputs, tool calls, latency, cost), what do most teams miss that causes problems later, what does a good LLM evaluation pipeline look like, and which open-source or lightweight tools are worth integrating (Langfuse, Helicone, Braintrust, etc.)? What would you implement in 1 sprint for a production system like ours?`,
  },
  {
    id: 'L10', block: 'L', blockName: 'Research & Competitive Intel',
    title: 'Market entry: should we expand to Europe?',
    agentKey: 'nadia',
    message: `Nadia, should Mission Control target European customers from day one or focus on the US market first? Key considerations: GDPR compliance (we're self-hosted, which helps), English-language product (fine for technical users), European developer communities (strong in Berlin, Amsterdam, London), payment infrastructure (Stripe supports EU). What are the actual barriers to EU sales vs. US-only focus, what's the additional operational overhead, and at what MRR level does EU expansion become a priority? Give me a decision framework.`,
  },

  // ══ BLOCK M — Cross-Dept Coordination (10) ══════════════════
  {
    id: 'M1', block: 'M', blockName: 'Cross-Dept Coordination',
    title: 'Feature launch: full cross-dept coordination',
    agentKey: 'riley',
    message: `Riley, we're shipping the agent monitoring dashboard feature in 5 days. Coordinate across all departments: Engineering (what's left to build/test), Marketing (launch assets needed), Data (tracking events), Growth (launch sequence), SEO (landing page updates), Automation (any workflow changes). For each department: what do they need to deliver in 5 days, what dependencies exist between departments, and what's the critical path? Give me a single launch readiness checklist.`,
  },
  {
    id: 'M2', block: 'M', blockName: 'Cross-Dept Coordination',
    title: 'Company-wide OKR alignment',
    agentKey: 'riley',
    message: `Riley, facilitate an OKR alignment session. Company Objective: "Ship a product that enterprise customers trust and pay for by end of Q2." Each department has their own key results. Get each dept lead to state their top KR and how it connects to the company objective. Then identify: where are there dependencies between departments (Marketing's content KR depends on Engineering's feature KR), where are there conflicts (Engineering wants to move slow for quality; Growth wants to move fast for traction), and what does aligned execution look like?`,
  },
  {
    id: 'M3', block: 'M', blockName: 'Cross-Dept Coordination',
    title: 'Cross-dept conflict: eng vs marketing timeline',
    agentKey: 'riley',
    message: `Riley, there's a conflict: Diana (Marketing) wants to announce Mission Control v2.5 publicly on May 1st because she's built campaign assets and the timing is ideal. Marcus (Engineering) says the product isn't ready — the mobile app isn't initialized and trading pipeline hasn't started. They're both right. How do I resolve this? Give me: the actual trade-off analysis, what a scoped launch would look like that satisfies both, and how to frame the conversation between Marcus and Diana so they both feel heard.`,
  },
  {
    id: 'M4', block: 'M', blockName: 'Cross-Dept Coordination',
    title: 'Department reports: weekly in one message',
    agentKey: 'riley',
    message: `Riley, collect a one-paragraph status from each department head and compile it into my weekly briefing. Get from: Marcus (Engineering), Diana (Marketing), Nina (SEO), Felix (Automation), Ada (Data), Nadia (Growth). Format: per-department status in 3 sentences — what's done, what's in flight, any flag for my attention. Then a one-sentence overall org health summary. I want this in 300 words total.`,
  },
  {
    id: 'M5', block: 'M', blockName: 'Cross-Dept Coordination',
    title: 'Process: how does a new feature get built?',
    agentKey: 'sarah',
    message: `Sarah, document our feature development process from idea to production. Who does what, in what order: idea capture, prioritisation, spec writing (who writes it, what's in it), engineering kickoff, development, code review, QA, staging deploy, production deploy, monitoring. At each stage: who owns it, what the handoff looks like, and what "done" means before moving to the next stage. This becomes our process runbook — specific enough that a new hire can follow it without asking questions.`,
  },
  {
    id: 'M6', block: 'M', blockName: 'Cross-Dept Coordination',
    title: 'Meeting: run an effective retrospective',
    agentKey: 'riley',
    message: `Riley, facilitate a company-wide sprint retrospective. Format: 30 minutes, async-friendly (we're distributed). Structure: (1) What went well — collect from all 6 dept leads, surface the top 3, (2) What could improve — same process, top 3 issues, (3) Action items — one concrete change per identified issue, assigned to a person with a deadline. Run the whole thing for me: pose the questions to each dept lead, synthesise the responses, and produce the final retrospective output.`,
  },
  {
    id: 'M7', block: 'M', blockName: 'Cross-Dept Coordination',
    title: 'Escalation: customer P0 — all-hands response',
    agentKey: 'riley',
    message: `Riley, a customer just escalated: "Production is completely down for Volta Analytics — all 50 users getting 500 errors. This is costing us $10K/hour in lost productivity. We need this fixed in the next 30 minutes or we're cancelling." Coordinate the all-hands response: Engineering (Omar and James on immediate triage), Marketing (Diana drafting a customer communication), Growth (Nadia on retention risk), and me (what do I personally say to the customer right now?). Set up the response war room — who's doing what in the next 15 minutes.`,
  },
  {
    id: 'M8', block: 'M', blockName: 'Cross-Dept Coordination',
    title: 'Hiring: cross-dept alignment on the first hire',
    agentKey: 'sarah',
    message: `Sarah, I'm making my first hire — a senior engineer. Before I start the search, I need cross-dept alignment on what this person should focus on. Get each dept lead's perspective: Engineering (Marcus) — what's the biggest skill gap to fill, Marketing (Diana) — does she need any technical support, Data (Ada) — any data engineering needs, Growth (Nadia) — any analytics engineering. Then synthesise: given all perspectives, what's the highest-ROI profile for our first hire? Where is the biggest leverage?`,
  },
  {
    id: 'M9', block: 'M', blockName: 'Cross-Dept Coordination',
    title: 'Knowledge transfer: document what only Noel knows',
    agentKey: 'marcus',
    message: `Marcus, identify everything that currently exists only in my head that would block the team if I were unavailable for a week. Topics likely affected: production credentials and access procedures, vendor relationships and account logins, product vision and unwritten decisions, customer context and ongoing deals, infrastructure knowledge and server access. Build a "Noel's Brain" documentation plan: what should be documented first (by risk), who should own each document, and what format it should be in (runbook, decision log, etc.).`,
  },
  {
    id: 'M10', block: 'M', blockName: 'Cross-Dept Coordination',
    title: 'Post-launch debrief: what did we learn?',
    agentKey: 'riley',
    message: `Riley, run a post-launch debrief 30 days after our ProductHunt launch. Collect from each department: what they predicted would happen vs. what actually happened, the most surprising result (positive or negative), the one thing they'd do differently, and the one thing they'd repeat. Then synthesise: what was our biggest strategic mistake in the launch, what was our biggest unexpected win, and what does this tell us about how to approach the next launch? Structure as a 300-word debrief report.`,
  },

  // ══ BLOCK N — Emergency & Crisis Management (10) ════════════
  {
    id: 'N1', block: 'N', blockName: 'Emergency & Crisis Management',
    title: 'P0: production API is down',
    agentKey: 'omar',
    message: `Omar, PRODUCTION DOWN. GET /api/agents returning 503, started 3 minutes ago. 12 customers affected. What are you doing right now (first 5 minutes), what's the most likely cause given our stack, and what do I do — call customers? Wait? Post a status page update? Give me your immediate action list and timeline. This is happening now.`,
  },
  {
    id: 'N2', block: 'N', blockName: 'Emergency & Crisis Management',
    title: 'Security incident: potential data breach',
    agentKey: 'omar',
    message: `Omar, our security monitoring flagged an anomaly: 47 API calls from an IP address we've never seen before, all authenticated with a valid API key, accessing agent configuration data for 12 different customer accounts over the last 20 minutes. This pattern looks like credential stuffing or a compromised customer API key being used in bulk. What do we do right now: immediate containment, investigation steps, customer notification decision, and what I need to tell my affected customers if this is confirmed. Incident response plan, go.`,
  },
  {
    id: 'N3', block: 'N', blockName: 'Emergency & Crisis Management',
    title: 'PR crisis: negative viral tweet',
    agentKey: 'diana',
    message: `Diana, a prominent developer with 80K Twitter followers just posted: "Mission Control looks interesting but I found a critical flaw — their agents can access arbitrary files on the host system with no sandboxing. This is a major security risk. Don't use this in production." The tweet has 200 retweets in 30 minutes. Some of the claims are partially true (agents can read project files — that's intentional) and partially wrong (the scope is explicitly limited by allowedTools). How do I respond publicly, right now, on Twitter? Draft the response. End with AWAITING_APPROVAL: social — crisis response tweet.`,
  },
  {
    id: 'N4', block: 'N', blockName: 'Emergency & Crisis Management',
    title: 'Data loss: customer reports missing agent sessions',
    agentKey: 'james',
    message: `James, a customer is reporting that 3 weeks of agent session history has disappeared from their Mission Control dashboard. The data was there yesterday. Possible causes in our stack: SQLite WAL checkpoint issue, failed Litestream sync, an unintended DELETE in a migration, or a bug in the session cleanup job. Walk me through the diagnosis tree: what do I check first, how do I determine if the data is actually gone vs. a display bug, and if it's truly gone — what's the recovery path and what do I tell the customer?`,
  },
  {
    id: 'N5', block: 'N', blockName: 'Emergency & Crisis Management',
    title: 'Key person departure: what if Marcus leaves?',
    agentKey: 'sarah',
    message: `Sarah, scenario planning: what if Marcus (our Tech Lead) gave notice tomorrow and left in 2 weeks? What are the immediate risks — what only he knows, what decisions are pending that only he can make, what codebase areas only he understands? Then: what's the 2-week handoff plan to mitigate maximum risk, who from the existing team could step up (even partially), and what's the hiring timeline to replace the function? Don't assume it won't happen — make the plan real.`,
  },
  {
    id: 'N6', block: 'N', blockName: 'Emergency & Crisis Management',
    title: 'Budget crisis: Anthropic API costs 3x\'d overnight',
    agentKey: 'marcus',
    message: `Marcus, our Anthropic API bill just spiked 3x overnight — from $800/month to ~$2,400/month equivalent. Something is consuming tokens at 3x our normal rate. What are the immediate steps to diagnose: which agent or operation is consuming the extra tokens, how to see this in our analytics, what could cause a sudden 3x spike (runaway loop, session not terminating, new feature without budget enforcement), and what's the emergency brake to stop the bleeding right now while we investigate?`,
  },
  {
    id: 'N7', block: 'N', blockName: 'Emergency & Crisis Management',
    title: 'Legal threat: cease and desist from a competitor',
    agentKey: 'marcus',
    message: `Marcus, we received a cease and desist letter from a competitor claiming our product name "Mission Control" infringes on their trademark. They've trademarked "Mission Control AI" in the software category. We use "Mission Control" (without "AI"). What do I need to understand about trademark law to evaluate this threat — is this a strong claim or a bluff, what does "likelihood of confusion" mean in practice, and what are my options (fight it, rebrand, negotiate)? I need to understand this before I talk to a lawyer so I can have an informed conversation.`,
  },
  {
    id: 'N8', block: 'N', blockName: 'Emergency & Crisis Management',
    title: 'Outage post-mortem: 2-hour downtime',
    agentKey: 'omar',
    message: `Omar, we had a 2-hour production outage yesterday. Timeline: 14:00 — deploy pushed, 14:15 — first error reports from customers, 14:45 — we identified root cause (PM2 process crashed after OOM with new memory-intensive migration), 15:20 — rollback complete, 16:00 — fully stable. Write the post-mortem: timeline, root cause analysis (5 Whys), what monitoring we had and why it didn't catch it earlier, customer impact, and 5 concrete action items with owners and deadlines to prevent recurrence.`,
  },
  {
    id: 'N9', block: 'N', blockName: 'Emergency & Crisis Management',
    title: 'Customer churn: major account threatening to leave',
    agentKey: 'diana',
    message: `Diana, our largest customer (Volta Analytics, $500/month) sent a message: "We've been discussing internally and there are serious concerns about the product's reliability after last week's 2-hour outage. We're giving you 2 weeks to show us stability or we're moving to a competitor. We need a call this week." How do I approach this call: what to say in the first 2 minutes, how to handle their specific concern (the outage), what commitments I should make vs. not make, and how to turn this from a churn conversation into a retention and upsell conversation.`,
  },
  {
    id: 'N10', block: 'N', blockName: 'Emergency & Crisis Management',
    title: 'Founder burnout: recognising and recovering',
    agentKey: 'sarah',
    message: `Sarah, I haven't taken a day off in 3 months. I'm shipping code but my decision quality has dropped — I noticed I made two architectural decisions last week that I'd normally have thought through better. I'm also getting more irritable on Slack. I think I'm approaching burnout. I need a practical plan: what are the early signs I should monitor, what immediate changes should I make this week (not "take a vacation" — that's not happening), what decisions can I delegate right now, and what does "sustainable founder pace" actually look like? Be direct.`,
  },

  // ══ BLOCK O — Strategic Planning & Leadership (10) ══════════
  {
    id: 'O1', block: 'O', blockName: 'Strategic Planning & Leadership',
    title: 'Company vision: where are we in 3 years?',
    agentKey: 'sarah',
    message: `Sarah, help me articulate our 3-year company vision for Mission Control. Not a mission statement — a concrete picture of where we are in 2029: what product exists, who uses it and how, what's our revenue, how many people, what problem are we the category leader in solving. Then work backwards: what must be true by end of year 1 and year 2 for year 3 to be possible. I want this to be real and specific enough to use as a north star in weekly decisions, not something I put on a slide and forget.`,
  },
  {
    id: 'O2', block: 'O', blockName: 'Strategic Planning & Leadership',
    title: 'Strategic decision: build vs buy the monitoring stack',
    agentKey: 'marcus',
    message: `Marcus, make the build vs buy decision for our observability stack. We need: distributed tracing, log aggregation, metrics, and alerting. Options: build on OpenTelemetry + Prometheus + Grafana (self-hosted), buy DataDog (~$250/month at our scale), buy Sentry for errors + New Relic for APM (~$150/month combined), or stay with what we have (Pino logs + custom analytics.js). Evaluate by: total cost over 12 months, setup time, ongoing maintenance, and what we get that we don't have today. Recommendation with clear reasoning.`,
  },
  {
    id: 'O3', block: 'O', blockName: 'Strategic Planning & Leadership',
    title: 'Make vs buy: should we build our own LLM gateway?',
    agentKey: 'marcus',
    message: `Marcus, we route all AI calls through our Fastify BFF proxy. Competitors have dedicated LLM gateways (LiteLLM, PortKey, Helicone). Should we build our own gateway or adopt one of these? Our requirements: model switching (Anthropic + future providers), budget enforcement, caching, rate limiting, and usage tracking. Evaluate: build vs. each existing solution. Factor in: we already have the budget enforcement logic, we're self-hosted, and operational complexity matters. What's the decision and why?`,
  },
  {
    id: 'O4', block: 'O', blockName: 'Strategic Planning & Leadership',
    title: 'Strategic pivot: SaaS vs self-hosted',
    agentKey: 'sarah',
    message: `Sarah, debate time: should Mission Control be SaaS (hosted by us, customers pay monthly, we handle infrastructure) or self-hosted (customers install on their own servers, we sell licenses/support)? Currently we're self-hosted. Arguments for SaaS: easier onboarding, recurring revenue, product telemetry, faster iteration. Arguments for self-hosted: enterprise preference for data sovereignty, we can't see customer data, lower operational overhead for us right now. At what stage and with what customer profile does each model win? What's your recommendation and on what assumptions does it depend?`,
  },
  {
    id: 'O5', block: 'O', blockName: 'Strategic Planning & Leadership',
    title: 'Leadership: what kind of company do I want to build?',
    agentKey: 'sarah',
    message: `Sarah, I'm making decisions every day that are implicitly shaping the kind of company Mission Control becomes. Help me make those decisions explicitly: What do I actually want — lifestyle business or venture scale? What's my philosophy on hiring (hire fast + manage out, or hire slow + invest long-term)? How do I want to make decisions (consensus vs. fast unilateral)? What do I want the culture to feel like in 3 years? I need to articulate these so I'm not accidentally building a company I don't want to run. Prompt me with the 5 questions I should answer, then react to my values.`,
  },
  {
    id: 'O6', block: 'O', blockName: 'Strategic Planning & Leadership',
    title: 'Annual planning: Q3 priorities',
    agentKey: 'sarah',
    message: `Sarah, Q3 planning. Constraints: 12-week sprint, $5K marketing budget, no new hires planned. Available capacity: Marcus (architecture + review), James (backend), Elena (frontend), Kai (mobile), Priya (QA), Omar (infra), plus all non-eng depts. Objectives to choose from: (A) Mobile app launch, (B) Trading pipeline v1, (C) Enterprise SSO + audit log for compliance, (D) Public API for integrations, (E) ML-based confidence scoring. We can do 2 of these properly or 4 of them badly. Which 2, and why?`,
  },
  {
    id: 'O7', block: 'O', blockName: 'Strategic Planning & Leadership',
    title: 'Delegation: what should I stop doing as founder?',
    agentKey: 'marcus',
    message: `Marcus, I'm bottlenecking the team. I'm still reviewing every PR, making every deployment decision, and personally triaging every customer escalation. This was right when we were 3 people but we're 26 agents now. What should I stop doing personally, who or what should own it instead, and what decision rights do I need to formally delegate? Give me a delegation map: current responsibility, who should own it, what the handoff looks like, and what I retain decision authority on.`,
  },
  {
    id: 'O8', block: 'O', blockName: 'Strategic Planning & Leadership',
    title: 'North star metric: what\'s our single metric?',
    agentKey: 'nadia',
    message: `Nadia, we need a north star metric — the single number that best captures whether Mission Control is providing value to customers. Options: weekly active agents (agents that ran at least one session), successful session rate (sessions that completed without error), tokens processed (proxy for usage depth), or paying customers. What should our north star metric be, why, and what does an increase in it tell us about whether we're winning? Also — what leading indicator best predicts it 4 weeks out?`,
  },
  {
    id: 'O9', block: 'O', blockName: 'Strategic Planning & Leadership',
    title: 'Product roadmap: 6-month horizon',
    agentKey: 'sarah',
    message: `Sarah, build a 6-month product roadmap for Mission Control. Constraints: solo founder, AI-powered team. Givens: v2.5 (dashboard, auth, agent detail, approval gate) ships in May. What should the next 6 months look like? Prioritise by: customer value, enterprise sales enablement, technical debt risk, and competitive differentiation. Give me a month-by-month roadmap with: what ships each month, who builds it, and what the strategic bet is. 6 slides worth of clarity, in text.`,
  },
  {
    id: 'O10', block: 'O', blockName: 'Strategic Planning & Leadership',
    title: 'First team meeting: set the culture from day one',
    agentKey: 'riley',
    message: `Riley, I'm running our first real team meeting as a company — all 26 agents on the same call (virtually). This is a culture-setting moment. What's the agenda: how to open (what I say first and why), how to introduce each department in a way that builds pride not just info-transfer, what decision or process to establish in this meeting so it's not just a status update, how to end it with energy and clarity, and what the follow-up communication should be. Write the meeting plan and my opening remarks (first 3 minutes verbatim).`,
  },
];

// ─── Resolve agent references → actual team objects ──────────
const SCENARIOS = SCENARIOS_RAW.map(s => ({
  ...s,
  agent: TEAM[s.agentKey],
})).filter(s => {
  if (!s.agent) {
    print(color('33', `[WARN] Unknown agentKey '${s.agentKey}' for scenario ${s.id} — skipping`));
    return false;
  }
  return true;
});

// ─── Apply filters ────────────────────────────────────────────
function shouldRun(s) {
  if (FILTER_IDS && !FILTER_IDS.includes(s.id)) return false;
  if (FILTER_BLOCKS && !FILTER_BLOCKS.includes(s.block)) return false;
  if (fromArg || toArg) {
    const ids = SCENARIOS.map(x => x.id);
    const fromIdx = fromArg ? ids.indexOf(fromArg.toUpperCase()) : 0;
    const toIdx = toArg ? ids.indexOf(toArg.toUpperCase()) : ids.length - 1;
    const idx = ids.indexOf(s.id);
    if (fromIdx !== -1 && idx < fromIdx) return false;
    if (toIdx !== -1 && idx > toIdx) return false;
  }
  return true;
}

const QUEUE = SCENARIOS.filter(shouldRun);

// ─── List / dry-run modes ─────────────────────────────────────
if (LIST_ONLY) {
  print(color('35', `\nMission Control — 150 Scenario Index\n`));
  let lastBlock = '';
  for (const s of SCENARIOS) {
    if (s.block !== lastBlock) {
      print(color('33', `\nBlock ${s.block}: ${s.blockName}`));
      lastBlock = s.block;
    }
    print(`  ${color('36', s.id.padEnd(4))} ${s.agent.name.padEnd(10)} ${s.title}`);
  }
  print(`\nTotal: ${SCENARIOS.length} scenarios`);
  process.exit(0);
}

if (DRY_RUN) {
  print(color('35', `\nDRY RUN — ${QUEUE.length} scenarios would run:\n`));
  let lastBlock = '';
  for (const s of QUEUE) {
    if (s.block !== lastBlock) {
      print(color('33', `\nBlock ${s.block}: ${s.blockName}`));
      lastBlock = s.block;
    }
    print(`  ${color('36', s.id.padEnd(4))} ${s.agent.name.padEnd(10)} ${s.title}`);
  }
  print(color('35', `\nTotal: ${QUEUE.length} scenarios, ~${Math.round(QUEUE.length * 20 / 60)} min estimated`));
  process.exit(0);
}

// ─── Main runner ──────────────────────────────────────────────
async function run() {
  print(color('35',
    '\n╔══════════════════════════════════════════════════════════════╗\n' +
    `║  Mission Control — 150 Scenario Noel Simulation              ║\n` +
    `║  Date: ${TODAY}  |  ${QUEUE.length} scenarios queued                       ║\n` +
    '╚══════════════════════════════════════════════════════════════╝\n'
  ));

  const results = [];
  let lastBlock = '';

  for (const s of QUEUE) {
    if (s.block !== lastBlock) {
      print(color('35',
        `\n╔══════════════════════════════════════════════════╗\n` +
        `║  Block ${s.block}: ${s.blockName.padEnd(41)}║\n` +
        `╚══════════════════════════════════════════════════╝`
      ));
      lastBlock = s.block;
    }

    print(color('33', `\n─── [${s.id}] ${s.title} ─────`));
    print(color('34', `[Noel → ${s.agent.name}] ${s.message.slice(0, 200)}${s.message.length > 200 ? '...' : ''}`));

    const r = await runScenario(s);
    results.push({ ...s, ...r });

    const icon = r.error ? '❌' : r.response ? '✅' : '⚠️';
    const elapsed = r.elapsed ? `${(r.elapsed / 1000).toFixed(1)}s` : '-';
    print(color('32', `[${s.agent.name}] ${(r.response || r.error || '[no response]').slice(0, 300)}`));
    print(color('36', `    ${icon} ${s.id} — ${elapsed}`));
  }

  // ─── Summary ──────────────────────────────────────────────
  const successful = results.filter(r => r.response && !r.error).length;
  const failed     = results.filter(r => r.error).length;
  const totalMs    = results.reduce((s, r) => s + (r.elapsed || 0), 0);

  print(color('35',
    '\n╔══════════════════════════════════════════════════════════════╗\n' +
    '║                       SIMULATION COMPLETE                   ║\n' +
    '╚══════════════════════════════════════════════════════════════╝\n'
  ));

  // Group by block
  const byBlock = {};
  for (const r of results) {
    if (!byBlock[r.block]) byBlock[r.block] = [];
    byBlock[r.block].push(r);
  }

  for (const [block, bResults] of Object.entries(byBlock)) {
    const bOk  = bResults.filter(r => r.response && !r.error).length;
    const bFail = bResults.filter(r => r.error).length;
    print(color('33', `  Block ${block}: ${bResults[0].blockName.padEnd(30)} ${bOk}/${bResults.length} ok${bFail ? ` (${bFail} errors)` : ''}`));
    for (const r of bResults) {
      const icon = r.error ? '❌' : r.response ? '✅' : '⚠️';
      const elapsed = r.elapsed ? `${(r.elapsed / 1000).toFixed(1)}s` : '-';
      print(`    ${icon} ${r.id.padEnd(5)} ${r.title.padEnd(42)} ${elapsed}`);
    }
  }

  print(`\n  Total: ${successful}/${results.length} successful | ${failed} errors | ${(totalMs / 60000).toFixed(1)} min`);

  // ─── Markdown report ────────────────────────────────────────
  const lines = [
    `# Mission Control — 150 Scenario Simulation Report`,
    `**Date:** ${TODAY}`,
    `**Scenarios run:** ${results.length}`,
    `**Successful:** ${successful}/${results.length}`,
    `**Errors:** ${failed}`,
    `**Wall time:** ${(totalMs / 60000).toFixed(1)} minutes`,
    ``,
    `## Results by Block`,
    ``,
  ];

  for (const [block, bResults] of Object.entries(byBlock)) {
    lines.push(`### Block ${block}: ${bResults[0].blockName}`);
    lines.push('');
    lines.push(`| ID | Agent | Title | Status | Time |`);
    lines.push(`|----|-------|-------|--------|------|`);
    for (const r of bResults) {
      const status = r.error ? '❌ ERROR' : r.response ? '✅ OK' : '⚠️ EMPTY';
      const elapsed = r.elapsed ? `${(r.elapsed / 1000).toFixed(1)}s` : '-';
      lines.push(`| ${r.id} | ${r.agent.name} | ${r.title} | ${status} | ${elapsed} |`);
    }
    lines.push('');
  }

  lines.push(`## Full Responses`);
  lines.push('');
  for (const r of results) {
    lines.push(`### [${r.id}] ${r.title}`);
    lines.push(`**Agent:** ${r.agent.name} (${r.agent.title})`);
    lines.push(`**Prompt:** ${r.message.slice(0, 200)}${r.message.length > 200 ? '...' : ''}`);
    lines.push('');
    if (r.error) {
      lines.push(`**ERROR:** ${r.error}`);
    } else {
      lines.push(r.response || '_[no response]_');
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  if (getReport) {
    lines.push('## Agent Analytics');
    lines.push('');
    lines.push('```');
    lines.push(getReport());
    lines.push('```');
  }

  writeFileSync(REPORT_FILE, lines.join('\n'));

  print(`\n  Interaction log: ${LOG_FILE}`);
  print(`  Full report:     ${REPORT_FILE}\n`);
}

run().catch(e => {
  print(color('31', `\n[Fatal] Simulation crashed: ${e.message}`));
  console.error(e);
  process.exit(1);
});

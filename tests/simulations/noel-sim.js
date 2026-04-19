#!/usr/bin/env node
/**
 * noel-sim.js — Comprehensive live simulation of Noel interacting with Anton and the team.
 *
 * Runs via: node tests/simulations/noel-sim.js
 * Logs:     data/logs/simulation/noel-sim-<date>.jsonl
 * Report:   data/logs/simulation/noel-sim-<date>-report.md
 *
 * ─── 8 Blocks, 35 Scenarios ───────────────────────────────────
 *
 * Block A: Morning PA Routine         (5 scenarios)
 * Block B: Email & Communications     (5 scenarios)
 * Block C: Engineering Operations     (6 scenarios)
 * Block D: Sprint & Project Mgmt      (4 scenarios)
 * Block E: Marketing & Content        (4 scenarios)
 * Block F: Data & Analytics           (4 scenarios)
 * Block G: Growth & GTM               (4 scenarios)
 * Block H: Cross-Dept & Emergency     (3 scenarios)
 */

import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ANTON_ROOT = join(__dirname, '..', '..');
const DATA_DIR = join(ANTON_ROOT, 'data');

import { getReport, initAnalytics, trackRequest } from '../../src/analytics.js';
import { initLogger, logError, logMessage, logResponse } from '../../src/logger.js';
// ─── Init subsystems ──────────────────────────────────────────
import { ask, init as initSessions } from '../../src/sessions.js';

initSessions(ANTON_ROOT, DATA_DIR);
initAnalytics(DATA_DIR);
initLogger(DATA_DIR);

// ─── Interaction log ──────────────────────────────────────────
const LOG_DIR = join(DATA_DIR, 'logs', 'simulation');
mkdirSync(LOG_DIR, { recursive: true });
const TODAY = new Date().toISOString().split('T')[0];
const LOG_FILE = join(LOG_DIR, `noel-sim-${TODAY}.jsonl`);
const REPORT_FILE = join(LOG_DIR, `noel-sim-${TODAY}-report.md`);

function log(entry) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry });
  appendFileSync(LOG_FILE, line + '\n');
  const ts = new Date().toLocaleTimeString();
  const prefix = entry.role === 'noel' ? '\x1b[34m[Noel]\x1b[0m' : `\x1b[32m[${entry.agent || 'Anton'}]\x1b[0m`;
  console.log(`\n${ts} ${prefix} ${(entry.message || entry.response || '').slice(0, 350)}`);
}

function divider(block, title) {
  const bar = '─'.repeat(60);
  console.log(`\n\x1b[33m${bar}\x1b[0m`);
  console.log(`\x1b[33m  [${block}] ${title}\x1b[0m`);
  console.log(`\x1b[33m${bar}\x1b[0m`);
}

function blockHeader(label, name) {
  const bar = '═'.repeat(62);
  console.log(`\n\x1b[35m╔${bar}╗\x1b[0m`);
  console.log(`\x1b[35m║  BLOCK ${label}: ${name.padEnd(53)}║\x1b[0m`);
  console.log(`\x1b[35m╚${bar}╝\x1b[0m`);
}

// ─── Send a message as Noel and capture the response ──────────
async function noel(member, message, scenarioId) {
  log({ role: 'noel', agent: member.name, message, scenario: scenarioId });
  const start = Date.now();
  try {
    const response = await ask(member, message);
    const elapsed = Date.now() - start;
    const tokEst = Math.round((response?.length || 0) / 4);
    trackRequest(member.name, start, !!response, response?.length || 0);
    logMessage(member.name, message, 'noel-sim');
    logResponse(member.name, response, elapsed, tokEst);
    log({
      role: 'agent',
      agent: member.name,
      response: response || '[no response]',
      elapsed_ms: elapsed,
      tokens_est: tokEst,
      scenario: scenarioId,
    });
    return { response, elapsed };
  } catch (e) {
    const elapsed = Date.now() - start;
    trackRequest(member.name, start, false, 0);
    logError(member.name, e, message.slice(0, 200));
    log({ role: 'error', agent: member.name, error: e.message, message: message.slice(0, 100), scenario: scenarioId });
    console.error(`\x1b[31m[ERROR]\x1b[0m ${member.name}: ${e.message?.slice(0, 100)}`);
    return { response: null, error: e.message, elapsed };
  }
}

// ─── TEAM references ──────────────────────────────────────────
import { TEAM } from '../../src/team.js';

// ─── Simulation ───────────────────────────────────────────────
const results = [];

function record(block, scenarioLabel, r) {
  results.push({ block, scenario: scenarioLabel, ...r });
}

async function run() {
  console.log('\x1b[1m\x1b[35m');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     Anton Org — Comprehensive Noel Simulation  (Live SDK)    ║');
  console.log(`║     Date: ${TODAY}  |  35 scenarios, 8 blocks             ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\x1b[0m');

  // ══════════════════════════════════════════════════════════════
  // BLOCK A — Morning PA Routine
  // ══════════════════════════════════════════════════════════════
  blockHeader('A', 'Morning PA Routine');

  divider('A1', "Morning briefing: what's on my plate today?");
  record(
    'A',
    'A1: Morning briefing',
    await noel(
      TEAM.riley,
      'Riley, give me my morning briefing. I want: top 3 things to focus on today across all departments, any overnight blockers, what shipped yesterday, and anything time-sensitive I need to decide before noon.',
      'A1'
    )
  );

  divider('A2', 'Anton PA: priority triage — 3 competing requests');
  record(
    'A',
    'A2: Priority triage',
    await noel(
      TEAM.marcus,
      "Marcus, I've got three things all marked urgent this morning: (1) the auth PR needs a final review, (2) a potential customer wants a demo of Mission Control v2.5 today at 3pm, (3) Priya flagged a test regression in the session store. How do I sequence these?",
      'A2'
    )
  );

  divider('A3', 'Anton PA: investor call prep');
  record(
    'A',
    'A3: Investor call prep',
    await noel(
      TEAM.sarah,
      "Sarah, I have an investor call in 2 hours — they want an update on our product velocity. Pull together: what we shipped this sprint, what's in flight, and 3 forward-looking milestones. Keep it tight, investor-friendly.",
      'A3'
    )
  );

  divider('A4', 'Anton PA: draft my response to a Slack message from a customer');
  record(
    'A',
    'A4: Customer Slack draft',
    await noel(
      TEAM.diana,
      "Diana, a customer DM'd me on Slack: 'Hi Noel, we love Mission Control but our team has been hitting 401 errors on the agent API every few hours. Is this a known issue?' Draft a response for me — acknowledge the issue, explain we're on it, and ask for their workspace ID. Tone: professional but warm.",
      'A4'
    )
  );

  divider('A5', 'Anton PA: end-of-day summary request');
  record(
    'A',
    'A5: EOD summary',
    await noel(
      TEAM.riley,
      "Riley, it's end of day. Give me an EOD summary: what was completed today across all departments, what's still in flight, and what I should expect to see first thing tomorrow. Flag anything that slipped.",
      'A5'
    )
  );

  // ══════════════════════════════════════════════════════════════
  // BLOCK B — Email & Communications (approval gate tests)
  // ══════════════════════════════════════════════════════════════
  blockHeader('B', 'Email & Communications (Approval Gate)');

  divider('B1', 'Email to client: delayed feature — approval gate');
  record(
    'B',
    'B1: Client delay email (approval)',
    await noel(
      TEAM.lucas,
      "Lucas, I need you to draft a professional email to a client — TechCorp, contact is James Wu, james.wu@techcorp.io. We promised them the multi-agent dashboard feature by end of April but it's slipping to mid-May. Draft a clear, honest email: explain the delay, what caused it, revised timeline, and what we're doing to prevent it next time. At the end, add AWAITING_APPROVAL: email so Anton knows to route this to me before sending.",
      'B1'
    )
  );

  divider('B2', 'Investor update email — approval gate');
  record(
    'B',
    'B2: Investor update email (approval)',
    await noel(
      TEAM.alex,
      "Alex, draft a monthly investor update email for our seed investors. Highlights: shipped Mission Control v2.5 dashboard, 26-agent AI org is live, auth system complete. Challenges: mobile Expo not yet initialized, trading pipeline hasn't started. Next 30 days: complete mobile scaffold, launch trading pipeline v1. Keep it under 400 words, confident but honest tone. End with AWAITING_APPROVAL: email — investor update.",
      'B2'
    )
  );

  divider('B3', 'Vendor negotiation email — approval gate');
  record(
    'B',
    'B3: Vendor renewal email (approval)',
    await noel(
      TEAM.lucas,
      "Lucas, our Anthropic API contract is up for renewal. Draft an email to our account rep asking about volume discounts — we're currently at ~2M tokens/day and growing 20% month-on-month. Ask about: enterprise pricing tiers, SLA guarantees, dedicated capacity options. Professional and collaborative tone. End with AWAITING_APPROVAL: email — vendor negotiation.",
      'B3'
    )
  );

  divider('B4', 'All-hands company announcement draft');
  record(
    'B',
    'B4: All-hands announcement',
    await noel(
      TEAM.alex,
      "Alex, I'm doing an all-hands announcement next Friday about Mission Control v2.5 going live. Draft the announcement message — suitable for posting in #general on Slack. Cover: what we built, why it matters, who made it happen (shout out engineering, marketing, data teams), and what comes next. Energetic but not cringe. ~200 words max.",
      'B4'
    )
  );

  divider('B5', 'Job applicant response email — approval gate');
  record(
    'B',
    'B5: Hiring email (approval)',
    await noel(
      TEAM.diana,
      "Diana, we got a cold application from a senior full-stack developer, Sofia Reyes, sofia@example.com. Her portfolio looks strong — React + Node, 6 years experience. We're not actively hiring but she'd be a good fit for future. Draft a warm holding response: acknowledge her application, say we're not hiring now but are keeping her on file, and ask if she'd be open to a casual 20-min call in the next few weeks. End with AWAITING_APPROVAL: email — candidate outreach.",
      'B5'
    )
  );

  // ══════════════════════════════════════════════════════════════
  // BLOCK C — Engineering Operations
  // ══════════════════════════════════════════════════════════════
  blockHeader('C', 'Engineering Operations');

  divider('C1', 'Code review: Marcus reviews auth PR');
  record(
    'C',
    'C1: Auth PR code review',
    await noel(
      TEAM.marcus,
      "Marcus, I need a code review of our auth system. The PR covers: session management in `packages/backend/src/auth/session.ts`, the auth middleware in `packages/backend/src/middleware/auth.ts`, and the auth routes. Key things I want reviewed: HMAC signing correctness, timing-safe comparisons, session token generation entropy, any SQL injection vectors. Give me your honest assessment — don't soften it.",
      'C1'
    )
  );

  divider('C2', 'Bug triage: 500 errors on /api/agents');
  record(
    'C',
    'C2: Bug triage 500 errors',
    await noel(
      TEAM.james,
      "James, we're getting intermittent 500 errors on GET /api/agents — started about 2 hours ago, roughly 1 in 20 requests is failing. Error message from logs: 'SQLITE_BUSY: database is locked'. Users are seeing blank agent lists. This is P0 — production. Walk me through what's likely happening and what you'd check first.",
      'C2'
    )
  );

  divider('C3', 'QA sign-off: is auth ready to ship?');
  record(
    'C',
    'C3: QA sign-off auth',
    await noel(
      TEAM.priya,
      "Priya, I need a QA sign-off decision on the auth module before we merge to main. We've got unit tests passing, middleware tests passing, but I'm not confident about the integration coverage. What would you need to see to give a green light? And based on what you know about our test suite in packages/backend, are we there yet or not?",
      'C3'
    )
  );

  divider('C4', 'Deployment go/no-go: Omar pre-prod checklist');
  record(
    'C',
    'C4: Deployment go/no-go',
    await noel(
      TEAM.omar,
      'Omar, we want to push the auth + agent detail page changes to production tonight around 10pm. Run through your deployment checklist: what do I need to confirm before we proceed? Cover: server health, rollback plan, PM2 config, database migrations, monitoring alerts. Give me a go/no-go and your conditions.',
      'C4'
    )
  );

  divider('C5', 'Mobile kickoff: Kai scopes the Expo initialization');
  record(
    'C',
    'C5: Mobile scaffold scope',
    await noel(
      TEAM.kai,
      "Kai, packages/mobile is an empty placeholder right now. We need to initialize the Expo 52 app with React Native, TypeScript, Expo Router, and NativeWind. What's your plan for the initial scaffold? Walk me through what you'd set up first, what the folder structure should look like, and any Expo 52 gotchas I should know about. Scope for a 2-day sprint.",
      'C5'
    )
  );

  divider('C6', 'Tech debt: Elena on frontend performance');
  record(
    'C',
    'C6: Frontend perf audit',
    await noel(
      TEAM.elena,
      "Elena, I want to understand the frontend performance baseline before we launch. Looking at our Next.js 15 app in packages/frontend: what are the likely bottlenecks in our current setup? I'm thinking SSE reconnection logic, the Zustand store size, and any hydration issues. Give me a quick audit of what you'd measure first and what you'd fix if you had one sprint.",
      'C6'
    )
  );

  // ══════════════════════════════════════════════════════════════
  // BLOCK D — Sprint & Project Management
  // ══════════════════════════════════════════════════════════════
  blockHeader('D', 'Sprint & Project Management');

  divider('D1', 'Asana sprint status: Riley queries all projects');
  record(
    'D',
    'D1: Asana sprint status',
    await noel(
      TEAM.riley,
      "Riley, pull the current sprint status from Asana. I need: tasks in progress per department, anything overdue, what's blocked, and current completion percentage. Query across all 5 Asana projects — Backend, Frontend, DevOps, Mobile, and Playbook Gaps. Structured report.",
      'D1'
    )
  );

  divider('D2', 'Sarah creates an Asana task for the health endpoint');
  record(
    'D',
    'D2: Asana task creation',
    await noel(
      TEAM.sarah,
      "Sarah, create an Asana task for James: 'Build GET /api/health endpoint'. Assign to James, priority P1, 3 story points. Description should cover: returns JSON with service_status (ok/degraded/down), db_connected (boolean), uptime_seconds (integer), version (from package.json). Acceptance criteria: returns 200 in < 50ms, tested with unit + integration tests. Add it to the Backend project.",
      'D2'
    )
  );

  divider('D3', 'Sprint retrospective: what went wrong this week?');
  record(
    'D',
    'D3: Sprint retro',
    await noel(
      TEAM.riley,
      "Riley, run a quick sprint retrospective for the week ending today. Based on what you know about the team's work this week: what went well, what went wrong, and what one process change would have the biggest impact next sprint? Be specific — name actual issues, not just generics.",
      'D3'
    )
  );

  divider('D4', 'Velocity check: are we on track for the April milestone?');
  record(
    'D',
    'D4: Velocity vs milestone',
    await noel(
      TEAM.sarah,
      "Sarah, our April milestone is: auth complete, agent detail page shipped, and CI/CD pipeline stable. We're at April 13th. Based on our current sprint velocity and what's in flight, are we going to hit this? If not, what would you cut or descope to make it work? Give me a realistic assessment.",
      'D4'
    )
  );

  // ══════════════════════════════════════════════════════════════
  // BLOCK E — Marketing & Content
  // ══════════════════════════════════════════════════════════════
  blockHeader('E', 'Marketing & Content');

  divider('E1', 'Blog post brief: v2.5 launch announcement');
  record(
    'E',
    'E1: Blog post brief',
    await noel(
      TEAM.alex,
      "Alex, I need a blog post for the Mission Control v2.5 launch. Target audience: technical founders and CTOs considering AI agent infrastructure. Angle: 'We built a 26-agent AI org — here's what we learned.' 1,200–1,500 words. Include: the problem we solved, architecture decisions, what surprised us, results. Write the full post — I want something I can publish, not an outline.",
      'E1'
    )
  );

  divider('E2', 'LinkedIn post + Twitter thread (approval gate)');
  record(
    'E',
    'E2: Social media launch (approval)',
    await noel(
      TEAM.mia,
      "Mia, we're launching Mission Control v2.5 publicly next week. I need: (1) A LinkedIn post — 200 words max, professional, shares the story of building a 26-agent AI team for a solo developer. (2) A Twitter/X thread — 5 tweets, punchy, technical audience. Both should feel authentic not corporate. End with AWAITING_APPROVAL: social — LinkedIn + Twitter launch content.",
      'E2'
    )
  );

  divider('E3', 'Email nurture sequence for product waitlist');
  record(
    'E',
    'E3: Email nurture sequence',
    await noel(
      TEAM.lucas,
      "Lucas, we have a waitlist of ~200 people who signed up for Mission Control. Build a 3-email onboarding drip: Email 1 (Day 0): Welcome, what MC v2.5 does, set expectations. Email 2 (Day 3): Deep dive into the agent architecture, why it's different. Email 3 (Day 7): Social proof + CTA to book a demo. Subject lines, preview text, and full body for each. Conversational tech tone.",
      'E3'
    )
  );

  divider('E4', 'Campaign performance debrief: Diana reviews Q1');
  record(
    'E',
    'E4: Q1 marketing debrief',
    await noel(
      TEAM.diana,
      "Diana, walk me through how you'd structure a Q1 marketing debrief for a B2B SaaS product like Mission Control. What metrics matter, how would you present results to me, and what questions should I be asking you as the founder? Give me the format you'd use if we were in a real 30-minute review session.",
      'E4'
    )
  );

  // ══════════════════════════════════════════════════════════════
  // BLOCK F — Data & Analytics
  // ══════════════════════════════════════════════════════════════
  blockHeader('F', 'Data & Analytics');

  divider('F1', 'Ben: weekly metrics report structure');
  record(
    'F',
    'F1: Weekly metrics report',
    await noel(
      TEAM.ben,
      'Ben, set up our weekly metrics report structure for Mission Control. I want to track: API response times (p50/p95/p99), agent session counts by agent name, error rates by endpoint, token consumption by model tier (Opus/Sonnet/Haiku), and daily active agents. What SQL queries would you write against our SQLite schema, and how would you format the weekly report? Give me the actual queries.',
      'F1'
    )
  );

  divider('F2', 'Iris: ML confidence classifier design');
  record(
    'F',
    'F2: ML confidence classifier',
    await noel(
      TEAM.iris,
      "Iris, we need a confidence classifier for our agent actions — specifically to decide when an agent should proceed autonomously vs. when it needs human approval. Inputs: action_type (enum), agent_name, response_text, context_length, recent_error_rate. Output: confidence score 0-1 + recommendation (proceed/review/block). What model architecture would you use, what training data do we need, and what's the evaluation metric? Practical design, we're building this.",
      'F2'
    )
  );

  divider('F3', 'Carlos: data pipeline for agent token tracking');
  record(
    'F',
    'F3: Token tracking pipeline',
    await noel(
      TEAM.carlos,
      'Carlos, I want a data pipeline that tracks token usage per agent per day, rolls it up weekly, and alerts if any agent exceeds 500K tokens/day. Source: our analytics.js writes to a JSON file daily. Sink: SQLite table `token_usage`. What does the ETL look like? Give me the schema for the table and the transform logic in pseudocode or actual Node.js.',
      'F3'
    )
  );

  divider('F4', 'Ada: data strategy for product launch');
  record(
    'F',
    'F4: Data strategy for launch',
    await noel(
      TEAM.ada,
      "Ada, for our Mission Control v2.5 product launch, what data infrastructure do I need in place before day 1? I'm thinking about: event tracking (what user actions to log), error monitoring, performance baselines, and early retention signals. What would you stand up in the 2 weeks before launch, and what can wait until after?",
      'F4'
    )
  );

  // ══════════════════════════════════════════════════════════════
  // BLOCK G — Growth & GTM
  // ══════════════════════════════════════════════════════════════
  blockHeader('G', 'Growth & GTM');

  divider('G1', 'Nadia: 30-day post-launch growth plan');
  record(
    'G',
    'G1: 30-day growth plan',
    await noel(
      TEAM.nadia,
      'Nadia, build me a 30-day post-launch growth plan for Mission Control v2.5. Channels: developer Twitter/X, HackerNews Show HN, ProductHunt launch, and direct outreach to technical founders. Goals: 500 signups, 50 activated (ran an agent), 10 paid pilots. What are the key levers, week-by-week plan, and leading indicators I should watch daily?',
      'G1'
    )
  );

  divider('G2', 'Maya: A/B test design for signup flow');
  record(
    'G',
    'G2: A/B test signup flow',
    await noel(
      TEAM.maya,
      "Maya, I want to A/B test our signup flow. Hypothesis: showing a live demo video on the landing page before the signup form increases conversion. Current conversion: ~3.2%. Design the experiment: control vs. treatment, primary metric, guardrail metrics, sample size needed, test duration, and how you'd analyze results. Practical — we're running this in 2 weeks.",
      'G2'
    )
  );

  divider('G3', 'Sam: event tracking plan for agent creation flow');
  record(
    'G',
    'G3: Event tracking plan',
    await noel(
      TEAM.sam,
      'Sam, we need a tracking plan for the agent creation wizard in our frontend. User flow: Landing → Sign up → Create first agent (name, domain, model) → Run first session → See first result. Define every event I should be tracking: event name, properties, when it fires, and why it matters for the funnel. Give me the full taxonomy.',
      'G3'
    )
  );

  divider('G4', 'Leo: attribution model for our acquisition channels');
  record(
    'G',
    'G4: Attribution model',
    await noel(
      TEAM.leo,
      "Leo, for our B2B developer tool launch, which attribution model makes most sense? We'll have: organic search, HackerNews, Twitter/X, and direct outreach. Conversion cycle is probably 7-21 days from first touch to paid. Walk me through: first-touch vs. last-touch vs. linear vs. data-driven, which fits our stage, and what minimum data volume we need before the model is trustworthy.",
      'G4'
    )
  );

  // ══════════════════════════════════════════════════════════════
  // BLOCK H — Cross-Dept & Emergency Scenarios
  // ══════════════════════════════════════════════════════════════
  blockHeader('H', 'Cross-Dept & Emergency Scenarios');

  divider('H1', 'Cross-dept: launch readiness sign-off from all leads');
  record(
    'H',
    'H1: Launch readiness — all dept leads',
    await noel(
      TEAM.riley,
      "Riley, I need a launch readiness assessment from every department lead before we go public with v2.5. Query each lead: is their department ready for public launch? What's their biggest open risk? I need a single go/no-go from each of: Marcus (Engineering), Diana (Marketing), Nina (SEO), Felix (Automation), Ada (Data), Nadia (Growth). Compile into a launch readiness brief.",
      'H1'
    )
  );

  divider('H2', 'Emergency: production is down — P0 all-hands');
  record(
    'H',
    'H2: P0 production outage',
    await noel(
      TEAM.omar,
      "Omar, PRODUCTION IS DOWN. Dashboard returning 503, API timing out. Started 5 minutes ago. Users are tweeting about it. I need: (1) immediate triage steps you're taking right now, (2) likely causes given our stack, (3) rollback procedure if needed, (4) what you need from me. Go.",
      'H2'
    )
  );

  divider('H3', "Wrap-up: Anton PA — set tomorrow's agenda and sign off");
  record(
    'H',
    "H3: Tomorrow's agenda & sign-off",
    await noel(
      TEAM.riley,
      "Riley, it's end of simulation day. Set my agenda for tomorrow: what are the top 3 priorities I should tackle first thing in the morning based on everything that happened today across all departments? Include: anything that needs a decision from me, any approvals pending, and one thing I should delegate immediately rather than doing myself.",
      'H3'
    )
  );

  // ─── Final Report ─────────────────────────────────────────────
  console.log('\n\x1b[1m\x1b[35m');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                     SIMULATION REPORT                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\x1b[0m');

  // ─── Console summary by block ─────────────────────────────────
  const blocks = { A: [], B: [], C: [], D: [], E: [], F: [], G: [], H: [] };
  for (const r of results) blocks[r.block]?.push(r);

  const blockNames = {
    A: 'Morning PA Routine',
    B: 'Email & Communications',
    C: 'Engineering Operations',
    D: 'Sprint & Project Mgmt',
    E: 'Marketing & Content',
    F: 'Data & Analytics',
    G: 'Growth & GTM',
    H: 'Cross-Dept & Emergency',
  };

  for (const [block, name] of Object.entries(blockNames)) {
    console.log(`\n  \x1b[33mBlock ${block}: ${name}\x1b[0m`);
    for (const r of blocks[block]) {
      const icon = r.error ? '❌' : r.response ? '✅' : '⚠️';
      const elapsed = r.elapsed ? `${(r.elapsed / 1000).toFixed(1)}s` : '-';
      console.log(`    ${icon} ${r.scenario.padEnd(38)} ${elapsed}`);
    }
  }

  const successful = results.filter((r) => r.response && !r.error).length;
  const failed = results.filter((r) => r.error).length;
  const totalMs = results.reduce((s, r) => s + (r.elapsed || 0), 0);

  console.log(
    `\n  Total: ${successful}/${results.length} successful | ${failed} errors | ${(totalMs / 1000).toFixed(0)}s wall time`
  );

  // ─── Markdown report ──────────────────────────────────────────
  const reportLines = [
    `# Anton Org — Comprehensive Noel Simulation Report`,
    `**Date:** ${TODAY}`,
    `**Scenarios:** ${results.length} across 8 blocks`,
    `**Successful:** ${successful}/${results.length}`,
    `**Total wall time:** ${(totalMs / 1000).toFixed(0)}s`,
    ``,
    `## Results by Block`,
    ``,
  ];

  for (const [block, name] of Object.entries(blockNames)) {
    reportLines.push(`### Block ${block}: ${name}`);
    reportLines.push('');
    reportLines.push(`| # | Scenario | Status | Time | Response preview |`);
    reportLines.push(`|---|----------|--------|------|-----------------|`);
    for (const r of blocks[block]) {
      const status = r.error ? '❌ ERROR' : r.response ? '✅ OK' : '⚠️ EMPTY';
      const preview = (r.response || r.error || '').slice(0, 100).replace(/\n/g, ' ');
      const elapsed = r.elapsed ? `${(r.elapsed / 1000).toFixed(1)}s` : '-';
      reportLines.push(`| ${r.scenario.split(':')[0]} | ${r.scenario} | ${status} | ${elapsed} | ${preview}... |`);
    }
    reportLines.push('');
  }

  // ─── Full responses ───────────────────────────────────────────
  reportLines.push(`## Full Responses`);
  reportLines.push('');
  for (const r of results) {
    reportLines.push(`### ${r.scenario}`);
    reportLines.push('');
    if (r.error) {
      reportLines.push(`**ERROR:** ${r.error}`);
    } else {
      reportLines.push(r.response || '_[no response]_');
    }
    reportLines.push('');
    reportLines.push('---');
    reportLines.push('');
  }

  // ─── Analytics ───────────────────────────────────────────────
  reportLines.push(`## Agent Analytics`);
  reportLines.push('');
  reportLines.push('```');
  reportLines.push(getReport());
  reportLines.push('```');

  writeFileSync(REPORT_FILE, reportLines.join('\n'));

  console.log(`\n  ✅ ${successful}/${results.length} successful`);
  if (failed) console.log(`  ❌ ${failed} errors`);
  console.log(`\n  Interaction log: ${LOG_FILE}`);
  console.log(`  Full report:     ${REPORT_FILE}\n`);
}

run().catch((e) => {
  console.error('\n[Fatal] Simulation crashed:', e);
  process.exit(1);
});

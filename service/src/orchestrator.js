// ─── Sprint Orchestrator ─────────────────────────────────────
// Kicks off autonomous work from Slack commands

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { TEAM, getDeptMembers, getDeptLead } from './team.js';
import { ask } from './sessions.js';
import { postAs, postTyping, replaceTyping } from './slack.js';
import { trackRequest } from './analytics.js';

// Track active sprints — persisted across restarts
const activeSprints = new Map(); // dept → { started, agents, lead }
let sprintStateFile = null;
let _antonRoot = null;

function persistSprints() {
  if (!sprintStateFile) return;
  const data = {};
  for (const [dept, info] of activeSprints) {
    data[dept] = info;
  }
  try {
    writeFileSync(sprintStateFile, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('[Orchestrator] Failed to persist sprint state:', e.message);
  }
}

export function initOrchestrator(antonRoot) {
  _antonRoot = antonRoot;
  sprintStateFile = join(antonRoot, 'sprint-state.json');
  if (existsSync(sprintStateFile)) {
    try {
      const saved = JSON.parse(readFileSync(sprintStateFile, 'utf-8'));
      for (const [dept, info] of Object.entries(saved)) {
        activeSprints.set(dept, info);
      }
      if (activeSprints.size > 0) {
        console.log(`[Orchestrator] Restored ${activeSprints.size} active sprint(s)`);
      }
    } catch {
      console.warn('[Orchestrator] Could not restore sprint state — starting fresh');
    }
  }
  console.log('[Orchestrator] Ready');
}

// ─── Detect orchestrator commands ────────────────────────────
export function detectCommand(text) {
  const lower = text.toLowerCase();

  // Start team
  const startMatch = lower.match(/\b(start|kick off|launch|spin up|boot)\s+(the\s+)?(engineering|marketing|seo|data|growth|automation|all)\s*(team|sprint|agents?)?/);
  if (startMatch) return { type: 'start', dept: startMatch[3] };

  // Run sprint
  if (/\b(run|start|begin)\s+(a\s+)?sprint\b/i.test(text)) return { type: 'sprint' };

  // Status of running agents
  if (/\b(who.?s (working|active|running)|active agents|team status|what.?s running)\b/i.test(text)) return { type: 'status' };

  // Stop
  const stopMatch = lower.match(/\b(stop|shut down|kill|end)\s+(the\s+)?(engineering|marketing|seo|data|growth|automation|all)\s*(team|sprint|agents?)?/);
  if (stopMatch) return { type: 'stop', dept: stopMatch[3] };

  return null;
}

const DEPT_NAMES = {
  engineering: 'eng', marketing: 'mktg', seo: 'seo',
  data: 'data', growth: 'growth', automation: 'auto', all: 'all',
};

// ─── Start a department team ─────────────────────────────────
export async function startTeam(dept, channelId, ts, client) {
  const deptKey = DEPT_NAMES[dept] || dept;

  // "Start all teams" — cascade to every department
  if (deptKey === 'all') {
    const depts = ['eng', 'mktg', 'seo', 'auto', 'data', 'growth'];
    await postAs(client, { name: 'Anton' }, channelId, ts,
      `Starting all 6 departments (${Object.keys(TEAM).length} agents total). This will take a few minutes.`);
    for (const d of depts) {
      const dName = Object.entries(DEPT_NAMES).find(([_, v]) => v === d)?.[0] || d;
      await startTeam(dName, channelId, ts, client);
    }
    return;
  }

  const members = getDeptMembers(deptKey);
  const lead = deptKey === 'all' ? TEAM.marcus : getDeptLead(deptKey);

  if (activeSprints.has(deptKey)) {
    await postAs(client, { name: 'Anton' }, channelId, ts,
      `${dept} team is already running. Use "stop ${dept} team" first.`);
    return;
  }

  console.log(`[Orchestrator] Starting ${dept} team (${members.length} agents)`);

  await postAs(client, { name: 'Anton' }, channelId, ts,
    `Starting ${dept} team with ${members.length} agents. ${lead.name} will coordinate.`);

  activeSprints.set(deptKey, {
    started: new Date().toISOString(),
    agents: members.map(m => m.name),
    lead: lead.name,
  });
  persistSprints();

  // Step 1: Lead reads Asana and plans
  const h1 = await postTyping(client, lead, channelId, ts);
  const start1 = Date.now();
  const plan = await ask(lead,
    `Noel just started the ${dept} team sprint. Read the current Asana tasks for our projects and create a sprint plan. ` +
    `List what each team member should work on. Be specific — task names, priorities, assignments. ` +
    `Then assign the top priority tasks. Keep it concise.`);
  trackRequest(lead.name, start1, !!plan, plan?.length || 0);
  await replaceTyping(client, lead, h1, plan || `I'll get the team organized. Checking Asana now.`);

  // Step 2: Ask each team member to pick up their work
  for (const member of members) {
    if (member.name === lead.name) continue; // lead already spoke

    const h = await postTyping(client, member, channelId, ts);
    const start = Date.now();
    const response = await ask(member,
      `Sprint is starting. ${lead.name} is coordinating. Check your Asana tasks and pick up your highest priority item. ` +
      `Tell the team what you're working on. If you don't have assigned tasks, ask ${lead.name} what to pick up.`);
    trackRequest(member.name, start, !!response, response?.length || 0);
    await replaceTyping(client, member, h, response || `checking my tasks now`);
  }

  await postAs(client, { name: 'Anton' }, channelId, ts,
    `${dept} team is up and running. ${members.length} agents active. Ask anyone for updates or type "team status" to check.`);
}

// ─── Run a full sprint ───────────────────────────────────────
export async function runSprint(channelId, ts, userId, client) {
  await postAs(client, { name: 'Anton' }, channelId, ts,
    `Starting sprint planning. Sarah will pull the backlog and assign work.`);

  // Sarah plans
  const h1 = await postTyping(client, TEAM.sarah, channelId, ts);
  const start1 = Date.now();
  const plan = await ask(TEAM.sarah,
    `<@${userId}> wants to start a new sprint. ` +
    `Pull the current Asana backlog across all projects. ` +
    `Pick the highest priority unstarted tasks. ` +
    `Assign them: backend to James, frontend to Elena, mobile to Kai, devops to Omar. ` +
    `Create a sprint summary with task assignments and story points. ` +
    `Move assigned tasks to "Todo" in Asana.`);
  trackRequest(TEAM.sarah.name, start1, !!plan, plan?.length || 0);
  await replaceTyping(client, TEAM.sarah, h1, plan || `pulling the backlog now...`);

  // Marcus reviews
  const h2 = await postTyping(client, TEAM.marcus, channelId, ts);
  const start2 = Date.now();
  const review = await ask(TEAM.marcus,
    `Sarah just planned the sprint. Review the assignments and priorities. ` +
    `Flag any concerns about workload balance or technical dependencies. ` +
    `If it looks good, approve it.`);
  trackRequest(TEAM.marcus.name, start2, !!review, review?.length || 0);
  await replaceTyping(client, TEAM.marcus, h2, review || `reviewing the plan...`);

  await postAs(client, { name: 'Anton' }, channelId, ts,
    `Sprint planned. Ask individual agents to start work, or say "start engineering team" to kick everyone off.`);
}

// ─── Team status ─────────────────────────────────────────────
export async function teamStatus(channelId, ts, client) {
  if (activeSprints.size === 0) {
    await postAs(client, { name: 'Anton' }, channelId, ts,
      `No teams currently running. Say "start engineering team" or "run a sprint" to begin.`);
    return;
  }

  const lines = [`*Active teams:*`];
  for (const [dept, info] of activeSprints) {
    const elapsed = Math.round((Date.now() - new Date(info.started).getTime()) / 60000);
    lines.push(`*${dept}* — ${info.agents.length} agents, led by ${info.lead}, running for ${elapsed}min`);
    lines.push(`  Agents: ${info.agents.join(', ')}`);
  }

  await postAs(client, { name: 'Anton' }, channelId, ts, lines.join('\n'));
}

// ─── Stop a team ─────────────────────────────────────────────
export async function stopTeam(dept, channelId, ts, client) {
  const deptKey = DEPT_NAMES[dept] || dept;

  if (deptKey === 'all') {
    activeSprints.clear();
    persistSprints();
    await postAs(client, { name: 'Anton' }, channelId, ts, `All teams stopped.`);
    return;
  }

  if (!activeSprints.has(deptKey)) {
    await postAs(client, { name: 'Anton' }, channelId, ts, `${dept} team isn't running.`);
    return;
  }

  activeSprints.delete(deptKey);
  persistSprints();
  await postAs(client, { name: 'Anton' }, channelId, ts, `${dept} team stopped.`);
}

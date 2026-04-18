import pkg from '@slack/bolt';

const { App } = pkg;

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initWeb } from './src/spine/web.js';
import { getReport, initAnalytics, trackRequest } from './src/v1-archive/analytics.js';
import { initAudit } from './src/v1-archive/audit.js';
import { initBriefing } from './src/v1-archive/briefing.js';
import { initContext } from './src/v1-archive/context.js';
// V1 handle.js removed — brain handles classification now
import { initLogger, logError, logMessage, logResponse } from './src/v1-archive/logger.js';
import { appendDailyNote, appendDeptMemory, appendSharedMemory, initMemory } from './src/v1-archive/memory.js';
import { consumeBriefingBuffer, initNotify, notifyNoel } from './src/v1-archive/notify.js';
import {
  detectCommand,
  initOrchestrator,
  runSprint,
  startTeam,
  stopTeam,
  teamStatus,
} from './src/v1-archive/orchestrator.js';
import { initPriority } from './src/v1-archive/priority.js';
import { channelToDept } from './src/v1-archive/router.js';
// V1 route, isEveryoneRequest, detectCollaboration removed — brain handles routing
import {
  cancelJob,
  formatTime,
  initInboxProcessor,
  initNightlyConsolidation,
  init as initScheduler,
  listJobs,
  loadPersistedTimes,
  parseTimeStr,
  scheduleJob,
} from './src/v1-archive/scheduler.js';
import { ask, consumeHandoffs, init as initSessions } from './src/v1-archive/sessions.js';
import { openDM, postAs, postTyping, replaceTyping } from './src/v1-archive/slack.js';
import { getBoardReport, initTaskQueue } from './src/v1-archive/taskqueue.js';
import { findByName, getDeptMembers, HANDOFF_RULES, TEAM } from './src/v1-archive/team.js';
import { describeImages, initVision } from './src/v1-archive/vision.js';
import { checkGitState, getHealthSnapshot, initWatcher } from './src/v1-archive/watcher.js';

// ─── Paths & Config ──────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const ANTON_ROOT = __dirname;
const DATA_DIR = join(ANTON_ROOT, 'data');
const CHANNEL_MAP_FILE = join(ANTON_ROOT, 'slack-channels.env');

// Load .env
const envFile = join(ANTON_ROOT, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.+)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const APP_TOKEN = process.env.SLACK_APP_TOKEN;
const NOEL_USER_ID = process.env.NOEL_SLACK_USER_ID || '';

// Channel switches — control which frontends are active
// Set in .env: ANTON_CHANNELS=web,slack (comma-separated)
// Default: all available channels
const CHANNEL_CONFIG = (process.env.ANTON_CHANNELS || 'web,slack')
  .toLowerCase()
  .split(',')
  .map((c) => c.trim());
const SLACK_ENABLED = CHANNEL_CONFIG.includes('slack') && BOT_TOKEN && APP_TOKEN;
const WEB_ENABLED = CHANNEL_CONFIG.includes('web');

if (!SLACK_ENABLED && !WEB_ENABLED) {
  console.error('[Anton] No channels enabled. Set ANTON_CHANNELS=web,slack in .env');
  process.exit(1);
}

if (SLACK_ENABLED) {
  console.log('[Anton] Slack channel: ON');
} else {
  console.log(`[Anton] Slack channel: OFF${!BOT_TOKEN ? ' (no token)' : ''}`);
}
if (WEB_ENABLED) console.log('[Anton] Web channel: ON');

// ─── Security: NOEL_USER_ID guard ────────────────────────────
// Approval gate is disabled without this — warn loudly but don't hard-fail
// (allows running in dev without full env setup).
if (!NOEL_USER_ID) {
  console.warn('[Anton] WARNING: NOEL_SLACK_USER_ID not set — approval gate disabled.');
  console.warn('[Anton] Set NOEL_SLACK_USER_ID in .env to enable Jarvis trust mode.');
}

// Load channel map (id→name and name→id)
const idToName = new Map();
const nameToId = new Map();
try {
  for (const line of readFileSync(CHANNEL_MAP_FILE, 'utf-8').split('\n')) {
    const [name, id] = line.split('=');
    if (name && id) {
      idToName.set(id.trim(), name.trim());
      nameToId.set(name.trim(), id.trim());
    }
  }
} catch {}

// ─── State ───────────────────────────────────────────────────
// Cascade prevention: per-pair cooldown + channel rate limit
const recentDispatches = new Map(); // `${from}→${to}` → timestamp
const channelCallCount = new Map(); // channelId → { count, resetAt }

// Approval gate: queue of pending approvals per DM channel.
// Map value is an array so simultaneous requests from multiple agents don't
// overwrite each other — they queue and are presented one at a time.
const pendingApprovals = new Map(); // dmChannelId → ApprovalEntry[]

// ─── Init subsystems ─────────────────────────────────────────
// V1 Memory (kept for backward compat during migration)
initMemory(ANTON_ROOT, DATA_DIR);
initContext(DATA_DIR);
initSessions(ANTON_ROOT, DATA_DIR);
initAnalytics(DATA_DIR);
initLogger(DATA_DIR);
initTaskQueue(DATA_DIR);
initVision();
initScheduler(DATA_DIR);
initOrchestrator(DATA_DIR);

// ─── NO_REPLY sentinel ───────────────────────────────────────
// Agents respond with exactly "NO_REPLY" to stay silent in group messages.
const NO_REPLY_RE = /^NO_REPLY\b/i;

// ─── Rate limiting ───────────────────────────────────────────
function canDispatch(channelId) {
  const now = Date.now();
  const entry = channelCallCount.get(channelId) || { count: 0, resetAt: now + 60_000 };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 60_000;
  }
  if (entry.count >= 5) {
    console.warn(`[Anton] Rate limit hit for channel ${channelId}`);
    return false;
  }
  entry.count++;
  channelCallCount.set(channelId, entry);
  return true;
}

// ─── Tracked ask ─────────────────────────────────────────────
async function trackedAsk(member, message, source) {
  const start = Date.now();
  logMessage(member.name, message, source || 'unknown');
  try {
    const response = await ask(member, message);
    const elapsed = Date.now() - start;
    const tokensEst = Math.round((response?.length || 0) / 4);
    trackRequest(member.name, start, !!response, response?.length || 0);
    logResponse(member.name, response, elapsed, tokensEst);
    return response;
  } catch (e) {
    trackRequest(member.name, start, false, 0);
    logError(member.name, e, message.slice(0, 200));
    throw e;
  }
}

// ─── Anton voice ─────────────────────────────────────────────
// Anton-voiced responses — uses the dedicated anton agent definition.
// Falls back to the provided static string on error.
// Anton gets the same tools as Riley (base + Asana) so it can pull project context
const ANTON_AGENT = { name: 'Anton', agent: 'anton', tools: TEAM.riley.tools };

async function askAnton(prompt, fallback = '') {
  try {
    const result = await ask(ANTON_AGENT, prompt);
    return result || fallback;
  } catch (e) {
    console.error('[Anton] askAnton failed:', e.message, e.stack?.split('\n').slice(0, 3).join('\n'));
    return fallback;
  }
}

// classifyIntent imported from ./src/handle.js

// ─── Approval gate ───────────────────────────────────────────

// Post the DM for one approval entry (used for first in queue and after processing one).
async function postApprovalDM(client, dm, entry, queueLength = 0) {
  const { member, actionType, summary, fullDraft } = entry;
  const preview = fullDraft
    .replace(/AWAITING_APPROVAL:.+/i, '')
    .trim()
    .slice(0, 600);
  const queueNote = queueLength > 1 ? ` _(${queueLength - 1} more queued after this)_` : '';

  await postAs(
    client,
    { name: 'Anton' },
    dm,
    undefined,
    `*Approval needed* — ${member.name} (${member.title})${queueNote}\n` +
      `*Action:* ${actionType}\n*Summary:* ${summary}\n\n` +
      `*Draft:*\n${preview}\n\n` +
      `Reply *yes* to approve or *no* to deny.`
  );
}

async function handleApprovalRequest(member, actionType, summary, fullDraft, channelId, ts, client) {
  if (!NOEL_USER_ID) {
    console.warn(`[Anton] Approval skipped — NOEL_USER_ID not set. ${member.name} wanted: ${actionType}`);
    return;
  }

  try {
    const dm = await openDM(client, NOEL_USER_ID);

    // Queue the approval (multiple agents can request simultaneously)
    const entry = { member, actionType, summary, fullDraft, channelId, ts };
    const queue = pendingApprovals.get(dm) || [];
    queue.push(entry);
    pendingApprovals.set(dm, queue);

    // Only post to Noel if this is the first in queue (otherwise it's already waiting)
    if (queue.length === 1) {
      await postApprovalDM(client, dm, entry, queue.length);
    } else {
      console.log(`[Anton] Approval queued (position ${queue.length}): ${member.name} / ${actionType}`);
    }

    // Auto-deny after 15 minutes if this entry is still pending
    setTimeout(
      () => {
        const current = pendingApprovals.get(dm) || [];
        const idx = current.indexOf(entry);
        if (idx === -1) return; // already handled

        current.splice(idx, 1);
        if (current.length === 0) {
          pendingApprovals.delete(dm);
        } else {
          pendingApprovals.set(dm, current);
          // If we removed the head, show the next one
          if (idx === 0) {
            postApprovalDM(client, dm, current[0], current.length).catch(() => {});
          }
        }

        postAs(
          client,
          { name: 'Anton' },
          dm,
          undefined,
          `Approval for ${member.name}'s ${actionType} request timed out (15 min). Automatically denied.`
        ).catch(() => {});
        trackedAsk(
          member,
          `Your ${actionType} request timed out — Noel didn't respond within 15 minutes. Request cancelled.`,
          'approval-timeout'
        ).catch(() => {});
      },
      15 * 60 * 1000
    );
  } catch (e) {
    console.error('[Anton] Failed to send approval request:', e.message?.slice(0, 100));
  }
}

// ─── Everyone handler ────────────────────────────────────────
async function handleEveryone(text, channelId, channelName, ts, client) {
  const dept = channelToDept(channelName);
  const members = getDeptMembers(dept);
  console.log(`[Anton] GROUP → ${members.length} members in ${dept}`);

  for (const member of members) {
    try {
      const handle = await postTyping(client, member, channelId, ts);
      const response = await trackedAsk(
        member,
        `Team was asked: "${text}". Give YOUR short personal response. 2-3 sentences. Be yourself.`
      );
      if (response && NO_REPLY_RE.test(response.trim())) {
        // Agent opted out — delete the typing indicator silently
        await replaceTyping(client, member, handle, null);
        console.log(`[Anton] ${member.name} → NO_REPLY (group)`);
        continue;
      }
      await replaceTyping(client, member, handle, response || 'pass on this one');
    } catch (e) {
      console.error(`[Anton] ${member.name} group fail:`, e.message?.slice(0, 100));
    }
  }
  try {
    await client.reactions.add({ channel: channelId, timestamp: ts, name: 'white_check_mark' });
  } catch {}
}

// ─── Collaboration handler ───────────────────────────────────
async function handleCollab(collab, channelId, ts, client) {
  console.log(`[Anton] COLLAB: ${collab.from.name} ↔ ${collab.to.name}`);

  const h1 = await postTyping(client, collab.from, channelId, ts);
  const question = await trackedAsk(
    collab.from,
    `You need to ask ${collab.to.name} (${collab.to.title}) about: ${collab.topic}. What's your question?`
  );
  await replaceTyping(client, collab.from, h1, question || collab.topic);

  const h2 = await postTyping(client, collab.to, channelId, ts);
  const answer = await trackedAsk(
    collab.to,
    `${collab.from.name} asks you: "${question || collab.topic}". Answer directly.`
  );
  await replaceTyping(client, collab.to, h2, answer || 'hmm, let me think about that');

  if (answer) {
    const h3 = await postTyping(client, collab.from, channelId, ts);
    const summary = await trackedAsk(
      collab.from,
      `${collab.to.name} said: "${answer}". Briefly react or say what you'll do with this info.`
    );
    await replaceTyping(client, collab.from, h3, summary || 'got it, thanks');
  }

  try {
    await client.reactions.add({ channel: channelId, timestamp: ts, name: 'white_check_mark' });
  } catch {}
}

// ─── Agent action handler (cascade-safe) ─────────────────────
// depth = how many hops deep we are (max 2)
async function handleAgentAction(member, response, channelId, ts, client, depth = 0) {
  // Hard stop at depth 2
  if (depth >= 2) {
    console.log(`[Anton] Cascade depth limit reached for ${member.name}`);
    return;
  }

  // ── Approval gate: only check last 200 chars to prevent injection ──
  const tail = response.slice(-200);
  const approvalMatch = tail.match(/AWAITING_APPROVAL:\s*([\w_]+)\s*[—-]\s*(.+)/i);
  if (approvalMatch) {
    await handleApprovalRequest(
      member,
      approvalMatch[1].trim(),
      approvalMatch[2].trim(),
      response,
      channelId,
      ts,
      client
    );
    return; // Don't also do handoff if approval is pending
  }

  // ── Anton escalation — agents report to Anton, Anton reports to Noel ──
  // When agents mention "Anton" or "notify/ping Anton", relay through Anton to Noel's DM.
  // Agents should NEVER DM Noel directly — Anton is the gatekeeper.
  if (
    /\b(ping(ing)? (anton|noel)|message (anton|noel)|notify (anton|noel)|(anton|noel).*(review|merge|approve)|ready for.*(anton|noel)|report to anton)\b/i.test(
      response
    )
  ) {
    if (NOEL_USER_ID) {
      try {
        const dmChannel = await openDM(client, NOEL_USER_ID);
        const extract = response.match(/(?:anton|noel)[,:]?\s*(.*)/i)?.[1] || response.slice(0, 200);
        // Post as Anton (the PA), not the individual agent
        await postAs(client, { name: 'Anton' }, dmChannel, undefined, `From ${member.name}: ${extract}`);
        console.log(`[Anton] ${member.name} → Anton → Noel DM: ${extract.slice(0, 80)}`);
      } catch (e) {
        console.error(`[Anton] Failed to relay to Noel:`, e.message?.slice(0, 100));
      }
    }
  }

  // Handoffs are SendMessage-only — agents use the SendMessage tool to delegate.
  // Processed via consumeHandoffs() above.

  // ── Sarah auto-dispatch ──
  if (member.name === 'Sarah' && /\b(assign|assigned|sprint|pick up|breakdown)\b/i.test(response)) {
    const agentNames = ['James', 'Elena', 'Kai', 'Omar', 'Priya'];
    const assignedAgents = agentNames
      .filter((name) => {
        const regex = new RegExp(`\\b${name}\\b.*(?:task|build|create|write|finish|close|pick up|test|deploy)`, 'i');
        const altRegex = new RegExp(`(?:assign|assigned).*\\b${name}\\b`, 'i');
        return regex.test(response) || altRegex.test(response);
      })
      .map(findByName)
      .filter(Boolean);

    if (assignedAgents.length > 0) {
      const engChannelId = nameToId.get('anton-engineering') || channelId;
      for (const agent of assignedAgents) {
        const idx = assignedAgents.indexOf(agent);
        setTimeout(async () => {
          try {
            const h = await postTyping(client, agent, engChannelId, undefined);
            const pickup = await trackedAsk(
              agent,
              `Sarah just assigned sprint tasks. Your instructions from Sarah:\n\n"${response.slice(0, 800)}"\n\nFind YOUR tasks in the message above. Pick up your highest priority task and start working on it.`,
              'auto-dispatch'
            );
            await replaceTyping(client, agent, h, pickup || 'checking my tasks now');
          } catch (e) {
            console.error(`[Anton] Dispatch ${agent.name} failed:`, e.message?.slice(0, 100));
          }
        }, idx * 5000);
      }
    }
  }
}

// ─── Schedule commands ───────────────────────────────────────
// Returns true if the message was a schedule command (caller should return early).
async function handleScheduleCommand(text, channelId, ts, client) {
  // "set standup at 9am" / "set standup for 14:30"
  const setMatch = text.match(/\b(?:set|schedule|create)\s+(?:a\s+)?standup\s+(?:at|for|@)\s+([0-9apm:]+)/i);
  if (setMatch) {
    const parsed = parseTimeStr(setMatch[1]);
    if (!parsed) {
      await postAs(
        client,
        { name: 'Anton' },
        channelId,
        ts,
        `Couldn't parse that time. Try "set standup at 9am" or "set standup at 14:30".`
      );
      return true;
    }
    const { hours, minutes } = parsed;
    scheduleJob('daily-standup', hours, minutes, runScheduledStandup);
    await postAs(
      client,
      { name: 'Anton' },
      channelId,
      ts,
      `Standup set for ${formatTime(hours, minutes)} daily. Riley will DM you.`
    );
    return true;
  }

  // "cancel standup"
  if (/\bcancel\s+standup\b/i.test(text)) {
    const cancelled = cancelJob('daily-standup');
    await postAs(client, { name: 'Anton' }, channelId, ts, cancelled ? 'Standup cancelled.' : 'No standup scheduled.');
    return true;
  }

  // "when is standup" / "what time is standup"
  if (/\bwhen\s+is\s+standup|what\s+time\s+is\s+standup/i.test(text)) {
    const jobs = listJobs();
    const standup = jobs.find((j) => j.id === 'daily-standup');
    await postAs(
      client,
      { name: 'Anton' },
      channelId,
      ts,
      standup ? `Standup is at ${standup.time} daily.` : 'No standup scheduled.'
    );
    return true;
  }

  return false;
}

// ─── Scheduled standup ───────────────────────────────────────
async function runScheduledStandup() {
  if (!NOEL_USER_ID) return;
  try {
    const dm = await openDM(slackApp.client, NOEL_USER_ID);
    const h = await postTyping(slackApp.client, TEAM.riley, dm, undefined);
    const report = await trackedAsk(
      TEAM.riley,
      `Daily standup for Noel. Discover all projects via asana_list_workspaces. ` +
        `Per dept: in progress, blocked, completed. Specific task names. Keep it tight.`,
      'scheduled-standup'
    );
    await replaceTyping(slackApp.client, TEAM.riley, h, report || 'No updates today.');
  } catch (e) {
    console.error('[Anton] Standup job failed:', e.message);
  }
}

// ─── Nightly consolidation ───────────────────────────────────
// Each dept lead distills the day into a short narrative (DREAMS.md style).
// Riley produces a DAILY-INTEL DM summarising the whole org.
async function runNightlyConsolidation() {
  if (!NOEL_USER_ID) return;

  const leads = ['marcus', 'diana', 'nina', 'felix', 'ada', 'nadia'];
  for (const key of leads) {
    const lead = TEAM[key];
    if (!lead) continue;
    try {
      const summary = await trackedAsk(
        lead,
        `End-of-day consolidation. In 4-6 bullet points, summarise: key decisions made today, ` +
          `blockers resolved, corrections received, and patterns you noticed. ` +
          `This will be injected into your context tomorrow as your DREAMS.md.`,
        'nightly-consolidation'
      );
      if (summary) {
        appendDeptMemory(lead.dept, lead.name, summary);
        appendSharedMemory(lead.name, `[EOD] ${summary.slice(0, 500)}`);
        appendDailyNote(`${lead.name} EOD: ${summary.slice(0, 200)}`);
      }
    } catch (e) {
      console.error(`[Consolidation] ${lead.name} failed:`, e.message);
    }
  }

  // Riley produces the org-wide DAILY-INTEL DM to Noel
  try {
    const dm = await openDM(slackApp.client, NOEL_USER_ID);
    const intel = await trackedAsk(
      TEAM.riley,
      `Tonight's DAILY-INTEL. Summarise: what shipped today, what's blocked, ` +
        `patterns across departments, and recommended focus for tomorrow. ` +
        `Under 300 words. Format: department-by-department, then a "Tomorrow" section.`,
      'daily-intel'
    );
    if (intel) {
      await postAs(
        slackApp.client,
        TEAM.riley,
        dm,
        undefined,
        `*Daily Intel — ${new Date().toLocaleDateString()}*\n\n${intel}`
      );
      appendSharedMemory('Riley', `[DAILY-INTEL] ${intel.slice(0, 800)}`);
      appendDailyNote(`Riley DAILY-INTEL: ${intel.slice(0, 300)}`);
    }
  } catch (e) {
    console.error('[Consolidation] Daily Intel failed:', e.message);
  }
}

// ─── Main message handler (V2 — brain-powered) ─────────────
// The brain handles ALL routing, classification, and communication.
// No regex. The LLM decides everything.
let _slackBrain = null;

async function handle(text, channelId, channelName, ts, userId, client) {
  try {
    await client.reactions.add({ channel: channelId, timestamp: ts, name: 'eyes' });
  } catch {}

  // Security: only process messages from Noel
  if (NOEL_USER_ID && userId !== NOEL_USER_ID && userId !== 'unknown') {
    console.log(`[Anton] Ignoring message from non-Noel user: ${userId}`);
    return;
  }

  // Load brain once (lazy init for Slack path)
  if (!_slackBrain) {
    try {
      const brainModule = await import('./src/brain/brain.ts');
      await brainModule.initBrain();
      _slackBrain = brainModule;
    } catch (e) {
      console.warn(`[Slack] Brain not available: ${e.message?.slice(0, 60)}`);
    }
  }

  // ── System commands (shutdown, restart) — infrastructure, not conversation ──
  if (/\b(kill all|shut(ting)?\s*down|go (to )?sleep|goodnight|stop everything|shutdown)\b/i.test(text)) {
    await postAs(client, { name: 'Anton' }, channelId, ts, 'Shutting down. Goodnight.');
    setTimeout(() => process.exit(0), 2000);
    return;
  }
  if (
    /\b(restart|reboot|wake up|come back)\b/i.test(text) &&
    !/\b(the|a|this)\s+(server|app|service|backend)\b/i.test(text)
  ) {
    await postAs(client, { name: 'Anton' }, channelId, ts, 'Restarting...');
    try {
      writeFileSync(join(DATA_DIR, 'sessions.json'), '{}');
    } catch {}
    setTimeout(() => process.exit(0), 2000);
    return;
  }

  // ── Schedule commands ──
  if (await handleScheduleCommand(text, channelId, ts, client)) {
    try {
      await client.reactions.add({ channel: channelId, timestamp: ts, name: 'white_check_mark' });
    } catch {}
    return;
  }

  // ── Orchestrator commands ──
  const cmd = detectCommand(text);
  if (cmd) {
    if (cmd.type === 'start') return startTeam(cmd.dept, channelId, ts, client);
    if (cmd.type === 'sprint') return runSprint(channelId, ts, userId, client);
    if (cmd.type === 'status') return teamStatus(channelId, ts, client);
    if (cmd.type === 'stop') return stopTeam(cmd.dept, channelId, ts, client);
  }

  // ── BRAIN HANDLES EVERYTHING ELSE — single-pass, no classifier ──
  if (_slackBrain) {
    const result = await _slackBrain.process(text, { context: `Channel: ${channelName}` });

    // LOCAL — brain handled it (free, no Claude)
    if (result.handledLocally && result.text) {
      await postAs(client, { name: 'Anton' }, channelId, ts, result.text);
      try {
        await client.reactions.add({ channel: channelId, timestamp: ts, name: 'white_check_mark' });
      } catch {}

      // Natural handoffs detected in the response
      if (result.handoffs?.length > 0) {
        for (const h of result.handoffs) {
          console.log(`[LOCAL/Slack] Handoff -> ${h.agent}`);
          const typing = await postTyping(client, { name: h.agent }, channelId, ts);
          try {
            const handoffResult = await _slackBrain.process(h.message, {
              agent: h.agent,
              context: `Handoff from Anton`,
            });
            await replaceTyping(client, { name: h.agent }, typing, handoffResult.text || 'Got it.');
          } catch (e) {
            await replaceTyping(client, { name: h.agent }, typing, 'hit a snag');
          }
        }
      }
      return;
    }

    // CLAUDE — brain says this needs Claude
    console.log(`[CLAUDE/Slack] needed -> Anton`);
    const agent = ANTON_AGENT;
    const typing = await postTyping(client, agent, channelId, ts);
    try {
      const response = await trackedAsk(agent, text, 'brain-to-claude');
      await replaceTyping(client, agent, typing, response || 'working on it...');
      try {
        await client.reactions.add({ channel: channelId, timestamp: ts, name: 'white_check_mark' });
      } catch {}
    } catch (e) {
      await replaceTyping(client, agent, typing, 'hit a snag, try again?');
    }
    return;
  }

  // No brain — Claude fallback
  console.log(`[Slack] No brain — Claude-only`);
  const typing = await postTyping(client, { name: 'Anton' }, channelId, ts);
  const r = await askAnton(text, 'Let me think about that.');
  await replaceTyping(client, { name: 'Anton' }, typing, r);
}

// ─── Slack App (conditional) ─────────────────────────────────
let slackApp = null;
if (SLACK_ENABLED) {
  slackApp = new App({
    token: BOT_TOKEN,
    appToken: APP_TOKEN,
    socketMode: true,
    logLevel: 'WARN',
  });
} else {
  // Stub so slackApp.client references don't crash in shared code
  slackApp = { client: null, start: async () => {} };
}

// Channel messages in #anton-* channels
if (SLACK_ENABLED)
  slackApp.message(async ({ message, client }) => {
    if ('bot_id' in message) return;
    if ('subtype' in message && message.subtype !== 'file_share') return;
    if (!('channel' in message)) return;
    const channelName = idToName.get(message.channel);
    if (!channelName) return;

    const hasFiles = message.files?.length > 0;
    const text = (message.text ?? '').trim();

    if (hasFiles) {
      const imageFiles = (message.files || []).filter((f) => f.mimetype?.startsWith('image/') && f.url_private);
      const imageContext = imageFiles.length ? await describeImages(imageFiles, BOT_TOKEN, text) : '';

      if (!text && !imageContext) {
        await postAs(
          client,
          { name: 'Anton' },
          message.channel,
          message.ts,
          `Couldn't process that image. Try describing what you see or paste the text directly.`
        );
        return;
      }

      const fullText = (text || 'User sent an image:') + (imageContext ? `\n\n${imageContext}` : '');
      await handle(fullText, message.channel, channelName, message.ts, message.user ?? 'unknown', client);
      return;
    }

    if (!text) return;
    await handle(text, message.channel, channelName, message.ts, message.user ?? 'unknown', client);
  });

// DMs — check for pending approval responses FIRST, then route normally
if (SLACK_ENABLED)
  slackApp.message(async ({ message, client }) => {
    if ('bot_id' in message) return;
    if ('subtype' in message && message.subtype !== 'file_share') return;
    if (!('channel' in message)) return;
    if (idToName.has(message.channel)) return; // already handled above

    const hasFiles = message.files?.length > 0;
    const rawText = (message.text ?? '').trim();

    let finalText = rawText;
    if (hasFiles) {
      const imageFiles = (message.files || []).filter((f) => f.mimetype?.startsWith('image/') && f.url_private);
      const imageContext = imageFiles.length ? await describeImages(imageFiles, BOT_TOKEN, rawText) : '';
      finalText = (rawText || 'User sent an image:') + (imageContext ? `\n\n${imageContext}` : '');

      if (!finalText.trim()) {
        await postAs(
          client,
          { name: 'Anton' },
          message.channel,
          message.ts,
          `Couldn't process that image. Try describing what you see.`
        );
        return;
      }
    }

    if (!finalText) return;

    // ── Approval response: must be from Noel in his DM channel ──
    if (NOEL_USER_ID && message.user === NOEL_USER_ID) {
      const queue = pendingApprovals.get(message.channel);
      if (queue?.length > 0) {
        const approved = /^(yes|y|ok|approve|go|approved|do it)\b/i.test(finalText);
        const denied = /^(no|n|deny|denied|reject|stop|cancel|don.?t)\b/i.test(finalText);

        if (approved || denied) {
          // Remove head of queue and process it
          const pending = queue.shift();
          if (queue.length === 0) {
            pendingApprovals.delete(message.channel);
          } else {
            // Show the next pending request immediately
            pendingApprovals.set(message.channel, queue);
            postApprovalDM(client, message.channel, queue[0], queue.length).catch(() => {});
          }

          if (approved) {
            await postAs(
              client,
              { name: 'Anton' },
              message.channel,
              message.ts,
              `Approved. Telling ${pending.member.name} to proceed.${queue.length > 0 ? ` (${queue.length} more pending above)` : ''}`
            );
            const h = await postTyping(client, pending.member, pending.channelId, pending.ts);
            const result = await trackedAsk(
              pending.member,
              `Noel approved your ${pending.actionType} request: "${pending.summary}". ` +
                `Please execute it now. Original draft:\n${pending.fullDraft.slice(0, 1000)}`,
              'approval-approved'
            );
            await replaceTyping(client, pending.member, h, result || 'executing...');
          } else {
            await postAs(
              client,
              { name: 'Anton' },
              message.channel,
              message.ts,
              `Denied. Notifying ${pending.member.name}.${queue.length > 0 ? ` (${queue.length} more pending above)` : ''}`
            );
            const h = await postTyping(client, pending.member, pending.channelId, pending.ts);
            const r = await trackedAsk(
              pending.member,
              `Noel denied your ${pending.actionType} request: "${pending.summary}". Do not proceed. Stand by.`,
              'approval-denied'
            );
            await replaceTyping(client, pending.member, h, r || 'understood, standing by');
          }
          return; // Do not fall through to normal routing
        }
      }
    }

    console.log(`[Anton] DM from ${message.user}: ${finalText.slice(0, 60)}`);
    await handle(finalText, message.channel, 'dm', message.ts, message.user ?? 'unknown', client);
  });

// @anton mentions in any channel
if (SLACK_ENABLED)
  slackApp.event('app_mention', async ({ event, client }) => {
    const text = (event.text ?? '').replace(/<@[^>]+>/g, '').trim();
    if (!text) return;
    const channelName = idToName.get(event.channel) ?? 'unknown';
    await handle(text, event.channel, channelName, event.ts, event.user, client);
  });

// ─── Start ───────────────────────────────────────────────────
console.log(`[Anton] Starting...`);
console.log(`[Anton] Channels: ${idToName.size} | Team: ${Object.keys(TEAM).length}`);

// Start — Slack connects if enabled, then init subsystems
const startPromise = SLACK_ENABLED ? slackApp.start() : Promise.resolve();
startPromise
  .then(async () => {
    // V2 Memory (SQLite — crash-safe, searchable)
    try {
      const { initSqliteMemory } = await import('./src/memory/sqlite.ts');
      initSqliteMemory(DATA_DIR);
    } catch (e) {
      console.warn(`[Memory] SQLite init failed: ${e.message?.slice(0, 60)}`);
    }

    console.log('');
    console.log('  Anton is online.');
    console.log(`  ${SLACK_ENABLED ? `${idToName.size} channels | ` : ''}${Object.keys(TEAM).length} team members`);
    console.log(`  Channels: ${[SLACK_ENABLED && 'slack', WEB_ENABLED && 'web'].filter(Boolean).join(', ')}`);
    console.log('');

    // Restore persisted schedule
    const savedSchedule = loadPersistedTimes();
    if (savedSchedule['daily-standup']) {
      const { hours, minutes } = savedSchedule['daily-standup'];
      scheduleJob('daily-standup', hours, minutes, runScheduledStandup);
      console.log(`[Anton] Restored standup at ${formatTime(hours, minutes)}`);
    }

    // Inbox auto-processor — routes data/inbox/*.md files through handle()
    // Drop any .md file in data/inbox/ to inject a command programmatically.
    // Format: first line is optional routing hint (#channel-name), rest is the message.
    initInboxProcessor(DATA_DIR, async (content, filename) => {
      try {
        // Optional first line: "#channel-name" to route to a specific channel
        const lines = content.split('\n');
        let channelName = 'anton-standup'; // default
        let text = content;

        if (lines[0]?.startsWith('#')) {
          channelName = lines[0].slice(1).trim();
          text = lines.slice(1).join('\n').trim();
        }

        if (!text) {
          console.warn(`[Inbox] Empty message in ${filename} — skipping`);
          return;
        }

        const channelId = nameToId.get(channelName);
        if (!channelId) {
          console.warn(`[Inbox] Unknown channel "${channelName}" in ${filename}`);
          return;
        }

        console.log(`[Inbox] Routing "${text.slice(0, 60)}..." → #${channelName}`);
        await handle(text, channelId, channelName, String(Date.now()), NOEL_USER_ID || 'inbox', slackApp.client);
      } catch (e) {
        console.error(`[Inbox] Failed to route ${filename}:`, e.message);
      }
    });

    // Nightly consolidation — DREAMS.md + DAILY-INTEL at 23:30
    initNightlyConsolidation(runNightlyConsolidation);

    // Notification system
    initNotify({ slackClient: SLACK_ENABLED ? slackApp.client : null, noelUserId: NOEL_USER_ID });

    // Audit log (SQLite, hash-chained)
    initAudit(DATA_DIR);

    // Web chat interface at localhost:3000
    let wss = null;
    if (WEB_ENABLED) {
      // Load the local brain (Ollama)
      let brain = null;
      try {
        const brainModule = await import('./src/brain/brain.ts');
        await brainModule.initBrain();
        brain = brainModule;
      } catch (e) {
        console.warn(`[Web] Brain not available (${e.message?.slice(0, 60)}). Using Claude-only mode.`);
      }

      const webResult = initWeb({
        askAgent: async (agentName, text, onHandoff) => {
          try {
            // Override: @claude forces Claude session
            const forceClaudeMatch = text.match(/^[@/]claude\s+([\s\S]+)/i);
            if (forceClaudeMatch) {
              const cleanText = forceClaudeMatch[1].trim();
              console.log(`[CLAUDE] Forced via @claude: ${cleanText.slice(0, 60)}`);
              const member = agentName === 'Anton' ? ANTON_AGENT : findByName(agentName) || ANTON_AGENT;
              return await trackedAsk(member, cleanText, 'forced-claude');
            }

            // Override: @local forces local brain
            const forceLocalMatch = text.match(/^[@/]local\s+([\s\S]+)/i);
            if (forceLocalMatch && brain) {
              const cleanText = forceLocalMatch[1].trim();
              console.log(`[LOCAL] Forced via @local`);
              const result = await brain.process(cleanText, { context: `Talking to: ${agentName}`, agent: agentName });
              console.log(`[LOCAL] Forced | ${result.durationMs}ms | ${result.tokensOut} tokens`);
              return result.text || 'Could not process locally. Try without @local.';
            }

            // Brain handles everything (if available) — single-pass, no classifier
            if (brain) {
              const result = await brain.process(text, { context: `Talking to: ${agentName}`, agent: agentName });

              // LOCAL — brain handled it (free, no Claude)
              if (result.handledLocally && result.text) {
                // Dispatch handoffs (brain detected delegation in its response)
                if (result.handoffs?.length > 0 && onHandoff) {
                  for (const h of result.handoffs) {
                    console.log(`[LOCAL] Handoff -> ${h.agent}: ${h.message.slice(0, 80)}`);
                    (async () => {
                      try {
                        const handoffResult = await brain.process(h.message, {
                          agent: h.agent,
                          context: `Handoff from Anton`,
                        });
                        onHandoff(h.agent, handoffResult.text || 'Got it.');
                      } catch (e) {
                        console.error(`[Handoff] ${h.agent} failed:`, e.message?.slice(0, 80));
                      }
                    })();
                  }
                }
                return result.text;
              }

              // CLAUDE — brain says this needs Claude
              console.log(`[CLAUDE] -> ${agentName}`);
              const agent = agentName === 'Anton' ? ANTON_AGENT : findByName(agentName) || ANTON_AGENT;
              const response = await trackedAsk(agent, text, 'brain-to-claude');
              console.log(`[CLAUDE] Response from ${agent.name} (paid session)`);
              return response;
            }

            // No brain — fall back to Claude directly
            console.log(`[Web] No brain — Claude-only for ${agentName}`);
            const member = agentName === 'Anton' ? ANTON_AGENT : findByName(agentName) || ANTON_AGENT;
            return await trackedAsk(member, text, 'web-chat');
          } catch (e) {
            console.error(`[Web] Error:`, e.message?.slice(0, 100));
            return 'Having trouble right now. Try again.';
          }
        },
        port: 3000,
      });
      wss = webResult.wss;
    }

    // System health watcher — emits events to event bus, broadcasts health to web UI
    initWatcher({
      dataDir: DATA_DIR,
      broadcast: wss ? (msg) => wss.broadcast(msg) : null,
    });

    // Morning briefing — proactive daily push
    initBriefing({
      scheduleJob,
      getHealthSnapshot,
      checkGitState,
      consumeBriefingBuffer,
      notifyNoel,
      antonRoot: ANTON_ROOT,
      dataDir: DATA_DIR,
    });

    // Priority engine — maps events to notification severity
    initPriority({ notifyNoel });

    // Anton startup identity — post to standup channel (skip on --watch restarts)
    const startupFile = join(DATA_DIR, '.last-startup');
    const now = Date.now();
    try {
      writeFileSync(startupFile, String(now));
    } catch {}

    if (SLACK_ENABLED) {
      const standupChannel = nameToId.get('anton-standup');
      const lastStartup = (() => {
        try {
          return parseInt(readFileSync(startupFile, 'utf-8'), 10);
        } catch {
          return 0;
        }
      })();
      if (standupChannel && now - lastStartup > 120_000) {
        try {
          await postAs(
            slackApp.client,
            { name: 'Anton' },
            standupChannel,
            undefined,
            `Online. ${Object.keys(TEAM).length} agents ready. Type a name to reach anyone, or ask me directly.`
          );
        } catch {}
      }
    }
  })
  .catch((err) => {
    console.error('[Anton] FAILED:', err.message);
    process.exit(1);
  });

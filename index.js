import pkg from '@slack/bolt';
const { App } = pkg;
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TEAM, getDeptMembers, findByName, HANDOFF_RULES } from './src/team.js';
import { route, isEveryoneRequest, detectCollaboration, channelToDept } from './src/router.js';
import { init as initSessions, ask, consumeHandoffs } from './src/sessions.js';
import { postAs, postTyping, replaceTyping, openDM } from './src/slack.js';
import { initAnalytics, trackRequest, getReport } from './src/analytics.js';
import { initLogger, logMessage, logResponse, logError, logHandoff } from './src/logger.js';
import { initOrchestrator, detectCommand, startTeam, runSprint, teamStatus, stopTeam } from './src/orchestrator.js';
import { initTaskQueue, getBoardReport } from './src/taskqueue.js';
import { initVision, describeImages } from './src/vision.js';
import {
  init as initScheduler,
  scheduleJob,
  cancelJob,
  listJobs,
  loadPersistedTimes,
  parseTimeStr,
  formatTime,
  initInboxProcessor,
  initNightlyConsolidation,
} from './src/scheduler.js';
import { initMemory, appendDeptMemory, appendSharedMemory, appendDailyNote } from './src/memory.js';

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

if (!BOT_TOKEN || !APP_TOKEN) {
  console.error('[Anton] Missing SLACK_BOT_TOKEN or SLACK_APP_TOKEN');
  process.exit(1);
}

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
initSessions(ANTON_ROOT, DATA_DIR);
initAnalytics(DATA_DIR);
initLogger(DATA_DIR);
initTaskQueue(DATA_DIR);
initVision();
initMemory(ANTON_ROOT, DATA_DIR);
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
  } catch {
    return fallback;
  }
}

// ─── Intent classification ───────────────────────────────────
const INTENT_PATTERNS = [
  {
    type: 'system_command',
    pattern:
      /\b(set standup|cancel standup|when is standup|start .+ team|stop .+ team|run a sprint|team status|who.?s (working|active|running))\b/i,
  },
  {
    type: 'approval_response',
    pattern: /^(yes|y|no|n|approve|deny|go ahead|cancel|do it|don.?t|approved|denied)\b/i,
  },
  {
    type: 'status_query',
    pattern:
      /\b(what.?s (happening|going on|the status)|how.?s (the team|engineering|marketing|seo|data|growth|automation)|any blockers|sprint status|daily (update|brief|standup)|show (me )?(the )?status)\b/i,
  },
  {
    type: 'personal',
    pattern:
      /\b(what should i (do|focus|work on|prioritize)|help me (think|decide|plan)|i.?m not sure|should i|what do you think|my (priority|focus|plan) (today|this week)?)\b/i,
  },
  {
    type: 'task',
    pattern: /\b(build|fix|create|add|update|deploy|write|review|test)\b/i,
  },
];

function classifyIntent(text) {
  for (const { type, pattern } of INTENT_PATTERNS) {
    if (pattern.test(text)) return type;
  }
  return 'general';
}

// ─── Approval gate ───────────────────────────────────────────

// Post the DM for one approval entry (used for first in queue and after processing one).
async function postApprovalDM(client, dm, entry, queueLength = 0) {
  const { member, actionType, summary, fullDraft } = entry;
  const preview = fullDraft.replace(/AWAITING_APPROVAL:.+/i, '').trim().slice(0, 600);
  const queueNote = queueLength > 1 ? ` _(${queueLength - 1} more queued after this)_` : '';

  await postAs(
    client,
    { name: 'Anton' },
    dm,
    undefined,
    `*Approval needed* — ${member.name} (${member.title})${queueNote}\n` +
      `*Action:* ${actionType}\n*Summary:* ${summary}\n\n` +
      `*Draft:*\n${preview}\n\n` +
      `Reply *yes* to approve or *no* to deny.`,
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
          `Approval for ${member.name}'s ${actionType} request timed out (15 min). Automatically denied.`,
        ).catch(() => {});
        trackedAsk(
          member,
          `Your ${actionType} request timed out — Noel didn't respond within 15 minutes. Request cancelled.`,
          'approval-timeout',
        ).catch(() => {});
      },
      15 * 60 * 1000,
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
        `Team was asked: "${text}". Give YOUR short personal response. 2-3 sentences. Be yourself.`,
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
    `You need to ask ${collab.to.name} (${collab.to.title}) about: ${collab.topic}. What's your question?`,
  );
  await replaceTyping(client, collab.from, h1, question || collab.topic);

  const h2 = await postTyping(client, collab.to, channelId, ts);
  const answer = await trackedAsk(
    collab.to,
    `${collab.from.name} asks you: "${question || collab.topic}". Answer directly.`,
  );
  await replaceTyping(client, collab.to, h2, answer || 'hmm, let me think about that');

  if (answer) {
    const h3 = await postTyping(client, collab.from, channelId, ts);
    const summary = await trackedAsk(
      collab.from,
      `${collab.to.name} said: "${answer}". Briefly react or say what you'll do with this info.`,
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
  const approvalMatch = tail.match(/AWAITING_APPROVAL:\s*([\w_]+)\s*[—\-]\s*(.+)/i);
  if (approvalMatch) {
    await handleApprovalRequest(
      member,
      approvalMatch[1].trim(),
      approvalMatch[2].trim(),
      response,
      channelId,
      ts,
      client,
    );
    return; // Don't also do handoff if approval is pending
  }

  // ── Anton escalation — agents report to Anton, Anton reports to Noel ──
  // When agents mention "Anton" or "notify/ping Anton", relay through Anton to Noel's DM.
  // Agents should NEVER DM Noel directly — Anton is the gatekeeper.
  if (
    /\b(ping(ing)? (anton|noel)|message (anton|noel)|notify (anton|noel)|(anton|noel).*(review|merge|approve)|ready for.*(anton|noel)|report to anton)\b/i.test(
      response,
    )
  ) {
    if (NOEL_USER_ID) {
      try {
        const dmChannel = await openDM(client, NOEL_USER_ID);
        const extract = response.match(/(?:anton|noel)[,:]?\s*(.*)/i)?.[1] || response.slice(0, 200);
        // Post as Anton (the PA), not the individual agent
        await postAs(client, { name: 'Anton' }, dmChannel, undefined,
          `From ${member.name}: ${extract}`
        );
        console.log(`[Anton] ${member.name} → Anton → Noel DM: ${extract.slice(0, 80)}`);
      } catch (e) {
        console.error(`[Anton] Failed to relay to Noel:`, e.message?.slice(0, 100));
      }
    }
  }

  // ── Text-parse handoffs DISABLED ──────────────────────────────
  // Text-parsing for handoffs is too fragile — "Elena needs to pivot" is NOT a delegation
  // but "needs" + "Elena" in proximity triggers false dispatches.
  // Agents are instructed to use SendMessage tool for handoffs (see persona prompt).
  // Only SendMessage tool calls (processed via consumeHandoffs above) trigger real handoffs.
  // The text-parse block below is kept as dead code for reference.
  const alreadyDispatched = new Set();
  if (false) {
    // DEAD CODE — text-parse handoffs removed in favor of SendMessage-only.
    // If an agent wants to delegate, they MUST use the SendMessage tool.
    for (const teamMember of Object.values(TEAM)) {
      if (teamMember.name === member.name) continue;

      // Allowlist gate — only permitted routes can dispatch
      const permitted = HANDOFF_RULES[member.name] || [];
      if (!permitted.includes(teamMember.name)) {
        console.log(`[Anton] Blocked handoff: ${member.name} → ${teamMember.name} (not in allowlist)`);
        continue;
      }

      // Per-pair 60s cooldown
      const dispatchKey = `${member.name}→${teamMember.name}`;
      const lastDispatch = recentDispatches.get(dispatchKey);
      if (lastDispatch && Date.now() - lastDispatch < 60_000) {
        console.log(`[Anton] Cooldown active: ${dispatchKey}`);
        continue;
      }

      // Channel rate limit
      if (!canDispatch(channelId)) continue;

      if (!alreadyDispatched.has(teamMember.name)) {
        alreadyDispatched.add(teamMember.name);
        recentDispatches.set(dispatchKey, Date.now());
        console.log(`[Anton] ${member.name} → ${teamMember.name} (auto-handoff, depth ${depth})`);
        logHandoff(member.name, teamMember.name, response.slice(0, 200));

        const target = teamMember;
        const delay = alreadyDispatched.size * 5000;

        setTimeout(async () => {
          try {
            const h = await postTyping(client, target, channelId, ts);
            const followUp = await trackedAsk(
              target,
              `${member.name} (${member.title}) just said this, and it's directed at you:\n\n"${response.slice(0, 1200)}"\n\nPick up what they're asking you to do. Respond naturally.`,
              'auto-handoff',
            );
            await replaceTyping(client, target, h, followUp || 'got it, looking at it now');
            if (followUp) {
              await handleAgentAction(target, followUp, channelId, ts, client, depth + 1);
            }
          } catch (e) {
            console.error(`[Anton] Handoff to ${target.name} failed:`, e.message?.slice(0, 100));
          }
        }, delay);
      }
    }
  }

  // ── Sarah auto-dispatch ──
  if (member.name === 'Sarah' && /\b(assign|assigned|sprint|pick up|breakdown)\b/i.test(response)) {
    const agentNames = ['James', 'Elena', 'Kai', 'Omar', 'Priya'];
    const assignedAgents = agentNames
      .filter((name) => {
        const regex = new RegExp(
          `\\b${name}\\b.*(?:task|build|create|write|finish|close|pick up|test|deploy)`,
          'i',
        );
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
              'auto-dispatch',
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
  const setMatch = text.match(
    /\b(?:set|schedule|create)\s+(?:a\s+)?standup\s+(?:at|for|@)\s+([0-9apm:]+)/i,
  );
  if (setMatch) {
    const parsed = parseTimeStr(setMatch[1]);
    if (!parsed) {
      await postAs(
        client,
        { name: 'Anton' },
        channelId,
        ts,
        `Couldn't parse that time. Try "set standup at 9am" or "set standup at 14:30".`,
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
      `Standup set for ${formatTime(hours, minutes)} daily. Riley will DM you.`,
    );
    return true;
  }

  // "cancel standup"
  if (/\bcancel\s+standup\b/i.test(text)) {
    const cancelled = cancelJob('daily-standup');
    await postAs(
      client,
      { name: 'Anton' },
      channelId,
      ts,
      cancelled ? 'Standup cancelled.' : 'No standup scheduled.',
    );
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
      standup ? `Standup is at ${standup.time} daily.` : 'No standup scheduled.',
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
      'scheduled-standup',
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
        'nightly-consolidation',
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
      'daily-intel',
    );
    if (intel) {
      await postAs(
        slackApp.client,
        TEAM.riley,
        dm,
        undefined,
        `*Daily Intel — ${new Date().toLocaleDateString()}*\n\n${intel}`,
      );
      appendSharedMemory('Riley', `[DAILY-INTEL] ${intel.slice(0, 800)}`);
      appendDailyNote(`Riley DAILY-INTEL: ${intel.slice(0, 300)}`);
    }
  } catch (e) {
    console.error('[Consolidation] Daily Intel failed:', e.message);
  }
}

// ─── Main message handler ────────────────────────────────────
async function handle(text, channelId, channelName, ts, userId, client) {
  try {
    await client.reactions.add({ channel: channelId, timestamp: ts, name: 'eyes' });
  } catch {}

  // ── Security: only process messages from Noel or bots ──
  // (bots = other Anton agents posting via postAs)
  // userId 'unknown' is allowed for backwards compat with older Bolt paths
  if (NOEL_USER_ID && userId !== NOEL_USER_ID && userId !== 'unknown') {
    // Allow messages from any channel handler — the Bolt app.message filter
    // already blocks bot_id messages, so this catches only non-Noel humans
    console.log(`[Anton] Ignoring message from non-Noel user: ${userId}`);
    return;
  }

  // ── 0. System commands (analytics, admin, orchestrator) ──

  if (
    /\b(kill all|shut(ting)?\s*down|go (to )?sleep|goodnight|stop everything|shutdown)\b/i.test(
      text,
    )
  ) {
    await postAs(client, { name: 'Anton' }, channelId, ts, `Shutting down. Goodnight.`);
    try {
      await client.reactions.add({ channel: channelId, timestamp: ts, name: 'white_check_mark' });
    } catch {}
    setTimeout(() => process.exit(0), 2000);
    return;
  }

  if (
    /\b(restart|reboot|wake up|come back)\b/i.test(text) &&
    !/\b(the|a|this)\s+(server|app|service|backend)\b/i.test(text)
  ) {
    await postAs(client, { name: 'Anton' }, channelId, ts, `Restarting...`);
    try {
      writeFileSync(join(DATA_DIR, 'sessions.json'), '{}');
    } catch {}
    setTimeout(() => process.exit(0), 2000);
    return;
  }

  if (
    /\b(analytics|daily report|agent stats|token usage|how efficient|agent performance)\b/i.test(
      text,
    ) &&
    !/\b(build|create|fix|implement)\b/i.test(text)
  ) {
    await postAs(client, { name: 'Anton' }, channelId, ts, getReport());
    try {
      await client.reactions.add({ channel: channelId, timestamp: ts, name: 'white_check_mark' });
    } catch {}
    return;
  }

  if (
    /\b(board|sprint board|task board|sprint status|what.?s the board|show board)\b/i.test(text)
  ) {
    await postAs(client, { name: 'Anton' }, channelId, ts, getBoardReport());
    try {
      await client.reactions.add({ channel: channelId, timestamp: ts, name: 'white_check_mark' });
    } catch {}
    return;
  }

  const createChannelMatch = text.match(
    /create\s+(?:a\s+)?(?:new\s+)?(?:slack\s+)?channel\s+(?:called|named)?\s*#?(\S+)/i,
  );
  if (createChannelMatch) {
    const newName = createChannelMatch[1].toLowerCase().replace(/^#/, '');
    try {
      const result = await client.conversations.create({ name: newName, is_private: false });
      if (result.ok) {
        const newId = result.channel.id;
        try {
          await client.conversations.invite({ channel: newId, users: userId });
        } catch {}
        await postAs(
          client,
          { name: 'Anton' },
          channelId,
          ts,
          `Created #${newName} and invited you.`,
        );
        idToName.set(newId, newName);
        nameToId.set(newName, newId);
      }
    } catch (e) {
      const err = e.data?.error || e.message;
      await postAs(
        client,
        { name: 'Anton' },
        channelId,
        ts,
        err === 'name_taken' ? `#${newName} already exists.` : `Couldn't create: ${err}`,
      );
    }
    try {
      await client.reactions.add({ channel: channelId, timestamp: ts, name: 'white_check_mark' });
    } catch {}
    return;
  }

  // ── Schedule commands (before orchestrator so "set standup" doesn't hit orchestrator) ──
  if (await handleScheduleCommand(text, channelId, ts, client)) {
    try {
      await client.reactions.add({ channel: channelId, timestamp: ts, name: 'white_check_mark' });
    } catch {}
    return;
  }

  // ── Orchestrator commands (start team, run sprint, status, stop) ──
  const cmd = detectCommand(text);
  if (cmd) {
    if (cmd.type === 'start') return startTeam(cmd.dept, channelId, ts, client);
    if (cmd.type === 'sprint') return runSprint(channelId, ts, userId, client);
    if (cmd.type === 'status') return teamStatus(channelId, ts, client);
    if (cmd.type === 'stop') return stopTeam(cmd.dept, channelId, ts, client);
  }

  // ── 1. Intent classification ──
  const intent = classifyIntent(text);

  // Status queries → always go to Riley (cross-dept visibility)
  if (intent === 'status_query') {
    const h = await postTyping(client, TEAM.riley, channelId, ts);
    try {
      const r = await trackedAsk(TEAM.riley, text, 'status-query');
      await replaceTyping(client, TEAM.riley, h, r || 'checking...');
    } catch (e) {
      await replaceTyping(client, TEAM.riley, h, 'trouble pulling status right now, try again');
    }
    try {
      await client.reactions.add({ channel: channelId, timestamp: ts, name: 'white_check_mark' });
    } catch {}
    return;
  }

  // DMs → Anton handles everything unless explicitly addressed to a specific agent.
  // Anton is Noel's PA — all DMs are conversations with Anton.
  // If Noel says "Marcus, review this" in DM, it routes to Marcus.
  // If Noel says "what's going on" — Anton answers directly.
  if (channelName === 'dm') {
    // Check if explicitly addressed to a specific agent (e.g. "Marcus, do X")
    const directAddress = Object.values(TEAM).find(m =>
      new RegExp(`^(?:hey\\s+)?${m.name}[,!:\\s]`, 'i').test(text)
    );
    if (directAddress) {
      // Explicitly addressed — route to that agent, not Anton
      console.log(`[Anton] DM explicitly addressed to ${directAddress.name}`);
    } else {
      // Everything else in DMs → Anton
      const h = await postTyping(client, { name: 'Anton' }, channelId, ts);
      const r = await askAnton(text, "Let me think about that.");
      await replaceTyping(client, { name: 'Anton' }, h, r);
      try {
        await client.reactions.add({ channel: channelId, timestamp: ts, name: 'white_check_mark' });
      } catch {}

      // Process native SendMessage handoffs from Anton
      if (r) {
        await handleAgentAction(ANTON_AGENT, r, channelId, ts, client, 0);

        // Anton PA delegation — if Anton mentions agent names with delegation intent,
        // dispatch to them with FULL CONTEXT (Noel's request + Anton's strategy).
        // This creates a real conversation: Noel → Anton (strategy) → Marcus (architecture).
        const delegationSignal = /\b(routing to|pulling in|asking|let me get|getting|cc'ing|bringing in|looping in)\b/i;
        if (delegationSignal.test(r)) {
          for (const teamMember of Object.values(TEAM)) {
            const nameMatch = new RegExp(`\\b${teamMember.name}\\b`, 'i').exec(r);
            if (!nameMatch) continue;

            // Rate limit
            const dk = `Anton→${teamMember.name}`;
            if (recentDispatches.has(dk) && Date.now() - recentDispatches.get(dk) < 60_000) continue;
            recentDispatches.set(dk, Date.now());

            console.log(`[Anton] PA delegation: Anton → ${teamMember.name}`);
            const handle_ = await postTyping(client, teamMember, channelId, ts);

            // Give the agent FULL context: what Noel asked + what Anton said
            const contextPrompt = [
              `Noel asked Anton: "${text.slice(0, 500)}"`,
              ``,
              `Anton responded with this strategy/direction:`,
              `"${r.slice(0, 1000)}"`,
              ``,
              `Anton is pulling you in for your expertise. Respond to Noel through this thread.`,
              `Build on Anton's strategy — add your domain-specific perspective.`,
              `If you need input from another team member, use SendMessage to reach them.`,
            ].join('\n');

            try {
              const agentResponse = await trackedAsk(teamMember, contextPrompt, 'anton-delegation');
              await replaceTyping(client, teamMember, handle_, agentResponse || 'looking into it');
              // Process any further handoffs from this agent (e.g. Marcus → James)
              if (agentResponse) {
                await handleAgentAction(teamMember, agentResponse, channelId, ts, client, 1);
                const nativeHandoffs = consumeHandoffs(teamMember.name);
                for (const { target, message: hMsg } of nativeHandoffs) {
                  const permitted = HANDOFF_RULES[teamMember.name] || [];
                  if (!permitted.includes(target.name)) continue;
                  const hdk = `${teamMember.name}→${target.name}`;
                  if (recentDispatches.has(hdk) && Date.now() - recentDispatches.get(hdk) < 60_000) continue;
                  if (!canDispatch(channelId)) continue;
                  recentDispatches.set(hdk, Date.now());
                  console.log(`[Anton] Chain: ${teamMember.name} → ${target.name}`);
                  const h2 = await postTyping(client, target, channelId, ts);
                  trackedAsk(target, hMsg, 'chain-handoff')
                    .then(resp => replaceTyping(client, target, h2, resp || 'on it'))
                    .catch(e => console.error(`[Anton] Chain to ${target.name} failed:`, e.message?.slice(0, 80)));
                }
              }
            } catch (e) {
              await replaceTyping(client, teamMember, handle_, 'hit a snag, try again?');
              console.error(`[Anton] PA delegation to ${teamMember.name} failed:`, e.message?.slice(0, 100));
            }
          }
        }
      }
      return;
    }
  }

  // ── 2. Everyone ──
  if (isEveryoneRequest(text)) {
    return handleEveryone(text, channelId, channelName, ts, client);
  }

  // ── 3. Collaboration ──
  const collab = detectCollaboration(text);
  if (collab) {
    return handleCollab(collab, channelId, ts, client);
  }

  // ── 4. Single agent routing ──
  const member = route(text, channelName);

  // Ambiguous (multiple names, no direct address) → ask Noel to clarify
  if (!member) {
    const mentioned = Object.values(TEAM)
      .filter((m) => new RegExp(`\\b${m.name}\\b`, 'i').test(text))
      .map((m) => m.name);
    const names = mentioned.join(' or ');
    await postAs(
      client,
      { name: 'Anton' },
      channelId,
      ts,
      `Who do you want — ${names}? Address them directly.`,
    );
    try {
      await client.reactions.add({ channel: channelId, timestamp: ts, name: 'white_check_mark' });
    } catch {}
    return;
  }

  // Rate limit check for the full dispatch
  if (!canDispatch(channelId)) {
    await postAs(
      client,
      { name: 'Anton' },
      channelId,
      ts,
      `Too many requests right now. Wait a moment.`,
    );
    return;
  }

  console.log(`[Anton] Routed "${text.slice(0, 40)}..." → ${member.name} (${member.title})`);
  const handle_ = await postTyping(client, member, channelId, ts);

  try {
    const response = await trackedAsk(member, text, channelName);

    // NO_REPLY: agent opted out — remove typing indicator, silent ack
    if (response && NO_REPLY_RE.test(response.trim())) {
      await replaceTyping(client, member, handle_, null);
      console.log(`[Anton] ${member.name} → NO_REPLY`);
      try {
        await client.reactions.add({ channel: channelId, timestamp: ts, name: 'eyes' });
      } catch {}
      return;
    }

    await replaceTyping(
      client,
      member,
      handle_,
      response || 'sorry, having trouble — try again or ask Marcus',
    );
    if (response) {
      try {
        await client.reactions.add({ channel: channelId, timestamp: ts, name: 'white_check_mark' });
      } catch {}
      await handleAgentAction(member, response, channelId, ts, client, 0);

      // Process native SendMessage handoffs the agent queued via the tool
      // (goes through the same allowlist + cooldown path as text-parse handoffs)
      const nativeHandoffs = consumeHandoffs(member.name);
      for (const { target, message: hMsg } of nativeHandoffs) {
        const permitted = HANDOFF_RULES[member.name] || [];
        if (!permitted.includes(target.name)) {
          console.log(`[Anton] Blocked native handoff: ${member.name} → ${target.name} (not in allowlist)`);
          continue;
        }
        const dispatchKey = `${member.name}→${target.name}`;
        if (recentDispatches.has(dispatchKey) && Date.now() - recentDispatches.get(dispatchKey) < 60_000) {
          console.log(`[Anton] Cooldown active (native): ${dispatchKey}`);
          continue;
        }
        if (!canDispatch(channelId)) continue;
        recentDispatches.set(dispatchKey, Date.now());
        console.log(`[Anton] Native SendMessage: ${member.name} → ${target.name}`);
        const h = await postTyping(client, target, channelId, ts);
        trackedAsk(target, hMsg, 'sendmessage-handoff')
          .then(r => replaceTyping(client, target, h, r || 'got it'))
          .catch(e => console.error(`[Anton] Native handoff to ${target.name} failed:`, e.message?.slice(0, 100)));
      }
    }
  } catch (e) {
    console.error(`[Anton] ${member.name} error:`, e.message?.slice(0, 200));
    await replaceTyping(client, member, handle_, 'hit a snag, try again?');
  }
}

// ─── Slack App ───────────────────────────────────────────────
const slackApp = new App({
  token: BOT_TOKEN,
  appToken: APP_TOKEN,
  socketMode: true,
  logLevel: 'WARN',
});

// Channel messages in #anton-* channels
slackApp.message(async ({ message, client }) => {
  if ('bot_id' in message) return;
  if ('subtype' in message && message.subtype !== 'file_share') return;
  if (!('channel' in message)) return;
  const channelName = idToName.get(message.channel);
  if (!channelName) return;

  const hasFiles = message.files?.length > 0;
  const text = (message.text ?? '').trim();

  if (hasFiles) {
    const imageFiles = (message.files || []).filter(
      (f) => f.mimetype?.startsWith('image/') && f.url_private,
    );
    const imageContext = imageFiles.length
      ? await describeImages(imageFiles, BOT_TOKEN, text)
      : '';

    if (!text && !imageContext) {
      await postAs(
        client,
        { name: 'Anton' },
        message.channel,
        message.ts,
        `Couldn't process that image. Try describing what you see or paste the text directly.`,
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
slackApp.message(async ({ message, client }) => {
  if ('bot_id' in message) return;
  if ('subtype' in message && message.subtype !== 'file_share') return;
  if (!('channel' in message)) return;
  if (idToName.has(message.channel)) return; // already handled above

  const hasFiles = message.files?.length > 0;
  const rawText = (message.text ?? '').trim();

  let finalText = rawText;
  if (hasFiles) {
    const imageFiles = (message.files || []).filter(
      (f) => f.mimetype?.startsWith('image/') && f.url_private,
    );
    const imageContext = imageFiles.length
      ? await describeImages(imageFiles, BOT_TOKEN, rawText)
      : '';
    finalText = (rawText || 'User sent an image:') + (imageContext ? `\n\n${imageContext}` : '');

    if (!finalText.trim()) {
      await postAs(
        client,
        { name: 'Anton' },
        message.channel,
        message.ts,
        `Couldn't process that image. Try describing what you see.`,
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
            `Approved. Telling ${pending.member.name} to proceed.${queue.length > 0 ? ` (${queue.length} more pending above)` : ''}`,
          );
          const h = await postTyping(client, pending.member, pending.channelId, pending.ts);
          const result = await trackedAsk(
            pending.member,
            `Noel approved your ${pending.actionType} request: "${pending.summary}". ` +
              `Please execute it now. Original draft:\n${pending.fullDraft.slice(0, 1000)}`,
            'approval-approved',
          );
          await replaceTyping(client, pending.member, h, result || 'executing...');
        } else {
          await postAs(
            client,
            { name: 'Anton' },
            message.channel,
            message.ts,
            `Denied. Notifying ${pending.member.name}.${queue.length > 0 ? ` (${queue.length} more pending above)` : ''}`,
          );
          const h = await postTyping(client, pending.member, pending.channelId, pending.ts);
          const r = await trackedAsk(
            pending.member,
            `Noel denied your ${pending.actionType} request: "${pending.summary}". Do not proceed. Stand by.`,
            'approval-denied',
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
slackApp.event('app_mention', async ({ event, client }) => {
  const text = (event.text ?? '').replace(/<@[^>]+>/g, '').trim();
  if (!text) return;
  const channelName = idToName.get(event.channel) ?? 'unknown';
  await handle(text, event.channel, channelName, event.ts, event.user, client);
});

// ─── Start ───────────────────────────────────────────────────
console.log(`[Anton] Starting...`);
console.log(`[Anton] Channels: ${idToName.size} | Team: ${Object.keys(TEAM).length}`);

slackApp
  .start()
  .then(async () => {
    console.log('');
    console.log('  Anton is online.');
    console.log(`  ${idToName.size} channels | ${Object.keys(TEAM).length} team members`);
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

    // Anton startup identity — post to standup channel (skip on --watch restarts)
    const standupChannel = nameToId.get('anton-standup');
    const startupFile = join(DATA_DIR, '.last-startup');
    const lastStartup = (() => { try { return parseInt(readFileSync(startupFile, 'utf-8'), 10); } catch { return 0; } })();
    const now = Date.now();
    if (standupChannel && now - lastStartup > 120_000) { // suppress if restarted within 2 min
      try {
        writeFileSync(startupFile, String(now));
        await postAs(
          slackApp.client,
          { name: 'Anton' },
          standupChannel,
          undefined,
          `Online. ${Object.keys(TEAM).length} agents ready. Type a name to reach anyone, or ask me directly.`,
        );
      } catch {}
    } else {
      try { writeFileSync(startupFile, String(now)); } catch {}
    }
  })
  .catch((err) => {
    console.error('[Anton] FAILED:', err.message);
    process.exit(1);
  });

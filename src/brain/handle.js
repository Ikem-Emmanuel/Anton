/**
 * handle.js — Core Anton message-handling business logic.
 *
 * Extracted from index.js so it can be unit-tested without a live Slack
 * connection. All Slack I/O and external dependencies are injected via
 * `createHandler(deps)`.
 *
 * Exports:
 *   classifyIntent(text) → 'personal' | 'status_query' | 'system_command' | 'approval_response' | 'task' | 'general'
 *   createHandler(deps) → handle(text, channelId, channelName, ts, userId)
 */

import { channelToDept, detectCollaboration, isEveryoneRequest, route } from '../nervous/router.js';
import { findByName, getDeptMembers, HANDOFF_RULES, TEAM } from './team.js';

// ─── Intent classification ────────────────────────────────────
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

export function classifyIntent(text) {
  for (const { type, pattern } of INTENT_PATTERNS) {
    if (pattern.test(text)) return type;
  }
  return 'general';
}

// ─── NO_REPLY sentinel ────────────────────────────────────────
const NO_REPLY_RE = /^NO_REPLY\b/i;

// ─── Handler factory ─────────────────────────────────────────
/**
 * deps = {
 *   ask(member, message, source?) → Promise<string|null>
 *   postAs(client, persona, channelId, ts, text) → Promise
 *   postTyping(client, member, channelId, ts) → Promise<handle>
 *   replaceTyping(client, member, handle, text) → Promise
 *   openDM(client, userId) → Promise<channelId>
 *   logMessage(name, msg, src) / logResponse / logError / logHandoff
 *   trackRequest(name, start, ok, len)
 *   scheduleJob(id, h, m, fn) / cancelJob / listJobs / parseTimeStr / formatTime
 *   detectCommand(text) / startTeam / runSprint / teamStatus / stopTeam
 *   getBoardReport() / getReport()
 *   NOEL_USER_ID: string
 *   slackAppClient: Slack client for scheduled events (may differ from message client)
 *   addReaction(client, channelId, ts, name) → Promise
 * }
 */
export function createHandler(deps) {
  const {
    ask,
    postAs,
    postTyping,
    replaceTyping,
    openDM,
    logMessage,
    logResponse,
    logError,
    logHandoff,
    trackRequest,
    scheduleJob,
    cancelJob,
    listJobs,
    parseTimeStr,
    formatTime,
    detectCommand,
    startTeam,
    runSprint,
    teamStatus,
    stopTeam,
    getBoardReport,
    getReport,
    NOEL_USER_ID,
    addReaction,
    runScheduledStandup,
  } = deps;

  // Per-handler mutable state (isolated per createHandler call — safe for tests)
  const recentDispatches = new Map();
  const channelCallCount = new Map();
  const pendingApprovals = new Map();

  // ── Rate limiting ──
  function canDispatch(channelId) {
    const now = Date.now();
    const entry = channelCallCount.get(channelId) || { count: 0, resetAt: now + 60_000 };
    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + 60_000;
    }
    if (entry.count >= 5) return false;
    entry.count++;
    channelCallCount.set(channelId, entry);
    return true;
  }

  // ── Tracked ask ──
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

  // Anton has no team entry; borrow Riley's tool list since Riley is the cross-dept coordinator
  // and matches Anton's access needs. When Anton gets his own persona entry this can point there.
  const ANTON_AGENT = { name: 'Anton', agent: 'anton', tools: TEAM.riley?.tools || [] };
  async function askAnton(prompt, fallback = '') {
    try {
      const result = await ask(ANTON_AGENT, prompt);
      return result || fallback;
    } catch {
      return fallback;
    }
  }

  // ── Approval gate ──
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
      const entry = { member, actionType, summary, fullDraft, channelId, ts };
      const queue = pendingApprovals.get(dm) || [];
      queue.push(entry);
      pendingApprovals.set(dm, queue);
      if (queue.length === 1) {
        await postApprovalDM(client, dm, entry, queue.length);
      }
      // 15-min auto-deny
      setTimeout(
        () => {
          const current = pendingApprovals.get(dm) || [];
          const idx = current.indexOf(entry);
          if (idx === -1) return;
          current.splice(idx, 1);
          if (current.length === 0) {
            pendingApprovals.delete(dm);
          } else {
            pendingApprovals.set(dm, current);
            if (idx === 0) postApprovalDM(client, dm, current[0], current.length).catch(() => {});
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

  // ── Process approval response (from Noel's DM) ──
  async function processApprovalResponse(text, dmChannelId, client) {
    const queue = pendingApprovals.get(dmChannelId);
    if (!queue?.length) return false;

    const approved = /^(yes|y|ok|approve|go|approved|do it)\b/i.test(text);
    const denied = /^(no|n|deny|denied|reject|stop|cancel|don.?t)\b/i.test(text);
    if (!approved && !denied) return false;

    const pending = queue.shift();
    if (queue.length === 0) {
      pendingApprovals.delete(dmChannelId);
    } else {
      pendingApprovals.set(dmChannelId, queue);
      postApprovalDM(client, dmChannelId, queue[0], queue.length).catch(() => {});
    }

    if (approved) {
      await postAs(
        client,
        { name: 'Anton' },
        dmChannelId,
        undefined,
        `Approved. Telling ${pending.member.name} to proceed.`
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
      await postAs(client, { name: 'Anton' }, dmChannelId, undefined, `Denied. Notifying ${pending.member.name}.`);
      const h = await postTyping(client, pending.member, pending.channelId, pending.ts);
      const r = await trackedAsk(
        pending.member,
        `Noel denied your ${pending.actionType} request: "${pending.summary}". Do not proceed. Stand by.`,
        'approval-denied'
      );
      await replaceTyping(client, pending.member, h, r || 'understood, standing by');
    }
    return true;
  }

  // ── Everyone handler ──
  async function handleEveryone(text, channelId, channelName, ts, client) {
    const dept = channelToDept(channelName);
    const members = getDeptMembers(dept);
    for (const member of members) {
      try {
        const handle_ = await postTyping(client, member, channelId, ts);
        const response = await trackedAsk(
          member,
          `Team was asked: "${text}". Give YOUR short personal response. 2-3 sentences. Be yourself.`
        );
        if (response && NO_REPLY_RE.test(response.trim())) {
          await replaceTyping(client, member, handle_, null);
          continue;
        }
        await replaceTyping(client, member, handle_, response || 'pass on this one');
      } catch (e) {
        console.error(`[Anton] ${member.name} group fail:`, e.message?.slice(0, 100));
      }
    }
    try {
      await addReaction(client, channelId, ts, 'white_check_mark');
    } catch {}
  }

  // ── Collaboration handler ──
  async function handleCollab(collab, channelId, ts, client) {
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
      await addReaction(client, channelId, ts, 'white_check_mark');
    } catch {}
  }

  // ── Agent action handler (cascade-safe) ──
  async function handleAgentAction(member, response, channelId, ts, client, depth = 0) {
    if (depth >= 2) return;

    // Approval gate — only check last 200 chars (injection prevention)
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
      return;
    }

    // Text-parse handoffs (safety-net)
    const hasActionContext =
      /\b(fix|bug|review|test|PTAL|pick up|handle|assign|merge|deploy|check|re-?test|ping me|ready for)\b/i.test(
        response
      );
    const alreadyDispatched = new Set();

    if (hasActionContext) {
      const negativePatterns = /(?:won't|don't|can't|not|until|before|without)\s+(?:\w+\s+){0,3}/gi;
      const negativeZones = [];
      for (const neg of response.matchAll(negativePatterns)) {
        negativeZones.push({ start: neg.index, end: neg.index + neg[0].length + 20 });
      }

      for (const teamMember of Object.values(TEAM)) {
        if (teamMember.name === member.name) continue;
        const nameMatch = new RegExp(`\\b${teamMember.name}\\b`, 'i').exec(response);
        if (!nameMatch) continue;
        const namePos = nameMatch.index;
        const isNegative = negativeZones.some((z) => namePos >= z.start && namePos <= z.end);
        if (isNegative) continue;

        const permitted = HANDOFF_RULES[member.name] || [];
        if (!permitted.includes(teamMember.name)) continue;

        const dispatchKey = `${member.name}→${teamMember.name}`;
        const lastDispatch = recentDispatches.get(dispatchKey);
        if (lastDispatch && Date.now() - lastDispatch < 60_000) continue;
        if (!canDispatch(channelId)) continue;

        if (!alreadyDispatched.has(teamMember.name)) {
          alreadyDispatched.add(teamMember.name);
          recentDispatches.set(dispatchKey, Date.now());
          logHandoff(member.name, teamMember.name, response.slice(0, 200));

          const target = teamMember;
          const delay = alreadyDispatched.size * 5000;
          setTimeout(async () => {
            try {
              const h = await postTyping(client, target, channelId, ts);
              const followUp = await trackedAsk(
                target,
                `${member.name} (${member.title}) just said this, and it's directed at you:\n\n"${response.slice(0, 1200)}"\n\nPick up what they're asking you to do. Respond naturally.`,
                'auto-handoff'
              );
              await replaceTyping(client, target, h, followUp || 'got it, looking at it now');
              if (followUp) await handleAgentAction(target, followUp, channelId, ts, client, depth + 1);
            } catch (e) {
              console.error(`[Anton] Handoff to ${target.name} failed:`, e.message?.slice(0, 100));
            }
          }, delay);
        }
      }
    }
  }

  // ── Schedule commands ──
  async function handleScheduleCommand(text, channelId, ts, client) {
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
      scheduleJob('daily-standup', hours, minutes, runScheduledStandup || (() => {}));
      await postAs(
        client,
        { name: 'Anton' },
        channelId,
        ts,
        `Standup set for ${formatTime(hours, minutes)} daily. Riley will DM you.`
      );
      return true;
    }

    if (/\bcancel\s+standup\b/i.test(text)) {
      const cancelled = cancelJob('daily-standup');
      await postAs(
        client,
        { name: 'Anton' },
        channelId,
        ts,
        cancelled ? 'Standup cancelled.' : 'No standup scheduled.'
      );
      return true;
    }

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

  // ── Main handle function ──
  async function handle(text, channelId, channelName, ts, userId, client) {
    try {
      await addReaction(client, channelId, ts, 'eyes');
    } catch {}

    // Security: only process messages from Noel or bots
    if (NOEL_USER_ID && userId !== NOEL_USER_ID && userId !== 'unknown') {
      console.log(`[Anton] Ignoring message from non-Noel user: ${userId}`);
      return;
    }

    // ── 0. System shutdown/restart ──
    if (/\b(kill all|shut(ting)?\s*down|go (to )?sleep|goodnight|stop everything|shutdown)\b/i.test(text)) {
      await postAs(client, { name: 'Anton' }, channelId, ts, `Shutting down. Goodnight.`);
      try {
        await addReaction(client, channelId, ts, 'white_check_mark');
      } catch {}
      return { action: 'shutdown' };
    }

    if (
      /\b(restart|reboot|wake up|come back)\b/i.test(text) &&
      !/\b(the|a|this)\s+(server|app|service|backend)\b/i.test(text)
    ) {
      await postAs(client, { name: 'Anton' }, channelId, ts, `Restarting...`);
      return { action: 'restart' };
    }

    // ── Analytics ──
    if (
      /\b(analytics|daily report|agent stats|token usage|how efficient|agent performance)\b/i.test(text) &&
      !/\b(build|create|fix|implement)\b/i.test(text)
    ) {
      await postAs(client, { name: 'Anton' }, channelId, ts, getReport());
      try {
        await addReaction(client, channelId, ts, 'white_check_mark');
      } catch {}
      return;
    }

    // ── Board ──
    if (/\b(board|sprint board|task board|show board)\b/i.test(text)) {
      await postAs(client, { name: 'Anton' }, channelId, ts, getBoardReport());
      try {
        await addReaction(client, channelId, ts, 'white_check_mark');
      } catch {}
      return;
    }

    // ── Schedule commands ──
    if (await handleScheduleCommand(text, channelId, ts, client)) {
      try {
        await addReaction(client, channelId, ts, 'white_check_mark');
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

    // ── 1. Intent classification ──
    const intent = classifyIntent(text);

    // Status queries → Riley
    if (intent === 'status_query') {
      const h = await postTyping(client, TEAM.riley, channelId, ts);
      try {
        const r = await trackedAsk(TEAM.riley, text, 'status-query');
        await replaceTyping(client, TEAM.riley, h, r || 'checking...');
      } catch {
        await replaceTyping(client, TEAM.riley, h, 'trouble pulling status right now, try again');
      }
      try {
        await addReaction(client, channelId, ts, 'white_check_mark');
      } catch {}
      return;
    }

    // Personal/strategic in DM → Anton handles directly
    if (intent === 'personal' && channelName === 'dm') {
      const h = await postTyping(client, { name: 'Anton' }, channelId, ts);
      const r = await askAnton(text, 'Let me think about that.');
      await replaceTyping(client, { name: 'Anton' }, h, r);
      try {
        await addReaction(client, channelId, ts, 'white_check_mark');
      } catch {}
      return;
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

    // Ambiguous → clarify
    if (!member) {
      const mentioned = Object.values(TEAM)
        .filter((m) => new RegExp(`\\b${m.name}\\b`, 'i').test(text))
        .map((m) => m.name);
      const names = mentioned.join(' or ');
      await postAs(client, { name: 'Anton' }, channelId, ts, `Who do you want — ${names}? Address them directly.`);
      try {
        await addReaction(client, channelId, ts, 'white_check_mark');
      } catch {}
      return;
    }

    // Rate limit
    if (!canDispatch(channelId)) {
      await postAs(client, { name: 'Anton' }, channelId, ts, `Too many requests right now. Wait a moment.`);
      return;
    }

    const handle_ = await postTyping(client, member, channelId, ts);
    try {
      const response = await trackedAsk(member, text, channelName);

      if (response && NO_REPLY_RE.test(response.trim())) {
        await replaceTyping(client, member, handle_, null);
        try {
          await addReaction(client, channelId, ts, 'eyes');
        } catch {}
        return;
      }

      await replaceTyping(client, member, handle_, response || 'sorry, having trouble — try again or ask Marcus');
      if (response) {
        try {
          await addReaction(client, channelId, ts, 'white_check_mark');
        } catch {}
        await handleAgentAction(member, response, channelId, ts, client, 0);
      }
    } catch (e) {
      console.error(`[Anton] ${member.name} error:`, e.message?.slice(0, 200));
      await replaceTyping(client, member, handle_, 'hit a snag, try again?');
    }
  }

  // ── DM handler (checks approval responses before routing normally) ──
  async function handleDM(text, dmChannelId, ts, userId, client) {
    if (!text) return;

    // Approval response: must be from Noel
    if (NOEL_USER_ID && userId === NOEL_USER_ID) {
      const handled = await processApprovalResponse(text, dmChannelId, client);
      if (handled) return;
    }

    // Route normally — DMs are treated as 'dm' channel
    return handle(text, dmChannelId, 'dm', ts, userId, client);
  }

  // Expose pendingApprovals for testing
  return {
    handle,
    handleDM,
    handleAgentAction,
    handleApprovalRequest,
    processApprovalResponse,
    classifyIntent,
    canDispatch,
    _pendingApprovals: pendingApprovals,
    _recentDispatches: recentDispatches,
  };
}

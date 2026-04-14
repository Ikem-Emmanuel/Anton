// ---- Morning Briefing ----------------------------------------------------
// Proactive daily push to Noel. Fires at a configured time (default 8:30 AM).
// Assembles: system health, git state, P3 buffer, overnight activity.
//
// Usage:
//   import { initBriefing, runBriefing, shutdownBriefing } from './briefing.js';
//   initBriefing({ scheduleJob, getHealthSnapshot, checkGitState, consumeBriefingBuffer, notifyNoel, antonRoot, dataDir });

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

let _deps = null;
let _briefingHour = 8;
let _briefingMinute = 30;

export function initBriefing(deps, { hour, minute } = {}) {
  _deps = deps;
  _briefingHour = hour ?? 8;
  _briefingMinute = minute ?? 30;

  // Register with the scheduler
  if (deps.scheduleJob) {
    deps.scheduleJob('morning-briefing', _briefingHour, _briefingMinute, () => runBriefing());
    console.log(
      `[Briefing] Scheduled at ${String(_briefingHour).padStart(2, '0')}:${String(_briefingMinute).padStart(2, '0')}`
    );
  }
}

export async function runBriefing() {
  if (!_deps) {
    console.warn('[Briefing] Not initialized');
    return null;
  }

  const sections = [];
  const now = new Date();
  sections.push(
    `*Morning Briefing* -- ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`
  );

  // 1. System Health
  const health = _deps.getHealthSnapshot?.();
  if (health) {
    const cpuStatus =
      health.cpu > 85 ? ':red_circle:' : health.cpu > 70 ? ':large_yellow_circle:' : ':white_check_mark:';
    const memStatus =
      health.memUsed > 85 ? ':red_circle:' : health.memUsed > 70 ? ':large_yellow_circle:' : ':white_check_mark:';
    const diskStatus =
      health.diskUsed > 80 ? ':red_circle:' : health.diskUsed > 65 ? ':large_yellow_circle:' : ':white_check_mark:';

    let healthLine = `\n*System Health*\n${cpuStatus} CPU ${health.cpu}%  ${memStatus} MEM ${health.memUsed}%  ${diskStatus} DISK ${health.diskUsed}%`;
    if (health.batteryPercent !== null) {
      const batStatus = health.batteryPercent < 20 ? ':red_circle:' : ':white_check_mark:';
      healthLine += `  ${batStatus} BAT ${health.batteryPercent}%${health.batteryCharging ? '+' : ''}`;
    }
    sections.push(healthLine);
  }

  // 2. Git State
  if (_deps.checkGitState && _deps.antonRoot) {
    const git = await _deps.checkGitState(_deps.antonRoot);
    if (git) {
      const parts = [`Branch: \`${git.branch}\``];
      if (git.uncommitted > 0) parts.push(`${git.uncommitted} uncommitted`);
      if (git.ahead > 0) parts.push(`${git.ahead} ahead`);
      if (git.behind > 0) parts.push(`${git.behind} behind`);
      sections.push(`\n*Git*\n${parts.join(' | ')}`);
    }
  }

  // 3. P3 buffer (info items accumulated since last briefing)
  const p3Items = _deps.consumeBriefingBuffer?.() || [];
  if (p3Items.length > 0) {
    const lines = p3Items
      .slice(0, 10)
      .map((i) => `  ${i.message}`)
      .join('\n');
    sections.push(`\n*Info (${p3Items.length} item${p3Items.length > 1 ? 's' : ''})*\n${lines}`);
  }

  // 4. Overnight activity (check today's logs for agent activity)
  const overnightSummary = getOvernightActivity(_deps.dataDir);
  if (overnightSummary) {
    sections.push(`\n*Overnight Activity*\n${overnightSummary}`);
  }

  // 5. Today's schedule hint
  const dayOfWeek = now.getDay();
  if (dayOfWeek === 1) {
    sections.push('\n:calendar: Monday -- sprint planning day');
  } else if (dayOfWeek === 5) {
    sections.push('\n:calendar: Friday -- wrap up and retrospective');
  }

  const briefingText = sections.join('\n');

  // Send via notifyNoel P1 (direct DM, not batched)
  if (_deps.notifyNoel) {
    await _deps.notifyNoel('P1', briefingText, { cooldownKey: 'morning-briefing', force: true });
  }

  console.log(`[Briefing] Delivered (${sections.length} sections)`);
  return briefingText;
}

// Scan today's log files for agent activity count
function getOvernightActivity(dataDir) {
  if (!dataDir) return null;
  const logsDir = join(dataDir, 'logs');
  if (!existsSync(logsDir)) return null;

  const today = new Date().toISOString().split('T')[0];
  const agentActivity = {};

  try {
    const agentDirs = readdirSync(logsDir).filter((d) => {
      try {
        return readdirSync(join(logsDir, d)).length > 0;
      } catch {
        return false;
      }
    });

    for (const agentDir of agentDirs) {
      const logFile = join(logsDir, agentDir, `${today}.jsonl`);
      if (!existsSync(logFile)) continue;

      try {
        const content = readFileSync(logFile, 'utf-8');
        const lines = content.split('\n').filter(Boolean);
        if (lines.length > 0) {
          agentActivity[agentDir] = lines.length;
        }
      } catch {}
    }
  } catch {}

  const agents = Object.entries(agentActivity);
  if (agents.length === 0) return null;

  agents.sort((a, b) => b[1] - a[1]);
  const lines = agents.slice(0, 6).map(([name, count]) => `  ${name}: ${count} events`);
  return lines.join('\n');
}

export function setBriefingTime(hour, minute) {
  _briefingHour = hour;
  _briefingMinute = minute;
  if (_deps?.scheduleJob) {
    _deps.scheduleJob('morning-briefing', hour, minute, () => runBriefing());
    console.log(`[Briefing] Rescheduled to ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  }
}

export function shutdownBriefing() {
  // Scheduler handles cleanup
}

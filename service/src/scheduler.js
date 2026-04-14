// ─── Scheduler ───────────────────────────────────────────────
// Lightweight job scheduler — no external dependencies.
// Persists scheduled times to .anton/schedule.json so jobs
// survive service restarts.

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';

let scheduleFile;
const jobs = new Map(); // id → { hours, minutes, intervalId, fn }

export function init(antonRoot) {
  scheduleFile = join(antonRoot, 'schedule.json');
  console.log('[Scheduler] Ready');
}

function persist() {
  if (!scheduleFile) return;
  const data = {};
  for (const [id, job] of jobs) {
    data[id] = { hours: job.hours, minutes: job.minutes };
  }
  try {
    writeFileSync(scheduleFile, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('[Scheduler] Failed to persist:', e.message);
  }
}

// Schedule a job by wall-clock time (HH:MM daily).
// fn is called with try/catch so errors don't crash the service.
export function scheduleJob(id, hours, minutes, fn) {
  // Cancel existing if re-scheduling
  cancelJob(id, false);

  const wrappedFn = async () => {
    try {
      await fn();
    } catch (e) {
      console.error(`[Scheduler] Job '${id}' failed:`, e.message);
    }
  };

  // Check every 60 seconds
  const intervalId = setInterval(() => {
    const now = new Date();
    if (now.getHours() === hours && now.getMinutes() === minutes) {
      console.log(`[Scheduler] Firing job '${id}'`);
      wrappedFn();
    }
  }, 60_000);

  jobs.set(id, { hours, minutes, intervalId, fn });
  persist();
  console.log(`[Scheduler] Scheduled '${id}' at ${formatTime(hours, minutes)}`);
}

export function cancelJob(id, persistAfter = true) {
  const job = jobs.get(id);
  if (!job) return false;
  clearInterval(job.intervalId);
  jobs.delete(id);
  if (persistAfter) persist();
  console.log(`[Scheduler] Cancelled '${id}'`);
  return true;
}

export function listJobs() {
  return Array.from(jobs.entries()).map(([id, job]) => ({
    id,
    time: formatTime(job.hours, job.minutes),
  }));
}

// Load saved schedule times from disk (used on restart to re-register jobs).
// Returns { id: { hours, minutes } } — caller provides the fn to re-schedule.
export function loadPersistedTimes() {
  if (!scheduleFile || !existsSync(scheduleFile)) return {};
  try {
    return JSON.parse(readFileSync(scheduleFile, 'utf-8'));
  } catch {
    return {};
  }
}

// Parse "9am", "9:30am", "14:30", "14" → { hours, minutes } | null
export function parseTimeStr(str) {
  if (!str) return null;
  const s = str.trim().toLowerCase();

  // "9am", "9:30am", "2:15pm"
  const ampm = s.match(/^(\d{1,2})(?::(\d{2}))?([ap]m)$/);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2] || '0', 10);
    if (ampm[3] === 'pm' && h !== 12) h += 12;
    if (ampm[3] === 'am' && h === 12) h = 0;
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return { hours: h, minutes: m };
  }

  // "14:30" or "9:00"
  const hhmm = s.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    const h = parseInt(hhmm[1], 10);
    const m = parseInt(hhmm[2], 10);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return { hours: h, minutes: m };
  }

  // "14" → 14:00
  const hour = s.match(/^(\d{1,2})$/);
  if (hour) {
    const h = parseInt(hour[1], 10);
    if (h < 0 || h > 23) return null;
    return { hours: h, minutes: 0 };
  }

  return null;
}

export function formatTime(hours, minutes) {
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const m = String(minutes).padStart(2, '0');
  return `${h}:${m} ${period}`;
}

// ─── Inbox auto-processor ────────────────────────────────────
// Polls .anton/inbox/*.md every 30s and passes each file to handler(content, filename).
// Files are moved to .anton/inbox/processed/ before calling handler
// to prevent double-processing even if handler throws.
//
// Inbox file format (simple convention):
//   Any .md file dropped in .anton/inbox/ is treated as a command.
//   The caller (index.js handler) decides what to do with the content.
//
// Usage: initInboxProcessor(antonRoot, async (content, filename) => { ... })
export function initInboxProcessor(antonRoot, handler) {
  const inboxDir = join(antonRoot, 'inbox');
  const processedDir = join(inboxDir, 'processed');

  const poll = async () => {
    if (!existsSync(inboxDir)) return;

    let files;
    try {
      files = readdirSync(inboxDir).filter((f) => f.endsWith('.md'));
    } catch {
      return; // inbox dir not readable — skip silently
    }

    for (const file of files) {
      const src = join(inboxDir, file);
      let content;
      try {
        content = readFileSync(src, 'utf-8');
      } catch {
        continue; // file disappeared between readdir and read — skip
      }

      // Move before processing to prevent double-processing on restart
      try {
        if (!existsSync(processedDir)) mkdirSync(processedDir, { recursive: true });
        renameSync(src, join(processedDir, `${Date.now()}-${file}`));
      } catch (e) {
        console.error(`[Inbox] Could not move ${file} to processed:`, e.message);
        continue; // don't process if we can't move — would risk double-processing
      }

      try {
        await handler(content.trim(), file);
        console.log(`[Inbox] Processed: ${file}`);
      } catch (e) {
        console.error(`[Inbox] Handler failed for ${file}:`, e.message?.slice(0, 100));
      }
    }
  };

  // Run immediately on start, then every 30s
  poll();
  setInterval(poll, 30_000);
  console.log('[Inbox] Auto-processor started (30s interval)');
}

// ─── Nightly consolidation ───────────────────────────────────
// Schedules a nightly DREAMS.md / DAILY-INTEL run at 23:30.
// handler() is called with no arguments — caller provides the logic.
// Can be rescheduled via scheduleJob('nightly-consolidation', h, m, fn).
export function initNightlyConsolidation(handler) {
  scheduleJob('nightly-consolidation', 23, 30, async () => {
    console.log('[Consolidation] Starting nightly DREAMS.md run');
    try {
      await handler();
    } catch (e) {
      console.error('[Consolidation] Failed:', e.message);
    }
  });
  console.log('[Consolidation] Nightly consolidation scheduled at 11:30 PM');
}

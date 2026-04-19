// Proactive trigger loop (§4.3) — turns Anton from reactive to Jarvis-like.
//
// Three scheduled triggers land here. Each is a pure function taking a deps
// object so tests can swap in fakes without faking setInterval/time. The
// module owns the interval/schedule wiring; triggers themselves stay
// short and side-effect-free except for a single notifyNoel call.
//
//   - EOD summary         18:00 daily
//   - Event scan          every 15 minutes (looks at in-process event bus)
//   - Stalled-task surfacer   every 60 minutes (reads SQLite tasks)
//
// The 4h distillation batch from the TODO is not shipped here — inline
// distillation already fires per turn, and without a distilled_at column
// on conversations we'd either re-distill duplicates or need a schema
// change with ambiguous value. Added back when inline failures surface.

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Run the EOD summary trigger once. Pulls today's conversation/task deltas,
 * asks Riley (the cross-dept coordinator) to frame it, and notifies Noel.
 *
 * deps = {
 *   brainProcess(msg, {agent})  → {text}         (brain.process)
 *   notifyNoel(severity, msg)                    (heart/notify)
 * }
 */
export async function runEodSummary(deps) {
  const { brainProcess, notifyNoel } = deps;
  try {
    const res = await brainProcess(
      `EOD. Give me today's summary: what shipped across departments, what's still in flight, what slipped, what needs my attention tomorrow morning. Keep it tight — three short paragraphs or a scannable list.`,
      { agent: 'Riley' }
    );
    const text = res?.text?.trim() || '';
    if (!text) return { sent: false, reason: 'empty-brain-response' };
    await notifyNoel('P3', `*EOD* — ${text}`);
    return { sent: true, chars: text.length };
  } catch (e) {
    console.error('[Proactive/EOD] Failed:', e.message?.slice(0, 100));
    return { sent: false, reason: 'error', error: e.message };
  }
}

/**
 * Run the event scan trigger once. Reads the in-process event bus history
 * for the last `windowMs` milliseconds and notifies if the error rate
 * crosses a threshold. Does NOT call the brain — this is a cheap health
 * check, not a summarization.
 *
 * deps = {
 *   getEventHistory(limit)         → [{event, data, timestamp}, ...]
 *   notifyNoel(severity, msg)
 * }
 */
export function runEventScan(deps, options = {}) {
  const { getEventHistory, notifyNoel } = deps;
  const { windowMs = FIFTEEN_MINUTES_MS, errorThreshold = 3 } = options;
  try {
    const history = getEventHistory(200) || [];
    const cutoff = Date.now() - windowMs;
    const recentErrors = history.filter((e) => {
      if (!e.timestamp) return false;
      const t = typeof e.timestamp === 'string' ? Date.parse(e.timestamp) : e.timestamp;
      if (t < cutoff) return false;
      return typeof e.event === 'string' && /error|crash|fail|fatal/i.test(e.event);
    });
    if (recentErrors.length >= errorThreshold) {
      const sample = recentErrors
        .slice(0, 3)
        .map((e) => e.event)
        .join(', ');
      notifyNoel('P2', `*Event scan* — ${recentErrors.length} errors in last 15m (${sample})`);
      return { fired: true, count: recentErrors.length };
    }
    return { fired: false, count: recentErrors.length };
  } catch (e) {
    console.error('[Proactive/EventScan] Failed:', e.message?.slice(0, 100));
    return { fired: false, error: e.message };
  }
}

/**
 * Run the stalled-task surfacer. Reads SQLite for tasks in the `flight`
 * column whose `updated_at` is older than `hoursStale` hours. Notifies
 * Noel once per batch — not per task — so a stuck sprint doesn't spam.
 *
 * deps = {
 *   findStalledTasks(hoursStale, limit) → [TaskRow, ...]
 *   notifyNoel(severity, msg)
 * }
 */
export function runStalledTaskSurfacer(deps, options = {}) {
  const { findStalledTasks, notifyNoel } = deps;
  const { hoursStale = 24, limit = 5 } = options;
  try {
    const stalled = findStalledTasks(hoursStale, limit);
    if (!stalled || stalled.length === 0) return { fired: false, count: 0 };
    const lines = stalled.map((t) => `• ${t.owner} — ${t.title}`).join('\n');
    notifyNoel('P2', `*Stalled ${hoursStale}h+* (${stalled.length}):\n${lines}`);
    return { fired: true, count: stalled.length };
  } catch (e) {
    console.error('[Proactive/Stalled] Failed:', e.message?.slice(0, 100));
    return { fired: false, error: e.message };
  }
}

/**
 * Wire all proactive triggers to the scheduler and interval clocks. Returns
 * a teardown function for tests and graceful shutdown.
 *
 * deps carries everything the triggers need:
 *   scheduleJob(id, h, m, fn)    — wall-clock (EOD at 18:00)
 *   cancelJob(id)                — for teardown
 *   brainProcess                 — for EOD
 *   getEventHistory              — for event scan
 *   findStalledTasks             — for stalled surfacer
 *   notifyNoel                   — output for all three
 *
 * options.hoursStale overrides the 24h default.
 */
export function initProactive(deps, options = {}) {
  const { scheduleJob, cancelJob } = deps;

  scheduleJob('eod-summary', 18, 0, () => runEodSummary(deps));

  const eventScanInterval = setInterval(() => runEventScan(deps, options), FIFTEEN_MINUTES_MS);
  const stalledInterval = setInterval(() => runStalledTaskSurfacer(deps, options), ONE_HOUR_MS);

  // Unref so these intervals don't keep Node alive at shutdown.
  eventScanInterval.unref?.();
  stalledInterval.unref?.();

  console.log('[Proactive] Triggers armed — EOD 18:00, event scan 15m, stalled-task 1h');

  return function shutdownProactive() {
    clearInterval(eventScanInterval);
    clearInterval(stalledInterval);
    if (cancelJob) cancelJob('eod-summary');
  };
}

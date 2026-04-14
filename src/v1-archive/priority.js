// ---- Priority Engine -----------------------------------------------------
// Maps events from the event bus to notification severity levels.
// Connects eventBus -> severity classification -> notifyNoel.
//
// Usage:
//   import { initPriority, shutdownPriority } from './priority.js';
//   initPriority({ notifyNoel, eventBus });

import { eventBus } from './eventbus.js';

let _notifyNoel = null;
let _listeners = [];

// Event -> severity mapping
// P0: Emergency (Slack DM + Pushover, bypasses DND)
// P1: Urgent (Slack DM)
// P2: Important (hourly digest)
// P3: Info (morning briefing)
const EVENT_RULES = [
  // ---- P0: Emergency ----
  {
    event: 'service:crash',
    severity: 'P0',
    format: (d) => `Service \`${d.name}\` crashed. Restarts: ${d.restarts ?? 'unknown'}`,
  },
  {
    event: 'service:unresponsive',
    severity: 'P0',
    format: (d) => `Service \`${d.name}\` unresponsive for ${d.seconds ?? '?'}s`,
  },
  {
    event: 'ci:main:failure',
    severity: 'P0',
    format: (d) => `CI failed on main: ${d.check || d.message || 'unknown check'}`,
  },
  { event: 'security:alert', severity: 'P0', format: (d) => `Security alert: ${d.message || 'unknown'}` },

  // ---- P1: Urgent ----
  { event: 'health:cpu:critical', severity: 'P1', format: (d) => `CPU at ${d.percent}%` },
  { event: 'health:mem:critical', severity: 'P1', format: (d) => `Memory at ${d.percent}% of ${d.totalGB || '?'}GB` },
  { event: 'health:battery:low', severity: 'P1', format: (d) => `Battery at ${d.percent}% — not charging` },
  {
    event: 'agent:stuck',
    severity: 'P1',
    format: (d) => `Agent ${d.name} appears stuck (${d.reason || 'no response'})`,
  },
  { event: 'pr:review:needed', severity: 'P1', format: (d) => `PR #${d.number} needs review: ${d.title || ''}` },
  { event: 'pr:checks:failed', severity: 'P1', format: (d) => `PR #${d.number} checks failed: ${d.check || ''}` },
  {
    event: 'deploy:failed',
    severity: 'P1',
    format: (d) => `Deploy to ${d.env || 'unknown'} failed: ${d.reason || ''}`,
  },

  // ---- P2: Important ----
  { event: 'health:disk:high', severity: 'P2', format: (d) => `Disk at ${d.percent}% of ${d.totalGB || '?'}GB` },
  { event: 'health:mem:warning', severity: 'P2', format: (d) => `Memory at ${d.percent}% — approaching threshold` },
  { event: 'task:assigned', severity: 'P2', format: (d) => `New task assigned: ${d.title || d.id || 'unknown'}` },
  {
    event: 'task:blocked',
    severity: 'P2',
    format: (d) => `Task blocked: ${d.title || d.id || 'unknown'} — ${d.reason || ''}`,
  },
  {
    event: 'agent:error',
    severity: 'P2',
    format: (d) => `Agent ${d.name} error: ${d.message?.slice(0, 150) || 'unknown'}`,
  },
  {
    event: 'log:error',
    severity: 'P2',
    format: (d) => `Error in ${d.agent || 'system'}: ${d.message?.slice(0, 150) || ''}`,
  },
  {
    event: 'metrics:anomaly',
    severity: 'P2',
    format: (d) => `Anomaly in ${d.metric}: ${d.value} (expected ~${d.expected})`,
  },

  // ---- P3: Info ----
  {
    event: 'task:completed',
    severity: 'P3',
    format: (d) => `Task completed: ${d.title || d.id || 'unknown'} by ${d.agent || '?'}`,
  },
  { event: 'deploy:success', severity: 'P3', format: (d) => `Deploy to ${d.env || 'unknown'} succeeded` },
  { event: 'pr:merged', severity: 'P3', format: (d) => `PR #${d.number} merged: ${d.title || ''}` },
  { event: 'agent:session:created', severity: 'P3', format: (d) => `New session for ${d.name}` },
  { event: 'briefing:delivered', severity: 'P3', format: (d) => 'Morning briefing delivered' },
];

// Build a lookup map for fast matching
const ruleMap = new Map();
for (const rule of EVENT_RULES) {
  ruleMap.set(rule.event, rule);
}

export function initPriority({ notifyNoel }) {
  _notifyNoel = notifyNoel;

  // Register listeners for all known events
  for (const rule of EVENT_RULES) {
    const handler = async (data) => {
      if (!_notifyNoel) return;
      try {
        const message = rule.format(data || {});
        await _notifyNoel(rule.severity, message, {
          cooldownKey: `${rule.event}-${data?.name || data?.id || ''}`.slice(0, 80),
        });
      } catch (e) {
        console.error(`[Priority] Failed to notify for ${rule.event}:`, e.message);
      }
    };
    eventBus.on(rule.event, handler);
    _listeners.push({ event: rule.event, handler });
  }

  // Catch-all for unknown events — log but don't notify
  const unknownHandler = (...args) => {};
  eventBus.on('*', unknownHandler);

  console.log(`[Priority] Engine ready (${EVENT_RULES.length} rules)`);
}

// Manually emit an event (for testing or external triggers)
export function emitEvent(event, data) {
  eventBus.emit(event, data);
}

// Get the severity for an event type (for display/debugging)
export function getSeverity(event) {
  return ruleMap.get(event)?.severity || null;
}

// Get all registered rules (for status display)
export function getRules() {
  return EVENT_RULES.map((r) => ({ event: r.event, severity: r.severity }));
}

export function shutdownPriority() {
  for (const { event, handler } of _listeners) {
    eventBus.off(event, handler);
  }
  _listeners = [];
}

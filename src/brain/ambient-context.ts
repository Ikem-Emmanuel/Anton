// Ambient context — the live "where/when/what's open" string injected into every
// system prompt. This is what makes Anton feel aware rather than stateless.
// Pure function, reads from SQLite state, runs in <1ms.

import { buildUserModelContext, getMemoryStats } from '../memory/sqlite.js';

function describeTimeOfDay(hour: number): string {
  if (hour < 5) return 'late night';
  if (hour < 10) return 'morning';
  if (hour < 14) return 'midday';
  if (hour < 18) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'late evening';
}

export interface AmbientContextOptions {
  lastInteractionAt?: Date;
  openApprovals?: number;
  openTasks?: number;
}

export function buildAmbientContext(options?: AmbientContextOptions): string {
  const now = new Date();
  const hour = now.getHours();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const timeOfDay = describeTimeOfDay(hour);

  const parts: string[] = [`${timeStr} ${day}, ${dateStr} (${timeOfDay}).`];

  // Idle duration since last interaction
  if (options?.lastInteractionAt) {
    const idleMs = now.getTime() - options.lastInteractionAt.getTime();
    const idleMin = Math.floor(idleMs / 60_000);
    if (idleMin >= 60) {
      const idleHr = Math.floor(idleMin / 60);
      parts.push(`Last interaction ${idleHr}h ago.`);
    } else if (idleMin >= 5) {
      parts.push(`Last interaction ${idleMin}m ago.`);
    }
  }

  // Open items awaiting Noel
  if (options?.openApprovals && options.openApprovals > 0) {
    parts.push(`${options.openApprovals} approval${options.openApprovals === 1 ? '' : 's'} pending.`);
  }
  if (options?.openTasks && options.openTasks > 0) {
    parts.push(`${options.openTasks} active task${options.openTasks === 1 ? '' : 's'}.`);
  }

  // Memory depth — shows Anton's accumulated context
  try {
    const stats = getMemoryStats();
    if (stats.totalConversations > 0) {
      parts.push(`${stats.totalConversations} conversations in memory.`);
    }
  } catch {}

  // User model (Phase 3.5 §4.5.5) — high-confidence rows only, caps at 6 lines.
  let userModelBlock = '';
  try {
    userModelBlock = buildUserModelContext();
  } catch {}

  const ambientSection = `[AMBIENT]\n${parts.join(' ')}`;
  return userModelBlock ? `${ambientSection}\n\n${userModelBlock}` : ambientSection;
}

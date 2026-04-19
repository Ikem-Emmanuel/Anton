// Nav config — single source of truth for routes, labels, shortcuts, badges.
// Shell consumes this; modules don't know it exists. Adding a new nav target
// means appending to NAV_ITEMS + registering a view in lib/routes.tsx.

import { APPROVALS } from './data';

export type Route =
  | 'mc'
  | 'brief'
  | 'pending'
  | 'tasks'
  | 'inbox'
  | 'calendar'
  | 'docs'
  | 'chat'
  | 'research'
  | 'people'
  | 'memory'
  | 'expenses'
  | 'travel'
  | 'usage'
  | 'team'
  | 'log'
  | 'hands'
  | 'settings';

export type NavSection = { sec: string };
export type NavItem = {
  id: Route;
  label: string;
  glyph: string;
  /** Keyboard shortcut hint shown in the rail (e.g. "G A"). */
  k: string;
  /** Optional live badge count. */
  badge?: number;
};
export type NavEntry = NavSection | NavItem;

export const NAV_ITEMS: NavEntry[] = [
  { sec: 'OVERVIEW' },
  { id: 'mc', label: 'Mission Control', glyph: '◎', k: 'G A' },
  { id: 'brief', label: 'Briefing', glyph: '☰', k: 'G B' },
  { id: 'pending', label: 'Approvals', glyph: '✓', k: 'G P', badge: APPROVALS.length },

  { sec: 'DO' },
  { id: 'tasks', label: 'Tasks', glyph: '▤', k: 'G K', badge: 3 },
  { id: 'inbox', label: 'Inbox', glyph: '▥', k: 'G I', badge: 4 },
  { id: 'calendar', label: 'Calendar', glyph: '▦', k: 'G D' },
  { id: 'docs', label: 'Documents', glyph: '◨', k: 'G O' },
  { id: 'chat', label: 'Chat', glyph: '◇', k: 'G C' },

  { sec: 'KNOW' },
  { id: 'research', label: 'Research', glyph: '❃', k: 'G R' },
  { id: 'people', label: 'People', glyph: '◉', k: 'G E' },
  { id: 'memory', label: 'Memory', glyph: '■', k: 'G M' },

  { sec: 'RUN' },
  { id: 'expenses', label: 'Expenses', glyph: '$', k: 'G X' },
  { id: 'travel', label: 'Travel', glyph: '✈', k: 'G V' },
  { id: 'usage', label: 'Usage', glyph: '◐', k: 'G U' },

  { sec: 'MIND' },
  { id: 'team', label: 'Team', glyph: '⚏', k: 'G T' },
  { id: 'log', label: 'Log', glyph: '◌', k: 'G L' },
  { id: 'hands', label: 'Hands', glyph: '◈', k: 'G H' },

  { sec: 'SYSTEM' },
  { id: 'settings', label: 'Settings', glyph: '⋯', k: 'G S' },
];

export function isSection(entry: NavEntry): entry is NavSection {
  return 'sec' in entry;
}

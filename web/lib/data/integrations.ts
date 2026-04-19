export type IntegrationStatus = 'ok' | 'warn' | 'error' | 'idle';
export type IntegrationCategory =
  | 'messaging'
  | 'email'
  | 'tasks'
  | 'code'
  | 'calendar'
  | 'finance'
  | 'docs'
  | 'files'
  | 'social'
  | 'design';

export type Integration = {
  id: string;
  name: string;
  cat: IntegrationCategory;
  status: IntegrationStatus;
  note: string;
  scopes: string[];
  last: string | null;
};

export const INTEGRATIONS: Integration[] = [
  { id: 'slack', name: 'Slack', cat: 'messaging', status: 'ok', note: '2 workspaces · 14 channels scoped', scopes: ['read', 'write', 'mention'], last: 'live' },
  { id: 'gmail', name: 'Gmail', cat: 'email', status: 'ok', note: 'noel@anton.computer · 1,284 threads', scopes: ['read', 'draft', 'send w/ approval'], last: '1m' },
  { id: 'jira', name: 'Jira', cat: 'tasks', status: 'ok', note: 'ENG-* · PRD-* projects', scopes: ['read', 'comment', 'transition'], last: '3m' },
  { id: 'asana', name: 'Asana', cat: 'tasks', status: 'ok', note: 'mirrored to SQLite tasks table', scopes: ['read', 'write'], last: '2m' },
  { id: 'gh', name: 'GitHub', cat: 'code', status: 'ok', note: 'anton-computer/anton · PR + issues', scopes: ['repo', 'issues', 'pull-requests'], last: '32s' },
  { id: 'cal', name: 'Calendar', cat: 'calendar', status: 'ok', note: 'Google Calendar · 2 calendars', scopes: ['read', 'write'], last: '5m' },
  { id: 'stripe', name: 'Stripe', cat: 'finance', status: 'error', note: 'API key expired 2h ago', scopes: ['read', 'reports'], last: '2h' },
  { id: 'linear', name: 'Linear', cat: 'tasks', status: 'idle', note: 'available · not connected', scopes: [], last: null },
  { id: 'notion', name: 'Notion', cat: 'docs', status: 'ok', note: 'Personal OS workspace', scopes: ['read', 'append'], last: '14m' },
  { id: 'drive', name: 'Drive', cat: 'files', status: 'warn', note: '1.2GB · re-index pending', scopes: ['read'], last: '1h' },
  { id: 'x', name: 'X / Twitter', cat: 'social', status: 'ok', note: '@noel_anton · post w/ approval', scopes: ['post', 'read timeline'], last: '18m' },
  { id: 'figma', name: 'Figma', cat: 'design', status: 'idle', note: 'available · not connected', scopes: [], last: null },
];

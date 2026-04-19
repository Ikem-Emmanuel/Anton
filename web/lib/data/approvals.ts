import type { Risk } from './primitives';

export type Approval = {
  id: number;
  agent: string;
  dept: string;
  risk: Risk;
  intent: string;
  why: string | null;
  diff: Array<[string, string, string?]> | null;
};

export const APPROVALS: Approval[] = [
  {
    id: 1,
    agent: 'Marcus',
    dept: 'eng',
    risk: 'L',
    intent: 'Draft PRD for onboarding v3 and share with Alex.',
    why: "Continuation of yesterday's scope review. No external writes.",
    diff: null,
  },
  {
    id: 2,
    agent: 'James',
    dept: 'eng',
    risk: 'H',
    intent: 'Push v1.2 to production.',
    why: 'All tests green for 42m. Requires approval per red tier.',
    diff: [
      ['+', 'api/router.ts', '24 lines'],
      ['-', 'api/router.ts', '9 lines'],
      ['~', 'config/deploy.yaml', '3 lines'],
    ],
  },
  {
    id: 3,
    agent: 'Sarah',
    dept: 'mktg',
    risk: 'M',
    intent: 'Send launch email to 2,340 subscribers.',
    why: 'Targeting "waitlist: dormant 30d". Copy reviewed by Kai.',
    diff: [
      ['subject', 'You asked us to build it. We did.'],
      ['from', 'noel@anton.computer'],
      ['audience', '2,340 contacts'],
    ],
  },
  { id: 4, agent: 'Riley', dept: 'mktg', risk: 'L', intent: 'Schedule 4 X posts across Thu–Sun.', why: null, diff: null },
  { id: 5, agent: 'Priya', dept: 'data', risk: 'L', intent: 'Rebuild weekly retention cohort.', why: null, diff: null },
];

// ---- Approval-detail (full-screen decision surface) --------------------

export type ApprovalStatColor = 'ok' | 'work' | 'error' | 'secondary';

export type ApprovalStat = [label: string, value: string, color: ApprovalStatColor];

export type ApprovalPreviewStep = { t: string; d: string };

export type ApprovalOption = {
  id: string;
  label: string;
  pitch: string;
  stats: ApprovalStat[];
  tradeoffs: string[];
  author: string;
  preview: ApprovalPreviewStep[];
};

export const APPROVAL_OPTIONS: ApprovalOption[] = [
  {
    id: 'A',
    label: 'Gentle onboarding (recommended)',
    pitch: 'Prompt user on step 3. Local-model fallback. Default for waitlist graduates.',
    stats: [
      ['Time-to-first-value', '45s', 'ok'],
      ['Abandonment', 'low', 'ok'],
      ['Support load', '+5%', 'work'],
      ['Dev effort', '2 days', 'secondary'],
    ],
    tradeoffs: ['Best for new users', 'Some friction at step 3', 'Cheapest to build'],
    author: 'Marcus',
    preview: [
      { t: 'step 1', d: 'welcome · who this is for' },
      { t: 'step 2', d: 'connect Slack (required)' },
      { t: 'step 3', d: 'create workspace · prompt user' },
      { t: 'step 4', d: 'meet the team · 3 agents pinned' },
      { t: 'step 5', d: 'first delegation · guided' },
    ],
  },
  {
    id: 'B',
    label: 'Zero-click onboarding',
    pitch: 'Auto-creates workspace. Claude-forced first classification. Fastest to value.',
    stats: [
      ['Time-to-first-value', '18s', 'ok'],
      ['Abandonment', 'lowest', 'ok'],
      ['Support load', '+18%', 'error'],
      ['Dev effort', '4 days', 'secondary'],
    ],
    tradeoffs: ['Fastest wow moment', 'Heavy Claude spend', 'Harder to debug support issues'],
    author: 'Marcus',
    preview: [
      { t: 'step 1', d: 'welcome' },
      { t: 'step 2', d: 'connect Slack' },
      { t: 'step 3', d: 'workspace auto-created' },
      { t: 'step 4', d: 'agents pre-pinned by heuristic' },
      { t: 'step 5', d: 'first delegation · unguided' },
    ],
  },
  {
    id: 'C',
    label: 'Terminal-first onboarding',
    pitch: 'Shell-native users only. Five commands, no UI. Power-user path.',
    stats: [
      ['Time-to-first-value', '12s', 'ok'],
      ['Abandonment', 'high for novices', 'error'],
      ['Support load', 'none', 'ok'],
      ['Dev effort', '1 day', 'ok'],
    ],
    tradeoffs: ['Zero-friction for shell users', 'Alienates non-technical', 'Lowest effort'],
    author: 'Marcus',
    preview: [
      { t: 'cmd 1', d: 'anton init' },
      { t: 'cmd 2', d: 'anton connect slack' },
      { t: 'cmd 3', d: 'anton workspace new' },
      { t: 'cmd 4', d: 'anton pin @marcus @sarah' },
      { t: 'cmd 5', d: 'anton "draft a PRD for X"' },
    ],
  },
];

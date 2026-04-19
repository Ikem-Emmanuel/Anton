// Mock data mirrored from Design/anton/project/shared.jsx.
// Will be replaced with live brain/SQLite queries once the API routes land.

export type Dept = { id: string; name: string; color: string };

export const DEPARTMENTS: Dept[] = [
  { id: 'eng', name: 'Engineering', color: '#8DBBFF' },
  { id: 'mktg', name: 'Marketing', color: '#E4938E' },
  { id: 'seo', name: 'SEO', color: '#FBDA83' },
  { id: 'data', name: 'Data', color: '#A6D89C' },
  { id: 'fin', name: 'Finance', color: '#C5A8F0' },
  { id: 'prod', name: 'Product', color: '#F0B780' },
];

export type TrustTier = 'green' | 'amber' | 'red';
export type AgentStatus = 'idle' | 'working' | 'complete' | 'error';

export type Agent = {
  n: string;
  d: string;
  r: string;
  t: TrustTier;
  s: AgentStatus;
  q: number;
  last: string;
  k: string;
};

export const AGENTS: Agent[] = [
  { n: 'Marcus', d: 'eng', r: 'Lead engineer', t: 'amber', s: 'working', q: 2, last: '2m', k: 'MCS' },
  { n: 'James', d: 'eng', r: 'Deploy & DevOps', t: 'red', s: 'idle', q: 0, last: '14m', k: 'JMS' },
  { n: 'Ada', d: 'eng', r: 'Frontend', t: 'green', s: 'working', q: 1, last: '1m', k: 'ADA' },
  { n: 'Felix', d: 'eng', r: 'Backend', t: 'green', s: 'complete', q: 0, last: '6m', k: 'FLX' },
  { n: 'Ben', d: 'eng', r: 'QA & tests', t: 'green', s: 'idle', q: 0, last: '1h', k: 'BEN' },
  { n: 'Sarah', d: 'mktg', r: 'Copy & campaigns', t: 'amber', s: 'working', q: 3, last: '3m', k: 'SRA' },
  { n: 'Elena', d: 'mktg', r: 'Social', t: 'green', s: 'idle', q: 1, last: '22m', k: 'ELN' },
  { n: 'Riley', d: 'mktg', r: 'Launch ops', t: 'amber', s: 'error', q: 1, last: '4m', k: 'RLY' },
  { n: 'Kai', d: 'seo', r: 'Keywords & content', t: 'green', s: 'working', q: 2, last: '8s', k: 'KAI' },
  { n: 'Nadia', d: 'seo', r: 'Technical SEO', t: 'green', s: 'idle', q: 0, last: '2h', k: 'NDA' },
  { n: 'Priya', d: 'data', r: 'Analytics', t: 'green', s: 'working', q: 1, last: '46s', k: 'PRY' },
  { n: 'Nina', d: 'data', r: 'Instrumentation', t: 'green', s: 'complete', q: 0, last: '12m', k: 'NNA' },
  { n: 'Omar', d: 'fin', r: 'Forecasting', t: 'amber', s: 'idle', q: 1, last: '1h', k: 'OMR' },
  { n: 'Diana', d: 'fin', r: 'Reconciliation', t: 'red', s: 'idle', q: 0, last: '3h', k: 'DNA' },
  { n: 'Alex', d: 'prod', r: 'PRDs & research', t: 'green', s: 'working', q: 2, last: '1m', k: 'ALX' },
];

export type Risk = 'L' | 'M' | 'H';

export type Approval = {
  id: number;
  agent: string;
  dept: string;
  risk: Risk;
  intent: string;
  why: string | null;
  diff: Array<[string, string, string?]> | null;
};

export type Memory = {
  type: 'preference' | 'decision' | 'fact' | 'conversation';
  title: string;
  src: string;
  hl: 'yellow' | 'coral' | 'blue';
  conf: number;
};

export const MEMORIES: Memory[] = [
  { type: 'preference', title: 'Noel prefers bullet summaries over prose in briefings.', src: 'Slack · Mar 3', hl: 'yellow', conf: 3 },
  { type: 'decision', title: 'Use Qwen3 8B for local; Claude only for deep research.', src: 'Settings · Feb 19', hl: 'coral', conf: 3 },
  { type: 'fact', title: 'Stripe subscription renews on the 14th of each month.', src: 'Diana · Mar 14', hl: 'blue', conf: 3 },
  { type: 'decision', title: 'Deploys after 6pm require explicit approval.', src: 'James · Mar 28', hl: 'coral', conf: 2 },
  { type: 'preference', title: 'Do not use emoji in customer-facing copy.', src: 'Sarah · Feb 2', hl: 'yellow', conf: 3 },
  { type: 'conversation', title: 'Debrief on Q1 launch — pivot to creator tier.', src: 'Voice · Apr 3', hl: 'blue', conf: 2 },
  { type: 'fact', title: 'Mac Studio arriving Apr 22.', src: 'Calendar · Apr 1', hl: 'yellow', conf: 3 },
];

export type ActivityType = 'tool' | 'think' | 'write' | 'search' | 'handoff' | 'complete' | 'approval' | 'system';

export type ActivityEvent = {
  t: string;
  agent: string;
  type: ActivityType;
  text: string;
  detail: string | null;
};

export const ACTIVITY: ActivityEvent[] = [
  { t: '14:02:17', agent: 'Marcus', type: 'tool', text: "read_file('specs/onboarding.md')", detail: '1,204 bytes · 12ms' },
  { t: '14:02:18', agent: 'Marcus', type: 'think', text: 'Planning PRD outline: 6 sections, 2 open questions.', detail: null },
  { t: '14:01:54', agent: 'Ada', type: 'write', text: 'Edited components/Sidebar.tsx', detail: '+48 -12' },
  { t: '14:01:30', agent: 'Kai', type: 'search', text: 'query: "laptop-class local llm"', detail: '43 results' },
  { t: '14:00:12', agent: 'Priya', type: 'tool', text: 'run_sql("SELECT cohort...")', detail: '0.82s · 714 rows' },
  { t: '13:58:44', agent: 'Sarah', type: 'handoff', text: '→ Kai: review launch copy for SEO tone', detail: null },
  { t: '13:57:02', agent: 'Felix', type: 'complete', text: 'Completed: "Add rate-limit middleware"', detail: '3 commits' },
  { t: '13:55:19', agent: 'James', type: 'approval', text: 'Requested approval: deploy v1.2', detail: 'pending' },
  { t: '13:54:00', agent: 'Anton', type: 'system', text: 'Daily briefing generated', detail: '8 items' },
];

export const APPROVALS: Approval[] = [
  { id: 1, agent: 'Marcus', dept: 'eng', risk: 'L', intent: 'Draft PRD for onboarding v3 and share with Alex.', why: "Continuation of yesterday's scope review. No external writes.", diff: null },
  { id: 2, agent: 'James', dept: 'eng', risk: 'H', intent: 'Push v1.2 to production.', why: 'All tests green for 42m. Requires approval per red tier.', diff: [['+', 'api/router.ts', '24 lines'], ['-', 'api/router.ts', '9 lines'], ['~', 'config/deploy.yaml', '3 lines']] },
  { id: 3, agent: 'Sarah', dept: 'mktg', risk: 'M', intent: 'Send launch email to 2,340 subscribers.', why: 'Targeting "waitlist: dormant 30d". Copy reviewed by Kai.', diff: [['subject', 'You asked us to build it. We did.'], ['from', 'noel@anton.computer'], ['audience', '2,340 contacts']] },
  { id: 4, agent: 'Riley', dept: 'mktg', risk: 'L', intent: 'Schedule 4 X posts across Thu–Sun.', why: null, diff: null },
  { id: 5, agent: 'Priya', dept: 'data', risk: 'L', intent: 'Rebuild weekly retention cohort.', why: null, diff: null },
];

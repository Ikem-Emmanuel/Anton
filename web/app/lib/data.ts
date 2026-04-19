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

export const APPROVALS: Approval[] = [
  { id: 1, agent: 'Marcus', dept: 'eng', risk: 'L', intent: 'Draft PRD for onboarding v3 and share with Alex.', why: "Continuation of yesterday's scope review. No external writes.", diff: null },
  { id: 2, agent: 'James', dept: 'eng', risk: 'H', intent: 'Push v1.2 to production.', why: 'All tests green for 42m. Requires approval per red tier.', diff: [['+', 'api/router.ts', '24 lines'], ['-', 'api/router.ts', '9 lines'], ['~', 'config/deploy.yaml', '3 lines']] },
  { id: 3, agent: 'Sarah', dept: 'mktg', risk: 'M', intent: 'Send launch email to 2,340 subscribers.', why: 'Targeting "waitlist: dormant 30d". Copy reviewed by Kai.', diff: [['subject', 'You asked us to build it. We did.'], ['from', 'noel@anton.computer'], ['audience', '2,340 contacts']] },
  { id: 4, agent: 'Riley', dept: 'mktg', risk: 'L', intent: 'Schedule 4 X posts across Thu–Sun.', why: null, diff: null },
  { id: 5, agent: 'Priya', dept: 'data', risk: 'L', intent: 'Rebuild weekly retention cohort.', why: null, diff: null },
];

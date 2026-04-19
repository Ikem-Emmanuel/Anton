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
  {
    type: 'preference',
    title: 'Noel prefers bullet summaries over prose in briefings.',
    src: 'Slack · Mar 3',
    hl: 'yellow',
    conf: 3,
  },
  {
    type: 'decision',
    title: 'Use Qwen3 8B for local; Claude only for deep research.',
    src: 'Settings · Feb 19',
    hl: 'coral',
    conf: 3,
  },
  {
    type: 'fact',
    title: 'Stripe subscription renews on the 14th of each month.',
    src: 'Diana · Mar 14',
    hl: 'blue',
    conf: 3,
  },
  {
    type: 'decision',
    title: 'Deploys after 6pm require explicit approval.',
    src: 'James · Mar 28',
    hl: 'coral',
    conf: 2,
  },
  {
    type: 'preference',
    title: 'Do not use emoji in customer-facing copy.',
    src: 'Sarah · Feb 2',
    hl: 'yellow',
    conf: 3,
  },
  {
    type: 'conversation',
    title: 'Debrief on Q1 launch — pivot to creator tier.',
    src: 'Voice · Apr 3',
    hl: 'blue',
    conf: 2,
  },
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
  {
    t: '14:02:17',
    agent: 'Marcus',
    type: 'tool',
    text: "read_file('specs/onboarding.md')",
    detail: '1,204 bytes · 12ms',
  },
  {
    t: '14:02:18',
    agent: 'Marcus',
    type: 'think',
    text: 'Planning PRD outline: 6 sections, 2 open questions.',
    detail: null,
  },
  { t: '14:01:54', agent: 'Ada', type: 'write', text: 'Edited components/Sidebar.tsx', detail: '+48 -12' },
  { t: '14:01:30', agent: 'Kai', type: 'search', text: 'query: "laptop-class local llm"', detail: '43 results' },
  { t: '14:00:12', agent: 'Priya', type: 'tool', text: 'run_sql("SELECT cohort...")', detail: '0.82s · 714 rows' },
  { t: '13:58:44', agent: 'Sarah', type: 'handoff', text: '→ Kai: review launch copy for SEO tone', detail: null },
  {
    t: '13:57:02',
    agent: 'Felix',
    type: 'complete',
    text: 'Completed: "Add rate-limit middleware"',
    detail: '3 commits',
  },
  { t: '13:55:19', agent: 'James', type: 'approval', text: 'Requested approval: deploy v1.2', detail: 'pending' },
  { t: '13:54:00', agent: 'Anton', type: 'system', text: 'Daily briefing generated', detail: '8 items' },
];

export type ChatThread = {
  id: string;
  name: string;
  sub: string;
  last: string;
  time: string;
  unread: number;
  pinned?: boolean;
  avatar: string;
  /** CSS color value for the monogram glyph. */
  color: string;
  /** Group channels render with a square avatar instead of a round one. */
  group?: boolean;
};

export const CHAT_THREADS: ChatThread[] = [
  {
    id: 'anton',
    name: 'Anton',
    sub: 'personal OS',
    last: 'Morning briefing sent.',
    time: '14:02',
    unread: 0,
    pinned: true,
    avatar: '◉',
    color: 'var(--accent)',
  },
  {
    id: 'marcus',
    name: 'Marcus',
    sub: 'Lead engineer · Engineering',
    last: 'PRD draft is ready. Two open questions.',
    time: '13:58',
    unread: 2,
    avatar: 'M',
    color: '#8DBBFF',
  },
  {
    id: 'sarah',
    name: 'Sarah',
    sub: 'Copy · Marketing',
    last: 'Launch email ready for review.',
    time: '13:44',
    unread: 1,
    avatar: 'S',
    color: '#E4938E',
  },
  {
    id: 'james',
    name: 'James',
    sub: 'DevOps',
    last: 'Waiting on your approval for v1.2.',
    time: '13:32',
    unread: 1,
    avatar: 'J',
    color: '#8DBBFF',
  },
  {
    id: 'kai',
    name: 'Kai',
    sub: 'SEO',
    last: 'Keyword set indexed.',
    time: '12:10',
    unread: 0,
    avatar: 'K',
    color: '#FBDA83',
  },
  {
    id: 'eng',
    name: '# engineering',
    sub: '5 agents · Marcus lead',
    last: 'Ben → Felix: green on the retry harness',
    time: '11:50',
    unread: 0,
    avatar: '#',
    color: 'var(--text-secondary)',
    group: true,
  },
  {
    id: 'priya',
    name: 'Priya',
    sub: 'Analytics · Data',
    last: 'Cohort rebuilt, 714 rows.',
    time: '11:02',
    unread: 0,
    avatar: 'P',
    color: '#A6D89C',
  },
  {
    id: 'alex',
    name: 'Alex',
    sub: 'Product',
    last: 'Onboarding v3 scope locked.',
    time: '10:14',
    unread: 0,
    avatar: 'A',
    color: '#F0B780',
  },
];

export type ChatMessage = {
  from: 'noel' | 'anton';
  t: string;
  text: string;
  render?: 'header';
  meta?: {
    cite?: string;
    depth?: 'minimal' | 'standard' | 'deep';
    model?: string;
    lat?: string;
    handoff?: string;
    intent?: string;
  };
};

export const ANTON_MSGS: ChatMessage[] = [
  { from: 'anton', t: '09:02', text: 'Morning. Three things for today:', render: 'header' },
  {
    from: 'anton',
    t: '09:02',
    text: 'James is queued to push v1.2 — waiting on your approval. All tests have been green for 42 minutes.',
    meta: { cite: 'James · 08:20', depth: 'minimal' },
  },
  {
    from: 'anton',
    t: '09:02',
    text: "Sarah's launch email is drafted. Targeting 2,340 dormant waitlist. Copy reviewed by Kai for SEO tone.",
    meta: { cite: 'Sarah · 08:55', depth: 'minimal' },
  },
  {
    from: 'anton',
    t: '09:02',
    text: 'Marcus has the PRD for onboarding v3 ready, with two open questions for you.',
    meta: { cite: 'Marcus · 08:41', depth: 'minimal' },
  },
  { from: 'noel', t: '09:14', text: "walk me through Marcus's open questions" },
  {
    from: 'anton',
    t: '09:14',
    text: "1. Should step 3 auto-create a workspace or prompt the user? (He's leaning prompt.)\n2. What's the fallback if the local model can't classify the user's intent on first-run?",
    meta: { cite: 'Marcus PRD §3.2, §4.1', depth: 'standard', model: 'qwen3:8b', lat: '2.1s' },
  },
  {
    from: 'noel',
    t: '09:15',
    text: 'ask Marcus to propose the fallback and draft both auto and prompt options side-by-side',
  },
  {
    from: 'anton',
    t: '09:15',
    text: "Sent. Marcus is on it — he'll post in this thread when ready.",
    meta: { handoff: 'Marcus', intent: 'draft comparison', depth: 'minimal' },
  },
];

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
  {
    id: 4,
    agent: 'Riley',
    dept: 'mktg',
    risk: 'L',
    intent: 'Schedule 4 X posts across Thu–Sun.',
    why: null,
    diff: null,
  },
  { id: 5, agent: 'Priya', dept: 'data', risk: 'L', intent: 'Rebuild weekly retention cohort.', why: null, diff: null },
];

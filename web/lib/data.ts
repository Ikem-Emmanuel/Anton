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

export type TaskColumn = 'incoming' | 'flight' | 'done' | 'blocked';

export type Task = {
  id: number;
  title: string;
  /** Who owns the next move. Noel, an agent name, or Anton. */
  owner: string;
  /** Who is currently acting on it. Often same as owner; diverges when Anton is doing it on someone's behalf. */
  actor: string;
  col: TaskColumn;
  age: string;
  risk?: Risk;
  why?: string;
  /** Progress % for in-flight tasks. */
  pct?: number;
  /** Current sub-step for in-flight tasks. */
  step?: string;
};

export const TASKS: Task[] = [
  {
    id: 0,
    title: 'Review launch email copy',
    owner: 'Noel',
    actor: 'Sarah',
    col: 'incoming',
    age: '22m',
    risk: 'M',
    why: 'Waiting on your approval before send',
  },
  {
    id: 1,
    title: 'Decide: creator-tier pricing',
    owner: 'Noel',
    actor: 'Alex',
    col: 'incoming',
    age: '2h',
    risk: 'M',
    why: "Blocking Marcus's PRD §4",
  },
  {
    id: 2,
    title: 'Sign Q2 engagement letter',
    owner: 'Noel',
    actor: 'Diana',
    col: 'incoming',
    age: '1d',
    risk: 'L',
    why: 'Legal needs your signature',
  },
  {
    id: 3,
    title: 'Draft PRD · onboarding v3',
    owner: 'Marcus',
    actor: 'Marcus',
    col: 'flight',
    age: '1h',
    pct: 68,
    step: 'writing §5 error flows',
  },
  {
    id: 4,
    title: 'Keyword research · creator tier',
    owner: 'Kai',
    actor: 'Kai',
    col: 'flight',
    age: '8m',
    pct: 42,
    step: 'clustered 84 of 200 queries',
  },
  {
    id: 5,
    title: 'Retention cohort rebuild',
    owner: 'Priya',
    actor: 'Priya',
    col: 'flight',
    age: '46s',
    pct: 12,
    step: 'running SQL · 714 rows so far',
  },
  {
    id: 6,
    title: 'Draft reply to Julia Pell',
    owner: 'Anton',
    actor: 'Anton',
    col: 'flight',
    age: '2m',
    pct: 100,
    step: 'ready for your review',
  },
  { id: 7, title: 'Pushed v1.2 to staging', owner: 'James', actor: 'James', col: 'done', age: '6m' },
  { id: 8, title: 'Filed Stripe invoice $847', owner: 'Anton', actor: 'Anton', col: 'done', age: '14m' },
  { id: 9, title: 'Archived 6 LinkedIn threads', owner: 'Anton', actor: 'Anton', col: 'done', age: '2h' },
  { id: 10, title: 'Reviewed Priya candidate', owner: 'Anna', actor: 'Anna', col: 'done', age: '1h' },
  {
    id: 11,
    title: 'Deploy v1.2 to production',
    owner: 'James',
    actor: 'James',
    col: 'blocked',
    age: '42m',
    why: 'needs your approval (red tier)',
  },
  {
    id: 12,
    title: 'Send launch email',
    owner: 'Sarah',
    actor: 'Sarah',
    col: 'blocked',
    age: '22m',
    why: 'blocked on Noel review of copy',
  },
];

export type InboxKind = 'drafted' | 'filed' | 'approval' | 'review' | 'read' | 'archived' | 'flagged';

export type InboxThread = {
  id: number;
  from: string;
  subj: string;
  summary: string;
  t: string;
  k: InboxKind;
  unread: boolean;
  tags: string[];
  /** Optional original-message body (rendered in the detail pane). */
  body?: string;
  /** Optional Anton-drafted reply (rendered in the detail pane for k=drafted). */
  draft?: string;
};

export const INBOX: InboxThread[] = [
  {
    id: 0,
    from: 'Julia Pell · Spark',
    subj: 'Re: Series A deck',
    summary: 'Wants to move Tues call to Wed. Anton drafted a reply proposing Wed 2pm.',
    t: '2m',
    k: 'drafted',
    unread: true,
    tags: ['investor', 'fundraise'],
    body: 'Hey Noel,\n\nSomething came up Tuesday — can we push to Wednesday same time? Happy to work around your schedule. Also wanted to confirm the deck is in good shape for my partners.\n\n– Julia',
    draft:
      "Hi Julia — works for me. Wed 2pm? I'll have Anton send an updated calendar invite. Deck is ready; will ping you tomorrow with the final version.\n— Noel",
  },
  {
    id: 1,
    from: 'Stripe',
    subj: 'Invoice #4412',
    summary: 'Monthly subscription receipt, $847. Anton auto-filed to Finance.',
    t: '14m',
    k: 'filed',
    unread: false,
    tags: ['finance'],
    body: 'Your subscription invoice is attached. Amount charged: $847.00 USD to card ending 4412. Next billing date: May 14, 2025.',
  },
  {
    id: 2,
    from: 'Sarah (agent)',
    subj: 'Launch email copy · v3',
    summary: 'Asking you to review final copy before Anton sends to 2,340 subs.',
    t: '22m',
    k: 'approval',
    unread: true,
    tags: ['approval'],
    body: 'Final launch copy attached below. Waiting on your review before I (Sarah) ask Anton to queue the send. Kai signed off on SEO tone.',
  },
  {
    id: 3,
    from: 'Marcus (agent)',
    subj: 'PRD draft ready',
    summary: 'Onboarding v3 draft in memory. Open questions flagged for you.',
    t: '41m',
    k: 'review',
    unread: true,
    tags: ['product'],
    body: 'PRD draft is complete and saved to memory. Two open questions flagged in §3.2 around auth flow. Marcus.',
  },
  {
    id: 4,
    from: 'Anna Kou',
    subj: 'Hiring loop feedback',
    summary: 'Positive signal on Priya candidate. Anton extracted key quotes.',
    t: '1h',
    k: 'read',
    unread: false,
    tags: ['hiring'],
  },
  {
    id: 5,
    from: 'LinkedIn',
    subj: '6 new connection requests',
    summary: 'Anton auto-archived. 1 flagged (ex-Stripe PM) for your review.',
    t: '2h',
    k: 'archived',
    unread: false,
    tags: ['noise'],
  },
  {
    id: 6,
    from: 'Elena (agent)',
    subj: 'Social calendar Thu–Sun',
    summary: '4 posts scheduled. Threadwise copy attached, needs your OK.',
    t: '3h',
    k: 'approval',
    unread: true,
    tags: ['approval', 'marketing'],
  },
  {
    id: 7,
    from: 'Cal (friend)',
    subj: 'Dinner Friday?',
    summary: 'Anton held Fri 7–9pm tentatively. Reply drafted: yes.',
    t: '4h',
    k: 'drafted',
    unread: false,
    tags: ['personal'],
    draft: 'Yes — 7pm works. Where are you thinking?\n— N',
  },
  {
    id: 8,
    from: 'AWS Billing',
    subj: 'Usage alert — $1,240',
    summary: '30% over forecast. Anton flagged to Diana, who is investigating.',
    t: '6h',
    k: 'flagged',
    unread: false,
    tags: ['finance'],
  },
  {
    id: 9,
    from: 'Producthunt',
    subj: 'Weekly digest',
    summary: 'Anton archived. Nothing matched your watched keywords.',
    t: '9h',
    k: 'archived',
    unread: false,
    tags: ['noise'],
  },
];

export type CalendarEventKind = 'human' | 'anton' | 'hold';

export type CalendarEvent = {
  /** Day index into CALENDAR_DAYS (0-6). */
  d: number;
  /** Start offset in hours from 8am (grid top). Fractional allowed for half-hours. */
  s: number;
  /** Duration in hours. */
  h: number;
  k: CalendarEventKind;
  /** Event title shown in the block. */
  t: string;
  /** "With" line — attendee or context. */
  w?: string;
  /** Optional annotation shown in the detail panel. */
  note?: string;
};

export const CALENDAR_DAYS = ['MON 14', 'TUE 15', 'WED 16', 'THU 17', 'FRI 18', 'SAT 19', 'SUN 20'] as const;
export const CALENDAR_HOURS = ['8', '9', '10', '11', '12', '1', '2', '3', '4', '5', '6'] as const;
/** Index into CALENDAR_DAYS that renders with the "today" accent. */
export const CALENDAR_TODAY_INDEX = 3;
/** Offset (hours from 8am) where the "now" line is drawn on today's column. */
export const CALENDAR_NOW_OFFSET = 6.5;

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { d: 0, s: 1, h: 1, k: 'human', t: 'Standup', w: 'team' },
  { d: 0, s: 3, h: 2, k: 'anton', t: 'Focus · PRD draft', w: 'held by Anton', note: 'Marcus drafting' },
  { d: 0, s: 7, h: 1, k: 'human', t: '1:1 Anna', w: 'Anna Kou' },

  { d: 1, s: 0.5, h: 1, k: 'human', t: 'Investor · Spark Capital', w: 'J. Pell' },
  { d: 1, s: 2, h: 3, k: 'anton', t: 'Deep research block', w: 'held by Anton', note: 'creator-tier pricing' },
  { d: 1, s: 6, h: 1, k: 'human', t: 'Gym', w: 'recurring' },

  { d: 2, s: 1, h: 1, k: 'human', t: 'Design review', w: 'Elena + Ada' },
  { d: 2, s: 3, h: 1.5, k: 'anton', t: 'Reshuffled · walk', w: 'moved from Fri', note: 'rain forecast' },
  { d: 2, s: 5, h: 1, k: 'human', t: 'Board prep', w: 'solo' },

  { d: 3, s: 0, h: 1, k: 'human', t: 'Standup', w: 'team' },
  { d: 3, s: 2, h: 1, k: 'hold', t: 'Focus · no meetings', w: 'protected' },
  { d: 3, s: 4, h: 2, k: 'human', t: 'Launch sync', w: 'Sarah + Riley' },
  { d: 3, s: 7, h: 1, k: 'anton', t: 'Email triage', w: 'held by Anton', note: '45 threads' },

  { d: 4, s: 1, h: 1, k: 'human', t: 'All-hands', w: '26 ppl' },
  { d: 4, s: 3, h: 2, k: 'anton', t: 'Weekly review', w: 'with Anton', note: 'proposed' },

  { d: 6, s: 2, h: 2, k: 'human', t: 'Family lunch', w: 'Mom + Dad' },
];

export type CalendarProposal = {
  t: string;
  r: string;
  conf: 'proposed' | 'suggested';
};

export const CALENDAR_PROPOSALS: CalendarProposal[] = [
  { t: 'Move "Design review" → Thu 2pm', r: 'Elena is OOO Wed', conf: 'suggested' },
  { t: 'Hold 3h block Fri afternoon', r: 'to finish creator-tier writeup', conf: 'proposed' },
  { t: 'Decline "Vendor pitch · Mon"', r: 'duplicate of Tues investor call', conf: 'suggested' },
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

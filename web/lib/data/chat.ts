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
  { id: 'anton', name: 'Anton', sub: 'personal OS', last: 'Morning briefing sent.', time: '14:02', unread: 0, pinned: true, avatar: '◉', color: 'var(--accent)' },
  { id: 'marcus', name: 'Marcus', sub: 'Lead engineer · Engineering', last: 'PRD draft is ready. Two open questions.', time: '13:58', unread: 2, avatar: 'M', color: '#8DBBFF' },
  { id: 'sarah', name: 'Sarah', sub: 'Copy · Marketing', last: 'Launch email ready for review.', time: '13:44', unread: 1, avatar: 'S', color: '#E4938E' },
  { id: 'james', name: 'James', sub: 'DevOps', last: 'Waiting on your approval for v1.2.', time: '13:32', unread: 1, avatar: 'J', color: '#8DBBFF' },
  { id: 'kai', name: 'Kai', sub: 'SEO', last: 'Keyword set indexed.', time: '12:10', unread: 0, avatar: 'K', color: '#FBDA83' },
  { id: 'eng', name: '# engineering', sub: '5 agents · Marcus lead', last: 'Ben → Felix: green on the retry harness', time: '11:50', unread: 0, avatar: '#', color: 'var(--text-secondary)', group: true },
  { id: 'priya', name: 'Priya', sub: 'Analytics · Data', last: 'Cohort rebuilt, 714 rows.', time: '11:02', unread: 0, avatar: 'P', color: '#A6D89C' },
  { id: 'alex', name: 'Alex', sub: 'Product', last: 'Onboarding v3 scope locked.', time: '10:14', unread: 0, avatar: 'A', color: '#F0B780' },
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
  { from: 'noel', t: '09:15', text: 'ask Marcus to propose the fallback and draft both auto and prompt options side-by-side' },
  {
    from: 'anton',
    t: '09:15',
    text: "Sent. Marcus is on it — he'll post in this thread when ready.",
    meta: { handoff: 'Marcus', intent: 'draft comparison', depth: 'minimal' },
  },
];

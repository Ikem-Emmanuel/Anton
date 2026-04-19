// Shared data + UI primitives for Anton
const DEPARTMENTS = [
  { id: 'eng',     name: 'Engineering',  color: '#8DBBFF' },
  { id: 'mktg',    name: 'Marketing',    color: '#E4938E' },
  { id: 'seo',     name: 'SEO',          color: '#FBDA83' },
  { id: 'data',    name: 'Data',         color: '#A6D89C' },
  { id: 'fin',     name: 'Finance',      color: '#C5A8F0' },
  { id: 'prod',    name: 'Product',      color: '#F0B780' },
];

// 15 named agents. We'll repeat & extend departmentally to hit 26 slots visually.
const AGENTS = [
  { n: 'Marcus', d: 'eng',  r: 'Lead engineer',        t: 'amber', s: 'working',  q: 2, last: '2m',  k: 'MCS' },
  { n: 'James',  d: 'eng',  r: 'Deploy & DevOps',      t: 'red',   s: 'idle',     q: 0, last: '14m', k: 'JMS' },
  { n: 'Ada',    d: 'eng',  r: 'Frontend',             t: 'green', s: 'working',  q: 1, last: '1m',  k: 'ADA' },
  { n: 'Felix',  d: 'eng',  r: 'Backend',              t: 'green', s: 'complete', q: 0, last: '6m',  k: 'FLX' },
  { n: 'Ben',    d: 'eng',  r: 'QA & tests',           t: 'green', s: 'idle',     q: 0, last: '1h',  k: 'BEN' },

  { n: 'Sarah',  d: 'mktg', r: 'Copy & campaigns',     t: 'amber', s: 'working',  q: 3, last: '3m',  k: 'SRA' },
  { n: 'Elena',  d: 'mktg', r: 'Social',               t: 'green', s: 'idle',     q: 1, last: '22m', k: 'ELN' },
  { n: 'Riley',  d: 'mktg', r: 'Launch ops',           t: 'amber', s: 'error',    q: 1, last: '4m',  k: 'RLY' },

  { n: 'Kai',    d: 'seo',  r: 'Keywords & content',   t: 'green', s: 'working',  q: 2, last: '8s',  k: 'KAI' },
  { n: 'Nadia',  d: 'seo',  r: 'Technical SEO',        t: 'green', s: 'idle',     q: 0, last: '2h',  k: 'NDA' },

  { n: 'Priya',  d: 'data', r: 'Analytics',            t: 'green', s: 'working',  q: 1, last: '46s', k: 'PRY' },
  { n: 'Nina',   d: 'data', r: 'Instrumentation',      t: 'green', s: 'complete', q: 0, last: '12m', k: 'NNA' },

  { n: 'Omar',   d: 'fin',  r: 'Forecasting',          t: 'amber', s: 'idle',     q: 1, last: '1h',  k: 'OMR' },
  { n: 'Diana',  d: 'fin',  r: 'Reconciliation',       t: 'red',   s: 'idle',     q: 0, last: '3h',  k: 'DNA' },

  { n: 'Alex',   d: 'prod', r: 'PRDs & research',      t: 'green', s: 'working',  q: 2, last: '1m',  k: 'ALX' },
];

// Activity / approval mock content
const APPROVALS = [
  { id: 1, agent: 'Marcus',  dept: 'eng',  risk: 'L', intent: 'Draft PRD for onboarding v3 and share with Alex.',
    why: 'Continuation of yesterday\u2019s scope review. No external writes.', diff: null },
  { id: 2, agent: 'James',   dept: 'eng',  risk: 'H', intent: 'Push v1.2 to production.',
    why: 'All tests green for 42m. Requires approval per red tier.',
    diff: [ ['+', 'api/router.ts', '24 lines'], ['-', 'api/router.ts', '9 lines'], ['~', 'config/deploy.yaml', '3 lines'] ] },
  { id: 3, agent: 'Sarah',   dept: 'mktg', risk: 'M', intent: 'Send launch email to 2,340 subscribers.',
    why: 'Targeting \u201cwaitlist: dormant 30d\u201d. Copy reviewed by Kai.',
    diff: [ ['subject', 'You asked us to build it. We did.'], ['from', 'noel@anton.computer'], ['audience', '2,340 contacts'] ] },
  { id: 4, agent: 'Riley',   dept: 'mktg', risk: 'L', intent: 'Schedule 4 X posts across Thu\u2013Sun.', why: null, diff: null },
  { id: 5, agent: 'Priya',   dept: 'data', risk: 'L', intent: 'Rebuild weekly retention cohort.', why: null, diff: null },
];

const MEMORIES = [
  { type: 'preference', title: 'Noel prefers bullet summaries over prose in briefings.', src: 'Slack \u2022 Mar 3', hl: 'yellow', conf: 3 },
  { type: 'decision',   title: 'Use Qwen3 8B for local; Claude only for deep research.',  src: 'Settings \u2022 Feb 19', hl: 'coral',  conf: 3 },
  { type: 'fact',       title: 'Stripe subscription renews on the 14th of each month.',   src: 'Diana \u2022 Mar 14',  hl: 'blue',   conf: 3 },
  { type: 'decision',   title: 'Deploys after 6pm require explicit approval.',             src: 'James \u2022 Mar 28',  hl: 'coral',  conf: 2 },
  { type: 'preference', title: 'Do not use emoji in customer-facing copy.',                src: 'Sarah \u2022 Feb 2',   hl: 'yellow', conf: 3 },
  { type: 'conversation', title: 'Debrief on Q1 launch \u2014 pivot to creator tier.',      src: 'Voice \u2022 Apr 3',   hl: 'blue',   conf: 2 },
  { type: 'fact',       title: 'Mac Studio arriving Apr 22.',                              src: 'Calendar \u2022 Apr 1','hl': 'yellow', conf: 3 },
];

const ACTIVITY = [
  { t: '14:02:17', agent: 'Marcus',  type: 'tool',     text: 'read_file(\u2019specs/onboarding.md\u2019)', detail: '1,204 bytes \u2022 12ms' },
  { t: '14:02:18', agent: 'Marcus',  type: 'think',    text: 'Planning PRD outline: 6 sections, 2 open questions.', detail: null },
  { t: '14:01:54', agent: 'Ada',     type: 'write',    text: 'Edited components/Sidebar.tsx', detail: '+48 -12' },
  { t: '14:01:30', agent: 'Kai',     type: 'search',   text: 'query: \u201claptop-class local llm\u201d', detail: '43 results' },
  { t: '14:00:12', agent: 'Priya',   type: 'tool',     text: 'run_sql(\u201cSELECT cohort...\u201d)', detail: '0.82s \u2022 714 rows' },
  { t: '13:58:44', agent: 'Sarah',   type: 'handoff',  text: '\u2192 Kai: review launch copy for SEO tone', detail: null },
  { t: '13:57:02', agent: 'Felix',   type: 'complete', text: 'Completed: \u201cAdd rate-limit middleware\u201d', detail: '3 commits' },
  { t: '13:55:19', agent: 'James',   type: 'approval', text: 'Requested approval: deploy v1.2', detail: 'pending' },
  { t: '13:54:00', agent: 'Anton',   type: 'system',   text: 'Daily briefing generated', detail: '8 items' },
];

function DeptChip({ id, size = 'sm' }) {
  const d = DEPARTMENTS.find(x => x.id === id); if (!d) return null;
  const pad = size === 'sm' ? '2px 6px' : '3px 8px';
  const fs  = size === 'sm' ? 10 : 11;
  return (
    <span className="mono" style={{
      display:'inline-flex', alignItems:'center', gap:5, padding:pad, fontSize:fs,
      textTransform:'uppercase', letterSpacing:'0.08em',
      border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)',
      color:'var(--text-secondary)', background:'transparent',
    }}>
      <span style={{ width:6, height:6, borderRadius:2, background:d.color }}/>
      {d.name}
    </span>
  );
}

function TrustBadge({ tier }) {
  const map = {
    green: { c: 'var(--ok)',    l: 'AUTO'    },
    amber: { c: 'var(--work)',  l: 'CONFIRM' },
    red:   { c: 'var(--error)', l: 'MANUAL'  },
  };
  const s = map[tier] || map.amber;
  return (
    <span className="mono" title={`Trust tier: ${s.l}`} style={{
      display:'inline-flex', alignItems:'center', gap:5, fontSize:10, color: s.c,
      letterSpacing:'0.12em',
    }}>
      <span style={{ width:8, height:8, borderRadius:2, background:s.c, opacity:.9 }}/>
      {s.l}
    </span>
  );
}

function StatusGlow({ s }) {
  const map = {
    idle:     { c: 'var(--text-tertiary)', pulse:false },
    working:  { c: 'var(--work)',          pulse:true  },
    complete: { c: 'var(--ok)',            pulse:false },
    error:    { c: 'var(--error)',         pulse:false },
  };
  const st = map[s];
  return (
    <span className={st.pulse ? 'pulse' : ''} style={{
      display:'inline-block', width:8, height:8, borderRadius:'50%',
      background: st.c, boxShadow: `0 0 8px ${st.c}`, opacity: st.pulse ? .9 : .75,
    }}/>
  );
}

function RiskPip({ r }) {
  const m = { L: { c:'var(--text-secondary)', l:'LOW' }, M: { c:'var(--work)', l:'MED' }, H: { c:'var(--error)', l:'HIGH' } };
  const s = m[r];
  return <span className="mono" style={{ fontSize:10, color:s.c, letterSpacing:'0.1em' }}>{s.l}</span>;
}

function Kbd({ children }) {
  return <kbd className="mono" style={{
    display:'inline-block', padding:'1px 5px', fontSize:11, lineHeight:1.3,
    background:'var(--bg-hover)', border:'1px solid var(--border-default)',
    borderRadius:4, color:'var(--text-secondary)', minWidth:16, textAlign:'center',
  }}>{children}</kbd>;
}

Object.assign(window, {
  DEPARTMENTS, AGENTS, APPROVALS, MEMORIES, ACTIVITY,
  DeptChip, TrustBadge, StatusGlow, RiskPip, Kbd,
});

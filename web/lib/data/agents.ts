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

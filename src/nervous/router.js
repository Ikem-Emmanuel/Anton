// ─── Smart Router ────────────────────────────────────────────
// Routes messages to the right team member

import { findByName, getDeptLead, TEAM } from '../brain/team.js';

const CHANNEL_TO_DEPT = {
  'anton-engineering': 'eng',
  'anton-pull-requests': 'eng',
  'anton-qa-results': 'eng',
  'anton-deployments': 'eng',
  'anton-sprint-updates': 'eng',
  'anton-feature-requests': 'eng',
  'anton-marketing': 'mktg',
  'anton-seo': 'seo',
  'anton-automation': 'auto',
  'anton-data': 'data',
  'anton-growth': 'growth',
  'anton-standup': 'coord',
  'anton-blockers': 'all',
  'anton-cross-dept': 'all',
  dm: 'all', // DMs default to cross-dept routing
};

const ROLE_PATTERNS = [
  { pattern: /\b(frontend|front[- ]end|ui|react component|next\.?js page|css|tailwind|shadcn)/i, person: 'elena' },
  { pattern: /\b(backend|back[- ]end|api|endpoint|route|fastify|server|database|sql|migration)/i, person: 'james' },
  { pattern: /\b(mobile|ios|android|react native|expo)/i, person: 'kai' },
  { pattern: /\b(qa|test|coverage|bug|e2e|playwright|vitest)/i, person: 'priya' },
  { pattern: /\b(devops|deploy|ci[/-]?cd|pipeline|docker|pm2|infra|staging|production)/i, person: 'omar' },
  { pattern: /\b(sprint|backlog|asana|user stor|epic|velocity|roadmap|priorit)/i, person: 'sarah' },
  { pattern: /\b(pr|pull request|code review|review my|merge)/i, person: 'marcus' },
  { pattern: /\b(blog|article|landing page|copywriting|content writ)/i, person: 'alex' },
  { pattern: /\b(social media|twitter|linkedin|instagram)/i, person: 'mia' },
  { pattern: /\b(email market|newsletter|drip)/i, person: 'lucas' },
  { pattern: /\b(brand|marketing strat|campaign plan)/i, person: 'diana' },
  { pattern: /\b(seo audit|core web vital|crawl|sitemap)/i, person: 'nina' },
  { pattern: /\b(keyword|search intent|content brief)/i, person: 'raj' },
  { pattern: /\b(serp|ranking|backlink|organic)/i, person: 'yuki' },
  { pattern: /\b(sql|query|report|dashboard|metric)/i, person: 'ben' },
  { pattern: /\b(machine learning|ml model|train|predict)/i, person: 'iris' },
  { pattern: /\b(etl|data pipeline|schema|warehouse)/i, person: 'carlos' },
  { pattern: /\b(tracking plan|event taxonom|gtm|ga4)/i, person: 'sam' },
  { pattern: /\b(attribution|incrementality|mmm|capi)/i, person: 'leo' },
  { pattern: /\b(a\/?b test|experiment|sample size)/i, person: 'maya' },
  { pattern: /\b(segment|cohort|rfm|campaign perf)/i, person: 'dante' },
  { pattern: /\b(kpi|cac|ltv|roas|retention|growth strat)/i, person: 'nadia' },
  { pattern: /\b(github action|cron|workflow auto)/i, person: 'zara' },
  { pattern: /\b(webhook|integrat|connector)/i, person: 'theo' },
  { pattern: /\b(automat|process auto)/i, person: 'felix' },
  { pattern: /\b(data strat|data architect)/i, person: 'ada' },
];

// Returns a team member, or null if the message is ambiguous (caller should ask for clarification)
export function route(text, channelName) {
  const dept = CHANNEL_TO_DEPT[channelName] ?? 'eng';

  // 1. Direct address at message start — "Riley, ..." / "Hey James, ..." / "James:"
  for (const member of Object.values(TEAM)) {
    if (new RegExp(`^(?:hey\\s+)?${member.name}[,!:]`, 'i').test(text)) return member;
  }

  // 2. Explicit delegation — "ask James", "ping Marcus", "loop in Elena", "tell Omar"
  for (const member of Object.values(TEAM)) {
    if (
      new RegExp(`\\b(?:ask|tell|ping|get|have|cc|loop\\s+in|notify|message|contact)\\s+${member.name}\\b`, 'i').test(
        text
      )
    )
      return member;
  }

  // 3. Keyword patterns (role-based routing)
  for (const rule of ROLE_PATTERNS) {
    if (rule.pattern.test(text)) return findByName(rule.person) || getDeptLead(dept);
  }

  // 4. Standup / status → always Riley (cross-dept coordinator)
  if (/\b(standup|stand-up|daily update|daily brief|status update|what.?s happening|how.?s the team)\b/i.test(text)) {
    return findByName('riley');
  }

  // 5. Team/general
  if (/\b(team|everyone|introduce|who is|who are|member|people)\b/i.test(text)) {
    return getDeptLead(['all', 'coord'].includes(dept) ? 'eng' : dept);
  }

  // 6. Ambiguity check — if 2+ names are mentioned with no strong keyword context, return null
  const mentionedAgents = Object.values(TEAM).filter((m) => new RegExp(`\\b${m.name}\\b`, 'i').test(text));
  if (mentionedAgents.length >= 2) return null;

  // 7. Default dept lead (coord → Riley, all → Marcus)
  if (dept === 'coord') return getDeptLead('coord');
  return getDeptLead(dept === 'all' ? 'eng' : dept);
}

export function isEveryoneRequest(text) {
  return /\b(every\s*(one|body|member|team\s*member)|all\s*(of\s*you|agents|members|team)|each\s*(of\s*you|person|member)|introduce\s*(your|them)sel(f|ves)|take\s*turns)\b/i.test(
    text
  );
}

export function detectCollaboration(text) {
  const match = text.match(/\b(\w+),?\s*(ask|check with|talk to|consult)\s+(\w+)\s+(about|regarding|on)\s+(.+)/i);
  if (match) {
    const from = findByName(match[1]);
    const to = findByName(match[3]);
    if (from && to) return { from, to, topic: match[5] };
  }
  return null;
}

export function detectReviewRequest(text) {
  // "Priya, review James's PR" or "review the backend changes"
  const match = text.match(/\b(\w+),?\s*(review|check|qa|look at)\s+(.*)/i);
  if (match) {
    const reviewer = findByName(match[1]);
    if (reviewer) return { reviewer, subject: match[3] };
  }
  return null;
}

export function channelToDept(channelName) {
  return CHANNEL_TO_DEPT[channelName] ?? 'eng';
}

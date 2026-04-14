// ─── Team Directory ──────────────────────────────────────────
// Single source of truth for all team members

// Base tools everyone gets
const BASE_TOOLS = ['Read', 'Grep', 'Glob'];
// Tools for agents who write code
const DEV_TOOLS = [...BASE_TOOLS, 'Bash', 'Write', 'Edit', 'SendMessage'];
// Tools for leads who plan but don't code
const LEAD_TOOLS = [...BASE_TOOLS, 'Bash', 'SendMessage'];
// Asana MCP tools for task management
const ASANA_TOOLS = [
  'mcp__claude_ai_Asana__get_tasks',
  'mcp__claude_ai_Asana__get_task',
  'mcp__claude_ai_Asana__create_task_preview',
  'mcp__claude_ai_Asana__create_task_confirm',
  'mcp__claude_ai_Asana__update_tasks',
  'mcp__claude_ai_Asana__get_project',
  'mcp__claude_ai_Asana__get_projects',
  'mcp__claude_ai_Asana__search_tasks_preview',
  'mcp__claude_ai_Asana__search_objects',
  'mcp__claude_ai_Asana__get_me',
  'mcp__claude_ai_Asana__add_comment',
];

export const TEAM = {
  // Engineering
  marcus:  { name: 'Marcus',  title: 'Tech Lead',        dept: 'eng',    agent: 'eng--tech-lead',              tools: [...LEAD_TOOLS, ...ASANA_TOOLS],  canCode: false, canPlan: true },
  sarah:   { name: 'Sarah',   title: 'Product Manager',  dept: 'eng',    agent: 'eng--product-owner',          tools: [...LEAD_TOOLS, ...ASANA_TOOLS],  canCode: false, canPlan: true },
  james:   { name: 'James',   title: 'Backend Dev',      dept: 'eng',    agent: 'eng--backend-developer',      tools: [...DEV_TOOLS, ...ASANA_TOOLS],   canCode: true,  canPlan: false },
  elena:   { name: 'Elena',   title: 'Frontend Dev',     dept: 'eng',    agent: 'eng--frontend-developer',     tools: [...DEV_TOOLS, ...ASANA_TOOLS],   canCode: true,  canPlan: false },
  kai:     { name: 'Kai',     title: 'Mobile Dev',       dept: 'eng',    agent: 'eng--mobile-developer',       tools: [...DEV_TOOLS, ...ASANA_TOOLS],   canCode: true,  canPlan: false },
  priya:   { name: 'Priya',   title: 'QA Engineer',      dept: 'eng',    agent: 'eng--qa-engineer',            tools: [...DEV_TOOLS, ...ASANA_TOOLS],   canCode: false, canPlan: false, canReview: true },
  omar:    { name: 'Omar',    title: 'DevOps',           dept: 'eng',    agent: 'eng--devops-engineer',        tools: [...DEV_TOOLS, ...ASANA_TOOLS],   canCode: true,  canPlan: false },
  // Marketing
  diana:   { name: 'Diana',   title: 'CMO',              dept: 'mktg',   agent: 'mktg--cmo',                   tools: [...LEAD_TOOLS, ...ASANA_TOOLS],  canCode: false, canPlan: true },
  alex:    { name: 'Alex',    title: 'Content Writer',   dept: 'mktg',   agent: 'mktg--content-writer',        tools: [...BASE_TOOLS, 'Write', 'Edit'], canCode: false, canPlan: false },
  mia:     { name: 'Mia',     title: 'Social Media',     dept: 'mktg',   agent: 'mktg--social-media-manager',  tools: [...BASE_TOOLS, 'Write'],         canCode: false, canPlan: false },
  lucas:   { name: 'Lucas',   title: 'Email Marketing',  dept: 'mktg',   agent: 'mktg--email-marketing',       tools: [...BASE_TOOLS, 'Write'],         canCode: false, canPlan: false },
  // SEO
  nina:    { name: 'Nina',    title: 'SEO Lead',         dept: 'seo',    agent: 'seo--seo-lead',               tools: [...LEAD_TOOLS, ...ASANA_TOOLS],  canCode: false, canPlan: true },
  raj:     { name: 'Raj',     title: 'Content SEO',      dept: 'seo',    agent: 'seo--content-seo',            tools: [...BASE_TOOLS, 'Write'],         canCode: false, canPlan: false },
  yuki:    { name: 'Yuki',    title: 'SEO Analytics',    dept: 'seo',    agent: 'seo--seo-analytics',          tools: [...BASE_TOOLS],                  canCode: false, canPlan: false },
  // Automation
  felix:   { name: 'Felix',   title: 'Automation Lead',  dept: 'auto',   agent: 'auto--automation-lead',       tools: [...DEV_TOOLS, ...ASANA_TOOLS],   canCode: true,  canPlan: true },
  zara:    { name: 'Zara',    title: 'Workflows',        dept: 'auto',   agent: 'auto--workflow-agent',        tools: [...DEV_TOOLS],                   canCode: true,  canPlan: false },
  theo:    { name: 'Theo',    title: 'Integrations',     dept: 'auto',   agent: 'auto--integration-agent',     tools: [...DEV_TOOLS],                   canCode: true,  canPlan: false },
  // Data
  ada:     { name: 'Ada',     title: 'Data Lead',        dept: 'data',   agent: 'data--data-lead',             tools: [...LEAD_TOOLS, ...ASANA_TOOLS],  canCode: false, canPlan: true },
  ben:     { name: 'Ben',     title: 'Data Analyst',     dept: 'data',   agent: 'data--data-analyst',          tools: [...BASE_TOOLS, 'Bash'],          canCode: false, canPlan: false },
  iris:    { name: 'Iris',    title: 'ML Engineer',      dept: 'data',   agent: 'data--ml-engineer',           tools: [...DEV_TOOLS],                   canCode: true,  canPlan: false },
  carlos:  { name: 'Carlos',  title: 'Data Engineer',    dept: 'data',   agent: 'data--data-engineer',         tools: [...DEV_TOOLS],                   canCode: true,  canPlan: false },
  // Growth
  nadia:   { name: 'Nadia',   title: 'Growth Lead',      dept: 'growth', agent: 'growth--growth-lead',         tools: [...LEAD_TOOLS, ...ASANA_TOOLS],  canCode: false, canPlan: true },
  sam:     { name: 'Sam',     title: 'Tracking',         dept: 'growth', agent: 'growth--tracking-taxonomy-agent', tools: [...BASE_TOOLS, 'Write'],     canCode: false, canPlan: false },
  leo:     { name: 'Leo',     title: 'Attribution',      dept: 'growth', agent: 'growth--attribution-agent',   tools: [...BASE_TOOLS, 'Write'],         canCode: false, canPlan: false },
  maya:    { name: 'Maya',    title: 'Experiments',      dept: 'growth', agent: 'growth--experimentation-agent', tools: [...BASE_TOOLS, 'Write'],       canCode: false, canPlan: false },
  dante:   { name: 'Dante',   title: 'Campaigns',        dept: 'growth', agent: 'growth--campaign-segmentation-agent', tools: [...BASE_TOOLS, 'Write'], canCode: false, canPlan: false },
  // Coordination
  riley:   { name: 'Riley',   title: 'Scrum Master',     dept: 'coord',  agent: 'scrum-master',                tools: [...LEAD_TOOLS, ...ASANA_TOOLS],  canCode: false, canPlan: true },
};

export const DEPT_LEADS = { eng: 'marcus', mktg: 'diana', seo: 'nina', auto: 'felix', data: 'ada', growth: 'nadia', coord: 'riley' };

export function findByName(name) {
  const lower = name.toLowerCase();
  return Object.values(TEAM).find(m => m.name.toLowerCase() === lower) || null;
}

export function getDeptMembers(dept) {
  if (dept === 'all') return Object.values(TEAM);
  return Object.values(TEAM).filter(m => m.dept === dept);
}

export function getDeptLead(dept) {
  const key = DEPT_LEADS[dept] ?? 'marcus';
  return TEAM[key];
}

// ─── Handoff allowlist ───────────────────────────────────────
// Declares which agents are permitted to dispatch work to which other agents.
// An agent NOT in this map cannot initiate handoffs at all.
// Any target NOT in an agent's array is blocked even if their name appears in a response.
export const HANDOFF_RULES = {
  // Anton (PA) — can reach EVERYONE. Anton is the operating system layer.
  Anton: ['Marcus', 'Sarah', 'James', 'Elena', 'Kai', 'Priya', 'Omar', 'Riley', 'Diana', 'Alex', 'Mia', 'Lucas', 'Nina', 'Raj', 'Yuki', 'Felix', 'Zara', 'Theo', 'Ada', 'Ben', 'Iris', 'Carlos', 'Nadia', 'Sam', 'Leo', 'Maya', 'Dante'],
  // Engineering
  Marcus: ['James', 'Elena', 'Kai', 'Omar', 'Priya', 'Sarah', 'Riley', 'Diana', 'Ada', 'Nadia', 'Nina', 'Felix'],
  Sarah:  ['James', 'Elena', 'Kai', 'Omar', 'Priya', 'Marcus', 'Riley'],
  James:  ['Marcus', 'Priya', 'Omar', 'Riley'],
  Elena:  ['Marcus', 'Priya', 'Riley'],
  Kai:    ['Marcus', 'Priya', 'Omar', 'Riley'],
  Priya:  ['Marcus', 'James', 'Elena', 'Kai', 'Riley'],
  Omar:   ['Marcus', 'Riley'],
  // Coordinator
  Riley:  ['Marcus', 'Sarah', 'Diana', 'Nina', 'Felix', 'Ada', 'Nadia'],
  // Marketing
  Diana:  ['Alex', 'Mia', 'Lucas', 'Riley', 'Marcus'],
  Alex:   ['Diana', 'Riley'],
  Mia:    ['Diana', 'Riley'],
  Lucas:  ['Diana', 'Riley'],
  // SEO
  Nina:   ['Raj', 'Yuki', 'Riley', 'Diana'],
  Raj:    ['Nina', 'Riley'],
  Yuki:   ['Nina', 'Riley'],
  // Automation
  Felix:  ['Zara', 'Theo', 'Riley', 'Marcus'],
  Zara:   ['Felix', 'Riley'],
  Theo:   ['Felix', 'Riley'],
  // Data
  Ada:    ['Ben', 'Iris', 'Carlos', 'Riley', 'Marcus'],
  Ben:    ['Ada', 'Riley'],
  Iris:   ['Ada', 'Riley'],
  Carlos: ['Ada', 'Riley'],
  // Growth
  Nadia:  ['Sam', 'Leo', 'Maya', 'Dante', 'Riley', 'Marcus'],
  Sam:    ['Nadia', 'Riley'],
  Leo:    ['Nadia', 'Riley'],
  Maya:   ['Nadia', 'Riley'],
  Dante:  ['Nadia', 'Riley'],
};

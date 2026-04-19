// V1 team directory — delegates to the unified agent roster in config/agents/.
// Before the unification this file had 27 agent records inline that duplicated
// personality/title/tools data with config/personas.json and src/brain/personas.ts.
// Now TEAM is built from the same source the V2 brain reads — single source of
// truth. HANDOFF_RULES stays here since it's V1-specific routing policy, not
// agent identity.

import { AGENTS_BY_ID, ALL_AGENTS, DEPT_LEADS as UNIFIED_DEPT_LEADS } from '../../config/agents/index.js';

// Build TEAM keyed by lowercase id, dropping fields V1 doesn't read. V1 consumers
// expect `{name, title, dept, agent, tools, canCode, canPlan, canReview?}`.
function toV1Member(a) {
  const v1 = {
    name: a.name,
    title: a.title,
    dept: a.dept,
    agent: a.agentId,
    tools: a.tools,
    canCode: a.canCode,
    canPlan: a.canPlan,
  };
  if (a.canReview) v1.canReview = a.canReview;
  return v1;
}

export const TEAM = Object.fromEntries(
  // V1 TEAM has never included Anton — keep that contract.
  ALL_AGENTS.filter((a) => a.id !== 'anton').map((a) => [a.id, toV1Member(a)])
);

export const DEPT_LEADS = UNIFIED_DEPT_LEADS;

export function findByName(name) {
  const lower = name.toLowerCase();
  return Object.values(TEAM).find((m) => m.name.toLowerCase() === lower) || null;
}

export function getDeptMembers(dept) {
  if (dept === 'all') return Object.values(TEAM);
  return Object.values(TEAM).filter((m) => m.dept === dept);
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
  Anton: AGENTS_BY_ID.anton ? ALL_AGENTS.filter((a) => a.id !== 'anton').map((a) => a.name) : [],
  // Engineering
  Marcus: ['James', 'Elena', 'Kai', 'Omar', 'Priya', 'Sarah', 'Riley', 'Diana', 'Ada', 'Nadia', 'Nina', 'Felix'],
  Sarah: ['James', 'Elena', 'Kai', 'Omar', 'Priya', 'Marcus', 'Riley'],
  James: ['Marcus', 'Sarah', 'Elena', 'Kai', 'Priya', 'Omar', 'Riley'],
  Elena: ['Marcus', 'Sarah', 'James', 'Kai', 'Priya', 'Omar', 'Riley'],
  Kai: ['Marcus', 'Sarah', 'James', 'Elena', 'Priya', 'Omar', 'Riley'],
  Priya: ['Marcus', 'Sarah', 'James', 'Elena', 'Kai', 'Omar', 'Riley'],
  Omar: ['Marcus', 'Sarah', 'James', 'Elena', 'Kai', 'Priya', 'Riley'],
  // Coordinator
  Riley: ['Marcus', 'Sarah', 'Diana', 'Nina', 'Felix', 'Ada', 'Nadia'],
  // Marketing
  Diana: ['Alex', 'Mia', 'Lucas', 'Riley', 'Marcus'],
  Alex: ['Diana', 'Riley'],
  Mia: ['Diana', 'Riley'],
  Lucas: ['Diana', 'Riley'],
  // SEO
  Nina: ['Raj', 'Yuki', 'Riley', 'Diana'],
  Raj: ['Nina', 'Riley'],
  Yuki: ['Nina', 'Riley'],
  // Automation
  Felix: ['Zara', 'Theo', 'Riley', 'Marcus'],
  Zara: ['Felix', 'Riley'],
  Theo: ['Felix', 'Riley'],
  // Data
  Ada: ['Ben', 'Iris', 'Carlos', 'Riley', 'Marcus'],
  Ben: ['Ada', 'Riley'],
  Iris: ['Ada', 'Riley'],
  Carlos: ['Ada', 'Riley'],
  // Growth
  Nadia: ['Sam', 'Leo', 'Maya', 'Dante', 'Riley', 'Marcus'],
  Sam: ['Nadia', 'Riley'],
  Leo: ['Nadia', 'Riley'],
  Maya: ['Nadia', 'Riley'],
  Dante: ['Nadia', 'Riley'],
};

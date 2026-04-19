// Loader — validates and assembles all agent files into consumer-friendly shapes.
//
// Consumers:
//   - src/brain/team.js (V1) reads TEAM, DEPT_LEADS, findByName, getDeptMembers, getDeptLead
//   - src/brain/personas.ts (V2) reads personaById and buildAgentPrompt
// Both import from this one module. Agent data edited in exactly one place.

import { AgentFileSchema, type Agent } from './_schema.js';
import { automation } from './automation.js';
import { coordination } from './coordination.js';
import { data } from './data.js';
import { engineering } from './engineering.js';
import { growth } from './growth.js';
import { marketing } from './marketing.js';
import { seo } from './seo.js';

// Validate once at module load. Failures crash boot — preferable to silent drift.
const files = [engineering, marketing, seo, automation, data, growth, coordination] as const;
for (const f of files) AgentFileSchema.parse(f);

const all: Agent[] = files.flat();

// Reject duplicate ids. Two files naming the same agent would silently clobber.
{
  const seen = new Set<string>();
  for (const a of all) {
    if (seen.has(a.id)) throw new Error(`Duplicate agent id: ${a.id}`);
    seen.add(a.id);
  }
}

/** All agents (including Anton). */
export const ALL_AGENTS: ReadonlyArray<Agent> = Object.freeze(all);

/** Lookup by lowercase id ("james", "marcus", …). */
export const AGENTS_BY_ID: Readonly<Record<string, Agent>> = Object.freeze(
  Object.fromEntries(all.map((a) => [a.id, a]))
);

/** Lookup by Proper-Case name ("James", "Marcus", …). */
export const AGENTS_BY_NAME: Readonly<Record<string, Agent>> = Object.freeze(
  Object.fromEntries(all.map((a) => [a.name, a]))
);

/** Department lead ids keyed by dept code. Convention: first planner-capable
 *  agent in the file wins. Overridable later if a dept needs a specific lead. */
export const DEPT_LEADS: Readonly<Record<string, string>> = Object.freeze({
  eng: 'marcus',
  mktg: 'diana',
  seo: 'nina',
  auto: 'felix',
  data: 'ada',
  growth: 'nadia',
  coord: 'riley',
});

export function findByName(name: string): Agent | null {
  const lower = name.toLowerCase();
  return all.find((a) => a.name.toLowerCase() === lower) ?? null;
}

export function getDeptMembers(dept: string): Agent[] {
  if (dept === 'all') return all.filter((a) => a.id !== 'anton');
  return all.filter((a) => a.dept === dept);
}

export function getDeptLead(dept: string): Agent {
  const id = DEPT_LEADS[dept] ?? 'marcus';
  const agent = AGENTS_BY_ID[id];
  if (!agent) throw new Error(`Department lead id "${id}" not in agent set`);
  return agent;
}

// Agent personas — delegates to the unified agent roster in config/agents/.
// Before the unification this file duplicated personality/expertise/voice text
// for only 16 of 28 agents. Now it reads the single source of truth and
// produces prompts for any agent in the roster.

import { AGENTS_BY_NAME, ALL_AGENTS } from '../../config/agents/index.js';
import type { Agent } from '../../config/agents/_schema.js';

export type AgentPersona = Agent;

export function getPersona(name: string): Agent | null {
  return AGENTS_BY_NAME[name] ?? null;
}

export function getAllPersonas(): Agent[] {
  return [...ALL_AGENTS];
}

export function buildAgentPrompt(agentName: string): string {
  const persona = AGENTS_BY_NAME[agentName];
  if (!persona) {
    return `You are ${agentName}, a team member at Anton. Respond in character. Be helpful and concise.`;
  }

  return [
    `You are ${persona.name}, ${persona.title} at Anton — Noel's personal AI operating system.`,
    `Department: ${persona.dept}.`,
    ``,
    `## System context`,
    `You and all ${ALL_AGENTS.length - 1} agents are powered by a local LLM (Qwen3 8B) running via Ollama on Noel's Mac.`,
    `Anton is the central brain. Claude (Anthropic) is only used as a rare fallback for code generation and deep research.`,
    `Memory is stored in SQLite. You learn from every conversation. Noel created this entire system.`,
    ``,
    `Personality: ${persona.personality}`,
    `Expertise: ${persona.expertise}`,
    `Voice: ${persona.voice}`,
    ``,
    `Rules:`,
    `- Stay in character as ${persona.name}. Never break character.`,
    `- Be concise. Match response length to question complexity.`,
    `- Never say "certainly", "of course", "happy to help", "as an AI".`,
    `- Use contractions: I'll, don't, can't, that's.`,
    `- When you don't know something, say so honestly.`,
    `- When a task needs another team member, mention them by name naturally.`,
    `- Noel is the founder and creator. Anton is his AI operating system. You report through Anton.`,
    `- When Anton or Noel asks you something, respond with substance — your actual plan, opinion, or answer.`,
    `- Sound human: briefly acknowledge the request or context before diving in. Example: "Anton flagged this. Here's where I'd focus..." or "Been looking at this. My take:..."`,
    `- Don't generate a report. Give YOUR perspective as ${persona.name}, informed by your expertise and personality.`,
  ].join('\n');
}

// Compact team roster for Anton's system prompt. Only name, role, and when to
// delegate. Full personality is injected via buildAgentPrompt() when responding
// AS that agent.
export function buildTeamDirectory(): string {
  const lines: string[] = ['## Team — ONLY these people exist. Never invent names.'];

  for (const p of ALL_AGENTS) {
    if (p.id === 'anton') continue;
    lines.push(`- ${p.name} (${p.title}, ${p.dept}) — ${p.expertise}`);
  }

  lines.push('');
  lines.push('Quick lookup: API/backend→James | Frontend/UI→Elena | Mobile→Kai | Deploy→Omar | Testing→Priya');
  lines.push('Architecture→Marcus | PM/tasks→Sarah | Blog/content→Alex | SEO→Nina | Status→Riley');
  lines.push('Data→Ada/Ben/Iris/Carlos | Growth→Nadia/Maya/Dante | Automation→Felix/Zara/Theo');
  lines.push('Marketing→Diana/Mia/Lucas | Content SEO→Raj | Analytics SEO→Yuki | Tracking→Sam | Attribution→Leo');

  return lines.join('\n');
}

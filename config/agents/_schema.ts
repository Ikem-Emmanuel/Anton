// Unified agent schema — single source of truth used by both V1 (Claude Agent
// SDK) and V2 (local brain) paths. Before this module existed, agent data was
// split across three places: src/brain/team.js (V1 TEAM + tools), V1
// config/personas.json (personality + slack_style + background), and
// src/brain/personas.ts (V2 personality + voice). Every change needed three
// edits and V2 had 12 fewer agents than V1. One file per department here,
// one schema, one loader.

import { z } from 'zod';

export const DepartmentSchema = z.enum(['eng', 'mktg', 'seo', 'data', 'growth', 'auto', 'coord', 'core']);
export type Department = z.infer<typeof DepartmentSchema>;

export const AgentSchema = z.object({
  // Lowercase key used throughout — TEAM['james'], personas['James'], etc.
  id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'id must be lowercase alphanumeric with hyphens'),

  // Display name (Proper Case). Used in prompts, Slack mentions, and handoff parsing.
  name: z.string().min(1),

  // Job title. Displayed in UI and team directories.
  title: z.string().min(1),

  // Department code. Must match DepartmentSchema.
  dept: DepartmentSchema,

  // Claude Agent SDK agent identifier (e.g., 'eng--backend-developer'). Null
  // for agents that don't have a V1 Claude Agent SDK counterpart (Anton).
  agentId: z.string().nullable(),

  // Tool grants for the V1 Claude SDK path. Empty array for agents that don't
  // execute through V1.
  tools: z.array(z.string()),

  // Capability flags used by V1 routing (team.js / handle.js) to decide if an
  // agent can be assigned coding, planning, or code-review work.
  canCode: z.boolean(),
  canPlan: z.boolean(),
  canReview: z.boolean().optional(),

  // Persona text used by both V1 (personas.json consumers) and V2
  // (brain/personas.ts consumers). Kept on one record so prompts never drift.
  personality: z.string().min(1),
  expertise: z.string().min(1),
  voice: z.string().min(1),

  // Optional — the V1 Claude path uses these for prompt-building; V2 doesn't.
  slackStyle: z.string().optional(),
  background: z.string().optional(),
  exampleResponses: z.record(z.string(), z.string()).optional(),
});
export type Agent = z.infer<typeof AgentSchema>;

export const AgentFileSchema = z.array(AgentSchema);
export type AgentFile = z.infer<typeof AgentFileSchema>;

// Pre-computed tool grant bundles. Keeps the per-agent files short — they
// reference these by name rather than spelling out 11 Asana MCP tools each.
export const BASE_TOOLS = ['Read', 'Grep', 'Glob'] as const;
export const DEV_TOOLS = [...BASE_TOOLS, 'Bash', 'Write', 'Edit', 'SendMessage'] as const;
export const LEAD_TOOLS = [...BASE_TOOLS, 'Bash', 'SendMessage'] as const;
export const WRITER_TOOLS = [...BASE_TOOLS, 'Write'] as const;
export const ASANA_TOOLS = [
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
] as const;

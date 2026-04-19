// Skill extraction (Phase 3.5 §4.5.4 + §4.5.7).
//
// Runs after a turn completes with a `good` verdict. A cheap Qwen3 8B pass
// attempts to extract a reusable reasoning template: when the context looked
// like X, the successful approach was Y (steps, artifacts, pitfalls).
//
// Deduplication: if an existing non-deprecated skill for the same owner_agent
// matches the new candidate's context_pattern closely, we write the new skill
// with supersedes_id pointing at the prior one rather than creating a
// duplicate. The retrieval query already prefers higher-success skills, so
// the better approach naturally wins over time without needing a promotion
// cron.
//
// Fire-and-forget. Errors are logged, not thrown.

import { z } from 'zod';
import { chatJSON } from './ollama-client.js';
import { findSkillsByPattern, storeSkill } from '../memory/sqlite.js';

const CandidateSchema = z.object({
  title: z.string().min(5).max(80),
  context_pattern: z.string().min(10).max(300),
  steps: z.array(z.string().max(200)).min(2).max(6),
  artifacts_expected: z.array(z.string().max(100)).max(4).default([]),
  pitfalls: z.array(z.string().max(200)).max(4).default([]),
  worth_saving: z.boolean(),
});

type Candidate = z.infer<typeof CandidateSchema>;
const CANDIDATE_SCHEMA = z.toJSONSchema(CandidateSchema) as object;

const EXTRACT_PROMPT = `You read a completed agent task and extract a reusable REASONING TEMPLATE.

A reusable template is distinct from a fact. Facts describe what's true (bcrypt
uses work factor 12). Templates describe HOW a category of problem was solved
well (when given an auth flow, enumerate factors → pick primary+fallback →
decide session binding → add rate limits).

Only extract a template if ALL are true:
- The task is a recurring PATTERN (design, review, plan, deploy, debug — not
  a one-off acknowledgment)
- The agent's approach has reusable STEPS that would apply to a similar task
- The outcome clearly landed (the turn was judged good)

Return JSON matching the schema. If no reusable template is present, set
worth_saving=false and leave title/context_pattern/steps as minimal strings.

Be concrete:
- title: short verb-phrase like "Design JWT rotation flow"
- context_pattern: one-line description of the situation this applies to,
  grounded in observable signals ("planning an auth feature with MFA")
- steps: 2-6 concrete actions an agent could follow
- artifacts_expected: outputs produced (PRD, diff, test plan, etc.)
- pitfalls: known gotchas — things that make this approach fail`;

export interface SkillExtractOptions {
  model?: string;
  timeoutMs?: number;
  minExchangeLength?: number;
}

export interface SkillExtractStats {
  attempted: boolean;
  extracted: boolean;
  stored: boolean;
  skillId?: number;
  supersededId?: number;
  durationMs: number;
  error?: string;
}

export async function extractSkillCandidate(
  userMessage: string,
  agentResponse: string,
  agent: string,
  sourceTaskId?: string,
  options?: SkillExtractOptions
): Promise<SkillExtractStats> {
  const start = Date.now();
  const minLength = options?.minExchangeLength ?? 150;

  if (userMessage.length + agentResponse.length < minLength) {
    return { attempted: false, extracted: false, stored: false, durationMs: 0 };
  }

  const exchange = `User request: ${userMessage.slice(0, 2000)}

Agent (${agent}) response: ${agentResponse.slice(0, 2000)}`;

  let candidate: Candidate;
  try {
    const { data } = await chatJSON<Candidate>(exchange, {
      model: options?.model || 'qwen3:8b',
      system: EXTRACT_PROMPT,
      temperature: 0.1,
      maxTokens: 800,
      schema: CANDIDATE_SCHEMA,
      think: false,
      timeoutMs: options?.timeoutMs ?? 25_000,
    });
    candidate = CandidateSchema.parse(data);
  } catch (err) {
    return {
      attempted: true,
      extracted: false,
      stored: false,
      durationMs: Date.now() - start,
      error: (err as Error).message?.slice(0, 100) || 'extract failed',
    };
  }

  if (!candidate.worth_saving) {
    return { attempted: true, extracted: false, stored: false, durationMs: Date.now() - start };
  }

  // Supersede-or-add decision (§4.5.4): if we already have a skill for this
  // same context_pattern, link the new one via supersedes_id. Retrieval will
  // prefer the higher-success-rate skill automatically.
  let supersededId: number | undefined;
  try {
    const similar = findSkillsByPattern(candidate.context_pattern, agent);
    if (similar.length > 0) {
      supersededId = similar[0].id;
    }
  } catch {}

  let skillId: number;
  try {
    skillId = storeSkill({
      title: candidate.title,
      context_pattern: candidate.context_pattern,
      approach: {
        steps: candidate.steps,
        artifacts_expected: candidate.artifacts_expected,
        pitfalls: candidate.pitfalls,
      },
      owner_agent: agent,
      source_task_id: sourceTaskId,
      supersedes_id: supersededId,
    });
  } catch (err) {
    return {
      attempted: true,
      extracted: true,
      stored: false,
      durationMs: Date.now() - start,
      error: (err as Error).message?.slice(0, 100) || 'store failed',
    };
  }

  return {
    attempted: true,
    extracted: true,
    stored: true,
    skillId,
    supersededId,
    durationMs: Date.now() - start,
  };
}

// Outcome evaluation pass (Phase 3.5 §4.5.2).
//
// After every successful brain response, an async judge pass scores the
// output on 4 criteria and writes a verdict row to turn_evaluations.
// Good/bad verdicts feed §4.5.4 skill refinement and (later) Phase 6 DPO
// training data — no separate quality detector needed.
//
// Runs fire-and-forget. A judge timeout or parse failure falls through
// to a 'neutral' verdict rather than blocking anything.

import { z } from 'zod';
import { chatJSON } from './ollama-client.js';
import { storeTurnEvaluation } from '../memory/sqlite.js';

const EvalSchema = z.object({
  task_addressed: z.number().min(0).max(1),
  role_appropriate: z.number().min(0).max(1),
  hallucination_free: z.number().min(0).max(1),
  action_ready: z.number().min(0).max(1),
});

type EvalScores = z.infer<typeof EvalSchema>;
const EVAL_JSON_SCHEMA = z.toJSONSchema(EvalSchema) as object;

const JUDGE_PROMPT = `You are a quality judge for Anton's multi-agent outputs.

Given a user request and an agent's response, score each criterion 0.0 to 1.0:

- task_addressed: Does the response directly address what was asked?
  1.0 = fully addresses; 0.5 = partially; 0.0 = off-topic.
- role_appropriate: Is the output in line with the agent's role?
  (Backend dev: code/API discussion. QA: tests/bugs. PM: stories/scope.)
  1.0 = perfectly in-role; 0.0 = wrong role entirely.
- hallucination_free: Does the response avoid inventing libraries, APIs,
  teammate names, or facts not grounded in context?
  1.0 = fully grounded; 0.0 = contains clear invention.
- action_ready: Does the output produce something concrete (code, handoff,
  decision, artifact) vs vague prose?
  1.0 = actionable; 0.0 = entirely vague.

Return JSON matching the schema. No prose, just the object.`;

export type Verdict = 'good' | 'neutral' | 'bad';

export interface EvaluateResult {
  attempted: boolean;
  verdict?: Verdict;
  scores?: EvalScores;
  error?: string;
  durationMs: number;
}

export interface EvaluateOptions {
  model?: string;
  timeoutMs?: number;
  goodThreshold?: number;
  badThreshold?: number;
  minExchangeLength?: number;
}

function verdictFromScores(scores: EvalScores, good: number, bad: number): Verdict {
  const mean = (scores.task_addressed + scores.role_appropriate + scores.hallucination_free + scores.action_ready) / 4;
  if (mean >= good) return 'good';
  if (mean < bad) return 'bad';
  return 'neutral';
}

export async function evaluateTurn(
  conversationId: number,
  userMessage: string,
  agentResponse: string,
  agent: string,
  options?: EvaluateOptions
): Promise<EvaluateResult> {
  const start = Date.now();
  const minLength = options?.minExchangeLength ?? 60;
  const goodThresh = options?.goodThreshold ?? 0.8;
  const badThresh = options?.badThreshold ?? 0.6;

  // Skip trivial exchanges — the judge has nothing meaningful to score.
  if (userMessage.length + agentResponse.length < minLength) {
    return { attempted: false, durationMs: 0 };
  }

  const prompt = `User request: ${userMessage.slice(0, 1500)}

Agent (${agent}) response: ${agentResponse.slice(0, 1500)}`;

  try {
    const { data } = await chatJSON<EvalScores>(prompt, {
      model: options?.model || 'qwen3:8b',
      system: JUDGE_PROMPT,
      temperature: 0.1,
      maxTokens: 300,
      schema: EVAL_JSON_SCHEMA,
      think: false,
      timeoutMs: options?.timeoutMs ?? 20_000,
    });

    const scores = EvalSchema.parse(data);
    const verdict = verdictFromScores(scores, goodThresh, badThresh);

    try {
      storeTurnEvaluation({
        conversation_id: conversationId,
        verdict,
        task_addressed: scores.task_addressed,
        role_appropriate: scores.role_appropriate,
        hallucination_free: scores.hallucination_free,
        action_ready: scores.action_ready,
        implicit_signal: null,
      });
    } catch {
      // Storage failure — return the verdict so callers still get it
    }

    return {
      attempted: true,
      verdict,
      scores,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      attempted: true,
      error: (err as Error).message?.slice(0, 100) || 'unknown',
      durationMs: Date.now() - start,
    };
  }
}

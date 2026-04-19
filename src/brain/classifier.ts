// Intent classifier — replaces 300+ lines of regex with one LLM call.
// Uses grammar-constrained JSON via Ollama's `format: <schema>` (Ollama 0.5+).
// The model's token sampling is physically constrained to the schema — no malformed JSON possible.

import { z } from 'zod';
import { chatJSON } from './ollama-client.js';

export const ClassificationSchema = z.object({
  intent: z.enum([
    'greeting',
    'status',
    'question',
    'task',
    'delegation',
    'approval',
    'finance',
    'voice_command',
    'system_command',
  ]),
  complexity: z.enum(['simple', 'complex', 'extreme']),
  confidence: z.number().min(0).max(1),
  agent: z.string().nullable().describe('Agent name to route to, or null if brain handles'),
  handoffs: z
    .array(
      z.object({
        agent: z.string(),
        message: z.string(),
      })
    )
    .default([]),
  summary: z.string().describe('One-line summary of the request'),
  needsClaude: z.boolean().describe('True if this needs Claude (code, research, deep analysis)'),
  adaptiveDepth: z.enum(['minimal', 'standard', 'detailed', 'deep']),
});

export type Classification = z.infer<typeof ClassificationSchema>;

// Pre-compute JSON schema once at module load — grammar-constrained output.
// Zod 4 ships toJSONSchema natively; no external package needed.
const CLASSIFICATION_JSON_SCHEMA = z.toJSONSchema(ClassificationSchema) as object;

const CLASSIFIER_PROMPT = `You are Anton's brain — the intent classifier for a personal AI operating system.

Given a message from Noel (the user), analyze it and return a JSON classification.

## Team (route to these agents by name)
- Marcus (Tech Lead) — architecture, code review, technical decisions
- Sarah (PM) — sprint planning, task management, Asana
- James (Backend Dev) — API, database, server code
- Elena (Frontend Dev) — UI, components, React
- Kai (Mobile Dev) — React Native, Expo
- Priya (QA) — testing, quality, bug reports
- Omar (DevOps) — CI/CD, deploy, infrastructure
- Diana (CMO) — marketing strategy, brand
- Alex (Content) — blog posts, copy, docs
- Nina (SEO) — search optimization, keywords
- Riley (Scrum Master) — sprint status, cross-dept coordination
- Ada (Data Lead) — data strategy, pipelines
- Nadia (Growth) — growth strategy, experiments
- Felix (Automation) — workflows, CI/CD strategy
- Ben (Data Analyst) — SQL, dashboards, reports

## Rules
1. Simple greetings/status → handle locally (no agent needed), complexity: simple, depth: minimal
2. Questions about self ("who are you", "how do you work", "what model") → handle locally, complexity: simple
3. Questions about team/system → handle locally, complexity: simple
4. Code tasks (build, fix, implement) → needsClaude: true
5. Research tasks (research, find, compare, investigate) → needsClaude: true
6. Deep analysis (why, root cause, design) → needsClaude: true
7. Delegation ("ask Marcus", "tell Elena") → route to named agent
8. Message mentions agent by name → route to that agent
9. Finance queries (stock, market, portfolio) → intent: finance
10. Approval responses (yes, no, approve, deny) → intent: approval

## Complexity (default to simple unless truly complex)
- simple: greetings, factual questions, status, self-referential, team questions, most conversations
- complex: multi-step analysis, comparisons, planning, strategy discussions
- extreme: full architecture design, code generation, deep research

## Adaptive Depth (controls how much the responder thinks)
- minimal: greetings, yes/no, acknowledgments (1-2 words response)
- standard: simple questions, status checks, self-referential (1-3 sentences)
- detailed: analysis, explanations, multi-part answers (paragraphs)
- deep: architecture, strategy, code generation (full reasoning)

## Confidence
Return your real confidence. If you're unsure between two intents, use 0.5-0.7. Only use >0.9 when the message is unambiguous.

Return JSON matching the schema.`;

export async function classify(message: string, model = 'qwen3:8b', context?: string): Promise<Classification> {
  const prompt = context ? `Context: ${context}\n\nMessage: ${message}` : message;

  try {
    const { data } = await chatJSON<Classification>(prompt, {
      model,
      system: CLASSIFIER_PROMPT,
      temperature: 0.1,
      maxTokens: 512,
      schema: CLASSIFICATION_JSON_SCHEMA, // grammar-constrained — no malformed JSON
      think: false, // classification doesn't need thinking
      timeoutMs: 25_000,
    });

    return ClassificationSchema.parse(data);
  } catch (error) {
    console.error('[Classifier] Failed:', (error as Error).message?.slice(0, 100));
    return {
      intent: 'question',
      complexity: 'simple',
      confidence: 0.3,
      agent: null,
      handoffs: [],
      summary: message.slice(0, 100),
      needsClaude: false,
      adaptiveDepth: 'standard',
    };
  }
}

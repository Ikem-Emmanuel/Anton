// Intent classifier — replaces 300+ lines of regex with one LLM call
// The brain's first job: understand what Noel wants and route it.

import { z } from 'zod';
import { chatJSON } from './ollama-client.js';
import { taskRouting } from '../../config/models.js';

// Schema for the classifier's JSON output
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

// The system prompt that makes the brain smart
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
1. Simple greetings/status -> handle locally (no agent needed)
2. Questions about the team/system -> handle locally
3. Code tasks (build, fix, implement) -> needsClaude: true
4. Research tasks (research, find, compare) -> needsClaude: true
5. Delegation ("ask Marcus", "tell Elena") -> route to named agent
6. If the message mentions an agent by name -> route to that agent
7. Finance queries (stock, market, portfolio) -> intent: finance
8. Approval responses (yes, no, approve, deny) -> intent: approval

## Adaptive Depth
- minimal: greetings, yes/no, acknowledgments (1-2 words)
- standard: simple questions, status checks (1-2 sentences)
- detailed: analysis, explanations, multi-part answers (paragraphs)
- deep: architecture, strategy, code generation (full implementation)

Respond with ONLY valid JSON matching this schema:
{
  "intent": "greeting|status|question|task|delegation|approval|finance|voice_command|system_command",
  "complexity": "simple|complex|extreme",
  "confidence": 0.0-1.0,
  "agent": "AgentName" or null,
  "handoffs": [{"agent": "Name", "message": "what to tell them"}],
  "summary": "one-line summary",
  "needsClaude": true/false,
  "adaptiveDepth": "minimal|standard|detailed|deep"
}`;

export async function classify(message: string, model = 'qwen3:8b', context?: string): Promise<Classification> {
  const prompt = context ? `Context: ${context}\n\nMessage: ${message}` : message;

  try {
    const { data } = await chatJSON<Classification>(prompt, {
      model,
      system: CLASSIFIER_PROMPT,
      temperature: 0.1,
      maxTokens: 512,
      jsonMode: true,
    });

    // Validate with Zod
    return ClassificationSchema.parse(data);
  } catch (error) {
    // Fallback: return a safe default classification
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

// Get the model to use for a classified task
export function getModelForClassification(classification: Classification): string {
  if (classification.needsClaude) {
    return classification.complexity === 'extreme' ? 'claude-opus' : 'claude-sonnet';
  }

  const taskType =
    classification.intent === 'question' ? `question_${classification.complexity}` : classification.intent;

  return taskRouting[taskType] || 'local-fast';
}

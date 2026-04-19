// Memory distillation — runs asynchronously after each brain response.
// Extracts structured facts from a user-agent exchange and stores them in SQLite.
// Non-blocking: brain returns the response immediately; distillation runs in background.
//
// Quality > volume. Short exchanges skip distillation. Confidence < 0.5 drops silently.
// Maximum 5 facts per exchange. Stored with metadata so we can trace back which turn
// produced each memory.

import { z } from 'zod';
import { storeMemory } from '../memory/sqlite.js';
import { chatJSON } from './ollama-client.js';

const FactSchema = z.object({
  type: z.enum(['fact', 'decision', 'preference', 'commitment']),
  text: z.string().min(8).max(500),
  confidence: z.number().min(0).max(1),
});

const DistillationSchema = z.object({
  facts: z.array(FactSchema).max(5),
});

type DistillationResult = z.infer<typeof DistillationSchema>;

const DISTILLATION_JSON_SCHEMA = z.toJSONSchema(DistillationSchema) as object;

const DISTILL_PROMPT = `Extract memorable, structured facts from a user-agent exchange.

Return ONLY meaningful content worth remembering. Skip small talk, greetings, acknowledgments.

Categories:
- fact: something durable and true about Noel, projects, people, system ("Noel uses Mac 16GB, upgrading to Mac Studio")
- decision: architectural, product, or process choice ("chose SQLite over JSON for crash safety")
- preference: how Noel wants things done ("prefers terse responses, no preamble")
- commitment: something an agent committed to do ("James will build the auth endpoint this week")

Rules:
- Extract 0-5 facts. Return empty array if nothing is worth storing.
- Each fact must be self-contained (readable without the original exchange).
- Confidence < 0.5 = skip it. Be conservative.
- Do NOT include greetings, "ok", "thanks", or meta-talk about the conversation.

Schema: {"facts": [{"type": "fact|decision|preference|commitment", "text": "...", "confidence": 0.0-1.0}]}`;

// Map our 4 categories onto the SQLite schema's 5 allowed types.
// (schema: fact | conversation | decision | pattern | preference)
function mapToSqlType(
  category: 'fact' | 'decision' | 'preference' | 'commitment'
): 'fact' | 'decision' | 'preference' | 'pattern' {
  if (category === 'decision') return 'decision';
  if (category === 'preference') return 'preference';
  if (category === 'commitment') return 'pattern'; // closest existing bucket
  return 'fact';
}

export interface DistillOptions {
  model?: string;
  timeoutMs?: number;
  minExchangeLength?: number;
  minConfidence?: number;
}

export interface DistillStats {
  attempted: boolean;
  extracted: number;
  stored: number;
  skippedLowConfidence: number;
  durationMs: number;
  error?: string;
}

export async function distillConversation(
  userMessage: string,
  agentResponse: string,
  agent: string,
  options?: DistillOptions
): Promise<DistillStats> {
  const start = Date.now();
  const minLength = options?.minExchangeLength ?? 80;
  const minConfidence = options?.minConfidence ?? 0.5;

  // Skip trivial exchanges — no point burning a model call.
  if (userMessage.length + agentResponse.length < minLength) {
    return {
      attempted: false,
      extracted: 0,
      stored: 0,
      skippedLowConfidence: 0,
      durationMs: 0,
    };
  }

  const exchange = `User (Noel): ${userMessage.slice(0, 2000)}

Agent (${agent}): ${agentResponse.slice(0, 2000)}`;

  try {
    const { data } = await chatJSON<DistillationResult>(exchange, {
      model: options?.model || 'qwen3:8b',
      system: DISTILL_PROMPT,
      temperature: 0.1,
      maxTokens: 800,
      schema: DISTILLATION_JSON_SCHEMA,
      think: false,
      timeoutMs: options?.timeoutMs ?? 25_000,
    });

    const parsed = DistillationSchema.parse(data);
    let stored = 0;
    let skippedLowConfidence = 0;

    for (const fact of parsed.facts) {
      if (fact.confidence < minConfidence) {
        skippedLowConfidence++;
        continue;
      }
      try {
        storeMemory(agent, mapToSqlType(fact.type), fact.text, {
          source: 'distillation',
          originalType: fact.type,
          confidence: fact.confidence,
          distilledAt: new Date().toISOString(),
        });
        stored++;
      } catch {
        // memory store failure — keep going for the rest
      }
    }

    return {
      attempted: true,
      extracted: parsed.facts.length,
      stored,
      skippedLowConfidence,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const msg = (err as Error).message?.slice(0, 100) || 'unknown';
    return {
      attempted: true,
      extracted: 0,
      stored: 0,
      skippedLowConfidence: 0,
      durationMs: Date.now() - start,
      error: msg,
    };
  }
}

// Ollama client — structured output, schema-constrained grammar, timeouts, circuit breaker.
// Circuit opens after 3 failures in 60s; probes after 30s. Fallback to Claude when open.

import { Ollama } from 'ollama';
import CircuitBreaker from 'opossum';
import { ollamaConfig } from '../../config/models.js';

let client: Ollama | null = null;

export function getOllamaClient(): Ollama {
  if (!client) {
    client = new Ollama({ host: ollamaConfig.host });
  }
  return client;
}

export interface ChatOptions {
  model: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  schema?: object; // Schema-constrained grammar (Ollama 0.5+). Beats soft jsonMode.
  think?: boolean;
  timeoutMs?: number; // Per-call wall-clock timeout.
}

export interface ChatResult {
  content: string;
  thinking: string | null;
  model: string;
  tokensIn: number;
  tokensOut: number;
  durationMs: number;
}

export type CircuitState = 'closed' | 'open' | 'halfOpen';

export class CircuitOpenError extends Error {
  constructor() {
    super('Ollama circuit breaker is open');
    this.name = 'CircuitOpenError';
  }
}

// Inner chat — wrapped by circuit breaker.
async function _chat(message: string, options: ChatOptions): Promise<ChatResult> {
  const ollama = getOllamaClient();
  const start = Date.now();
  const shouldThink = options.think === true;

  const requestBody: Record<string, unknown> = {
    model: options.model,
    messages: [
      ...(options.system ? [{ role: 'system' as const, content: options.system }] : []),
      { role: 'user' as const, content: message },
    ],
    options: {
      temperature: options.temperature ?? 0.3,
      num_predict: options.maxTokens ?? 2048,
    },
    think: shouldThink,
    stream: false,
  };

  // Grammar-constrained output beats soft JSON mode. Schema wins if both set.
  if (options.schema) {
    requestBody.format = options.schema;
  } else if (options.jsonMode) {
    requestBody.format = 'json';
  }

  // Wall-clock timeout via Promise.race — ollama npm client has no native abort.
  const timeoutMs = options.timeoutMs ?? ollamaConfig.timeout;
  const chatPromise = ollama.chat(requestBody as unknown as Parameters<typeof ollama.chat>[0]);
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Ollama timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  const response = await Promise.race([chatPromise, timeoutPromise]);

  const msg = response.message as { content: string; thinking?: string; role: string };

  return {
    content: msg.content,
    thinking: msg.thinking?.trim() || null,
    model: options.model,
    tokensIn: response.prompt_eval_count ?? 0,
    tokensOut: response.eval_count ?? 0,
    durationMs: Date.now() - start,
  };
}

const breaker = new CircuitBreaker(_chat as (...args: unknown[]) => Promise<ChatResult>, {
  timeout: 90_000, // hard ceiling above per-call timeout
  errorThresholdPercentage: 50,
  resetTimeout: 30_000, // retry probe after 30s
  volumeThreshold: 3,
  rollingCountTimeout: 60_000,
});

breaker.on('open', () => console.warn('[Brain] Ollama circuit OPEN — falling back to Claude'));
breaker.on('halfOpen', () => console.log('[Brain] Ollama circuit HALF-OPEN — probing'));
breaker.on('close', () => console.log('[Brain] Ollama circuit CLOSED — back online'));

export function getCircuitState(): CircuitState {
  if (breaker.opened) return 'open';
  if (breaker.halfOpen) return 'halfOpen';
  return 'closed';
}

// Chat with circuit breaker protection.
export async function chat(message: string, options: ChatOptions): Promise<ChatResult> {
  if (breaker.opened) throw new CircuitOpenError();
  return await breaker.fire(message, options);
}

// Chat with JSON output — parses and validates the response.
export async function chatJSON<T>(message: string, options: ChatOptions): Promise<{ data: T; raw: ChatResult }> {
  // If schema provided, don't also set jsonMode (redundant).
  const result = await chat(message, {
    ...options,
    jsonMode: options.schema ? false : (options.jsonMode ?? true),
  });

  let content = result.content.trim();
  if (content.startsWith('```')) {
    content = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const data = JSON.parse(content) as T;
  return { data, raw: result };
}

export async function embed(text: string, model = 'nomic-embed-text'): Promise<number[]> {
  const ollama = getOllamaClient();
  const response = await ollama.embed({ model, input: text });
  return response.embeddings[0];
}

// Health check with 2-second timeout so startup never hangs.
export async function isHealthy(): Promise<boolean> {
  try {
    const ollama = getOllamaClient();
    await Promise.race([
      ollama.list(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('health check timeout')), 2000)),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function listModels(): Promise<string[]> {
  const ollama = getOllamaClient();
  const response = await ollama.list();
  return response.models.map((m) => m.name);
}

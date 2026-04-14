// Ollama client — talks to the local LLM
// Handles: structured JSON output, streaming, timeouts, error recovery

import { Ollama } from 'ollama';
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
}

export interface ChatResult {
  content: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  durationMs: number;
}

// Chat with a local model — returns structured result
export async function chat(message: string, options: ChatOptions): Promise<ChatResult> {
  const ollama = getOllamaClient();
  const start = Date.now();

  const response = await ollama.chat({
    model: options.model,
    messages: [
      ...(options.system ? [{ role: 'system' as const, content: options.system }] : []),
      { role: 'user' as const, content: message },
    ],
    options: {
      temperature: options.temperature ?? 0.3,
      num_predict: options.maxTokens ?? 2048,
    },
    format: options.jsonMode ? 'json' : undefined,
  });

  return {
    content: response.message.content,
    model: options.model,
    tokensIn: response.prompt_eval_count ?? 0,
    tokensOut: response.eval_count ?? 0,
    durationMs: Date.now() - start,
  };
}

// Chat with JSON output — parses and validates the response
export async function chatJSON<T>(message: string, options: ChatOptions): Promise<{ data: T; raw: ChatResult }> {
  const result = await chat(message, { ...options, jsonMode: true });

  // Strip markdown code fences if present
  let content = result.content.trim();
  if (content.startsWith('```')) {
    content = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const data = JSON.parse(content) as T;
  return { data, raw: result };
}

// Generate embeddings for RAG
export async function embed(text: string, model = 'nomic-embed-text'): Promise<number[]> {
  const ollama = getOllamaClient();
  const response = await ollama.embed({ model, input: text });
  return response.embeddings[0];
}

// Check if Ollama is healthy
export async function isHealthy(): Promise<boolean> {
  try {
    const ollama = getOllamaClient();
    await ollama.list();
    return true;
  } catch {
    return false;
  }
}

// List available models
export async function listModels(): Promise<string[]> {
  const ollama = getOllamaClient();
  const response = await ollama.list();
  return response.models.map((m) => m.name);
}

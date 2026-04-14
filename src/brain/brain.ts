// Anton's Brain — the central intelligence
// Every message passes through here. It classifies, routes, thinks, and learns.

import { classify, getModelForClassification, type Classification } from './classifier.js';
import { chat, chatJSON, isHealthy, listModels } from './ollama-client.js';
import { models, detectTier } from '../../config/models.js';

export interface BrainResponse {
  text: string;
  classification: Classification;
  model: string;
  tokensIn: number;
  tokensOut: number;
  durationMs: number;
  handledLocally: boolean;
}

const ANTON_SYSTEM = `You are Anton — a personal AI operating system for Noel.
You are direct, concise, and never use filler words.
You know the team: Marcus (tech lead), Sarah (PM), James (backend), Elena (frontend), Kai (mobile), Priya (QA), Omar (devops), Diana (CMO), Alex (content), Nina (SEO), Riley (scrum master), and others.
You manage everything: personal assistance, team coordination, system monitoring, and strategic decisions.
When you need to involve a team member, just say who and what naturally.
When a task needs code or deep research, say so — it will be routed to Claude.`;

let _initialized = false;
let _tier = 1;

export async function initBrain(): Promise<void> {
  const healthy = await isHealthy();
  if (!healthy) {
    console.error('[Brain] Ollama is not responding at localhost:11434');
    console.error('[Brain] Make sure Ollama is running: open -a Ollama');
    return;
  }

  _tier = detectTier();
  const availableModels = await listModels();
  _initialized = true;

  console.log(`[Brain] Online (Tier ${_tier}, ${availableModels.length} models: ${availableModels.join(', ')})`);
}

// Main entry point — process any message through the brain
export async function process(
  message: string,
  options?: {
    context?: string;
    from?: string;
    channel?: string;
  }
): Promise<BrainResponse> {
  if (!_initialized) {
    await initBrain();
  }

  const start = Date.now();

  // Step 1: Classify the message
  const classification = await classify(message, 'qwen3:8b', options?.context);
  console.log(
    `[Brain] ${classification.intent} (${classification.complexity}, confidence: ${classification.confidence}, depth: ${classification.adaptiveDepth})`
  );

  // Step 2: Should the brain handle this locally?
  const modelKey = getModelForClassification(classification);
  const modelConfig = models[modelKey];

  if (!modelConfig) {
    return {
      text: 'I need to think about this. Give me a moment.',
      classification,
      model: 'fallback',
      tokensIn: 0,
      tokensOut: 0,
      durationMs: Date.now() - start,
      handledLocally: false,
    };
  }

  // Step 3: If it needs Claude, signal that (don't execute here — hands do that)
  if (modelConfig.provider === 'claude') {
    return {
      text: `This needs ${modelConfig.model === 'opus' ? 'deep' : 'focused'} work. Routing to Claude.`,
      classification,
      model: modelKey,
      tokensIn: 0,
      tokensOut: 0,
      durationMs: Date.now() - start,
      handledLocally: false,
    };
  }

  // Step 4: Handle locally with the right model
  try {
    const maxTokens = getMaxTokensForDepth(classification.adaptiveDepth);
    const result = await chat(message, {
      model: modelConfig.model,
      system: ANTON_SYSTEM,
      temperature: modelConfig.temperature ?? 0.3,
      maxTokens,
    });

    return {
      text: result.content,
      classification,
      model: modelKey,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      durationMs: Date.now() - start,
      handledLocally: true,
    };
  } catch (error) {
    console.error('[Brain] Local model failed:', (error as Error).message?.slice(0, 100));

    // Fallback: return a safe response and let the system retry or escalate
    return {
      text: 'Having trouble thinking right now. Let me try again.',
      classification,
      model: 'error',
      tokensIn: 0,
      tokensOut: 0,
      durationMs: Date.now() - start,
      handledLocally: false,
    };
  }
}

// Adaptive token budget based on depth
function getMaxTokensForDepth(depth: string): number {
  switch (depth) {
    case 'minimal':
      return 128;
    case 'standard':
      return 512;
    case 'detailed':
      return 2048;
    case 'deep':
      return 4096;
    default:
      return 512;
  }
}

// Quick health check
export async function getBrainHealth(): Promise<{
  healthy: boolean;
  tier: number;
  ollamaUp: boolean;
  models: string[];
}> {
  const ollamaUp = await isHealthy();
  const modelList = ollamaUp ? await listModels() : [];
  return {
    healthy: _initialized && ollamaUp,
    tier: _tier,
    ollamaUp,
    models: modelList,
  };
}

export function isInitialized(): boolean {
  return _initialized;
}

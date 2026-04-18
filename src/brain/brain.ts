// Anton's Brain — three-layer pipeline.
//
//   Layer 0: Deterministic pre-gate (0ms, pure fn) — handles obvious cases
//   Layer 1: Schema-constrained classifier (200-400ms, Qwen3 8B, think:false) — handles ambiguous
//   Layer 2: Depth-controlled responder (variable, think:depth-driven) — produces the answer
//
// Routing via logical model names (`'local-fast'`, `'local-reason'`, etc.) — resolved from
// config/models.ts. Hardware upgrades change only that file. No model string hardcoded anywhere.

import { detectTier, models, taskRouting } from '../../config/models.js';
import { buildMemoryContext, storeConversation } from '../memory/sqlite.js';
import { classify } from './classifier.js';
import { CircuitOpenError, chat, getCircuitState, isHealthy, listModels } from './ollama-client.js';
import { buildAgentPrompt, buildTeamDirectory } from './personas.js';
import { type AdaptiveDepth, preGate } from './pre-gate.js';
import { extractResponse, getMaxTokensForDepth, getTemperatureForDepth, type ThinkingDepth } from './thinking.js';
import { claudeFallback } from './claude-fallback.js';

export interface BrainResponse {
  text: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  durationMs: number;
  handledLocally: boolean;
  needsClaude: boolean;
  handoffs: Array<{ agent: string; message: string }>;
  classification?: {
    intent: string;
    depth: ThinkingDepth;
    confidence: number;
    route: string;
    reason: string;
  };
}

let _initialized = false;
let _tier = 1;
let _activeModels: string[] = [];

// In-memory conversation history per agent (last N turns for immediate context).
const _conversationHistory: Map<string, Array<{ role: string; content: string }>> = new Map();
const MAX_HISTORY = 10;

function addToHistory(agent: string, role: string, content: string): void {
  if (!_conversationHistory.has(agent)) _conversationHistory.set(agent, []);
  const history = _conversationHistory.get(agent)!;
  history.push({ role, content });
  if (history.length > MAX_HISTORY * 2) {
    _conversationHistory.set(agent, history.slice(-MAX_HISTORY * 2));
  }
}

function getHistory(agent: string): Array<{ role: string; content: string }> {
  return _conversationHistory.get(agent) || [];
}

function getAntonSystem(): string {
  return `You are Anton — Noel's personal AI operating system. Like JARVIS for Tony Stark.
Direct, concise, actionable. Never say "certainly", "of course", or "happy to help".
You run on a local LLM via Ollama. Created by Noel. Report to Noel only.
Memory stored in SQLite. Claude is a rare fallback for code generation and deep research.

${buildTeamDirectory()}

Delegation: when task is clear, assign using [HANDOFF:Name] tag.
Example: "On it. [HANDOFF:James] Build user profiles API endpoint."
If task needs Claude, prefix with [NEEDS_CLAUDE].
Always respond in complete sentences. Act first, ask later. Be decisive.`;
}

export async function initBrain(): Promise<void> {
  const healthy = await isHealthy();
  if (!healthy) {
    console.error('[Brain] Ollama is not responding at localhost:11434');
    console.error('[Brain] Make sure Ollama is running: open -a Ollama');
    return;
  }

  _tier = detectTier();
  _activeModels = await listModels();
  _initialized = true;

  console.log(`[Brain] Online (Tier ${_tier}, ${_activeModels.length} models: ${_activeModels.join(', ')})`);
}

// Resolve logical model name (e.g. 'local-fast') to concrete Ollama model string.
function resolveModel(logicalName: string): string {
  const config = models[logicalName];
  if (!config) {
    console.warn(`[Brain] Unknown logical model '${logicalName}', using local-fast`);
    return models['local-fast'].model;
  }
  return config.model;
}

// Task-type → logical model. Consults taskRouting map in config/models.ts.
function routeForClassification(intent: string, complexity: string, needsClaude: boolean): string {
  if (needsClaude) return complexity === 'extreme' ? 'claude-opus' : 'claude-sonnet';

  const compound = `${intent}_${complexity}`;
  if (taskRouting[compound]) return taskRouting[compound];
  if (taskRouting[intent]) return taskRouting[intent];
  return 'local-fast';
}

// Depth → timeout budget (ms). Short for minimal, generous for deep.
function timeoutForDepth(depth: ThinkingDepth): number {
  switch (depth) {
    case 'minimal':
      return 10_000;
    case 'standard':
      return 20_000;
    case 'detailed':
      return 45_000;
    case 'deep':
      return 60_000;
  }
}

export async function process(
  message: string,
  options?: {
    context?: string;
    from?: string;
    channel?: string;
    agent?: string;
  }
): Promise<BrainResponse> {
  if (!_initialized) await initBrain();

  const start = Date.now();
  const agentName = options?.agent || 'Anton';
  const sessionId = `${agentName}-${Date.now()}`;

  // LAYER 0: Deterministic pre-gate.
  const hint = preGate(message);

  // Initialize routing with pre-gate's hints (defaults if unset).
  let intent: string = hint.intent || 'question';
  let complexity: 'simple' | 'complex' | 'extreme' = 'simple';
  let needsClaude = hint.needsClaude ?? false;
  let depth: ThinkingDepth = (hint.adaptiveDepth as AdaptiveDepth) || 'standard';
  let confidence = hint.skipClassifier ? 1.0 : 0.0;
  let reason = hint.reason;
  let classifierHandoffs: Array<{ agent: string; message: string }> = [];

  // LAYER 1: Classifier (only if pre-gate was ambiguous and not @local-forced).
  if (!hint.skipClassifier) {
    try {
      const classification = await classify(message, resolveModel('local-fast'), options?.context);
      intent = classification.intent;
      complexity = classification.complexity;
      needsClaude = classification.needsClaude;
      depth = classification.adaptiveDepth;
      confidence = classification.confidence;
      classifierHandoffs = classification.handoffs;
      reason = `classify:${intent}/${complexity}`;

      // Low-confidence responses from local classifier get bumped to more thinking
      // (cheaper than Claude, catches borderline cases).
      if (confidence < 0.5 && !needsClaude) {
        console.log(`[Brain] Low confidence ${confidence.toFixed(2)} — bumping depth`);
        depth = depth === 'minimal' ? 'standard' : depth === 'standard' ? 'detailed' : depth;
      }
    } catch (err) {
      console.error('[Brain] Classifier failed:', (err as Error).message?.slice(0, 100));
      // Continue with pre-gate defaults.
    }
  }

  // @local prefix overrides classifier's "needsClaude: true".
  if (hint.forceLocal) needsClaude = false;

  const logicalModel = routeForClassification(intent, complexity, needsClaude);

  // Build system prompt once — used by BOTH local responder and Claude fallback
  // so voice is consistent across paths. This is the fix for the "voice drift" bug.
  let memoryContext = '';
  try {
    memoryContext = buildMemoryContext(options?.agent);
  } catch {}

  const basePrompt = options?.agent ? buildAgentPrompt(options.agent) : getAntonSystem();
  const contextParts = [basePrompt];
  if (options?.context) contextParts.push(`\nContext: ${options.context}`);
  if (memoryContext) contextParts.push(`\n${memoryContext}`);

  const history = getHistory(agentName);
  if (history.length > 0) {
    contextParts.push('\n[RECENT CONVERSATION]');
    for (const msg of history.slice(-6)) {
      contextParts.push(`${msg.role === 'user' ? 'Noel' : agentName}: ${msg.content.slice(0, 300)}`);
    }
  }

  const systemPrompt = contextParts.join('\n');

  // LAYER 2a: Claude path — brain invokes the fallback directly with its own
  // system prompt. No drop into V1 sessions, no persona drift.
  if (needsClaude) {
    try {
      const claudeModel: 'sonnet' | 'opus' = logicalModel === 'claude-opus' ? 'opus' : 'sonnet';
      const result = await claudeFallback(message, systemPrompt, { model: claudeModel });
      const durationMs = Date.now() - start;
      const finalText = result.text || "Couldn't complete that through Claude. Retry?";

      console.log(
        `[CLAUDE] ${agentName} | ${intent}/${complexity} depth=${depth} conf=${confidence.toFixed(2)} reason=${reason} | ${result.tokensOut}t | ${durationMs}ms`
      );

      addToHistory(agentName, 'user', message);
      addToHistory(agentName, 'assistant', finalText);

      try {
        storeConversation(sessionId, agentName, 'user', message, {
          channel: options?.channel || 'web',
        });
        storeConversation(sessionId, agentName, 'agent', finalText, {
          channel: options?.channel || 'web',
          modelUsed: `claude-${claudeModel}`,
          tokensIn: result.tokensIn,
          tokensOut: result.tokensOut,
          latencyMs: durationMs,
          handledLocally: false,
        });
      } catch (e) {
        console.warn('[Brain] Memory store failed (claude path):', (e as Error).message?.slice(0, 60));
      }

      return {
        text: finalText,
        model: logicalModel,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        durationMs,
        handledLocally: false,
        needsClaude: true,
        handoffs: classifierHandoffs,
        classification: { intent, depth, confidence, route: logicalModel, reason },
      };
    } catch (err) {
      const msg = (err as Error).message?.slice(0, 120) || 'unknown';
      console.error(`[Brain] Claude fallback failed: ${msg}`);
      return {
        text: "Couldn't reach Claude right now. Tell me again in a moment.",
        model: 'claude-error',
        tokensIn: 0,
        tokensOut: 0,
        durationMs: Date.now() - start,
        handledLocally: false,
        needsClaude: true,
        handoffs: classifierHandoffs,
        classification: { intent, depth, confidence, route: logicalModel, reason },
      };
    }
  }

  // LAYER 2b: Local responder with adaptive thinking.
  const actualModel = resolveModel(logicalModel);
  const shouldThink = depth === 'detailed' || depth === 'deep';
  const temperature = getTemperatureForDepth(depth);
  const maxTokens = getMaxTokensForDepth(depth);
  const timeoutMs = timeoutForDepth(depth);

  try {
    const result = await chat(message, {
      model: actualModel,
      system: systemPrompt,
      temperature,
      maxTokens,
      think: shouldThink,
      timeoutMs,
    });

    const nativeThinking = result.thinking;
    const { thinking: parsedThinking, response: parsedResponse } = extractResponse(result.content);
    const thinking = nativeThinking || parsedThinking;
    const responseText = parsedResponse || result.content;

    if (thinking && shouldThink) {
      console.log(`[Brain] Reasoning: ${thinking.slice(0, 150)}${thinking.length > 150 ? '...' : ''}`);
    }

    // Model may still self-escalate via [NEEDS_CLAUDE] — honor it.
    const selfEscalated = responseText.includes('[NEEDS_CLAUDE]');
    let finalText = responseText.replace(/\[NEEDS_CLAUDE\]\s*/g, '').trim();

    // Explicit [HANDOFF:Agent] tags only — no NL fallback (removed, was fragile).
    const handoffsFromText = extractHandoffs(finalText);
    finalText = finalText.replace(/\[HANDOFF:\w+\]\s*/g, '').trim();

    // Merge classifier handoffs + text handoffs (dedupe by agent name).
    const handoffMap = new Map<string, string>();
    for (const h of classifierHandoffs) handoffMap.set(h.agent, h.message);
    for (const h of handoffsFromText) handoffMap.set(h.agent, h.message);
    const handoffs = Array.from(handoffMap.entries()).map(([agent, msg]) => ({
      agent,
      message: msg,
    }));

    const durationMs = Date.now() - start;
    console.log(
      `[${selfEscalated ? 'CLAUDE' : 'LOCAL'}] ${agentName} | ${intent}/${complexity} depth=${depth} | ${result.tokensOut}t | ${durationMs}ms | conf=${confidence.toFixed(2)} | ${reason}`
    );

    if (handoffs.length > 0) {
      console.log(`[Handoff] ${handoffs.map((h) => `${h.agent}: ${h.message.slice(0, 60)}`).join(' | ')}`);
    }

    addToHistory(agentName, 'user', message);
    addToHistory(agentName, 'assistant', finalText);

    try {
      storeConversation(sessionId, agentName, 'user', message, {
        channel: options?.channel || 'web',
      });
      storeConversation(sessionId, agentName, 'agent', finalText, {
        channel: options?.channel || 'web',
        modelUsed: actualModel,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        latencyMs: durationMs,
        handledLocally: !selfEscalated,
      });
    } catch (e) {
      console.warn('[Brain] Memory store failed:', (e as Error).message?.slice(0, 60));
    }

    return {
      text: finalText,
      model: logicalModel,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      durationMs,
      handledLocally: !selfEscalated,
      needsClaude: selfEscalated,
      handoffs,
      classification: { intent, depth, confidence, route: logicalModel, reason },
    };
  } catch (error) {
    const isCircuitOpen = error instanceof CircuitOpenError;
    const errMsg = (error as Error).message?.slice(0, 120) || 'unknown';
    console.error(`[Brain] Local ${isCircuitOpen ? 'CIRCUIT OPEN' : 'failed'}: ${errMsg}`);

    // Circuit open → escalate to Claude using the same system prompt.
    if (isCircuitOpen) {
      try {
        const claudeResult = await claudeFallback(message, systemPrompt, { model: 'sonnet' });
        const durationMs = Date.now() - start;
        const finalText = claudeResult.text || 'Ollama is down and Claude came back empty. Retry shortly.';

        console.log(`[CLAUDE] ${agentName} | circuit-open fallback | ${claudeResult.tokensOut}t | ${durationMs}ms`);

        addToHistory(agentName, 'user', message);
        addToHistory(agentName, 'assistant', finalText);

        try {
          storeConversation(sessionId, agentName, 'user', message, {
            channel: options?.channel || 'web',
          });
          storeConversation(sessionId, agentName, 'agent', finalText, {
            channel: options?.channel || 'web',
            modelUsed: 'claude-sonnet',
            tokensIn: claudeResult.tokensIn,
            tokensOut: claudeResult.tokensOut,
            latencyMs: durationMs,
            handledLocally: false,
          });
        } catch {}

        return {
          text: finalText,
          model: 'claude-sonnet',
          tokensIn: claudeResult.tokensIn,
          tokensOut: claudeResult.tokensOut,
          durationMs,
          handledLocally: false,
          needsClaude: true,
          handoffs: classifierHandoffs,
          classification: { intent, depth, confidence, route: 'claude-sonnet', reason: 'circuit-open' },
        };
      } catch (fallbackErr) {
        console.error('[Brain] Both local AND Claude failed:', (fallbackErr as Error).message?.slice(0, 100));
        return {
          text: 'Local brain is down and Claude is unreachable. Check Ollama + network.',
          model: 'both-down',
          tokensIn: 0,
          tokensOut: 0,
          durationMs: Date.now() - start,
          handledLocally: false,
          needsClaude: false,
          handoffs: [],
        };
      }
    }

    return {
      text: 'Having trouble thinking right now. Let me try again.',
      model: 'error',
      tokensIn: 0,
      tokensOut: 0,
      durationMs: Date.now() - start,
      handledLocally: false,
      needsClaude: false,
      handoffs: [],
    };
  }
}

// Explicit [HANDOFF:AgentName] tag extraction — NO natural-language fallback.
// NL fallback was removed in Phase 2.5 (produced false positives on "let me check with Sarah").
function extractHandoffs(text: string): Array<{ agent: string; message: string }> {
  const handoffs: Array<{ agent: string; message: string }> = [];
  const regex = /\[HANDOFF:(\w+)\]\s*([^[\n]*(?:\n(?!\[HANDOFF)[^[\n]*)*)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const agent = match[1];
    const message = match[2].trim();
    if (TEAM_NAMES.has(agent) && message) {
      handoffs.push({ agent, message });
    }
  }

  return handoffs;
}

const TEAM_NAMES: Set<string> = new Set([
  'Marcus',
  'Sarah',
  'James',
  'Elena',
  'Kai',
  'Priya',
  'Omar',
  'Diana',
  'Alex',
  'Nina',
  'Riley',
  'Ada',
  'Nadia',
  'Felix',
  'Ben',
]);

export async function getBrainHealth(): Promise<{
  healthy: boolean;
  tier: number;
  ollamaUp: boolean;
  models: string[];
  circuit: 'closed' | 'open' | 'halfOpen';
}> {
  const ollamaUp = await isHealthy();
  const modelList = ollamaUp ? await listModels() : [];
  return {
    healthy: _initialized && ollamaUp,
    tier: _tier,
    ollamaUp,
    models: modelList,
    circuit: getCircuitState(),
  };
}

export function isInitialized(): boolean {
  return _initialized;
}

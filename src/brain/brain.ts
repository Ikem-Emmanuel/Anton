// Anton's Brain — three-layer pipeline.
//
//   Layer 0: Deterministic pre-gate (0ms, pure fn) — handles obvious cases
//   Layer 1: Schema-constrained classifier (200-400ms, Qwen3 8B, think:false) — handles ambiguous
//   Layer 2: Depth-controlled responder (variable, think:depth-driven) — produces the answer
//
// Routing via logical model names (`'local-fast'`, `'local-reason'`, etc.) — resolved from
// config/models.ts. Hardware upgrades change only that file. No model string hardcoded anywhere.

import { detectTier, models, taskRouting } from '../../config/models.js';
import {
  buildMemoryContext,
  buildSkillsContext,
  createTask,
  storeConversation,
  updateImplicitSignal,
} from '../memory/sqlite.js';
import { emitEventLogged } from '../spine/web.js';
import { type AgentAction, extractAgentActions, stripActionTags } from './agent-actions.js';
import { buildAmbientContext } from './ambient-context.js';
import { classify } from './classifier.js';
import { claudeFallback } from './claude-fallback.js';
import { distillConversation } from './distill.js';
import { evaluateTurn } from './evaluate.js';
import { captureImplicitFeedback } from './feedback-capture.js';
import { CircuitOpenError, chat, getCircuitState, isHealthy, listModels } from './ollama-client.js';
import { buildAgentPrompt, buildTeamDirectory } from './personas.js';
import { type AdaptiveDepth, preGate } from './pre-gate.js';
import { isSimModeActive, nextSimResponse } from './sim-mode.js';
import { extractSkillCandidate } from './skill-extract.js';
import { extractResponse, getMaxTokensForDepth, getTemperatureForDepth, type ThinkingDepth } from './thinking.js';

export interface BrainResponse {
  text: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  durationMs: number;
  handledLocally: boolean;
  needsClaude: boolean;
  handoffs: Array<{ agent: string; message: string }>;
  // Full structured action list from agent output: HANDOFF, ASK, BLOCK, APPROVE, REJECT, DONE.
  // `handoffs` (above) is a backward-compat subset where type === 'HANDOFF'.
  actions: AgentAction[];
  classification?: {
    intent: string;
    depth: ThinkingDepth;
    confidence: number;
    route: string;
    reason: string;
  };
}

// Map an AgentAction type to the ActivityType the web timeline renders.
// Keeps brain semantics (HANDOFF/ASK/BLOCK/APPROVE/REJECT/DONE) decoupled
// from the UI vocabulary.
function actionToActivityType(type: string): string {
  if (type === 'HANDOFF' || type === 'ASK') return 'handoff';
  if (type === 'DONE') return 'complete';
  if (type === 'BLOCK' || type === 'APPROVE' || type === 'REJECT') return 'approval';
  return 'system';
}

// Map an action to a kanban task row when that makes sense. Returns null
// when the action doesn't correspond to persistent work (e.g. APPROVE /
// REJECT — those close approvals, not tasks). Design v1: every qualifying
// action creates its own task row. Lifecycle tracking (linking a DONE to
// the HANDOFF that started it) needs task_ids on action tags — deferred.
function actionToTaskInput(a: AgentAction, speaker: string): Parameters<typeof createTask>[0] | null {
  const title = a.content ? a.content.slice(0, 140) : `${a.type}${a.target ? `:${a.target}` : ''}`;
  if (a.type === 'HANDOFF' && a.target) {
    return { title, owner: a.target, actor: a.target, col: 'flight' };
  }
  if (a.type === 'ASK') {
    // ASK to Noel lands in the FOR YOU column; ASK to another agent is flight.
    const target = a.target || 'Noel';
    const toNoel = target === 'Noel';
    return {
      title,
      owner: toNoel ? 'Noel' : target,
      actor: toNoel ? speaker : target,
      col: toNoel ? 'incoming' : 'flight',
      why: toNoel ? a.content : undefined,
    };
  }
  if (a.type === 'DONE') {
    return { title: `${speaker} completed: ${title}`, owner: speaker, actor: speaker, col: 'done' };
  }
  if (a.type === 'BLOCK') {
    return { title, owner: speaker, actor: speaker, col: 'blocked', why: a.content };
  }
  return null;
}

// Log + broadcast the full action list and persist qualifying actions as
// kanban tasks. Replaces the inline console.log, drives the web timeline,
// and keeps the Tasks board in sync. All side effects tolerate a missing
// WSS / SQLite (sim mode, tests, offline CLI) — emit() and createTask()
// both no-op when uninitialized.
function reportActions(actions: AgentAction[], agentName: string): void {
  if (actions.length === 0) return;
  const summary = actions.map((a) => `${a.type}${a.target ? `:${a.target}` : ''}`).join(', ');
  console.log(`[Actions] ${summary}`);
  const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
  for (const a of actions) {
    const headline = `${a.type}${a.target ? `:${a.target}` : ''}`;
    emitEventLogged({
      t: ts,
      agent: agentName,
      type: actionToActivityType(a.type),
      text: a.content ? `${headline} — ${a.content.slice(0, 100)}` : headline,
      detail: null,
    });
    const taskInput = actionToTaskInput(a, agentName);
    if (taskInput) {
      try {
        createTask(taskInput);
      } catch (e) {
        console.warn(`[Brain] createTask failed for ${a.type}:`, (e as Error).message?.slice(0, 80));
      }
    }
  }
}

// Parse all action tags from an agent response. Validates HANDOFF and ASK targets
// against the persona directory so agents can't invent teammates.
function extractAndValidateActions(text: string): AgentAction[] {
  const actions = extractAgentActions(text);
  return actions.filter((a) => {
    // HANDOFF and ASK must target a known team member.
    if (a.type === 'HANDOFF' || a.type === 'ASK') {
      if (!a.target) return false;
      if (!TEAM_NAMES.has(a.target)) {
        console.warn(`[Brain] Ignoring ${a.type} to unknown agent "${a.target}"`);
        return false;
      }
      if (!a.content) return false;
    }
    return true;
  });
}

// Derive legacy handoffs list from the full action list for backward compat.
function handoffsFromActions(actions: AgentAction[]): Array<{ agent: string; message: string }> {
  return actions.filter((a) => a.type === 'HANDOFF' && a.target).map((a) => ({ agent: a.target!, message: a.content }));
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

// Track last-turn timestamp per agent for ambient-context idle reporting.
const _lastTurnAt: Map<string, Date> = new Map();

// Per-agent last agent-turn: lets us capture implicit feedback against it
// when the user's next message arrives.
const _lastAgentTurn: Map<string, { text: string; convId: number }> = new Map();

function getLastInteractionTime(agent: string): Date | undefined {
  return _lastTurnAt.get(agent);
}

function markInteraction(agent: string): void {
  _lastTurnAt.set(agent, new Date());
}

function rememberAgentTurn(agent: string, text: string, convId: number | null): void {
  if (convId) _lastAgentTurn.set(agent, { text, convId });
}

// Called at the START of brain.process() before any LLM work. Reads the prior
// agent turn for this persona (if any), derives accepted/corrected/ambiguous
// signal from the current user message, and writes it to the prior turn's
// turn_evaluations row so it composes with the async §4.5.2 verdict.
function captureAndStoreFeedback(agent: string, currentUserText: string): void {
  const prior = _lastAgentTurn.get(agent);
  if (!prior) return;
  try {
    const signal = captureImplicitFeedback(prior.text, currentUserText);
    updateImplicitSignal(prior.convId, signal);
    if (signal !== 'ambiguous') {
      console.log(`[Feedback] ${agent} turn#${prior.convId} → ${signal}`);
    }
  } catch {}
  // Consume the last-turn record so we don't double-score.
  _lastAgentTurn.delete(agent);
}

// Fire-and-forget distillation. Runs in background; errors are logged, not thrown.
function scheduleDistillation(userMessage: string, agentResponse: string, agent: string): void {
  if (!agentResponse || agentResponse.length < 20) return;
  setImmediate(async () => {
    try {
      const stats = await distillConversation(userMessage, agentResponse, agent);
      if (stats.stored > 0) {
        console.log(`[Distill] ${agent} | extracted=${stats.extracted} stored=${stats.stored} ${stats.durationMs}ms`);
      } else if (stats.error) {
        console.warn(`[Distill] ${agent} error: ${stats.error}`);
      }
    } catch (e) {
      console.warn('[Distill] Unexpected:', (e as Error).message?.slice(0, 80));
    }
  });
}

// Fire-and-forget outcome evaluation (Phase 3.5 §4.5.2). Writes a verdict
// row to turn_evaluations. On a `good` verdict, also kicks off skill
// extraction (§4.5.4/§4.5.7) so successful approaches become reusable
// templates without manual curation.
function scheduleEvaluation(
  conversationId: number | null,
  userMessage: string,
  agentResponse: string,
  agent: string
): void {
  if (!conversationId || !agentResponse || agentResponse.length < 20) return;
  setImmediate(async () => {
    try {
      const res = await evaluateTurn(conversationId, userMessage, agentResponse, agent);
      if (res.verdict) {
        console.log(
          `[Eval] ${agent} → ${res.verdict} (task=${res.scores?.task_addressed.toFixed(2)} role=${res.scores?.role_appropriate.toFixed(2)} hall=${res.scores?.hallucination_free.toFixed(2)} act=${res.scores?.action_ready.toFixed(2)}) ${res.durationMs}ms`
        );

        // Good verdicts become skill candidates (§4.5.4 + §4.5.7).
        if (res.verdict === 'good') {
          setImmediate(async () => {
            try {
              const skill = await extractSkillCandidate(userMessage, agentResponse, agent);
              if (skill.stored) {
                const lineage = skill.supersededId ? ` (supersedes #${skill.supersededId})` : ' (new)';
                console.log(`[Skill] ${agent} stored #${skill.skillId}${lineage} in ${skill.durationMs}ms`);
              } else if (skill.error) {
                console.warn(`[Skill] ${agent} extract error: ${skill.error}`);
              }
            } catch (e) {
              console.warn('[Skill] Unexpected:', (e as Error).message?.slice(0, 80));
            }
          });
        }
      } else if (res.error) {
        console.warn(`[Eval] ${agent} error: ${res.error}`);
      }
    } catch (e) {
      console.warn('[Eval] Unexpected:', (e as Error).message?.slice(0, 80));
    }
  });
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
  const start = Date.now();
  const agentName = options?.agent || 'Anton';

  // Implicit feedback (Phase 3.5 §4.5.3): before handling the new turn,
  // score the previous agent turn against this user message.
  captureAndStoreFeedback(agentName, message);

  // Simulation mode short-circuit — consume pre-recorded fixture response.
  // Used for deterministic multi-agent scenario testing without Ollama.
  if (isSimModeActive()) {
    const sim = nextSimResponse(message, agentName);
    if (sim) {
      // Parse action tags from the fixture text so tests can assert on the
      // full action vocabulary (ASK/BLOCK/APPROVE/REJECT/DONE), not just handoffs.
      const actions = extractAndValidateActions(sim.text);
      const derivedHandoffs = handoffsFromActions(actions);
      return {
        text: sim.text,
        model: sim.model || 'sim',
        tokensIn: sim.tokensIn ?? 0,
        tokensOut: sim.tokensOut ?? 0,
        durationMs: sim.latencyMs ?? Date.now() - start,
        handledLocally: sim.handledLocally ?? true,
        needsClaude: sim.needsClaude ?? false,
        // Fixture-provided handoffs take precedence; otherwise derive from text tags.
        handoffs: sim.handoffs ?? derivedHandoffs,
        actions,
        classification: sim.classification,
      };
    }
  }

  if (!_initialized) await initBrain();

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

  // Skill retrieval (Phase 3.5 §4.5.1) — keyed on the incoming request's
  // context pattern. Injected as a dedicated [APPLICABLE SKILLS] block,
  // separate from memories, so the responder can apply them as templates.
  let skillsContext = '';
  try {
    skillsContext = buildSkillsContext(message, agentName, 3);
  } catch {}

  const basePrompt = options?.agent ? buildAgentPrompt(options.agent) : getAntonSystem();
  const contextParts = [basePrompt];

  // Ambient context — time, day, idle, open items. Makes Anton feel aware.
  const lastInteraction = getLastInteractionTime(agentName);
  contextParts.push(`\n${buildAmbientContext({ lastInteractionAt: lastInteraction })}`);

  if (options?.context) contextParts.push(`\nContext: ${options.context}`);
  if (memoryContext) contextParts.push(`\n${memoryContext}`);
  if (skillsContext) contextParts.push(`\n${skillsContext}`);

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
      let finalText = result.text || "Couldn't complete that through Claude. Retry?";

      // Parse the full action vocabulary (HANDOFF/ASK/BLOCK/APPROVE/REJECT/DONE)
      // from Claude text — same contract as local path.
      const actionsFromText = extractAndValidateActions(finalText);
      finalText = stripActionTags(finalText);
      const handoffsFromText = handoffsFromActions(actionsFromText);
      const handoffMap = new Map<string, string>();
      for (const h of classifierHandoffs) handoffMap.set(h.agent, h.message);
      for (const h of handoffsFromText) handoffMap.set(h.agent, h.message);
      const handoffs = Array.from(handoffMap.entries()).map(([agent, msg]) => ({ agent, message: msg }));

      console.log(
        `[CLAUDE] ${agentName} | ${intent}/${complexity} depth=${depth} conf=${confidence.toFixed(2)} reason=${reason} | ${result.tokensOut}t | ${durationMs}ms`
      );
      reportActions(actionsFromText, agentName);

      addToHistory(agentName, 'user', message);
      addToHistory(agentName, 'assistant', finalText);
      markInteraction(agentName);
      scheduleDistillation(message, finalText, agentName);

      let agentTurnId: number | null = null;
      try {
        storeConversation(sessionId, agentName, 'user', message, {
          channel: options?.channel || 'web',
        });
        agentTurnId = storeConversation(sessionId, agentName, 'agent', finalText, {
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
      scheduleEvaluation(agentTurnId, message, finalText, agentName);
      rememberAgentTurn(agentName, finalText, agentTurnId);

      return {
        text: finalText,
        model: logicalModel,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        durationMs,
        handledLocally: false,
        needsClaude: true,
        handoffs,
        actions: actionsFromText,
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
        actions: [],
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

    // Parse full action vocabulary: HANDOFF, ASK, BLOCK, APPROVE, REJECT, DONE.
    const actionsFromText = extractAndValidateActions(finalText);
    finalText = stripActionTags(finalText);
    const handoffsFromText = handoffsFromActions(actionsFromText);

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

    reportActions(actionsFromText, agentName);

    addToHistory(agentName, 'user', message);
    addToHistory(agentName, 'assistant', finalText);
    markInteraction(agentName);
    scheduleDistillation(message, finalText, agentName);

    let agentTurnId: number | null = null;
    try {
      storeConversation(sessionId, agentName, 'user', message, {
        channel: options?.channel || 'web',
      });
      agentTurnId = storeConversation(sessionId, agentName, 'agent', finalText, {
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
    scheduleEvaluation(agentTurnId, message, finalText, agentName);

    return {
      text: finalText,
      model: logicalModel,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      durationMs,
      handledLocally: !selfEscalated,
      needsClaude: selfEscalated,
      handoffs,
      actions: actionsFromText,
      classification: { intent, depth, confidence, route: logicalModel, reason },
    };
  } catch (error) {
    const isCircuitOpen = error instanceof CircuitOpenError;
    const errMsg = (error as Error).message?.slice(0, 120) || 'unknown';
    const failureReason = isCircuitOpen ? 'circuit-open' : 'local-failed';
    console.error(`[Brain] Local ${failureReason}: ${errMsg}`);

    // ANY local failure (timeout, circuit open, crash) → try Claude fallback with
    // the same system prompt. This is the resilience path that turns a 60s local
    // timeout into a ~15s Claude response instead of a generic error message.
    try {
      const claudeResult = await claudeFallback(message, systemPrompt, { model: 'sonnet' });
      const durationMs = Date.now() - start;
      let finalText = claudeResult.text || 'Ollama is down and Claude came back empty. Retry shortly.';

      // Parse full action vocabulary from Claude response — same contract as local path.
      const actionsFromText = extractAndValidateActions(finalText);
      finalText = stripActionTags(finalText);
      const handoffsFromText = handoffsFromActions(actionsFromText);
      const handoffMap = new Map<string, string>();
      for (const h of classifierHandoffs) handoffMap.set(h.agent, h.message);
      for (const h of handoffsFromText) handoffMap.set(h.agent, h.message);
      const handoffs = Array.from(handoffMap.entries()).map(([agent, msg]) => ({ agent, message: msg }));

      console.log(`[CLAUDE] ${agentName} | ${failureReason} fallback | ${claudeResult.tokensOut}t | ${durationMs}ms`);
      reportActions(actionsFromText, agentName);

      addToHistory(agentName, 'user', message);
      addToHistory(agentName, 'assistant', finalText);
      markInteraction(agentName);
      scheduleDistillation(message, finalText, agentName);

      let agentTurnId: number | null = null;
      try {
        storeConversation(sessionId, agentName, 'user', message, {
          channel: options?.channel || 'web',
        });
        agentTurnId = storeConversation(sessionId, agentName, 'agent', finalText, {
          channel: options?.channel || 'web',
          modelUsed: 'claude-sonnet',
          tokensIn: claudeResult.tokensIn,
          tokensOut: claudeResult.tokensOut,
          latencyMs: durationMs,
          handledLocally: false,
        });
      } catch {}
      scheduleEvaluation(agentTurnId, message, finalText, agentName);
      rememberAgentTurn(agentName, finalText, agentTurnId);

      return {
        text: finalText,
        model: 'claude-sonnet',
        tokensIn: claudeResult.tokensIn,
        tokensOut: claudeResult.tokensOut,
        durationMs,
        handledLocally: false,
        needsClaude: true,
        handoffs,
        actions: actionsFromText,
        classification: { intent, depth, confidence, route: 'claude-sonnet', reason: failureReason },
      };
    } catch (fallbackErr) {
      console.error('[Brain] Both local AND Claude failed:', (fallbackErr as Error).message?.slice(0, 100));
      return {
        text: 'Local brain and Claude both failed. Check Ollama + network and try again.',
        model: 'both-down',
        tokensIn: 0,
        tokensOut: 0,
        durationMs: Date.now() - start,
        handledLocally: false,
        needsClaude: false,
        handoffs: classifierHandoffs,
        actions: [],
        classification: { intent, depth, confidence, route: 'error', reason: `both-failed:${failureReason}` },
      };
    }
  }
}

// Team roster used by extractAndValidateActions to reject invented agent names.
// Single source of truth; state-machine.ts uses its own role-specific subsets.
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

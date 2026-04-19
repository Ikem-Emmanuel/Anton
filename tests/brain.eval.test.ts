// Brain routing eval harness — the assertable replacement for tests/brain-e2e.md.
//
// Converts the Phase 2.5 DoD checklist into 25+ vitest cases that run in CI
// without touching Ollama or Claude. Split into three parts:
//
//   Part A — Pre-gate decisions (deterministic, no LLM). Proves the cheap
//            path at brain.ts:376 routes correctly before any LLM cost.
//   Part B — Action-tag extraction (parses agent responses). Proves
//            [HANDOFF:Name] / [DONE:taskId] / etc. decode correctly and
//            invalid targets are filtered.
//   Part C — End-to-end process() with mocked LLM + storage. Proves the
//            top-level brain.process() honors pre-gate hints, routes to
//            Claude or local as expected, and surfaces handoffs from text.
//
// All Phase 2.5 §3.8 requirements are covered: intent / needsClaude /
// handoffs / handledLocally / latency budget are all asserted.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { extractAgentActions, groupActions } from '../src/brain/agent-actions.js';
import { preGate } from '../src/brain/pre-gate.js';

// ─── Part A: Pre-gate decisions ──────────────────────────────────────────

describe('brain eval §A — pre-gate routing', () => {
  it('greeting "hey" → skipClassifier, greeting intent', () => {
    const hint = preGate('hey');
    expect(hint.skipClassifier).toBe(true);
    expect(hint.intent).toBe('greeting');
    expect(hint.needsClaude).toBeFalsy();
  });

  it('greeting "good morning" → skipClassifier, greeting intent', () => {
    const hint = preGate('good morning');
    expect(hint.intent).toBe('greeting');
  });

  it('approval "yes" → approval intent', () => {
    expect(preGate('yes').intent).toBe('approval');
  });

  it('approval emoji "👍" → approval intent', () => {
    expect(preGate('👍').intent).toBe('approval');
  });

  it('rejection "no" → approval intent (binary gate)', () => {
    expect(preGate('no').intent).toBe('approval');
  });

  it('ambiguous approval "yes please build the api" → defers to classifier', () => {
    const hint = preGate('yes please build the api');
    expect(hint.skipClassifier).toBe(false);
  });

  it('code block (fenced) → needsClaude true', () => {
    const hint = preGate('fix this:\n```ts\nconst x = 1;\n```');
    expect(hint.needsClaude).toBe(true);
  });

  it('long input (>1600 chars) → needsClaude true', () => {
    const longInput = `${'word '.repeat(400)}end.`;
    expect(preGate(longInput).needsClaude).toBe(true);
  });

  it('@claude prefix → forced Claude, skipClassifier', () => {
    const hint = preGate('@claude research auth patterns for FIDO2');
    expect(hint.needsClaude).toBe(true);
    expect(hint.skipClassifier).toBe(true);
  });

  it('@local prefix → forceLocal, skipClassifier', () => {
    const hint = preGate('@local what is 2+2');
    expect(hint.forceLocal).toBe(true);
    expect(hint.skipClassifier).toBe(true);
  });

  it('schedule "at 9am" → schedule intent', () => {
    expect(preGate('at 9am run standup').intent).toBe('schedule');
  });

  it('schedule "remind me" → schedule intent', () => {
    expect(preGate('remind me to ship the PR').intent).toBe('schedule');
  });

  it('schedule "in 30 minutes" → schedule intent', () => {
    expect(preGate('in 30 minutes check the deploy').intent).toBe('schedule');
  });

  it('general question → defers to classifier', () => {
    const hint = preGate('tell me about the sprint');
    expect(hint.skipClassifier).toBe(false);
    expect(hint.reason).toBe('classify');
  });

  it('empty message → safe no-op, defers', () => {
    expect(preGate('').skipClassifier).toBe(false);
  });

  it('whitespace-only → same as empty', () => {
    expect(preGate('   \n\t  ').skipClassifier).toBe(false);
  });
});

// ─── Part B: Action-tag extraction ───────────────────────────────────────

describe('brain eval §B — action tags and handoffs', () => {
  it('explicit handoff "[HANDOFF:James] Build API" → 1 handoff to James', () => {
    const actions = extractAgentActions('[HANDOFF:James] Build user profiles endpoint');
    const { handoffs } = groupActions(actions);
    expect(handoffs).toHaveLength(1);
    expect(handoffs[0].target).toBe('James');
    expect(handoffs[0].content).toContain('user profiles');
  });

  it('two handoffs in one response → both extracted', () => {
    const actions = extractAgentActions('[HANDOFF:James] backend API\n[HANDOFF:Elena] frontend page');
    const { handoffs } = groupActions(actions);
    expect(handoffs.map((h) => h.target)).toEqual(['James', 'Elena']);
  });

  it('[DONE: shipped the fix] → one DONE action, no handoffs', () => {
    const actions = extractAgentActions('[DONE: shipped the login fix]');
    const grouped = groupActions(actions);
    expect(grouped.dones).toHaveLength(1);
    expect(grouped.dones[0].content).toContain('login fix');
    expect(grouped.handoffs).toHaveLength(0);
  });

  // Numeric task-id on DONE/BLOCK is a deferred 4.5.3 follow-up; today only
  // alphanumeric targets are captured so `[DONE: shipped]` and `[BLOCK: reason]`
  // remain targetless and the content holds the payload.

  it('[BLOCK: cannot access prod] → one BLOCK action, reason in content', () => {
    const actions = extractAgentActions('[BLOCK: cannot access prod db]');
    const blocks = groupActions(actions).blocks;
    expect(blocks).toHaveLength(1);
    expect(blocks[0].content).toContain('prod');
  });

  it('[APPROVE:TASK-001 LGTM] → APPROVE with task id', () => {
    const actions = extractAgentActions('[APPROVE:TASK-001 LGTM reviewed the PR]');
    const approvals = groupActions(actions).approvals;
    expect(approvals).toHaveLength(1);
    expect(approvals[0].target).toBe('TASK-001');
    expect(approvals[0].content).toContain('LGTM');
  });

  it('[REJECT:TASK-001 needs fix] → REJECT with reason', () => {
    const actions = extractAgentActions('[REJECT:TASK-001 needs test coverage for edge case]');
    const rejects = groupActions(actions).rejects;
    expect(rejects).toHaveLength(1);
    expect(rejects[0].target).toBe('TASK-001');
    expect(rejects[0].content).toContain('test coverage');
  });

  it('[ASK:Sarah when is standup?] → ASK with target', () => {
    const actions = extractAgentActions("[ASK:Sarah when's standup today?]");
    const asks = groupActions(actions).asks;
    expect(asks).toHaveLength(1);
    expect(asks[0].target).toBe('Sarah');
  });

  it('mixed actions in one response → all captured separately', () => {
    const text = 'On it. [HANDOFF:James] build the API. [ASK:Sarah which priority?] [DONE: plan ready]';
    const actions = extractAgentActions(text);
    const g = groupActions(actions);
    expect(g.handoffs).toHaveLength(1);
    expect(g.asks).toHaveLength(1);
    expect(g.dones).toHaveLength(1);
  });

  it('plain text without tags → zero actions', () => {
    const actions = extractAgentActions("I'll check with James about this later, maybe tomorrow.");
    expect(actions).toHaveLength(0);
  });
});

// ─── Part C: End-to-end process() with mocked deps ───────────────────────
//
// Mock every side-effectful dependency so brain.process() runs against
// fake LLM responses. Keep the mocks minimal — only the symbols brain.ts
// imports. Anything not mocked here means brain.ts doesn't depend on it.

const mockChat = vi.hoisted(() => vi.fn());
const mockClassify = vi.hoisted(() => vi.fn());
const mockClaudeFallback = vi.hoisted(() => vi.fn());

vi.mock('../src/brain/ollama-client.js', () => ({
  chat: mockChat,
  chatJSON: vi.fn(),
  isHealthy: vi.fn(async () => true),
  listModels: vi.fn(async () => ['qwen3:8b']),
  getCircuitState: vi.fn(() => 'closed'),
  CircuitOpenError: class extends Error {},
}));

vi.mock('../src/brain/classifier.js', () => ({
  classify: mockClassify,
}));

vi.mock('../src/brain/claude-fallback.js', () => ({
  claudeFallback: mockClaudeFallback,
}));

// SQLite is a hot path — no-op every write so tests don't need a real DB.
vi.mock('../src/memory/sqlite.js', () => ({
  initSqliteMemory: vi.fn(),
  storeConversation: vi.fn(() => 1),
  buildMemoryContext: vi.fn(() => ''),
  buildSkillsContext: vi.fn(() => ''),
  createTask: vi.fn(),
  updateImplicitSignal: vi.fn(),
  storeMemory: vi.fn(),
  storeTurnEvaluation: vi.fn(),
  buildUserModelContext: vi.fn(() => ''),
  getMemoryStats: vi.fn(() => ({ total: 0 })),
  findSkillsByPattern: vi.fn(() => []),
  storeSkill: vi.fn(),
}));

vi.mock('../src/spine/web.js', () => ({
  emitEventLogged: vi.fn(),
  emit: vi.fn(),
}));

vi.mock('../src/brain/distill.js', () => ({
  distillConversation: vi.fn(async () => ({ extracted: 0, stored: 0, durationMs: 1 })),
}));
vi.mock('../src/brain/evaluate.js', () => ({
  evaluateTurn: vi.fn(async () => ({ verdict: null, scores: null, durationMs: 1 })),
}));
vi.mock('../src/brain/feedback-capture.js', () => ({ captureImplicitFeedback: vi.fn(() => 'ambiguous') }));
vi.mock('../src/brain/skill-extract.js', () => ({ extractSkillCandidate: vi.fn() }));
vi.mock('../src/brain/ambient-context.js', () => ({ buildAmbientContext: vi.fn(() => '') }));

const { process: brainProcess } = await import('../src/brain/brain.js');

describe('brain eval §C — process() end-to-end', () => {
  beforeEach(() => {
    mockChat.mockReset();
    mockClassify.mockReset();
    mockClaudeFallback.mockReset();
  });

  it('greeting routes local, returns under latency budget', async () => {
    mockChat.mockResolvedValue({
      content: 'Hey Noel.',
      thinking: null,
      model: 'qwen3:8b',
      tokensIn: 50,
      tokensOut: 5,
      durationMs: 420,
    });

    const res = await brainProcess('hey');
    expect(res.handledLocally).toBe(true);
    expect(res.needsClaude).toBe(false);
    expect(res.durationMs).toBeLessThan(5000);
    // Pre-gate should have short-circuited the classifier.
    expect(mockClassify).not.toHaveBeenCalled();
  });

  it('@claude prefix forces Claude fallback', async () => {
    mockClaudeFallback.mockResolvedValue({
      text: 'Researched FIDO2; here are the relevant points.',
      tokensIn: 200,
      tokensOut: 400,
    });

    const res = await brainProcess('@claude research FIDO2 auth patterns');
    expect(res.needsClaude).toBe(true);
    expect(mockClaudeFallback).toHaveBeenCalledOnce();
    expect(mockChat).not.toHaveBeenCalled();
    expect(mockClassify).not.toHaveBeenCalled();
  });

  it('code block routes to Claude without touching classifier', async () => {
    mockClaudeFallback.mockResolvedValue({
      text: "Here's the fix.",
      tokensIn: 100,
      tokensOut: 200,
    });

    const res = await brainProcess('fix:\n```ts\nconst x: number = "bad";\n```');
    expect(res.needsClaude).toBe(true);
    expect(mockClassify).not.toHaveBeenCalled();
    expect(mockClaudeFallback).toHaveBeenCalledOnce();
  });

  it('[HANDOFF:James] in agent text surfaces as a handoff', async () => {
    mockClassify.mockResolvedValue({
      intent: 'task',
      complexity: 'simple',
      needsClaude: false,
      adaptiveDepth: 'standard',
      confidence: 0.9,
      handoffs: [],
      route: 'local-fast',
      reason: 'task routing',
    });
    mockChat.mockResolvedValue({
      content: 'On it. [HANDOFF:James] Build the user profile endpoint.',
      thinking: null,
      model: 'qwen3:8b',
      tokensIn: 120,
      tokensOut: 30,
      durationMs: 600,
    });

    const res = await brainProcess('build a user profile endpoint');
    expect(res.handoffs).toHaveLength(1);
    expect(res.handoffs[0].agent).toBe('James');
    expect(res.actions.some((a) => a.type === 'HANDOFF')).toBe(true);
  });

  it('invalid handoff target is filtered', async () => {
    mockClassify.mockResolvedValue({
      intent: 'task',
      complexity: 'simple',
      needsClaude: false,
      adaptiveDepth: 'standard',
      confidence: 0.9,
      handoffs: [],
      route: 'local-fast',
      reason: 'task routing',
    });
    mockChat.mockResolvedValue({
      content: '[HANDOFF:Grognak] fix the bug',
      thinking: null,
      model: 'qwen3:8b',
      tokensIn: 80,
      tokensOut: 20,
      durationMs: 400,
    });

    const res = await brainProcess('fix the bug');
    expect(res.handoffs).toHaveLength(0);
  });

  it('classifier needsClaude:true routes to Claude', async () => {
    mockClassify.mockResolvedValue({
      intent: 'research',
      complexity: 'complex',
      needsClaude: true,
      adaptiveDepth: 'deep',
      confidence: 0.85,
      handoffs: [],
      route: 'claude-sonnet',
      reason: 'complex research',
    });
    mockClaudeFallback.mockResolvedValue({
      text: 'Research complete.',
      tokensIn: 300,
      tokensOut: 500,
    });

    const res = await brainProcess('analyze the market for edge LLM inference in 2026');
    expect(res.needsClaude).toBe(true);
    expect(mockClaudeFallback).toHaveBeenCalledOnce();
    expect(mockChat).not.toHaveBeenCalled();
  });
});

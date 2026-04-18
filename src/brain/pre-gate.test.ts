// Pre-gate routing tests — deterministic, no Ollama needed. Runs in CI.
// Part of the Phase 2.5 eval harness. Expand these cases to lock behavior.

import { describe, expect, it } from 'vitest';
import { preGate } from './pre-gate.js';

describe('Pre-gate routing', () => {
  describe('Override prefixes', () => {
    it('routes @claude prefix to Claude', () => {
      const hint = preGate('@claude research the best auth patterns');
      expect(hint.needsClaude).toBe(true);
      expect(hint.skipClassifier).toBe(true);
      expect(hint.reason).toContain('@claude');
    });

    it('routes @local prefix forcing local', () => {
      const hint = preGate('@local what is my team?');
      expect(hint.forceLocal).toBe(true);
      expect(hint.skipClassifier).toBe(true);
    });

    it('handles colon variant', () => {
      expect(preGate('@claude:do this').needsClaude).toBe(true);
      expect(preGate('@local:do this').forceLocal).toBe(true);
    });
  });

  describe('Code blocks force Claude', () => {
    it('detects triple-backtick code', () => {
      const hint = preGate('here is my code:\n```ts\nconst x = 1;\n```');
      expect(hint.needsClaude).toBe(true);
      expect(hint.reason).toBe('code-block');
    });

    it('detects multiline code without language', () => {
      const hint = preGate('```\nfunction foo() { return 1 }\n```');
      expect(hint.needsClaude).toBe(true);
    });
  });

  describe('Long inputs', () => {
    it('routes >1600 char input to Claude', () => {
      const longMsg = 'word '.repeat(400); // ~2000 chars
      const hint = preGate(longMsg);
      expect(hint.needsClaude).toBe(true);
      expect(hint.reason).toBe('long-input');
    });

    it('allows short input through to classifier', () => {
      const hint = preGate('what is the time?');
      expect(hint.skipClassifier).toBe(false);
    });
  });

  describe('Greetings', () => {
    for (const g of ['hey', 'hi', 'hello', 'yo', 'gm', 'good morning', 'Good Morning', 'GN']) {
      it(`detects "${g}" as greeting`, () => {
        const hint = preGate(g);
        expect(hint.intent).toBe('greeting');
        expect(hint.adaptiveDepth).toBe('minimal');
        expect(hint.skipClassifier).toBe(true);
      });
    }
  });

  describe('Approvals', () => {
    for (const a of ['yes', 'no', 'ok', 'okay', 'approve', 'approved', 'deny', 'rejected', '👍', '👎']) {
      it(`detects "${a}" as approval`, () => {
        const hint = preGate(a);
        expect(hint.intent).toBe('approval');
        expect(hint.adaptiveDepth).toBe('minimal');
      });
    }
  });

  describe('System commands', () => {
    for (const c of ['shutdown', 'restart', 'status', 'health', 'ping']) {
      it(`detects "${c}" as system command`, () => {
        const hint = preGate(c);
        expect(hint.intent).toBe('system_command');
        expect(hint.adaptiveDepth).toBe('minimal');
      });
    }
  });

  describe('Schedule', () => {
    it('detects schedule commands', () => {
      const hint = preGate('schedule message to Marcus at 5pm');
      expect(hint.skipClassifier).toBe(true);
      expect(hint.intent).toBe('schedule');
    });

    it('detects remind me', () => {
      const hint = preGate('remind me at 9am tomorrow');
      expect(hint.intent).toBe('schedule');
    });

    it('detects in-N-minutes', () => {
      const hint = preGate('in 30 min check the deploy');
      expect(hint.intent).toBe('schedule');
    });
  });

  describe('Ambiguous messages defer to classifier', () => {
    it('defers on open question', () => {
      const hint = preGate('tell me about the sprint');
      expect(hint.skipClassifier).toBe(false);
      expect(hint.reason).toBe('classify');
    });

    it('defers on mid-length prose', () => {
      const hint = preGate('What are we working on today? I want a quick status from each agent.');
      expect(hint.skipClassifier).toBe(false);
    });

    it('defers on agent-name mention', () => {
      const hint = preGate('ask Marcus to review the PR');
      expect(hint.skipClassifier).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('strips surrounding whitespace', () => {
      const hint = preGate('  hey  ');
      expect(hint.intent).toBe('greeting');
    });

    it('handles empty string safely', () => {
      const hint = preGate('');
      expect(hint.skipClassifier).toBe(false); // empty defers (classifier returns safe default)
    });

    it('distinguishes "yes" from "yes please build the api"', () => {
      expect(preGate('yes').intent).toBe('approval');
      expect(preGate('yes please build the api').skipClassifier).toBe(false); // ambiguous, defer
    });
  });
});

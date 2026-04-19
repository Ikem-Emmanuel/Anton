// Tests for implicit feedback capture (Phase 3.5 §4.5.3).

import { describe, expect, it } from 'vitest';
import { captureImplicitFeedback } from './feedback-capture.js';

describe('Implicit feedback capture', () => {
  describe('accepted signal', () => {
    for (const msg of [
      'yes',
      'yep ship it',
      'perfect, thanks',
      'great, go ahead',
      'ok do it',
      "that's right",
      'nice work',
      'love it',
      'thank you',
      '👍',
    ]) {
      it(`detects "${msg}" as accepted`, () => {
        expect(captureImplicitFeedback('prior agent response', msg)).toBe('accepted');
      });
    }
  });

  describe('corrected signal', () => {
    for (const msg of [
      'no, try again',
      'nope',
      'not quite',
      'actually, it should be different',
      'redo this',
      'wrong direction',
      'fix this',
      "that's not what I meant",
      '👎',
    ]) {
      it(`detects "${msg}" as corrected`, () => {
        expect(captureImplicitFeedback('prior agent response', msg)).toBe('corrected');
      });
    }
  });

  describe('ambiguous signal', () => {
    it('returns ambiguous for empty current message', () => {
      expect(captureImplicitFeedback('prior', '')).toBe('ambiguous');
    });

    it('returns ambiguous for off-topic follow-up', () => {
      expect(
        captureImplicitFeedback('Here is the sprint plan for auth feature.', 'What time is standup tomorrow?')
      ).toBe('ambiguous');
    });

    it('returns ambiguous for neutral acknowledgment-less continuation', () => {
      expect(captureImplicitFeedback('Review the PR for user profiles.', 'Also check the deploy logs.')).toBe(
        'ambiguous'
      );
    });
  });

  describe('overlap-based correction detection', () => {
    it('flags high-overlap reply with contradiction marker as corrected', () => {
      const prior = 'The auth flow uses bcrypt for password storage with TOTP for MFA and HMAC session tokens.';
      const current =
        'Actually, the auth flow should use argon2 not bcrypt for password storage with TOTP and HMAC session tokens.';
      expect(captureImplicitFeedback(prior, current)).toBe('corrected');
    });

    it('does not flag high-overlap neutral follow-up as corrected', () => {
      const prior = 'Backend endpoints: POST /auth/login, POST /auth/refresh, and TOTP verify.';
      const current = 'Great. Can you add OAuth endpoints too to the backend login refresh list?';
      // Has 'great' so accepted wins via stage 1 before overlap
      expect(captureImplicitFeedback(prior, current)).toBe('accepted');
    });
  });

  describe('HANDOFF/action tags stripped from prior text', () => {
    it('handles agent text with embedded action tags', () => {
      const prior = '[DONE: backend committed] [HANDOFF:Priya] please review';
      const current = 'yes';
      expect(captureImplicitFeedback(prior, current)).toBe('accepted');
    });
  });
});

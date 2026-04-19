import { describe, expect, it } from 'vitest';
import { analyzeForHandoffs, buildHandoffMessage, stripExplicitHandoffs } from './handoff.js';

describe('handoff', () => {
  describe('analyzeForHandoffs', () => {
    it('detects explicit HANDOFF: lines', () => {
      const response =
        'Sure, I will get Elena involved.\nHANDOFF: Elena — Please prep for candidate interviews with Anton.';
      const handoffs = analyzeForHandoffs('Marcus', response, 'reach out to elena');
      expect(handoffs).toHaveLength(1);
      expect(handoffs[0].target.name).toBe('Elena');
      expect(handoffs[0].signal).toBe('explicit');
      expect(handoffs[0].confidence).toBe(1.0);
    });

    it('detects future delegation — "I\'ll ping Elena"', () => {
      const response = "I'll ping Elena shortly.";
      const handoffs = analyzeForHandoffs('Marcus', response, 'contact elena');
      expect(handoffs).toHaveLength(1);
      expect(handoffs[0].target.name).toBe('Elena');
      expect(handoffs[0].signal).toBe('future-delegation');
    });

    it('detects "let me loop in James"', () => {
      const response = 'Let me loop in James on the backend review.';
      const handoffs = analyzeForHandoffs('Marcus', response, 'need backend help');
      expect(handoffs).toHaveLength(1);
      expect(handoffs[0].target.name).toBe('James');
    });

    it('detects past delegation — "Pinged Elena"', () => {
      const response = 'Pinged Elena about it. She should reach out shortly.';
      const handoffs = analyzeForHandoffs('Marcus', response, 'tell elena');
      expect(handoffs).toHaveLength(1);
      expect(handoffs[0].target.name).toBe('Elena');
      expect(handoffs[0].signal).toBe('past-delegation');
    });

    it('detects direct delegation — "ask James to review"', () => {
      const response = "I'll ask James to review the auth implementation before we ship.";
      const handoffs = analyzeForHandoffs('Marcus', response, 'need review');
      expect(handoffs).toHaveLength(1);
      expect(handoffs[0].target.name).toBe('James');
      expect(handoffs[0].signal).toBe('direct-delegation');
    });

    it('detects referral — "that\'s Elena\'s area"', () => {
      const response = "That's Elena's area — she handles all the frontend work.";
      const handoffs = analyzeForHandoffs('Marcus', response, 'who does frontend');
      expect(handoffs).toHaveLength(1);
      expect(handoffs[0].target.name).toBe('Elena');
      expect(handoffs[0].signal).toBe('referral');
    });

    it('detects "Priya should handle this"', () => {
      const response = 'Priya should handle the QA on this before we merge.';
      const handoffs = analyzeForHandoffs('Marcus', response, 'who tests');
      expect(handoffs).toHaveLength(1);
      expect(handoffs[0].target.name).toBe('Priya');
    });

    it('detects multiple handoffs from separate sentences', () => {
      const response = "I'll ask James to build the API. Let me loop in Elena on the frontend form.";
      const handoffs = analyzeForHandoffs('Marcus', response, 'build the feature');
      expect(handoffs.length).toBeGreaterThanOrEqual(2);
      const names = handoffs.map((h) => h.target.name);
      expect(names).toContain('James');
      expect(names).toContain('Elena');
    });

    it('does not handoff to self', () => {
      const response = "I'll handle this myself. Marcus is on it.";
      const handoffs = analyzeForHandoffs('Marcus', response, 'do this');
      expect(handoffs).toHaveLength(0);
    });

    it('respects HANDOFF_RULES allowlist', () => {
      // James can only reach Marcus, Priya, Omar, Riley per HANDOFF_RULES
      const response = "I'll ping Diana about the marketing angle.";
      const handoffs = analyzeForHandoffs('James', response, 'marketing help');
      // Diana is not in James's allowlist
      expect(handoffs).toHaveLength(0);
    });

    it('returns empty for responses with no handoff signals', () => {
      const response = 'Here is the code review. Everything looks good, no issues found.';
      const handoffs = analyzeForHandoffs('Marcus', response, 'review this');
      expect(handoffs).toHaveLength(0);
    });

    it('detects vocative — "Elena, can you reach out..."', () => {
      const response =
        'Elena, can you reach out to Anton directly? Noel wants you two to prep for an interview together.';
      const handoffs = analyzeForHandoffs('Marcus', response, 'contact elena');
      expect(handoffs.length).toBeGreaterThanOrEqual(1);
      expect(handoffs[0].target.name).toBe('Elena');
      expect(handoffs[0].signal).toBe('vocative');
    });

    it('detects vocative with em dash — "Elena \u2014 prep for..."', () => {
      const response = 'Elena \u2014 prep for the interview with Noel.';
      const handoffs = analyzeForHandoffs('Marcus', response, 'prep elena');
      expect(handoffs.length).toBeGreaterThanOrEqual(1);
      expect(handoffs[0].target.name).toBe('Elena');
    });

    it('detects vocative with greeting — "Hey Elena, Noel needs you"', () => {
      const response = 'Hey Elena, Noel needs you on this.';
      const handoffs = analyzeForHandoffs('Marcus', response, 'get elena');
      expect(handoffs.length).toBeGreaterThanOrEqual(1);
      expect(handoffs[0].target.name).toBe('Elena');
    });

    it('detects @mention — "@Elena check this out"', () => {
      const response = '@Elena check this out';
      const handoffs = analyzeForHandoffs('Marcus', response, 'tell elena');
      expect(handoffs.length).toBeGreaterThanOrEqual(1);
      expect(handoffs[0].target.name).toBe('Elena');
    });

    it('does not trigger on name mentions without delegation verbs', () => {
      const response = 'James wrote this code last week. It looks solid.';
      const handoffs = analyzeForHandoffs('Marcus', response, 'who wrote this');
      expect(handoffs).toHaveLength(0);
    });

    it('deduplicates — same agent mentioned multiple times', () => {
      const response = "I'll ping Elena about it. Already told Elena the context. Elena should handle the frontend.";
      const handoffs = analyzeForHandoffs('Marcus', response, 'frontend help');
      const elenaHandoffs = handoffs.filter((h) => h.target.name === 'Elena');
      expect(elenaHandoffs).toHaveLength(1);
    });
  });

  describe('stripExplicitHandoffs', () => {
    it('removes HANDOFF: lines', () => {
      const text = 'Sure, on it.\nHANDOFF: Elena — do the thing';
      expect(stripExplicitHandoffs(text)).toBe('Sure, on it.');
    });

    it('keeps other content intact', () => {
      const text = 'No handoffs here. Just a normal response.';
      expect(stripExplicitHandoffs(text)).toBe(text);
    });

    it('handles null/empty', () => {
      expect(stripExplicitHandoffs(null)).toBeNull();
      expect(stripExplicitHandoffs('')).toBe('');
    });
  });

  describe('buildHandoffMessage', () => {
    it('includes the from agent name', () => {
      const msg = buildHandoffMessage('Marcus', 'Elena', 'direct', 'prep for interviews', 'contact elena');
      expect(msg).toContain('Marcus');
    });

    it('includes the message content', () => {
      const msg = buildHandoffMessage('Marcus', 'Elena', 'direct', 'prep for interviews', 'contact elena');
      expect(msg).toContain('prep for interviews');
    });

    it('includes original message for non-explicit signals', () => {
      const msg = buildHandoffMessage('Marcus', 'Elena', 'referral', 'frontend work', 'who does frontend');
      expect(msg).toContain('who does frontend');
    });
  });
});

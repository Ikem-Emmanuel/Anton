import { describe, expect, it } from 'vitest';
import { extractResponse } from './thinking.js';

describe('brain', () => {
  describe('extractResponse', () => {
    it('extracts response from plain text', () => {
      const { thinking, response } = extractResponse('Hello there.');
      expect(thinking).toBeNull();
      expect(response).toBe('Hello there.');
    });

    it('strips think tags from content', () => {
      const { thinking, response } = extractResponse('<think>reasoning here</think>The answer is 4.');
      expect(thinking).toBe('reasoning here');
      expect(response).toBe('The answer is 4.');
    });

    it('strips stray closing think tags', () => {
      const { response } = extractResponse('</think>The answer is 4.');
      expect(response).toBe('The answer is 4.');
    });

    it('handles empty content', () => {
      const { thinking, response } = extractResponse('');
      expect(thinking).toBeNull();
      expect(response).toBe('');
    });

    it('handles content that is only think tags', () => {
      const { thinking, response } = extractResponse('<think>all thinking no answer</think>');
      expect(thinking).toBe('all thinking no answer');
      expect(response).toBe('');
    });
  });
});

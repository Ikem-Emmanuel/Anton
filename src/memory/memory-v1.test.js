import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  appendDailyNote,
  appendDeptMemory,
  appendSharedMemory,
  getDailyNote,
  initMemory,
  readDeptMemory,
  readSharedMemory,
} from './memory-v1.js';

describe('memory', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'anton-memory-'));
    initMemory(tempDir, tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('readSharedMemory', () => {
    it('returns empty string when file does not exist', () => {
      expect(readSharedMemory()).toBe('');
    });

    it('returns content after appendSharedMemory', () => {
      appendSharedMemory('Riley', 'Sprint 5 completed. All tasks done.');
      const content = readSharedMemory();
      expect(content).toContain('Riley');
      expect(content).toContain('Sprint 5 completed');
    });

    it('accumulates multiple entries', () => {
      appendSharedMemory('Marcus', 'Auth PR approved.');
      appendSharedMemory('Sarah', 'Sprint 6 planned.');
      const content = readSharedMemory();
      expect(content).toContain('Marcus');
      expect(content).toContain('Sarah');
      expect(content).toContain('Auth PR approved');
      expect(content).toContain('Sprint 6 planned');
    });

    it('truncates to last 2000 chars for large files', () => {
      // Write more than 2000 chars
      for (let i = 0; i < 50; i++) {
        appendSharedMemory('Agent', `Entry ${i}: ${'x'.repeat(100)}`);
      }
      const content = readSharedMemory();
      expect(content.length).toBeLessThanOrEqual(2000);
      // Should contain later entries, not earlier ones
      expect(content).toContain('Entry 49');
    });
  });

  describe('appendDeptMemory / readDeptMemory', () => {
    it('returns empty string for non-existent dept', () => {
      expect(readDeptMemory('eng')).toBe('');
    });

    it('writes and reads dept memory', () => {
      appendDeptMemory('eng', 'James', 'Shipped auth endpoint.');
      const content = readDeptMemory('eng');
      expect(content).toContain('James');
      expect(content).toContain('Shipped auth endpoint');
    });

    it('creates dept directory if needed', () => {
      appendDeptMemory('mktg', 'Diana', 'Content calendar ready.');
      expect(existsSync(join(tempDir, 'config', 'departments', 'mktg'))).toBe(true);
    });
  });

  describe('getDailyNote / appendDailyNote', () => {
    it('returns empty string for today if no notes', () => {
      expect(getDailyNote()).toBe('');
    });

    it('appends and reads daily notes', () => {
      appendDailyNote('Sprint kickoff completed');
      appendDailyNote('Elena shipped agent detail page');
      const content = getDailyNote();
      expect(content).toContain('Sprint kickoff');
      expect(content).toContain('Elena shipped');
    });
  });
});

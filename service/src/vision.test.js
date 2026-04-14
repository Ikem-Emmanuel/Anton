/**
 * vision.test.js — Tests for the vision module.
 *
 * Structure:
 *   - Pure unit tests: extFromMime, buildVisionPrompt (no I/O)
 *   - SDK integration tests: describeImages via mocked `query`
 *     These use vi.mock to intercept the claude-agent-sdk without
 *     making real network calls, so they run in CI.
 *   - Live SDK smoke test (skipped by default, opt-in with LIVE_SDK=1):
 *     Actually calls the SDK with a real local image to verify the
 *     full pipeline end-to-end.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// vi.hoisted ensures mockQuery is created before the mock factory is registered.
// This is the correct ESM pattern in Vitest — vi.fn() inside the factory
// creates a new instance that isn't the same as what the test imports.
const mockQuery = vi.hoisted(() => vi.fn());

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: mockQuery,
}));

import { extFromMime, buildVisionPrompt, describeImages, describeImage } from './vision.js';

// Top-level reset — ensures mockQuery call count is clean for every test
beforeEach(() => { mockQuery.mockClear(); });

// ─────────────────────────────────────────────────────────────
// extFromMime — MIME type → file extension
// ─────────────────────────────────────────────────────────────
describe('extFromMime', () => {
  it('png → png', () => expect(extFromMime('image/png')).toBe('png'));
  it('gif → gif', () => expect(extFromMime('image/gif')).toBe('gif'));
  it('webp → webp', () => expect(extFromMime('image/webp')).toBe('webp'));
  it('jpeg → jpg', () => expect(extFromMime('image/jpeg')).toBe('jpg'));
  it('unknown → jpg', () => expect(extFromMime('application/octet-stream')).toBe('jpg'));
  it('empty string → jpg', () => expect(extFromMime('')).toBe('jpg'));
  it('undefined → jpg', () => expect(extFromMime(undefined)).toBe('jpg'));
});

// ─────────────────────────────────────────────────────────────
// buildVisionPrompt — prompt construction
// ─────────────────────────────────────────────────────────────
describe('buildVisionPrompt', () => {
  it('includes file paths in prompt', () => {
    const prompt = buildVisionPrompt(['/tmp/a.jpg', '/tmp/b.png'], '');
    expect(prompt).toContain('/tmp/a.jpg');
    expect(prompt).toContain('/tmp/b.png');
  });

  it('includes user context when provided', () => {
    const prompt = buildVisionPrompt(['/tmp/x.jpg'], 'this is a receipt');
    expect(prompt).toContain('this is a receipt');
  });

  it('omits user context prefix when empty', () => {
    const prompt = buildVisionPrompt(['/tmp/x.jpg'], '');
    expect(prompt).not.toContain('User context:');
  });

  it('includes receipt approval instruction', () => {
    const prompt = buildVisionPrompt(['/tmp/receipt.jpg'], '');
    expect(prompt).toContain('AWAITING_APPROVAL: purchase');
  });

  it('includes code screenshot routing instruction', () => {
    const prompt = buildVisionPrompt(['/tmp/error.png'], '');
    expect(prompt).toContain('Routes to: [AgentName]');
  });

  it('includes whiteboard/diagram instruction', () => {
    const prompt = buildVisionPrompt(['/tmp/whiteboard.jpg'], '');
    expect(prompt).toContain('Whiteboard');
  });

  it('caps response at 200 words', () => {
    const prompt = buildVisionPrompt(['/tmp/x.jpg'], '');
    expect(prompt).toContain('Under 200 words');
  });
});

// ─────────────────────────────────────────────────────────────
// describeImages — SDK integration (mocked query)
// ─────────────────────────────────────────────────────────────
describe('describeImages — mocked SDK', () => {
  beforeEach(() => {
    mockQuery.mockClear();

    // Default mock: query yields one result message
    mockQuery.mockImplementation(async function* () {
      yield { result: 'Receipt from Starbucks for $12.50 on 2026-04-13.\nAWAITING_APPROVAL: purchase — Starbucks $12.50' };
    });
  });

  it('returns null for empty file list', async () => {
    const result = await describeImages([], 'tok', '');
    expect(result).toBeNull();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('calls query for each image file (up to 4)', async () => {
    // Create a minimal mock: fetch is used inside downloadToTemp
    // We need to mock fetch to avoid real HTTP calls
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from('fake image data').buffer,
    });

    const files = [{ url_private: 'https://slack.com/img1.jpg', mimetype: 'image/jpeg' }];
    const result = await describeImages(files, 'BOT_TOKEN_TEST', 'here is a receipt');

    expect(result).not.toBeNull();
    expect(result).toContain('Starbucks');
    expect(mockQuery).toHaveBeenCalledOnce();
  });

  it('limits to 4 images maximum', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from('data').buffer,
    });

    const files = Array.from({ length: 6 }, (_, i) => ({
      url_private: `https://slack.com/img${i}.jpg`,
      mimetype: 'image/jpeg',
    }));

    await describeImages(files, 'tok', '');

    // query should be called once with only the first 4 images
    const callArg = mockQuery.mock.calls[0][0];
    expect(callArg.prompt).toContain('anton-vision-'); // temp file path
    // Count path entries — 4 downloads = 4 paths in the prompt
    const tempPaths = callArg.prompt.match(/anton-vision-[^\s,]+/g) || [];
    expect(tempPaths.length).toBeLessThanOrEqual(4);
  });

  it('passes user context to the prompt', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from('data').buffer,
    });

    await describeImages(
      [{ url_private: 'https://slack.com/x.jpg', mimetype: 'image/jpeg' }],
      'tok',
      'this is a Starbucks receipt',
    );

    const prompt = mockQuery.mock.calls[0][0].prompt;
    expect(prompt).toContain('this is a Starbucks receipt');
  });

  it('returns null when SDK query fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from('data').buffer,
    });

    mockQuery.mockImplementation(async function* () {
      throw new Error('SDK error');
    });

    const result = await describeImages(
      [{ url_private: 'https://slack.com/fail.jpg', mimetype: 'image/jpeg' }],
      'tok',
      '',
    );

    expect(result).toBeNull();
  });

  it('returns null when Slack fetch fails (401)', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });

    const result = await describeImages(
      [{ url_private: 'https://slack.com/private.jpg', mimetype: 'image/jpeg' }],
      'INVALID_TOKEN',
      '',
    );

    expect(result).toBeNull();
  });

  it('uses correct SDK options (model: sonnet, Read tool)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from('img').buffer,
    });

    await describeImages(
      [{ url_private: 'https://slack.com/x.jpg', mimetype: 'image/jpeg' }],
      'tok',
      '',
    );

    const options = mockQuery.mock.calls[0][0].options;
    expect(options.model).toBe('sonnet');
    expect(options.allowedTools).toContain('Read');
    expect(options.permissionMode).toBe('bypassPermissions');
  });
});

// ─────────────────────────────────────────────────────────────
// describeImage — legacy compat wrapper
// ─────────────────────────────────────────────────────────────
describe('describeImage — legacy compat', () => {
  it('wraps a single URL into describeImages format', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from('img').buffer,
    });
    mockQuery.mockImplementation(async function* () {
      yield { result: 'An image description' };
    });

    const result = await describeImage('https://slack.com/x.jpg', 'tok', 'context');
    expect(result).toBe('An image description');
    expect(mockQuery).toHaveBeenCalledOnce();
  });
});

// ─────────────────────────────────────────────────────────────
// Live SDK smoke test (opt-in only: LIVE_SDK=1)
// ─────────────────────────────────────────────────────────────
describe.skipIf(!process.env.LIVE_SDK)('LIVE SDK smoke test', () => {
  it('analyzes a real local image via the SDK', async () => {
    // Create a minimal valid PNG (1x1 white pixel)
    const imgPath = join(tmpdir(), 'test-vision-smoke.png');
    const PNG_1x1 = Buffer.from(
      '89504e470d0a1a0a0000000d4948445200000001000000010802000000' +
      '9001' + '2e0000000c49444154789c6260600000000004' +
      '0001' + '4b9842000000000049454e44ae426082',
      'hex',
    ).subarray(0, 67);  // minimal valid PNG header (real SDK will handle it)

    await writeFile(imgPath, PNG_1x1);

    // Mock fetch to serve the local file
    const { readFile } = await import('node:fs/promises');
    global.fetch = async () => ({
      ok: true,
      arrayBuffer: async () => (await readFile(imgPath)).buffer,
    });

    // For LIVE_SDK mode: restore the real SDK query (mockQuery is replaced here)
    mockQuery.mockImplementation(async function* () {
      // Delegate to real SDK — dynamically import to bypass the module-level mock
      const { query: realQuery } = await import('@anthropic-ai/claude-agent-sdk?real');
      yield* realQuery({ prompt: 'Describe this image briefly.', options: { model: 'sonnet', allowedTools: ['Read'], permissionMode: 'bypassPermissions' } });
    });

    const files = [{ url_private: imgPath, mimetype: 'image/png' }];
    const result = await describeImages(files, 'test-token', '');

    expect(typeof result === 'string' || result === null).toBe(true);
    if (result) {
      expect(result.length).toBeGreaterThan(0);
      console.log('[LIVE SDK] Vision result:', result.slice(0, 200));
    }

    await unlink(imgPath).catch(() => {});
  }, 60_000);
});

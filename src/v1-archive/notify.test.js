import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { consumeBriefingBuffer, forceFlushDigest, initNotify, notifyNoel, shutdownNotify } from './notify.js';

function createMockClient() {
  return {
    conversations: {
      open: vi.fn().mockResolvedValue({ channel: { id: 'D_NOEL_DM' } }),
    },
    chat: {
      postMessage: vi.fn().mockResolvedValue({ ok: true }),
    },
  };
}

describe('notify', () => {
  let client;

  beforeEach(() => {
    client = createMockClient();
    initNotify({ slackClient: client, noelUserId: 'U_NOEL' });
  });

  afterEach(() => {
    shutdownNotify();
  });

  describe('P0 — emergency', () => {
    it('sends Slack DM immediately', async () => {
      await notifyNoel('P0', 'Service down');
      expect(client.chat.postMessage).toHaveBeenCalledOnce();
      const call = client.chat.postMessage.mock.calls[0][0];
      expect(call.channel).toBe('D_NOEL_DM');
      expect(call.text).toContain('P0');
      expect(call.attachments[0].color).toBe('#FF0000');
    });

    it('sends even during quiet hours', async () => {
      // P0 ignores quiet hours
      initNotify({ slackClient: client, noelUserId: 'U_NOEL', quietStart: 0, quietEnd: 23 });
      await notifyNoel('P0', 'Critical failure');
      expect(client.chat.postMessage).toHaveBeenCalledOnce();
    });
  });

  describe('P1 — urgent', () => {
    it('sends Slack DM outside quiet hours', async () => {
      // Set quiet hours far from now
      initNotify({ slackClient: client, noelUserId: 'U_NOEL', quietStart: 25, quietEnd: 26 });
      await notifyNoel('P1', 'PR needs review');
      expect(client.chat.postMessage).toHaveBeenCalledOnce();
      const call = client.chat.postMessage.mock.calls[0][0];
      expect(call.attachments[0].color).toBe('#FF8C00');
    });

    it('buffers to digest during quiet hours', async () => {
      initNotify({ slackClient: client, noelUserId: 'U_NOEL', quietStart: 0, quietEnd: 24 });
      await notifyNoel('P1', 'Buffered alert');
      expect(client.chat.postMessage).not.toHaveBeenCalled();
      // Flush the digest to verify it was buffered
      await forceFlushDigest();
      expect(client.chat.postMessage).toHaveBeenCalledOnce();
      expect(client.chat.postMessage.mock.calls[0][0].text).toContain('Digest');
    });
  });

  describe('P2 — important', () => {
    it('buffers for hourly digest, not sent immediately', async () => {
      await notifyNoel('P2', 'New Asana task');
      expect(client.chat.postMessage).not.toHaveBeenCalled();
    });

    it('flushes multiple items in one digest', async () => {
      await notifyNoel('P2', 'Task one');
      await notifyNoel('P2', 'Task two');
      await notifyNoel('P2', 'Task three');
      await forceFlushDigest();
      expect(client.chat.postMessage).toHaveBeenCalledOnce();
      const text = client.chat.postMessage.mock.calls[0][0].text;
      expect(text).toContain('3 items');
      expect(text).toContain('Task one');
      expect(text).toContain('Task three');
    });

    it('does nothing when digest is empty', async () => {
      await forceFlushDigest();
      expect(client.chat.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('P3 — info', () => {
    it('buffers for morning briefing, not sent immediately', async () => {
      await notifyNoel('P3', 'FYI update');
      expect(client.chat.postMessage).not.toHaveBeenCalled();
    });

    it('consumeBriefingBuffer returns and clears items', async () => {
      await notifyNoel('P3', 'Note one');
      await notifyNoel('P3', 'Note two');
      const items = consumeBriefingBuffer();
      expect(items).toHaveLength(2);
      expect(items[0].message).toBe('Note one');
      expect(items[1].message).toBe('Note two');
      // Buffer is now empty
      expect(consumeBriefingBuffer()).toHaveLength(0);
    });
  });

  describe('cooldown', () => {
    it('skips duplicate alerts within cooldown window', async () => {
      await notifyNoel('P1', 'CPU high', { cooldownKey: 'cpu-alert' });
      await notifyNoel('P1', 'CPU high again', { cooldownKey: 'cpu-alert' });
      // Only first one should have sent
      expect(client.chat.postMessage).toHaveBeenCalledOnce();
    });

    it('allows different keys', async () => {
      initNotify({ slackClient: client, noelUserId: 'U_NOEL', quietStart: 25, quietEnd: 26 });
      await notifyNoel('P1', 'CPU high', { cooldownKey: 'cpu' });
      await notifyNoel('P1', 'Disk full', { cooldownKey: 'disk' });
      expect(client.chat.postMessage).toHaveBeenCalledTimes(2);
    });

    it('force bypasses cooldown', async () => {
      initNotify({ slackClient: client, noelUserId: 'U_NOEL', quietStart: 25, quietEnd: 26 });
      await notifyNoel('P1', 'First', { cooldownKey: 'test' });
      await notifyNoel('P1', 'Forced', { cooldownKey: 'test', force: true });
      expect(client.chat.postMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('DM channel caching', () => {
    it('opens DM only once across multiple notifications', async () => {
      initNotify({ slackClient: client, noelUserId: 'U_NOEL', quietStart: 25, quietEnd: 26 });
      await notifyNoel('P1', 'First');
      await notifyNoel('P1', 'Second', { cooldownKey: 'a' });
      await notifyNoel('P1', 'Third', { cooldownKey: 'b' });
      expect(client.conversations.open).toHaveBeenCalledOnce();
    });
  });

  describe('not initialized', () => {
    it('drops notifications gracefully when not initialized', async () => {
      initNotify({ slackClient: null, noelUserId: null });
      await notifyNoel('P0', 'Should not crash');
      // No error thrown, message dropped
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postAs, postTyping, replaceTyping } from './slack.js';

function makeMockClient() {
  return {
    chat: {
      postMessage: vi.fn().mockResolvedValue({ ts: '1234567890.000100' }),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    },
  };
}

const member = { name: 'James' };
const channelId = 'C123';
const threadTs = '111.222';

describe('postAs', () => {
  it('calls client.chat.postMessage with correct username', async () => {
    const client = makeMockClient();
    await postAs(client, member, channelId, threadTs, 'Hello!');
    expect(client.chat.postMessage).toHaveBeenCalledOnce();
    const call = client.chat.postMessage.mock.calls[0][0];
    expect(call.username).toBe('James');
    expect(call.text).toBe('Hello!');
    expect(call.channel).toBe(channelId);
  });
});

describe('postTyping', () => {
  it('returns {channelId, ts} handle', async () => {
    const client = makeMockClient();
    const handle = await postTyping(client, member, channelId, threadTs);
    expect(handle).toMatchObject({ channelId, ts: '1234567890.000100' });
    expect(client.chat.postMessage).toHaveBeenCalledOnce();
  });
});

describe('replaceTyping', () => {
  it('null text calls client.chat.delete (not chat.update)', async () => {
    const client = makeMockClient();
    const handle = { channelId, ts: '111.222' };
    await replaceTyping(client, member, handle, null);
    expect(client.chat.delete).toHaveBeenCalledOnce();
    expect(client.chat.update).not.toHaveBeenCalled();
  });

  it('text string calls client.chat.update', async () => {
    const client = makeMockClient();
    const handle = { channelId, ts: '111.222' };
    await replaceTyping(client, member, handle, 'Done!');
    expect(client.chat.update).toHaveBeenCalledOnce();
    expect(client.chat.delete).not.toHaveBeenCalled();
  });

  it('when update fails, falls back to chat.postMessage', async () => {
    const client = makeMockClient();
    client.chat.update = vi.fn().mockRejectedValue(new Error('not_found'));
    const handle = { channelId, ts: '111.222' };
    await replaceTyping(client, member, handle, 'Fallback message');
    expect(client.chat.update).toHaveBeenCalledOnce();
    expect(client.chat.postMessage).toHaveBeenCalledOnce();
    const call = client.chat.postMessage.mock.calls[0][0];
    expect(call.text).toBe('Fallback message');
  });
});

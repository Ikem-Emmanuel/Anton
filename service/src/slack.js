// ─── Slack Helpers ───────────────────────────────────────────
// All Slack posting goes through here

export async function postAs(client, member, channelId, threadTs, text) {
  return client.chat.postMessage({
    channel: channelId,
    thread_ts: threadTs,
    text,
    username: member.name || 'Anton',
    icon_emoji: ':bust_in_silhouette:',
  });
}

export async function postTyping(client, member, channelId, threadTs) {
  const msgs = ['_typing..._', '_thinking..._', '_looking into it..._', '_one sec..._'];
  const result = await client.chat.postMessage({
    channel: channelId,
    thread_ts: threadTs,
    text: msgs[Math.floor(Math.random() * msgs.length)],
    username: member.name || 'Anton',
    icon_emoji: ':bust_in_silhouette:',
  });
  return { channelId, ts: result.ts };
}

export async function replaceTyping(client, member, handle, text) {
  // null = NO_REPLY — delete the typing indicator silently
  if (text === null) {
    try {
      await client.chat.delete({ channel: handle.channelId, ts: handle.ts });
    } catch {}
    return;
  }
  try {
    await client.chat.update({ channel: handle.channelId, ts: handle.ts, text });
  } catch {
    await client.chat.postMessage({
      channel: handle.channelId, text,
      username: member.name || 'Anton',
      icon_emoji: ':bust_in_silhouette:',
    });
  }
}

// Open or find a DM channel with a user
export async function openDM(client, userId) {
  const result = await client.conversations.open({ users: userId });
  return result.channel.id;
}

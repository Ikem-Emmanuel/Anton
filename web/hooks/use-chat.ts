'use client';
// useChat — owns per-thread message state + send/receive plumbing so the
// Chat component can stay purely presentational. The Anton thread is
// seeded with the scripted opener from ANTON_MSGS; other threads start
// empty and fill as the user sends.

import { useCallback, useMemo, useState } from 'react';
import { postChat } from '@/lib/api/chat';
import { ANTON_MSGS, CHAT_THREADS, type ChatMessage, type ChatThread } from '@/lib/data';

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export type UseChat = {
  activeId: string;
  setActiveId: (id: string) => void;
  thread: ChatThread;
  messages: ChatMessage[];
  sending: boolean;
  send: (text: string) => Promise<void>;
};

export function useChat(initialThreadId = 'anton'): UseChat {
  const [activeId, setActiveId] = useState(initialThreadId);
  // Seed the Anton thread with the scripted opening; other threads start empty.
  const [byThread, setByThread] = useState<Record<string, ChatMessage[]>>({ anton: ANTON_MSGS });
  const [sending, setSending] = useState(false);

  const thread = useMemo(() => CHAT_THREADS.find((t) => t.id === activeId) ?? CHAT_THREADS[0], [activeId]);
  const messages = byThread[activeId] ?? [];

  const appendMessage = useCallback((threadId: string, msg: ChatMessage) => {
    setByThread((prev) => ({ ...prev, [threadId]: [...(prev[threadId] ?? []), msg] }));
  }, []);

  const send = useCallback(
    async (text: string) => {
      const tid = activeId;
      // Agents addressable as `# channel` strip the hash for the backend call.
      const agentName = thread.name.replace(/^#\s*/, '');
      appendMessage(tid, { from: 'noel', t: formatTime(new Date()), text });
      setSending(true);
      try {
        const res = await postChat(agentName, text);
        appendMessage(tid, {
          from: 'anton',
          t: formatTime(new Date()),
          text: res.text,
          meta: { model: 'qwen3:8b' },
        });
        for (const h of res.handoffs ?? []) {
          appendMessage(tid, {
            from: 'anton',
            t: formatTime(new Date()),
            text: h.text,
            meta: { handoff: h.agent },
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        appendMessage(tid, { from: 'anton', t: formatTime(new Date()), text: `⚠ ${msg}` });
      } finally {
        setSending(false);
      }
    },
    [activeId, thread, appendMessage]
  );

  return { activeId, setActiveId, thread, messages, sending, send };
}

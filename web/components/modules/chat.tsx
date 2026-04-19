'use client';
// Chat — conversational surface. SRP per component: Chat composes layout,
// ThreadList renders the left pane, Conversation owns the messages + composer,
// MessageBubble renders a single message with its meta footer. Uses Tailwind
// tokens + Button primitive throughout.
//
// Posting flow: Composer → Chat.handleSend → POST /api/chat → Next.js proxy →
// Anton service → brain.process. The user message is rendered optimistically;
// the Anton reply appends when the response arrives. Errors surface inline
// in the conversation as a system bubble so the UI never silently swallows
// service outages.

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { ANTON_MSGS, type ChatMessage, CHAT_THREADS, type ChatThread } from '@/lib/data';

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function ThreadAvatar({ thread, size = 32 }: { thread: ChatThread; size?: number }) {
  const rounded = thread.group ? 'rounded' : 'rounded-full';
  return (
    <div
      className={cn(
        'mono flex items-center justify-center bg-raised border border-border-default text-[13px] flex-shrink-0',
        rounded
      )}
      style={{ width: size, height: size, color: thread.color }}
    >
      {thread.avatar}
    </div>
  );
}

function ThreadItem({ thread, active, onClick }: { thread: ChatThread; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left cursor-pointer border-l-2 bg-transparent',
        active ? 'bg-hover border-l-accent' : 'border-l-transparent hover:bg-hover/40'
      )}
    >
      <ThreadAvatar thread={thread} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-medium truncate">{thread.name}</span>
          {thread.pinned && <span className="text-tertiary text-[10px]">◉</span>}
          <span className="flex-1" />
          <span className="mono small text-tertiary text-[10px]">{thread.time}</span>
        </div>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="mono small text-tertiary text-[11px] truncate flex-1">{thread.last}</span>
          {thread.unread > 0 && (
            <span className="mono bg-accent text-page text-[10px] px-1.5 rounded-lg min-w-3.5 text-center">
              {thread.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ThreadList({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  const pinned = CHAT_THREADS.filter((t) => t.pinned);
  const recent = CHAT_THREADS.filter((t) => !t.pinned);
  return (
    <div className="w-[300px] border-r border-border-subtle bg-page flex flex-col">
      <div className="px-3.5 pt-3.5 pb-2.5 border-b border-border-subtle">
        <div className="text-lg font-medium mb-2">Messages</div>
        <input
          placeholder="Search people & threads"
          className="mono small w-full px-2.5 py-1.5 bg-surface border border-border-subtle text-primary rounded-chip text-xs outline-0"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mono small caps text-tertiary px-3.5 pt-2.5 pb-1">PINNED</div>
        {pinned.map((t) => (
          <ThreadItem key={t.id} thread={t} active={activeId === t.id} onClick={() => onSelect(t.id)} />
        ))}
        <div className="mono small caps text-tertiary px-3.5 pt-2.5 pb-1">RECENT</div>
        {recent.map((t) => (
          <ThreadItem key={t.id} thread={t} active={activeId === t.id} onClick={() => onSelect(t.id)} />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ m }: { m: ChatMessage }) {
  const isNoel = m.from === 'noel';
  return (
    <div className={cn('flex flex-col mb-3.5', isNoel ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[72%] px-3.5 py-2.5 rounded-card text-primary whitespace-pre-wrap leading-[1.55] border',
          isNoel ? 'bg-accent-soft border-accent font-sans text-sm' : 'bg-surface border-border-subtle mono text-[13px]'
        )}
      >
        {m.text}
      </div>
      <div className="mono small text-tertiary text-[10px] mt-0.5 flex gap-2">
        <span>{isNoel ? 'you' : 'anton'}</span>
        <span>·</span>
        <span>{m.t}</span>
        {m.meta?.depth && (
          <>
            <span>·</span>
            <span>{m.meta.depth}</span>
          </>
        )}
        {m.meta?.model && (
          <>
            <span>·</span>
            <span>{m.meta.model}</span>
          </>
        )}
        {m.meta?.lat && (
          <>
            <span>·</span>
            <span>{m.meta.lat}</span>
          </>
        )}
        {m.meta?.cite && (
          <>
            <span>·</span>
            <span className="text-info">src: {m.meta.cite}</span>
          </>
        )}
        {m.meta?.handoff && (
          <>
            <span>·</span>
            <span className="text-accent">→ {m.meta.handoff}</span>
          </>
        )}
      </div>
    </div>
  );
}

function ConversationHeader({ thread }: { thread: ChatThread }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-border-subtle">
      <ThreadAvatar thread={thread} />
      <div className="flex-1">
        <div className="text-[15px] font-medium">{thread.name}</div>
        <div className="mono small text-tertiary">{thread.sub}</div>
      </div>
      <Button size="sm" variant="secondary">
        view log
      </Button>
      <Button size="sm" variant="secondary">
        memory
      </Button>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 mt-2 pl-1">
      <span className="mono small text-tertiary">anton is thinking</span>
      <span className="pulse text-accent">●</span>
      <span className="mono small text-tertiary">standard · qwen3:8b</span>
    </div>
  );
}

function Composer({ onSend, disabled }: { onSend: (text: string) => void; disabled: boolean }) {
  const [draft, setDraft] = useState('');
  const submit = () => {
    const text = draft.trim();
    if (!text || disabled) return;
    onSend(text);
    setDraft('');
  };
  return (
    <div className="px-5 py-3 border-t border-border-subtle bg-page">
      <div className="flex items-end gap-2.5 px-3.5 py-2.5 bg-surface border border-border-default rounded-card">
        <span className="mono text-accent text-sm">▸</span>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="delegate, ask, or just type…"
          rows={2}
          className="flex-1 bg-transparent border-0 outline-0 text-primary text-sm resize-none font-sans"
        />
        <div className="flex gap-1.5 items-center">
          <span className="mono small text-tertiary">@local</span>
          <Button size="sm" variant="secondary" aria-label="voice input" disabled={disabled}>
            🎙
          </Button>
          <Button size="sm" variant="primary" className="font-medium" onClick={submit} disabled={disabled}>
            send ⌘⏎
          </Button>
        </div>
      </div>
      <div className="flex gap-3.5 mt-2 pl-1">
        <span className="mono small text-tertiary">⌘⇧K · delegate to agent</span>
        <span className="mono small text-tertiary">@claude · force claude</span>
        <span className="mono small text-tertiary">/deep · deep reasoning</span>
      </div>
    </div>
  );
}

function Conversation({
  thread,
  messages,
  onSend,
  sending,
}: {
  thread: ChatThread;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  sending: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <ConversationHeader thread={thread} />
      <div className="flex-1 overflow-auto px-8 py-5 bg-page">
        <div className="text-center mb-4">
          <span className="mono small caps text-tertiary px-2.5 py-0.5 bg-surface border border-border-subtle rounded-[10px]">
            FRIDAY · APR 18
          </span>
        </div>
        {messages.map((m, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: messages are append-only + may share from+time; index is stable here
          <MessageBubble key={`${m.from}-${m.t}-${i}`} m={m} />
        ))}
        {sending && <ThinkingIndicator />}
      </div>
      <Composer onSend={onSend} disabled={sending} />
    </div>
  );
}

type ChatResponse = { agent: string; text: string; handoffs?: Array<{ agent: string; text: string }> };

async function postChat(agent: string, text: string): Promise<ChatResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent, text }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; hint?: string };
    throw new Error(body.hint || body.error || `HTTP ${res.status}`);
  }
  return (await res.json()) as ChatResponse;
}

export default function Chat() {
  const [activeId, setActiveId] = useState('anton');
  // Seed the Anton thread with the scripted opening; other threads start empty.
  const [byThread, setByThread] = useState<Record<string, ChatMessage[]>>({ anton: ANTON_MSGS });
  const [sending, setSending] = useState(false);

  const thread = useMemo(() => CHAT_THREADS.find((t) => t.id === activeId) ?? CHAT_THREADS[0], [activeId]);
  const messages = byThread[activeId] ?? [];

  const appendMessage = (threadId: string, msg: ChatMessage) => {
    setByThread((prev) => ({ ...prev, [threadId]: [...(prev[threadId] ?? []), msg] }));
  };

  const handleSend = async (text: string) => {
    const tid = activeId;
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
  };

  return (
    <div className="flex h-full">
      <ThreadList activeId={activeId} onSelect={setActiveId} />
      <Conversation thread={thread} messages={messages} onSend={handleSend} sending={sending} />
    </div>
  );
}

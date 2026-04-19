// Unified Claude fallback path — one-shot call with the brain's OWN system prompt.
//
// Why: V1 `trackedAsk` routes to a TEAM member and uses that member's persona from
// personas.json. When brain said "needsClaude: true" we were dropping into V1's
// persona system, causing voice drift between local and Claude responses.
//
// This fallback takes the exact same system prompt the local responder would have
// used and sends it to Claude via the Agent SDK in a stateless one-shot session.
// No persona.json involvement. No voice drift.

import { unstable_v2_createSession } from '@anthropic-ai/claude-agent-sdk';

export interface ClaudeFallbackOptions {
  model?: 'sonnet' | 'opus' | 'haiku';
  timeoutMs?: number;
  allowedTools?: string[];
}

export interface ClaudeFallbackResult {
  text: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  durationMs: number;
}

type SessionMessage = {
  type: string;
  subtype?: string;
  state?: string;
  result?: string;
  message?: { content?: Array<{ type: string; text?: string }> };
  usage?: { input_tokens?: number; output_tokens?: number };
};

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms)),
  ]);
}

// Drain the stream after a send() until the session returns to idle.
// Collects result text and token counts when the SDK surfaces them.
async function drain(
  session: ReturnType<typeof unstable_v2_createSession>,
  captureText: boolean
): Promise<{ text: string; tokensIn: number; tokensOut: number }> {
  let text = '';
  let tokensIn = 0;
  let tokensOut = 0;

  for await (const m of session.stream() as AsyncIterable<SessionMessage>) {
    if (m.type === 'result' && typeof m.result === 'string') {
      if (captureText) text = m.result;
    }
    if (m.usage) {
      tokensIn += m.usage.input_tokens ?? 0;
      tokensOut += m.usage.output_tokens ?? 0;
    }
    if (m.type === 'result') break;
    if (m.type === 'system' && m.subtype === 'session_state_changed' && m.state === 'idle') break;
  }

  return { text, tokensIn, tokensOut };
}

export async function claudeFallback(
  message: string,
  system: string,
  options?: ClaudeFallbackOptions
): Promise<ClaudeFallbackResult> {
  const start = Date.now();
  const model = options?.model || 'sonnet';
  const timeoutMs = options?.timeoutMs ?? 60_000;
  // Read-only tools only — brain owns writes, Claude assists with code + research.
  const allowedTools = options?.allowedTools || ['Read', 'Grep', 'Glob', 'WebSearch', 'WebFetch'];

  const session = unstable_v2_createSession({
    model,
    allowedTools,
    permissionMode: 'bypassPermissions',
    env: { ...process.env },
  });

  // Seed the session with the brain's system prompt.
  await withTimeout(session.send(system), 10_000, 'claude-fallback:system-seed');
  await drain(session, false);

  // Send the actual user message and capture the response.
  await withTimeout(session.send(message), timeoutMs, 'claude-fallback:message');
  const { text, tokensIn, tokensOut } = await drain(session, true);

  return {
    text: text.trim(),
    model,
    tokensIn,
    tokensOut,
    durationMs: Date.now() - start,
  };
}

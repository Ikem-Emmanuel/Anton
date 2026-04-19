// Chat API client. Calls the Next.js proxy at /api/chat, which forwards to
// the Anton service's brain pipeline. Keeps UI components free of fetch
// plumbing + error shape knowledge.

export type ChatHandoff = {
  agent: string;
  text: string;
};

export type ChatResponse = {
  agent: string;
  text: string;
  handoffs?: ChatHandoff[];
};

/**
 * POST a user message to Anton's brain. Throws with a readable message if
 * the service is unreachable or returns a non-2xx.
 */
export async function postChat(agent: string, text: string): Promise<ChatResponse> {
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

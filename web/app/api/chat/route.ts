// POST /api/chat — thin proxy to the Anton service's brain pipeline.
//
// Architecture: Next.js doesn't host the brain itself (keeps native deps like
// better-sqlite3 out of the Next.js bundle, keeps one canonical SQLite writer,
// keeps Slack + Web sharing one process). The Anton service exposes a JSON
// endpoint at ANTON_SERVICE_URL/api/chat; this route forwards to it and
// returns the JSON verbatim. In prod both surfaces can share an origin.

import { NextResponse } from 'next/server';

const ANTON_SERVICE_URL = process.env.ANTON_SERVICE_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  let payload: { agent?: string; text?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const text = typeof payload.text === 'string' ? payload.text.trim() : '';
  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${ANTON_SERVICE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: payload.agent || 'Anton', text }),
      // Abort if the Anton service is slow enough that we'd rather surface an
      // explicit timeout than hang the browser request.
      signal: AbortSignal.timeout(60_000),
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[/api/chat] upstream failed:', msg);
    return NextResponse.json(
      {
        error: 'Anton service unreachable',
        hint: `Start the service with \`npm start\` in the project root. Tried ${ANTON_SERVICE_URL}/api/chat.`,
      },
      { status: 503 }
    );
  }
}

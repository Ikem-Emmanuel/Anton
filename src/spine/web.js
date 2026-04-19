// ---- Web Interface -------------------------------------------------------
// HTTP + WebSocket server for direct Anton access.
// Chat UI at http://localhost:3000 with:
//   - Agent routing (talk to Anton, Marcus, James, etc.)
//   - Message persistence (client-side localStorage)
//   - Reply-to-message (WhatsApp-style quoting)
//   - Image attachments
//   - Hot reload in dev mode
//   - Markdown rendering

import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, unlinkSync, watch, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', '..', 'public');

let _server = null;
let _wss = null;

// CORS preflight + common headers so the Next.js dev server (typically on port
// 3001) can POST to /api/chat without browser-side CORS rejection. In prod
// both surfaces live on the same origin and these headers are harmless.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function readJsonBody(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf-8')) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// Fallback approvals source — returns the current demo set so the Next.js
// UI has something to render when the service boots in isolation (no
// live-brain approval feed yet). Replace by passing `approvalsSource`
// into initWeb when the real source exists.
const DEFAULT_APPROVALS = [
  {
    id: 1,
    agent: 'Marcus',
    dept: 'eng',
    risk: 'L',
    intent: 'Draft PRD for onboarding v3 and share with Alex.',
    why: "Continuation of yesterday's scope review. No external writes.",
    diff: null,
  },
  {
    id: 2,
    agent: 'James',
    dept: 'eng',
    risk: 'H',
    intent: 'Push v1.2 to production.',
    why: 'All tests green for 42m. Requires approval per red tier.',
    diff: [
      ['+', 'api/router.ts', '24 lines'],
      ['-', 'api/router.ts', '9 lines'],
      ['~', 'config/deploy.yaml', '3 lines'],
    ],
  },
  {
    id: 3,
    agent: 'Sarah',
    dept: 'mktg',
    risk: 'M',
    intent: 'Send launch email to 2,340 subscribers.',
    why: 'Targeting "waitlist: dormant 30d". Copy reviewed by Kai.',
    diff: [
      ['subject', 'You asked us to build it. We did.'],
      ['from', 'noel@anton.computer'],
      ['audience', '2,340 contacts'],
    ],
  },
  {
    id: 4,
    agent: 'Riley',
    dept: 'mktg',
    risk: 'L',
    intent: 'Schedule 4 X posts across Thu–Sun.',
    why: null,
    diff: null,
  },
  { id: 5, agent: 'Priya', dept: 'data', risk: 'L', intent: 'Rebuild weekly retention cohort.', why: null, diff: null },
];

export function initWeb({ askAgent, approvalsSource, port = 3000 }) {
  // `approvalsSource` is an optional callback that returns the current list
  // of pending approvals. If omitted, we fall back to the demo set so the UI
  // stays live during early development.
  const readApprovals = approvalsSource || (() => DEFAULT_APPROVALS);

  _server = createServer(async (req, res) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }

    // GET /api/approvals — returns the current pending approval records.
    // Shape mirrors web/lib/data/approvals.ts `Approval` type.
    if (req.method === 'GET' && req.url === '/api/approvals') {
      try {
        const approvals = await readApprovals();
        res.writeHead(200, { 'Content-Type': 'application/json', ...CORS_HEADERS });
        res.end(JSON.stringify({ approvals: approvals || [] }));
      } catch (e) {
        console.error('[Web] /api/approvals error:', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json', ...CORS_HEADERS });
        res.end(JSON.stringify({ error: 'Internal error' }));
      }
      return;
    }

    // JSON chat endpoint — used by the Next.js UI (and anything else that
    // wants a programmatic chat surface). Same underlying askAgent pipeline
    // as the WS handler below, just request/response instead of streaming.
    if (req.method === 'POST' && req.url === '/api/chat') {
      try {
        const body = await readJsonBody(req);
        const agent = typeof body.agent === 'string' && body.agent.trim() ? body.agent.trim() : 'Anton';
        const text = typeof body.text === 'string' ? body.text.trim() : '';
        if (!text) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...CORS_HEADERS });
          res.end(JSON.stringify({ error: 'Missing text' }));
          return;
        }

        // Collect handoff dispatches so the caller can render them too.
        const handoffs = [];
        const onHandoff = (targetAgent, handoffText) => {
          handoffs.push({ agent: targetAgent, text: handoffText, timestamp: new Date().toISOString() });
        };

        const response = await askAgent(agent, text, onHandoff);
        res.writeHead(200, { 'Content-Type': 'application/json', ...CORS_HEADERS });
        res.end(
          JSON.stringify({
            agent,
            text: response || 'No response.',
            handoffs,
            timestamp: new Date().toISOString(),
          })
        );
      } catch (e) {
        console.error('[Web] /api/chat error:', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json', ...CORS_HEADERS });
        res.end(JSON.stringify({ error: 'Internal error' }));
      }
      return;
    }

    if (req.url === '/' || req.url === '/index.html') {
      // No cache in dev — always serve fresh
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store',
      });
      res.end(readFileSync(join(PUBLIC_DIR, 'index.html'), 'utf-8'));
      return;
    }
    res.writeHead(404);
    res.end('Not found');
  });

  _wss = new WebSocketServer({ server: _server });

  // Hot reload — watch public/ and notify clients
  try {
    watch(PUBLIC_DIR, { recursive: true }, () => {
      for (const client of _wss.clients) {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'reload' }));
        }
      }
    });
  } catch {
    // fs.watch not available on all platforms — skip silently
  }

  _wss.on('connection', (ws) => {
    console.log('[Web] Client connected');

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === 'chat') {
          const text = (msg.text || '').trim();
          const images = msg.images || [];
          const agent = msg.agent || 'Anton';
          const replyTo = msg.replyTo || null;
          if (!text && images.length === 0) return;

          console.log(`[Web] → ${agent}: ${text.slice(0, 80)}${images.length ? ` (+${images.length} img)` : ''}`);

          ws.send(JSON.stringify({ type: 'typing', agent }));

          // Save images to temp files so the agent can Read them
          const tmpDir = join(PUBLIC_DIR, '..', 'data', 'tmp');
          mkdirSync(tmpDir, { recursive: true });
          const savedImages = [];

          for (const dataUrl of images) {
            try {
              const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
              if (!match) continue;
              const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
              const buffer = Buffer.from(match[2], 'base64');
              const filename = `img-${randomUUID().slice(0, 8)}.${ext}`;
              const filepath = join(tmpDir, filename);
              writeFileSync(filepath, buffer);
              savedImages.push(filepath);
            } catch (e) {
              console.error('[Web] Failed to save image:', e.message);
            }
          }

          // Build prompt
          let prompt = text;
          if (replyTo) {
            prompt = `[Replying to ${replyTo.agent}: "${replyTo.text.slice(0, 200)}"]\n\n${text}`;
          }
          if (savedImages.length > 0) {
            const paths = savedImages.map((p) => `Image: ${p}`).join('\n');
            const imgPrompt = `User sent ${savedImages.length} image(s). Use the Read tool to view them:\n${paths}`;
            prompt = prompt ? `${prompt}\n\n${imgPrompt}` : imgPrompt;
          }

          // Handoff callback — delivers cross-agent responses to this client
          const onHandoff = (targetAgent, handoffText) => {
            ws.send(
              JSON.stringify({
                type: 'response',
                agent: targetAgent,
                text: handoffText,
                timestamp: new Date().toISOString(),
              })
            );
          };

          let response;
          try {
            response = await askAgent(agent, prompt, onHandoff);
          } finally {
            // Clean up temp images
            for (const p of savedImages) {
              try {
                unlinkSync(p);
              } catch {}
            }
          }

          ws.send(
            JSON.stringify({
              type: 'response',
              agent,
              text: response || 'No response.',
              timestamp: new Date().toISOString(),
            })
          );
        }
      } catch (e) {
        console.error('[Web] Error:', e.message);
        ws.send(JSON.stringify({ type: 'error', text: 'Something went wrong.' }));
      }
    });

    ws.on('close', () => console.log('[Web] Client disconnected'));
  });

  // Broadcast helper (used by notify system)
  _wss.broadcast = (msg) => {
    for (const client of _wss.clients) {
      if (client.readyState === 1) {
        client.send(JSON.stringify(msg));
      }
    }
  };

  _server.listen(port, () => {
    console.log(`[Web] Chat at http://localhost:${port}`);
  });

  return { server: _server, wss: _wss };
}

export function shutdownWeb() {
  if (_wss) _wss.close();
  if (_server) _server.close();
}

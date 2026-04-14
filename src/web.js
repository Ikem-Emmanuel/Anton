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
const PUBLIC_DIR = join(__dirname, '..', 'public');

let _server = null;
let _wss = null;

export function initWeb({ askAgent, port = 3000 }) {
  _server = createServer((req, res) => {
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

          let response;
          try {
            response = await askAgent(agent, prompt);
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

    ws.send(
      JSON.stringify({
        type: 'response',
        agent: 'Anton',
        text: 'Online. What do you need?',
        timestamp: new Date().toISOString(),
      })
    );
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

// ─── Image Vision ────────────────────────────────────────────
// Subscription-mode: uses Claude Code Agent SDK (not direct API).
// Downloads Slack images to temp files, passes to vision-analyst
// agent (model: sonnet) which reads them with the Read tool.
// No @anthropic-ai/sdk dependency needed — stays on Noel's plan.

import { promises as fs, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { query } from '@anthropic-ai/claude-agent-sdk';

export function initVision() {
  console.log('[Vision] Subscription-mode vision enabled (Sonnet)');
}

export function extFromMime(mime = '') {
  if (mime.includes('png')) return 'png';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('webp')) return 'webp';
  return 'jpg';
}

async function downloadToTemp(imageUrl, botToken, ext = 'jpg') {
  const res = await fetch(imageUrl, {
    headers: { Authorization: `Bearer ${botToken}` },
  });
  if (!res.ok) throw new Error(`Slack image download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const path = join(tmpdir(), `anton-vision-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
  await fs.writeFile(path, buf);
  return path;
}

export function buildVisionPrompt(paths, userText) {
  const ctx = userText ? `User context: "${userText}"\n\n` : '';
  const fileList = paths.join(', ');
  return (
    `${ctx}Read the following image file(s): ${fileList}\n\n` +
    `Analyze what you see and respond according to the content type:\n\n` +
    `• Code/error screenshot → describe the bug, error message, file:line. End with: "Routes to: [AgentName]"\n` +
    `• Receipt/invoice/bill → extract vendor, amount, date. End response with exactly:\n` +
    `  AWAITING_APPROVAL: purchase — [vendor] $[amount]\n` +
    `• Email/document → extract sender, subject, key action items\n` +
    `• Whiteboard/diagram/notes → transcribe all text, list action items\n` +
    `• UI screenshot → describe what's shown, note any obvious issues\n` +
    `• Other → concise factual description\n\n` +
    `Be specific. Under 200 words. State required actions explicitly.`
  );
}

// Analyze one or more Slack images in a single agent call (up to 4).
// Returns description string or null.
export async function describeImages(imageFiles, botToken, userText = '') {
  if (!imageFiles.length) return null;

  const paths = [];
  try {
    for (const file of imageFiles.slice(0, 4)) {
      const ext = extFromMime(file.mimetype);
      const path = await downloadToTemp(file.url_private, botToken, ext);
      paths.push(path);
    }

    const prompt = buildVisionPrompt(paths, userText);

    let result = '';
    for await (const msg of query({
      prompt,
      options: {
        model: 'sonnet',
        allowedTools: ['Read'],
        permissionMode: 'bypassPermissions',
      },
    })) {
      if ('result' in msg && msg.result) {
        result = msg.result;
      }
    }

    const description = result.trim();
    console.log(`[Vision] Described ${paths.length} image(s) (${description.length} chars)`);
    return description || null;
  } catch (e) {
    // NEVER log botToken here
    console.error('[Vision] Failed:', e.message?.slice(0, 100));
    return null;
  } finally {
    // Always clean up temp files
    for (const p of paths) {
      fs.unlink(p).catch(() => {});
    }
  }
}

// Legacy single-image compat — used by existing callers
export async function describeImage(imageUrl, botToken, userText) {
  return describeImages([{ url_private: imageUrl, mimetype: 'image/jpeg' }], botToken, userText);
}

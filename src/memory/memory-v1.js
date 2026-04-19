// ─── Shared Memory ──────────────────────────────────────────
// Plain Markdown files for cross-agent knowledge sharing.
// No database, no graph — just files that agents can read.

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

let _antonRoot;
let sharedMemoryFile;
let dailyDir;
let deptDir;

export function initMemory(antonRoot, dataDir) {
  _antonRoot = antonRoot;
  sharedMemoryFile = join(dataDir, 'SHARED-MEMORY.md');
  dailyDir = join(dataDir, 'daily');
  deptDir = join(antonRoot, 'config', 'departments');
  mkdirSync(dailyDir, { recursive: true });
  mkdirSync(deptDir, { recursive: true });
}

/**
 * Read the shared org-wide memory. Returns last ~2000 chars (most recent entries).
 */
export function readSharedMemory() {
  try {
    if (!existsSync(sharedMemoryFile)) return '';
    const content = readFileSync(sharedMemoryFile, 'utf-8');
    // Return last 2000 chars to keep context window manageable
    return content.length > 2000 ? content.slice(-2000) : content;
  } catch {
    return '';
  }
}

/**
 * Append an entry to shared memory with timestamp and author.
 */
export function appendSharedMemory(agentName, content) {
  const timestamp = new Date().toISOString().split('T')[0];
  const entry = `\n## [${timestamp}] ${agentName}\n${content.trim()}\n`;
  try {
    appendFileSync(sharedMemoryFile, entry);
  } catch {
    // First write — create the file
    writeFileSync(sharedMemoryFile, `# Shared Team Memory\n${entry}`);
  }
}

/**
 * Read department-specific memory.
 */
export function readDeptMemory(dept) {
  try {
    const file = join(deptDir, dept, 'MEMORY.md');
    if (!existsSync(file)) return '';
    const content = readFileSync(file, 'utf-8');
    return content.length > 1500 ? content.slice(-1500) : content;
  } catch {
    return '';
  }
}

/**
 * Append to department memory.
 */
export function appendDeptMemory(dept, agentName, content) {
  const dir = join(deptDir, dept);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'MEMORY.md');
  const timestamp = new Date().toISOString().split('T')[0];
  const entry = `\n## [${timestamp}] ${agentName}\n${content.trim()}\n`;
  try {
    appendFileSync(file, entry);
  } catch {
    writeFileSync(file, `# ${dept} Department Memory\n${entry}`);
  }
}

/**
 * Get today's daily note.
 */
export function getDailyNote(date) {
  const d = date || new Date().toISOString().split('T')[0];
  try {
    const file = join(dailyDir, `${d}.md`);
    if (!existsSync(file)) return '';
    return readFileSync(file, 'utf-8');
  } catch {
    return '';
  }
}

/**
 * Append to today's daily note.
 */
export function appendDailyNote(content) {
  const date = new Date().toISOString().split('T')[0];
  const file = join(dailyDir, `${date}.md`);
  const entry = `\n- **${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}** ${content.trim()}\n`;
  try {
    appendFileSync(file, entry);
  } catch {
    writeFileSync(file, `# Daily Notes — ${date}\n${entry}`);
  }
}

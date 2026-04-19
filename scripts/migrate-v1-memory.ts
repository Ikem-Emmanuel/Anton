// V1 markdown journal migration → SQLite.
//
// Reads every config/departments/*/MEMORY.md file, parses out dated agent entries,
// and inserts each as a `fact` memory with metadata. Idempotent: uses SQLite checksum
// column to skip already-imported entries.
//
// Usage:
//   npx tsx scripts/migrate-v1-memory.ts                 # dry-run (prints, no writes)
//   npx tsx scripts/migrate-v1-memory.ts --apply         # actually inserts
//   npx tsx scripts/migrate-v1-memory.ts --apply --reset # clears before insert (dangerous)

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { getMemoryStats, initSqliteMemory, storeMemory } from '../src/memory/sqlite.js';

const PROJECT_ROOT = join(import.meta.dirname, '..');
const DEPT_DIR = join(PROJECT_ROOT, 'config', 'departments');
const DATA_DIR = join(PROJECT_ROOT, 'data');
const DB_PATH = join(DATA_DIR, 'brain', 'anton.db');

interface ParsedEntry {
  date: string;
  author: string;
  content: string;
  department: string;
  sourceFile: string;
  checksum: string;
}

// Parse one MEMORY.md file into dated entries.
// Format:
//   ## [2026-04-14] Marcus
//   • bullet 1
//   • bullet 2
//
//   ## [2026-04-16] Sarah
//   • ...
function parseMemoryFile(filePath: string, department: string): ParsedEntry[] {
  const content = readFileSync(filePath, 'utf-8');
  const entries: ParsedEntry[] = [];

  // Header regex — date in brackets, then author name.
  const HEADER = /^##\s*\[(\d{4}-\d{2}-\d{2})\]\s*(.+?)\s*$/gm;

  const matches: Array<{ index: number; date: string; author: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = HEADER.exec(content)) !== null) {
    matches.push({ index: match.index, date: match[1], author: match[2].trim() });
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const start = content.indexOf('\n', current.index) + 1;
    const end = next ? next.index : content.length;
    const body = content.slice(start, end).trim();

    if (!body) continue;

    const payload = `[${current.date}] ${current.author} (${department}): ${body}`;
    entries.push({
      date: current.date,
      author: current.author,
      content: payload,
      department,
      sourceFile: filePath.replace(PROJECT_ROOT, ''),
      checksum: createHash('sha256').update(payload).digest('hex').slice(0, 16),
    });
  }

  return entries;
}

function collectAllEntries(): ParsedEntry[] {
  const all: ParsedEntry[] = [];
  let depts: string[];
  try {
    depts = readdirSync(DEPT_DIR);
  } catch {
    console.error(`[migrate] Cannot read ${DEPT_DIR}`);
    return [];
  }

  for (const dept of depts) {
    const deptPath = join(DEPT_DIR, dept);
    try {
      if (!statSync(deptPath).isDirectory()) continue;
    } catch {
      continue;
    }
    const memPath = join(deptPath, 'MEMORY.md');
    try {
      statSync(memPath);
    } catch {
      continue; // no MEMORY.md in this dept — skip
    }
    const entries = parseMemoryFile(memPath, dept);
    console.log(`[migrate] ${dept}: ${entries.length} entries in ${memPath.replace(PROJECT_ROOT, '')}`);
    all.push(...entries);
  }

  return all;
}

function alreadyImported(checksum: string): boolean {
  // Open db directly (read-only) to check existing checksums.
  // The SHA-16 checksum is stored in the `checksum` column of memories.
  try {
    const db = new Database(DB_PATH, { readonly: true });
    const row = db.prepare('SELECT 1 FROM memories WHERE checksum = ? LIMIT 1').get(checksum);
    db.close();
    return !!row;
  } catch {
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const reset = args.includes('--reset');

  console.log(
    `[migrate] mode: ${apply ? 'APPLY' : 'DRY-RUN'}${reset ? ' + RESET (will delete existing imports)' : ''}`
  );
  console.log(`[migrate] source: ${DEPT_DIR.replace(PROJECT_ROOT, '')}`);
  console.log(`[migrate] target: ${DB_PATH.replace(PROJECT_ROOT, '')}`);
  console.log('');

  const entries = collectAllEntries();
  console.log('');
  console.log(`[migrate] total parsed: ${entries.length}`);

  if (entries.length === 0) {
    console.log('[migrate] nothing to import.');
    return;
  }

  if (!apply) {
    console.log('[migrate] dry-run — first 3 entries preview:');
    for (const e of entries.slice(0, 3)) {
      console.log(`  - [${e.date}] ${e.author} (${e.department}): ${e.content.slice(0, 100)}...`);
    }
    console.log('');
    console.log('[migrate] run with --apply to perform the insert.');
    return;
  }

  initSqliteMemory(DATA_DIR);

  if (reset) {
    console.log('[migrate] --reset: deleting existing V1-sourced rows...');
    const db = new Database(DB_PATH);
    const result = db.prepare("DELETE FROM memories WHERE json_extract(metadata, '$.source') = 'v1-journal'").run();
    console.log(`[migrate] deleted ${result.changes} rows.`);
    db.close();
  }

  let imported = 0;
  let skipped = 0;

  for (const e of entries) {
    if (!reset && alreadyImported(e.checksum)) {
      skipped++;
      continue;
    }
    storeMemory(e.author, 'fact', e.content, {
      source: 'v1-journal',
      department: e.department,
      date: e.date,
      sourceFile: e.sourceFile,
    });
    imported++;
  }

  console.log('');
  console.log(`[migrate] imported: ${imported}`);
  console.log(`[migrate] skipped (already present): ${skipped}`);

  const stats = getMemoryStats();
  console.log('');
  console.log('[migrate] post-migration stats:');
  console.log(`  memories: ${stats.totalMemories}`);
  console.log(`  conversations: ${stats.totalConversations}`);
  console.log(`  by agent (top 5):`);
  for (const { agent, count } of stats.byAgent.slice(0, 5)) {
    console.log(`    ${agent.padEnd(10)} ${count}`);
  }
}

main();

#!/usr/bin/env node
/**
 * runner.js — Comprehensive test runner for the Anton 26-agent AI organization.
 *
 * Usage:
 *   node tests/runner.js                           # run ALL (~1600 scenarios)
 *   node tests/runner.js --dept=engineering         # run one department
 *   node tests/runner.js --dept=anton-pa,marketing  # run multiple
 *   node tests/runner.js --block=PA-A,ENG-C        # run specific blocks
 *   node tests/runner.js --id=PA-A1,ENG-C4         # run specific IDs
 *   node tests/runner.js --from=PA-A1 --to=PA-A10  # run a range
 *   node tests/runner.js --difficulty=advanced      # filter by difficulty
 *   node tests/runner.js --tags=approval,slack      # filter by tags
 *   node tests/runner.js --dry-run                  # print without running
 *   node tests/runner.js --list                     # list all scenario IDs
 *   node tests/runner.js --parallel=3               # run N concurrently
 *   node tests/runner.js --timeout=120              # per-scenario timeout (s)
 *   node tests/runner.js --resume                   # skip already-passed IDs
 *
 * Logs:   data/logs/tests/full-suite-<date>.jsonl
 * Report: data/logs/tests/full-suite-<date>-report.md
 */

import { readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ANTON_ROOT = join(__dirname, '..');
const DATA_DIR = join(ANTON_ROOT, 'data');

// ─── CLI argument parsing ─────────────────────────────────────
const args = process.argv.slice(2);

const DRY_RUN    = args.includes('--dry-run');
const LIST_ONLY  = args.includes('--list');
const RESUME     = args.includes('--resume');
const SYNERGY    = !args.includes('--no-synergy'); // ON by default — agents communicate, delegate, hand off

const deptArg       = args.find(a => a.startsWith('--dept='))?.split('=')[1];
const blockArg      = args.find(a => a.startsWith('--block='))?.split('=')[1];
const idArg         = args.find(a => a.startsWith('--id='))?.split('=')[1];
const fromArg       = args.find(a => a.startsWith('--from='))?.split('=')[1];
const toArg         = args.find(a => a.startsWith('--to='))?.split('=')[1];
const difficultyArg = args.find(a => a.startsWith('--difficulty='))?.split('=')[1];
const tagsArg       = args.find(a => a.startsWith('--tags='))?.split('=')[1];
const parallelArg   = args.find(a => a.startsWith('--parallel='))?.split('=')[1];
const timeoutArg    = args.find(a => a.startsWith('--timeout='))?.split('=')[1];

const CONCURRENCY   = Math.max(1, parseInt(parallelArg || '1', 10));
const TIMEOUT_MS    = Math.max(5000, parseInt(timeoutArg || '60', 10) * 1000);

const FILTER_DEPTS      = deptArg ? deptArg.toLowerCase().split(',').map(d => d.trim()) : null;
const FILTER_BLOCKS     = blockArg ? blockArg.toUpperCase().split(',').map(b => b.trim()) : null;
const FILTER_IDS        = idArg ? idArg.toUpperCase().split(',').map(i => i.trim()) : null;
const FILTER_DIFFICULTY = difficultyArg ? difficultyArg.toLowerCase() : null;
const FILTER_TAGS       = tagsArg ? tagsArg.toLowerCase().split(',').map(t => t.trim()) : null;

// ─── Department map ───────────────────────────────────────────
const DEPT_MAP = {
  'anton-pa':    'anton-pa',
  'pa':          'anton-pa',
  'engineering': 'engineering',
  'eng':         'engineering',
  'marketing':   'marketing',
  'mktg':        'marketing',
  'seo':         'seo',
  'automation':  'automation',
  'auto':        'automation',
  'data':        'data',
  'growth':      'growth',
  'cross-dept':  'cross-dept',
  'cross':       'cross-dept',
};

const SCENARIO_FILE_MAP = {
  'anton-pa':   './scenarios/anton-pa.js',
  'engineering':'./scenarios/engineering.js',
  'marketing':  './scenarios/marketing.js',
  'seo':        './scenarios/seo.js',
  'automation': './scenarios/automation.js',
  'data':       './scenarios/data.js',
  'growth':     './scenarios/growth.js',
  'cross-dept': './scenarios/cross-dept.js',
};

const DEPT_DISPLAY = {
  'anton-pa':   'Anton PA',
  'engineering':'Engineering',
  'marketing':  'Marketing',
  'seo':        'SEO',
  'automation': 'Automation',
  'data':       'Data',
  'growth':     'Growth',
  'cross-dept': 'Cross-Dept',
};

// ─── Colors ───────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  magenta:'\x1b[35m',
  cyan:   '\x1b[36m',
  white:  '\x1b[37m',
  gray:   '\x1b[90m',
};

function color(c, text) {
  return `${c}${text}${C.reset}`;
}

function print(msg) {
  process.stdout.write(msg + '\n');
}

// ─── Logging ──────────────────────────────────────────────────
const LOG_DIR = join(DATA_DIR, 'logs', 'tests');
mkdirSync(LOG_DIR, { recursive: true });

const TODAY = new Date().toISOString().split('T')[0];
const RUN_TS = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const LOG_FILE    = join(LOG_DIR, `full-suite-${TODAY}.jsonl`);
const REPORT_FILE = join(LOG_DIR, `full-suite-${TODAY}-report.md`);

function appendLog(entry) {
  if (DRY_RUN || LIST_ONLY) return;
  try {
    appendFileSync(LOG_FILE, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
  } catch {}
}

// ─── Resume: load already-passed IDs from JSONL log ──────────
function loadPassedIds() {
  const passed = new Set();
  if (!RESUME || !existsSync(LOG_FILE)) return passed;
  try {
    const lines = readFileSync(LOG_FILE, 'utf-8').trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type === 'scenario_result' && entry.status === 'pass' && entry.id) {
          passed.add(entry.id);
        }
      } catch {}
    }
    print(color(C.cyan, `[Resume] Found ${passed.size} previously passed scenario IDs to skip`));
  } catch (e) {
    print(color(C.yellow, `[Resume] Could not read log: ${e.message}`));
  }
  return passed;
}

// ─── Load scenario modules ────────────────────────────────────
async function loadScenarios() {
  const allScenarios = [];
  const warnings = [];

  const deptKeys = FILTER_DEPTS
    ? FILTER_DEPTS.map(d => DEPT_MAP[d]).filter(Boolean)
    : Object.keys(SCENARIO_FILE_MAP);

  const uniqueDepts = [...new Set(deptKeys)];

  for (const dept of uniqueDepts) {
    const relPath = SCENARIO_FILE_MAP[dept];
    const absPath = join(__dirname, relPath);

    try {
      const mod = await import(absPath);
      if (!mod.scenarios || !Array.isArray(mod.scenarios)) {
        warnings.push(`${absPath}: exported 'scenarios' is not an array — skipping`);
        continue;
      }
      for (const s of mod.scenarios) {
        allScenarios.push({ ...s, _dept: dept });
      }
    } catch (e) {
      warnings.push(`${absPath}: failed to load — ${e.message}`);
    }
  }

  return { allScenarios, warnings };
}

// ─── Scenario filtering ───────────────────────────────────────
function applyFilters(scenarios, passedIds) {
  let filtered = scenarios;

  // --block
  if (FILTER_BLOCKS) {
    filtered = filtered.filter(s => FILTER_BLOCKS.some(b => s.block?.toUpperCase() === b));
  }

  // --id
  if (FILTER_IDS) {
    filtered = filtered.filter(s => FILTER_IDS.includes(s.id?.toUpperCase()));
  }

  // --from / --to (range within ordered list)
  if (fromArg || toArg) {
    const ids = filtered.map(s => s.id);
    const fromIdx = fromArg ? ids.findIndex(id => id?.toUpperCase() === fromArg.toUpperCase()) : 0;
    const toIdx   = toArg   ? ids.findIndex(id => id?.toUpperCase() === toArg.toUpperCase())   : ids.length - 1;
    const start = fromIdx >= 0 ? fromIdx : 0;
    const end   = toIdx   >= 0 ? toIdx   : filtered.length - 1;
    filtered = filtered.slice(start, end + 1);
  }

  // --difficulty
  if (FILTER_DIFFICULTY) {
    filtered = filtered.filter(s => s.difficulty === FILTER_DIFFICULTY);
  }

  // --tags
  if (FILTER_TAGS) {
    filtered = filtered.filter(s =>
      s.tags && FILTER_TAGS.some(tag => s.tags.includes(tag))
    );
  }

  // --resume: skip already-passed
  if (RESUME && passedIds.size > 0) {
    const before = filtered.length;
    filtered = filtered.filter(s => !passedIds.has(s.id));
    const skipped = before - filtered.length;
    if (skipped > 0) {
      print(color(C.gray, `[Resume] Skipping ${skipped} already-passed scenarios`));
    }
  }

  return filtered;
}

// ─── Team resolution ──────────────────────────────────────────
function resolveAgents(scenarios, TEAM) {
  const resolved = [];
  const missing = new Set();

  for (const s of scenarios) {
    const member = TEAM[s.agentKey];
    if (!member) {
      missing.add(s.agentKey);
      resolved.push({ ...s, _agent: null });
    } else {
      resolved.push({ ...s, _agent: member });
    }
  }

  if (missing.size > 0) {
    for (const key of missing) {
      print(color(C.yellow, `[Warn] Unknown agentKey: "${key}" — those scenarios will be skipped`));
    }
  }

  return resolved.filter(s => s._agent !== null);
}

// ─── Module-scoped subsystem refs (assigned in main, used by processHandoffs) ─
let _ask, _consumeHandoffs, _logHandoff, _TEAM, _HANDOFF_RULES;

// ─── Synergy: handoff chain (mirrors handleAgentAction from index.js) ────
const recentDispatches = new Map(); // `${from}→${to}` → timestamp

async function processHandoffs(member, response, fns, depth = 0) {
  if (!SYNERGY || !response || depth >= 2) return [];

  const handoffs = [];

  // 1. Approval gate detection (log only — no Slack in test mode)
  const tail = response.slice(-200);
  const approvalMatch = tail.match(/AWAITING_APPROVAL:\s*([\w_]+)\s*[—\-]\s*(.+)/i);
  if (approvalMatch) {
    const entry = {
      type: 'approval_detected',
      from: member.name,
      action: approvalMatch[1].trim(),
      detail: approvalMatch[2].trim(),
      depth,
    };
    appendLog(entry);
    print(color(C.yellow, `      🔒 APPROVAL: ${member.name} → ${entry.action}: ${entry.detail.slice(0, 80)}`));
    return [entry];
  }

  // 2. Native SendMessage handoffs from sessions.js
  if (_consumeHandoffs) {
    const nativeHandoffs = _consumeHandoffs(member.name);
    for (const { target, message: hMsg } of nativeHandoffs) {
      const permitted = _HANDOFF_RULES?.[member.name] || [];
      if (!permitted.includes(target.name)) {
        print(color(C.gray, `      ⛔ ${member.name} → ${target.name} (blocked by allowlist)`));
        continue;
      }
      const dispatchKey = `${member.name}→${target.name}`;
      if (recentDispatches.has(dispatchKey) && Date.now() - recentDispatches.get(dispatchKey) < 60_000) {
        print(color(C.gray, `      ⏳ ${member.name} → ${target.name} (cooldown)`));
        continue;
      }
      recentDispatches.set(dispatchKey, Date.now());
      print(color(C.blue, `      📨 SendMessage: ${member.name} → ${target.name}`));
      _logHandoff?.(member.name, target.name, (hMsg || '').slice(0, 200));
      appendLog({ type: 'handoff', mechanism: 'SendMessage', from: member.name, to: target.name, depth });

      try {
        const hResponse = await fns.ask(target, hMsg);
        print(color(C.green, `      ✓ ${target.name} responded (${(hResponse?.length || 0)} chars)`));
        appendLog({ type: 'handoff_result', from: member.name, to: target.name, status: 'pass', response_preview: (hResponse || '').slice(0, 200) });
        handoffs.push({ mechanism: 'SendMessage', from: member.name, to: target.name, response: hResponse });

        // Recurse — the target's response may trigger further handoffs
        const deeper = await processHandoffs(target, hResponse, fns, depth + 1);
        handoffs.push(...deeper);
      } catch (e) {
        print(color(C.red, `      ✗ ${target.name} failed: ${e.message?.slice(0, 80)}`));
        appendLog({ type: 'handoff_result', from: member.name, to: target.name, status: 'error', error: e.message });
        handoffs.push({ mechanism: 'SendMessage', from: member.name, to: target.name, error: e.message });
      }
    }
  }

  // 3. Text-parse handoffs — detect teammate names + action words in response
  const hasActionContext = /\b(fix|bug|review|test|PTAL|pick up|handle|assign|merge|deploy|check|re-?test|ping me|ready for|can you|please)\b/i.test(response);
  if (!hasActionContext || !_HANDOFF_RULES) return handoffs;

  // Build negative zones (won't, don't, can't, not, until, before, without)
  const negativePatterns = /(?:won't|don't|can't|not|until|before|without)\s+(?:\w+\s+){0,3}/gi;
  const negativeZones = [];
  let neg;
  while ((neg = negativePatterns.exec(response)) !== null) {
    negativeZones.push({ start: neg.index, end: neg.index + neg[0].length + 20 });
  }

  const allMembers = Object.values(_TEAM || {});
  const alreadyDispatched = new Set();

  for (const teamMember of allMembers) {
    if (teamMember.name === member.name) continue;
    const nameMatch = new RegExp(`\\b${teamMember.name}\\b`, 'i').exec(response);
    if (!nameMatch) continue;

    const namePos = nameMatch.index;
    const isNegative = negativeZones.some(z => namePos >= z.start && namePos <= z.end);
    if (isNegative) continue;

    const permitted = _HANDOFF_RULES[member.name] || [];
    if (!permitted.includes(teamMember.name)) continue;

    const dispatchKey = `${member.name}→${teamMember.name}`;
    if (recentDispatches.has(dispatchKey) && Date.now() - recentDispatches.get(dispatchKey) < 60_000) continue;

    if (alreadyDispatched.has(teamMember.name)) continue;
    alreadyDispatched.add(teamMember.name);
    recentDispatches.set(dispatchKey, Date.now());

    print(color(C.blue, `      🔗 Handoff: ${member.name} → ${teamMember.name} (text-detected)`));
    _logHandoff?.(member.name, teamMember.name, response.slice(0, 200));
    appendLog({ type: 'handoff', mechanism: 'text-parse', from: member.name, to: teamMember.name, depth });

    try {
      const handoffPrompt = `${member.name} (${member.title}) just said this, and it's directed at you:\n\n"${response.slice(0, 1200)}"\n\nPick up what they're asking you to do. Respond naturally.`;
      const hResponse = await fns.ask(teamMember, handoffPrompt);
      print(color(C.green, `      ✓ ${teamMember.name} responded (${(hResponse?.length || 0)} chars)`));
      appendLog({ type: 'handoff_result', from: member.name, to: teamMember.name, status: 'pass', response_preview: (hResponse || '').slice(0, 200) });
      handoffs.push({ mechanism: 'text-parse', from: member.name, to: teamMember.name, response: hResponse });

      // Recurse
      const deeper = await processHandoffs(teamMember, hResponse, fns, depth + 1);
      handoffs.push(...deeper);
    } catch (e) {
      print(color(C.red, `      ✗ ${teamMember.name} failed: ${e.message?.slice(0, 80)}`));
      appendLog({ type: 'handoff_result', from: member.name, to: teamMember.name, status: 'error', error: e.message });
      handoffs.push({ mechanism: 'text-parse', from: member.name, to: teamMember.name, error: e.message });
    }
  }

  return handoffs;
}

// ─── Scenario execution ───────────────────────────────────────
async function runScenario(s, fns) {
  const { ask, trackRequest, logMessage, logResponse, logError } = fns;
  const start = Date.now();

  // Timeout via AbortController pattern — we race the ask() against a timer
  let timedOut = false;
  let timeoutHandle;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      timedOut = true;
      reject(new Error(`TIMEOUT after ${TIMEOUT_MS / 1000}s`));
    }, TIMEOUT_MS);
  });

  appendLog({
    type: 'scenario_start',
    id: s.id,
    block: s.block,
    dept: s._dept,
    agent: s._agent.name,
    title: s.title,
  });

  try {
    const response = await Promise.race([
      ask(s._agent, s.message),
      timeoutPromise,
    ]);

    clearTimeout(timeoutHandle);
    const elapsed = Date.now() - start;
    const tokEst = Math.round((response?.length || 0) / 4);

    trackRequest(s._agent.name, start, !!response, response?.length || 0);
    logMessage(s._agent.name, s.message, 'test-runner');
    logResponse(s._agent.name, response, elapsed, tokEst);

    // Synergy: process handoffs from this response
    let handoffResults = [];
    if (SYNERGY && response) {
      handoffResults = await processHandoffs(s._agent, response, fns, 0);
    }

    appendLog({
      type: 'scenario_result',
      id: s.id,
      block: s.block,
      dept: s._dept,
      agent: s._agent.name,
      title: s.title,
      status: 'pass',
      elapsed_ms: elapsed,
      tokens_est: tokEst,
      response_length: response?.length || 0,
      response_preview: (response || '').slice(0, 300),
      handoffs: handoffResults.length > 0 ? handoffResults.length : undefined,
    });

    return { status: 'pass', response, elapsed, handoffs: handoffResults };
  } catch (e) {
    clearTimeout(timeoutHandle);
    const elapsed = Date.now() - start;
    const status = timedOut ? 'timeout' : 'error';

    trackRequest(s._agent.name, start, false, 0);
    if (!timedOut) {
      logError(s._agent.name, e, s.message.slice(0, 200));
    }

    appendLog({
      type: 'scenario_result',
      id: s.id,
      block: s.block,
      dept: s._dept,
      agent: s._agent.name,
      title: s.title,
      status,
      elapsed_ms: elapsed,
      error: e.message,
    });

    return { status, error: e.message, elapsed };
  }
}

// ─── Block header printer ─────────────────────────────────────
const printedBlocks = new Set();

function maybePrintBlockHeader(s) {
  const key = `${s._dept}::${s.block}`;
  if (printedBlocks.has(key)) return;
  printedBlocks.add(key);

  const bar = '═'.repeat(62);
  const label = `${DEPT_DISPLAY[s._dept] || s._dept} — Block ${s.block}: ${s.blockName || ''}`;
  print('');
  print(color(C.magenta, `╔${bar}╗`));
  print(color(C.magenta, `║  ${label.padEnd(61)}║`));
  print(color(C.magenta, `╚${bar}╝`));
}

// ─── Progress line ────────────────────────────────────────────
function printScenarioResult(s, result, index, total) {
  const pct = `[${index}/${total}]`;
  const elapsed = result.elapsed ? `${(result.elapsed / 1000).toFixed(1)}s` : '-';
  const title = `${s.id}: ${s.title || ''}`.slice(0, 60).padEnd(60);
  const agent = (s._agent?.name || '?').padEnd(10);

  let icon, statusColor;
  switch (result.status) {
    case 'pass':    icon = '✓'; statusColor = C.green;   break;
    case 'timeout': icon = '⏱'; statusColor = C.yellow;  break;
    case 'error':   icon = '✗'; statusColor = C.red;     break;
    default:        icon = '?'; statusColor = C.gray;
  }

  const parts = [
    color(C.gray,   pct.padEnd(9)),
    color(statusColor, icon),
    color(C.cyan,   agent),
    title,
    color(C.gray,   elapsed),
  ];

  print(parts.join(' '));

  if (result.status !== 'pass' && result.error) {
    print(color(C.red, `      Error: ${result.error.slice(0, 150)}`));
  }
}

// ─── Parallel execution pool ──────────────────────────────────
async function runPool(scenarios, fns, concurrency) {
  const results = new Array(scenarios.length);
  let idx = 0;

  async function worker() {
    while (idx < scenarios.length) {
      const i = idx++;
      results[i] = await fns(i);
    }
  }

  const workers = Array.from({ length: concurrency }, worker);
  await Promise.all(workers);
  return results;
}

// ─── Markdown report ──────────────────────────────────────────
function buildMarkdownReport(scenarios, results, deptBreakdown, agentBreakdown, wallMs) {
  const total    = results.length;
  const passed   = results.filter(r => r.status === 'pass').length;
  const failed   = results.filter(r => r.status === 'error').length;
  const timeouts = results.filter(r => r.status === 'timeout').length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  const lines = [];

  // ── Title ──
  lines.push(`# Anton Org — Full Test Suite Report`);
  lines.push(`**Date:** ${TODAY}  |  **Run:** ${RUN_TS}`);
  lines.push(`**Flags:** ${args.join(' ') || '(none)'}`);
  lines.push('');

  // ── Summary table ──
  lines.push(`## Summary`);
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total scenarios | ${total} |`);
  lines.push(`| Passed | ✓ ${passed} (${passRate}%) |`);
  lines.push(`| Failed | ✗ ${failed} |`);
  lines.push(`| Timed out | ⏱ ${timeouts} |`);
  lines.push(`| Concurrency | ${CONCURRENCY} |`);
  lines.push(`| Timeout per scenario | ${TIMEOUT_MS / 1000}s |`);
  lines.push(`| Total wall time | ${(wallMs / 1000).toFixed(0)}s |`);
  lines.push('');

  // ── Per-department table ──
  lines.push(`## Results by Department`);
  lines.push('');
  lines.push(`| Department | Total | Pass | Fail | Timeout | Pass % |`);
  lines.push(`|------------|-------|------|------|---------|--------|`);

  for (const [dept, stats] of Object.entries(deptBreakdown)) {
    const dPct = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;
    const icon = dPct === 100 ? '✓' : dPct >= 80 ? '~' : '✗';
    lines.push(
      `| ${icon} ${DEPT_DISPLAY[dept] || dept} | ${stats.total} | ${stats.pass} | ${stats.fail} | ${stats.timeout} | ${dPct}% |`
    );
  }
  lines.push('');

  // ── Per-agent table ──
  lines.push(`## Results by Agent`);
  lines.push('');
  lines.push(`| Agent | Total | Pass | Fail | Timeout | Avg (s) |`);
  lines.push(`|-------|-------|------|------|---------|---------|`);

  const agentEntries = Object.entries(agentBreakdown).sort((a, b) => b[1].total - a[1].total);
  for (const [agent, stats] of agentEntries) {
    const avgS = stats.count > 0 ? (stats.totalMs / stats.count / 1000).toFixed(1) : '-';
    lines.push(
      `| ${agent} | ${stats.total} | ${stats.pass} | ${stats.fail} | ${stats.timeout} | ${avgS} |`
    );
  }
  lines.push('');

  // ── Slowest 10 ──
  const slowest = [...results.entries()]
    .filter(([, r]) => r.elapsed)
    .sort(([, a], [, b]) => b.elapsed - a.elapsed)
    .slice(0, 10);

  if (slowest.length > 0) {
    lines.push(`## Slowest 10 Scenarios`);
    lines.push('');
    lines.push(`| Rank | ID | Agent | Time | Status |`);
    lines.push(`|------|----|-------|------|--------|`);
    for (const [i, [idx, r]] of slowest.entries()) {
      const s = scenarios[idx];
      lines.push(
        `| ${i + 1} | ${s.id} | ${s._agent?.name || '?'} | ${(r.elapsed / 1000).toFixed(1)}s | ${r.status} |`
      );
    }
    lines.push('');
  }

  // ── Failures: full response only for non-passing ──
  const failures = results
    .map((r, i) => ({ r, s: scenarios[i] }))
    .filter(({ r }) => r.status !== 'pass');

  if (failures.length > 0) {
    lines.push(`## Failures & Errors (${failures.length})`);
    lines.push('');
    lines.push('> Full response text is shown only for failing scenarios to keep the report readable.');
    lines.push('');

    for (const { r, s } of failures) {
      lines.push(`### ${s.id}: ${s.title || ''}`);
      lines.push(`**Agent:** ${s._agent?.name || '?'}  |  **Block:** ${s.block}  |  **Dept:** ${DEPT_DISPLAY[s._dept] || s._dept}  |  **Status:** ${r.status}  |  **Time:** ${r.elapsed ? (r.elapsed / 1000).toFixed(1) + 's' : '-'}`);
      lines.push('');
      lines.push(`**Message:**`);
      lines.push('```');
      lines.push(s.message);
      lines.push('```');
      lines.push('');
      if (r.error) {
        lines.push(`**Error:**`);
        lines.push('```');
        lines.push(r.error);
        lines.push('```');
      } else if (r.response) {
        lines.push(`**Response:**`);
        lines.push(r.response);
      }
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  } else {
    lines.push(`## Failures & Errors`);
    lines.push('');
    lines.push('_All scenarios passed._');
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Graceful shutdown ────────────────────────────────────────
let shutdownRequested = false;

process.on('SIGINT', () => {
  print(color(C.yellow, '\n\n[SIGINT] Caught interrupt — writing partial report...'));
  shutdownRequested = true;
});

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  // ── Banner ──
  const bar = '═'.repeat(62);
  print('');
  print(color(C.bold + C.magenta, `╔${bar}╗`));
  print(color(C.bold + C.magenta, `║  Anton Org — Full Test Suite Runner${' '.repeat(27)}║`));
  print(color(C.bold + C.magenta, `║  ${new Date().toLocaleString().padEnd(61)}║`));
  print(color(C.bold + C.magenta, `╚${bar}╝`));
  print('');

  // ── Load scenarios ──
  print(color(C.cyan, 'Loading scenario modules...'));
  const { allScenarios, warnings } = await loadScenarios();

  if (warnings.length > 0) {
    for (const w of warnings) {
      print(color(C.yellow, `  [!] ${w}`));
    }
  }

  if (allScenarios.length === 0) {
    print(color(C.red, 'No scenarios loaded. Check that scenario files exist in tests/scenarios/'));
    print(color(C.gray, 'Expected files: anton-pa.js, engineering.js, marketing.js, seo.js, automation.js, data.js, growth.js, cross-dept.js'));
    process.exit(1);
  }

  print(color(C.green, `  Loaded ${allScenarios.length} scenarios from ${Object.keys(SCENARIO_FILE_MAP).length} departments`));

  // ── Init subsystems (skip for dry-run / list) ──
  let ask, consumeHandoffs, trackRequest, getReport, logMessage, logResponse, logError, logHandoff, TEAM, HANDOFF_RULES, findByName;

  if (!DRY_RUN && !LIST_ONLY) {
    print(color(C.cyan, 'Initializing subsystems...'));

    const sessions   = await import('../src/sessions.js');
    const analytics  = await import('../src/analytics.js');
    const logger     = await import('../src/logger.js');
    const teamModule = await import('../src/team.js');

    sessions.init(ANTON_ROOT, DATA_DIR);
    analytics.initAnalytics(DATA_DIR);
    logger.initLogger(DATA_DIR);

    ask           = sessions.ask;
    consumeHandoffs = sessions.consumeHandoffs;
    trackRequest  = analytics.trackRequest;
    getReport     = analytics.getReport;
    logMessage    = logger.logMessage;
    logResponse   = logger.logResponse;
    logError      = logger.logError;
    logHandoff    = logger.logHandoff;
    TEAM          = teamModule.TEAM;
    HANDOFF_RULES = teamModule.HANDOFF_RULES;
    findByName    = teamModule.findByName;

    // Expose to module-scoped processHandoffs()
    _ask = ask;
    _consumeHandoffs = consumeHandoffs;
    _logHandoff = logHandoff;
    _TEAM = TEAM;
    _HANDOFF_RULES = HANDOFF_RULES;

    print(color(C.green, '  Subsystems ready'));
    if (SYNERGY) print(color(C.cyan, '  Synergy mode ON — agents will delegate and hand off to each other'));
  } else {
    const teamModule = await import('../src/team.js');
    TEAM = teamModule.TEAM;
  }

  // ── Resolve team members ──
  const resolved = resolveAgents(allScenarios, TEAM);
  print(color(C.cyan, `  Resolved ${resolved.length}/${allScenarios.length} scenarios with valid agent keys`));

  // ── Load resume state ──
  const passedIds = loadPassedIds();

  // ── Apply filters ──
  const scenarios = applyFilters(resolved, passedIds);

  if (scenarios.length === 0) {
    print(color(C.yellow, 'No scenarios match the given filters.'));
    process.exit(0);
  }

  // ── List mode ──
  if (LIST_ONLY) {
    print('');
    print(color(C.bold, `All scenario IDs (${scenarios.length} total):`));
    print('');

    let lastDept = null;
    let lastBlock = null;
    for (const s of scenarios) {
      if (s._dept !== lastDept) {
        lastDept = s._dept;
        print(color(C.magenta, `\n  [${DEPT_DISPLAY[s._dept] || s._dept}]`));
      }
      if (s.block !== lastBlock) {
        lastBlock = s.block;
        print(color(C.yellow, `    Block ${s.block}: ${s.blockName || ''}`));
      }
      const diff = s.difficulty ? color(C.gray, ` [${s.difficulty}]`) : '';
      const tags = s.tags?.length ? color(C.dim, ` #${s.tags.join(' #')}`) : '';
      print(`      ${color(C.cyan, s.id.padEnd(12))} ${s._agent?.name?.padEnd(10) || '?'.padEnd(10)} ${(s.title || '').slice(0, 55)}${diff}${tags}`);
    }
    print('');
    return;
  }

  // ── Dry-run mode ──
  if (DRY_RUN) {
    print('');
    print(color(C.bold, `Dry run — ${scenarios.length} scenarios would execute:`));
    print('');

    let lastDept = null;
    let lastBlock = null;
    for (const s of scenarios) {
      if (s._dept !== lastDept) {
        lastDept = s._dept;
        print(color(C.magenta, `\n  [${DEPT_DISPLAY[s._dept] || s._dept}]`));
      }
      if (s.block !== lastBlock) {
        lastBlock = s.block;
        print(color(C.yellow, `    Block ${s.block}: ${s.blockName || ''}`));
      }
      print(`      ${color(C.cyan, s.id.padEnd(12))} -> ${s._agent?.name?.padEnd(10) || '?'.padEnd(10)} ${(s.title || '').slice(0, 55)}`);
    }
    print('');
    print(color(C.gray, `  Concurrency: ${CONCURRENCY}  |  Timeout: ${TIMEOUT_MS / 1000}s/scenario`));
    print('');
    return;
  }

  // ── Pre-run summary ──
  print('');
  print(color(C.bold, `Running ${scenarios.length} scenarios  |  concurrency: ${CONCURRENCY}  |  timeout: ${TIMEOUT_MS / 1000}s`));
  print(color(C.gray,  `JSONL log: ${LOG_FILE}`));
  print(color(C.gray,  `Report:    ${REPORT_FILE}`));
  print('');

  appendLog({
    type: 'run_start',
    total: scenarios.length,
    concurrency: CONCURRENCY,
    timeout_ms: TIMEOUT_MS,
    filters: { deptArg, blockArg, idArg, fromArg, toArg, difficultyArg, tagsArg },
  });

  // ── Execute ──
  const wallStart = Date.now();
  const results = [];
  const fns = { ask, trackRequest, logMessage, logResponse, logError };

  // Sequential execution (CONCURRENCY === 1) or pooled parallel
  if (CONCURRENCY === 1) {
    for (let i = 0; i < scenarios.length; i++) {
      if (shutdownRequested) {
        print(color(C.yellow, `\n[Shutdown] Stopping at scenario ${i + 1}/${scenarios.length}`));
        // Fill remaining results as skipped
        for (let j = i; j < scenarios.length; j++) {
          results.push({ status: 'skip', elapsed: 0 });
        }
        break;
      }

      const s = scenarios[i];
      maybePrintBlockHeader(s);

      const result = await runScenario(s, fns);
      results.push(result);
      printScenarioResult(s, result, i + 1, scenarios.length);
    }
  } else {
    // Parallel pool — block headers printed at first occurrence
    const poolResults = await runPool(
      scenarios,
      async (i) => {
        if (shutdownRequested) {
          return { status: 'skip', elapsed: 0 };
        }
        const s = scenarios[i];
        maybePrintBlockHeader(s);
        const result = await runScenario(s, fns);
        printScenarioResult(s, result, i + 1, scenarios.length);
        return result;
      },
      CONCURRENCY
    );
    results.push(...poolResults);
  }

  const wallMs = Date.now() - wallStart;

  // ── Aggregate stats ──
  const deptBreakdown = {};
  const agentBreakdown = {};

  for (let i = 0; i < scenarios.length; i++) {
    const s = scenarios[i];
    const r = results[i] || { status: 'skip', elapsed: 0 };

    // Department
    const dept = s._dept;
    if (!deptBreakdown[dept]) deptBreakdown[dept] = { total: 0, pass: 0, fail: 0, timeout: 0 };
    deptBreakdown[dept].total++;
    if (r.status === 'pass')    deptBreakdown[dept].pass++;
    if (r.status === 'error')   deptBreakdown[dept].fail++;
    if (r.status === 'timeout') deptBreakdown[dept].timeout++;

    // Agent
    const agentName = s._agent?.name || 'unknown';
    if (!agentBreakdown[agentName]) agentBreakdown[agentName] = { total: 0, pass: 0, fail: 0, timeout: 0, totalMs: 0, count: 0 };
    agentBreakdown[agentName].total++;
    if (r.status === 'pass')    agentBreakdown[agentName].pass++;
    if (r.status === 'error')   agentBreakdown[agentName].fail++;
    if (r.status === 'timeout') agentBreakdown[agentName].timeout++;
    if (r.elapsed) { agentBreakdown[agentName].totalMs += r.elapsed; agentBreakdown[agentName].count++; }
  }

  const totalPassed   = results.filter(r => r.status === 'pass').length;
  const totalFailed   = results.filter(r => r.status === 'error').length;
  const totalTimeouts = results.filter(r => r.status === 'timeout').length;
  const totalSkipped  = results.filter(r => r.status === 'skip').length;
  const passRate      = results.length > 0 ? Math.round((totalPassed / results.length) * 100) : 0;

  // ── Console summary ──
  print('');
  print(color(C.bold + C.magenta, '─'.repeat(64)));
  print(color(C.bold, '  RESULTS'));
  print(color(C.bold + C.magenta, '─'.repeat(64)));
  print('');

  print(color(C.bold, '  By department:'));
  for (const [dept, stats] of Object.entries(deptBreakdown)) {
    const dPct = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;
    const bar  = (dPct === 100 ? C.green : dPct >= 80 ? C.yellow : C.red);
    const name = (DEPT_DISPLAY[dept] || dept).padEnd(14);
    print(`    ${color(bar, name)} ${stats.pass}/${stats.total} passed  (${dPct}%)  ${stats.fail ? color(C.red, `${stats.fail} errors`) : ''}  ${stats.timeout ? color(C.yellow, `${stats.timeout} timeouts`) : ''}`);
  }

  print('');
  print('  Slowest 10:');
  const slowest = [...results.entries()]
    .filter(([, r]) => r && r.elapsed)
    .sort(([, a], [, b]) => b.elapsed - a.elapsed)
    .slice(0, 10);
  for (const [i, [idx, r]] of slowest.entries()) {
    const s = scenarios[idx];
    print(color(C.gray, `    ${String(i + 1).padStart(2)}. ${s.id.padEnd(12)} ${(s._agent?.name || '?').padEnd(10)} ${(r.elapsed / 1000).toFixed(1)}s`));
  }

  print('');
  const statusIcon = totalFailed + totalTimeouts === 0 ? color(C.green, '✓ ALL PASSED') : color(C.red, `✗ ${totalFailed + totalTimeouts} FAILED`);
  print(`  ${statusIcon}  —  ${totalPassed} passed, ${totalFailed} errors, ${totalTimeouts} timeouts${totalSkipped ? `, ${totalSkipped} skipped` : ''}  |  ${(wallMs / 1000).toFixed(0)}s wall time`);
  print('');

  // ── Write markdown report ──
  const report = buildMarkdownReport(scenarios, results, deptBreakdown, agentBreakdown, wallMs);
  try {
    writeFileSync(REPORT_FILE, report);
    print(color(C.gray, `  Report: ${REPORT_FILE}`));
  } catch (e) {
    print(color(C.red, `  [!] Failed to write report: ${e.message}`));
  }

  // ── Analytics footer ──
  if (typeof getReport === 'function') {
    print('');
    print(color(C.dim, '  Analytics:'));
    const analyticsReport = getReport();
    for (const line of analyticsReport.split('\n').slice(0, 20)) {
      print(color(C.dim, '  ' + line));
    }
  }

  appendLog({
    type: 'run_end',
    total: results.length,
    passed: totalPassed,
    failed: totalFailed,
    timeouts: totalTimeouts,
    wall_ms: wallMs,
  });

  print('');

  // Exit with non-zero if there were failures
  if (totalFailed > 0 || totalTimeouts > 0) {
    process.exit(1);
  }
}

main().catch(e => {
  print(color(C.red, `\n[Fatal] Runner crashed: ${e.message}`));
  console.error(e.stack);
  process.exit(1);
});

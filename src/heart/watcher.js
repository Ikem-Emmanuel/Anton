// ---- System Watcher ------------------------------------------------------
// Proactive health monitor. Runs in the background, alerts Noel via notifyNoel()
// when something needs attention.
//
// Monitors:
//   - CPU / memory / disk usage (systeminformation, 60s interval)
//   - Error log tailing (watches data/logs/ for ERROR/FATAL lines)
//   - Git repo state (uncommitted changes, branch divergence)
//
// PM2 process monitoring is a separate future module (requires pm2 npm package).
//
// Usage:
//   import { initWatcher, shutdownWatcher } from './watcher.js';
//   initWatcher({ notifyNoel, dataDir });

import { exec } from 'node:child_process';
import { readdirSync, readFileSync, statSync, watch } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import si from 'systeminformation';
import { eventBus } from '../nervous/eventbus.js';

const execAsync = promisify(exec);

let _dataDir = null;
let _broadcast = null;
let _intervals = [];
let _watchers = [];
let _lastSnapshot = null;

// Configurable thresholds
const THRESHOLDS = {
  cpuPercent: 85,
  memPercent: 85,
  diskPercent: 80,
};

export function initWatcher({ dataDir, thresholds, broadcast }) {
  _dataDir = dataDir;
  _broadcast = broadcast || null;
  if (thresholds) Object.assign(THRESHOLDS, thresholds);

  // System health check every 60s
  const healthInterval = setInterval(checkSystemHealth, 60_000);
  _intervals.push(healthInterval);

  // Run once immediately
  checkSystemHealth();

  // Watch log directory for new error lines
  startLogWatcher();

  console.log(
    `[Watcher] Monitoring started (CPU>${THRESHOLDS.cpuPercent}% MEM>${THRESHOLDS.memPercent}% DISK>${THRESHOLDS.diskPercent}%)`
  );
}

// ---- System Health (CPU / Memory / Disk) ----
async function checkSystemHealth() {
  try {
    const [load, mem, disk, battery] = await Promise.all([si.currentLoad(), si.mem(), si.fsSize(), si.battery()]);

    const snapshot = {
      cpu: Math.round(load.currentLoad),
      memUsed: Math.round((mem.used / mem.total) * 100),
      memTotal: Math.round(mem.total / 1024 / 1024 / 1024),
      diskUsed: Math.round(disk[0]?.use || 0),
      diskTotal: Math.round((disk[0]?.size || 0) / 1024 / 1024 / 1024),
      batteryPercent: battery.hasBattery ? battery.percent : null,
      batteryCharging: battery.hasBattery ? battery.isCharging : null,
      timestamp: new Date().toISOString(),
    };

    _lastSnapshot = snapshot;

    // Broadcast to web UI
    if (_broadcast) {
      try {
        _broadcast({ type: 'health', ...snapshot });
      } catch {}
    }

    // Emit events through the event bus (priority engine classifies and routes to notifyNoel)
    if (snapshot.cpu > THRESHOLDS.cpuPercent) {
      eventBus.emit('health:cpu:critical', { percent: snapshot.cpu, threshold: THRESHOLDS.cpuPercent });
    }

    if (snapshot.memUsed > THRESHOLDS.memPercent) {
      eventBus.emit('health:mem:critical', {
        percent: snapshot.memUsed,
        totalGB: snapshot.memTotal,
        threshold: THRESHOLDS.memPercent,
      });
    }

    if (snapshot.diskUsed > THRESHOLDS.diskPercent) {
      eventBus.emit('health:disk:high', {
        percent: snapshot.diskUsed,
        totalGB: snapshot.diskTotal,
        threshold: THRESHOLDS.diskPercent,
      });
    }

    if (snapshot.batteryPercent !== null && snapshot.batteryPercent < 15 && !snapshot.batteryCharging) {
      eventBus.emit('health:battery:low', { percent: snapshot.batteryPercent });
    }
  } catch (e) {
    console.error('[Watcher] Health check failed:', e.message);
  }
}

// ---- Log Watcher ----
function startLogWatcher() {
  const logsDir = join(_dataDir, 'logs');
  try {
    // Watch the logs directory for changes
    const watcher = watch(logsDir, { recursive: true }, (eventType, filename) => {
      if (!filename || !filename.endsWith('.jsonl')) return;
      checkLogFile(join(logsDir, filename));
    });
    _watchers.push(watcher);
  } catch {
    // logs dir might not exist yet
    console.warn('[Watcher] Logs directory not found — log tailing skipped');
  }
}

const recentLogErrors = new Set(); // dedup within session

function checkLogFile(filepath) {
  try {
    const stat = statSync(filepath);
    // Only check last 2KB of the file (tail)
    const size = stat.size;
    const readSize = Math.min(size, 2048);
    const fd = readFileSync(filepath, { encoding: 'utf-8' });
    const tail = fd.slice(-readSize);

    for (const line of tail.split('\n')) {
      if (!line.includes('"type":"error"') && !line.includes('FATAL') && !line.includes('unhandledRejection')) continue;

      // Dedup by first 100 chars
      const key = line.slice(0, 100);
      if (recentLogErrors.has(key)) continue;
      recentLogErrors.add(key);

      // Keep dedup set bounded
      if (recentLogErrors.size > 500) {
        const first = recentLogErrors.values().next().value;
        recentLogErrors.delete(first);
      }

      try {
        const parsed = JSON.parse(line);
        const agent = parsed.agent || 'unknown';
        const msg = parsed.error || parsed.message || 'Unknown error';
        eventBus.emit('log:error', { agent, message: msg.slice(0, 200) });
      } catch {
        eventBus.emit('log:error', { agent: 'system', message: line.slice(0, 200) });
      }
    }
  } catch {
    // File might have been rotated or deleted — skip
  }
}

// ---- Git State ----
export async function checkGitState(repoPath) {
  try {
    const { stdout: status } = await execAsync('git status --porcelain', { cwd: repoPath });
    const { stdout: branch } = await execAsync('git branch --show-current', { cwd: repoPath });
    const { stdout: ahead } = await execAsync('git rev-list --count @{upstream}..HEAD 2>/dev/null || echo 0', {
      cwd: repoPath,
    });
    const { stdout: behind } = await execAsync('git rev-list --count HEAD..@{upstream} 2>/dev/null || echo 0', {
      cwd: repoPath,
    });

    const uncommitted = status.trim().split('\n').filter(Boolean).length;
    return {
      branch: branch.trim(),
      uncommitted,
      ahead: parseInt(ahead.trim(), 10),
      behind: parseInt(behind.trim(), 10),
    };
  } catch {
    return null;
  }
}

// ---- Get current snapshot (for briefing / status queries) ----
export function getHealthSnapshot() {
  return _lastSnapshot;
}

// ---- Shutdown ----
export function shutdownWatcher() {
  for (const id of _intervals) clearInterval(id);
  for (const w of _watchers) w.close();
  _intervals = [];
  _watchers = [];
  console.log('[Watcher] Stopped');
}

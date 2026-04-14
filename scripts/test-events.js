#!/usr/bin/env node
// Manual test for the event bus + priority engine
// Usage: node scripts/test-events.js
//
// Fires sample events and shows how they'd be classified and routed.

import { eventBus } from '../src/eventbus.js';
import { initNotify, shutdownNotify } from '../src/notify.js';
import { emitEvent, getRules, getSeverity, initPriority, shutdownPriority } from '../src/priority.js';

console.log('--- Anton Event System Manual Test ---\n');

// Track what would be sent
const sent = [];
initPriority({
  notifyNoel: async (severity, message, opts) => {
    sent.push({ severity, message });
    console.log(`  [${severity}] ${message}`);
  },
});

console.log('[Test] Firing P0 — service crash');
emitEvent('service:crash', { name: 'api-service', restarts: 5 });

console.log('[Test] Firing P1 — agent stuck');
emitEvent('agent:stuck', { name: 'James', reason: 'no response for 5 min' });

console.log('[Test] Firing P1 — PR needs review');
emitEvent('pr:review:needed', { number: 99, title: 'Add trust tiers' });

console.log('[Test] Firing P2 — task assigned');
emitEvent('task:assigned', { title: 'Build watcher module', id: 'PHASE1-3' });

console.log('[Test] Firing P2 — anomaly detected');
emitEvent('metrics:anomaly', { metric: 'error_rate', value: '12/min', expected: '2/min' });

console.log('[Test] Firing P3 — task completed');
emitEvent('task:completed', { title: 'Morning briefing', agent: 'Anton' });

console.log('[Test] Firing unknown event (should not notify)');
emitEvent('random:thing', { data: true });

// Wait for async handlers
await new Promise((r) => setTimeout(r, 500));

console.log(`\n[Summary] ${sent.length} notifications sent`);
console.log(`  P0: ${sent.filter((s) => s.severity === 'P0').length}`);
console.log(`  P1: ${sent.filter((s) => s.severity === 'P1').length}`);
console.log(`  P2: ${sent.filter((s) => s.severity === 'P2').length}`);
console.log(`  P3: ${sent.filter((s) => s.severity === 'P3').length}`);

console.log(`\n[Event History] ${eventBus.getHistory().length} events recorded`);

shutdownPriority();
console.log('\n--- Test complete ---');
process.exit(0);

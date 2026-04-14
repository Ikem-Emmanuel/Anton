// ---- Event Bus -----------------------------------------------------------
// In-process pub/sub for decoupled alerts. Watchers emit events,
// the priority engine evaluates severity, notifyNoel delivers.
//
// Usage:
//   import { eventBus } from './eventbus.js';
//   eventBus.emit('service:crash', { name: 'api', restarts: 3 });
//   eventBus.on('service:crash', handler);

import { EventEmitter } from 'node:events';

class AntonEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
    this._history = [];
  }

  emit(event, data = {}) {
    const entry = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    this._history.push(entry);
    // Keep last 500 events
    if (this._history.length > 500) {
      this._history = this._history.slice(-500);
    }

    console.log(`[EventBus] ${event}`);
    return super.emit(event, data);
  }

  // Get recent events (for debugging / status queries)
  getHistory(limit = 20) {
    return this._history.slice(-limit);
  }

  // Get events of a specific type
  getByType(event, limit = 10) {
    return this._history.filter((e) => e.event === event).slice(-limit);
  }

  clearHistory() {
    this._history = [];
  }
}

export const eventBus = new AntonEventBus();

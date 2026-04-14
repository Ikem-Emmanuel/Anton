import { beforeEach, describe, expect, it } from 'vitest';
import { eventBus } from './eventbus.js';

describe('eventBus', () => {
  beforeEach(() => {
    eventBus.removeAllListeners();
    eventBus.clearHistory();
  });

  it('emits and receives events', () => {
    const received = [];
    eventBus.on('test:event', (data) => received.push(data));
    eventBus.emit('test:event', { value: 42 });
    expect(received).toHaveLength(1);
    expect(received[0].value).toBe(42);
  });

  it('stores event history', () => {
    eventBus.emit('a', { x: 1 });
    eventBus.emit('b', { x: 2 });
    eventBus.emit('c', { x: 3 });
    const history = eventBus.getHistory(10);
    expect(history).toHaveLength(3);
    expect(history[0].event).toBe('a');
    expect(history[2].event).toBe('c');
  });

  it('limits history to 500 entries', () => {
    for (let i = 0; i < 510; i++) {
      eventBus.emit('bulk', { i });
    }
    expect(eventBus.getHistory(1000).length).toBeLessThanOrEqual(500);
  });

  it('filters history by type', () => {
    eventBus.emit('health:cpu', { percent: 90 });
    eventBus.emit('task:done', { id: 1 });
    eventBus.emit('health:cpu', { percent: 45 });
    const cpuEvents = eventBus.getByType('health:cpu');
    expect(cpuEvents).toHaveLength(2);
  });

  it('clearHistory resets', () => {
    eventBus.emit('test', {});
    eventBus.clearHistory();
    expect(eventBus.getHistory()).toHaveLength(0);
  });

  it('includes timestamp in history entries', () => {
    eventBus.emit('test', {});
    const entry = eventBus.getHistory(1)[0];
    expect(entry.timestamp).toBeDefined();
    expect(new Date(entry.timestamp).getTime()).toBeGreaterThan(0);
  });
});

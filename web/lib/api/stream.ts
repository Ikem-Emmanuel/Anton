// AntonStream — singleton WebSocket client to the Anton service. Opens one
// connection per browser page, auto-reconnects with exponential backoff,
// multiplexes subscribers by event type.
//
// Shape on the wire matches what src/spine/web.js emit() sends:
//   { type: 'approval.created' | 'memory.written' | ..., data, timestamp }
//
// The raw client lives here (framework-free). The React-side wrapper is in
// hooks/use-anton-stream.ts.

export type AntonEvent<T = unknown> = {
  type: string;
  data: T;
  timestamp?: string;
};

export type EventHandler<T = unknown> = (event: AntonEvent<T>) => void;
export type Unsubscribe = () => void;

type StatusListener = (connected: boolean) => void;

function resolveWsUrl(): string {
  if (typeof window === 'undefined') return '';
  const envUrl = process.env.NEXT_PUBLIC_ANTON_WS_URL;
  if (envUrl) return envUrl;
  // Default: same hostname as the page, port 3000 (the Anton service).
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.hostname}:3000`;
}

class AntonStream {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<EventHandler>>();
  private statusListeners = new Set<StatusListener>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connected = false;
  private refcount = 0;

  /** Open the connection if no-one has yet. Returns a ref-release fn. */
  retain(): () => void {
    this.refcount += 1;
    if (this.refcount === 1 && !this.ws) this.open();
    return () => {
      this.refcount = Math.max(0, this.refcount - 1);
      if (this.refcount === 0) this.close();
    };
  }

  private open(): void {
    if (typeof window === 'undefined') return;
    const url = resolveWsUrl();
    if (!url) return;
    try {
      this.ws = new WebSocket(url);
    } catch (e) {
      console.warn('[AntonStream] Connect failed', e);
      this.scheduleReconnect();
      return;
    }
    this.ws.addEventListener('open', this.handleOpen);
    this.ws.addEventListener('message', this.handleMessage);
    this.ws.addEventListener('close', this.handleClose);
    this.ws.addEventListener('error', this.handleError);
  }

  private close(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    if (this.ws) {
      this.ws.removeEventListener('open', this.handleOpen);
      this.ws.removeEventListener('message', this.handleMessage);
      this.ws.removeEventListener('close', this.handleClose);
      this.ws.removeEventListener('error', this.handleError);
      this.ws.close();
      this.ws = null;
    }
    this.setConnected(false);
  }

  private handleOpen = (): void => {
    this.reconnectAttempt = 0;
    this.setConnected(true);
  };

  private handleClose = (): void => {
    this.setConnected(false);
    if (this.refcount > 0) this.scheduleReconnect();
  };

  private handleError = (): void => {
    // The close event will follow and trigger reconnect. Avoid double-noise.
  };

  private handleMessage = (e: MessageEvent): void => {
    let parsed: AntonEvent;
    try {
      parsed = JSON.parse(typeof e.data === 'string' ? e.data : '') as AntonEvent;
    } catch {
      return;
    }
    const set = this.handlers.get(parsed.type);
    if (!set) return;
    for (const h of set) {
      try {
        h(parsed);
      } catch (err) {
        console.warn(`[AntonStream] handler for ${parsed.type} threw`, err);
      }
    }
  };

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    // Exponential backoff capped at 15s. Jitter keeps multiple tabs from
    // reconnecting in lockstep.
    const base = Math.min(15_000, 500 * 2 ** Math.min(this.reconnectAttempt, 5));
    const jitter = Math.random() * 250;
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.refcount > 0) this.open();
    }, base + jitter);
  }

  private setConnected(next: boolean): void {
    if (this.connected === next) return;
    this.connected = next;
    for (const l of this.statusListeners) l(next);
  }

  /** Register a handler for a given event type. Returns an unsubscribe fn. */
  subscribe<T = unknown>(type: string, handler: EventHandler<T>): Unsubscribe {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler as EventHandler);
    return () => {
      set?.delete(handler as EventHandler);
      if (set && set.size === 0) this.handlers.delete(type);
    };
  }

  onStatus(listener: StatusListener): Unsubscribe {
    this.statusListeners.add(listener);
    // Fire once so new listeners know current state.
    listener(this.connected);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const stream = new AntonStream();

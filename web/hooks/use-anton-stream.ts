'use client';
// useAntonStream — React wrapper around the singleton WebSocket client.
// Opens the connection on mount (ref-counted, so multiple hooks share one
// socket), exposes subscribe() and a live `connected` boolean.

import { useEffect, useRef, useState } from 'react';
import { type EventHandler, stream, type Unsubscribe } from '@/lib/api/stream';

export type UseAntonStream = {
  connected: boolean;
  subscribe: <T = unknown>(type: string, handler: EventHandler<T>) => Unsubscribe;
};

export function useAntonStream(): UseAntonStream {
  const [connected, setConnected] = useState(() => stream.isConnected());
  const subscribeRef = useRef(stream.subscribe.bind(stream));

  useEffect(() => {
    const release = stream.retain();
    const unsubStatus = stream.onStatus(setConnected);
    return () => {
      unsubStatus();
      release();
    };
  }, []);

  return { connected, subscribe: subscribeRef.current };
}

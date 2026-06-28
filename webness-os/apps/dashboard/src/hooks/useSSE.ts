import { useCallback, useEffect, useRef, useState } from "react";

interface SSEEvent {
  event: string;
  data: any;
  timestamp: Date;
}

/**
 * Hook for consuming SSE streams from the API
 * Used for real-time task progress (the "Glass Factory" experience)
 */
export function useSSE(taskId: string | null) {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!taskId) return;

    const token = localStorage.getItem("webness_token");
    const url = `/api/stream?taskId=${taskId}&token=${token}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
    };

    // Listen for all Webness SSE events
    const eventTypes = [
      "connected",
      "task:started",
      "step:created",
      "step:updated",
      "task:completed",
      "task:failed",
      "agent:thinking",
      "agent:decided",
    ];

    for (const eventType of eventTypes) {
      es.addEventListener(eventType, (e: MessageEvent) => {
        const parsed: SSEEvent = {
          event: eventType,
          data: JSON.parse(e.data),
          timestamp: new Date(),
        };
        setEvents((prev) => [...prev, parsed]);
        setLastEvent(parsed);
      });
    }

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      // Reconnect after 3s
      setTimeout(connect, 3000);
    };
  }, [taskId]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      setIsConnected(false);
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close();
    setIsConnected(false);
  }, []);

  return { events, isConnected, lastEvent, disconnect };
}

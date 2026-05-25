// features/chat/hooks/useWebSocket.ts

import { useEffect, useRef, useState, useCallback } from "react";
import { WebSocketManager } from "../websocket/manager";

type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

interface UseWebSocketOptions {
  channelId: number | null;
  onMessage?: (data: any) => void;
  onStateChange?: (state: ConnectionState) => void;
  onError?: (error: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const { channelId, onMessage, onStateChange, onError } = options;

  const managerRef = useRef<WebSocketManager | null>(null);
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // FIX: Store callbacks in refs so we don't trigger the useEffect re-run
  const onMessageRef = useRef(onMessage);
  const onStateChangeRef = useRef(onStateChange);
  const onErrorRef = useRef(onError);

  // Keep refs updated with the latest callbacks on every render
  useEffect(() => {
    onMessageRef.current = onMessage;
    onStateChangeRef.current = onStateChange;
    onErrorRef.current = onError;
  });

  const [token, setToken] = useState<string>("");
  const [wsUrl, setWsUrl] = useState<string>("");

  useEffect(() => {
    const t = localStorage.getItem("token") || "";
    const url = (
      process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000"
    ).replace(/\/$/, "");
    setToken(t);
    setWsUrl(url);
  }, []);

  useEffect(() => {
    if (!token || !wsUrl || !channelId) {
      console.warn("[useWebSocket] Missing token or WS URL");
      return;
    }

    // Cleanup previous connection if it exists
    if (managerRef.current) {
      managerRef.current.disconnect();
    }

    const manager = new WebSocketManager({
      url: wsUrl,
      token,
      channelId,
      onStateChange: (newState) => {
        setState(newState);
        onStateChangeRef.current?.(newState); // Use ref to call latest function
      },
      onError: (errorMsg) => {
        setError(errorMsg);
        onErrorRef.current?.(errorMsg); // Use ref to call latest function
      },
    });

    managerRef.current = manager;

    // Subscribe using the ref
    if (onMessageRef.current) {
      unsubscribeRef.current = manager.onMessage((data) => {
        onMessageRef.current?.(data);
      });
    }

    manager.connect();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (managerRef.current) {
        managerRef.current.disconnect();
        managerRef.current = null;
      }
    };
  }, [token, wsUrl, channelId]); // FIX: Removed unstable callback dependencies!

  const send = useCallback((data: any) => {
    if (managerRef.current) {
      managerRef.current.send(data);
    }
  }, []);

  const isReady = useCallback(() => {
    return managerRef.current?.isReady() ?? false;
  }, []);

  return {
    state,
    error,
    send,
    isReady,
  };
}

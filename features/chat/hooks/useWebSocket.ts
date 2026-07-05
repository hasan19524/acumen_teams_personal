import { useEffect, useRef, useState, useCallback } from "react";
import { WebSocketManager } from "../websocket/manager";

export type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

interface UseWebSocketOptions {
  channelId: number | null;
  token: string | null;
  onMessage?: (data: any) => void;
  onStateChange?: (state: ConnectionState) => void;
  onError?: (error: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const { channelId, token, onMessage, onStateChange, onError } = options;

  const managerRef = useRef<WebSocketManager | null>(null);
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const onMessageRef = useRef(onMessage);
  const onStateChangeRef = useRef(onStateChange);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onStateChangeRef.current = onStateChange;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    // ✅ DISCONNECT if no token or channelId
    if (!token || !channelId) {
      if (managerRef.current) {
        managerRef.current.disconnect();
        managerRef.current = null;
      }
      // FIX: Only set to disconnected if we are leaving the chat page entirely
      if (state !== "disconnected") {
        setState("disconnected");
      }
      return;
    }

    const wsUrl = (
      process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000"
    ).replace(/\/$/, "");

    if (managerRef.current) {
      managerRef.current.disconnect();
    }

    const manager = new WebSocketManager({
      url: wsUrl,
      token,
      channelId,
      onStateChange: (newState) => {
        // FIX: Keep the UI as "connected" during channel switches to prevent flashing.
        // Only update to "connecting" if we aren't already connected.
        if (newState === "connecting" && state === "connected") {
          return;
        }
        setState(newState);
        onStateChangeRef.current?.(newState);
      },
      onError: (errorMsg) => {
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
      },
    });

    managerRef.current = manager;

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
  }, [token, channelId]);

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

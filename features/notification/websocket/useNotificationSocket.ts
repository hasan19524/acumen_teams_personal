import { useEffect, useRef } from "react";
import { WebSocketManager } from "../../chat/websocket/manager";
import { useNotificationStore } from "../store/notificationStore";
import { useAuth } from "@/hooks/useAuth";

export const useNotificationSocket = () => {
  const managerRef = useRef<WebSocketManager | null>(null);
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );
  const fetchUnreadCount = useNotificationStore(
    (state) => state.fetchUnreadCount,
  );
  const { authChecked } = useAuth();

  useEffect(() => {
    if (!authChecked) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

    const manager = new WebSocketManager({
      url: wsUrl,
      token,
      channelId: null,
      onStateChange: (state) => console.debug(`[Notif WS] ${state}`),
      onError: (err) => console.error(`[Notif WS] ${err}`),
    });

    managerRef.current = manager;

    const unsubscribe = manager.onMessage((event: any) => {
      if (event.type === "notification") {
        addNotification(event as any);
      }
      // Sync unread count on reconnect to catch missed events
      if (event.type === "connection_established") {
        fetchUnreadCount();
      }
    });

    manager.connect();

    return () => {
      unsubscribe();
      manager.disconnect();
    };
  }, [addNotification, fetchUnreadCount, authChecked]);
};

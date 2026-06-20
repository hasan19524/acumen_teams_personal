import { useEffect, useRef } from "react";
import { useNotificationStore } from "../store/notificationStore";
import { notificationApi } from "../services/notificationApi";
import { useAuth } from "@/hooks/useAuth";

const SYNC_INTERVAL_MS = 60_000;

export const useUnreadCount = () => {
  const { authChecked } = useAuth(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!authChecked) return;

    notificationApi.getUnreadCount().then(setUnreadCount).catch(console.error);

    intervalRef.current = setInterval(() => {
      notificationApi
        .getUnreadCount()
        .then(setUnreadCount)
        .catch(console.error);
    }, SYNC_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [authChecked, setUnreadCount]);

  return { unreadCount };
};

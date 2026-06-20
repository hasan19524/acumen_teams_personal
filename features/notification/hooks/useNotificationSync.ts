import { useEffect } from "react";
import { useNotificationStore } from "../store/notificationStore";
import { notificationApi } from "../services/notificationApi";
import { useAuth } from "@/hooks/useAuth";

export const useNotificationSync = () => {
  const { authChecked } = useAuth(false);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  useEffect(() => {
    if (!authChecked) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        notificationApi
          .getUnreadCount()
          .then(setUnreadCount)
          .catch(console.error);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [authChecked, setUnreadCount]);
};

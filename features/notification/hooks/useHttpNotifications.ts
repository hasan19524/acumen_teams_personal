// features/notification/hooks/useHttpNotifications.ts
import { useEffect } from "react";
import { useNotificationStore } from "../store/notificationStore";
import { useAuth } from "@/hooks/useAuth";
import { getWorkspaceId } from "@/lib/auth";

export const useHttpNotifications = () => {
  const { authChecked } = useAuth();
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  useEffect(() => {
    if (!authChecked) return;

    const wsId = getWorkspaceId();
    if (!wsId) return; // Prevent fetch if workspace_id is missing

    const poll = async () => {
      try {
        await fetchUnreadCount();
        await fetchNotifications();
      } catch (error) {
        console.warn("Notification poll failed:", error);
      }
    };

    poll();
    const interval = setInterval(poll, 30000);

    return () => clearInterval(interval);
  }, [authChecked, fetchUnreadCount, fetchNotifications]);
};

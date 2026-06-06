"use client";

import { useEffect } from "react";
import { useNotificationStore } from "@/features/notification/store/notificationStore";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "../hooks/useUnreadCount";
import { useNotificationSync } from "../hooks/useNotificationSync";

export function NotificationInitializer() {
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const { authChecked } = useAuth();

  // Phase 3: Unread count polling + tab visibility sync
  useUnreadCount();
  useNotificationSync();

  // Phase 1/2: Fetch persistent notification list on mount
  useEffect(() => {
    if (!authChecked) return;
    fetchNotifications();
  }, [authChecked, fetchNotifications]);

  return null;
}

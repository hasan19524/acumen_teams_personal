import { apiFetch } from "@/lib/api";
import { PersistedNotification } from "../types/notification";

interface NotificationListResponse {
  notifications: PersistedNotification[];
  unread_count: number;
}

interface UnreadCountResponse {
  unread_count: number;
}

interface BulkReadResponse {
  updated_count: number;
}

export const notificationApi = {
  getNotifications: async (): Promise<NotificationListResponse> => {
    const res = await apiFetch("/api/notifications/");
    if (!res.ok) throw new Error("Failed to fetch notifications");
    return res.json();
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiFetch("/api/notifications/unread-count/");
    if (!res.ok) throw new Error("Failed to fetch unread count");
    const data: UnreadCountResponse = await res.json();
    return data.unread_count || 0;
  },

  markRead: async (notificationId: number): Promise<void> => {
    const res = await apiFetch(`/api/notifications/${notificationId}/read/`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to mark as read");
  },

  markBulkRead: async (ids: number[]): Promise<number> => {
    const res = await apiFetch("/api/notifications/mark-read/", {
      method: "POST",
      body: JSON.stringify({ notification_ids: ids }),
    });
    if (!res.ok) throw new Error("Failed to bulk mark as read");
    const data: BulkReadResponse = await res.json();
    return data.updated_count || 0;
  },

  getPreferences: async () => {
    const res = await apiFetch("/api/notifications/preferences/");
    if (!res.ok) throw new Error("Failed to fetch preferences");
    return res.json();
  },
};

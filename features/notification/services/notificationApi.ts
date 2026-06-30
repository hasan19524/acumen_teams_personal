// features/notification/services/notificationApi.ts
import { apiFetch } from "@/lib/api";
import { getWorkspaceId } from "@/lib/auth";
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
    const wsId = getWorkspaceId();
    if (!wsId) return { notifications: [], unread_count: 0 }; // Safe fallback
    const res = await apiFetch(`/api/notifications/${wsId}/`);
    if (!res.ok) {
      console.warn("Failed to fetch notifications");
      return { notifications: [], unread_count: 0 };
    }
    return res.json();
  },

  getUnreadCount: async (): Promise<number> => {
    const wsId = getWorkspaceId();
    if (!wsId) return 0; // Safe fallback
    const res = await apiFetch(`/api/notifications/${wsId}/unread-count/`);
    if (!res.ok) {
      console.warn("Failed to fetch unread count");
      return 0;
    }
    const data: UnreadCountResponse = await res.json();
    return data.unread_count || 0;
  },

  markRead: async (notificationId: number): Promise<void> => {
    const wsId = getWorkspaceId();
    if (!wsId) return;
    const res = await apiFetch(
      `/api/notifications/${wsId}/${notificationId}/`,
      {
        method: "POST",
      },
    );
    if (!res.ok) throw new Error("Failed to mark as read");
  },

  markBulkRead: async (ids: number[]): Promise<number> => {
    const wsId = getWorkspaceId();
    if (!wsId) return 0;
    const res = await apiFetch(`/api/notifications/${wsId}/bulk-mark-read/`, {
      method: "POST",
      body: JSON.stringify({ notification_ids: ids }),
    });
    if (!res.ok) {
      console.warn("Failed to bulk mark as read");
      return 0;
    }
    const data: BulkReadResponse = await res.json();
    return data.updated_count || 0;
  },

  getPreferences: async () => {
    const wsId = getWorkspaceId();
    if (!wsId) return null;
    const res = await apiFetch(`/api/notifications/${wsId}/preferences/`);
    if (!res.ok) throw new Error("Failed to fetch preferences");
    return res.json();
  },
  deleteNotification: async (notificationId: number): Promise<void> => {
    const wsId = getWorkspaceId();
    if (!wsId) return;
    const res = await apiFetch(
      `/api/notifications/${wsId}/${notificationId}/`,
      {
        method: "DELETE",
      },
    );
    if (!res.ok) throw new Error("Failed to delete notification");
  },
};

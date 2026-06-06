import { create } from "zustand";
import {
  NotificationPayload,
  PersistedNotification,
} from "@/features/notification/types/notification";
import { notificationApi } from "../services/notificationApi";

const MAX_VISIBLE = 5;
const DISMISS_TIME = 6000;

export interface ActiveNotification extends NotificationPayload {
  _dismissTimer: number | null;
  _progress: number;
  _isPaused: boolean;
  _createdAt: number;
}

interface NotificationStore {
  // Transient popups
  notifications: ActiveNotification[];
  addNotification: (payload: NotificationPayload) => void;
  removeNotification: (id: string) => void;
  pauseNotification: (id: string) => void;
  resumeNotification: (id: string) => void;

  // Persistent list
  persistentNotifications: PersistedNotification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  addPersistedFromWS: (payload: NotificationPayload) => void;
  setUnreadCount: (count: number) => void;
}

function wsToPersisted(payload: NotificationPayload): PersistedNotification {
  const data = payload.data || {};
  const notifId = String(payload.notification_id || "0");

  return {
    id: parseInt(notifId) || 0,
    notification_type: payload.notification_type,
    actor_id: data.actor_id || null,
    actor_name: data.sender_name || data.actor_name || "",
    actor_username: data.actor_username || "",
    title:
      data.title || payload.notification_type.replace(/_/g, " ").toUpperCase(),
    description: data.message || "",
    status: "unread",
    metadata: data,
    related_object_id: data.channel_id || data.task_id || null,
    workspace_name: data.workspace_name || "",
    created_at: payload.timestamp || new Date().toISOString(),
    read_at: null,
  };
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // ── Transient Popups ──────────────────────────────────────────────────
  notifications: [],

  addNotification: (payload) => {
    const safePayload = {
      ...payload,
      notification_id: String(payload.notification_id || ""),
    };

    get().addPersistedFromWS(safePayload);

    set((state) => {
      if (
        state.notifications.some(
          (n) => n.notification_id === safePayload.notification_id,
        )
      ) {
        return state;
      }

      let currentNotifs = [...state.notifications];
      if (currentNotifs.length >= MAX_VISIBLE) {
        const oldest = currentNotifs.reduce((prev, curr) =>
          prev._createdAt < curr._createdAt ? prev : curr,
        );
        clearInterval(oldest._dismissTimer as number);
        currentNotifs = currentNotifs.filter(
          (n) => n.notification_id !== oldest.notification_id,
        );
      }

      const newNotif: ActiveNotification = {
        ...safePayload,
        _createdAt: Date.now(),
        _isPaused: false,
        _progress: 100,
        _dismissTimer: null,
      };

      let startTime = Date.now();

      const timer = setInterval(() => {
        const notif = get().notifications.find(
          (n) => n.notification_id === safePayload.notification_id,
        );
        if (!notif || notif._isPaused) return;

        const elapsed = Date.now() - startTime;
        const progress = 100 - (elapsed / DISMISS_TIME) * 100;

        if (progress <= 0) {
          clearInterval(timer);
          get().removeNotification(safePayload.notification_id);
        } else {
          set((s) => ({
            notifications: s.notifications.map((n) =>
              n.notification_id === safePayload.notification_id
                ? { ...n, _progress: progress }
                : n,
            ),
          }));
        }
      }, 50);

      newNotif._dismissTimer = timer as unknown as number;
      currentNotifs.unshift(newNotif);

      return { notifications: currentNotifs };
    });
  },

  removeNotification: (id) => {
    set((state) => {
      const notif = state.notifications.find((n) => n.notification_id === id);
      if (notif?._dismissTimer)
        clearInterval(notif._dismissTimer as unknown as number);
      return {
        notifications: state.notifications.filter(
          (n) => n.notification_id !== id,
        ),
      };
    });
  },

  pauseNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.notification_id === id ? { ...n, _isPaused: true } : n,
      ),
    }));
  },

  resumeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.notification_id === id ? { ...n, _isPaused: false } : n,
      ),
    }));
  },

  // ── Persistent List ───────────────────────────────────────────────────
  persistentNotifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const data = await notificationApi.getNotifications();
      set({
        persistentNotifications: data.notifications || [],
        unreadCount: data.unread_count || 0,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (notificationId: number) => {
    set((state) => ({
      persistentNotifications: state.persistentNotifications.map((n) =>
        n.id === notificationId ? { ...n, status: "read" as const } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
    try {
      await notificationApi.markRead(notificationId);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      set((state) => ({
        persistentNotifications: state.persistentNotifications.map((n) =>
          n.id === notificationId ? { ...n, status: "unread" as const } : n,
        ),
        unreadCount: state.unreadCount + 1,
      }));
    }
  },

  markAllAsRead: async () => {
    const previousUnread = get().unreadCount;
    const unreadIds = get().persistentNotifications
      .filter((n) => n.status === "unread")
      .map((n) => n.id);

    // Don't call API if there are no unread notifications
    if (unreadIds.length === 0) return;

    set((state) => ({
      persistentNotifications: state.persistentNotifications.map((n) =>
        n.status === "unread" ? { ...n, status: "read" as const } : n,
      ),
      unreadCount: 0,
    }));

    try {
      await notificationApi.markBulkRead(unreadIds);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      set({ unreadCount: previousUnread });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      set({ unreadCount: count });
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  },

  addPersistedFromWS: (payload: NotificationPayload) => {
    const safePayload = {
      ...payload,
      notification_id: String(payload.notification_id || ""),
    };
    const persisted = wsToPersisted(safePayload);

    set((state) => {
      if (state.persistentNotifications.some((n) => n.id === persisted.id)) {
        return state;
      }
      return {
        persistentNotifications: [persisted, ...state.persistentNotifications],
        unreadCount: state.unreadCount + 1,
      };
    });
  },

  setUnreadCount: (count: number) => {
    set({ unreadCount: count });
  },
}));

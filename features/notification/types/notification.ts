// Notification types matching backend NOTIFICATION_TYPE_CHOICES exactly

export type NotificationType =
  | "chat_created"
  | "channel_joined"
  | "message_received"
  | "mention"
  | "task_assigned"
  | "announcement"
  | "workspace_event"
  | "dm_request"
  | "dm_request_accepted"
  | "dm_request_rejected"
  | "channel_invite"
  | "system"
  | "error"
  | "connection_established";

// ── WS Payload (realtime) ──────────────────────────────────────────────────

export interface NotificationPayload {
  type: "notification";
  notification_type: NotificationType;
  notification_id: string;
  data: {
    title?: string;
    message: string;
    avatar_url?: string | null;
    redirect_url?: string | null;
    [key: string]: any;
  };
  timestamp: string;
}

// ── API Response (persistent) ──────────────────────────────────────────────

export interface PersistedNotification {
  id: number;
  notification_type: NotificationType;
  actor_id: number | null;
  actor_name: string;
  actor_username: string;
  title: string;
  description: string;
  status: "unread" | "read" | "archived";
  metadata: Record<string, any>;
  related_object_id: number | null;
  workspace_name: string;
  created_at: string;
  read_at: string | null;
}

// ── Visual Config ──────────────────────────────────────────────────────────

export const notificationConfig: Record<
  NotificationType,
  { accent: string; icon: string }
> = {
  chat_created: { accent: "oklch(0.7 0.15 250)", icon: "💬" },
  channel_joined: { accent: "oklch(0.7 0.15 250)", icon: "#️⃣" },
  message_received: { accent: "oklch(0.6 0.15 255)", icon: "💬" },
  mention: { accent: "oklch(0.7 0.15 80)", icon: "🔔" },
  task_assigned: { accent: "oklch(0.7 0.15 140)", icon: "📋" },
  announcement: { accent: "oklch(0.7 0.15 30)", icon: "📢" },
  workspace_event: { accent: "oklch(0.6 0.1 260)", icon: "🏢" },
  dm_request: { accent: "oklch(0.7 0.15 250)", icon: "✉️" },
  dm_request_accepted: { accent: "oklch(0.7 0.15 160)", icon: "✅" },
  dm_request_rejected: { accent: "oklch(0.6 0.15 25)", icon: "✕" },
  channel_invite: { accent: "oklch(0.7 0.15 250)", icon: "#️⃣" },
  system: { accent: "var(--muted-foreground)", icon: "⚙️" },
  error: { accent: "var(--destructive)", icon: "❌" },
  connection_established: { accent: "oklch(0.7 0.15 160)", icon: "🔌" },
};

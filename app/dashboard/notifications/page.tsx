// app/dashboard/notifications/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useNotificationStore } from "@/features/notification/store/notificationStore";

// ── Design Tokens ─────────────────────────────────────────────────────
const tk = {
  bg: "#020617",
  surface: "rgba(15,23,42,0.8)",
  surfaceHover: "rgba(30,41,59,0.8)",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.14)",
  text: "#f1f5f9",
  textSecondary: "#94a3b8",
  textTer: "#64748b",
  accent: "#3b82f6",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  purple: "#a855f7",
};

export default function NotificationsPage() {
  const {
    persistentNotifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  const typeIcon: Record<string, string> = {
    workspace_event: "🏢",
    team_invite: "👥",
    group_invite: "🔒",
    dm_request: "💬",
    chat_created: "📩",
    task_assigned: "✅",
    announcement: "📢",
    attendance: "🕐",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: tk.bg,
        color: tk.text,
        fontFamily: "'Inter', sans-serif",
        padding: "32px 40px",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            Notifications
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              color: tk.textSecondary,
              fontSize: "15px",
            }}
          >
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            style={{
              height: "40px",
              padding: "0 18px",
              borderRadius: "8px",
              border: `1px solid ${tk.borderHover}`,
              background: "transparent",
              color: tk.accent,
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(59,130,246,0.1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {isLoading && (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: tk.textTer,
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: "16px",
            }}
          >
            Loading notifications...
          </div>
        )}

        {!isLoading && persistentNotifications.length === 0 && (
          <div
            style={{
              padding: "60px 40px",
              textAlign: "center",
              color: tk.textTer,
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: "16px",
            }}
          >
            <Bell size={40} style={{ marginBottom: "16px", opacity: 0.3 }} />
            <div
              style={{
                fontWeight: 600,
                marginBottom: "8px",
                color: tk.textSecondary,
              }}
            >
              No Notifications Yet
            </div>
            <div style={{ fontSize: "14px" }}>
              When you receive invites, messages, or updates, they will appear
              here.
            </div>
          </div>
        )}

        {!isLoading && persistentNotifications.length > 0 && (
          <div style={{ display: "grid", gap: "12px" }}>
            {persistentNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (n.status === "unread") markAsRead(n.id);
                }}
                style={{
                  background: tk.surface,
                  border: `1px solid ${tk.border}`,
                  borderLeft: `3px solid ${n.status === "unread" ? tk.accent : tk.border}`,
                  borderRadius: "12px",
                  padding: "16px 20px",
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                  transition: "all 0.2s",
                  cursor: n.status === "unread" ? "pointer" : "default",
                  opacity: n.status === "unread" ? 1 : 0.7,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = tk.borderHover;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = tk.border;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background:
                      n.status === "unread"
                        ? "rgba(59,130,246,0.15)"
                        : "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    flexShrink: 0,
                  }}
                >
                  {typeIcon[n.notification_type] || "🔔"}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: n.status === "unread" ? 700 : 500,
                        color: tk.text,
                      }}
                    >
                      {n.title || n.notification_type.replace(/_/g, " ")}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: tk.textTer,
                        flexShrink: 0,
                        marginLeft: "12px",
                      }}
                    >
                      {formatTime(n.created_at)}
                    </span>
                  </div>

                  {n.description && (
                    <p
                      style={{
                        margin: "0 0 8px",
                        fontSize: "13px",
                        color: tk.textSecondary,
                        lineHeight: 1.5,
                      }}
                    >
                      {n.description}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {n.workspace_name && (
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 6px",
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: "4px",
                          color: tk.textTer,
                        }}
                      >
                        {n.workspace_name}
                      </span>
                    )}
                    {n.status === "unread" && (
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 6px",
                          background: "rgba(59,130,246,0.15)",
                          borderRadius: "4px",
                          color: tk.accent,
                          fontWeight: 600,
                        }}
                      >
                        New
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                {n.status === "unread" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(n.id);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: tk.textTer,
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "4px",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = tk.accent)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = tk.textTer)
                    }
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

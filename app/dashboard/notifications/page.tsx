"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { useNotificationStore } from "@/features/notification/store/notificationStore";

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
        background: "linear-gradient(180deg,#020617 0%, #020b22 100%)",
        color: "#fff",
        display: "flex",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <DashboardSidebar />

      <div style={{ flex: 1, padding: 32 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "rgba(99,102,241,.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={24} style={{ color: "#818cf8" }} />
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 32,
                  fontWeight: 800,
                  letterSpacing: -0.5,
                }}
              >
                Notifications
              </h1>
              <p
                style={{
                  marginTop: 4,
                  color: "rgba(255,255,255,.5)",
                  fontSize: 14,
                }}
              >
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "You're all caught up"}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                border: "1px solid rgba(99,102,241,.3)",
                background: "rgba(99,102,241,.1)",
                color: "#a5b4fc",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              color: "rgba(255,255,255,.4)",
            }}
          >
            Loading notifications...
          </div>
        )}

        {/* Empty */}
        {!isLoading && persistentNotifications.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: 80,
              background: "rgba(255,255,255,.02)",
              border: "1px solid rgba(255,255,255,.05)",
              borderRadius: 20,
            }}
          >
            <Bell
              size={48}
              style={{ color: "rgba(255,255,255,.15)", marginBottom: 16 }}
            />
            <p
              style={{
                color: "rgba(255,255,255,.4)",
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              No notifications yet
            </p>
            <p
              style={{
                color: "rgba(255,255,255,.25)",
                fontSize: 13,
                marginTop: 8,
              }}
            >
              When you receive invites, messages, or updates, they'll appear
              here.
            </p>
          </div>
        )}

        {/* Notification List */}
        {!isLoading && persistentNotifications.length > 0 && (
          <div style={{ display: "grid", gap: 6 }}>
            {persistentNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (n.status === "unread") markAsRead(n.id);
                }}
                style={{
                  padding: "16px 20px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,.06)",
                  background:
                    n.status === "unread"
                      ? "rgba(99,102,241,.06)"
                      : "rgba(255,255,255,.02)",
                  cursor: n.status === "unread" ? "pointer" : "default",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  transition: "background 0.15s",
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background:
                      n.status === "unread"
                        ? "rgba(99,102,241,.15)"
                        : "rgba(255,255,255,.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {typeIcon[n.notification_type] || "🔔"}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: n.status === "unread" ? 700 : 500,
                        color:
                          n.status === "unread"
                            ? "#fff"
                            : "rgba(255,255,255,.7)",
                      }}
                    >
                      {n.title || n.notification_type.replace(/_/g, " ")}
                    </span>
                    {n.status === "unread" && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#818cf8",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                  {n.description && (
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 13,
                        color: "rgba(255,255,255,.5)",
                        lineHeight: 1.4,
                      }}
                    >
                      {n.description}
                    </p>
                  )}
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: "rgba(255,255,255,.3)",
                      fontWeight: 500,
                    }}
                  >
                    {formatTime(n.created_at)}
                    {n.workspace_name && ` · ${n.workspace_name}`}
                  </div>
                </div>

                {/* Read toggle */}
                {n.status === "unread" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(n.id);
                    }}
                    style={{
                      background: "rgba(99,102,241,.1)",
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 8px",
                      cursor: "pointer",
                      color: "#818cf8",
                      flexShrink: 0,
                    }}
                    title="Mark as read"
                  >
                    <Check size={14} />
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

"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Search,
  MessageSquare,
  AlertCircle,
  Zap,
  Users,
  FileText,
  Calendar,
} from "lucide-react";
import { tk } from "@/lib/tokens";
import { useNotificationStore } from "@/features/notification/store/notificationStore";
import { useRouter } from "next/navigation";

type FilterTab = "all" | "unread" | "read";

const notificationIcons: Record<string, React.ReactNode> = {
  chat_created: <MessageSquare size={18} />,
  channel_joined: <Users size={18} />,
  message_received: <MessageSquare size={18} />,
  mention: <AlertCircle size={18} />,
  task_assigned: <FileText size={18} />,
  announcement: <Zap size={18} />,
  workspace_event: <Users size={18} />,
  dm_request: <MessageSquare size={18} />,
};

export default function NotificationsPage() {
  const router = useRouter();
  const {
    persistentNotifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [loadMore, setLoadMore] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Format time relative
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
    if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
    return date.toLocaleDateString();
  };

  // Group by date
  const groupedNotifications = useMemo(() => {
    let filtered = persistentNotifications;

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          n.actor_name.toLowerCase().includes(q),
      );
    }

    // Filter by status
    if (filterTab !== "all") {
      filtered = filtered.filter((n) => n.status === filterTab);
    }

    // Group by date
    const groups: Record<string, typeof filtered> = {};

    filtered.forEach((n) => {
      const date = new Date(n.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupKey = "Earlier";
      if (date.toDateString() === today.toDateString()) {
        groupKey = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = "Yesterday";
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(n);
    });

    return groups;
  }, [persistentNotifications, search, filterTab]);

  const handleNotificationClick = (notification: any) => {
    // Deep-link based on type
    const type = notification.notification_type;
    const objId = notification.related_object_id;

    if (!markAsRead) return;
    markAsRead(notification.id);

    // Navigate to related content
    if (
      type === "message_received" ||
      type === "mention" ||
      type === "chat_created"
    ) {
      router.push(`/dashboard/chat`);
    } else if (type === "task_assigned") {
      router.push(`/dashboard/tasks`);
    } else if (type === "announcement") {
      router.push(`/dashboard/announcements`);
    } else if (type === "dm_request") {
      router.push(`/dashboard/chat`);
    } else if (type === "workspace_event") {
      router.push(`/dashboard/team`);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await useNotificationStore.getState().deleteNotification(id);
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: tk.bg,
        color: tk.textPrimary,
        fontFamily: "'Inter', sans-serif",
        padding: "32px 40px",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* HEADER */}
        <div
          style={{
            marginBottom: "32px",
          }}
        >
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
            Stay updated with activity across your workspace.
          </p>
        </div>

        {/* CONTROLS */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 24,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: tk.textMuted,
                pointerEvents: "none",
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications..."
              style={{
                width: "100%",
                padding: "10px 16px 10px 40px",
                borderRadius: 8,
                border: `1px solid ${tk.border}`,
                background: tk.surface,
                color: tk.textPrimary,
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Filter Tabs */}
          <div
            style={{
              display: "flex",
              gap: 2,
              background: tk.surface,
              padding: 3,
              borderRadius: 8,
              border: `1px solid ${tk.border}`,
            }}
          >
            {(["all", "unread", "read"] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "none",
                  background: filterTab === tab ? tk.brand : "transparent",
                  color: filterTab === tab ? "#fff" : tk.textMuted,
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  textTransform: "capitalize",
                  transition: "all 0.2s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Mark All Read */}
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: `1px solid ${tk.borderHover}`,
                background: "transparent",
                color: tk.textSecondary,
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = tk.brand;
                e.currentTarget.style.color = tk.brand;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = tk.borderHover;
                e.currentTarget.style.color = tk.textSecondary;
              }}
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {/* CONTENT */}
        {isLoading ? (
          <div style={{ display: "grid", gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 100,
                  background: tk.surface,
                  border: `1px solid ${tk.border}`,
                  borderRadius: 12,
                  animation: "pulse 2s infinite",
                }}
              />
            ))}
          </div>
        ) : Object.keys(groupedNotifications).length === 0 ? (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: 12,
            }}
          >
            <Bell size={48} style={{ margin: "0 auto 20px", opacity: 0.3 }} />
            <div
              style={{
                fontWeight: 600,
                fontSize: 18,
                color: tk.textSecondary,
                marginBottom: 8,
              }}
            >
              No notifications
            </div>
            <div style={{ fontSize: 14, color: tk.textMuted }}>
              You're all caught up. <br />
              We'll notify you when something important happens.
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 20 }}>
            {["Today", "Yesterday", "Earlier"].map((dateGroup) => {
              const items = groupedNotifications[dateGroup];
              if (!items || items.length === 0) return null;

              return (
                <div key={dateGroup}>
                  {/* Date Header */}
                  <div
                    style={{
                      paddingBottom: 12,
                      marginBottom: 12,
                      borderBottom: `1px solid ${tk.border}`,
                      color: tk.textMuted,
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {dateGroup}
                  </div>

                  {/* Notifications Grid */}
                  <div style={{ display: "grid", gap: 10 }}>
                    {items.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        onMouseEnter={() => setHoveredId(n.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{
                          background:
                            n.status === "unread"
                              ? `linear-gradient(135deg, ${tk.surface}, ${tk.surfaceHover})`
                              : tk.surface,
                          border: `1px solid ${
                            n.status === "unread" ? tk.borderHover : tk.border
                          }`,
                          borderLeft: `3px solid ${
                            n.status === "unread" ? tk.brand : "transparent"
                          }`,
                          borderRadius: 12,
                          padding: "16px 20px",
                          display: "flex",
                          gap: 14,
                          alignItems: "flex-start",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          opacity: hoveredId === n.id ? 1 : 0.9,
                          transform:
                            hoveredId === n.id
                              ? "translateY(-2px)"
                              : "translateY(0)",
                        }}
                      >
                        {/* Icon */}
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background:
                              n.status === "unread"
                                ? `${tk.brand}20`
                                : "rgba(255,255,255,0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color:
                              n.status === "unread" ? tk.brand : tk.textMuted,
                            flexShrink: 0,
                          }}
                        >
                          {notificationIcons[n.notification_type] || (
                            <Bell size={18} />
                          )}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: n.status === "unread" ? 700 : 500,
                              fontSize: 15,
                              color: tk.textPrimary,
                              marginBottom: 4,
                            }}
                          >
                            {n.title}
                          </div>
                          {n.description && (
                            <div
                              style={{
                                fontSize: 13,
                                color: tk.textSecondary,
                                marginBottom: 8,
                                lineHeight: 1.4,
                              }}
                            >
                              {n.description}
                            </div>
                          )}
                          <div
                            style={{
                              fontSize: 12,
                              color: tk.textMuted,
                            }}
                          >
                            {formatTime(n.created_at)}
                          </div>
                        </div>

                        {/* Actions */}
                        {hoveredId === n.id && (
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              flexShrink: 0,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {n.status === "unread" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(n.id);
                                }}
                                title="Mark as read"
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: tk.textMuted,
                                  cursor: "pointer",
                                  padding: 6,
                                  borderRadius: 4,
                                  transition: "color 0.2s",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.color = tk.success)
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.color = tk.textMuted)
                                }
                              >
                                <Check size={16} />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDelete(e, n.id)}
                              title="Delete notification"
                              style={{
                                background: "transparent",
                                border: "none",
                                color: tk.textMuted,
                                cursor: "pointer",
                                padding: 6,
                                borderRadius: 4,
                                transition: "color 0.2s",
                                display: "flex",
                                alignItems: "center",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.color = tk.primary)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.color = tk.textMuted)
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {persistentNotifications.length >= 50 && !loadMore && (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button
              onClick={() => setLoadMore(true)}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: `1px solid ${tk.borderHover}`,
                background: "transparent",
                color: tk.textSecondary,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = tk.brand;
                e.currentTarget.style.color = tk.brand;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = tk.borderHover;
                e.currentTarget.style.color = tk.textSecondary;
              }}
            >
              Load More
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </main>
  );
}

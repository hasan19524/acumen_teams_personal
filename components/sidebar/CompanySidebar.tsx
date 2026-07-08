"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  Calendar,
  Megaphone,
  Users,
  StickyNote,
  Settings,
} from "lucide-react";
import { NotificationBadge } from "@/features/notification/components/NotificationBadge";
import { useNotificationStore } from "@/features/notification/store/notificationStore";
import { useChatStore } from "@/features/chat/store/chatStore";
import { loadChannels, loadDMs } from "@/features/chat/services/channelService";
import { useEffect } from "react";

const COMPANY_NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Attendance", href: "/dashboard/attendance", icon: Calendar },
  { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Notes", href: "/dashboard/notes", icon: StickyNote },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function CompanySidebar({
  isMobileDrawer = false,
}: {
  isMobileDrawer?: boolean;
}) {
  const pathname = usePathname();
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const setChannels = useChatStore((s) => s.setChannels);
  const channels = useChatStore((s) => s.channels);

  useEffect(() => {
    if (channels.length === 0) {
      Promise.all([loadChannels(), loadDMs()])
        .then(([loadedChannels, loadedDms]) =>
          setChannels([...loadedChannels, ...loadedDms]),
        )
        .catch(() => {});
    }
  }, [channels.length, setChannels]);

  const chatUnread = useChatStore((state) =>
    state.channels.reduce((sum, c) => sum + (c.unread_count || 0), 0),
  );

  return (
    <aside
      className={
        isMobileDrawer
          ? "flex flex-col h-full"
          : "hidden md:flex flex-col h-full"
      }
      style={{
        background: "var(--sidebar)",
        borderRight: "1px solid var(--border)",
        padding: "24px 16px",
        position: "relative",
        zIndex: 10,
        width: 280,
        flexShrink: 0,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <style>{`
        .sidebar-item { transition: all 0.2s ease; position: relative; border-left: 4px solid transparent; }
        .sidebar-item:not(.sidebar-active):hover { background: var(--sidebar-hover) !important; color: var(--heading) !important; }
        .sidebar-item.sidebar-active { background: var(--sidebar-active) !important; border-left: 4px solid var(--brand) !important; color: var(--heading) !important; }
      `}</style>

      <div
        style={{
          padding: "16px 12px 24px",
          borderBottom: "1px solid var(--border)",
          marginBottom: 16,
          borderRadius: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 8px",
            borderRadius: 12,
            background:
              "linear-gradient(135deg, var(--tint-red) 0%, var(--tint-indigo) 100%)",
          }}
        >
          <img
            src="/acumen-logo.svg"
            alt="Acumen Teams"
            style={{ width: "240px", height: "auto" }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gap: 4, flex: 1 }}>
        {COMPANY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name + item.href}
              href={item.href}
              onClick={() => {
                if (item.name === "Chat") markAllAsRead();
              }}
              className={`sidebar-item ${active ? "sidebar-active" : ""}`}
              style={{
                padding: "12px 14px",
                borderRadius: "0 10px 10px 0",
                textDecoration: "none",
                fontWeight: active ? 600 : 500,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: active ? "var(--heading)" : "var(--text-secondary)",
              }}
            >
              <div style={{ position: "relative", display: "flex" }}>
                <Icon size={18} />
                {item.name === "Chat" && chatUnread > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -10,
                      background: "var(--primary)",
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                      border: "1px solid var(--sidebar)",
                    }}
                  >
                    {chatUnread > 99 ? "99+" : chatUnread}
                  </span>
                )}
                {item.name === "Notifications" && (
                  <NotificationBadge size={16} style={{ top: -4, right: -4 }} />
                )}
              </div>
              {item.name}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

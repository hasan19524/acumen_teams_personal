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
  Mail,
  Settings,
  Sparkles,
} from "lucide-react";
import { NotificationBadge } from "@/features/notification/components/NotificationBadge";
import { useNotificationStore } from "@/features/notification/store/notificationStore";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Attendance", href: "/dashboard/attendance", icon: Calendar },
  { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Invites", href: "/dashboard/invites", icon: Mail },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  return (
    <aside
      style={{
        background: "#12141f",
        borderRight: "1px solid rgba(255,255,255,.06)",
        padding: "32px 18px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        zIndex: 10,
        minHeight: "100vh",
        width: 280,
        flexShrink: 0,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <style>{`
        .sidebar-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .sidebar-item::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.05), transparent);
          transition: left 0.5s;
        }
        .sidebar-item:hover::before { left: 100%; }
        .sidebar-item:not(.sidebar-active):hover {
          background: rgba(255,255,255,.08) !important;
          transform: translateX(6px);
          color: #fff !important;
        }
        .sidebar-logo {
          background: linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-family: 'Syne', sans-serif;
        }
      `}</style>

      {/* Logo */}
      <div
        style={{
          padding: "0 10px 32px",
          borderBottom: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <h2
          className="sidebar-logo"
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 10,
            letterSpacing: "-0.3px",
          }}
        >
          <Sparkles size={22} style={{ color: "#818cf8", flexShrink: 0 }} />
          <span
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.2,
            }}
          >
            <span style={{ fontSize: 19, letterSpacing: "6px" }}>ACUMEN</span>
            <span
              style={{
                fontSize: 18,
                letterSpacing: "5px",
                paddingLeft: "52px",
              }}
            >
              TEAMS
            </span>
          </span>
        </h2>
        <p
          style={{
            marginTop: 6,
            color: "rgba(255,255,255,.4)",
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
          }}
        >
          Business Workspace
        </p>
      </div>

      {/* Nav Items */}
      <div style={{ marginTop: 28, display: "grid", gap: 6 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const showBadge = item.name === "Chat";
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                if (item.name === "Chat") markAllAsRead();
              }}
              className={`sidebar-item ${active ? "sidebar-active" : ""}`}
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                textDecoration: "none",
                fontWeight: active ? 600 : 500,
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: active ? "#fff" : "rgba(255,255,255,.65)",
                background: active
                  ? "linear-gradient(135deg,#6366f1,#818cf8)"
                  : "transparent",
                boxShadow: active ? "0 8px 24px rgba(99,102,241,0.35)" : "none",
                position: "relative",
              }}
            >
              <div style={{ position: "relative", display: "flex" }}>
                <Icon size={20} />
                {showBadge && (
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

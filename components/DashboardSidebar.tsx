// components/DashboardSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  Calendar,
  Megaphone,
  Users,
  Mail,
  Settings,
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
  const router = useRouter();
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  return (
    <aside
      style={{
        background: "#0D1B3D", // Acumen Sidebar Color
        borderRight: "1px solid #2A3A5C", // Acumen Border
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
          transition: all 0.2s ease;
          position: relative;
          border-left: 4px solid transparent;
        }
        .sidebar-item:not(.sidebar-active):hover {
          background: #16284F !important; // Acumen Sidebar Hover
          color: #FFFFFF !important;
        }
        .sidebar-item.sidebar-active {
          background: #2A3D73 !important; // Acumen Sidebar Active (Purple-ish bg)
          border-left: 4px solid #E31E24 !important; // Acumen Primary (Red)
          color: #FFFFFF !important;
        }
      `}</style>

      {/* Logo */}
      <div
        style={{
          padding: "0 10px 32px",
          borderBottom: "1px solid #2A3A5C",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 0",
            marginLeft: "-10px",
          }}
        >
          <img
            src="/acumen-logo.svg"
            alt="Acumen Teams"
            style={{ width: "255px", height: "auto" }}
          />
        </div>
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
                borderRadius: "0 12px 12px 0", // Flat left for border, rounded right
                textDecoration: "none",
                fontWeight: active ? 600 : 500,
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: active ? "#FFFFFF" : "#B7C0D8", // Acumen Text Secondary
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

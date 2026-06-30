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
  Home,
  Clock,
  Bell,
} from "lucide-react";
import { NotificationBadge } from "@/features/notification/components/NotificationBadge";
import { useNotificationStore } from "@/features/notification/store/notificationStore";

export const navItems = [
  // Workspace
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, requiresWorkspace: true },
  { name: "Chat", href: "/dashboard/chat", icon: MessageSquare, requiresWorkspace: true },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare, requiresWorkspace: true },
  { name: "Attendance", href: "/dashboard/attendance", icon: Calendar, requiresWorkspace: true },
  { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone, requiresWorkspace: true },
  { name: "Team", href: "/dashboard/team", icon: Users, requiresWorkspace: true },
  { name: "Invites", href: "/dashboard/invites", icon: Mail, requiresWorkspace: true },
  // Independent
  { name: "Home", href: "/dashboard", icon: Home, requiresWorkspace: false },
  { name: "Invitations", href: "/dashboard/invites", icon: Mail, requiresWorkspace: false },
  { name: "Clock", href: "/dashboard/clock", icon: Clock, requiresWorkspace: false },
  // Shared (Accessible to everyone)
  { name: "Settings", href: "/dashboard/settings", icon: Settings, requiresWorkspace: "both" as any },
];

export const ALLOWED_INDEPENDENT_ROUTES = navItems
  .filter((item) => item.requiresWorkspace === false || item.requiresWorkspace === "both")
  .map((item) => item.href);

export default function DashboardSidebar({ hasWorkspace }: { hasWorkspace: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const visibleItems = navItems.filter((item) => {
    if (item.requiresWorkspace === "both") return true;
    return hasWorkspace ? item.requiresWorkspace === true : item.requiresWorkspace === false;
  });

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
            <div style={{ marginTop: 28, display: "grid", gap: 6, flex: 1 }}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          // Prevent 'Home' and 'Dashboard' from both being active on /dashboard
          const active = pathname === item.href && (hasWorkspace ? item.requiresWorkspace : !item.requiresWorkspace);
          const showBadge = item.name === "Chat" || item.name === "Notifications";
          return (
            <Link
              key={item.name + item.href}
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

      {/* Logout removed - exists in Settings */}
    </aside>
  );
}

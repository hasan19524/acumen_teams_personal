"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mail, Clock, Settings, StickyNote } from "lucide-react";

const INDEPENDENT_NAV_ITEMS = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Invitations", href: "/dashboard/invites", icon: Mail },
  { name: "Clock", href: "/dashboard/clock", icon: Clock },
  { name: "Notes", href: "/dashboard/notes", icon: StickyNote },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function IndependentSidebar({
  isMobileDrawer = false,
}: {
  isMobileDrawer?: boolean;
}) {
  const pathname = usePathname();

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
        .sidebar-item-ind { transition: all 0.2s ease; position: relative; border-left: 4px solid transparent; }
        .sidebar-item-ind:not(.sidebar-active-ind):hover { background: var(--sidebar-hover) !important; color: var(--heading) !important; }
        .sidebar-item-ind.sidebar-active-ind { background: var(--sidebar-active) !important; border-left: 4px solid var(--brand) !important; color: var(--heading) !important; }
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
        {INDEPENDENT_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name + item.href}
              href={item.href}
              className={`sidebar-item-ind ${active ? "sidebar-active-ind" : ""}`}
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
              </div>
              {item.name}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

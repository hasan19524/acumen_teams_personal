"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mail, Clock, Settings } from "lucide-react";

const INDEPENDENT_NAV_ITEMS = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Invitations", href: "/dashboard/invites", icon: Mail },
  { name: "Clock", href: "/dashboard/clock", icon: Clock },
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
        background: "#0D1B3D",
        borderRight: "1px solid #2A3A5C",
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
        .sidebar-item-ind:not(.sidebar-active-ind):hover { background: #16284F !important; color: #FFFFFF !important; }
        .sidebar-item-ind.sidebar-active-ind { background: #2A3D73 !important; border-left: 4px solid #E31E24 !important; color: #FFFFFF !important; }
      `}</style>

      <div
        style={{
          padding: "0 4px 24px",
          borderBottom: "1px solid #2A3A5C",
          marginBottom: 16,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", padding: "8px 0" }}
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
                color: active ? "#FFFFFF" : "#B7C0D8",
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

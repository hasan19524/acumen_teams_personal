"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Home,
  Clock3,
  ClipboardList,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Search,
  UserPlus,
  Shield,
  Download,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";

export default function TeamPage() {
  const [search, setSearch] = useState("");

  const users = [
    {
      name: "Areesh Jabbar",
      email: "areesh@acumen.com",
      role: "Super Admin",
      dept: "Management",
      status: "Active",
      lastSeen: "Now",
    },
    {
      name: "Amaan Khan",
      email: "amaan@acumen.com",
      role: "Manager",
      dept: "Sales",
      status: "Active",
      lastSeen: "2 min ago",
    },
    {
      name: "Sarah Ali",
      email: "sarah@acumen.com",
      role: "HR",
      dept: "Human Resources",
      status: "Pending",
      lastSeen: "-",
    },
    {
      name: "Rohan Patel",
      email: "rohan@acumen.com",
      role: "Employee",
      dept: "Development",
      status: "Suspended",
      lastSeen: "1 day ago",
    },
  ];

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const badge = (status: string) => {
    if (status === "Active")
      return { bg: "#16a34a", text: "#fff" };
    if (status === "Pending")
      return { bg: "#f59e0b", text: "#fff" };
    return { bg: "#ef4444", text: "#fff" };
  };

  const sideLink = (
    href: string,
    icon: any,
    active = false
  ) => {
    const Icon = icon;
    return (
      <Link
        href={href}
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: active
            ? "linear-gradient(135deg,#3b82f6,#4f46e5)"
            : "rgba(255,255,255,.04)",
          color: "#fff",
          textDecoration: "none",
          marginBottom: 14,
          transition: ".2s",
        }}
      >
        <Icon size={20} />
      </Link>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#020617 0%, #020b22 100%)",
        color: "#fff",
        display: "flex",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 78,
          borderRight: "1px solid rgba(255,255,255,.05)",
          padding: "18px 14px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            background:
              "linear-gradient(135deg,#3b82f6,#4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 20,
            marginBottom: 24,
          }}
        >
          AT
        </div>

        {sideLink("/dashboard", Home)}
        {sideLink("/dashboard/attendance", Clock3)}
        {sideLink("/dashboard/tasks", ClipboardList)}
        {sideLink("/dashboard/chat", MessageSquare)}
        {sideLink("/dashboard/team", Users, true)}
        {sideLink("/dashboard/settings", Settings)}

        <div style={{ marginTop: "auto" }}>
          {sideLink("/login", LogOut)}
        </div>
      </aside>

      {/* Main */}
      <main
        style={{
          flex: 1,
          padding: "26px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 48,
                fontWeight: 800,
                letterSpacing: -1,
              }}
            >
              Workspace Admin Console
            </h1>

            <p
              style={{
                marginTop: 8,
                color: "rgba(255,255,255,.65)",
                fontSize: 16,
              }}
            >
              Manage users, roles, permissions and members
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            {[
              { icon: Shield, text: "Permissions" },
              { icon: Download, text: "Export" },
            ].map((btn, i) => {
              const Icon = btn.icon;
              return (
                <button
                  key={i}
                  style={{
                    height: 46,
                    padding: "0 18px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,.06)",
                    background: "rgba(255,255,255,.03)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Icon size={17} />
                  {btn.text}
                </button>
              );
            })}

            <button
              style={{
                height: 46,
                padding: "0 20px",
                borderRadius: 14,
                border: "none",
                background:
                  "linear-gradient(135deg,#3b82f6,#4f46e5)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <UserPlus size={18} />
              Invite User
            </button>
          </div>
        </div>

        {/* Search */}
        <div
          style={{
            marginTop: 28,
            background: "rgba(255,255,255,.025)",
            border: "1px solid rgba(255,255,255,.05)",
            borderRadius: 18,
            padding: 14,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Search size={18} color="rgba(255,255,255,.6)" />

          <input
            placeholder="Search users..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: 15,
            }}
          />
        </div>

        {/* Table */}
        <div
          style={{
            marginTop: 24,
            borderRadius: 22,
            overflow: "visible",
            border: "1px solid rgba(255,255,255,.05)",
            background: "rgba(255,255,255,.02)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1.4fr 1.4fr 1fr 1fr 1fr 1fr 70px",
              padding: "18px 22px",
              color: "rgba(255,255,255,.55)",
              fontWeight: 700,
              fontSize: 14,
              borderBottom:
                "1px solid rgba(255,255,255,.05)",
            }}
          >
            <div>User</div>
            <div>Email</div>
            <div>Role</div>
            <div>Department</div>
            <div>Status</div>
            <div>Last Seen</div>
            <div></div>
          </div>

          {filtered.map((u, i) => {
            const b = badge(u.status);

            return (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1.4fr 1.4fr 1fr 1fr 1fr 1fr 70px",
                  padding: "18px 22px",
                  alignItems: "center",
                  borderBottom:
                    i !== filtered.length - 1
                      ? "1px solid rgba(255,255,255,.04)"
                      : "none",
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {u.name}
                </div>

                <div
                  style={{
                    color: "rgba(255,255,255,.75)",
                  }}
                >
                  {u.email}
                </div>

                {/* Role Dropdown */}
                <select
                  defaultValue={u.role}
                  style={{
                    height: 42,
                    background:
                      "rgba(255,255,255,.03)",
                    color: "#fff",
                    border:
                      "1px solid rgba(255,255,255,.06)",
                    borderRadius: 12,
                    padding: "0 12px",
                    outline: "none",
                  }}
                >
                  <option>Super Admin</option>
                  <option>Admin</option>
                  <option>Manager</option>
                  <option>HR</option>
                  <option>Employee</option>
                </select>

                {/* Dept Dropdown */}
                <select
                  defaultValue={u.dept}
                  style={{
                    height: 42,
                    background:
                      "rgba(255,255,255,.03)",
                    color: "#fff",
                    border:
                      "1px solid rgba(255,255,255,.06)",
                    borderRadius: 12,
                    padding: "0 12px",
                    outline: "none",
                  }}
                >
                  <option>Management</option>
                  <option>Sales</option>
                  <option>Human Resources</option>
                  <option>Development</option>
                  <option>Support</option>
                </select>

                <div>
                  <span
                    style={{
                      background: b.bg,
                      color: b.text,
                      padding: "8px 12px",
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {u.status}
                  </span>
                </div>

                <div
                  style={{
                    color: "rgba(255,255,255,.72)",
                  }}
                >
                  {u.lastSeen}
                </div>

                <button
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    border: "none",
                    background:
                      "rgba(255,255,255,.04)",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
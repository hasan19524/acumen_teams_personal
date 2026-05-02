"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Home,
  Clock3,
  ClipboardList,
  MessageSquare,
  Users,
  Megaphone,
  Settings,
  LogOut,
  User,
  Shield,
  Bell,
  Moon,
  Globe,
  Save,
  KeyRound,
} from "lucide-react";

export default function SettingsPage() {
  const [name, setName] = useState("Areesh Jabbar");
  const [email, setEmail] = useState("admin@acumen.com");
  const [company, setCompany] = useState("Acumen Teams");

  const [notifications, setNotifications] =
    useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [twoFA, setTwoFA] = useState(false);

  const sideItem = (
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
          background: active
            ? "linear-gradient(135deg,#3b82f6,#4f46e5)"
            : "rgba(255,255,255,.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          textDecoration: "none",
          marginBottom: 14,
        }}
      >
        <Icon size={20} />
      </Link>
    );
  };

  const card = {
    background: "rgba(255,255,255,.025)",
    border: "1px solid rgba(255,255,255,.05)",
    borderRadius: 22,
    padding: 22,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background:
          "linear-gradient(180deg,#020617,#020b22)",
        color: "#fff",
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

        {sideItem("/dashboard", Home)}
        {sideItem("/dashboard/attendance", Clock3)}
        {sideItem("/dashboard/tasks", ClipboardList)}
        {sideItem("/dashboard/chat", MessageSquare)}
        {sideItem("/dashboard/team", Users)}
        {sideItem("/dashboard/announcements", Megaphone)}
        {sideItem("/dashboard/settings", Settings, true)}

        <div style={{ marginTop: "auto" }}>
          {sideItem("/login", LogOut)}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: 28 }}>
        {/* Header */}
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 46,
              fontWeight: 800,
            }}
          >
            Settings
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,.65)",
              marginTop: 8,
            }}
          >
            Manage workspace preferences, profile and security
          </p>
        </div>

        {/* Grid */}
        <div
          style={{
            marginTop: 28,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 22,
          }}
        >
          {/* Profile */}
          <div style={card}>
            <h3
              style={{
                marginTop: 0,
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <User size={18} />
              Profile Settings
            </h3>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              style={input}
              placeholder="Full Name"
            />

            <input
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              style={input}
              placeholder="Email"
            />

            <input
              value={company}
              onChange={(e) =>
                setCompany(e.target.value)
              }
              style={input}
              placeholder="Company Name"
            />
          </div>

          {/* Security */}
          <div style={card}>
            <h3
              style={{
                marginTop: 0,
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <Shield size={18} />
              Security
            </h3>

            <ToggleRow
              label="Two Factor Authentication"
              enabled={twoFA}
              onClick={() =>
                setTwoFA(!twoFA)
              }
            />

            <button style={secondaryBtn}>
              <KeyRound size={16} />
              Change Password
            </button>

            <button style={secondaryBtn}>
              View Login Devices
            </button>
          </div>

          {/* Notifications */}
          <div style={card}>
            <h3
              style={{
                marginTop: 0,
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <Bell size={18} />
              Notifications
            </h3>

            <ToggleRow
              label="Email Notifications"
              enabled={notifications}
              onClick={() =>
                setNotifications(
                  !notifications
                )
              }
            />

            <ToggleRow
              label="Push Notifications"
              enabled={true}
              onClick={() => {}}
            />
          </div>

          {/* Preferences */}
          <div style={card}>
            <h3
              style={{
                marginTop: 0,
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <Globe size={18} />
              Preferences
            </h3>

            <ToggleRow
              label="Dark Mode"
              enabled={darkMode}
              onClick={() =>
                setDarkMode(!darkMode)
              }
            />

            <button style={secondaryBtn}>
              <Moon size={16} />
              Theme Options
            </button>

            <button style={secondaryBtn}>
              Language: English
            </button>
          </div>
        </div>

        {/* Save */}
        <div style={{ marginTop: 26 }}>
          <button style={saveBtn}>
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </main>
    </div>
  );
}

function ToggleRow({
  label,
  enabled,
  onClick,
}: {
  label: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <div
      style={{
        marginBottom: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>{label}</span>

      <button
        onClick={onClick}
        style={{
          width: 54,
          height: 30,
          borderRadius: 999,
          border: "none",
          background: enabled
            ? "#3b82f6"
            : "rgba(255,255,255,.1)",
          position: "relative",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 4,
            left: enabled ? 28 : 4,
            width: 22,
            height: 22,
            borderRadius: 999,
            background: "#fff",
            transition: ".2s",
          }}
        />
      </button>
    </div>
  );
}

const input = {
  width: "100%",
  height: 48,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.06)",
  background: "rgba(255,255,255,.03)",
  color: "#fff",
  padding: "0 14px",
  outline: "none",
  marginBottom: 14,
};

const secondaryBtn = {
  width: "100%",
  height: 46,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.06)",
  background: "rgba(255,255,255,.03)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  marginBottom: 12,
  cursor: "pointer",
};

const saveBtn = {
  height: 48,
  padding: "0 22px",
  borderRadius: 14,
  border: "none",
  background:
    "linear-gradient(135deg,#3b82f6,#4f46e5)",
  color: "#fff",
  fontWeight: 800,
  display: "flex",
  alignItems: "center",
  gap: 10,
  cursor: "pointer",
};
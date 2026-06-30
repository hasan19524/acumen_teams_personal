// app/dashboard/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  User,
  Shield,
  Bell,
  Globe,
  Save,
  KeyRound,
  Moon,
  LogOut,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { LeaveWorkspace } from "@/components/LeaveWorkspace";
import { useAuth } from "@/hooks/useAuth";

// ── Design Tokens ─────────────────────────────────────────────────────
const tk = {
  bg: "#020617",
  surface: "rgba(15,23,42,0.8)",
  surfaceHover: "rgba(30,41,59,0.8)",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.14)",
  text: "#f1f5f9",
  textSecondary: "#94a3b8",
  textTer: "#64748b",
  accent: "#3b82f6",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
};

export default function SettingsPage() {
  const { isIndependent } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [twoFA, setTwoFA] = useState(false);

  useEffect(() => {
    apiFetch("/api/accounts/me/")
      .then((r) => r.json())
      .then((data) => {
        setName(data.full_name || data.username || "");
        setEmail(data.email || "");
        setCompany(data.company_name || "");
        setLoading(false);
      })
      .catch(() => {
        setName(localStorage.getItem("username") || "");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/accounts/me/update/", {
        method: "PATCH",
        body: JSON.stringify({ full_name: name, email, company_name: company }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error("Failed to save", e);
    }
    setSaving(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "8px",
    border: `1px solid ${tk.border}`,
    background: tk.bg,
    color: tk.text,
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
    marginBottom: "12px",
  };

  const secondaryBtn: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: `1px solid ${tk.border}`,
    background: "transparent",
    color: tk.textSecondary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: tk.bg,
        color: tk.text,
        fontFamily: "'Inter', sans-serif",
        padding: "32px 40px",
      }}
    >
      {/* HEADER */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: 700,
            letterSpacing: "-0.5px",
          }}
        >
          Settings
        </h1>
        <p
          style={{
            margin: "8px 0 0",
            color: tk.textSecondary,
            fontSize: "15px",
          }}
        >
          Manage workspace preferences, profile and security.
        </p>
      </div>

      {loading ? (
        <div style={{ color: tk.textTer, fontSize: "14px" }}>
          Loading your profile...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            maxWidth: "900px",
          }}
        >
          {/* Profile */}
          <div
            style={{
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "20px",
                fontSize: "16px",
                fontWeight: 700,
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <User size={18} color={tk.accent} /> Profile Settings
            </h3>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: tk.textTer,
                textTransform: "uppercase",
              }}
            >
              Full Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
            <label
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: tk.textTer,
                textTransform: "uppercase",
              }}
            >
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              type="email"
            />
            <label
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: tk.textTer,
                textTransform: "uppercase",
              }}
            >
              Company Name
            </label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Security */}
          <div
            style={{
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "20px",
                fontSize: "16px",
                fontWeight: 700,
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <Shield size={18} color={tk.success} /> Security
            </h3>
            <ToggleRow
              label="Two Factor Authentication"
              enabled={twoFA}
              onClick={() => setTwoFA(!twoFA)}
            />
            <button style={secondaryBtn}>
              <KeyRound size={16} /> Change Password
            </button>
            <button style={secondaryBtn}>View Login Devices</button>
          </div>

          {/* Notifications */}
          <div
            style={{
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "20px",
                fontSize: "16px",
                fontWeight: 700,
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <Bell size={18} color={tk.warning} /> Notifications
            </h3>
            <ToggleRow
              label="Email Notifications"
              enabled={notifications}
              onClick={() => setNotifications(!notifications)}
            />
            <ToggleRow
              label="Push Notifications"
              enabled={true}
              onClick={() => {}}
            />
          </div>

          {/* Preferences */}
          <div
            style={{
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "20px",
                fontSize: "16px",
                fontWeight: 700,
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <Globe size={18} color={tk.textSecondary} /> Preferences
            </h3>
            <ToggleRow
              label="Dark Mode"
              enabled={darkMode}
              onClick={() => setDarkMode(!darkMode)}
            />
            <button style={secondaryBtn}>
              <Moon size={16} /> Theme Options
            </button>
            <button style={secondaryBtn}>Language: English</button>
          </div>

          {/* Actions */}
          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              gap: "12px",
              marginTop: "8px",
            }}
          >
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                height: "40px",
                padding: "0 20px",
                borderRadius: "8px",
                border: "none",
                background: saved ? tk.success : tk.accent,
                color: "#fff",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Save size={16} />{" "}
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
            </button>
            <button
              onClick={() => logout()}
              style={{
                height: "40px",
                padding: "0 20px",
                borderRadius: "8px",
                border: `1px solid rgba(239,68,68,0.3)`,
                background: "transparent",
                color: tk.danger,
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>

          {/* Danger Zone - Leave Workspace (Only show if in a workspace) */}
          {!isIndependent && (
            <div style={{ gridColumn: "1 / -1", marginTop: "20px" }}>
              <LeaveWorkspace />
            </div>
          )}
        </div>
      )}
    </main>
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
        marginBottom: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
      }}
    >
      <span style={{ fontSize: "14px", color: "#f1f5f9" }}>{label}</span>
      <button
        onClick={onClick}
        style={{
          width: "40px",
          height: "22px",
          borderRadius: "11px",
          border: "none",
          background: enabled ? tk.accent : tk.border,
          position: "relative",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "3px",
            left: enabled ? "21px" : "3px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
          }}
        />
      </button>
    </div>
  );
}
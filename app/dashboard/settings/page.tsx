"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import DashboardSidebar from "@/components/DashboardSidebar";
import { logout } from "@/lib/auth";

export default function SettingsPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [twoFA, setTwoFA] = useState(false);

  // Fetch logged-in user data on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    fetch("http://127.0.0.1:8000/api/accounts/me/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setName(data.full_name || data.username || "");
        setEmail(data.email || "");
        setCompany(data.company_name || "");
        setLoading(false);
      })
      .catch(() => {
        // fallback: read from localStorage
        setName(localStorage.getItem("username") || "");
        setLoading(false);
      });
  }, [router]);

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    setSaving(true);
    try {
      await fetch("http://127.0.0.1:8000/api/accounts/me/update/", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ full_name: name, email, company_name: company }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // silent fail for now
    }
    setSaving(false);
  };

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,.025)",
    border: "1px solid rgba(255,255,255,.05)",
    borderRadius: 22,
    padding: 22,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 48,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.06)",
    background: "rgba(255,255,255,.03)",
    color: "#fff",
    padding: "0 14px",
    outline: "none",
    marginBottom: 14,
    fontSize: 15,
    boxSizing: "border-box",
  };

  const secondaryBtn: React.CSSProperties = {
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
    fontSize: 14,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(180deg,#020617,#020b22)",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* SHARED SIDEBAR */}
      <DashboardSidebar />

      {/* Main — same UI as before */}
      <main style={{ flex: 1, padding: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 46, fontWeight: 800 }}>Settings</h1>
          <p style={{ color: "rgba(255,255,255,.65)", marginTop: 8 }}>
            Manage workspace preferences, profile and security
          </p>
        </div>

        {loading ? (
          <p style={{ marginTop: 40, color: "rgba(255,255,255,.4)" }}>
            Loading your profile...
          </p>
        ) : (
          <>
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
                  <User size={18} /> Profile Settings
                </h3>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  placeholder="Full Name"
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  placeholder="Email"
                  type="email"
                />
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  style={inputStyle}
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
                  <Shield size={18} /> Security
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
              <div style={card}>
                <h3
                  style={{
                    marginTop: 0,
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <Bell size={18} /> Notifications
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
              <div style={card}>
                <h3
                  style={{
                    marginTop: 0,
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <Globe size={18} /> Preferences
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
            </div>

            <div style={{ marginTop: 26, display: "flex", gap: 16 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  height: 48,
                  padding: "0 22px",
                  borderRadius: 14,
                  border: "none",
                  background: saved
                    ? "#10b981"
                    : "linear-gradient(135deg,#3b82f6,#4f46e5)",
                  color: "#fff",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  fontSize: 15,
                  transition: "background .3s",
                }}
              >
                <Save size={18} />
                {saving ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
              </button>

              <button
                onClick={() => logout()}
                style={{
                  height: 48,
                  padding: "0 22px",
                  borderRadius: 12,
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 15,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </>
        )}
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
          background: enabled ? "#3b82f6" : "rgba(255,255,255,.1)",
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

// app/dashboard/attendance/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogIn, LogOut as LogOutIcon, Calendar } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getWorkspaceId } from "@/lib/auth";

type AttendanceItem = {
  date: string;
  check_in: string | null;
  check_out: string | null;
  duration_hours: number | null;
  is_today: boolean;
};

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

export default function AttendancePage() {
  const router = useRouter();
  const [history, setHistory] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [todayIn, setTodayIn] = useState<string | null>(null);
  const [timer, setTimer] = useState("0h 0m");
  const [todayDuration, setTodayDuration] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000); // Auto-hide after 3 seconds
  };

  const formatDuration = (hours: number | null) => {
    if (hours == null) return "--";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0 && m === 0) return "0h 0m";
    if (m === 0) return `${h}h`;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchHistory();
  }, [router]);

  useEffect(() => {
    if (!todayIn) return;
    const interval = setInterval(() => {
      const diff = new Date().getTime() - new Date(todayIn).getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimer(`${hours}h ${mins}m`);
    }, 1000);
    return () => clearInterval(interval);
  }, [todayIn]);

  const fetchHistory = async () => {
    const wsId = getWorkspaceId();
    try {
      const res = await apiFetch(`/api/attendance/${wsId}/me/`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
        const todayRecord = data.find((r: AttendanceItem) => r.is_today);
        if (todayRecord) {
          if (todayRecord.check_in && !todayRecord.check_out) {
            setTodayIn(todayRecord.check_in);
          }
          if (todayRecord.duration_hours != null) {
            setTodayDuration(todayRecord.duration_hours);
          }
        }
      } else {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    }
  };

  const handleCheckIn = async () => {
    const wsId = getWorkspaceId();
    setLoading(true);
    try {
      const res = await apiFetch(`/api/attendance/${wsId}/checkin/`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) showToast(data.error || "Failed to check in", "error");
      else showToast(data.message);
    } catch {
      showToast("Network error", "error");
    }
    setLoading(false);
    fetchHistory();
  };

  const handleCheckOut = async () => {
    const wsId = getWorkspaceId();
    setLoading(true);
    try {
      const res = await apiFetch(`/api/attendance/${wsId}/checkout/`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) showToast(data.error || "Failed to check out", "error");
      else showToast(data.message);
    } catch {
      showToast("Network error", "error");
    }
    setLoading(false);
    setTodayIn(null);
    setTimer("0h 0m");
    fetchHistory();
  };

  const checkedOutToday = history.find((r) => r.is_today)?.check_out != null;

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
          Attendance
        </h1>
        <p
          style={{
            margin: "8px 0 0",
            color: tk.textSecondary,
            fontSize: "15px",
          }}
        >
          Track your work hours and daily activity.
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            background: tk.surface,
            border: `1px solid ${tk.border}`,
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <span
              style={{ color: tk.textTer, fontSize: "13px", fontWeight: 500 }}
            >
              Today Status
            </span>
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: todayIn
                ? tk.success
                : checkedOutToday
                  ? tk.accent
                  : tk.text,
            }}
          >
            {todayIn ? "Present" : checkedOutToday ? "Completed" : "Not In"}
          </div>
        </div>
        <div
          style={{
            background: tk.surface,
            border: `1px solid ${tk.border}`,
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <span
              style={{ color: tk.textTer, fontSize: "13px", fontWeight: 500 }}
            >
              Check In
            </span>
            <Clock size={18} style={{ color: tk.accent, opacity: 0.8 }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700 }}>
            {todayIn
              ? new Date(todayIn).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : checkedOutToday && history.find((r) => r.is_today)?.check_in
                ? new Date(
                    history.find((r) => r.is_today)!.check_in!,
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--:--"}
          </div>
        </div>
        <div
          style={{
            background: tk.surface,
            border: `1px solid ${tk.border}`,
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <span
              style={{ color: tk.textTer, fontSize: "13px", fontWeight: 500 }}
            >
              Active Hours
            </span>
            <Clock size={18} style={{ color: tk.success, opacity: 0.8 }} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 700 }}>
            {todayIn
              ? timer
              : todayDuration != null
                ? formatDuration(todayDuration)
                : "0h 0m"}
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "40px" }}>
        <button
          disabled={loading || !!todayIn || checkedOutToday}
          onClick={handleCheckIn}
          style={{
            height: "40px",
            padding: "0 18px",
            borderRadius: "8px",
            border: "none",
            background: "#fff",
            color: "#000",
            fontWeight: 600,
            fontSize: "14px",
            cursor:
              loading || !!todayIn || checkedOutToday
                ? "not-allowed"
                : "pointer",
            opacity: loading || !!todayIn || checkedOutToday ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <LogIn size={16} /> Clock In
        </button>
        <button
          disabled={loading || !todayIn}
          onClick={handleCheckOut}
          style={{
            height: "40px",
            padding: "0 18px",
            borderRadius: "8px",
            border: `1px solid ${tk.borderHover}`,
            background: "transparent",
            color: tk.text,
            fontWeight: 600,
            fontSize: "14px",
            cursor: loading || !todayIn ? "not-allowed" : "pointer",
            opacity: loading || !todayIn ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <LogOutIcon size={16} /> Clock Out
        </button>
      </div>

      {/* HISTORY */}
      <div
        style={{
          background: tk.surface,
          border: `1px solid ${tk.border}`,
          borderRadius: "16px",
          padding: "24px",
        }}
      >
        <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: 700 }}>
          Recent History
        </h3>
        <div style={{ display: "grid", gap: "8px" }}>
          {Array.isArray(history) && history.length > 0 ? (
            history.map((item, i) => (
              <div
                key={item.date ?? `item-${i}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  padding: "16px",
                  background: tk.bg,
                  borderRadius: "12px",
                  border: `1px solid ${tk.border}`,
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: tk.textSecondary,
                    fontSize: "14px",
                  }}
                >
                  <Calendar size={16} />{" "}
                  {new Date(item.date).toLocaleDateString()}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: tk.textSecondary,
                    fontSize: "14px",
                  }}
                >
                  <LogIn size={16} color={tk.textTer} />{" "}
                  {item.check_in
                    ? new Date(item.check_in).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--"}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: tk.textSecondary,
                    fontSize: "14px",
                  }}
                >
                  <LogOutIcon size={16} color={tk.textTer} />{" "}
                  {item.check_out
                    ? new Date(item.check_out).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--"}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: item.duration_hours != null ? tk.accent : tk.textTer,
                    fontWeight: item.duration_hours != null ? 600 : 400,
                    fontSize: "14px",
                    justifyContent: "flex-end",
                  }}
                >
                  {formatDuration(item.duration_hours)}
                </span>
              </div>
            ))
          ) : (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: tk.textTer,
              }}
            >
              No records found.
            </div>
          )}
        </div>
      </div>
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            background:
              toast.type === "error"
                ? "rgba(239,68,68,0.15)"
                : "rgba(16,185,129,0.15)",
            border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
            color: toast.type === "error" ? "#ef4444" : "#10b981",
            padding: "12px 24px",
            borderRadius: "12px",
            fontWeight: 600,
            fontSize: "14px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            zIndex: 1000,
            animation: "fadeInUp 0.3s ease-out",
          }}
        >
          <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
          {toast.msg}
        </div>
      )}
    </main>
  );
}

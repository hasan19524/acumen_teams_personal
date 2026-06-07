"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogIn, LogOut as LogOutIcon, Calendar } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

type AttendanceItem = {
  date: string;
  check_in: string | null;
  check_out: string | null;
  duration_hours: number | null;
  is_today: boolean;
};

export default function AttendancePage() {
  const router = useRouter();
  const [history, setHistory] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [todayIn, setTodayIn] = useState<string | null>(null);
  const [timer, setTimer] = useState("0h 0m");
  const [todayDuration, setTodayDuration] = useState<number | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
      router.push("/");
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
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiUrl}/api/attendance/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/attendance/checkin/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      alert(data.message || data.error);
    } catch {
      alert("Network error");
    }
    setLoading(false);
    fetchHistory();
  };

  const handleCheckOut = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/attendance/checkout/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      alert(data.message || data.error);
    } catch {
      alert("Network error");
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
        display: "flex",
        backgroundColor: "#0b0e14",
        color: "#fff",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap');
        .sora { font-family: 'Sora', sans-serif; }
        .att-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 24px; }
      `}</style>

      <DashboardSidebar />

      <section style={{ flex: 1, padding: "40px 48px", overflowY: "auto" }}>
        <h1 className="sora" style={{ fontSize: 32, marginBottom: 32 }}>
          Attendance
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            marginBottom: 32,
          }}
        >
          <div className="att-card">
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>
              Today Status
            </p>
            <h2
              className="sora"
              style={{
                color: todayIn
                  ? "#22c55e"
                  : checkedOutToday
                    ? "#6366f1"
                    : "#fff",
                margin: 0,
              }}
            >
              {todayIn ? "Present" : checkedOutToday ? "Completed" : "Not In"}
            </h2>
          </div>
          <div className="att-card">
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>
              Check In
            </p>
            <h2 className="sora" style={{ margin: 0 }}>
              {todayIn
                ? new Date(todayIn).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : checkedOutToday
                  ? history.find((r) => r.is_today)?.check_in
                    ? new Date(
                        history.find((r) => r.is_today)!.check_in!,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--"
                  : "--:--"}
            </h2>
          </div>
          <div className="att-card">
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>
              Active Hours
            </p>
            <h2 className="sora" style={{ margin: 0 }}>
              {todayIn
                ? timer
                : todayDuration != null
                  ? formatDuration(todayDuration)
                  : "0h 0m"}
            </h2>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
          <button
            disabled={loading || !!todayIn || checkedOutToday}
            onClick={handleCheckIn}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              color: "#000",
              border: "none",
              padding: "12px 24px",
              borderRadius: 12,
              fontWeight: 600,
              cursor:
                loading || !!todayIn || checkedOutToday
                  ? "not-allowed"
                  : "pointer",
              opacity: loading || !!todayIn || checkedOutToday ? 0.5 : 1,
            }}
          >
            <LogIn size={18} /> Clock In
          </button>
          <button
            disabled={loading || !todayIn}
            onClick={handleCheckOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              border: "none",
              padding: "12px 24px",
              borderRadius: 12,
              fontWeight: 600,
              cursor: loading || !todayIn ? "not-allowed" : "pointer",
              opacity: loading || !todayIn ? 0.5 : 1,
            }}
          >
            <LogOutIcon size={18} /> Clock Out
          </button>
        </div>

        <div className="att-card">
          <h2 className="sora" style={{ marginBottom: 20, fontSize: 18 }}>
            Recent History
          </h2>
          <div style={{ display: "grid", gap: 12 }}>
            {Array.isArray(history) && history.length > 0 ? (
              history.map((item, i) => (
                <div
                  key={item.date ?? `item-${i}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    padding: "16px",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.03)",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#94a3b8",
                    }}
                  >
                    <Calendar size={16} />{" "}
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Clock size={16} color="#94a3b8" /> In:{" "}
                    {item.check_in
                      ? new Date(item.check_in).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--"}
                  </span>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Clock size={16} color="#94a3b8" /> Out:{" "}
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
                      gap: 8,
                      color:
                        item.duration_hours != null ? "#818cf8" : "#94a3b8",
                      fontWeight: item.duration_hours != null ? 600 : 400,
                    }}
                  >
                    {formatDuration(item.duration_hours)}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ color: "#64748B" }}>No records found.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

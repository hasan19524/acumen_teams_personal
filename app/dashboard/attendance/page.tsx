"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  CalendarCheck, 
  CheckSquare, 
  MessageSquare, 
  LogOut, 
  Clock, 
  LogIn, 
  LogOut as LogOutIcon, 
  Calendar 
} from "lucide-react";

type AttendanceItem = {
  date: string;
  check_in: string | null;
  check_out: string | null;
};

export default function AttendancePage() {
  const router = useRouter();

  const [history, setHistory] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [todayIn, setTodayIn] = useState<string | null>(null);
  const [timer, setTimer] = useState("0h 0m");

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
      const start = new Date(todayIn).getTime();
      const now = new Date().getTime();
      const diff = now - start;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimer(`${hours}h ${mins}m`);
    }, 1000);
    return () => clearInterval(interval);
  }, [todayIn]);

  const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/attendance/me/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
        if (data.length > 0 && data[0].check_in && !data[0].check_out) {
          setTodayIn(data[0].check_in);
        }
      } else {
        setHistory([]);
      }
    } catch (error) {
      setHistory([]);
    }
  };

  const handleCheckIn = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    const res = await fetch("http://127.0.0.1:8000/api/attendance/checkin/", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    alert(data.message || data.error);
    setLoading(false);
    fetchHistory();
  };

  const handleCheckOut = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    const res = await fetch("http://127.0.0.1:8000/api/attendance/checkout/", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    alert(data.message || data.error);
    setLoading(false);
    setTodayIn(null);
    setTimer("0h 0m");
    fetchHistory();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    router.push("/login");
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "280px 1fr", backgroundColor: "#0b0e14", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
        .sora { font-family: 'Sora', sans-serif; }
        .sidebar-item:hover { background: rgba(255,255,255,0.05); }
        .card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 24px; }
      `}</style>

      {/* SIDEBAR - Matching Dashboard Color Scheme */}
      <aside style={{ backgroundColor: "#0b0e14", borderRight: "1px solid rgba(255,255,255,0.05)", padding: "32px 20px" }}>
        <h2 className="sora" style={{ color: "#fff", marginBottom: 40, paddingLeft: 12, fontSize: 20 }}>Acumen Teams</h2>
        <div style={{ display: "grid", gap: 8 }}>
          {[
            { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
            { name: "Attendance", href: "/dashboard/attendance", icon: <CalendarCheck size={20} /> },
            { name: "Tasks", href: "/dashboard/tasks", icon: <CheckSquare size={20} /> },
            { name: "Chat", href: "/dashboard/chat", icon: <MessageSquare size={20} /> },
          ].map((item) => (
            <Link key={item.name} href={item.href} className="sidebar-item" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, textDecoration: "none", fontWeight: 500, color: item.name === "Attendance" ? "#fff" : "#94a3b8", background: item.name === "Attendance" ? "rgba(255,255,255,0.05)" : "transparent" }}>
              {item.icon} {item.name}
            </Link>
          ))}
        </div>
        <button onClick={handleLogout} style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 12, border: "none", background: "transparent", color: "#94a3b8", padding: "14px 16px", cursor: "pointer", fontWeight: 500 }}>
          <LogOut size={20} /> Sign Out
        </button>
      </aside>

      {/* CONTENT - Matching Dashboard Color Scheme */}
      <section style={{ padding: "40px 48px", overflowY: "auto" }}>
        <h1 className="sora" style={{ fontSize: 32, marginBottom: 32 }}>Attendance</h1>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
          <div className="card">
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Today Status</p>
            <h2 className="sora" style={{ color: todayIn ? "#22c55e" : "#fff", margin: 0 }}>{todayIn ? "Present" : "Not In"}</h2>
          </div>
          <div className="card">
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Check In</p>
            <h2 className="sora" style={{ margin: 0 }}>{todayIn ? new Date(todayIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}</h2>
          </div>
          <div className="card">
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>Active Hours</p>
            <h2 className="sora" style={{ margin: 0 }}>{timer}</h2>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
          <button disabled={loading || !!todayIn} onClick={handleCheckIn} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", color: "#000", border: "none", padding: "12px 24px", borderRadius: 12, fontWeight: 600, cursor: "pointer" }}>
            <LogIn size={18} /> Clock In
          </button>
          <button disabled={loading || !todayIn} onClick={handleCheckOut} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 12, fontWeight: 600, cursor: "pointer" }}>
            <LogOutIcon size={18} /> Clock Out
          </button>
        </div>

        <div className="card">
          <h2 className="sora" style={{ marginBottom: 20, fontSize: 18 }}>Recent History</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {Array.isArray(history) && history.length > 0 ? history.map((item, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.03)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8" }}><Calendar size={16} /> {new Date(item.date).toLocaleDateString()}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Clock size={16} color="#94a3b8" /> In: {item.check_in ? new Date(item.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Clock size={16} color="#94a3b8" /> Out: {item.check_out ? new Date(item.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}</span>
              </div>
            )) : <p style={{ color: "#64748B" }}>No records found.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
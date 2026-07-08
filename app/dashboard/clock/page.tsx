"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Play,
  Square,
  Clock as ClockIcon,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { tk } from "@/lib/tokens";
import { apiFetch } from "@/lib/api";

export default function PersonalClockPage() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [history, setHistory] = useState<
    Array<{ date: string; total_hours: number; total_seconds: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, histRes] = await Promise.all([
        apiFetch(`/api/accounts/clock-status/`),
        apiFetch(`/api/accounts/clock-history/`),
      ]);

      if (statusRes.ok) {
        const status = await statusRes.json();
        setIsClockedIn(status.is_clocked_in);
        setTodaySeconds(status.total_seconds_today);
      }
      if (histRes.ok) {
        const hist = await histRes.json();
        setHistory(hist.slice(0, 7)); // Last 7 days
      }
    } catch (error) {
      console.error("Failed to fetch clock data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isClockedIn) {
      interval = setInterval(() => {
        setTodaySeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClockedIn]);

  const handleToggleClock = async () => {
    setActionLoading(true);
    try {
      const endpoint = isClockedIn
        ? `/api/accounts/clock-out/`
        : `/api/accounts/clock-in/`;
      const res = await apiFetch(endpoint, { method: "POST" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const errorMsg = data?.error || "Failed to toggle clock";

        // FIX: If state is out of sync, sync it instead of throwing an error.
        if (errorMsg.includes("Already clocked in")) {
          setIsClockedIn(true);
        } else if (errorMsg.includes("Not clocked in")) {
          setIsClockedIn(false);
        } else {
          throw new Error(errorMsg);
        }
      } else {
        // Sync local state immediately on success
        setIsClockedIn(!isClockedIn);
      }

      await fetchData(); // Always refresh data to get accurate seconds
    } catch (error: any) {
      console.error("Clock action failed:", error);
      alert(error.message || "Failed to toggle clock");
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Calculate Average Hours (excluding today if still working)
  const validHistoryDays = history.filter((d) => d.total_seconds > 0);
  const avgSeconds =
    validHistoryDays.length > 0
      ? validHistoryDays.reduce((acc, curr) => acc + curr.total_seconds, 0) /
        validHistoryDays.length
      : 0;

  // Find max hours for graph scaling
  const maxHours = Math.max(...history.map((d) => d.total_hours), 1);

  if (loading) {
    return (
      <main
        style={{
          background: tk.bg,
          color: tk.textPrimary,
          minHeight: "100vh",
          padding: "32px 40px",
        }}
      >
        Loading Clock...
      </main>
    );
  }

  return (
    <main
      className="min-h-screen p-4 md:p-8 lg:p-10"
      style={{
        background: tk.bg,
        color: tk.textPrimary,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold">
            Personal Time Tracker
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: tk.textSecondary }}>
            Track your personal work hours and productivity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column: Timer & Action */}
          <div
            className="md:col-span-1 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center gap-6"
            style={{
              background: tk.surface,
              border: `1px solid ${tk.border}`,
            }}
          >
            <div className="relative w-40 h-40 md:w-44 md:h-44">
              <svg width="100%" height="100%" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={tk.border}
                  strokeWidth="5"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={isClockedIn ? tk.success : tk.brand}
                  strokeWidth="5"
                  strokeDasharray="283"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: "stroke 0.3s ease" }}
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div
                  className="text-xs uppercase tracking-wide"
                  style={{ color: tk.textMuted }}
                >
                  {isClockedIn ? "Working" : "Clocked Out"}
                </div>
                <div className="text-xl md:text-2xl font-bold tabular-nums">
                  {formatTime(todaySeconds)}
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleClock}
              disabled={actionLoading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                border: "none",
                background: isClockedIn ? tk.danger : tk.success,
                color: "#fff",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: actionLoading ? 0.7 : 1,
              }}
            >
              {isClockedIn ? <Square size={18} /> : <Play size={18} />}
              {isClockedIn ? "Clock Out" : "Clock In"}
            </button>
          </div>

          {/* Right Column: Stats & Graph */}
          <div className="md:col-span-2 flex flex-col gap-6 md:gap-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div
                className="rounded-xl p-4 md:p-5"
                style={{
                  background: tk.surface,
                  border: `1px solid ${tk.border}`,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} color={tk.brand} />
                  <span
                    className="text-xs uppercase tracking-wide"
                    style={{ color: tk.textMuted }}
                  >
                    Avg / Day
                  </span>
                </div>
                <div className="text-xl md:text-2xl font-bold">
                  {formatTime(avgSeconds).split(":")[0]}h{" "}
                  {formatTime(avgSeconds).split(":")[1]}m
                </div>
              </div>
              <div
                className="rounded-xl p-4 md:p-5"
                style={{
                  background: tk.surface,
                  border: `1px solid ${tk.border}`,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={16} color={tk.success} />
                  <span
                    className="text-xs uppercase tracking-wide"
                    style={{ color: tk.textMuted }}
                  >
                    Days Worked
                  </span>
                </div>
                <div className="text-xl md:text-2xl font-bold">
                  {validHistoryDays.length}
                </div>
              </div>
            </div>

            {/* History Graph */}
            <div
              className="rounded-xl p-4 md:p-6 flex-1"
              style={{
                background: tk.surface,
                border: `1px solid ${tk.border}`,
              }}
            >
              <h3 className="text-base font-bold mb-4 md:mb-5">Last 7 Days</h3>
              <div
                className="flex items-end gap-2 sm:gap-3 h-32 md:h-40 pb-5 md:pb-6 border-b"
                style={{ borderColor: tk.border }}
              >
                {history.length === 0 ? (
                  <div
                    className="w-full text-center text-[13px]"
                    style={{ color: tk.textMuted }}
                  >
                    No history yet.
                  </div>
                ) : (
                  history
                    .slice()
                    .reverse()
                    .map((day, i) => (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2 h-full justify-end"
                      >
                        <div
                          className="text-[10px] font-semibold"
                          style={{ color: tk.textMuted }}
                        >
                          {day.total_hours > 0 ? `${day.total_hours}h` : ""}
                        </div>
                        <div
                          className="w-full max-w-[36px] min-h-[4px] rounded-md transition-all duration-300"
                          style={{
                            height: `${(day.total_hours / maxHours) * 100}%`,
                            background:
                              day.total_hours > 0 ? tk.brand : tk.border,
                          }}
                        />
                        <div
                          className="text-[10px]"
                          style={{ color: tk.textMuted }}
                        >
                          {new Date(day.date).toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

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
import { workspaceService } from "@/features/workspace/workspaceService";

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
      const [status, hist] = await Promise.all([
        workspaceService.getClockStatus(),
        workspaceService.getClockHistory(),
      ]);
      setIsClockedIn(status.is_clocked_in);
      setTodaySeconds(status.total_seconds_today);
      setHistory(hist.slice(0, 7)); // Last 7 days
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
      if (isClockedIn) {
        await workspaceService.clockOut();
        setIsClockedIn(false);
      } else {
        await workspaceService.clockIn();
        setIsClockedIn(true);
      }
      await fetchData(); // Refresh data
    } catch (error) {
      console.error("Clock action failed:", error);
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
      style={{
        minHeight: "100vh",
        background: tk.bg,
        color: tk.textPrimary,
        fontFamily: "'Inter', sans-serif",
        padding: "32px 40px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>
            Personal Time Tracker
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              color: tk.textSecondary,
              fontSize: "14px",
            }}
          >
            Track your personal work hours and productivity.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: "24px",
          }}
        >
          {/* Left Column: Timer & Action */}
          <div
            style={{
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: "16px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "24px",
            }}
          >
            <div
              style={{ position: "relative", width: "180px", height: "180px" }}
            >
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
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: tk.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {isClockedIn ? "Working" : "Clocked Out"}
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
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
                background: isClockedIn ? "#ef4444" : "#10b981",
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
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {/* Stat Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div
                style={{
                  background: tk.surface,
                  border: `1px solid ${tk.border}`,
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <TrendingUp size={16} color={tk.brand} />
                  <span
                    style={{
                      fontSize: "12px",
                      color: tk.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Avg / Day
                  </span>
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700 }}>
                  {formatTime(avgSeconds).split(":")[0]}h{" "}
                  {formatTime(avgSeconds).split(":")[1]}m
                </div>
              </div>
              <div
                style={{
                  background: tk.surface,
                  border: `1px solid ${tk.border}`,
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <Calendar size={16} color={tk.success} />
                  <span
                    style={{
                      fontSize: "12px",
                      color: tk.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Days Worked
                  </span>
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700 }}>
                  {validHistoryDays.length}
                </div>
              </div>
            </div>

            {/* History Graph */}
            <div
              style={{
                background: tk.surface,
                border: `1px solid ${tk.border}`,
                borderRadius: "12px",
                padding: "24px",
                flex: 1,
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px",
                  fontSize: "16px",
                  fontWeight: 700,
                }}
              >
                Last 7 Days
              </h3>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "12px",
                  height: "160px",
                  paddingBottom: "24px",
                  borderBottom: `1px solid ${tk.border}`,
                }}
              >
                {history.length === 0 ? (
                  <div
                    style={{
                      width: "100%",
                      textAlign: "center",
                      color: tk.textMuted,
                      fontSize: "13px",
                    }}
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
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "8px",
                          height: "100%",
                          justifyContent: "flex-end",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            color: tk.textMuted,
                            fontWeight: 600,
                          }}
                        >
                          {day.total_hours > 0 ? `${day.total_hours}h` : ""}
                        </div>
                        <div
                          style={{
                            width: "100%",
                            maxWidth: "40px",
                            height: `${(day.total_hours / maxHours) * 100}%`,
                            minHeight: "4px",
                            background:
                              day.total_hours > 0 ? tk.brand : tk.border,
                            borderRadius: "6px",
                            transition: "height 0.3s ease",
                          }}
                        />
                        <div style={{ fontSize: "10px", color: tk.textMuted }}>
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

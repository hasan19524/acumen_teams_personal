// app/dashboard/attendance/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { workspaceService } from "@/features/workspace/workspaceService";
import {
  Clock,
  LogIn,
  LogOut as LogOutIcon,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Users,
  Settings,
  X,
  Save,
} from "lucide-react";

// Acumen Design System Tokens
const tk = {
  bg: "#081325",
  surface: "#172440",
  surfaceHover: "#20304E",
  border: "#2A3A5C",
  textPrimary: "#FFFFFF",
  textSecondary: "#B7C0D8",
  textMuted: "#7A86A7",
  brand: "#4B1587",
  brandLight: "#5DADE2",
  success: "#1FA463",
  warning: "#F5B041",
  primary: "#E31E24",
};

type AttendanceItem = {
  date: string;
  check_in: string | null;
  check_out: string | null;
  duration_hours: number | null;
  status: string;
  is_today: boolean;
};

type TeamMemberAtt = {
  user_id: number;
  username: string;
  full_name: string;
  status: string;
  check_in: string | null;
};

type TeamAtt = {
  team_id: number;
  team_name: string;
  total_members: number;
  present_count: number;
  absent_count: number;
  present_percentage: number;
  members: TeamMemberAtt[];
};

const statusConfig: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  present: { color: tk.success, bg: "rgba(31,164,99,0.1)", label: "Present" },
  late: {
    color: tk.warning,
    bg: "rgba(245,176,65,0.1)",
    label: "Late Arrival",
  },
  half_day: {
    color: tk.brandLight,
    bg: "rgba(93,173,226,0.1)",
    label: "Half Day",
  },
  absent: { color: tk.textMuted, bg: "rgba(122,134,167,0.1)", label: "Absent" },
  leave: { color: tk.warning, bg: "rgba(245,176,65,0.1)", label: "On Leave" },
  holiday: {
    color: tk.textMuted,
    bg: "rgba(122,134,167,0.05)",
    label: "Holiday",
  },
  weekend: {
    color: tk.textMuted,
    bg: "rgba(122,134,167,0.05)",
    label: "Weekend",
  },
};

export default function AttendancePage() {
  const router = useRouter();
  const [role, setRole] = useState("member");
  const [history, setHistory] = useState<AttendanceItem[]>([]);
  const [percentage, setPercentage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [todayIn, setTodayIn] = useState<string | null>(null);
  const [timer, setTimer] = useState("0h 0m");
  const [todayDuration, setTodayDuration] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Manager State
  const [activeTab, setActiveTab] = useState("personal");
  const [teamData, setTeamData] = useState<TeamAtt[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamAtt | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState({
    shift_start: "09:00",
    shift_end: "18:00",
    grace_period_minutes: 15,
    working_days: ["0", "1", "2", "3", "4"],
  });

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
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

  const fetchPersonal = useCallback(async () => {
    try {
      const data = await workspaceService.getMyAttendance();
      setPercentage(data.attendance_percentage || 0);
      const records = data.records || [];
      setHistory(records);

      const todayRecord = records.find((r: AttendanceItem) => r.is_today);
      if (todayRecord) {
        if (todayRecord.check_in && !todayRecord.check_out) {
          setTodayIn(todayRecord.check_in);
        } else {
          setTodayIn(null);
        }

        if (todayRecord.duration_hours != null) {
          setTodayDuration(todayRecord.duration_hours);
        } else {
          setTodayDuration(null);
        }
      } else {
        setTodayIn(null);
        setTodayDuration(null);
      }
    } catch (err) {
      console.error("Failed to fetch attendance", err);
    }
  }, []);

  const fetchTeam = useCallback(async () => {
    try {
      const data = await workspaceService.getTeamAttendance();
      setTeamData(data.teams || []);
    } catch (err) {
      console.error("Failed to fetch team attendance", err);
    }
  }, []);

  useEffect(() => {
    workspaceService
      .getStats()
      .then((stats) => setRole(stats?.role || "member"))
      .catch(() => {});
    fetchPersonal();
  }, [fetchPersonal]);

  useEffect(() => {
    if (
      activeTab === "team" &&
      role &&
      role !== "member" &&
      teamData.length === 0
    ) {
      fetchTeam();
    }
  }, [activeTab, role, fetchTeam, teamData.length]);

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

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const data = await workspaceService.checkIn();
      showToast(data.message || "Checked in successfully");
      fetchPersonal();
    } catch (err: any) {
      showToast(err.message || "Failed to check in", "error");
    }
    setLoading(false);
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const data = await workspaceService.checkOut();
      showToast(data.message || "Checked out successfully");
      setTodayIn(null);
      setTimer("0h 0m");
      fetchPersonal();
    } catch (err: any) {
      showToast(err.message || "Failed to check out", "error");
    }
    setLoading(false);
  };

  const handleSaveConfig = async () => {
    try {
      await workspaceService.updateAttendanceConfig({
        ...config,
        working_days: config.working_days.join(","),
      });
      showToast("Configuration updated");
      setShowConfig(false);
    } catch {
      showToast("Failed to update config", "error");
    }
  };

  const checkedOutToday = history.find((r) => r.is_today)?.check_out != null;
  const todayStatus = history.find((r) => r.is_today)?.status || "absent";
  const isManager = role === "leader" || role === "admin" || role === "owner";

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
      <style>{`
        .ac-hover { transition: all 0.15s ease; }
        .ac-hover:hover { background: ${tk.surfaceHover} !important; border-color: ${tk.border} !important; }
        .ac-btn { transition: all 0.15s ease; cursor: pointer; }
        .ac-btn:hover { filter: brightness(1.1); }
        .ac-input { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid ${tk.border}; background: ${tk.bg}; color: ${tk.textPrimary}; font-size: 14px; outline: none; font-family: inherit; }
        .fade-in { animation: acFadeIn 0.2s ease-out; }
        @keyframes acFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>
            Attendance
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              color: tk.textSecondary,
              fontSize: "14px",
            }}
          >
            Track your work hours and team activity.
          </p>
        </div>
        {isManager && (
          <div
            style={{
              display: "flex",
              gap: 8,
              background: tk.surface,
              padding: 4,
              borderRadius: 10,
              border: `1px solid ${tk.border}`,
            }}
          >
            <button
              onClick={() => setActiveTab("personal")}
              style={{
                background: activeTab === "personal" ? tk.brand : "transparent",
                color: activeTab === "personal" ? "#fff" : tk.textSecondary,
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Personal
            </button>
            <button
              onClick={() => setActiveTab("team")}
              style={{
                background: activeTab === "team" ? tk.brand : "transparent",
                color: activeTab === "team" ? "#fff" : tk.textSecondary,
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Team
            </button>
            <button
              onClick={() => setShowConfig(true)}
              style={{
                background: "transparent",
                color: tk.textSecondary,
                border: "none",
                padding: "8px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              <Settings size={16} />
            </button>
          </div>
        )}
      </div>

      {/* PERSONAL VIEW */}
      {activeTab === "personal" && (
        <div className="fade-in">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
              marginBottom: "32px",
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
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    color: tk.textMuted,
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  TODAY STATUS
                </span>
                {todayIn ? (
                  <CheckCircle2 size={16} color={tk.success} />
                ) : checkedOutToday ? (
                  <CheckCircle2 size={16} color={tk.brandLight} />
                ) : (
                  <AlertCircle size={16} color={tk.textMuted} />
                )}
              </div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: todayIn
                    ? tk.success
                    : checkedOutToday
                      ? tk.brandLight
                      : tk.textPrimary,
                }}
              >
                {todayStatus
                  ? statusConfig[todayStatus]?.label || "Not In"
                  : "Not In"}
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
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    color: tk.textMuted,
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  CHECK IN
                </span>
                <LogIn size={16} color={tk.brandLight} />
              </div>
              <div style={{ fontSize: "22px", fontWeight: 700 }}>
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
                borderRadius: "12px",
                padding: "20px",
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
                  style={{
                    color: tk.textMuted,
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  ACTIVE HOURS
                </span>
                <Clock size={16} color={tk.success} />
              </div>
              <div style={{ fontSize: "22px", fontWeight: 700 }}>
                {todayIn
                  ? timer
                  : todayDuration != null
                    ? formatDuration(todayDuration)
                    : "0h 0m"}
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
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    color: tk.textMuted,
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  MONTHLY %
                </span>
                <Calendar size={16} color={tk.warning} />
              </div>
              <div
                style={{ fontSize: "22px", fontWeight: 700, color: tk.warning }}
              >
                {percentage}%
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "40px" }}>
            <button
              className="ac-btn"
              disabled={loading || !!todayIn || checkedOutToday}
              onClick={handleCheckIn}
              style={{
                height: "40px",
                padding: "0 20px",
                borderRadius: "8px",
                border: "none",
                background: tk.brand,
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                opacity: loading || !!todayIn || checkedOutToday ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <LogIn size={16} /> Clock In
            </button>
            <button
              className="ac-btn"
              disabled={loading || !todayIn}
              onClick={handleCheckOut}
              style={{
                height: "40px",
                padding: "0 20px",
                borderRadius: "8px",
                border: `1px solid ${tk.border}`,
                background: "transparent",
                color: tk.textPrimary,
                fontWeight: 600,
                fontSize: 14,
                opacity: loading || !todayIn ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <LogOutIcon size={16} /> Clock Out
            </button>
          </div>

          <div
            style={{
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <h3
              style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: 700 }}
            >
              Recent History
            </h3>
            <div style={{ display: "grid", gap: "8px" }}>
              {history.length > 0 ? (
                history.map((item, i) => {
                  const s = statusConfig[item.status] || statusConfig.absent;
                  return (
                    <div
                      key={item.date ?? `item-${i}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr 1fr 0.5fr",
                        padding: "14px 16px",
                        background: tk.bg,
                        borderRadius: "8px",
                        border: `1px solid ${tk.border}`,
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          color: tk.textSecondary,
                          fontSize: "13px",
                        }}
                      >
                        <Calendar size={14} color={tk.textMuted} />{" "}
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          color: tk.textSecondary,
                          fontSize: "13px",
                        }}
                      >
                        <LogIn size={14} color={tk.textMuted} />{" "}
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
                          gap: 8,
                          color: tk.textSecondary,
                          fontSize: "13px",
                        }}
                      >
                        <LogOutIcon size={14} color={tk.textMuted} />{" "}
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
                          color: tk.brandLight,
                          fontWeight: 600,
                          fontSize: "13px",
                        }}
                      >
                        {formatDuration(item.duration_hours)}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          background: s.bg,
                          color: s.color,
                          fontWeight: 600,
                          textTransform: "capitalize",
                          justifySelf: "end",
                        }}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: tk.textMuted,
                  }}
                >
                  No records found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TEAM VIEW */}
      {activeTab === "team" && isManager && (
        <div
          className="fade-in"
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {teamData.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: tk.textMuted,
                background: tk.surface,
                border: `1px solid ${tk.border}`,
                borderRadius: 12,
              }}
            >
              No team attendance data found.
            </div>
          ) : (
            teamData.map((team) => (
              <div
                key={team.team_id}
                onClick={() => setSelectedTeam(team)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: tk.surface,
                  border: `1px solid ${tk.border}`,
                  borderRadius: 12,
                  padding: "20px 24px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = tk.brandLight;
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = tk.border;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: tk.bg,
                      border: `1px solid ${tk.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Users size={20} color={tk.brandLight} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                      {team.team_name}
                    </h3>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 13,
                        color: tk.textMuted,
                      }}
                    >
                      {team.total_members} Members
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: tk.success,
                      }}
                    >
                      {team.present_count}
                    </div>
                    <div style={{ fontSize: 11, color: tk.textMuted }}>
                      Present
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: tk.textMuted,
                      }}
                    >
                      {team.absent_count}
                    </div>
                    <div style={{ fontSize: 11, color: tk.textMuted }}>
                      Absent
                    </div>
                  </div>
                  <div style={{ width: 120, textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: tk.brandLight,
                      }}
                    >
                      {team.present_percentage}%
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: tk.bg,
                        borderRadius: 2,
                        marginTop: 6,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${team.present_percentage}%`,
                          height: "100%",
                          background: tk.success,
                          borderRadius: 2,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TEAM DETAIL DRAWER */}
      {selectedTeam && (
        <>
          <div
            onClick={() => setSelectedTeam(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 40,
            }}
          />
          <aside
            style={{
              position: "fixed",
              right: 0,
              top: 0,
              bottom: 0,
              width: 420,
              background: tk.surface,
              borderLeft: `1px solid ${tk.border}`,
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
              boxShadow: "-12px 0 40px rgba(0,0,0,0.3)",
            }}
          >
            <header
              style={{
                padding: "20px 24px",
                borderBottom: `1px solid ${tk.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  {selectedTeam.team_name}
                </h2>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 13,
                    color: tk.textMuted,
                  }}
                >
                  {selectedTeam.present_count} Present ·{" "}
                  {selectedTeam.absent_count} Absent
                </p>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: tk.textMuted,
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </header>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              {selectedTeam.members.map((m) => {
                const s = statusConfig[m.status] || statusConfig.absent;
                return (
                  <div
                    key={m.user_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "12px",
                      borderRadius: 8,
                      marginBottom: 6,
                      background: tk.bg,
                      border: `1px solid ${tk.border}`,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${tk.brand}, ${tk.brandLight})`,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {m.full_name?.charAt(0) || "?"}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: tk.textPrimary,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {m.full_name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: tk.textMuted,
                          marginTop: 2,
                        }}
                      >
                        {m.check_in
                          ? `Checked in at ${new Date(m.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : "No check-in today"}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: s.bg,
                        color: s.color,
                        fontWeight: 600,
                        textTransform: "capitalize",
                        flexShrink: 0,
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </aside>
        </>
      )}

      {/* CONFIG MODAL */}
      {showConfig && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={() => setShowConfig(false)}
        >
          <div
            className="fade-in"
            style={{
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: "12px",
              width: 480,
              padding: 28,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Attendance Configuration
              </h2>
              <button
                onClick={() => setShowConfig(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: tk.textMuted,
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: tk.textMuted,
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Shift Start
                  </label>
                  <input
                    type="time"
                    className="ac-input"
                    value={config.shift_start}
                    onChange={(e) =>
                      setConfig({ ...config, shift_start: e.target.value })
                    }
                    style={{ colorScheme: "dark" }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: tk.textMuted,
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Shift End
                  </label>
                  <input
                    type="time"
                    className="ac-input"
                    value={config.shift_end}
                    onChange={(e) =>
                      setConfig({ ...config, shift_end: e.target.value })
                    }
                    style={{ colorScheme: "dark" }}
                  />
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: tk.textMuted,
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Grace Period (Minutes)
                </label>
                <input
                  type="number"
                  className="ac-input"
                  value={config.grace_period_minutes}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      grace_period_minutes: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: tk.textMuted,
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Working Days
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["0", "1", "2", "3", "4", "5", "6"].map((d) => {
                    const dayName = [
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                      "Sun",
                    ][parseInt(d)];
                    const isActive = config.working_days.includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() => {
                          const newDays = isActive
                            ? config.working_days.filter((x) => x !== d)
                            : [...config.working_days, d];
                          setConfig({ ...config, working_days: newDays });
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          borderRadius: 6,
                          border: `1px solid ${isActive ? tk.brand : tk.border}`,
                          background: isActive ? tk.brand : "transparent",
                          color: isActive ? "#fff" : tk.textMuted,
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        {dayName}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                className="ac-btn"
                onClick={handleSaveConfig}
                style={{
                  marginTop: 8,
                  background: tk.brand,
                  color: "#fff",
                  border: "none",
                  padding: "12px",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Save size={16} /> Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

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
                ? "rgba(227,30,36,0.15)"
                : "rgba(31,164,99,0.15)",
            border: `1px solid ${toast.type === "error" ? "rgba(227,30,36,0.3)" : "rgba(31,164,99,0.3)"}`,
            color: toast.type === "error" ? tk.primary : tk.success,
            padding: "12px 24px",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "14px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            zIndex: 1000,
          }}
        >
          {toast.msg}
        </div>
      )}
    </main>
  );
}

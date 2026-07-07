// app/dashboard/attendance/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { workspaceService } from "@/features/workspace/workspaceService";
import { useProfileStore } from "@/features/dashboard/store/profileStore";
import Avatar from "@/components/Avatar";
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
  profile_image?: string | null;
  role?: string;
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

  // Global Profile Drawer
  const openProfile = useProfileStore((state) => state.openProfile);

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
    <main className="min-h-full w-full bg-[#081325] text-white font-sans">
      <style>{`
        .ac-hover { transition: all 0.15s ease; }
        .ac-hover:hover { background: ${tk.surfaceHover} !important; border-color: ${tk.border} !important; }
        .ac-btn { transition: all 0.15s ease; cursor: pointer; }
        .ac-btn:hover { filter: brightness(1.1); }
        .ac-input { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid ${tk.border}; background: ${tk.bg}; color: ${tk.textPrimary}; font-size: 14px; outline: none; font-family: inherit; }
        .fade-in { animation: acFadeIn 0.2s ease-out; }
        @keyframes acFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      {/* =========================================
          1. LOCKED TOP SECTION (Sticky)
      ========================================= */}
      <div className="sticky top-0 z-10 p-4 sm:p-6 lg:p-8 pb-4 bg-[#081325] border-b border-[#2A3A5C]/50">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Attendance</h1>
            <p className="text-sm text-[#B7C0D8] mt-1">
              Track your work hours and team activity.
            </p>
          </div>
          {isManager && (
            <div className="flex gap-1 bg-[#172440] p-1 rounded-lg border border-[#2A3A5C]">
              <button
                onClick={() => setActiveTab("personal")}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${activeTab === "personal" ? "bg-[#4B1587] text-white" : "text-[#B7C0D8]"}`}
              >
                Personal
              </button>
              <button
                onClick={() => setActiveTab("team")}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${activeTab === "team" ? "bg-[#4B1587] text-white" : "text-[#B7C0D8]"}`}
              >
                Team
              </button>
              <button
                onClick={() => setShowConfig(true)}
                className="p-2 rounded-md text-[#B7C0D8] hover:text-white"
              >
                <Settings size={16} />
              </button>
            </div>
          )}
        </div>

        {/* PERSONAL VIEW TOP PART */}
        {activeTab === "personal" && (
          <div className="fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-[#172440] border border-[#2A3A5C] rounded-xl p-4 sm:p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] sm:text-xs text-[#7A86A7] font-medium">
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
                  className="text-base sm:text-xl font-bold"
                  style={{
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
              <div className="bg-[#172440] border border-[#2A3A5C] rounded-xl p-4 sm:p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] sm:text-xs text-[#7A86A7] font-medium">
                    CHECK IN
                  </span>
                  <LogIn size={16} color={tk.brandLight} />
                </div>
                <div className="text-base sm:text-xl font-bold">
                  {todayIn
                    ? new Date(todayIn).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : checkedOutToday &&
                        history.find((r) => r.is_today)?.check_in
                      ? new Date(
                          history.find((r) => r.is_today)!.check_in!,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--:--"}
                </div>
              </div>
              <div className="bg-[#172440] border border-[#2A3A5C] rounded-xl p-4 sm:p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] sm:text-xs text-[#7A86A7] font-medium">
                    ACTIVE HOURS
                  </span>
                  <Clock size={16} color={tk.success} />
                </div>
                <div className="text-base sm:text-xl font-bold">
                  {todayIn
                    ? timer
                    : todayDuration != null
                      ? formatDuration(todayDuration)
                      : "0h 0m"}
                </div>
              </div>
              <div className="bg-[#172440] border border-[#2A3A5C] rounded-xl p-4 sm:p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] sm:text-xs text-[#7A86A7] font-medium">
                    MONTHLY %
                  </span>
                  <Calendar size={16} color={tk.warning} />
                </div>
                <div className="text-base sm:text-xl font-bold text-[#F5B041]">
                  {percentage}%
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="ac-btn flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#4B1587] text-white font-semibold text-sm disabled:opacity-50"
                disabled={loading || !!todayIn || checkedOutToday}
                onClick={handleCheckIn}
              >
                <LogIn size={16} /> Clock In
              </button>
              <button
                className="ac-btn flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[#2A3A5C] text-white font-semibold text-sm disabled:opacity-50"
                disabled={loading || !todayIn}
                onClick={handleCheckOut}
              >
                <LogOutIcon size={16} /> Clock Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================
          2. SCROLLABLE LOWER SECTION
      ========================================= */}
      <div className="p-4 sm:p-6 lg:p-8 pt-6">
        {/* PERSONAL VIEW HISTORY */}
        {activeTab === "personal" && (
          <div className="fade-in">
            <div className="bg-[#172440] border border-[#2A3A5C] rounded-xl p-4 sm:p-6">
              <h3 className="text-base font-bold mb-5">Recent History</h3>

              <div className="hidden md:grid grid-cols-5 gap-4 px-4 pb-2 text-xs text-[#7A86A7] font-medium border-b border-[#2A3A5C]">
                <span>Date</span>
                <span>Check In</span>
                <span>Check Out</span>
                <span>Duration</span>
                <span className="text-right">Status</span>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                {history.length > 0 ? (
                  history.map((item, i) => {
                    const s = statusConfig[item.status] || statusConfig.absent;
                    return (
                      <div
                        key={item.date ?? `item-${i}`}
                        className="p-4 bg-[#081325] rounded-lg border border-[#2A3A5C]"
                      >
                        {/* Mobile Layout (Labeled Ticket Style) */}
                        <div className="md:hidden">
                          {/* Top Row: Date & Status */}
                          <div className="flex justify-between items-center pb-3 border-b border-[#2A3A5C] mb-3">
                            <span className="flex items-center gap-2 text-white font-semibold text-sm">
                              <Calendar size={14} color={tk.textMuted} />
                              {new Date(item.date).toLocaleDateString(
                                undefined,
                                {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                },
                              )}
                            </span>
                            <span
                              className="text-[10px] px-2 py-1 rounded-md font-semibold"
                              style={{ background: s.bg, color: s.color }}
                            >
                              {s.label}
                            </span>
                          </div>

                          {/* Middle Row: Check In & Check Out */}
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <LogIn size={16} className="text-[#5DADE2]" />
                              <div>
                                <div className="text-[10px] text-[#7A86A7] uppercase tracking-wider">
                                  Check In
                                </div>
                                <div className="text-sm text-[#B7C0D8] font-medium mt-0.5">
                                  {item.check_in
                                    ? new Date(
                                        item.check_in,
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "--"}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <LogOutIcon
                                size={16}
                                className="text-[#5DADE2]"
                              />
                              <div>
                                <div className="text-[10px] text-[#7A86A7] uppercase tracking-wider">
                                  Check Out
                                </div>
                                <div className="text-sm text-[#B7C0D8] font-medium mt-0.5">
                                  {item.check_out
                                    ? new Date(
                                        item.check_out,
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "--"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Row: Duration */}
                          <div className="flex items-center justify-between pt-3 border-t border-[#2A3A5C]">
                            <div className="flex items-center gap-2">
                              <Clock size={16} className="text-[#1FA463]" />
                              <span className="text-[10px] text-[#7A86A7] uppercase tracking-wider">
                                Active Hours
                              </span>
                            </div>
                            <span className="text-sm text-[#1FA463] font-bold">
                              {formatDuration(item.duration_hours)}
                            </span>
                          </div>
                        </div>

                        {/* Desktop Layout (Single Row Grid) */}
                        <div className="hidden md:grid grid-cols-5 gap-4 items-center text-sm">
                          <span className="flex items-center gap-2 text-[#B7C0D8]">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                          <span className="text-[#B7C0D8]">
                            {item.check_in
                              ? new Date(item.check_in).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "--"}
                          </span>
                          <span className="text-[#B7C0D8]">
                            {item.check_out
                              ? new Date(item.check_out).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )
                              : "--"}
                          </span>
                          <span className="text-[#5DADE2] font-semibold">
                            {formatDuration(item.duration_hours)}
                          </span>
                          <span
                            className="text-xs px-2 py-1 rounded-md font-semibold justify-self-end"
                            style={{ background: s.bg, color: s.color }}
                          >
                            {s.label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-[#7A86A7]">
                    No records found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TEAM VIEW */}
        {activeTab === "team" && isManager && (
          <div className="fade-in flex flex-col gap-4">
            {teamData.length === 0 ? (
              <div className="py-12 text-center text-[#7A86A7] bg-[#172440] border border-[#2A3A5C] rounded-xl">
                No team attendance data found.
              </div>
            ) : (
              teamData.map((team) => (
                <div
                  key={team.team_id}
                  onClick={() => setSelectedTeam(team)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#172440] border border-[#2A3A5C] rounded-xl p-5 cursor-pointer hover:border-[#5DADE2] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#081325] border border-[#2A3A5C] flex items-center justify-center">
                      <Users size={20} color={tk.brandLight} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">{team.team_name}</h3>
                      <p className="text-xs text-[#7A86A7] mt-1">
                        {team.total_members} Members
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8">
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#1FA463]">
                        {team.present_count}
                      </div>
                      <div className="text-[10px] text-[#7A86A7] uppercase">
                        Present
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#7A86A7]">
                        {team.absent_count}
                      </div>
                      <div className="text-[10px] text-[#7A86A7] uppercase">
                        Absent
                      </div>
                    </div>
                    <div className="w-24 text-center">
                      <div className="text-lg font-bold text-[#5DADE2]">
                        {team.present_percentage}%
                      </div>
                      <div className="h-1.5 bg-[#081325] rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-[#1FA463] rounded-full"
                          style={{ width: `${team.present_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* TEAM DETAIL DRAWER (Cleaned Up) */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedTeam(null)}
          />
          <aside className="relative w-full sm:w-[420px] bg-[#172440] border-l border-[#2A3A5C] flex flex-col shadow-2xl">
            {/* Header */}
            <header className="p-5 border-b border-[#2A3A5C] flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">{selectedTeam.team_name}</h2>
                <p className="text-xs text-[#7A86A7] mt-1">
                  {selectedTeam.present_count} Present ·{" "}
                  {selectedTeam.absent_count} Absent
                </p>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-[#7A86A7] hover:text-white"
              >
                <X size={20} />
              </button>
            </header>

            {/* Member List (Clicking opens Global Profile) */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedTeam.members.map((m) => {
                const s = statusConfig[m.status] || statusConfig.absent;
                return (
                  <div
                    key={m.user_id}
                    onClick={() => openProfile(m)} // <-- THIS TRIGGERS THE GLOBAL DRAWER
                    className="flex items-center gap-3 p-3 rounded-lg mb-2 bg-[#081325] border border-[#2A3A5C] cursor-pointer hover:border-[#5DADE2] transition-colors"
                  >
                    <Avatar
                      src={m.profile_image}
                      name={m.full_name}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm font-semibold text-white truncate">
                        {m.full_name}
                      </div>
                      <div className="text-xs text-[#7A86A7] mt-0.5">
                        {m.check_in
                          ? `Checked in at ${new Date(m.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : "No check-in today"}
                      </div>
                    </div>
                    <span
                      className="text-[10px] px-2 py-1 rounded-md font-semibold flex-shrink-0"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      {/* CONFIG MODAL */}
      {showConfig && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowConfig(false)}
        >
          <div
            className="bg-[#172440] border border-[#2A3A5C] rounded-xl w-full max-w-md p-6 fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Attendance Configuration</h2>
              <button
                onClick={() => setShowConfig(false)}
                className="text-[#7A86A7] hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#7A86A7] uppercase block mb-2">
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
                  <label className="text-xs font-semibold text-[#7A86A7] uppercase block mb-2">
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
                <label className="text-xs font-semibold text-[#7A86A7] uppercase block mb-2">
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
                <label className="text-xs font-semibold text-[#7A86A7] uppercase block mb-2">
                  Working Days
                </label>
                <div className="flex gap-2">
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
                        className={`flex-1 py-2 rounded-md text-xs font-semibold border ${isActive ? "bg-[#4B1587] border-[#4B1587] text-white" : "border-[#2A3A5C] text-[#7A86A7]"}`}
                      >
                        {dayName}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={handleSaveConfig}
                className="ac-btn w-full bg-[#4B1587] text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
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
          className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg font-semibold text-sm shadow-2xl z-[1000]"
          style={{
            background:
              toast.type === "error"
                ? "rgba(227,30,36,0.15)"
                : "rgba(31,164,99,0.15)",
            border: `1px solid ${toast.type === "error" ? "rgba(227,30,36,0.3)" : "rgba(31,164,99,0.3)"}`,
            color: toast.type === "error" ? tk.primary : tk.success,
          }}
        >
          {toast.msg}
        </div>
      )}
    </main>
  );
}

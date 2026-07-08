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
  X,
  PartyPopper,
} from "lucide-react";
import { tk } from "@/lib/tokens";

type AttendanceItem = {
  date: string;
  check_in: string | null;
  check_out: string | null;
  duration_hours: number | null;
  status: string;
  clock_out_reason?: string | null;
  is_today: boolean;
};

type TeamAtt = {
  team_id: number;
  team_name: string;
  total_members: number;
  present_count: number;
  absent_count: number;
  present_percentage: number;
  members: any[];
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
  holiday: {
    color: tk.textMuted,
    bg: "rgba(122,134,167,0.05)",
    label: "Holiday",
  },
};

export default function AttendancePage() {
  const router = useRouter();
  const [role, setRole] = useState("member");
  const [history, setHistory] = useState<AttendanceItem[]>([]);
  const [percentage, setPercentage] = useState(0);
  const [loading, setLoading] = useState(false);

  // State Machine Variables
  const [attState, setAttState] = useState("AWAITING_CLOCK_IN");
  const [canClockIn, setCanClockIn] = useState(false);
  const [canClockOut, setCanClockOut] = useState(false);
  const [stateMsg, setStateMsg] = useState("Loading...");
  const [todayIn, setTodayIn] = useState<string | null>(null);
  const [timer, setTimer] = useState("0h 0m");
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const [activeTab, setActiveTab] = useState("personal");
  const [teamData, setTeamData] = useState<TeamAtt[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamAtt | null>(null);

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
      setHistory(data.records || []);

      // Set State Machine Values
      setAttState(data.state);
      setCanClockIn(data.can_clock_in);
      setCanClockOut(data.can_clock_out);
      setStateMsg(data.state_message);

      const todayRecord = data.records.find((r: AttendanceItem) => r.is_today);
      if (todayRecord && todayRecord.check_in && !todayRecord.check_out) {
        setTodayIn(todayRecord.check_in);
      } else {
        setTodayIn(null);
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

  // Timer only runs if backend says we are WORKING
  useEffect(() => {
    if (attState !== "WORKING" || !todayIn) return;
    const interval = setInterval(() => {
      const diff = new Date().getTime() - new Date(todayIn).getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimer(`${hours}h ${mins}m`);
    }, 1000);
    return () => clearInterval(interval);
  }, [attState, todayIn]);

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
      fetchPersonal();
    } catch (err: any) {
      showToast(err.message || "Failed to check out", "error");
    }
    setLoading(false);
  };

  const isManager = role === "leader" || role === "admin" || role === "owner";

  return (
    <main className="min-h-full w-full bg-[var(--bg)] text-[var(--heading)] font-sans">
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

      {/* 1. LOCKED TOP SECTION (Sticky) */}
      <div className="sticky top-0 z-10 p-4 sm:p-6 lg:p-8 pb-4 bg-[var(--bg)] border-b border-[var(--border)]/50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Attendance</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Track your work hours and team activity.
            </p>
          </div>
          {isManager && (
            <div className="flex gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)]">
              <button
                onClick={() => setActiveTab("personal")}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${activeTab === "personal" ? "bg-[var(--brand)] text-[var(--heading)]" : "text-[var(--text-secondary)]"}`}
              >
                Personal
              </button>
              <button
                onClick={() => setActiveTab("team")}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${activeTab === "team" ? "bg-[var(--brand)] text-[var(--heading)]" : "text-[var(--text-secondary)]"}`}
              >
                Team
              </button>
            </div>
          )}
        </div>

        {activeTab === "personal" && (
          <div className="fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 sm:p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium">
                    TODAY STATUS
                  </span>
                  {attState === "WORKING" ? (
                    <CheckCircle2 size={16} color={tk.success} />
                  ) : attState === "SHIFT_COMPLETED" ? (
                    <PartyPopper size={16} color={tk.brandLight} />
                  ) : (
                    <AlertCircle size={16} color={tk.textMuted} />
                  )}
                </div>
                <div
                  className="text-base sm:text-xl font-bold capitalize"
                  style={{
                    color:
                      attState === "WORKING"
                        ? tk.success
                        : attState === "SHIFT_COMPLETED"
                          ? tk.brandLight
                          : tk.textPrimary,
                  }}
                >
                  {attState.replace("_", " ").toLowerCase()}
                </div>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 sm:p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium">
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
                    : history.find((r) => r.is_today)?.check_in
                      ? new Date(
                          history.find((r) => r.is_today)!.check_in!,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--:--"}
                </div>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 sm:p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium">
                    ACTIVE HOURS
                  </span>
                  <Clock size={16} color={tk.success} />
                </div>
                <div className="text-base sm:text-xl font-bold">
                  {attState === "WORKING"
                    ? timer
                    : formatDuration(
                        history.find((r) => r.is_today)?.duration_hours ?? null,
                      )}
                </div>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 sm:p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium">
                    MONTHLY %
                  </span>
                  <Calendar size={16} color={tk.warning} />
                </div>
                <div className="text-base sm:text-xl font-bold text-[var(--warning)]">
                  {percentage}%
                </div>
              </div>
            </div>

            {/* STATE MACHINE UI ACTIONS */}
            <div className="flex flex-row gap-3 items-stretch sm:items-center">
              {/* Clock In Button (Always visible, disabled if backend says no) */}
              <button
                className="ac-btn flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brand)] text-[var(--heading)] font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={loading || !canClockIn}
                onClick={handleCheckIn}
              >
                <LogIn size={16} /> Clock In
              </button>

              {/* Clock Out Button (Always visible, disabled if backend says no. Less dangerous styling) */}
              <button
                className="ac-btn flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={loading || !canClockOut}
                onClick={handleCheckOut}
              >
                <LogOutIcon size={16} /> Clock Out
              </button>

              {/* Messages for other states (Pre-shift, Completed, Non-working) */}
              {(attState === "PRE_SHIFT" ||
                attState === "SHIFT_COMPLETED" ||
                attState === "NON_WORKING_DAY") && (
                <div className="flex-1 sm:flex-none flex items-center justify-center text-sm font-medium text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border)] px-4 py-2.5 rounded-lg text-center">
                  {stateMsg}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. SCROLLABLE LOWER SECTION */}
      <div className="p-4 sm:p-6 lg:p-8 pt-6">
        {activeTab === "personal" && (
          <div className="fade-in">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 sm:p-6">
              <h3 className="text-base font-bold mb-5">Recent History</h3>

              <div className="hidden md:grid grid-cols-5 gap-4 px-4 pb-2 text-xs text-[var(--text-muted)] font-medium border-b border-[var(--border)]">
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
                        className="p-3 bg-[var(--bg)] rounded-lg border border-[var(--border)]"
                      >
                        {/* Unified Responsive Layout */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 items-center text-xs md:text-sm">
                          <span className="flex items-center gap-2 text-[var(--heading)] font-medium col-span-2">
                            <Calendar size={14} color={tk.textMuted} />
                            {new Date(item.date).toLocaleDateString(undefined, {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                          <span className="text-[var(--text-secondary)] flex items-center gap-1">
                            <LogIn
                              size={12}
                              className="text-[var(--brand-light)]"
                            />
                            {item.check_in
                              ? new Date(item.check_in).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "--:--"}
                          </span>
                          <span className="text-[var(--text-secondary)] flex items-center gap-1">
                            <LogOutIcon
                              size={12}
                              className="text-[var(--brand-light)]"
                            />
                            {item.check_out
                              ? new Date(item.check_out).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )
                              : "--:--"}
                          </span>
                          <div className="flex items-center justify-end gap-2">
                            {item.duration_hours != null && (
                              <span className="text-[var(--success)] font-semibold text-xs">
                                {formatDuration(item.duration_hours)}
                              </span>
                            )}
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-md font-semibold justify-self-end"
                              style={{ background: s.bg, color: s.color }}
                            >
                              {s.label}{" "}
                              {item.clock_out_reason === "AUTO_SHIFT_END" &&
                                "(Auto)"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-[var(--text-muted)]">
                    No records found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "team" && isManager && (
          <div className="fade-in flex flex-col gap-4">
            {teamData.length === 0 ? (
              <div className="py-12 text-center text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                No team attendance data found.
              </div>
            ) : (
              teamData.map((team) => (
                <div
                  key={team.team_id}
                  onClick={() => setSelectedTeam(team)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 cursor-pointer hover:border-[var(--brand-light)] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center">
                      <Users size={20} color={tk.brandLight} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">{team.team_name}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {team.total_members} Members
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                    <div className="text-center">
                      <div className="text-base font-bold text-[var(--success)]">
                        {team.present_count}
                      </div>
                      <div className="text-[9px] text-[var(--text-muted)] uppercase">
                        Present (Cycle)
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-[var(--text-muted)]">
                        {team.absent_count}
                      </div>
                      <div className="text-[9px] text-[var(--text-muted)] uppercase">
                        Absent (Cycle)
                      </div>
                    </div>
                    <div className="w-20 text-center">
                      <div className="text-base font-bold text-[var(--brand-light)]">
                        {team.present_percentage}%
                      </div>
                      <div className="h-1.5 bg-[var(--bg)] rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-[var(--success)] rounded-full"
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

      {/* TEAM DETAIL DRAWER */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedTeam(null)}
          />
          <aside className="relative w-full sm:w-[420px] bg-[var(--surface)] border-l border-[var(--border)] flex flex-col shadow-2xl">
            <header className="p-5 border-b border-[var(--border)] flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">{selectedTeam.team_name}</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {selectedTeam.present_count} Present ·{" "}
                  {selectedTeam.absent_count} Absent
                </p>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-[var(--text-muted)] hover:text-[var(--heading)]"
              >
                <X size={20} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
              {selectedTeam.members.map((m) => {
                const s = statusConfig[m.status] || statusConfig.absent;
                return (
                  <div
                    key={m.user_id}
                    className="mb-4 bg-[var(--bg)] border border-[var(--border)] rounded-lg overflow-hidden"
                  >
                    {/* Member Profile Row */}
                    <div
                      onClick={() => openProfile(m)}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[var(--surface)] transition-colors"
                    >
                      <Avatar
                        src={m.profile_image}
                        name={m.full_name}
                        size="sm"
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-semibold text-[var(--heading)] truncate">
                          {m.full_name}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-0.5">
                          Cycle: {m.cycle_percentage}% ({m.cycle_present}{" "}
                          Present, {m.cycle_absent} Absent)
                        </div>
                      </div>
                      <span
                        className="text-[10px] px-2 py-1 rounded-md font-semibold flex-shrink-0"
                        style={{ background: s.bg, color: s.color }}
                      >
                        Today: {s.label}
                      </span>
                    </div>

                    {/* 14-Day History Strip */}
                    {m.history && m.history.length > 0 && (
                      <div className="px-3 pb-3 pt-1 border-t border-[var(--border)] mt-1">
                        <div className="text-[9px] text-[var(--text-muted)] uppercase mb-1.5">
                          Last {m.history.length} Days
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {m.history.map((h: any, i: number) => {
                            const hs =
                              statusConfig[h.status] || statusConfig.absent;
                            return (
                              <div
                                key={i}
                                className="w-6 h-6 rounded flex items-center justify-center text-[8px] font-bold"
                                style={{
                                  background: hs.bg,
                                  color: hs.color,
                                  border: `1px solid ${tk.border}`,
                                }}
                                title={`${new Date(h.date).toLocaleDateString()}: ${hs.label}`}
                              >
                                {new Date(h.date).getDate()}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}

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

"use client";
import { useRouter } from "next/navigation";
import {
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckSquare,
  ChevronRight,
} from "lucide-react";
import { tk } from "@/lib/tokens";

export default function DashboardStats({ stats, loading, errors }: any) {
  const router = useRouter();
  const presentToday = stats?.present_today ?? 0;
  const totalMembers = stats?.total_members ?? 0;
  const attendanceProgress =
    totalMembers > 0 ? (presentToday / totalMembers) * 100 : 0;

  const attendanceState = stats?.attendance_state;
  const shiftStart = stats?.shift_start
    ? new Date(`1970-01-01T${stats.shift_start}`).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "09:00";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6 items-stretch">
      {/* Attendance -> Deep Link to /attendance */}
      <div
        onClick={() => router.push("/dashboard/attendance")}
        className="card-hover stat-card p-6 rounded-2xl flex flex-col h-full cursor-pointer"
        style={{ background: tk.surface, border: `1px solid ${tk.border}` }}
      >
        <div className="flex items-center gap-2.5 mb-5 justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: tk.tintGreen }}
            >
              <Calendar size={18} style={{ color: tk.success }} />
            </div>
            <h3
              className="m-0 text-base font-bold"
              style={{ color: tk.textPrimary }}
            >
              Today's Attendance
            </h3>
          </div>
          <ChevronRight size={20} color={tk.textMuted} />
        </div>
        {attendanceState === "NON_WORKING_DAY" ? (
          <div className="flex-1 flex items-center justify-center">
            <p
              className="text-sm text-center py-5"
              style={{ color: tk.textMuted }}
            >
              Enjoy your weekend. No attendance today.
            </p>
          </div>
        ) : attendanceState === "PRE_SHIFT" ? (
          <div className="flex-1 flex items-center justify-center">
            <p
              className="text-sm text-center py-5"
              style={{ color: tk.textMuted }}
            >
              Shift starts at {shiftStart}.<br />
              No one is absent yet.
            </p>
          </div>
        ) : totalMembers === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p
              className="text-sm text-center py-5"
              style={{ color: tk.textMuted }}
            >
              No attendance scheduled today.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2
                  className="m-0 text-3xl font-bold"
                  style={{ color: tk.success }}
                >
                  {presentToday}
                </h2>
                <p
                  className="mt-1 mb-0 text-sm font-medium"
                  style={{ color: tk.textSecondary }}
                >
                  Present
                </p>
              </div>
              <div
                className="h-10 w-px mx-5"
                style={{ background: tk.border }}
              />
              <div>
                <h2
                  className="m-0 text-3xl font-bold"
                  style={{ color: tk.primary }}
                >
                  {stats?.absent_today ?? 0}
                </h2>
                <p
                  className="mt-1 mb-0 text-sm font-medium"
                  style={{ color: tk.textSecondary }}
                >
                  Absent
                </p>
              </div>
            </div>
            <div className="mt-auto">
              <div
                className="w-full h-1.5 rounded-full overflow-hidden mb-2"
                style={{ background: tk.bg }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${attendanceProgress}%`,
                    background: tk.success,
                  }}
                />
              </div>
              <p
                className="m-0 text-xs text-center"
                style={{ color: tk.textMuted }}
              >
                {presentToday} / {totalMembers} Members Present
              </p>
            </div>
          </>
        )}
      </div>

      {/* Approvals -> Deep Link to /tasks?filter=approvals */}
      <div
        onClick={() => router.push("/dashboard/tasks?status=pending_approval")}
        className="card-hover stat-card p-6 rounded-2xl cursor-pointer flex flex-col h-full"
        style={{ background: tk.surface, border: `1px solid ${tk.border}` }}
      >
        <div className="flex items-center gap-2.5 mb-5 justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: tk.tintAmber }}
            >
              <AlertCircle size={18} style={{ color: tk.warning }} />
            </div>
            <h3
              className="m-0 text-base font-bold"
              style={{ color: tk.textPrimary }}
            >
              Pending Approvals
            </h3>
          </div>
          <ChevronRight size={20} color={tk.textMuted} />
        </div>
        {stats?.pending_approvals === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-2.5">
            <CheckSquare
              size={24}
              className="mb-2"
              style={{ color: tk.success }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: tk.textSecondary }}
            >
              You're all caught up.
            </p>
          </div>
        ) : (
          <div className="mt-auto">
            <h2
              className="m-0 text-3xl font-bold"
              style={{ color: tk.textPrimary }}
            >
              {stats?.pending_approvals ?? 0}
            </h2>
            <p
              className="mt-1 mb-0 text-sm font-medium"
              style={{ color: tk.warning }}
            >
              Awaiting your review
            </p>
          </div>
        )}
      </div>

      {/* Overdue -> Deep Link to /tasks?filter=overdue */}
      <div
        onClick={() => router.push("/dashboard/tasks?status=overdue")}
        className="card-hover stat-card p-6 rounded-2xl cursor-pointer flex flex-col h-full"
        style={{ background: tk.surface, border: `1px solid ${tk.primary}40` }}
      >
        <div className="flex items-center gap-2.5 mb-5 justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: tk.tintRed }}
            >
              <AlertTriangle size={18} style={{ color: tk.primary }} />
            </div>
            <h3
              className="m-0 text-base font-bold"
              style={{ color: tk.textPrimary }}
            >
              Overdue Tasks
            </h3>
          </div>
          <ChevronRight size={20} color={tk.textMuted} />
        </div>
        {stats?.overdue_tasks === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-2.5">
            <CheckSquare
              size={24}
              className="mb-2"
              style={{ color: tk.success }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: tk.textSecondary }}
            >
              Excellent work. Nothing is overdue.
            </p>
          </div>
        ) : (
          <div className="mt-auto">
            <h2
              className="m-0 text-3xl font-bold"
              style={{ color: tk.primary }}
            >
              {stats?.overdue_tasks ?? 0}
            </h2>
            <p
              className="mt-1 mb-0 text-sm font-medium"
              style={{ color: tk.primary }}
            >
              Requires immediate attention
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

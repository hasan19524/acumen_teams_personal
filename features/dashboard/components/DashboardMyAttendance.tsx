"use client";
import { Calendar, CheckCircle, XCircle } from "lucide-react";
import { tk } from "@/lib/tokens";

export default function DashboardMyAttendance({ attendance }: any) {
  // FIX: Use real backend calculations instead of hardcoded frontend math
  const presentDays = attendance?.present_days_14d ?? 0;
  const absentDays = attendance?.absent_days_14d ?? 0;
  const attendanceRate = attendance?.attendance_percentage_14d ?? 0;

  return (
    <div className="card-hover p-6 rounded-2xl flex flex-col h-full" style={{ background: tk.surface, border: `1px solid ${tk.border}` }}>
      <div className="flex items-center gap-2.5 mb-4">
        <Calendar size={20} style={{ color: tk.brandLight }} />
        <h3 className="m-0 text-lg font-bold" style={{ color: tk.textPrimary }}>My Attendance</h3>
        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: tk.textMuted, background: tk.surfaceHover }}>
          Last 14 Days
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col items-center justify-center p-3 rounded-lg" style={{ background: tk.bg, border: `1px solid ${tk.border}` }}>
          <CheckCircle size={20} style={{ color: tk.success, marginBottom: 4 }} />
          <span className="text-2xl font-extrabold" style={{ color: tk.success }}>{presentDays}</span>
          <span className="text-xs font-medium" style={{ color: tk.textMuted }}>Present</span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 rounded-lg" style={{ background: tk.bg, border: `1px solid ${tk.border}` }}>
          <XCircle size={20} style={{ color: tk.primary, marginBottom: 4 }} />
          <span className="text-2xl font-extrabold" style={{ color: tk.primary }}>{absentDays}</span>
          <span className="text-xs font-medium" style={{ color: tk.textMuted }}>Absent</span>
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium" style={{ color: tk.textSecondary }}>Attendance Rate</span>
          <span className="text-xs font-bold" style={{ color: tk.brandLight }}>{attendanceRate}%</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: tk.bg }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${attendanceRate}%`, background: tk.success }} />
        </div>
      </div>
    </div>
  );
}
"use client";
import { useProfileStore } from "@/features/dashboard/store/profileStore";
import { Users, Coffee } from "lucide-react";

import { tk } from "@/lib/tokens";
export default function DashboardActiveMembers({
  loading,
  onlineUsers,
  totalMembers,
}: any) {
  const openProfile = useProfileStore((s) => s.openProfile);

  return (
    <div
      className="card-hover p-6 rounded-2xl flex flex-col h-full"
      style={{ background: tk.surface, border: `1px solid ${tk.border}` }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: tk.tintIndigo }}
        >
          <Users size={16} style={{ color: tk.indigo }} />
        </div>
        <h3 className="m-0 text-lg font-bold" style={{ color: tk.textPrimary }}>
          Active Members
        </h3>
        <span
          className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ color: tk.success, background: tk.surfaceHover }}
        >
          {onlineUsers.length} Clocked In
        </span>
      </div>
      {loading ? (
        <div
          className="shimmer rounded-xl flex-1"
          style={{ background: tk.surfaceHover }}
        />
      ) : onlineUsers.length === 0 ? (
        <div
          className="flex-1 flex flex-col items-center justify-center text-center rounded-xl p-5"
          style={{
            color: tk.textMuted,
            background: tk.bg,
            border: `1px solid ${tk.border}`,
          }}
        >
          <Coffee
            size={28}
            className="mb-3 opacity-50"
            style={{ color: tk.warning }}
          />
          <p className="text-sm font-bold" style={{ color: tk.textPrimary }}>
            Looks quiet this morning.
          </p>
          <p className="text-xs mt-1 mb-3">
            Members will appear here after Clock In.
          </p>
          <div
            className="text-xs flex gap-3 w-full justify-center"
            style={{ color: tk.textSecondary }}
          >
            <span>
              Expected:{" "}
              <span className="font-semibold" style={{ color: tk.textPrimary }}>
                {totalMembers}
              </span>
            </span>
            <span>
              Hours:{" "}
              <span className="font-semibold" style={{ color: tk.textPrimary }}>
                9 AM - 6 PM
              </span>
            </span>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col gap-1">
          {onlineUsers.map((u: any) => (
            <div
              key={u.id}
              onClick={() => openProfile(u)}
              className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
            >
              <div className="relative flex-shrink-0">
                <div
                  className="flex items-center justify-center font-bold text-[var(--heading)]"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${tk.brand}, ${tk.brandLight})`,
                    fontSize: 13,
                  }}
                >
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <div
                  className="absolute bottom-0 right-0 rounded-full"
                  style={{
                    width: 10,
                    height: 10,
                    background: tk.success,
                    border: `2px solid ${tk.surface}`,
                  }}
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <div
                  className="text-sm font-medium truncate"
                  style={{ color: tk.textPrimary }}
                >
                  {u.full_name || u.username}
                </div>
                <div
                  className="text-xs capitalize"
                  style={{ color: tk.textMuted }}
                >
                  {u.team || "Unassigned"}
                </div>
              </div>
              <span
                className="text-xs font-semibold"
                style={{ color: tk.textSecondary }}
              >
                {new Date(u.clock_in_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

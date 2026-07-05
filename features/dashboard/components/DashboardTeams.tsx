"use client";
import { useRouter } from "next/navigation";
import { Users, Inbox, ChevronRight } from "lucide-react";
import { tk } from "@/lib/tokens";

export default function DashboardTeams({ loading, teams, onlineUsers }: any) {
  const router = useRouter();
  const getTeamActiveCount = (teamName: string) =>
    onlineUsers.filter((u: any) => u.team === teamName).length;

  return (
    <div
      className="card-hover lg:col-span-2 p-6 rounded-2xl flex flex-col h-full"
      style={{ background: tk.surface, border: `1px solid ${tk.border}` }}
    >
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2.5">
          <Users size={20} style={{ color: tk.warning }} />
          <h3
            className="m-0 text-lg font-bold"
            style={{ color: tk.textPrimary }}
          >
            Workspace Teams
          </h3>
        </div>
        <span className="text-xs font-semibold" style={{ color: tk.textMuted }}>
          {teams.length} Total
        </span>
      </div>

      {loading ? (
        <div
          className="shimmer rounded-xl flex-1"
          style={{ background: tk.bg }}
        />
      ) : teams.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-8 text-center flex-1"
          style={{ color: tk.textMuted }}
        >
          <Inbox size={28} className="mb-3 opacity-50" />
          <p
            className="text-sm font-semibold"
            style={{ color: tk.textPrimary }}
          >
            No teams created yet
          </p>
          <p className="text-xs mt-1">Create a team to start collaborating.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
          {teams.slice(0, 4).map((team: any) => {
            const activeCount = getTeamActiveCount(team.name);
            return (
              <div
                key={team.id}
                onClick={() => router.push("/dashboard/team")}
                className="p-3.5 rounded-xl flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02]"
                style={{ background: tk.bg, border: `1px solid ${tk.border}` }}
              >
                <div
                  className="flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: team.color || tk.brand,
                    fontSize: 16,
                  }}
                >
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div
                    className="text-sm font-bold truncate"
                    style={{ color: tk.textPrimary }}
                  >
                    {team.name}
                  </div>
                  <div
                    className="text-xs flex items-center gap-1.5 mt-0.5"
                    style={{ color: tk.textMuted }}
                  >
                    <span>{team.member_count} Members</span>
                    {activeCount > 0 && (
                      <span
                        className="font-semibold"
                        style={{ color: tk.success }}
                      >
                        • {activeCount} Active
                      </span>
                    )}
                  </div>
                  {team.leaders?.length > 0 && (
                    <div
                      className="text-[10px] mt-1 font-medium"
                      style={{ color: tk.textMuted }}
                    >
                      Lead:{" "}
                      <span style={{ color: tk.textSecondary }}>
                        {team.leaders[0]}
                      </span>
                    </div>
                  )}
                </div>
                <ChevronRight size={18} style={{ color: tk.textMuted }} />
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => router.push("/dashboard/team")}
        className="mt-5 w-full p-3 rounded-xl font-semibold cursor-pointer text-sm transition-colors"
        style={{
          background: tk.surfaceHover,
          border: "none",
          color: tk.brandLight,
        }}
      >
        View All Teams →
      </button>
    </div>
  );
}

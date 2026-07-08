"use client";
import { useState } from "react";
import {
  TrendingUp,
  X,
  ChevronRight,
  Users,
  User,
  Info,
  Lock,
} from "lucide-react";
import { tk } from "@/lib/tokens";

export default function DashboardProductivity({
  loading,
  productivityData,
}: any) {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"teams" | "members">("teams");

  // Extract data safely
  const score = productivityData?.score;
  const cycleActive = productivityData?.cycle_active;
  const message = productivityData?.message;
  const teams = productivityData?.teams || [];
  const members = productivityData?.members || [];

  return (
    <>
      <div
        onClick={() => cycleActive && setShowModal(true)}
        className="card-hover productivity-card p-6 rounded-2xl flex flex-col justify-center h-full"
        style={{
          background: `linear-gradient(135deg, ${tk.brand}, ${tk.brandLight})`,
          minHeight: 240,
          overflow: "hidden",
          position: "relative",
          cursor: cycleActive ? "pointer" : "default",
        }}
      >
        {loading ? (
          <div
            className="shimmer rounded-xl"
            style={{
              height: 80,
              width: "100%",
              background: "rgba(255,255,255,0.1)",
            }}
          />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <TrendingUp size={16} style={{ color: "rgba(255,255,255,.9)" }} />
              <p
                className="m-0 text-xs font-bold tracking-wider"
                style={{ color: "rgba(255,255,255,.8)" }}
              >
                WORKSPACE PRODUCTIVITY
              </p>
            </div>

            {cycleActive ? (
              <h2
                className="mt-2 mb-0 text-5xl font-extrabold relative z-10"
                style={{ color: "#fff" }}
              >
                {score}%
              </h2>
            ) : (
              <p
                className="text-base font-semibold leading-tight relative z-10 mt-3"
                style={{ color: "#fff" }}
              >
                {message || "Not enough data yet."}
              </p>
            )}

            {cycleActive && (
              <p
                className="mt-3 text-sm font-medium flex items-center gap-1 relative z-10"
                style={{ color: "rgba(255,255,255,.95)" }}
              >
                View Leaderboards <ChevronRight size={14} />
              </p>
            )}
            {!cycleActive && (
              <div
                className="mt-3 flex items-center gap-1.5 relative z-10"
                style={{ color: "rgba(255,255,255,.8)" }}
              >
                <Lock size={12} />
                <span className="text-xs font-medium">Leaderboard locked</span>
              </div>
            )}
          </>
        )}
        <div
          className="absolute bottom-[-20px] right-[-20px] rounded-full"
          style={{
            width: 120,
            height: 120,
            background: "rgba(255,255,255,0.1)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {showModal && cycleActive && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-5"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl p-4 sm:p-6 max-w-md w-full flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh]"
            style={{ background: tk.surface, border: `1px solid ${tk.border}` }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2
                className="m-0 text-lg sm:text-xl font-bold"
                style={{ color: tk.textPrimary }}
              >
                Productivity Leaderboard
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="cursor-pointer"
                style={{
                  background: "none",
                  border: "none",
                  color: tk.textMuted,
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Score & Info Header */}
            <div className="text-center mb-5 sm:mb-6">
              {cycleActive ? (
                <h1
                  className="text-4xl sm:text-5xl font-extrabold m-0"
                  style={{ color: tk.brandLight }}
                >
                  {score}%
                </h1>
              ) : (
                <p className="text-sm" style={{ color: tk.textSecondary }}>
                  {message || "Calculation in progress."}
                </p>
              )}
              <div className="flex items-center justify-center gap-1 mt-2">
                <Info size={12} style={{ color: tk.textMuted }} />
                <p
                  className="m-0 text-[10px] sm:text-xs"
                  style={{ color: tk.textMuted }}
                >
                  Derived from task completion and attendance. Cycle: 14 Days.
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div
              className="flex gap-1 p-1 rounded-lg mb-4"
              style={{ background: tk.bg }}
            >
              <button
                onClick={() => setActiveTab("teams")}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${activeTab === "teams" ? "bg-[var(--brand)] text-[var(--heading)]" : "text-[var(--text-secondary)]"}`}
              >
                Teams
              </button>
              <button
                onClick={() => setActiveTab("members")}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${activeTab === "members" ? "bg-[var(--brand)] text-[var(--heading)]" : "text-[var(--text-secondary)]"}`}
              >
                Members
              </button>
            </div>

            {/* Leaderboard List */}
            <div
              className="flex-1 overflow-y-auto pr-1 sm:pr-2 -mr-1 sm:-mr-2"
              style={{ minHeight: 0 }}
            >
              {activeTab === "teams" ? (
                teams.length > 0 ? (
                  teams.map((team: any, index: number) => (
                    <LeaderboardRow
                      key={index}
                      rank={index + 1}
                      name={team.name}
                      score={team.score}
                      icon={<Users size={16} />}
                    />
                  ))
                ) : (
                  <EmptyLeaderboard message="No team data available." />
                )
              ) : members.length > 0 ? (
                members.map((member: any, index: number) => (
                  <LeaderboardRow
                    key={index}
                    rank={index + 1}
                    name={member.name}
                    score={member.score}
                    icon={<User size={16} />}
                  />
                ))
              ) : (
                <EmptyLeaderboard message="No member data available." />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper Component for Leaderboard Rows
const LeaderboardRow = ({ rank, name, score, icon }: any) => {
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg mb-2"
      style={{ background: tk.bg, border: `1px solid ${tk.border}` }}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <span
          className="w-5 sm:w-6 text-center font-bold text-sm flex-shrink-0"
          style={{ color: tk.textMuted }}
        >
          {rank <= 3 ? medals[rank - 1] : rank}
        </span>
        <div style={{ color: tk.textSecondary }} className="flex-shrink-0">
          {icon}
        </div>
        <span
          className="font-semibold text-sm truncate"
          style={{ color: tk.textPrimary }}
        >
          {name}
        </span>
      </div>
      <span
        className="text-sm font-bold flex-shrink-0 ml-2"
        style={{
          color:
            score >= 75 ? tk.success : score >= 50 ? tk.warning : tk.textMuted,
        }}
      >
        {score}%
      </span>
    </div>
  );
};

const EmptyLeaderboard = ({ message }: any) => (
  <div className="flex flex-col items-center justify-center h-full text-center py-10">
    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
      {message}
    </p>
  </div>
);

"use client";
import { useState } from "react";
import { TrendingUp, X, ChevronRight } from "lucide-react";
import { tk } from "@/lib/tokens";

export default function DashboardProductivity({
  loading,
  productivityScore,
}: any) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="card-hover productivity-card p-6 rounded-2xl flex flex-col justify-center h-full cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${tk.brand}, ${tk.brandLight})`,
          minHeight: 240,
          overflow: "hidden",
          position: "relative",
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
            {productivityScore === 0 ? (
              <p
                className="text-base font-semibold leading-tight relative z-10 mt-3"
                style={{ color: "#fff" }}
              >
                Not enough activity this week. Complete tasks to generate your
                score.
              </p>
            ) : (
              <h2
                className="mt-2 mb-0 text-5xl font-extrabold relative z-10"
                style={{ color: "#fff" }}
              >
                {productivityScore}%
              </h2>
            )}
            <p
              className="mt-3 text-sm font-medium flex items-center gap-1 relative z-10"
              style={{ color: "rgba(255,255,255,.95)" }}
            >
              View calculation details <ChevronRight size={14} />
            </p>
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

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl p-8 max-w-md w-full"
            style={{ background: tk.surface, border: `1px solid ${tk.border}` }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2
                className="m-0 text-xl font-bold"
                style={{ color: tk.textPrimary }}
              >
                Productivity Score
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
            <div className="text-center mb-8">
              {productivityScore === 0 ? (
                <p className="text-base" style={{ color: tk.textSecondary }}>
                  Not enough data this week.
                </p>
              ) : (
                <h1
                  className="text-6xl font-extrabold m-0"
                  style={{ color: tk.brandLight }}
                >
                  {productivityScore}%
                </h1>
              )}
              <p className="mt-2" style={{ color: tk.textSecondary }}>
                Calculated over the last 7 days
              </p>
            </div>
            <p
              className="mt-6 text-xs text-center"
              style={{ color: tk.textMuted }}
            >
              The score is derived from task completion rates and consistent
              attendance. Maintain high activity to improve your score!
            </p>
          </div>
        </div>
      )}
    </>
  );
}

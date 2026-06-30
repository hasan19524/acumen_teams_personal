// features/teams/components/TeamCard.tsx
"use client";

import { Lock, Globe } from "lucide-react";
import { tk, Team, getInitials } from "../lib";

interface TeamCardProps {
  team: Team;
  onClick: () => void;
}

export function TeamCard({ team, onClick }: TeamCardProps) {
  return (
    <div
      onClick={onClick}
      className="team-card"
      style={{
        background: tk.surface,
        border: `1px solid ${tk.border}`,
        borderRadius: tk.radiusLg,
        padding: 20,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <style>{`
        .team-card:hover { border-color: ${tk.borderHover} !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
      `}</style>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Auto Initials Avatar with Team Color */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: team.color || tk.brand,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {getInitials(team.name)}
          </div>
          <div>
            <div
              style={{ fontWeight: 700, fontSize: 16, color: tk.textPrimary }}
            >
              {team.name}
            </div>
            <div
              style={{
                fontSize: 12,
                color: tk.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {team.is_private ? <Lock size={12} /> : <Globe size={12} />}
              {team.is_private ? "Private" : "Public"}
            </div>
          </div>
        </div>
      </div>

      <p
        style={{
          margin: "0 0 16px 0",
          fontSize: 13,
          color: tk.textSecondary,
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          minHeight: 36,
        }}
      >
        {team.description || "No description provided."}
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `1px solid ${tk.border}`,
          paddingTop: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: tk.textMuted,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Members
          </div>
          <span style={{ fontSize: 13, color: tk.textSecondary }}>
            {team.member_count} Total
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 11,
              color: tk.textMuted,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Leader
          </div>
          <div
            style={{
              fontSize: 12,
              color: tk.textSecondary,
              fontWeight: 600,
              background: tk.surfaceHover,
              padding: "2px 8px",
              borderRadius: 4,
              display: "inline-block",
            }}
          >
            {team.leaders?.[0] || "None"}
          </div>
        </div>
      </div>
    </div>
  );
}

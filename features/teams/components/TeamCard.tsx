"use client";

import { Lock, Globe } from "lucide-react";
import { tk, Team, getInitials } from "../lib";
import { getAccent } from "@/lib/accentPalette";

interface TeamCardProps {
  team: Team;
  onClick: () => void;
}

export function TeamCard({ team, onClick }: TeamCardProps) {
  // FIX: previously this rendered `team.color` (or tk.brand) as a solid
  // fill, which for most teams meant every avatar came out as the same
  // dark navy/purple block — jarring against the light theme's white
  // cards and indistinguishable team-to-team. Using the shared accent
  // palette gives each team a distinct, theme-aware soft-tint chip
  // instead, consistent with how Badge already renders status colors.
  const accent = getAccent(team.name || String(team.id));

  return (
    <div
      onClick={onClick}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 cursor-pointer transition-all hover:border-[var(--brand-light)] hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0"
            style={{ background: accent.bg, color: accent.fg }}
          >
            {getInitials(team.name)}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-base text-[var(--heading)] truncate">
              {team.name}
            </div>
            <div className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
              {team.is_private ? <Lock size={12} /> : <Globe size={12} />}
              {team.is_private ? "Private" : "Public"}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed line-clamp-2 min-h-[36px] mb-4">
        {team.description || "No description provided."}
      </p>

      <div className="flex justify-between items-center border-t border-[var(--border)] pt-4">
        <div>
          <div className="text-[11px] text-[var(--text-muted)] uppercase mb-1">
            Members
          </div>
          <span className="text-[13px] text-[var(--text-secondary)]">
            {team.member_count} Total
          </span>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-[var(--text-muted)] uppercase mb-1">
            Leader
          </div>
          <div className="text-xs text-[var(--text-secondary)] font-semibold bg-[var(--surface-hover)] px-2 py-0.5 rounded inline-block">
            {team.leaders?.length > 0 ? team.leaders.join(", ") : "None"}
          </div>
        </div>
      </div>
    </div>
  );
}

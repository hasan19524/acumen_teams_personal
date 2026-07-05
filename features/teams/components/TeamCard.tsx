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
      className="bg-[#172440] border border-[#2A3A5C] rounded-2xl p-5 cursor-pointer transition-all hover:border-[#5DADE2] hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-base flex-shrink-0"
            style={{ background: team.color || tk.brand }}
          >
            {getInitials(team.name)}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-base text-white truncate">
              {team.name}
            </div>
            <div className="text-xs text-[#7A86A7] flex items-center gap-1 mt-0.5">
              {team.is_private ? <Lock size={12} /> : <Globe size={12} />}
              {team.is_private ? "Private" : "Public"}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[13px] text-[#B7C0D8] leading-relaxed line-clamp-2 min-h-[36px] mb-4">
        {team.description || "No description provided."}
      </p>

      <div className="flex justify-between items-center border-t border-[#2A3A5C] pt-4">
        <div>
          <div className="text-[11px] text-[#7A86A7] uppercase mb-1">
            Members
          </div>
          <span className="text-[13px] text-[#B7C0D8]">
            {team.member_count} Total
          </span>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-[#7A86A7] uppercase mb-1">
            Leader
          </div>
          <div className="text-xs text-[#B7C0D8] font-semibold bg-[#20304E] px-2 py-0.5 rounded inline-block">
            {team.leaders?.length > 0 ? team.leaders.join(", ") : "None"}
          </div>
        </div>
      </div>
    </div>
  );
}

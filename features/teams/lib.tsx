// features/teams/lib.tsx
import React, { useMemo } from "react";
import { tk } from "@/lib/tokens";

export { tk };

export type Team = {
  id: number;
  name: string;
  description: string;
  is_private: boolean;
  color: string;
  icon: string;
  created_at: string;
  member_count: number;
  leaders: string[];
  team_type: "standard" | "general" | "unassigned" | "management";
};

export const isSystemTeam = (team: Team): boolean =>
  team.team_type === "unassigned" || team.team_type === "general";

export type Member = {
  user_id: number;
  username: string;
  full_name: string;
  role: "owner" | "admin" | "member" | "guest";
  teams: { id: number; name: string }[];
  team: string;
  joined_at: string;
  profile_image?: string | null;
};

// O(1) Grouping Logic to eliminate N+1 frontend filtering
export const useGroupedMembers = (members: Member[]) => {
  return useMemo(() => {
    const map = new Map<number, Member[]>();
    members.forEach((m) => {
      m.teams.forEach((t) => {
        if (!map.has(t.id)) map.set(t.id, []);
        map.get(t.id)!.push(m);
      });
    });
    return map;
  }, [members]);
};

export const getRoleBadgeStyle = (role: string) => {
  switch (role) {
    case "owner":
      return { bg: tk.tintIndigo, color: tk.indigo };
    case "admin":
      return { bg: tk.tintBlue, color: tk.info };
    case "leader": // Added for UI display when a member is a team leader
      return { bg: tk.tintAmber, color: tk.warning };
    case "guest":
      return { bg: tk.glass, color: tk.textMuted };
    default:
      return { bg: tk.glass, color: tk.textSecondary };
  }
};

// Helper to generate initials for avatars
export const getInitials = (name: string) => {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

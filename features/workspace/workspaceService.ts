// features/workspace/workspaceService.ts
import { apiFetch } from "@/lib/api";
import { getWorkspaceId } from "@/lib/auth";

export const workspaceService = {
  getStats: async () => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/workspaces/${wsId}/stats/`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
  },

  getMembers: async () => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/workspaces/${wsId}/members/`);
    if (!res.ok) throw new Error("Failed to fetch members");
    return res.json();
  },

  getTeams: async () => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/workspaces/${wsId}/teams/`);
    if (!res.ok) throw new Error("Failed to fetch teams");
    return res.json();
  },

  createTeam: async (payload: { name: string; leader_id?: number }) => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/workspaces/${wsId}/teams/create/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create team");
    return res.json();
  },

  inviteMember: async (payload: {
    username?: string;
    email?: string;
    role: string;
    team_id?: number;
  }) => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/workspaces/${wsId}/invite/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Failed to invite member");
    }
    return res.json();
  },

  generateInviteLink: async (payload: {
    role: string;
    expires_hours: number;
  }) => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/workspaces/${wsId}/invite/generate/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to generate invite link");
    return res.json();
  },

  // NEW: Member Management Actions
  updateMemberRole: async (userId: number, role: string) => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(
      `/api/workspaces/${wsId}/members/${userId}/role/`,
      {
        method: "PATCH",
        body: JSON.stringify({ role }),
      },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Failed to update role");
    }
    return res.json();
  },

  removeMember: async (userId: number) => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/workspaces/${wsId}/members/${userId}/`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to remove member");
  },

  moveTeam: async (userId: number, teamId: number | null) => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/workspaces/${wsId}/members/${userId}/`, {
      method: "PATCH",
      body: JSON.stringify({ team_id: teamId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Failed to move team");
    }
    return res.json();
  },
    updateTeam: async (teamId: number, payload: { name?: string; description?: string }) => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/workspaces/${wsId}/teams/${teamId}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update team");
    return res.json();
  },

  deleteTeam: async (teamId: number) => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/workspaces/${wsId}/teams/${teamId}/`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete team");
  },

  getTaskAnalytics: async () => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/tasks/${wsId}/analytics/`);
    if (!res.ok) throw new Error("Failed to fetch task analytics");
    return res.json();
  },

  getMyAttendance: async () => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/attendance/${wsId}/me/`);
    if (!res.ok) throw new Error("Failed to fetch attendance");
    return res.json();
  },
};

// features/workspace/workspaceService.ts
import { apiFetch } from "@/lib/api";
import { getWorkspaceId } from "@/lib/auth";
import { useAvatarStore } from "@/lib/stores/avatarStore";

// ── Rate Limit Handler ──────────────────────────────────────────────────
let isRateLimited = false;

async function fetchWithRateLimit(
  fetchFn: () => Promise<Response>,
  retryCount = 0,
): Promise<Response> {
  // If we already know we are rate limited, return a fake 429 response immediately
  // to prevent spamming the network and throwing UI errors.
  if (isRateLimited) {
    return new Response(null, { status: 429 });
  }

  const res = await fetchFn();

  if (res.status === 429) {
    isRateLimited = true;
    const { useNotificationStore } =
      await import("@/features/notification/store/notificationStore");
    useNotificationStore.getState().addNotification({
      notification_type: "rate_limit",
      notification_id: String(Date.now()),
      timestamp: new Date().toISOString(),
      data: {
        title: "⏳ Too Many Requests",
        message: "Please wait 10 seconds while we process your request...",
        avatar_url: null,
      },
    } as any);

    // Wait 10 seconds before allowing any new requests
    await new Promise((resolve) => setTimeout(resolve, 10000));
    isRateLimited = false;
  }

  return res;
}

export const workspaceService = {
  getStats: async () => {
    const wsId = getWorkspaceId();
    if (!wsId) return { total_members: 0, total_teams: 0, role: "member" };
    const res = await apiFetch(`/api/workspaces/${wsId}/stats/`);
    if (!res.ok) return { total_members: 0, total_teams: 0, role: "member" };
    return res.json();
  },

  getMembers: async () => {
    const wsId = getWorkspaceId();
    if (!wsId) return [];
    const res = await fetchWithRateLimit(() =>
      apiFetch(`/api/workspaces/${wsId}/members/`),
    );
    if (!res.ok) {
      console.warn(`getMembers rate limited or failed`);
      return [];
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      useAvatarStore.getState().upsertUsers(data);
    }
    return data;
  },

  getTeams: async () => {
    const wsId = getWorkspaceId();
    if (!wsId) return [];
    const res = await fetchWithRateLimit(() =>
      apiFetch(`/api/workspaces/${wsId}/teams/`),
    );
    if (!res.ok) {
      console.warn(`getTeams rate limited or failed`);
      return [];
    }
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

  inviteTeamMember: async (teamId: number, userId: number) => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/workspaces/${wsId}/teams/invite/`, {
      method: "POST",
      body: JSON.stringify({ team_id: teamId, user_id: userId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Failed to send team invite");
    }
    return res.json();
  },

  leaveWorkspace: async () => {
    const wsId = getWorkspaceId();
    if (!wsId) throw new Error("No workspace ID found");
    const res = await apiFetch(`/api/workspaces/${wsId}/leave/`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Failed to leave workspace");
    }
    return res.json();
  },

  transferOwnership: async (newOwnerId: number) => {
    const wsId = getWorkspaceId();
    if (!wsId) throw new Error("No workspace ID found");
    const res = await apiFetch(`/api/workspaces/${wsId}/transfer-ownership/`, {
      method: "POST",
      body: JSON.stringify({ new_owner_id: newOwnerId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Failed to transfer ownership");
    }
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

  getActiveInvites: async () => {
    // Independent users don't have a workspace_id, so we use the /me/ endpoint
    const res = await apiFetch(`/api/workspaces/invites/me/`);
    if (!res.ok) return { items: [] };
    return res.json();
  },

  respondWorkspaceInvite: async (
    inviteId: number,
    status: "accepted" | "rejected",
  ) => {
    const res = await apiFetch(`/api/workspaces/invites/${inviteId}/respond/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Failed to respond to invite");
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
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Failed to generate invite link");
    }
    return res.json();
  },

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

  updateTeam: async (
    teamId: number,
    payload: {
      name?: string;
      description?: string;
      is_private?: boolean;
      color?: string;
    },
  ) => {
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

  promoteTeamLeader: async (teamId: number, userId: number) => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(
      `/api/workspaces/${wsId}/teams/${teamId}/members/${userId}/promote/`,
      {
        method: "POST",
      },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Failed to promote leader");
    }
    return res.json();
  },

  demoteTeamLeader: async (teamId: number, userId: number) => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(
      `/api/workspaces/${wsId}/teams/${teamId}/members/${userId}/demote/`,
      {
        method: "POST",
      },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Failed to demote leader");
    }
    return res.json();
  },

  getTaskAnalytics: async () => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/tasks/${wsId}/analytics/`);
    if (!res.ok) throw new Error("Failed to fetch task analytics");
    return res.json();
  },

  getMyAttendance: async () => {
    const wsId = getWorkspaceId();
    if (!wsId) return {};
    const res = await fetchWithRateLimit(() =>
      apiFetch(`/api/attendance/${wsId}/me/`),
    );
    if (!res.ok) {
      console.warn(`getMyAttendance rate limited or failed`);
      return {};
    }
    return res.json();
  },

  getOnlineMembers: async () => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/workspaces/${wsId}/presence/`);
    if (!res.ok) throw new Error("Failed to fetch online members");
    return res.json();
  },

  checkIn: async () => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/attendance/${wsId}/checkin/`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to check in");
    return res.json();
  },

  checkOut: async () => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/attendance/${wsId}/checkout/`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to check out");
    return res.json();
  },

  getTeamAttendance: async () => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/attendance/${wsId}/team/`);
    if (!res.ok) throw new Error("Failed to fetch team attendance");
    return res.json();
  },

  getAttendanceConfig: async () => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/attendance/${wsId}/config/`);
    if (!res.ok) throw new Error("Failed to fetch config");
    return res.json();
  },

  // ── Personal Clock APIs (Independent Mode) ───────────────────────────
  getClockStatus: async () => {
    const res = await apiFetch(`/api/accounts/clock-status/`);
    if (!res.ok) throw new Error("Failed to fetch clock status");
    return res.json();
  },

  clockIn: async () => {
    const res = await apiFetch(`/api/accounts/clock-in/`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to clock in");
    return res.json();
  },

  clockOut: async () => {
    const res = await apiFetch(`/api/accounts/clock-out/`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to clock out");
    return res.json();
  },

  getClockHistory: async () => {
    const res = await apiFetch(`/api/accounts/clock-history/`);
    if (!res.ok) throw new Error("Failed to fetch clock history");
    return res.json();
  },

  updateAttendanceConfig: async (payload: any) => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/attendance/${wsId}/config/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update config");
    return res.json();
  },

  getWorkspaceSettings: async () => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/workspaces/${wsId}/settings/`);
    if (!res.ok) throw new Error("Failed to fetch workspace settings");
    return res.json();
  },

  scheduleDeletion: async () => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/workspaces/${wsId}/schedule-deletion/`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to schedule deletion");
    return res.json();
  },

  cancelDeletion: async () => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/workspaces/${wsId}/cancel-deletion/`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to cancel deletion");
    return res.json();
  },
};

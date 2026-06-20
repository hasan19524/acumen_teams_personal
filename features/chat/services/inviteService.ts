// features/chat/services/inviteService.ts
import { apiFetch } from "@/lib/api";
import { getWorkspaceId } from "@/lib/auth";

export type InviteCounts = {
  workspace: number;
  teams: number;
  private_groups: number;
  dm_requests: number;
};

export type WorkspaceInviteItem = {
  id: number;
  token: string;
  role_to_assign: string;
  max_uses: number;
  use_count: number;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  is_valid: boolean;
};

export type DMRequestItem = {
  id: number;
  sender_id: number;
  sender_name: string;
  initial_message: string;
  expires_at: string | null;
  created_at: string;
};

export async function loadInviteCounts(): Promise<InviteCounts> {
  const wsId = getWorkspaceId();
  const res = await apiFetch(`/api/workspaces/${wsId}/invites/counts/`);
  if (!res.ok) throw new Error("Failed to load invite counts");
  return await res.json();
}

export async function loadInviteTab(tab: string): Promise<{ items: any[] }> {
  const wsId = getWorkspaceId();
  const res = await apiFetch(`/api/workspaces/${wsId}/invites/?tab=${tab}`);
  if (!res.ok) throw new Error("Failed to load invite tab");
  return await res.json();
}

// ── Team Invite Types ──────────────────────────────────────────────────

export type TeamInviteItem = {
  id: number;
  team_id: number;
  team_name: string;
  inviter_id: number;
  inviter_name: string;
  expires_at: string | null;
  created_at: string;
};

export type TeamInviteResponse = {
  id: number;
  team_id: number;
  team_name: string;
  status: string;
};

// ── Private Group Invite Types ─────────────────────────────────────────

export type PrivateGroupInviteItem = {
  id: number;
  channel_id: number;
  channel_name: string;
  inviter_id: number;
  inviter_name: string;
  expires_at: string | null;
  created_at: string;
};

export type PrivateGroupInviteResponse = {
  id: number;
  channel_id: number;
  channel_name: string;
  status: string;
};

// ── Team Invite Actions ────────────────────────────────────────────────

export async function respondTeamInvite(
  inviteId: number,
  status: "accepted" | "rejected",
): Promise<TeamInviteResponse> {
  const wsId = getWorkspaceId();
  const res = await apiFetch(
    `/api/workspaces/${wsId}/teams/invite/${inviteId}/`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error || "Failed to respond to team invite");
  return data;
}

// ── Private Group Invite Actions ───────────────────────────────────────

export async function respondGroupInvite(
  inviteId: number,
  status: "accepted" | "rejected",
): Promise<PrivateGroupInviteResponse> {
  const wsId = getWorkspaceId();
  const res = await apiFetch(
    `/api/workspaces/${wsId}/groups/invite/${inviteId}/`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error || "Failed to respond to group invite");
  return data;
}

// ── Group Invite Send ──────────────────────────────────────────────────

export async function sendGroupInvites(
  channelId: number,
  userIds: number[],
): Promise<{ created_count: number; invite_ids: number[] }> {
  const wsId = getWorkspaceId();
  const res = await apiFetch(`/api/workspaces/${wsId}/groups/invite/`, {
    method: "POST",
    body: JSON.stringify({ channel_id: channelId, user_ids: userIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send group invites");
  return data;
}

// ── Cleanup Pending Groups ─────────────────────────────────────────────

export async function cleanupPendingGroups(): Promise<{
  deleted_groups: string[];
  count: number;
}> {
  const wsId = getWorkspaceId();
  const res = await apiFetch(`/api/workspaces/${wsId}/groups/cleanup/`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error || "Failed to cleanup pending groups");
  return data;
}

export async function sendTeamInvite(
  userId: number,
  teamId: number,
): Promise<any> {
  const wsId = getWorkspaceId();
  const res = await apiFetch(`/api/workspaces/${wsId}/teams/invite/`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, team_id: teamId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send team invite");
  return data;
}

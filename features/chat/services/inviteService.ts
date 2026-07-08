// features/chat/services/inviteService.ts
import { apiFetch } from "@/lib/api";
import { getWorkspaceId } from "@/lib/auth";

export type InviteCounts = {
  workspace: number;
  teams: number;
  private_groups: number;
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

export async function loadInviteCounts(): Promise<InviteCounts> {
  const wsId = getWorkspaceId();
  if (!wsId) return { workspace: 0, teams: 0, private_groups: 0 };
  const res = await apiFetch(`/api/workspaces/${wsId}/invites/counts/`);
  if (!res.ok) {
    console.warn("Failed to load invite counts");
    return { workspace: 0, teams: 0, private_groups: 0 };
  }
  return await res.json();
}

export async function loadInviteTab(tab: string): Promise<{ items: any[] }> {
  const wsId = getWorkspaceId();
  const res = await apiFetch(`/api/workspaces/${wsId}/invites/?tab=${tab}`);
  if (!res.ok) throw new Error("Failed to load invite tab");
  return await res.json();
}

// Team Invite Types removed.
// ── Private Group Invite Types ─────────────────────────────────────────

export type PrivateGroupInviteItem = {
  id: number;
  channel_id: number;
  channel_name: string;
  inviter_id: number;
  inviter_name: string;
  status: string;
  expires_at: string | null;
  created_at: string;
};

export type PrivateGroupInviteResponse = {
  id: number;
  channel_id: number;
  channel_name: string;
  status: string;
};

// Team Invite Actions removed.
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

// sendTeamInvite removed.

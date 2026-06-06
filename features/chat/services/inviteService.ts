import { apiFetch } from "@/lib/api";

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
  const res = await apiFetch(`/api/workspaces/invites/counts/`);
  if (!res.ok) throw new Error("Failed to load invite counts");
  return await res.json();
}

export async function loadInviteTab(tab: string): Promise<{ items: any[] }> {
  const res = await apiFetch(`/api/workspaces/invites/?tab=${tab}`);
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

/**
 * Accept or reject a team invite.
 * Accepting auto-joins the team chat channel.
 */
export async function respondTeamInvite(
  inviteId: number,
  status: "accepted" | "rejected",
): Promise<TeamInviteResponse> {
  const res = await apiFetch(`/api/workspaces/teams/invite/${inviteId}/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to respond to team invite");
  return data;
}

// ── Private Group Invite Actions ───────────────────────────────────────

/**
 * Accept or reject a private group invite.
 * Accepting instantly joins the group. If this is the second member,
 * the group activates (is_pending becomes false).
 */
export async function respondGroupInvite(
  inviteId: number,
  status: "accepted" | "rejected",
): Promise<PrivateGroupInviteResponse> {
  const res = await apiFetch(`/api/workspaces/groups/invite/${inviteId}/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to respond to group invite");
  return data;
}

// ── Group Invite Send ──────────────────────────────────────────────────

/**
 * Invite users to a private group.
 * Only creator or group admin can invite.
 */
export async function sendGroupInvites(
  channelId: number,
  userIds: number[],
): Promise<{ created_count: number; invite_ids: number[] }> {
  const res = await apiFetch(`/api/workspaces/groups/invite/`, {
    method: "POST",
    body: JSON.stringify({ channel_id: channelId, user_ids: userIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send group invites");
  return data;
}

// ── Cleanup Pending Groups ─────────────────────────────────────────────

/**
 * Delete pending private groups older than 24h with fewer than 2 members.
 */
export async function cleanupPendingGroups(): Promise<{
  deleted_groups: string[];
  count: number;
}> {
  const res = await apiFetch(`/api/workspaces/groups/cleanup/`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to cleanup pending groups");
  return data;
}

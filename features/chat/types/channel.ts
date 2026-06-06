// features/chat/types/channel.ts

// ── Channel Types (mirrors backend ChannelSerializer) ──────────────────

export type ChannelType = "official" | "team" | "private_group" | "dm";

export type ChannelMemberRole = "admin" | "member";

export type UserMini = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
};

export type Channel = {
  id: number;
  name: string;
  slug: string;
  is_private: boolean;
  is_dm: boolean;
  channel_type: ChannelType;
  owner: number | null;
  owner_details: UserMini | null;
  workspace: number;
  team: number | null;
  team_name: string | null;
  created_by: UserMini;
  created_at: string;
  member_count: number;
  dm_partner: UserMini | null;
  is_member_active: boolean;
  is_pending: boolean; // True if private group awaiting minimum members
};

// ── Channel Member Types ───────────────────────────────────────────────

export type ChannelMember = {
  id?: number;
  channel: number;
  user: number;
  role: ChannelMemberRole;
  joined_at: string;
  is_active: boolean;
  left_at: string | null;
};

// ── Channel Creation Payload ───────────────────────────────────────────

export type CreateChannelPayload = {
  name: string;
  channel_type: ChannelType;
  team_id?: number | null;
};

// ── Legacy type (kept for backward compat during migration) ───────────

export type ChatUser = {
  id: number;
  name: string;
  avatar: string;
  color: string;
  unread: number;
  last: string;
  channel_id: number;
};

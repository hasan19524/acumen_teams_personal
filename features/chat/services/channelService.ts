// features/chat/services/channelService.ts

import { apiFetch } from "@/lib/api";
import { getWorkspaceId } from "@/lib/auth";
import { Channel, CreateChannelPayload } from "../types/channel";
import { Message } from "../types/message";

function parseRawMessage(msg: any): Message {
  return {
    id: msg.id,
    channel: msg.channel,
    sender: msg.sender,
    sender_name: msg.sender_name,
    content: msg.content,
    display_content: msg.display_content,
    client_id: msg.client_id,
    is_edited: msg.is_edited,
    edited_at: msg.edited_at,
    is_deleted: msg.is_deleted,
    reply_to: msg.reply_to,
    attachments: msg.attachments || [],
    reactions: msg.reactions || [],
    reads: msg.reads || [],
    created_at: msg.created_at,
    created_time: msg.created_time,
  };
}

/**
 * Enriches messages by resolving numeric reply_to IDs into
 * full ReplyTo objects using the existing message list.
 */
export function enrichReplyTo(messages: Message[]): Message[] {
  const msgMap = new Map(messages.map((m) => [m.id, m]));
  return messages.map((msg) => {
    if (msg.reply_to != null && typeof msg.reply_to === "number") {
      const original = msgMap.get(msg.reply_to as unknown as number);
      if (original) {
        return {
          ...msg,
          reply_to: {
            id: original.id,
            content: original.content,
            sender: original.sender,
            sender_name: original.sender_name,
            is_deleted: original.is_deleted,
            attachments: original.attachments,
          },
        };
      }
    }
    return msg;
  });
}

// ── Channel APIs ────────────────────────────────────────────────────────

export async function loadChannels(): Promise<Channel[]> {
  const wsId = getWorkspaceId();
  if (!wsId) return [];
  const res = await apiFetch(`/api/chat/${wsId}/channels/`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data)
    ? data.map((item: any) => parseRawChannel(item))
    : [];
}

export async function createChannel(
  payload: CreateChannelPayload,
): Promise<Channel> {
  const wsId = getWorkspaceId();
  const res = await apiFetch(`/api/chat/${wsId}/channels/`, {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      channel_type: payload.channel_type,
      team_id: payload.team_id || undefined,
    }),
  });
  const data = await res.json();
  return parseRawChannel(data);
}

function parseRawChannel(raw: any): Channel {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug || "",
    is_private: raw.is_private || false,
    is_dm: raw.is_dm || false,
    channel_type:
      raw.channel_type ||
      (raw.is_dm ? "dm" : raw.is_private ? "private_group" : "official"),
    owner: raw.owner || null,
    owner_details: raw.owner_details || null,
    workspace: raw.workspace,
    team: raw.team || null,
    team_name: raw.team_name || null,
    created_by: raw.created_by || null,
    created_at: raw.created_at || "",
    member_count: raw.member_count || 0,
    dm_partner: raw.dm_partner || null,
    is_member_active:
      raw.is_member_active !== undefined ? raw.is_member_active : true,
    is_pending: raw.is_pending || false,
    // NEW: Map the sidebar fields from the backend
    last_message: raw.last_message || null,
    last_message_time: raw.last_message_time || null,
    unread_count: raw.unread_count || 0,
  };
}

// ── Message APIs ────────────────────────────────────────────────────────

export async function loadMessages(
  channelId: number,
  limit = 30,
): Promise<{
  messages: Message[];
  pagination: { nextOffset: number; hasOlder: boolean };
}> {
  const wsId = getWorkspaceId();
  const countRes = await apiFetch(
    `/api/chat/${wsId}/messages/${channelId}/?limit=1&offset=0`,
  );
  const countData = await countRes.json();
  const total = countData.total || 0;
  const initialOffset = Math.max(0, total - limit);

  const res = await apiFetch(
    `/api/chat/${wsId}/messages/${channelId}/?limit=${limit}&offset=${initialOffset}`,
  );
  const data = await res.json();
  const rawMessages = Array.isArray(data.results) ? data.results : [];
  const parsed = rawMessages.map(parseRawMessage);
  const enriched = enrichReplyTo(parsed);

  return {
    messages: enriched,
    pagination: {
      nextOffset: Math.max(0, initialOffset - limit),
      hasOlder: initialOffset > 0,
    },
  };
}

export async function loadOlderMessages(
  channelId: number,
  offset: number,
  currentMessages: Message[],
  limit = 30,
): Promise<{
  messages: Message[];
  pagination: { nextOffset: number; hasOlder: boolean };
}> {
  const wsId = getWorkspaceId();
  const res = await apiFetch(
    `/api/chat/${wsId}/messages/${channelId}/?limit=${limit}&offset=${offset}`,
  );
  const data = await res.json();
  const rawMessages = Array.isArray(data.results) ? data.results : [];

  if (rawMessages.length === 0) {
    return {
      messages: [],
      pagination: { nextOffset: offset, hasOlder: false },
    };
  }

  const parsed = rawMessages.map(parseRawMessage);
  const msgMap = new Map([...currentMessages, ...parsed].map((m) => [m.id, m]));
  const enriched = parsed.map((msg: Message) => {
    if (msg.reply_to != null && typeof msg.reply_to === "number") {
      const original = msgMap.get(msg.reply_to as unknown as number);
      if (original) {
        return {
          ...msg,
          reply_to: {
            id: original.id,
            content: original.content,
            sender: original.sender,
            sender_name: original.sender_name,
            is_deleted: original.is_deleted,
            attachments: original.attachments,
          },
        };
      }
    }
    return msg;
  });

  return {
    messages: enriched,
    pagination: {
      nextOffset: Math.max(0, offset - limit),
      hasOlder: offset > 0,
    },
  };
}

export async function deleteMessageForEveryone(
  messageId: number,
): Promise<void> {
  const wsId = getWorkspaceId();
  await apiFetch(`/api/chat/${wsId}/messages/${messageId}/delete/`, {
    method: "DELETE",
  });
}

export async function editMessage(
  messageId: number,
  content: string,
): Promise<void> {
  const wsId = getWorkspaceId();
  await apiFetch(`/api/chat/${wsId}/messages/${messageId}/edit/`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
}

export async function toggleReaction(messageId: number, emoji: string) {
  const wsId = getWorkspaceId();
  const res = await apiFetch(`/api/chat/${wsId}/messages/${messageId}/react/`, {
    method: "POST",
    body: JSON.stringify({ emoji }),
  });
  if (!res.ok) throw new Error("Failed to toggle reaction");
  return res.json();
}

export async function markMessageRead(messageId: number) {
  const wsId = getWorkspaceId();
  const res = await apiFetch(`/api/chat/${wsId}/messages/${messageId}/read/`, {
    method: "POST",
  });
  if (!res.ok) return null;
  return res.json();
}

// ── DM APIs ────────────────────────────────────────────────────────────

export async function loadDMs(): Promise<Channel[]> {
  const wsId = getWorkspaceId();
  if (!wsId) return [];
  const res = await apiFetch(`/api/chat/${wsId}/dms/`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data)
    ? data.map((item: any) => parseRawChannel(item))
    : [];
}
// ── Workspace Users API ────────────────────────────────────────────────

export async function getChannelMembers(channelId: number): Promise<any[]> {
  const wsId = getWorkspaceId();
  const res = await apiFetch(`/api/chat/${wsId}/channels/${channelId}/members/`);
  if (!res.ok) throw new Error("Failed to fetch channel members");
  return res.json();
}

export async function getWorkspaceUsers(): Promise<
  { id: number; username: string; full_name: string }[]
> {
  const wsId = getWorkspaceId();
  const res = await apiFetch(`/api/chat/${wsId}/users/`);
  if (!res.ok) throw new Error("Failed to fetch workspace users");
  return res.json();
}

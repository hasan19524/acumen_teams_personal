// features/chat/services/channelService.ts

import { apiFetch } from "@/lib/api";
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

/**
 * Loads all channels for the current user.
 * Returns full Channel objects with channel_type, team_name, etc.
 */
export async function loadChannels(): Promise<Channel[]> {
  const res = await apiFetch(`/api/chat/channels/`);
  const data = await res.json();
  return data.map((item: any) => parseRawChannel(item));
}

/**
 * Creates a new channel (official, private group, or general).
 */
export async function createChannel(
  payload: CreateChannelPayload,
): Promise<Channel> {
  const res = await apiFetch(`/api/chat/channels/`, {
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

/**
 * Parses raw backend channel response into typed Channel object.
 * Handles both old and new response shapes gracefully.
 */
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
  };
}

// ── Message APIs ────────────────────────────────────────────────────────

/**
 * Loads the most recent messages for a channel (initial load).
 */
export async function loadMessages(
  channelId: number,
  limit = 30,
): Promise<{
  messages: Message[];
  pagination: { nextOffset: number; hasOlder: boolean };
}> {
  const countRes = await apiFetch(
    `/api/chat/messages/${channelId}/?limit=1&offset=0`,
  );
  const countData = await countRes.json();
  const total = countData.total || 0;
  const initialOffset = Math.max(0, total - limit);

  const res = await apiFetch(
    `/api/chat/messages/${channelId}/?limit=${limit}&offset=${initialOffset}`,
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

/**
 * Loads older messages for pagination (scroll up).
 */
export async function loadOlderMessages(
  channelId: number,
  offset: number,
  currentMessages: Message[],
  limit = 30,
): Promise<{
  messages: Message[];
  pagination: { nextOffset: number; hasOlder: boolean };
}> {
  const res = await apiFetch(
    `/api/chat/messages/${channelId}/?limit=${limit}&offset=${offset}`,
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

/**
 * Deletes a message for everyone.
 */
export async function deleteMessageForEveryone(
  messageId: number,
): Promise<void> {
  await apiFetch(`/api/chat/messages/${messageId}/delete/`, {
    method: "DELETE",
  });
}

/**
 * Edits a message.
 */
export async function editMessage(
  messageId: number,
  content: string,
): Promise<void> {
  await apiFetch(`/api/chat/messages/${messageId}/edit/`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
}
export async function toggleReaction(messageId: number, emoji: string) {
  const res = await apiFetch(`/api/chat/messages/${messageId}/react/`, {
    method: "POST",
    body: JSON.stringify({ emoji }),
  });
  if (!res.ok) throw new Error("Failed to toggle reaction");
  return res.json();
}

export async function markMessageRead(messageId: number) {
  const res = await apiFetch(`/api/chat/messages/${messageId}/read/`, {
    method: "POST",
  });
  if (!res.ok) return null; // Non-critical, fail silently
  return res.json();
}

// ── DM APIs ────────────────────────────────────────────────────────────

/**
 * Loads all DM channels for the current user.
 * This is separate from loadChannels() because the backend
 * serves DMs from /api/chat/dms/ and channels from /api/chat/channels/.
 */
export async function loadDMs(): Promise<Channel[]> {
  const res = await apiFetch(`/api/chat/dms/`);
  const data = await res.json();
  return data.map((item: any) => parseRawChannel(item));
}
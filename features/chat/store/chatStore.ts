import { create } from "zustand";
import { Message, WSEventEnvelope } from "../types/message";

const MAX_MESSAGES = 200;

import { Channel } from "../types/channel";

interface ChatStore {
  // --- State ---
  messages: Record<number, Message[]>;
  pagination: Record<number, { nextOffset: number; hasOlder: boolean }>;
  selectedChannelId: number | null;

  // Channel state (Phase 9C)
  channels: Channel[];
  isLoadingChannels: boolean;

  // --- Actions ---
  selectChannel: (channelId: number | null) => void;
  setMessages: (channelId: number, msgs: Message[]) => void;
  prependMessages: (channelId: number, olderMsgs: Message[]) => void;
  setPagination: (
    channelId: number,
    pag: { nextOffset: number; hasOlder: boolean },
  ) => void;
  addOptimisticMessage: (channelId: number, msg: Message) => void;

  /**
   * The single source of truth for all incoming WS events.
   * Replaces the scattered if/else logic in page.tsx.
   */
  handleWSEvent: (envelope: WSEventEnvelope) => void;

  // Typing state
  typingUsers: Record<number, { id: number; username: string }[]>;
  clearTypingUser: (channelId: number, userId: number) => void;

  // Channel actions (Phase 9C)
  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  updateChannel: (channelId: number, updates: Partial<Channel>) => void;
  removeChannel: (channelId: number) => void;

  // Derived channel getters
  getOfficialChannels: () => Channel[];
  getPrivateGroups: () => Channel[];
  getDMs: () => Channel[];
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: {},
  pagination: {},
  selectedChannelId: null,
  channels: [],
  isLoadingChannels: false,
  typingUsers: {},

  selectChannel: (channelId) => {
    set({ selectedChannelId: channelId });
  },

  setMessages: (channelId, msgs) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: msgs.slice(-MAX_MESSAGES), // Cap memory growth
      },
    }));
  },

  prependMessages: (channelId, olderMsgs) => {
    set((state) => {
      const existing = state.messages[channelId] || [];
      const existingIds = new Set(existing.map((m) => m.id));

      // Deduplicate against existing messages
      const uniqueOlder = olderMsgs.filter((m) => !existingIds.has(m.id));

      const combined = [...uniqueOlder, ...existing];
      return {
        messages: {
          ...state.messages,
          [channelId]: combined.slice(-MAX_MESSAGES), // Keep recent, drop oldest if over limit
        },
      };
    });
  },

  setPagination: (channelId, pag) => {
    set((state) => ({
      pagination: {
        ...state.pagination,
        [channelId]: pag,
      },
    }));
  },

  addOptimisticMessage: (channelId, msg) => {
    set((state) => {
      const currentMessages = state.messages[channelId] || [];
      // Append optimistic message to the end
      const updated = [...currentMessages, msg].slice(-MAX_MESSAGES);
      return { messages: { ...state.messages, [channelId]: updated } };
    });
  },

  handleWSEvent: (envelope) => {
    // ── Handle Typing Events FIRST (no 'event' field) ──────────
    if (envelope.type === "typing" && envelope.data) {
      const typingChannelId = envelope.data.channel;
      const typingUser = envelope.data.user;
      if (!typingChannelId || !typingUser) return;

      set((state) => {
        const currentTyping = state.typingUsers[typingChannelId] || [];
        if (currentTyping.some((u) => u.id === typingUser.id)) return state;

        return {
          typingUsers: {
            ...state.typingUsers,
            [typingChannelId]: [...currentTyping, typingUser],
          },
        };
      });
      return;
    }

    // ── All other events require 'event' field ────────────────
    if (!envelope.data || !envelope.event) return;

    set((state) => {
      // ── Message / Reaction / Read Events ───────────────────
      const channelId = envelope.data.channel;
      if (!channelId) return state;
      const currentMessages = state.messages[channelId] || [];

      switch (envelope.event) {
        case "message.created": {
          const msg = envelope.data;
          // 1. Hard Dedup
          if (currentMessages.some((m) => m.id === msg.id)) {
            return state;
          }

          // 2. Optimistic Reconciliation
          if (msg.client_id) {
            const optimisticIndex = currentMessages.findIndex(
              (m) => m.client_id === msg.client_id,
            );
            if (optimisticIndex !== -1) {
              const updated = [...currentMessages];
              const oldMsg = updated[optimisticIndex];

              if (oldMsg._previewUrls) {
                oldMsg._previewUrls.forEach((url) => URL.revokeObjectURL(url));
              }

              updated[optimisticIndex] = { ...msg, _status: "confirmed" };
              return { messages: { ...state.messages, [channelId]: updated } };
            }
          }

          // 3. Standard Append
          const updated = [...currentMessages, msg].slice(-MAX_MESSAGES);
          return { messages: { ...state.messages, [channelId]: updated } };
        }

        case "message.updated": {
          const msg = envelope.data;
          const updated = currentMessages.map((m) =>
            m.id === msg.id ? msg : m,
          );
          return { messages: { ...state.messages, [channelId]: updated } };
        }

        case "message.deleted": {
          const msg = envelope.data;
          const updated = currentMessages.map((m) =>
            m.id === msg.id
              ? {
                  ...m,
                  is_deleted: true,
                  content: "",
                  display_content: "[Message deleted]",
                }
              : m,
          );
          return { messages: { ...state.messages, [channelId]: updated } };
        }

        case "reaction.added": {
          const { message_id, reaction } = envelope.data;
          if (!message_id || !reaction) return state;
          const updated = currentMessages.map((m) =>
            m.id === message_id
              ? {
                  ...m,
                  reactions: [
                    // Remove old reaction by this user with the SAME emoji only
                    // (user can have multiple different emojis on the same message)
                    ...(m.reactions || []).filter(
                      (r: any) => !(r.user?.id === reaction.user?.id && r.emoji === reaction.emoji)
                    ),
                    reaction,
                  ],
                }
              : m,
          );
          return { messages: { ...state.messages, [channelId]: updated } };
        }

        case "reaction.removed": {
          const { message_id, reaction_id, user_id, emoji } = envelope.data;
          if (!message_id) return state;
          const updated = currentMessages.map((m) =>
            m.id === message_id
              ? {
                  ...m,
                  reactions: (m.reactions || []).filter((r: any) => {
                    // Try matching by database ID first
                    if (reaction_id && r.id === reaction_id) return false;
                    // Fallback: match by user_id and emoji
                    if (user_id && emoji && r.user?.id === user_id && r.emoji === emoji) return false;
                    return true;
                  }),
                }
              : m,
          );
          return { messages: { ...state.messages, [channelId]: updated } };
        }

        case "message.read": {
          const { message_id, read } = envelope.data;
          if (!message_id || !read) return state;
          const updated = currentMessages.map((m) =>
            m.id === message_id
              ? { ...m, reads: [...(m.reads || []), read] }
              : m,
          );
          return { messages: { ...state.messages, [channelId]: updated } };
        }

        default:
          return state;
      }
    });
  },

  // ── Typing Actions ──────────────────────────────────────────────

  clearTypingUser: (channelId, userId) => {
    set((state) => {
      const currentTyping = state.typingUsers[channelId] || [];
      return {
        typingUsers: {
          ...state.typingUsers,
          [channelId]: currentTyping.filter((u) => u.id !== userId),
        },
      };
    });
  },

  // ── Channel Actions (Phase 9C) ──────────────────────────────────────

  setChannels: (channels) => {
    set({ channels, isLoadingChannels: false });
  },

  addChannel: (channel) => {
    set((state) => ({
      channels: [channel, ...state.channels],
    }));
  },

  updateChannel: (channelId, updates) => {
    set((state) => ({
      channels: state.channels.map((c) =>
        c.id === channelId ? { ...c, ...updates } : c
      ),
    }));
  },

  removeChannel: (channelId) => {
    set((state) => ({
      channels: state.channels.filter((c) => c.id !== channelId),
    }));
  },

  // ── Derived Getters (Phase 9C) ──────────────────────────────────────

  getOfficialChannels: () => {
    return get().channels.filter((c) => c.channel_type === "official");
  },

  getTeamChannels: () => {
    return get().channels.filter((c) => c.channel_type === "team");
  },

  getPrivateGroups: () => {
    return get().channels.filter((c) => c.channel_type === "private_group");
  },

  getDMs: () => {
    return get().channels.filter((c) => c.channel_type === "dm");
  },
}));

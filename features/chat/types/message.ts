// features/chat/types/message.ts
// Mirrors the backend MessageSerializer exactly, with frontend-only additions for UI state.

/**
 * Miniature user object included in messages and replies.
 * Mirrors the backend's UserMiniSerializer.
 */
export type UserMini = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
};

/**
 * Represents a file attached to a message.
 */
export type Attachment = {
  id: number;
  file_url: string | null;
  original_filename: string;
  file_type: string; // e.g., 'image/png', 'application/pdf'
  file_size: number; // in bytes
};

/**
 * Represents a reaction to a message.
 */
export type Reaction = {
  id: number;
  user: UserMini;
  emoji: string;
};

/**
 * Represents a read receipt for a message.
 */
export type MessageRead = {
  user: UserMini;
  read_at: string;
};

/**
 * Represents the quoted/replied-to message embedded inside a Message.
 * This is what powers the WhatsApp-style reply preview.
 */
export type ReplyTo = {
  id: number;
  content: string;
  sender_name?: string;
  sender?: UserMini;
  is_deleted?: boolean;
  attachments?: Attachment[]; // 🚀 ADDED: Needed so the UI can show "[Message deleted]" in the reply preview
};

/**
 * WebSocket event types for message actions.
 */
export type MessageEvent =
  | "message.created"
  | "message.updated"
  | "message.deleted"
  | "reaction.added"
  | "reaction.removed"
  | "message.read"
  | "typing";

/**
 * The core Message shape. Mirrors the backend MessageSerializer.
 */
export type Message = {
  id: number;
  channel: number;
  sender: UserMini;
  sender_name: string;
  content: string;
  display_content: string;
  client_id: string | null;
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  reply_to: ReplyTo | null; // Uses the updated ReplyTo type above
  attachments: Attachment[];
  reactions: Reaction[];
  reads: MessageRead[];
  created_at: string;
  created_time: string;

  // ── Frontend-only optimistic state (never sent by server) ────────────
  _status?: "pending" | "confirmed" | "failed"; // Tracks if message is sending/sent/failed
  _progress?: number; // 0-100 upload progress for attachments
  _previewUrls?: string[]; // Object URLs for local image previews (must be revoked on confirm)
};

/**
 * Optimistic message state used locally before server confirmation.
 * Extends Message with a mandatory temporary status flag.
 */
export type OptimisticMessage = Message & {
  _status: "pending" | "confirmed" | "failed";
};

/**
 * The unified WebSocket event envelope.
 * All WS payloads from the backend follow this shape.
 */
export type WSEventEnvelope = {
  type: string; // "message", "typing", "presence", "error"
  event?: MessageEvent; // "message.created", "message.updated", etc.
  data?: any; // Varies by event type: Message, Reaction, ReadReceipt, TypingUser, etc.
  // Generic fallback fields for non-message events (typing indicators, presence, etc.)
  [key: string]: any;
};

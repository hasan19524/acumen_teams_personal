// features/chat/types/dmRequest.ts

// ── DM Request Types (mirrors backend DMRequest model) ──────────────────

export type DMRequestStatus = "pending" | "accepted" | "rejected" | "expired";

export type DMRequest = {
  id: number;
  type: "received" | "sent";
  sender_id?: number;
  sender_name?: string;
  receiver_id?: number;
  receiver_name?: string;
  status: DMRequestStatus;
  initial_message?: string;
  dm_channel_id: number | null;
  expires_at: string | null;
  rejected_at: string | null;
  cooldown_until: string | null;
  created_at: string;
};

// ── DM Request Create Payload ───────────────────────────────────────────

export type CreateDMRequestPayload = {
  receiver_id: number;
  initial_message: string;
};

// ── DM Request Respond Payload ──────────────────────────────────────────

export type RespondDMRequestPayload = {
  status: "accepted" | "rejected";
};

// ── DM Request Response ─────────────────────────────────────────────────

export type DMRequestCreateResponse = {
  id: number;
  status: DMRequestStatus;
  receiver_id: number;
  initial_message: string;
  expires_at: string;
  created_at: string;
};

export type DMRequestRespondResponse = {
  id: number;
  status: DMRequestStatus;
  dm_channel_id: number | null;
  rejected_at: string | null;
  cooldown_until: string | null;
  updated_at: string;
};

export type DMRequestUndoResponse = {
  id: number;
  status: DMRequestStatus;
  expires_at: string;
};

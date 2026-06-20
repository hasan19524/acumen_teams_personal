// features/chat/services/dmRequestService.ts

import { apiFetch } from "@/lib/api";
import { getWorkspaceId } from "@/lib/auth";
import {
  DMRequest,
  CreateDMRequestPayload,
  RespondDMRequestPayload,
  DMRequestCreateResponse,
  DMRequestRespondResponse,
  DMRequestUndoResponse,
} from "../types/dmRequest";

/**
 * Loads all DM requests (received and sent) for the current user.
 */
export async function loadDMRequests(): Promise<{
  received: DMRequest[];
  sent: DMRequest[];
}> {
  const wsId = getWorkspaceId();
  const res = await apiFetch(`/api/chat/${wsId}/dm-requests/`);
  if (!res.ok) throw new Error("Failed to load DM requests");
  return await res.json();
}

/**
 * Create a new DM request with an initial intro message.
 * Sender can only send 1 message while the request is pending.
 */
export async function createDMRequest(
  payload: CreateDMRequestPayload,
): Promise<DMRequestCreateResponse> {
  const wsId = getWorkspaceId();
  const res = await apiFetch(`/api/chat/${wsId}/dm-requests/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create DM request");
  return data;
}

/**
 * Accept or reject a DM request.
 * Accepting creates a DM channel and unlocks full messaging.
 */
export async function respondDMRequest(
  requestId: number,
  payload: RespondDMRequestPayload,
): Promise<DMRequestRespondResponse> {
  const wsId = getWorkspaceId();
  const res = await apiFetch(`/api/chat/${wsId}/dm-requests/${requestId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to respond to DM request");
  return data;
}

/**
 * Undo a rejection within the 24-hour window.
 * Reverts the request back to pending state.
 */
export async function undoDMRequestRejection(
  requestId: number,
): Promise<DMRequestUndoResponse> {
  const wsId = getWorkspaceId();
  const res = await apiFetch(
    `/api/chat/${wsId}/dm-requests/${requestId}/undo/`,
    {
      method: "POST",
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to undo rejection");
  return data;
}

/**
 * Helper: Check if a rejected DM request is within the 24h undo window.
 */
export function isWithinUndoWindow(rejectedAt: string | null): boolean {
  if (!rejectedAt) return false;
  const rejectedTime = new Date(rejectedAt).getTime();
  const now = Date.now();
  const hoursElapsed = (now - rejectedTime) / (1000 * 60 * 60);
  return hoursElapsed <= 24;
}

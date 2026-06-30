// features/announcements/services/announcementService.ts
import { apiFetch } from "@/lib/api";
import { getWorkspaceId } from "@/lib/auth";
import {
  Announcement,
  CreateAnnouncementPayload,
} from "@/features/announcements/types/announcement";

export const announcementService = {
  getAnnouncements: async (): Promise<Announcement[]> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/announcements/${wsId}/`);
    if (!res.ok) throw new Error("Failed to fetch announcements");
    const data = await res.json();
    return data.results || data;
  },

  createAnnouncement: async (
    payload: CreateAnnouncementPayload,
  ): Promise<Announcement> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/announcements/${wsId}/create/`, {
      method: "POST",
      body: JSON.stringify({
        title: payload.title,
        content: payload.content,
        priority: payload.priority || "normal",
        pinned: payload.pinned || false,
        team_ids: payload.team_ids || [],
        expiry_days: payload.expiry_days || 60,
      }),
    });
    if (!res.ok) throw new Error("Failed to create announcement");
    return res.json();
  },

  deleteAnnouncement: async (announcementId: number): Promise<void> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(
      `/api/announcements/${wsId}/${announcementId}/delete/`,
      { method: "DELETE" },
    );
    if (!res.ok) throw new Error("Failed to delete announcement");
  },

  markAsRead: async (announcementId: number): Promise<void> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(
      `/api/announcements/${wsId}/${announcementId}/mark-read/`,
      { method: "POST" },
    );
    if (!res.ok) throw new Error("Failed to mark as read");
  },
};

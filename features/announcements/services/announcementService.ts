// features/announcements/services/announcementService.ts

import { apiFetch } from "@/lib/api";
import { getWorkspaceId } from "@/lib/auth";
import {
  Announcement,
  CreateAnnouncementPayload,
} from "@/features/announcements/types/announcement";

export const announcementService = {
  /**
   * Load all announcements visible to the current user
   * (workspace-wide + team-scoped).
   */
  getAnnouncements: async (): Promise<Announcement[]> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/announcements/${wsId}/`);
    if (!res.ok) throw new Error("Failed to fetch announcements");
    const data = await res.json();
    // Handle paginated response
    return data.results || data;
  },

  /**
   * Create an announcement.
   * team_id=null → workspace announcement (admin only)
   * team_id=<id> → team announcement (admin or team leader)
   */
  createAnnouncement: async (
    payload: CreateAnnouncementPayload,
  ): Promise<Announcement> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/announcements/${wsId}/create/`, {
      method: "POST",
      body: JSON.stringify({
        title: payload.title,
        content: payload.content,
        tag: payload.tag || "General",
        priority: payload.priority || "Normal",
        pinned: payload.pinned || false,
        team_id: payload.team_id || undefined,
      }),
    });
    if (!res.ok) throw new Error("Failed to create announcement");
    return res.json();
  },

  /**
   * Delete an announcement.
   */
  deleteAnnouncement: async (announcementId: number): Promise<void> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(
      `/api/announcements/${wsId}/${announcementId}/delete/`,
      {
        method: "DELETE",
      },
    );
    if (!res.ok) throw new Error("Failed to delete announcement");
  },

  // NEW: Mark as read
  markAsRead: async (announcementId: number): Promise<void> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(
      `/api/announcements/${wsId}/${announcementId}/mark-read/`,
      {
        method: "POST",
      },
    );
    if (!res.ok) throw new Error("Failed to mark as read");
  },
};

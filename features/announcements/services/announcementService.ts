// features/announcements/services/announcementService.ts

import { apiFetch } from "@/lib/api";
import {
  Announcement,
  CreateAnnouncementPayload,
} from "../../chat/types/announcement";

export const announcementService = {
  /**
   * Load all announcements visible to the current user
   * (workspace-wide + team-scoped).
   */
  getAnnouncements: async (): Promise<Announcement[]> => {
    const res = await apiFetch("/api/announcements/");
    if (!res.ok) throw new Error("Failed to fetch announcements");
    return res.json();
  },

  /**
   * Create an announcement.
   * team_id=null → workspace announcement (admin only)
   * team_id=<id> → team announcement (admin or team leader)
   */
  createAnnouncement: async (
    payload: CreateAnnouncementPayload,
  ): Promise<Announcement> => {
    const res = await apiFetch("/api/announcements/", {
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
    const res = await apiFetch(`/api/announcements/${announcementId}/`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete announcement");
  },
};

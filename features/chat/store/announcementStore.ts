import { create } from "zustand";
import { Announcement, CreateAnnouncementPayload } from "../types/announcement";
import { announcementService } from "../../announcements/services/announcementService";

interface AnnouncementStore {
  announcements: Announcement[];
  isLoading: boolean;

  fetchAnnouncements: () => Promise<void>;
  createAnnouncement: (payload: CreateAnnouncementPayload) => Promise<void>;
  deleteAnnouncement: (announcementId: number) => Promise<void>;

  // Derived getters
  getWorkspaceAnnouncements: () => Announcement[];
  getTeamAnnouncements: () => Announcement[];
}

export const useAnnouncementStore = create<AnnouncementStore>((set, get) => ({
  announcements: [],
  isLoading: false,

  fetchAnnouncements: async () => {
    set({ isLoading: true });
    try {
      const announcements = await announcementService.getAnnouncements();
      set({ announcements, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
      set({ isLoading: false });
    }
  },

  createAnnouncement: async (payload) => {
    try {
      const announcement =
        await announcementService.createAnnouncement(payload);
      set((state) => ({
        announcements: [announcement, ...state.announcements],
      }));
    } catch (error) {
      console.error("Failed to create announcement:", error);
    }
  },

  deleteAnnouncement: async (announcementId) => {
    const previous = get().announcements;
    set((state) => ({
      announcements: state.announcements.filter((a) => a.id !== announcementId),
    }));

    try {
      await announcementService.deleteAnnouncement(announcementId);
    } catch (error) {
      console.error("Failed to delete announcement:", error);
      set({ announcements: previous });
    }
  },

  getWorkspaceAnnouncements: () => {
    return get().announcements.filter((a) => a.scope === "workspace");
  },

  getTeamAnnouncements: () => {
    return get().announcements.filter((a) => a.scope === "team");
  },
}));

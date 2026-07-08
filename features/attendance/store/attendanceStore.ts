import { create } from "zustand";
import { workspaceService } from "@/features/workspace/workspaceService";
import { invalidateCache } from "@/lib/api"; // Import cache invalidator

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

interface AttendanceState {
  myAttendance: any | null;
  teamAttendance: any[];
  config: any | null;
  lastFetchedMyAtt: number | null;
  isLoadingAction: boolean;
  error: string | null;

  fetchMyAttendance: () => Promise<void>;
  fetchTeamAttendance: () => Promise<void>;
  fetchConfig: () => Promise<void>;
  clockIn: () => Promise<void>;
  clockOut: () => Promise<void>;
  updateConfig: (config: any) => Promise<void>;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  myAttendance: null,
  teamAttendance: [],
  config: null,
  lastFetchedMyAtt: null,
  isLoadingAction: false,
  error: null,

  fetchMyAttendance: async () => {
    const { lastFetchedMyAtt, myAttendance } = get();
    if (
      lastFetchedMyAtt &&
      Date.now() - lastFetchedMyAtt < CACHE_TTL &&
      myAttendance
    )
      return;

    try {
      const data = await workspaceService.getMyAttendance();
      set({ myAttendance: data, lastFetchedMyAtt: Date.now(), error: null });
    } catch (e: any) {
      set({ error: e.message || "Failed to load attendance" });
    }
  },

  fetchTeamAttendance: async () => {
    try {
      const data = await workspaceService.getTeamAttendance();
      set({ teamAttendance: data.teams || [] });
    } catch (e) {}
  },

  fetchConfig: async () => {
    try {
      const data = await workspaceService.getAttendanceConfig();
      set({ config: data });
    } catch (e) {}
  },

  clockIn: async () => {
    set({ isLoadingAction: true });
    try {
      await workspaceService.checkIn();
      invalidateCache(); // FIX: Clear API cache so dashboard fetches fresh stats
      set({ lastFetchedMyAtt: 0 });
      await get().fetchMyAttendance();
    } catch (e: any) {
      throw new Error(e.message || "Failed to clock in");
    } finally {
      set({ isLoadingAction: false });
    }
  },

  clockOut: async () => {
    set({ isLoadingAction: true });
    try {
      await workspaceService.checkOut();
      invalidateCache(); // FIX: Clear API cache so dashboard fetches fresh stats
      set({ lastFetchedMyAtt: 0 });
      await get().fetchMyAttendance();
    } catch (e: any) {
      throw new Error(e.message || "Failed to clock out");
    } finally {
      set({ isLoadingAction: false });
    }
  },

  updateConfig: async (configData) => {
    try {
      await workspaceService.updateAttendanceConfig(configData);
      set({ lastFetchedMyAtt: 0 }); // Force refetch state machine
      await get().fetchMyAttendance();
    } catch (e) {}
  },
}));

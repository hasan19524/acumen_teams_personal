import { create } from "zustand";
import { workspaceService } from "@/features/workspace/workspaceService";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface DashboardState {
  stats: any | null;
  taskAnalytics: any | null;
  lastFetchedStats: number | null;
  isDirtyStats: boolean;
  errorStats: string | null;

  fetchStats: () => Promise<void>;
  fetchTaskAnalytics: () => Promise<void>;
  invalidateStats: () => void;
  refreshStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats: null,
  taskAnalytics: null,
  lastFetchedStats: null,
  isDirtyStats: false,
  errorStats: null,

  fetchStats: async () => {
    const { lastFetchedStats, isDirtyStats } = get();
    if (
      lastFetchedStats &&
      !isDirtyStats &&
      Date.now() - lastFetchedStats < CACHE_TTL
    )
      return;

    try {
      const stats = await workspaceService.getStats();
      set({
        stats,
        lastFetchedStats: Date.now(),
        isDirtyStats: false,
        errorStats: null,
      });
    } catch (e: any) {
      set({ errorStats: e.message || "Failed to load stats" });
    }
  },

  fetchTaskAnalytics: async () => {
    try {
      const data = await workspaceService.getTaskAnalytics();
      set({ taskAnalytics: data });
    } catch (e) {
      // Silent fail for analytics
    }
  },

  invalidateStats: () => set({ isDirtyStats: true }),
  refreshStats: async () => {
    set({ isDirtyStats: true });
    await get().fetchStats();
  },
}));

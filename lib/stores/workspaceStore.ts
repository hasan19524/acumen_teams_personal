import { create } from "zustand";

interface WorkspaceState {
  stats: any | null;
  members: any[];
  teams: any[];
  taskAnalytics: any | null;
  attendanceData: any | null;
  onlineUsers: any[];
  setStats: (stats: any) => void;
  setMembers: (members: any[]) => void;
  setTeams: (teams: any[]) => void;
  setTaskAnalytics: (data: any) => void;
  setAttendanceData: (data: any) => void;
  setOnlineUsers: (users: any[]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  stats: null,
  members: [],
  teams: [],
  taskAnalytics: null,
  attendanceData: null,
  onlineUsers: [],
  setStats: (stats) => set({ stats }),
  setMembers: (members) => set({ members }),
  setTeams: (teams) => set({ teams }),
  setTaskAnalytics: (taskAnalytics) => set({ taskAnalytics }),
  setAttendanceData: (attendanceData) => set({ attendanceData }),
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
}));

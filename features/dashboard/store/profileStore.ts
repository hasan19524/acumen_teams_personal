import { create } from "zustand";

interface ProfileState {
  isProfileOpen: boolean;
  targetUser: any | null;
  openProfile: (user?: any | null) => void;
  closeProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  isProfileOpen: false,
  targetUser: null,
  openProfile: (user = null) => set({ isProfileOpen: true, targetUser: user }),
  closeProfile: () => set({ isProfileOpen: false, targetUser: null }),
}));

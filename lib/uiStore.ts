import { create } from "zustand";

interface UIState {
  isProfileOpen: boolean;
  setProfileOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isProfileOpen: false,
  setProfileOpen: (open) => set({ isProfileOpen: open }),
}));

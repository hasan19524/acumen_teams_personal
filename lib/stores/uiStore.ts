import { create } from "zustand";

type Theme = "dark" | "light";

interface UIState {
  isProfileOpen: boolean;
  setProfileOpen: (open: boolean) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("theme");
  return saved === "light" ? "light" : "dark";
};

const applyThemeToDom = (theme: Theme) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("light", theme === "light");
  localStorage.setItem("theme", theme);
};

export const useUIStore = create<UIState>((set, get) => ({
  isProfileOpen: false,
  setProfileOpen: (open) => set({ isProfileOpen: open }),

  theme: getInitialTheme(),
  setTheme: (theme) => {
    applyThemeToDom(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    applyThemeToDom(next);
    set({ theme: next });
  },
}));

import { create } from "zustand";

const URL_TTL = 55 * 60 * 1000; // 55 minutes
const REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh if less than 5 mins left

function getStableUrl(
  currentUrl: string | null,
  currentExpiry: number,
  newUrl: string | null,
): { url: string | null; expiry: number } {
  if (currentUrl && currentExpiry > Date.now() + REFRESH_THRESHOLD) {
    return { url: currentUrl, expiry: currentExpiry };
  }
  if (!newUrl) return { url: null, expiry: 0 };
  return { url: newUrl, expiry: Date.now() + URL_TTL };
}
// ── 1. Auth Store ─────────────────────────────────────────────────────────
interface AuthStore {
  user: any | null;
  workspaceId: number | null;
  authChecked: boolean;
  avatarUrl: string | null;
  avatarExpiry: number;
  setUser: (user: any) => void;
  setWorkspaceId: (id: number | null) => void;
  setAuthChecked: (checked: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  workspaceId: null,
  authChecked: false,
  avatarUrl: null,
  avatarExpiry: 0,
  setUser: (user: any) => {
    const state = get();
    const newImg = user?.profile_image || null;
    const { url, expiry } = getStableUrl(
      state.avatarUrl,
      state.avatarExpiry,
      newImg,
    );
    set({
      user: { ...(user || {}), profile_image: url },
      workspaceId: user?.workspace_id || null,
      avatarUrl: url,
      avatarExpiry: expiry,
      authChecked: true,
    });
  },
  setWorkspaceId: (id) => set({ workspaceId: id }),
  setAuthChecked: (checked) => set({ authChecked: checked }),
  clearAuth: () =>
    set({
      user: null,
      workspaceId: null,
      authChecked: true,
      avatarUrl: null,
      avatarExpiry: 0,
    }),
}));

// ── 2. Workspace Store ────────────────────────────────────────────────────
interface WorkspaceStore {
  workspace: any | null;
  logoUrl: string | null;
  logoExpiry: number;
  setWorkspace: (ws: any) => void;
  clearWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspace: null,
  logoUrl: null,
  logoExpiry: 0,
  setWorkspace: (ws: any) => {
    const state = get();
    const newLogo = ws?.logo || null;
    const { url, expiry } = getStableUrl(
      state.logoUrl,
      state.logoExpiry,
      newLogo,
    );
    set({
      workspace: { ...(ws || {}), logo: url },
      logoUrl: url,
      logoExpiry: expiry,
    });
  },
  clearWorkspace: () => set({ workspace: null, logoUrl: null, logoExpiry: 0 }),
}));

// ── 3. Team Store ─────────────────────────────────────────────────────────
interface TeamStore {
  teams: any[];
  teamLogos: Record<number, { url: string | null; expiry: number }>;
  setTeams: (teams: any[]) => void;
  clearTeams: () => void;
}

export const useTeamStore = create<TeamStore>((set, get) => ({
  teams: [],
  teamLogos: {},
  setTeams: (teams: any[]) => {
    const state = get();
    const newLogos = { ...state.teamLogos };
    const finalTeams = teams.map((team: any) => {
      if (team.logo) {
        const teamId = Number(team.id);
        const cached = state.teamLogos[teamId];
        const { url, expiry } = getStableUrl(
          cached?.url || null,
          cached?.expiry || 0,
          team.logo,
        );
        newLogos[teamId] = { url, expiry };
        return { ...team, logo: url };
      }
      return team;
    });
    set({ teams: finalTeams, teamLogos: newLogos });
  },
  clearTeams: () => set({ teams: [], teamLogos: {} }),
}));

// ── Reusable Hooks ────────────────────────────────────────────────────────

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}

export function useWorkspace() {
  return useWorkspaceStore((s) => s.workspace);
}

export function useAvatar(user?: any) {
  const currentUser = useAuthStore((s) => s.user);
  const targetUser = user || currentUser;
  return targetUser?.profile_image || null;
}

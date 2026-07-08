import { create } from "zustand";

const URL_TTL = 55 * 60 * 1000; // 55 minutes
const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

export interface AvatarRecord {
  id: number;
  name: string;
  avatarUrl: string | null;
  expiresAt: number;
}

interface AvatarStore {
  users: Record<number, AvatarRecord>;
  upsertUser: (user: any) => void;
  upsertUsers: (users: any[]) => void;
  getUser: (id: number) => AvatarRecord | null;
}

export const useAvatarStore = create<AvatarStore>((set, get) => ({
  users: {},

  upsertUser: (user) => {
    if (!user || (!user.id && !user.user_id)) return;
    const id = user.id || user.user_id;
    const state = get();
    const existing = state.users[id];

    const newName =
      user.full_name ||
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.username ||
      existing?.name ||
      "User";
    const newUrl = user.profile_image || user.avatar_url || user.logo || null;

    // If we already have a valid URL and no new URL is provided, do nothing
    if (
      existing &&
      existing.avatarUrl &&
      existing.expiresAt > Date.now() + REFRESH_THRESHOLD
    ) {
      // FIX: Compare base URL without query parameters to prevent S3 presigned URL flashes
      const existingBase = existing.avatarUrl.split("?")[0];
      const newBase = newUrl ? newUrl.split("?")[0] : null;
      if (!newUrl || newBase === existingBase) {
        return; // Keep existing valid URL to prevent image flash
      }
    }

    set({
      users: {
        ...state.users,
        [id]: {
          id,
          name: newName,
          avatarUrl: newUrl,
          expiresAt: newUrl ? Date.now() + URL_TTL : 0,
        },
      },
    });
  },

  upsertUsers: (users) => {
    if (!Array.isArray(users)) return;
    users.forEach((u) => get().upsertUser(u));
  },

  getUser: (id) => {
    const record = get().users[id];
    if (!record) return null;
    // If expired, return record but with null URL so UI shows initials instead of broken img
    if (record.expiresAt < Date.now()) {
      return { ...record, avatarUrl: null };
    }
    return record;
  },
}));

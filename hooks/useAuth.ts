"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/cache";
import { useAvatarStore } from "@/lib/stores/avatarStore";

interface AuthContextType {
  authChecked: boolean;
  user: any | null;
  workspaceId: number | null;
  isIndependent: boolean;
  refreshUser: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch("/api/accounts/me/");
      if (res.ok) {
        const data = await res.json();
        useAuthStore.getState().setUser(data);
        useAvatarStore.getState().upsertUser(data);

        if (data.workspace_id) {
          localStorage.setItem("workspace_id", String(data.workspace_id));
        } else {
          localStorage.removeItem("workspace_id");
        }
        return data;
      } else if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        useAuthStore.getState().clearAuth();
        if (window.location.pathname.startsWith("/dashboard")) {
          router.replace("/login");
        }
      } else {
        useAuthStore.getState().setAuthChecked(true);
      }
    } catch (error) {
      console.warn("Auth check failed. Retaining current session.");
      useAuthStore.getState().setAuthChecked(true);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      if (pathname.startsWith("/dashboard")) router.replace("/login");
      return;
    }

    const state = useAuthStore.getState();
    if (!state.user) {
      const wsId = localStorage.getItem("workspace_id");
      if (wsId) useAuthStore.getState().setWorkspaceId(Number(wsId));
      useAuthStore.getState().setAuthChecked(true);
      refreshUser();
    }
  }, [pathname, refreshUser, router]);

  // Use selectors to prevent re-render bugs
  const authChecked = useAuthStore((s) => s.authChecked);
  const user = useAuthStore((s) => s.user);
  const workspaceId = useAuthStore((s) => s.workspaceId);

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        authChecked,
        user,
        workspaceId,
        isIndependent: !workspaceId,
        refreshUser,
      },
    },
    children,
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";

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

  // Initialize with static values to prevent SSR Hydration errors
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch("/api/accounts/me/");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setWorkspaceId(data.workspace_id);
        if (data.workspace_id) {
          localStorage.setItem("workspace_id", String(data.workspace_id));
        } else {
          localStorage.removeItem("workspace_id");
        }
        setAuthChecked(true);
        return data;
      } else if (res.status === 401 || res.status === 403) {
        // ONLY logout if the token is actually unauthorized. 
        // Ignore 429 (rate limit) or 500 (server error) so the UI doesn't flash.
        localStorage.clear();
        setAuthChecked(false);
        setWorkspaceId(null);
        router.replace("/login");
      } else {
        // For rate limits (429) or server errors (500), keep the user logged in
        setAuthChecked(true);
      }
    } catch (error) {
      // Network error or rate limit: keep the user logged in to prevent UI flashes.
      // Do NOT change authChecked or workspaceId here. Let the UI keep its current state.
      console.warn("Auth check failed due to network or rate limit. Retaining current session.");
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // If no token and not on login page, redirect
      if (pathname !== "/login") {
        router.replace("/login");
      }
      return;
    }

    // If we have a token but haven't checked auth yet (e.g., right after login)
    if (!authChecked) {
      const wsId = localStorage.getItem("workspace_id");
      if (wsId) setWorkspaceId(Number(wsId));
      setAuthChecked(true);
      refreshUser();
    }
  }, [pathname, authChecked, refreshUser, router]);

  const isIndependent = !workspaceId;

  // Using React.createElement instead of JSX so the file can remain .ts
  return React.createElement(
    AuthContext.Provider,
    { value: { authChecked, user, workspaceId, isIndependent, refreshUser } },
    children,
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

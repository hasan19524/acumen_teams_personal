// hooks/useAuth.ts
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getWorkspaceId } from "@/lib/auth";

export function useAuth(requireRedirect = true) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const redirectRef = useRef(requireRedirect);
  redirectRef.current = requireRedirect;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      if (redirectRef.current) router.replace("/login");
      return;
    }

    // FIX: Use the safe helper which prevents NaN
    const workspaceId = getWorkspaceId();
    if (workspaceId) {
      setAuthChecked(true);
    } else {
      // Fetch workspace_id from backend if missing or invalid
      apiFetch("/api/accounts/me/")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.workspace_id) {
            localStorage.setItem("workspace_id", String(data.workspace_id));
            setAuthChecked(true);
          } else {
            // Invalid session, clear and redirect
            localStorage.clear();
            if (redirectRef.current) router.replace("/login");
          }
        })
        .catch(() => {
          localStorage.clear();
          if (redirectRef.current) router.replace("/login");
        });
    }
  }, [router]);

  return { authChecked };
}

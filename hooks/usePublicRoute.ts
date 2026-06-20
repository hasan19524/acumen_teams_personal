// hooks/usePublicRoute.ts
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function usePublicRoute() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const workspaceId = localStorage.getItem("workspace_id");

    // Only redirect to dashboard if BOTH token and workspace_id exist
    if (token && workspaceId) {
      router.replace("/dashboard");
    }
  }, [router]);
}

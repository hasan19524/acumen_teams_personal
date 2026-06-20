// lib/auth.ts
export function logout(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh");
  localStorage.removeItem("username");
  localStorage.removeItem("user_id");
  localStorage.removeItem("workspace_id"); // NEW
  window.location.href = "/";
}

export function getCurrentUserId(): number | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
    const data = JSON.parse(jsonPayload);
    const id = data.user_id || data.sub || null;
    // FIX: Ensure it always returns a number to match backend sender IDs
    return typeof id === "number" ? id : parseInt(String(id), 10) || null;
  } catch (e) {
    return null;
  }
}

// NEW: Helper to get the active workspace ID from local storage
export function getWorkspaceId(): number | null {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem("workspace_id");
  const parsed = id ? parseInt(id, 10) : null;
  // FIX: Prevent NaN from breaking API URLs
  return Number.isNaN(parsed) ? null : parsed;
}

// NEW: Helper to set the active workspace ID
export function setWorkspaceId(id: number): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("workspace_id", String(id));
  }
}

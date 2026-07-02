const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_URL}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("token", data.access);
      return data.access;
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh");
      localStorage.removeItem("username");
      localStorage.removeItem("workspace_id");
      // Do NOT hard redirect here. Let the AuthProvider handle routing based on the current path.
      return null;
    }
  } catch {
    return null;
  }
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;

  // If it's FormData, DO NOT set Content-Type. The browser must set it with the boundary.
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  let res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    }
  }

  return res;
}

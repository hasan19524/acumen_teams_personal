const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ── Global In-Memory Cache ───────────────────────────────────────────────
const apiCache = new Map<
  string,
  { body: string; timestamp: number; headers: Headers }
>();
const CACHE_TTL = 30000; // 30 seconds - prevents spamming API calls on page navigations

export function invalidateCache() {
  apiCache.clear();
}

function clearAuthAndRedirect() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("username");
    localStorage.removeItem("user_id");
    localStorage.removeItem("workspace_id");
    // Redirect to login if not already there
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) {
    clearAuthAndRedirect();
    return null;
  }

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
      clearAuthAndRedirect();
      return null;
    }
  } catch {
    clearAuthAndRedirect();
    return null;
  }
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;
  const method = options.method?.toUpperCase() || "GET";

  // Mutations MUST clear the cache so the next GET fetches fresh data from the server
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    invalidateCache();
  }

  // If it's a GET request, check the cache first
  if (method === "GET") {
    const cached = apiCache.get(endpoint);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // Return a mock Response object so the frontend behaves exactly as if it made a network request
      return new Response(cached.body, {
        status: 200,
        statusText: "OK",
        headers: cached.headers,
      });
    }
  }

  // If not in cache, prepare the real request
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!isFormData && options.body) {
    headers["Content-Type"] = "application/json";
  }

  let res;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkError) {
    // If the backend is down or crashes, return a fake 503 response
    // so the frontend doesn't crash and can show a clean error.
    return new Response(
      JSON.stringify({ error: "Network error. Is the backend running?" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

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

      // If the retry ALSO fails with 401, force logout
      if (res.status === 401) {
        clearAuthAndRedirect();
      }
    }
  }

  // Cache successful GET responses
  if (method === "GET" && res.ok) {
    const clonedRes = res.clone();
    const body = await clonedRes.text();
    apiCache.set(endpoint, {
      body,
      timestamp: Date.now(),
      headers: clonedRes.headers,
    });
  }

  return res;
}

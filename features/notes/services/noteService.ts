import { apiFetch } from "@/lib/api";
import { Note, Notebook } from "../types/note";

const BASE = "/api/notes";

// Helper to extract the actual error message from Django
async function handleError(res: Response) {
  if (!res.ok) {
    let errorMsg = `Request failed with status ${res.status}`;
    try {
      // Clone the response so we can safely read it as text first
      const text = await res.clone().text();
      try {
        const errData = JSON.parse(text);
        errorMsg = errData.detail || errData.error || text;
      } catch {
        errorMsg = text;
      }
    } catch (e) {
      errorMsg = "Failed to read error response from server.";
    }
    throw new Error(errorMsg);
  }
}

export const noteService = {
  // ── Notes ────────────────────────────────────────────────
  getNotes: async (filter: string): Promise<Note[]> => {
    let url = `${BASE}/notes/`;
    if (filter === "favorites") url += "?favorites=true";
    if (filter === "pinned") url += "?pinned=true";
    if (filter.startsWith("notebook_")) {
      const notebookId = filter.split("_")[1];
      url += `?notebook=${notebookId}`;
    }

    const res = await apiFetch(url);
    await handleError(res);
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results ?? []);
  },

  createNote: async (data: {
    title: string;
    content: string;
    notebook: number | null;
  }): Promise<Note> => {
    const res = await apiFetch(`${BASE}/notes/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    await handleError(res);
    return res.json();
  },

  updateNote: async (id: number, updates: Partial<Note>): Promise<Note> => {
    const res = await apiFetch(`${BASE}/notes/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    await handleError(res);
    return res.json();
  },

  deleteNote: async (id: number): Promise<void> => {
    const res = await apiFetch(`${BASE}/notes/${id}/`, { method: "DELETE" });
    await handleError(res);
  },

  toggleFavorite: async (id: number): Promise<Note> => {
    const res = await apiFetch(`${BASE}/notes/${id}/toggle_favorite/`, {
      method: "POST",
    });
    await handleError(res);
    return res.json();
  },

  togglePin: async (id: number): Promise<Note> => {
    const res = await apiFetch(`${BASE}/notes/${id}/toggle_pin/`, {
      method: "POST",
    });
    await handleError(res);
    return res.json();
  },

  // ── File Upload (Reuses S3 Backend) ──────────────────────
  uploadAttachment: async (noteId: number, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("files", file);

    const res = await apiFetch(`${BASE}/notes/${noteId}/upload/`, {
      method: "POST",
      body: formData,
    });

    await handleError(res);
    const data = await res.json();
    if (!data || data.length === 0)
      throw new Error("No URL returned from server");
    return data[0].url; // Returns the S3 URL
  },

  // ── Notebooks ────────────────────────────────────────────
  getNotebooks: async (): Promise<Notebook[]> => {
    const res = await apiFetch(`${BASE}/notebooks/`);
    await handleError(res);
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results ?? []);
  },

  createNotebook: async (data: {
    name: string;
    color: string;
  }): Promise<Notebook> => {
    const res = await apiFetch(`${BASE}/notebooks/`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    await handleError(res);
    return res.json();
  },

  updateNotebook: async (
    id: number,
    data: { name: string; color: string },
  ): Promise<Notebook> => {
    const res = await apiFetch(`${BASE}/notebooks/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    await handleError(res);
    return res.json();
  },

  deleteNotebook: async (id: number): Promise<void> => {
    const res = await apiFetch(`${BASE}/notebooks/${id}/`, {
      method: "DELETE",
    });
    await handleError(res);
  },
};

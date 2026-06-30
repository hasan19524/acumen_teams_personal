// features/tasks/services/taskService.ts
import { apiFetch } from "@/lib/api";
import { getWorkspaceId } from "@/lib/auth";
import {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  WorkspaceMember,
  TaskAnalytics,
} from "@/features/tasks/types/task";

// ── Rate Limit Handler ──────────────────────────────────────────────────
let isRateLimited = false;

async function fetchWithRateLimit(
  fetchFn: () => Promise<Response>,
  retryCount = 0,
): Promise<Response> {
  if (isRateLimited) {
    return new Response(null, { status: 429 });
  }

  const res = await fetchFn();
  
  if (res.status === 429) {
    isRateLimited = true;
    const { useNotificationStore } = await import("@/features/notification/store/notificationStore");
    useNotificationStore.getState().addNotification({
      notification_type: "rate_limit",
      notification_id: String(Date.now()),
      timestamp: new Date().toISOString(),
      data: {
        title: "⏳ Too Many Requests",
        message: "Please wait 10 seconds while we process your request...",
        avatar_url: null,
      },
    } as any);
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    isRateLimited = false;
  }
  
  return res;
}

export type TaskFilter =
  | "all"
  | "todo"
  | "in_progress"
  | "completed"
  | "overdue"
  | "high_priority";

export const taskService = {
  getTasks: async (
    filter?: TaskFilter,
    archived: boolean = false
  ): Promise<{ results: Task[]; next: string | null }> => {
    const wsId = getWorkspaceId();
    if (!wsId) return { results: [], next: null };
    const params = new URLSearchParams();
    if (filter && filter !== "all") {
      params.append("filter", filter);
    }
    if (archived) {
      params.append("archived", "true");
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetchWithRateLimit(() => apiFetch(`/api/tasks/${wsId}/${query}`));
    if (!res.ok) {
      console.warn(`getTasks rate limited or failed`);
      return { results: [], next: null };
    }
    const data = await res.json();
    return {
      results: data.results || data,
      next: data.next || null,
    };
  },

  // NEW: Fetch the next page using the URL provided by Django
  getTasksNextPage: async (
    nextUrl: string,
  ): Promise<{ results: Task[]; next: string | null }> => {
    // nextUrl is an absolute URL like "http://127.0.0.1:8000/api/tasks/1/?page=2"
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const relativeUrl = nextUrl.replace(apiUrl, "");
    const res = await apiFetch(relativeUrl);
    if (!res.ok) throw new Error("Failed to fetch more tasks");
    const data = await res.json();
    return {
      results: data.results || [],
      next: data.next || null,
    };
  },

  // NEW: Fetch heavy detail data only when a task is opened
  getTaskDetail: async (taskId: number): Promise<Task> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/tasks/${wsId}/${taskId}/`);
    if (!res.ok) throw new Error("Failed to fetch task details");
    return res.json();
  },

  createTask: async (payload: CreateTaskPayload): Promise<Task> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/tasks/${wsId}/create/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create task");
    return res.json();
  },

  updateTask: async (
    taskId: number,
    payload: UpdateTaskPayload,
  ): Promise<Task> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/tasks/${wsId}/${taskId}/update/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update task");
    return res.json();
  },

  archiveTask: async (taskId: number): Promise<void> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/tasks/${wsId}/${taskId}/archive/`, {
      method: "PATCH",
    });
    if (!res.ok) throw new Error("Failed to archive task");
  },

  getWorkspaceMembers: async (): Promise<WorkspaceMember[]> => {
    const wsId = getWorkspaceId();
    if (!wsId) return [];
    const res = await fetchWithRateLimit(() => apiFetch(`/api/tasks/${wsId}/workspace-members/`));
    if (!res.ok) {
      console.warn(`getWorkspaceMembers rate limited or failed`);
      return [];
    }
    return res.json();
  },

  getTeamMembers: async (teamId: number): Promise<WorkspaceMember[]> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/tasks/${wsId}/team-members/${teamId}/`);
    if (!res.ok) throw new Error("Failed to fetch team members");
    return res.json();
  },

  updateTaskMemberStatus: async (
    taskMemberId: number,
    status: string,
  ): Promise<Task> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(
      `/api/tasks/${wsId}/task-member/${taskMemberId}/update-status/`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
    );
    if (!res.ok) throw new Error("Failed to update member status");
    return res.json();
  },

  addComment: async (taskId: number, message: string): Promise<Task> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/tasks/${wsId}/${taskId}/comments/`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error("Failed to add comment");
    return res.json();
  },

  deleteComment: async (commentId: number): Promise<Task> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/tasks/${wsId}/comments/${commentId}/`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete comment");
    return res.json();
  },

  uploadAttachment: async (taskId: number, file: File): Promise<Task> => {
    const wsId = getWorkspaceId();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("file_name", file.name);

    const token = localStorage.getItem("token");
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/tasks/${wsId}/${taskId}/attachments/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );
    if (!res.ok) throw new Error("Failed to upload attachment");
    return res.json();
  },

  deleteAttachment: async (attachmentId: number): Promise<Task> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(
      `/api/tasks/${wsId}/attachments/${attachmentId}/`,
      {
        method: "DELETE",
      },
    );
    if (!res.ok) throw new Error("Failed to delete attachment");
    return res.json();
  },

  approveTask: async (taskId: number): Promise<Task> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/tasks/${wsId}/${taskId}/approve/`, {
      method: "PATCH",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Failed to approve task");
    }
    return res.json();
  },

  rejectTask: async (taskId: number): Promise<Task> => {
    const wsId = getWorkspaceId();
    const res = await apiFetch(`/api/tasks/${wsId}/${taskId}/reject/`, {
      method: "PATCH",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Failed to reject task");
    }
    return res.json();
  },

  fetchAnalytics: async (): Promise<TaskAnalytics> => {
    const wsId = getWorkspaceId();
    if (!wsId) throw new Error("No workspace ID found");
    const res = await fetchWithRateLimit(() => apiFetch(`/api/tasks/${wsId}/analytics/`));
    if (!res.ok) {
      console.warn(`fetchAnalytics rate limited or failed`);
      return {} as TaskAnalytics;
    }
    return res.json();
  },
};

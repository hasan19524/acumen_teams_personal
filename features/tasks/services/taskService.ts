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
  ): Promise<{ results: Task[]; next: string | null }> => {
    const wsId = getWorkspaceId();
    const params = new URLSearchParams();
    if (filter && filter !== "all") {
      params.append("filter", filter);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await apiFetch(`/api/tasks/${wsId}/${query}`);
    if (!res.ok) throw new Error("Failed to fetch tasks");
    const data = await res.json();
    // Handle paginated response
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
    const res = await apiFetch(`/api/tasks/${wsId}/workspace-members/`);
    if (!res.ok) throw new Error("Failed to fetch members");
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
    const res = await apiFetch(`/api/tasks/${wsId}/analytics/`);
    if (!res.ok) throw new Error("Failed to fetch analytics");
    return res.json();
  },
};

// features/tasks/services/taskService.ts

import { apiFetch } from "@/lib/api";
import {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
} from "../../chat/types/task";

export const taskService = {
  /**
   * Load all tasks visible to the current user (personal + team tasks).
   */
  getTasks: async (): Promise<Task[]> => {
    const res = await apiFetch("/api/tasks/");
    if (!res.ok) throw new Error("Failed to fetch tasks");
    return res.json();
  },

  /**
   * Create a new task (personal or team).
   * For team tasks: task_type="team", team_id required.
   * For personal tasks: task_type="personal", no team_id.
   */
  createTask: async (payload: CreateTaskPayload): Promise<Task> => {
    const res = await apiFetch("/api/tasks/", {
      method: "POST",
      body: JSON.stringify({
        title: payload.title,
        task_type: payload.task_type,
        assignee: payload.assignee || "You",
        priority: payload.priority || "Medium",
        status: payload.status || "todo",
        team_id: payload.team_id || undefined,
      }),
    });
    if (!res.ok) throw new Error("Failed to create task");
    return res.json();
  },

  /**
   * Update a task (status, priority, title).
   */
  updateTask: async (
    taskId: number,
    payload: UpdateTaskPayload,
  ): Promise<Task> => {
    const res = await apiFetch(`/api/tasks/${taskId}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update task");
    return res.json();
  },

  /**
   * Delete a task.
   */
  deleteTask: async (taskId: number): Promise<void> => {
    const res = await apiFetch(`/api/tasks/${taskId}/`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete task");
  },
};

// features/tasks/store/taskStore.ts
import { create } from "zustand";
import {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  WorkspaceMember,
  TaskAnalytics,
} from "@/features/tasks/types/task";
import { taskService, TaskFilter } from "../services/taskService";

interface TaskStore {
  tasks: Task[];
  workspaceMembers: WorkspaceMember[];
  isLoading: boolean;
  activeFilter: TaskFilter;
  userRole: string;
  availableTeams: { id: number; name: string }[];

  fetchTasks: (filter?: TaskFilter) => Promise<void>;
  fetchMoreTasks: () => Promise<void>;
  nextTaskPageUrl: string | null;
  fetchTaskDetail: (taskId: number) => Promise<Task | null>;
  setFilter: (filter: TaskFilter) => void;
  createTask: (payload: CreateTaskPayload) => Promise<void>;
  updateTask: (taskId: number, updates: UpdateTaskPayload) => Promise<void>;
  archiveTask: (taskId: number) => Promise<void>;
  fetchWorkspaceMembers: () => Promise<void>;
  setUserRole: (role: string) => void;
  setAvailableTeams: (teams: { id: number; name: string }[]) => void;
  updateTaskMemberStatus: (
    taskMemberId: number,
    status: string,
  ) => Promise<void>;
  addComment: (taskId: number, message: string) => Promise<void>;
  deleteComment: (commentId: number) => Promise<void>;
  uploadAttachment: (taskId: number, file: File) => Promise<void>;
  deleteAttachment: (attachmentId: number) => Promise<void>;
  approveTask: (taskId: number) => Promise<void>;
  rejectTask: (taskId: number) => Promise<void>;
  analytics: TaskAnalytics | null;
  fetchAnalytics: () => Promise<void>;

  getPersonalTasks(userId: number): Task[];
  getAssignedToMeTasks(userId: number): Task[];
  getAssignedByMeTasks(userId: number): Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  workspaceMembers: [],
  isLoading: false,
  activeFilter: "all",
  userRole: "member", // Fixed deprecated role
  availableTeams: [],
  analytics: null,
  nextTaskPageUrl: null, // FIX: Initialize the pagination state

  fetchTasks: async (filter?: TaskFilter) => {
    set({ isLoading: true });
    try {
      const currentFilter = filter || get().activeFilter;
      const { results, next } = await taskService.getTasks(currentFilter);
      set({ tasks: results, nextTaskPageUrl: next, isLoading: false, activeFilter: currentFilter });
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      set({ isLoading: false });
    }
  },

  fetchMoreTasks: async () => {
    const nextUrl = get().nextTaskPageUrl;
    if (!nextUrl) return;
    
    try {
      const { results, next } = await taskService.getTasksNextPage(nextUrl);
      set((state) => ({
        tasks: [...state.tasks, ...results],
        nextTaskPageUrl: next,
      }));
    } catch (error) {
      console.error("Failed to fetch more tasks:", error);
    }
  },

  setFilter: (filter) => {
    set({ activeFilter: filter });
    get().fetchTasks(filter);
  },

  fetchTaskDetail: async (taskId) => {
    try {
      const task = await taskService.getTaskDetail(taskId);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? task : t)),
      }));
      return task;
    } catch (error) {
      console.error("Failed to fetch task detail:", error);
      return null;
    }
  },

  createTask: async (payload) => {
    try {
      const task = await taskService.createTask(payload);
      set((state) => ({ tasks: [task, ...state.tasks] }));
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  },

  updateTask: async (taskId, updates) => {
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? ({ ...t, ...updates } as Task) : t,
      ),
    }));

    try {
      const updated = await taskService.updateTask(taskId, updates);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
      }));
    } catch (error) {
      console.error("Failed to update task:", error);
      set({ tasks: previousTasks });
    }
  },

  archiveTask: async (taskId) => {
    const previousTasks = get().tasks;
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));
    try {
      await taskService.archiveTask(taskId);
    } catch (error) {
      console.error("Failed to archive task:", error);
      set({ tasks: previousTasks });
    }
  },

  fetchWorkspaceMembers: async () => {
    try {
      const members = await taskService.getWorkspaceMembers();
      set({ workspaceMembers: members });
    } catch (error) {
      console.error("Failed to fetch members:", error);
    }
  },

  setUserRole: (role) => set({ userRole: role }),
  setAvailableTeams: (teams) => set({ availableTeams: teams }),

  updateTaskMemberStatus: async (taskMemberId, status) => {
    try {
      const updatedTask = await taskService.updateTaskMemberStatus(
        taskMemberId,
        status,
      );
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === updatedTask.id ? updatedTask : t,
        ),
      }));
    } catch (error) {
      console.error("Failed to update member status:", error);
    }
  },

  addComment: async (taskId, message) => {
    try {
      const updatedTask = await taskService.addComment(taskId, message);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === updatedTask.id ? updatedTask : t,
        ),
      }));
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  },

  deleteComment: async (commentId) => {
    try {
      const updatedTask = await taskService.deleteComment(commentId);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === updatedTask.id ? updatedTask : t,
        ),
      }));
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  },

  uploadAttachment: async (taskId, file) => {
    try {
      const updatedTask = await taskService.uploadAttachment(taskId, file);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === updatedTask.id ? updatedTask : t,
        ),
      }));
    } catch (error) {
      console.error("Failed to upload attachment:", error);
    }
  },

  deleteAttachment: async (attachmentId) => {
    try {
      const updatedTask = await taskService.deleteAttachment(attachmentId);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === updatedTask.id ? updatedTask : t,
        ),
      }));
    } catch (error) {
      console.error("Failed to delete attachment:", error);
    }
  },

  approveTask: async (taskId) => {
    try {
      const updatedTask = await taskService.approveTask(taskId);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === updatedTask.id ? updatedTask : t,
        ),
      }));
    } catch (error) {
      console.error("Failed to approve task:", error);
    }
  },

  rejectTask: async (taskId) => {
    try {
      const updatedTask = await taskService.rejectTask(taskId);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === updatedTask.id ? updatedTask : t,
        ),
      }));
    } catch (error) {
      console.error("Failed to reject task:", error);
    }
  },

  fetchAnalytics: async () => {
    try {
      const data = await taskService.fetchAnalytics();
      set({ analytics: data });
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  },

  getPersonalTasks: (userId: number) => {
    return get().tasks.filter(
      (t) => t.task_type === "personal" && t.created_by === userId,
    );
  },

  getAssignedToMeTasks: (userId: number) => {
    return get().tasks.filter(
      (t) => t.task_type === "assigned" && t.assigned_to === userId,
    );
  },

  getAssignedByMeTasks: (userId: number) => {
    return get().tasks.filter(
      (t) =>
        t.task_type === "assigned" &&
        t.created_by === userId &&
        t.assigned_to !== userId,
    );
  },
}));

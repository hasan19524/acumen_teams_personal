import { create } from "zustand";
import {
  Task,
  TaskType,
  CreateTaskPayload,
  UpdateTaskPayload,
} from "../types/task";
import { taskService } from "../../tasks/services/taskService";

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;

  fetchTasks: () => Promise<void>;
  createTask: (payload: CreateTaskPayload) => Promise<void>;
  updateTask: (taskId: number, updates: UpdateTaskPayload) => Promise<void>;
  deleteTask: (taskId: number) => Promise<void>;

  // Derived getters
  getPersonalTasks: () => Task[];
  getTeamTasks: () => Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const tasks = await taskService.getTasks();
      set({ tasks, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      set({ isLoading: false });
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
    // Optimistic update
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
      // Revert on failure
      get().fetchTasks();
    }
  },

  deleteTask: async (taskId) => {
    // Optimistic delete
    const previous = get().tasks;
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));

    try {
      await taskService.deleteTask(taskId);
    } catch (error) {
      console.error("Failed to delete task:", error);
      set({ tasks: previous });
    }
  },

  getPersonalTasks: () => {
    return get().tasks.filter((t) => t.task_type === "personal");
  },

  getTeamTasks: () => {
    return get().tasks.filter((t) => t.task_type === "team");
  },
}));

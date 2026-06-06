// features/chat/types/task.ts

export type TaskType = "personal" | "team";

export type TaskPriority = "High" | "Medium" | "Low";

export type TaskStatus = "todo" | "progress" | "done";

export type Task = {
  id: number;
  task_type: TaskType;
  title: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  team_id: number | null;
  team_name: string | null;
};

export type CreateTaskPayload = {
  title: string;
  task_type: TaskType;
  assignee?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  team_id?: number | null; // Required if task_type = "team"
};

export type UpdateTaskPayload = {
  status?: TaskStatus;
  priority?: TaskPriority;
  title?: string;
};

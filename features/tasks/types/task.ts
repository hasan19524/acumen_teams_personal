// features/tasks/types/task.ts
export type TaskType = "personal" | "assigned" | "team";
export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus =
  | "todo"
  | "in_progress"
  | "completed"
  | "pending_approval";

export type WorkspaceMember = {
  id: number;
  username: string;
  full_name: string;
};

export type TaskActivity = {
  id: number;
  action: string;
  performed_by: number | null;
  performed_by_details: WorkspaceMember | null;
  detail: string;
  created_at: string;
};

export type TaskComment = {
  id: number;
  task: number;
  author: number;
  author_details: WorkspaceMember;
  message: string;
  created_at: string;
  updated_at: string;
};

export type TaskAttachment = {
  id: number;
  task: number;
  uploaded_by: number;
  uploaded_by_details: WorkspaceMember;
  file: string;
  file_url: string;
  file_name: string;
  created_at: string;
};

export type Task = {
  id: number;
  task_type: TaskType;
  title: string;
  description: string;
  assignee_name: string;
  assigned_to: number | null;
  assigned_to_details: WorkspaceMember | null;
  created_by: number;
  created_by_details: WorkspaceMember | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  team: number | null;
  team_details: TeamDetails | null;
  task_members: TaskMember[];
  team_progress: TeamProgress | null;
  comments?: TaskComment[]; // Optional now (only in Detail API)
  attachments?: TaskAttachment[]; // Optional now (only in Detail API)
  comment_count?: number; // New: returned by List API
  attachment_count?: number; // New: returned by List API
  requires_approval: boolean;
  is_approved: boolean;
  completed_by: number | null;
  completed_by_details: WorkspaceMember | null;
  completed_at: string | null;
  is_archived: boolean;
  approved_by: number | null;
  approved_by_details: WorkspaceMember | null;
  approved_at: string | null;
  is_overdue: boolean;
  activities: TaskActivity[];
  created_at: string;
  updated_at: string;
};

export type CreateTaskPayload = {
  title: string;
  task_type: TaskType;
  description?: string;
  assigned_to?: number | null;
  team_id?: number | null;
  priority?: TaskPriority;
  due_date?: string | null;
  requires_approval?: boolean;
};

export type UpdateTaskPayload = {
  status?: TaskStatus;
  priority?: TaskPriority;
  title?: string;
  description?: string;
  due_date?: string | null;
};

export type TaskMember = {
  id: number;
  user: number;
  user_details: WorkspaceMember;
  status: "todo" | "in_progress" | "completed";
  completed_at: string | null;
};

export type TeamProgress = {
  total: number;
  completed: number;
  in_progress: number;
  todo: number;
  percentage: number;
};

export type TaskAnalytics = {
  total_tasks?: number;
  personal_tasks_count?: number;
  assigned_tasks?: number;
  team_tasks?: number;
  completed?: number;
  pending_approval?: number;
  overdue?: number;
  team_completed?: number;
  team_overdue?: number;
  my_tasks?: number;
  my_completed?: number;
  my_overdue?: number;
};

export type TeamDetails = {
  id: number;
  name: string;
};

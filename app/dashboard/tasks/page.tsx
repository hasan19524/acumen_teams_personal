// app/dashboard/tasks/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useTaskStore } from "@/features/tasks/store/taskStore";
import { Task, TaskPriority, TaskStatus } from "@/features/tasks/types/task";
import { apiFetch } from "@/lib/api";
import { getWorkspaceId, getCurrentUserId } from "@/lib/auth";
import { workspaceService } from "@/features/workspace/workspaceService";
import { TaskUI } from "@/features/tasks/components/TaskUI";

export default function TasksPage() {
  const [userId, setUserId] = useState(0);
  const [userRole, setUserRole] = useState("member");
  const [availableTeams, setAvailableTeams] = useState<
    { id: number; name: string }[]
  >([]);

  const {
    fetchTasks,
    tasks,
    createTask,
    updateTask,
    archiveTask,
    workspaceMembers,
    fetchWorkspaceMembers,
    approveTask,
    rejectTask,
    analytics,
  } = useTaskStore();

  useEffect(() => {
    setUserId(getCurrentUserId() || 0);

    // Fetch real role from backend stats API to avoid stale localStorage
    workspaceService
      .getStats()
      .then((stats) => {
        if (stats?.role) setUserRole(stats.role);
      })
      .catch(() => {
        // Fallback to localStorage just in case stats API fails
        const role = localStorage.getItem("workspace_role") || "member";
        setUserRole(role);
      });

    const wsId = getWorkspaceId();
    if (wsId) {
      apiFetch(`/api/workspaces/${wsId}/teams/`)
        .then((res) => (res.ok ? res.json().then(setAvailableTeams) : null))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchWorkspaceMembers();
    useTaskStore.getState().fetchAnalytics();
  }, [fetchTasks, fetchWorkspaceMembers]);

  // UI State
  const [viewMode, setViewMode] = useState<
    "hub" | "personal" | "received" | "sent" | "team"
  >("hub");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [detailTab, setDetailTab] = useState<
    "overview" | "activity" | "comments" | "attachments" | "approval"
  >("overview");
  const [listLayout, setListLayout] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState<
    "due" | "priority" | "status" | "created"
  >("due");

  // Create Modal State
  const [createStep, setCreateStep] = useState(1);
  const [formType, setFormType] = useState<"personal" | "assigned" | "team">(
    "personal",
  );
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPriority, setFormPriority] = useState<TaskPriority>("medium");
  const [formDue, setFormDue] = useState("");
  const [formAssignTo, setFormAssignTo] = useState("");
  const [formTeamId, setFormTeamId] = useState("");
  const [formRequiresApproval, setFormRequiresApproval] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Comment / Upload State
  const [newComment, setNewComment] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const isAdmin = userRole === "owner" || userRole === "admin";

  const personal = useMemo(
    () =>
      tasks.filter(
        (t) => t.task_type === "personal" && Number(t.created_by) === userId,
      ),
    [tasks, userId],
  );
  const received = useMemo(
    () =>
      tasks.filter(
        (t) => t.task_type === "assigned" && Number(t.assigned_to) === userId,
      ),
    [tasks, userId],
  );
  const sent = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.task_type === "assigned" &&
          Number(t.created_by) === userId &&
          Number(t.assigned_to) !== userId,
      ),
    [tasks, userId],
  );
  const teamTasks = useMemo(
    () => tasks.filter((t) => t.task_type === "team"),
    [tasks],
  );

  const filteredMembers = useMemo(() => {
    let members = workspaceMembers.filter((m) => m.id !== userId);
    if (memberSearch.trim()) {
      members = members.filter(
        (m) =>
          m.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
          m.username?.toLowerCase().includes(memberSearch.toLowerCase()),
      );
    }
    return members;
  }, [workspaceMembers, userId, memberSearch]);

  const openTask = useCallback(async (task: Task) => {
    setSelectedTask(task);
    setDetailTab("overview");
    setNewComment("");

    const detailedTask = await useTaskStore.getState().fetchTaskDetail(task.id);
    if (detailedTask) {
      setSelectedTask((prev) => (prev?.id === task.id ? detailedTask : prev));
    }
  }, []);

  const openCreate = (type?: "personal" | "assigned" | "team") => {
    setFormTitle("");
    setFormDesc("");
    setFormPriority("medium");
    setFormDue("");
    setFormAssignTo("");
    setFormTeamId("");
    setFormRequiresApproval(false);
    setMemberSearch("");
    setCreateStep(1);
    if (type) {
      setFormType(type);
      setCreateStep(2);
    } else {
      setFormType("personal");
    }
    setShowCreate(true);
  };

  const handleCreateTask = async () => {
    if (!formTitle.trim() || isCreating) return;
    setIsCreating(true);
    try {
      await createTask({
        title: formTitle,
        task_type: formType,
        description: formDesc,
        priority: formPriority,
        due_date: formDue || null,
        assigned_to:
          formType === "assigned" && formAssignTo
            ? parseInt(formAssignTo)
            : null,
        team_id:
          formType === "team" && formTeamId ? parseInt(formTeamId) : null,
        requires_approval:
          formType !== "personal" ? formRequiresApproval : false,
      });
      setShowCreate(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTask || !newComment.trim()) return;
    await useTaskStore.getState().addComment(selectedTask.id, newComment);
    setNewComment("");
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    await updateTask(task.id, { status: newStatus });
    if (selectedTask?.id === task.id)
      setSelectedTask({ ...task, status: newStatus });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTask || !e.target.files?.[0]) return;
    setIsUploading(true);
    await useTaskStore
      .getState()
      .uploadAttachment(selectedTask.id, e.target.files[0]);
    setIsUploading(false);
    if (e.target) e.target.value = "";
  };

  const deleteAttachment = (id: number) => {
    useTaskStore.getState().deleteAttachment(id);
  };

  return (
    <TaskUI
      tasks={tasks}
      personal={personal}
      received={received}
      sent={sent}
      teamTasks={teamTasks}
      analytics={analytics}
      workspaceMembers={workspaceMembers}
      filteredMembers={filteredMembers}
      availableTeams={availableTeams}
      userId={userId}
      isAdmin={isAdmin}
      viewMode={viewMode}
      setViewMode={setViewMode}
      selectedTask={selectedTask}
      setSelectedTask={setSelectedTask}
      showCreate={showCreate}
      setShowCreate={setShowCreate}
      detailTab={detailTab}
      setDetailTab={setDetailTab}
      listLayout={listLayout}
      setListLayout={setListLayout}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      activeFilter={activeFilter}
      setActiveFilter={setActiveFilter}
      sortBy={sortBy}
      setSortBy={setSortBy}
      createStep={createStep}
      setCreateStep={setCreateStep}
      formType={formType}
      setFormType={setFormType}
      formTitle={formTitle}
      setFormTitle={setFormTitle}
      formDesc={formDesc}
      setFormDesc={setFormDesc}
      formPriority={formPriority}
      setFormPriority={setFormPriority}
      formDue={formDue}
      setFormDue={setFormDue}
      formAssignTo={formAssignTo}
      setFormAssignTo={setFormAssignTo}
      formTeamId={formTeamId}
      setFormTeamId={setFormTeamId}
      formRequiresApproval={formRequiresApproval}
      setFormRequiresApproval={setFormRequiresApproval}
      memberSearch={memberSearch}
      setMemberSearch={setMemberSearch}
      isCreating={isCreating}
      newComment={newComment}
      setNewComment={setNewComment}
      isUploading={isUploading}
      openCreate={openCreate}
      handleCreateTask={handleCreateTask}
      handleAddComment={handleAddComment}
      handleFileUpload={handleFileUpload}
      handleStatusChange={handleStatusChange}
      approveTask={approveTask}
      rejectTask={rejectTask}
      archiveTask={archiveTask}
      deleteAttachment={deleteAttachment}
    />
  );
}

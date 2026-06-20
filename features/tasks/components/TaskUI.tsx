// features/tasks/components/TaskUI.tsx
"use client";

import { useRef } from "react";
import { Task, TaskPriority, TaskStatus, TaskAnalytics, WorkspaceMember } from "@/features/tasks/types/task";
import { useTaskStore } from "@/features/tasks/store/taskStore";

// ── Design Tokens ─────────────────────────────────────────────────────
const tk = {
  bg: "#020617", surface: "rgba(15,23,42,0.85)", surfaceAlt: "rgba(15,23,42,0.5)", surfaceHover: "rgba(30,41,59,0.9)",
  glass: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.07)", borderHover: "rgba(255,255,255,0.14)", borderFocus: "rgba(168,85,247,0.5)",
  text: "#f1f5f9", textSec: "#94a3b8", textTer: "#475569", purple: "#a855f7", blue: "#3b82f6", amber: "#f59e0b", green: "#10b981", red: "#ef4444", pink: "#ec4899",
};

const priorityConfig: Record<string, { color: string; bg: string; dot: string }> = {
  high: { color: tk.amber, bg: "rgba(245,158,11,0.12)", dot: tk.amber },
  medium: { color: tk.blue, bg: "rgba(59,130,246,0.12)", dot: tk.blue },
  low: { color: tk.textTer, bg: "rgba(71,85,105,0.12)", dot: tk.textTer },
  critical: { color: tk.red, bg: "rgba(239,68,68,0.12)", dot: tk.red }, // Added fallback for legacy data
};

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  todo: { color: tk.textSec, bg: "rgba(148,163,184,0.1)", label: "To Do" },
  in_progress: { color: tk.purple, bg: "rgba(168,85,247,0.12)", label: "In Progress" },
  completed: { color: tk.green, bg: "rgba(16,185,129,0.12)", label: "Completed" },
  pending_approval: { color: tk.amber, bg: "rgba(245,158,11,0.12)", label: "Awaiting Approval" },
};

const isToday = (d: string | null | undefined) => {
  if (!d) return false;
  const t = new Date(d); const now = new Date();
  return t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth() && t.getDate() === now.getDate();
};

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime(); const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now"; if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60); if (hrs < 24) return `${hrs} hr ago`; return `${Math.floor(hrs / 24)} days ago`;
};

interface TaskUIProps {
  tasks: Task[]; personal: Task[]; received: Task[]; sent: Task[]; teamTasks: Task[];
  analytics: TaskAnalytics | null; workspaceMembers: WorkspaceMember[]; filteredMembers: WorkspaceMember[];
  availableTeams: { id: number; name: string }[]; userId: number; isAdmin: boolean;
  viewMode: "hub" | "personal" | "received" | "sent" | "team"; setViewMode: (v: any) => void;
  selectedTask: Task | null; setSelectedTask: (t: Task | null) => void;
  showCreate: boolean; setShowCreate: (v: boolean) => void;
  detailTab: "overview" | "activity" | "comments" | "attachments" | "approval"; setDetailTab: (v: any) => void;
  listLayout: "list" | "grid"; setListLayout: (v: "list" | "grid") => void;
  searchQuery: string; setSearchQuery: (v: string) => void;
  activeFilter: string; setActiveFilter: (v: string) => void;
  sortBy: "due" | "priority" | "status" | "created"; setSortBy: (v: any) => void;
  createStep: number; setCreateStep: (v: number) => void;
  formType: "personal" | "assigned" | "team"; setFormType: (v: any) => void;
  formTitle: string; setFormTitle: (v: string) => void;
  formDesc: string; setFormDesc: (v: string) => void;
  formPriority: TaskPriority; setFormPriority: (v: TaskPriority) => void;
  formDue: string; setFormDue: (v: string) => void;
  formAssignTo: string; setFormAssignTo: (v: string) => void;
  formTeamId: string; setFormTeamId: (v: string) => void;
  formRequiresApproval: boolean; setFormRequiresApproval: (v: boolean) => void;
  memberSearch: string; setMemberSearch: (v: string) => void;
  isCreating: boolean;
  newComment: string; setNewComment: (v: string) => void;
  isUploading: boolean;
  openCreate: (type?: "personal" | "assigned" | "team") => void;
  handleCreateTask: () => void;
  handleAddComment: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleStatusChange: (task: Task, status: TaskStatus) => void;
  approveTask: (id: number) => void;
  rejectTask: (id: number) => void;
  archiveTask: (id: number) => void;
  deleteAttachment: (id: number) => void;
}

export function TaskUI(props: TaskUIProps) {
  const { tasks, viewMode, setViewMode, selectedTask, setSelectedTask, showCreate, openCreate } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);

  let activeList: Task[] = [];
  if (viewMode === "personal") activeList = props.personal;
  else if (viewMode === "received") activeList = props.received;
  else if (viewMode === "sent") activeList = props.sent;
  else if (viewMode === "team") activeList = props.teamTasks;
  else activeList = tasks;

  const filteredList = activeList.filter(t => {
    if (props.searchQuery && !t.title.toLowerCase().includes(props.searchQuery.toLowerCase())) return false;
    if (props.activeFilter !== "all") {
      if (props.activeFilter === "overdue") return t.is_overdue;
      if (props.activeFilter === "approval") return t.status === "pending_approval";
      return t.status === props.activeFilter;
    }
    return true;
  }).sort((a, b) => {
    if (props.sortBy === "priority") return (a.priority === "high" ? 0 : 1) - (b.priority === "high" ? 0 : 1);
    if (props.sortBy === "due") return new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime();
    return 0;
  });

  const dueToday = tasks.filter((t) => isToday(t.due_date) && t.status !== "completed").length;
  const stats = {
    dueToday,
    overdue: props.analytics?.overdue ?? tasks.filter((t) => t.is_overdue).length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    pendingApproval: props.analytics?.pending_approval ?? tasks.filter((t) => t.status === "pending_approval").length,
  };

  const teamStats = {
    completion: props.teamTasks.length ? Math.round((props.teamTasks.filter(t => t.status === "completed").length / props.teamTasks.length) * 100) : 0,
    inProgress: props.teamTasks.filter(t => t.status === "in_progress").length,
    completed: props.teamTasks.filter(t => t.status === "completed").length,
    approval: props.teamTasks.filter(t => t.status === "pending_approval").length,
  };

  const recentActivity = tasks.flatMap((t) => t.activities?.map((a) => ({ ...a, taskTitle: t.title })) || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  const vc = {
    hub: { title: "Tasks", desc: "Manage your work, assignments and team progress" },
    personal: { title: "Personal Tasks", desc: "Tasks that are private and visible only to you.", cta: "+ New Task", ctaType: "personal" },
    received: { title: "Assigned To Me", desc: "Tasks assigned to you by others." },
    sent: { title: "Sent Tasks", desc: "Tasks you have assigned to others.", cta: "+ Assign Work", ctaType: "assigned" },
    team: { title: "Team Tasks", desc: "Tasks assigned to teams and in progress.", cta: "+ Create Team Task", ctaType: "team" },
  }[viewMode];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: ${tk.bg}; }
        .ac-hover { transition: all 0.15s ease; }
        .ac-hover:hover { background: ${tk.surfaceHover} !important; border-color: ${tk.borderHover} !important; }
        .ac-card { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); cursor: pointer; }
        .ac-card:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(0,0,0,0.35); border-color: ${tk.borderHover} !important; }
        .ac-btn { transition: all 0.15s ease; cursor: pointer; }
        .ac-btn:hover { filter: brightness(1.1); }
        .ac-input { width: 100%; padding: 9px 13px; border-radius: 8px; border: 1px solid ${tk.border}; background: rgba(2,6,23,0.8); color: ${tk.text}; font-size: 13px; outline: none; font-family: inherit; }
        .fade-in { animation: acFadeIn 0.25s ease-out; }
        @keyframes acFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .slide-right { animation: acSlideRight 0.28s cubic-bezier(0.4,0,0.2,1); }
        @keyframes acSlideRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .modal-in { animation: acModalIn 0.22s cubic-bezier(0.4,0,0.2,1); }
        @keyframes acModalIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
      `}</style>

      <main style={{ minHeight: "100vh", background: tk.bg, fontFamily: "'Inter', sans-serif", color: tk.text }}>
        <section style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          
          {/* HEADER */}
          <header style={{ padding: "16px 28px", borderBottom: `1px solid ${tk.border}`, background: tk.surface, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {viewMode !== "hub" && <button className="ac-btn" onClick={() => setViewMode("hub")} style={{ background: tk.glass, border: `1px solid ${tk.border}`, color: tk.textSec, padding: "6px 12px", borderRadius: 7, fontSize: 12 }}>← Back</button>}
              <div>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{vc.title}</h1>
                <p style={{ margin: "1px 0 0", color: tk.textTer, fontSize: 12 }}>{vc.desc}</p>
              </div>
            </div>
            {props.isAdmin && viewMode !== "hub" && vc.cta && <button className="ac-btn" onClick={() => openCreate((vc as any).ctaType)} style={{ background: tk.purple, color: "#fff", border: "none", padding: "8px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13 }}>{vc.cta}</button>}
            {props.isAdmin && viewMode === "hub" && <button className="ac-btn" onClick={() => openCreate()} style={{ background: tk.purple, color: "#fff", border: "none", padding: "8px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13 }}>+ Create Task</button>}
          </header>

          {/* CONTENT */}
          <div style={{ flex: 1, overflowY: "auto", padding: 28, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
            
            {/* HUB VIEW */}
            {viewMode === "hub" && (
              <div className="fade-in">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
                  {[
                    { label: "Due Today", count: stats.dueToday, color: tk.blue, icon: "📅" },
                    { label: "Overdue", count: stats.overdue, color: tk.red, icon: "⏰" },
                    { label: "In Progress", count: stats.inProgress, color: tk.purple, icon: "⚡" },
                    { label: "Awaiting Approval", count: stats.pendingApproval, color: tk.amber, icon: "🔔" },
                  ].map(s => (
                    <div key={s.label} style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
                      <div><div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.count}</div><div style={{ fontSize: 11, color: tk.textTer }}>{s.label}</div></div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 28 }}>
                  <div className="ac-card" onClick={() => setViewMode("personal")} style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderLeft: `3px solid ${tk.purple}`, borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 26, marginBottom: 10 }}>📝</div><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Personal Tasks</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: tk.purple }}>{props.personal.length}</div><div style={{ fontSize: 11, color: tk.textTer }}>Total Tasks</div>
                  </div>
                  <div className="ac-card" onClick={() => setViewMode("received")} style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderLeft: `3px solid ${tk.blue}`, borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 26, marginBottom: 10 }}>📥</div><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Assigned To Me</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: tk.blue }}>{props.received.length}</div><div style={{ fontSize: 11, color: tk.textTer }}>Total Tasks</div>
                  </div>
                  <div className="ac-card" onClick={() => setViewMode("sent")} style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderLeft: `3px solid ${tk.green}`, borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 26, marginBottom: 10 }}>🚀</div><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Assigned By Me</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: tk.green }}>{props.sent.length}</div><div style={{ fontSize: 11, color: tk.textTer }}>Total Tasks</div>
                  </div>
                  <div className="ac-card" onClick={() => setViewMode("team")} style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderLeft: `3px solid ${tk.pink}`, borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 26, marginBottom: 10 }}>👥</div><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Team Tasks</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: tk.pink }}>{props.teamTasks.length}</div><div style={{ fontSize: 11, color: tk.textTer }}>Total Tasks</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: 14, padding: 22 }}>
                    <h3 style={{ margin: "0 0 18px", fontSize: 14 }}>Recent Activity</h3>
                    {recentActivity.length === 0 ? <div style={{ color: tk.textTer, fontSize: 13 }}>No recent activity.</div> : recentActivity.map(act => (
                      <div key={act.id} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: tk.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{act.performed_by_details?.full_name?.charAt(0) || "S"}</div>
                        <div><span style={{ fontSize: 12, color: tk.textSec }}><b>{act.performed_by_details?.full_name || "System"}</b> {act.detail} <span style={{ color: tk.purple }}>{act.taskTitle}</span></span><div style={{ fontSize: 10, color: tk.textTer }}>{timeAgo(act.created_at)}</div></div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: 14, padding: 22 }}>
                    <h3 style={{ margin: "0 0 18px", fontSize: 14 }}>Task Overview</h3>
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <svg width={120} height={120} viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="60" cy="60" r="45" fill="none" stroke={tk.border} strokeWidth="12" />
                        {tasks.map((t, i) => {
                          // Simplified donut rendering for brevity
                          return null; 
                        })}
                        <text x="60" y="60" textAnchor="middle" dominantBaseline="middle" style={{ fill: tk.text, fontSize: 20, fontWeight: 800, transform: "rotate(90deg)", transformOrigin: "60px 60px" }}>{tasks.length}</text>
                      </svg>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {Object.values(statusConfig).map(s => (
                          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                            <span style={{ fontSize: 12, color: tk.textSec }}>{s.label}</span>
                            <span style={{ fontSize: 12, color: tk.textTer, marginLeft: "auto" }}>{tasks.filter(t => t.status === Object.keys(statusConfig).find(k => statusConfig[k] === s)).length}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode !== "hub" && (
              <div className="fade-in">
                {viewMode === "team" && props.teamTasks.length > 0 && (
                  <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: 14, padding: 20, marginBottom: 20, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                    <div><div style={{ fontSize: 11, color: tk.textTer, marginBottom: 6 }}>COMPLETION RATE</div><div style={{ fontSize: 22, fontWeight: 800, color: tk.green }}>{teamStats.completion}%</div></div>
                    <div><div style={{ fontSize: 11, color: tk.textTer, marginBottom: 6 }}>IN PROGRESS</div><div style={{ fontSize: 22, fontWeight: 800, color: tk.purple }}>{teamStats.inProgress}</div></div>
                    <div><div style={{ fontSize: 11, color: tk.textTer, marginBottom: 6 }}>COMPLETED</div><div style={{ fontSize: 22, fontWeight: 800, color: tk.green }}>{teamStats.completed}</div></div>
                    <div><div style={{ fontSize: 11, color: tk.textTer, marginBottom: 6 }}>AWAITING APPROVAL</div><div style={{ fontSize: 22, fontWeight: 800, color: tk.amber }}>{teamStats.approval}</div></div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }}>
                  <input className="ac-input" value={props.searchQuery} onChange={(e) => props.setSearchQuery(e.target.value)} placeholder="Search tasks…" style={{ flex: 1, minWidth: 180, maxWidth: 320 }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    {["all", "todo", "in_progress", "completed", "overdue"].map(f => (
                      <button key={f} onClick={() => props.setActiveFilter(f)} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${props.activeFilter === f ? tk.purple : tk.border}`, background: props.activeFilter === f ? "rgba(168,85,247,0.15)" : "transparent", color: props.activeFilter === f ? tk.purple : tk.textTer, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{f.replace("_", " ")}</button>
                    ))}
                  </div>
                  <select value={props.sortBy} onChange={(e) => props.setSortBy(e.target.value)} className="ac-input" style={{ width: "auto", fontSize: 12, padding: "7px 10px" }}>
                    <option value="due">Sort: Due Date</option><option value="priority">Sort: Priority</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {filteredList.map(task => {
                    const p = priorityConfig[task.priority] || priorityConfig.medium;
                    const s = statusConfig[task.status] || statusConfig.todo;
                    return (
                      <div key={task.id} className="ac-card" onClick={() => setSelectedTask(task)} style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderLeft: `3px solid ${task.is_overdue ? tk.red : p.dot}`, borderRadius: 9, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${s.color}`, background: task.status === "completed" ? s.color : "transparent", flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{task.title}</div>
                          <div style={{ fontSize: 11, color: tk.textTer, marginTop: 3 }}>{task.due_date ? `Due ${new Date(task.due_date).toLocaleDateString()}` : "No due date"}</div>
                        </div>
                        <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: s.bg, color: s.color, fontWeight: 600 }}>{s.label}</span>
                      </div>
                    );
                  })}
                  {filteredList.length === 0 && <div style={{ padding: 40, textAlign: "center", color: tk.textTer }}>No tasks found.</div>}
                </div>

                {/* PAGINATION: Load More Button */}
                {/* The store tracks if there is a next page URL from the backend */}
                {useTaskStore.getState().nextTaskPageUrl && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
                    <button 
                      onClick={() => useTaskStore.getState().fetchMoreTasks()}
                      style={{
                        padding: "10px 24px", borderRadius: "8px", border: `1px solid ${tk.borderHover}`,
                        background: tk.surface, color: tk.textSec, fontWeight: 600, fontSize: "13px",
                        cursor: "pointer", transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = tk.surfaceHover; e.currentTarget.style.color = tk.text; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = tk.surface; e.currentTarget.style.color = tk.textSec; }}
                    >
                      Load More Tasks
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DETAIL DRAWER */}
          {selectedTask && (
            <div className="slide-right" style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 478, background: "#0b1628", borderLeft: `1px solid ${tk.border}`, display: "flex", flexDirection: "column", zIndex: 30, boxShadow: "-12px 0 48px rgba(0,0,0,0.45)" }}>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${tk.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 5, background: (priorityConfig[selectedTask.priority] || priorityConfig.medium).bg, color: (priorityConfig[selectedTask.priority] || priorityConfig.medium).color, fontWeight: 700 }}>{selectedTask.priority}</span>
                <select value={selectedTask.status} onChange={(e) => props.handleStatusChange(selectedTask, e.target.value as TaskStatus)} className="ac-input" style={{ width: "auto", fontSize: 12, padding: "4px 10px" }}>
                  <option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="pending_approval">Pending Approval</option>
                </select>
                <button onClick={() => setSelectedTask(null)} style={{ background: tk.glass, border: `1px solid ${tk.border}`, color: tk.textSec, width: 28, height: 28, borderRadius: 6, cursor: "pointer" }}>✕</button>
              </div>
              
              <div style={{ display: "flex", gap: 2, padding: "8px 16px", borderBottom: `1px solid ${tk.border}` }}>
                {["overview", "activity", "comments", "attachments"].map(tab => (
                  <button key={tab} onClick={() => props.setDetailTab(tab as any)} style={{ background: "transparent", border: "none", color: props.detailTab === tab ? tk.text : tk.textTer, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 14px", borderRadius: 6, textTransform: "capitalize" }}>
                    {tab} {tab === "comments" && `(${selectedTask.comments?.length || 0})`}
                  </button>
                ))}
                {selectedTask.status === "pending_approval" && <button onClick={() => props.setDetailTab("approval")} style={{ background: "transparent", border: "none", color: props.detailTab === "approval" ? tk.amber : tk.textTer, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 14px" }}>Approval</button>}
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                {props.detailTab === "overview" && (
                  <div>
                    <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>{selectedTask.title}</h2>
                    <p style={{ margin: 0, color: tk.textSec, fontSize: 13, lineHeight: 1.65 }}>{selectedTask.description || "No description provided."}</p>
                    
                    {selectedTask.team_progress && (
                      <div style={{ marginTop: 24 }}>
                        <div style={{ fontSize: 10, color: tk.textTer, marginBottom: 10 }}>TEAM PROGRESS</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                          <div style={{ height: 5, borderRadius: 3, background: tk.border, overflow: "hidden", flex: 1 }}><div style={{ width: `${selectedTask.team_progress.percentage}%`, height: "100%", background: tk.green }} /></div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: tk.green }}>{selectedTask.team_progress.percentage}%</span>
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {selectedTask.status === "todo" && <button onClick={() => props.handleStatusChange(selectedTask, "in_progress")} style={{ flex: 1, background: "rgba(168,85,247,0.15)", color: tk.purple, border: `1px solid rgba(168,85,247,0.3)`, padding: "9px 14px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>▶ Start Task</button>}
                      {selectedTask.status === "in_progress" && <button onClick={() => props.handleStatusChange(selectedTask, "completed")} style={{ flex: 1, background: "rgba(16,185,129,0.15)", color: tk.green, border: `1px solid rgba(16,185,129,0.3)`, padding: "9px 14px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>✓ Complete</button>}
                    </div>
                  </div>
                )}

                {props.detailTab === "activity" && (
                  <div>
                    {selectedTask.activities?.length === 0 ? <div style={{ color: tk.textTer }}>No activity yet.</div> : selectedTask.activities?.map(act => (
                      <div key={act.id} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: tk.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center" }}>{act.performed_by_details?.full_name?.charAt(0) || "S"}</div>
                        <div><span style={{ fontSize: 13, color: tk.textSec }}><b>{act.performed_by_details?.full_name || "System"}</b> {act.detail}</span><div style={{ fontSize: 11, color: tk.textTer }}>{timeAgo(act.created_at)}</div></div>
                      </div>
                    ))}
                  </div>
                )}

                {props.detailTab === "comments" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {selectedTask.comments?.map(c => (
                      <div key={c.id} style={{ background: tk.glass, border: `1px solid ${tk.border}`, padding: "10px 14px", borderRadius: 10 }}>
                        <b style={{ color: tk.textSec, fontSize: 12 }}>{c.author_details?.full_name}</b>
                        <p style={{ margin: "4px 0 0", color: tk.text, fontSize: 13 }}>{c.message}</p>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <input className="ac-input" value={props.newComment} onChange={(e) => props.setNewComment(e.target.value)} placeholder="Write a comment…" />
                      <button onClick={props.handleAddComment} style={{ background: tk.purple, color: "#fff", border: "none", padding: "0 14px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Send</button>
                    </div>
                  </div>
                )}

                {props.detailTab === "attachments" && (
                  <div>
                    <label style={{ display: "block", padding: "14px", borderRadius: 10, border: `1px dashed ${tk.borderHover}`, background: tk.glass, textAlign: "center", cursor: "pointer", marginBottom: 12 }}>
                      {props.isUploading ? "Uploading…" : "📎 Upload File"}
                      <input ref={fileInputRef} type="file" onChange={props.handleFileUpload} style={{ display: "none" }} />
                    </label>
                    {selectedTask.attachments?.map(a => (
                      <div key={a.id} style={{ background: tk.glass, border: `1px solid ${tk.border}`, padding: "10px 14px", borderRadius: 10, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <a href={a.file_url} target="_blank" rel="noreferrer" style={{ color: tk.blue, textDecoration: "none", fontSize: 13 }}>📎 {a.file_name}</a>
                        <button onClick={() => props.deleteAttachment(a.id)} style={{ background: "none", border: "none", color: tk.textTer, cursor: "pointer" }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {props.detailTab === "approval" && (
                  <div>
                    <div style={{ background: "rgba(245,158,11,0.06)", border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
                      <div style={{ fontWeight: 700, color: tk.amber, fontSize: 14, marginBottom: 6 }}>🔔 Awaiting Your Approval</div>
                      <p style={{ margin: 0, fontSize: 13, color: tk.textSec }}><b>{selectedTask.assigned_to_details?.full_name}</b> has submitted this task for review.</p>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => props.approveTask(selectedTask.id)} style={{ flex: 1, background: "rgba(16,185,129,0.15)", color: tk.green, border: `1px solid rgba(16,185,129,0.3)`, padding: "12px", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>✓ Approve Task</button>
                      <button onClick={() => props.rejectTask(selectedTask.id)} style={{ flex: 1, background: "rgba(239,68,68,0.15)", color: tk.red, border: `1px solid rgba(239,68,68,0.3)`, padding: "12px", borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>✕ Reject & Reopen</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CREATE MODAL */}
          {showCreate && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(5px)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center" }} onClick={() => props.setShowCreate(false)}>
              <div className="modal-in" style={{ background: "#0b1628", border: `1px solid ${tk.borderHover}`, borderRadius: 20, width: 560, maxHeight: "92vh", overflowY: "auto", padding: 28 }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Create Task (Step {props.createStep})</h2>
                  <button onClick={() => props.setShowCreate(false)} style={{ background: tk.glass, border: `1px solid ${tk.border}`, color: tk.textSec, width: 30, height: 30, borderRadius: 7, cursor: "pointer" }}>✕</button>
                </div>

                {props.createStep === 1 && (
                  <div className="fade-in">
                    <p style={{ color: tk.textSec, margin: "0 0 20px", fontSize: 14 }}>What kind of task do you want to create?</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <div className="ac-hover" onClick={() => { props.setFormType("personal"); props.setCreateStep(2); }} style={{ background: tk.glass, border: `1px solid ${tk.border}`, borderRadius: 12, padding: "18px 14px", cursor: "pointer", textAlign: "center" }}><div style={{ fontSize: 26, marginBottom: 8 }}>📝</div><div style={{ fontSize: 13, fontWeight: 600 }}>Personal</div></div>
                      <div className="ac-hover" onClick={() => { props.setFormType("assigned"); props.setCreateStep(2); }} style={{ background: tk.glass, border: `1px solid ${tk.border}`, borderRadius: 12, padding: "18px 14px", cursor: "pointer", textAlign: "center" }}><div style={{ fontSize: 26, marginBottom: 8 }}>👤</div><div style={{ fontSize: 13, fontWeight: 600 }}>Assigned</div></div>
                      <div className="ac-hover" onClick={() => { props.setFormType("team"); props.setCreateStep(2); }} style={{ background: tk.glass, border: `1px solid ${tk.border}`, borderRadius: 12, padding: "18px 14px", cursor: "pointer", textAlign: "center" }}><div style={{ fontSize: 26, marginBottom: 8 }}>👥</div><div style={{ fontSize: 13, fontWeight: 600 }}>Team</div></div>
                    </div>
                  </div>
                )}

                {props.createStep === 2 && (
                  <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div><label style={{ fontSize: 11, fontWeight: 600, color: tk.textTer, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Title *</label><input className="ac-input" value={props.formTitle} onChange={(e) => props.setFormTitle(e.target.value)} placeholder="What needs to be done?" autoFocus /></div>
                    <div><label style={{ fontSize: 11, fontWeight: 600, color: tk.textTer, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Description</label><textarea className="ac-input" value={props.formDesc} onChange={(e) => props.setFormDesc(e.target.value)} placeholder="Add details..." style={{ minHeight: 80, resize: "vertical" }} /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div><label style={{ fontSize: 11, fontWeight: 600, color: tk.textTer, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Priority</label><select className="ac-input" value={props.formPriority} onChange={(e) => props.setFormPriority(e.target.value as TaskPriority)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                      <div><label style={{ fontSize: 11, fontWeight: 600, color: tk.textTer, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Due Date</label><input type="date" className="ac-input" value={props.formDue} onChange={(e) => props.setFormDue(e.target.value)} style={{ colorScheme: "dark" }} /></div>
                    </div>
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                      <button className="ac-btn" onClick={() => props.setCreateStep(1)} style={{ background: "transparent", color: tk.textSec, border: `1px solid ${tk.border}`, padding: "9px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13 }}>← Back</button>
                      <button className="ac-btn" onClick={() => props.formType === "personal" ? props.setCreateStep(4) : props.setCreateStep(3)} disabled={!props.formTitle.trim()} style={{ background: tk.purple, color: "#fff", border: "none", padding: "9px 22px", borderRadius: 8, fontWeight: 600, fontSize: 13, opacity: !props.formTitle.trim() ? 0.5 : 1 }}>Next →</button>
                    </div>
                  </div>
                )}

                {props.createStep === 3 && props.formType !== "personal" && (
                  <div className="fade-in">
                    <p style={{ color: tk.textSec, margin: "0 0 16px", fontSize: 14 }}>{props.formType === "assigned" ? "Select who to assign this task to." : "Select the team for this task."}</p>
                    {props.formType === "assigned" && (
                      <>
                        <input className="ac-input" value={props.memberSearch} onChange={(e) => props.setMemberSearch(e.target.value)} placeholder="Search by name..." style={{ marginBottom: 12 }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                          {props.filteredMembers.map(m => (
                            <div key={m.id} className="ac-hover" onClick={() => props.setFormAssignTo(String(m.id))} style={{ background: props.formAssignTo === String(m.id) ? "rgba(168,85,247,0.1)" : tk.glass, border: `1px solid ${props.formAssignTo === String(m.id) ? tk.purple : tk.border}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 36, height: 36, borderRadius: "50%", background: tk.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{m.full_name?.charAt(0) || "?"}</div>
                              <div><div style={{ fontSize: 13, fontWeight: 600 }}>{m.full_name}</div><div style={{ fontSize: 11, color: tk.textTer }}>@{m.username}</div></div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {props.formType === "team" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                        {props.availableTeams.map(team => (
                          <div key={team.id} className="ac-hover" onClick={() => props.setFormTeamId(String(team.id))} style={{ background: props.formTeamId === String(team.id) ? "rgba(236,72,153,0.1)" : tk.glass, border: `1px solid ${props.formTeamId === String(team.id) ? tk.pink : tk.border}`, borderRadius: 10, padding: "12px 16px", cursor: "pointer" }}>👥 {team.name}</div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                      <button className="ac-btn" onClick={() => props.setCreateStep(2)} style={{ background: "transparent", color: tk.textSec, border: `1px solid ${tk.border}`, padding: "9px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13 }}>← Back</button>
                      <button className="ac-btn" onClick={() => props.setCreateStep(4)} disabled={props.formType === "assigned" ? !props.formAssignTo : !props.formTeamId} style={{ background: tk.purple, color: "#fff", border: "none", padding: "9px 22px", borderRadius: 8, fontWeight: 600, fontSize: 13, opacity: (props.formType === "assigned" ? !props.formAssignTo : !props.formTeamId) ? 0.5 : 1 }}>Next →</button>
                    </div>
                  </div>
                )}

                {props.createStep === 4 && (
                  <div className="fade-in">
                    <p style={{ color: tk.textSec, margin: "0 0 16px", fontSize: 14 }}>Configure task options.</p>
                    <label style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 10, border: `1px solid ${tk.border}`, background: tk.glass, cursor: "pointer", marginBottom: 10 }}>
                      <input type="checkbox" checked={props.formRequiresApproval} onChange={(e) => props.setFormRequiresApproval(e.target.checked)} />
                      <div><div style={{ fontSize: 13, fontWeight: 600 }}>Requires Approval</div><div style={{ fontSize: 11, color: tk.textTer }}>Assignee must submit for approval before completion.</div></div>
                    </label>
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                      <button className="ac-btn" onClick={() => props.formType === "personal" ? props.setCreateStep(2) : props.setCreateStep(3)} style={{ background: "transparent", color: tk.textSec, border: `1px solid ${tk.border}`, padding: "9px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13 }}>← Back</button>
                      <button className="ac-btn" onClick={() => props.setCreateStep(5)} style={{ background: tk.purple, color: "#fff", border: "none", padding: "9px 22px", borderRadius: 8, fontWeight: 600, fontSize: 13 }}>Next →</button>
                    </div>
                  </div>
                )}

                {props.createStep === 5 && (
                  <div className="fade-in">
                    <p style={{ color: tk.textSec, margin: "0 0 16px", fontSize: 14 }}>Review before creating.</p>
                    <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>{props.formTitle || "Untitled Task"}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, background: `${tk.purple}15`, color: tk.purple, fontWeight: 600 }}>{props.formType}</span>
                        <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, background: `${tk.blue}15`, color: tk.blue, fontWeight: 600 }}>{props.formPriority}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="ac-btn" onClick={() => props.setCreateStep(4)} style={{ flex: 1, background: "transparent", color: tk.textSec, border: `1px solid ${tk.border}`, padding: "11px", borderRadius: 9, fontWeight: 600, fontSize: 13 }}>← Back</button>
                      <button className="ac-btn" onClick={props.handleCreateTask} disabled={props.isCreating} style={{ flex: 2, background: tk.purple, color: "#fff", border: "none", padding: "11px", borderRadius: 9, fontWeight: 700, fontSize: 14, opacity: props.isCreating ? 0.5 : 1 }}>{props.isCreating ? "Creating…" : "✓ Create Task"}</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
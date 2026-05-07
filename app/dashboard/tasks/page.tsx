"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";

type Task = { id: number; title: string; assignee: string; priority: string; status: string };

export default function TasksPage() {
  const router = useRouter();

  const [todo, setTodo] = useState<Task[]>([]);
  const [progress, setProgress] = useState<Task[]>([]);
  const [done, setDone] = useState<Task[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://127.0.0.1:8000/api/tasks/", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then((data: any[]) => {
      setTodo(data.filter(t => t.status === "todo"));
      setProgress(data.filter(t => t.status === "progress"));
      setDone(data.filter(t => t.status === "done"));
    }).catch(() => {});
  }, []);
  const [title, setTitle] = useState("");

  const addTask = async () => {
    if (!title.trim()) return;
    const token = localStorage.getItem("token");
    const res = await fetch("http://127.0.0.1:8000/api/tasks/create/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, priority: "Medium", status: "todo" }),
    });
    const task = await res.json();
    if (task.id) setTodo(prev => [task, ...prev]);
    setTitle("");
  };

  const moveTask = async (task: Task, from: "todo" | "progress", to: "progress" | "done") => {
    const token = localStorage.getItem("token");
    const newStatus = to === "progress" ? "progress" : "done";
    await fetch(`http://127.0.0.1:8000/api/tasks/${task.id}/update/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });
    if (from === "todo") {
      setTodo(todo.filter(t => t.id !== task.id));
      setProgress([{ ...task, status: "progress" }, ...progress]);
    }
    if (from === "progress") {
      setProgress(progress.filter(t => t.id !== task.id));
      setDone([{ ...task, status: "done" }, ...done]);
    }
  };

  const Column = ({
    title,
    tasks,
    color,
    type,
  }: {
    title: string;
    tasks: Task[];
    color: string;
    type: "todo" | "progress" | "done";
  }) => (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderTop: `3px solid ${color}`,
        borderRadius: 20,
        padding: 24,
        minHeight: 560,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        boxShadow: "inset 0 4px 20px rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ color: "#fff", margin: 0, fontSize: 18, fontWeight: 600 }}>
          {title}
        </h2>
        <span
          style={{
            background: `${color}20`,
            padding: "4px 12px",
            borderRadius: 999,
            color,
            fontSize: 13,
            fontWeight: 700,
            border: `1px solid ${color}40`,
          }}
        >
          {tasks.length}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            className="premium-card"
            style={{
              background:
                "linear-gradient(145deg,rgba(30,41,59,0.7),rgba(15,23,42,0.7))",
              backdropFilter: "blur(10px)",
              borderRadius: 16,
              padding: 20,
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "grab",
            }}
          >
            <h3
              style={{
                color: "#f8fafc",
                marginTop: 0,
                fontSize: 15,
                fontWeight: 500,
                lineHeight: 1.4,
                marginBottom: 8,
              }}
            >
              {task.title}
            </h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#6366f1,#a855f7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: "bold",
                  color: "#fff",
                }}
              >
                {task.assignee.charAt(0)}
              </div>
              <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                {task.assignee}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 16,
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 6,
                  background:
                    task.priority === "High"
                      ? "rgba(239,68,68,0.15)"
                      : task.priority === "Medium"
                        ? "rgba(245,158,11,0.15)"
                        : "rgba(34,197,94,0.15)",
                  color:
                    task.priority === "High"
                      ? "#fca5a5"
                      : task.priority === "Medium"
                        ? "#fcd34d"
                        : "#86efac",
                  fontWeight: 600,
                  textTransform: "uppercase" as const,
                }}
              >
                {task.priority}
              </span>
              {type === "todo" && (
                <button
                  className="premium-btn"
                  onClick={() => moveTask(task, "todo", "progress")}
                  style={{
                    border: "none",
                    background: "rgba(99,102,241,0.1)",
                    color: "#818cf8",
                    padding: "6px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Start →
                </button>
              )}
              {type === "progress" && (
                <button
                  className="premium-btn"
                  onClick={() => moveTask(task, "progress", "done")}
                  style={{
                    border: "none",
                    background: "rgba(34,197,94,0.1)",
                    color: "#4ade80",
                    padding: "6px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Complete ✓
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        body { margin: 0; background: #020617; }
        .premium-card { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .premium-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.15) !important; }
        .premium-btn:hover { background: rgba(255,255,255,0.1) !important; color: #fff !important; }
        .premium-input::placeholder { color: #475569; }
        .premium-input:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
      `,
        }}
      />
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          background: "radial-gradient(circle at top right,#0f172a,#020617)",
          fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
        }}
      >
        {/* SHARED SIDEBAR */}
        <DashboardSidebar />

        {/* Content — completely unchanged */}
        <section style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <header
            style={{
              padding: "32px 40px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(15,23,42,0.2)",
              backdropFilter: "blur(10px)",
            }}
          >
            <h1
              style={{
                color: "#f8fafc",
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Task Board
            </h1>
            <p
              style={{
                color: "#94a3b8",
                marginTop: 8,
                fontSize: 15,
                marginBottom: 0,
              }}
            >
              Organize and track work across your company seamlessly.
            </p>
          </header>

          <div style={{ padding: 40, flex: 1, overflowY: "auto" }}>
            <div
              style={{
                display: "flex",
                gap: 16,
                marginBottom: 32,
                background: "rgba(30,41,59,0.3)",
                padding: 8,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <input
                className="premium-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                placeholder="What needs to be done?"
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.05)",
                  background: "rgba(15,23,42,0.6)",
                  color: "#fff",
                  fontSize: 15,
                  transition: "all 0.2s",
                }}
              />
              <button
                onClick={addTask}
                style={{
                  background: "#f8fafc",
                  color: "#0f172a",
                  border: "none",
                  padding: "0 28px",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Create Task
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 24,
                alignItems: "start",
              }}
            >
              <Column title="To Do" tasks={todo} color="#f59e0b" type="todo" />
              <Column
                title="In Progress"
                tasks={progress}
                color="#3b82f6"
                type="progress"
              />
              <Column
                title="Completed"
                tasks={done}
                color="#10b981"
                type="done"
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

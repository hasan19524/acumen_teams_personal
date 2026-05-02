"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Task = {
  id: number;
  title: string;
  assignee: string;
  priority: string;
};

export default function TasksPage() {
  const router = useRouter();

  const [todo, setTodo] = useState<Task[]>([
    {
      id: 1,
      title: "Design landing page",
      assignee: "Areesh",
      priority: "High",
    },
    {
      id: 2,
      title: "Call Dubai client",
      assignee: "Amaan",
      priority: "Medium",
    },
  ]);

  const [progress, setProgress] = useState<Task[]>([
    {
      id: 3,
      title: "Fix login API",
      assignee: "Dev Team",
      priority: "High",
    },
  ]);

  const [done, setDone] = useState<Task[]>([
    {
      id: 4,
      title: "Attendance module UI",
      assignee: "Areesh",
      priority: "Done",
    },
  ]);

  const [title, setTitle] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    router.push("/login");
  };

  const addTask = () => {
    if (!title.trim()) return;

    const newTask = {
      id: Date.now(),
      title,
      assignee: "You",
      priority: "Medium",
    };

    setTodo([newTask, ...todo]);
    setTitle("");
  };

  const moveTask = (
    task: Task,
    from: "todo" | "progress",
    to: "progress" | "done"
  ) => {
    if (from === "todo") {
      setTodo(todo.filter((t) => t.id !== task.id));
      setProgress([task, ...progress]);
    }

    if (from === "progress" && to === "done") {
      setProgress(progress.filter((t) => t.id !== task.id));
      setDone([{ ...task, priority: "Done" }, ...done]);
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
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
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
        <h2
          style={{
            color: "#fff",
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h2>

        <span
          style={{
            background: `${color}20`, // 20% opacity hex
            padding: "4px 12px",
            borderRadius: 999,
            color: color,
            fontSize: 13,
            fontWeight: 700,
            border: `1px solid ${color}40`,
          }}
        >
          {tasks.length}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {tasks.map((task) => (
          <div
            key={task.id}
            className="premium-card"
            style={{
              background: "linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.7))",
              backdropFilter: "blur(10px)",
              borderRadius: 16,
              padding: 20,
              border: "1px solid rgba(255, 255, 255, 0.08)",
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

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #a855f7)",
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
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: 13,
                  margin: 0,
                }}
              >
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
                      ? "rgba(239, 68, 68, 0.15)"
                      : task.priority === "Medium"
                      ? "rgba(245, 158, 11, 0.15)"
                      : "rgba(34, 197, 94, 0.15)",
                  color:
                    task.priority === "High"
                      ? "#fca5a5"
                      : task.priority === "Medium"
                      ? "#fcd34d"
                      : "#86efac",
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
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
                    background: "rgba(99, 102, 241, 0.1)",
                    color: "#818cf8",
                    padding: "6px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    transition: "all 0.2s",
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
                    background: "rgba(34, 197, 94, 0.1)",
                    color: "#4ade80",
                    padding: "6px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    transition: "all 0.2s",
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
      <style dangerouslySetInnerHTML={{
        __html: `
          body { margin: 0; background: #020617; }
          .premium-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .premium-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3); border-color: rgba(255,255,255,0.15) !important; }
          .premium-btn:hover { background: rgba(255,255,255,0.1) !important; color: #fff !important; }
          .premium-input::placeholder { color: #475569; }
          .premium-input:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
          .nav-link { transition: all 0.2s ease; }
          .nav-link:hover:not(.active) { background: rgba(255,255,255,0.03) !important; color: #f8fafc !important; }
          .logout-btn { transition: all 0.2s ease; }
          .logout-btn:hover { background: #b91c1c !important; }
        `
      }} />
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          background: "radial-gradient(circle at top right, #0f172a, #020617)",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* SIDEBAR */}
        <aside
          style={{
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(20px)",
            borderRight: "1px solid rgba(255,255,255,0.05)",
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: 24, 
              fontWeight: 800,
              background: "linear-gradient(to right, #fff, #94a3b8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              Acumen Teams
            </h2>

            <p
              style={{
                color: "#64748b",
                fontSize: 13,
                marginTop: 6,
                fontWeight: 500,
                letterSpacing: "0.05em",
                textTransform: "uppercase"
              }}
            >
              Business Workspace
            </p>
          </div>

          <div
            style={{
              marginTop: 40,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {[
              { name: "Dashboard", href: "/dashboard" },
              { name: "Attendance", href: "/dashboard/attendance" },
              { name: "Tasks", href: "/dashboard/tasks", active: true },
              { name: "Chat", href: "/dashboard/chat" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-link ${item.active ? 'active' : ''}`}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  color: item.active ? "#fff" : "#94a3b8",
                  background: item.active
                    ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                    : "transparent",
                  boxShadow: item.active ? "0 4px 14px rgba(99, 102, 241, 0.3)" : "none",
                }}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div style={{ marginTop: "auto" }}>
            <button
              onClick={handleLogout}
              className="logout-btn"
              style={{
                width: "100%",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#f87171",
                padding: "14px",
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* CONTENT */}
        <section style={{ display: "flex", flexDirection: "column" }}>
          {/* TOPBAR */}
          <header
            style={{
              padding: "32px 40px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(15, 23, 42, 0.2)",
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
            {/* ADD TASK */}
            <div
              style={{
                display: "flex",
                gap: 16,
                marginBottom: 32,
                background: "rgba(30, 41, 59, 0.3)",
                padding: 8,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <input
                className="premium-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="What needs to be done?"
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.05)",
                  background: "rgba(15, 23, 42, 0.6)",
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
                  transition: "all 0.2s",
                  boxShadow: "0 4px 14px rgba(255,255,255,0.1)",
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                Create Task
              </button>
            </div>

            {/* BOARD */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 24,
                alignItems: "start",
              }}
            >
              <Column
                title="To Do"
                tasks={todo}
                color="#f59e0b"
                type="todo"
              />

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
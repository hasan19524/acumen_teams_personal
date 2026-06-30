"use client";

import { useEffect, useState } from "react";
import { useTaskStore } from "@/features/tasks/store/taskStore";
import { Search, Archive, ArrowLeft } from "lucide-react";
import { tk } from "@/lib/tokens";

export default function ArchiveView({ onBack }: { onBack: () => void }) {
  const { tasks, fetchTasks, isLoading } = useTaskStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTasks("all", true);
  }, [fetchTasks]);

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: tk.bg,
        color: tk.textPrimary,
        fontFamily: "'Inter', sans-serif",
        padding: "32px 40px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <button
            onClick={onBack}
            style={{
              display: "flex",
              alignItems: "center",
              color: tk.textSecondary,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              gap: 8,
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            <ArrowLeft size={16} /> Back to Active Tasks
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Archive size={28} color={tk.brandLight} />
            <div>
              <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>
                Task Archive
              </h1>
              <p
                style={{
                  margin: "6px 0 0",
                  color: tk.textSecondary,
                  fontSize: "14px",
                }}
              >
                View tasks completed more than 7 weeks ago.
              </p>
            </div>
          </div>
        </div>

        <div style={{ position: "relative", marginBottom: 24, maxWidth: 400 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: tk.textMuted,
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search archived tasks..."
            style={{
              width: "100%",
              padding: "12px 16px 12px 40px",
              borderRadius: 8,
              border: `1px solid ${tk.border}`,
              background: tk.surface,
              color: tk.textPrimary,
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {isLoading && tasks.length === 0 ? (
          <div style={{ color: tk.textMuted }}>Loading archived tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: tk.textMuted,
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: 12,
            }}
          >
            No archived tasks found.
          </div>
        ) : (
          <div
            style={{
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {filteredTasks.map((task, i) => (
              <div
                key={task.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  borderBottom:
                    i !== filteredTasks.length - 1
                      ? `1px solid ${tk.border}`
                      : "none",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: tk.textPrimary,
                    }}
                  >
                    {task.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: tk.textSecondary,
                      marginTop: 4,
                    }}
                  >
                    Completed:{" "}
                    {task.completed_at
                      ? new Date(task.completed_at).toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: tk.surfaceHover,
                    color: tk.textSecondary,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

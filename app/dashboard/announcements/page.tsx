// app/dashboard/announcements/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Bell, Plus, Pin, Trash2, CheckCircle2 } from "lucide-react";
import { useAnnouncementStore } from "@/features/announcements/store/announcementStore";
import { announcementService } from "@/features/announcements/services/announcementService";

// ── Design Tokens ─────────────────────────────────────────────────────
const tk = {
  bg: "#020617", surface: "rgba(15,23,42,0.8)", surfaceHover: "rgba(30,41,59,0.8)",
  border: "rgba(255,255,255,0.06)", borderHover: "rgba(255,255,255,0.14)",
  text: "#f1f5f9", textSecondary: "#94a3b8", textTer: "#64748b", // Fix: renamed textSec to textSecondary
  accent: "#3b82f6", success: "#10b981", danger: "#ef4444", warning: "#f59e0b", purple: "#a855f7",
};

export default function AnnouncementsPage() {
  const {
    announcements,
    fetchAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
    markAsRead,
  } = useAnnouncementStore();
  const [isAdmin, setIsAdmin] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState("Normal");
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("workspace_role") || "member";
    setIsAdmin(role === "owner" || role === "admin");
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handlePublish = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setIsPublishing(true);
    try {
      await createAnnouncement({
        title: newTitle,
        content: newContent,
        priority: newPriority as any,
      });
      setShowModal(false);
      setNewTitle("");
      setNewContent("");
      setNewPriority("Normal");
    } catch (error) {
      console.error("Failed to publish:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    await deleteAnnouncement(id);
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "Critical":
        return {
          bg: "rgba(239,68,68,0.15)",
          color: tk.danger,
          label: "Critical",
        };
      case "High":
        return {
          bg: "rgba(245,158,11,0.15)",
          color: tk.warning,
          label: "High Priority",
        };
      default:
        return {
          bg: "rgba(16,185,129,0.15)",
          color: tk.success,
          label: "Normal",
        };
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: tk.bg,
        color: tk.text,
        fontFamily: "'Inter', sans-serif",
        padding: "32px 40px",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            Announcements
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              color: tk.textSecondary,
              fontSize: "15px",
            }}
          >
            Stay updated with the latest company news and updates.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              height: "40px",
              padding: "0 18px",
              borderRadius: "8px",
              border: "none",
              background: tk.accent,
              color: "#fff",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#4f46e5")}
            onMouseLeave={(e) => (e.currentTarget.style.background = tk.accent)}
          >
            <Plus size={16} /> New Post
          </button>
        )}
      </div>

      {/* LIST */}
      <div
        style={{
          display: "grid",
          gap: "16px",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {announcements.length === 0 && (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: tk.textTer,
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: "16px",
            }}
          >
            <Bell size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
            <div style={{ fontWeight: 600, marginBottom: "4px" }}>
              No Announcements Yet
            </div>
            <div style={{ fontSize: "14px" }}>
              Check back later for updates.
            </div>
          </div>
        )}

        {announcements.map((item) => {
          const pStyle = getPriorityStyle(item.priority);
          return (
            <div
              key={item.id}
              style={{
                background: tk.surface,
                border: `1px solid ${tk.border}`,
                borderLeft: `3px solid ${item.is_read ? tk.border : tk.accent}`,
                borderRadius: "16px",
                padding: "24px",
                transition: "all 0.2s",
                cursor: "pointer",
                opacity: item.is_read ? 0.8 : 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = tk.borderHover;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = tk.border;
                e.currentTarget.style.transform = "translateY(0)";
              }}
              onClick={() => !item.is_read && markAsRead(item.id)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  {!item.is_read && (
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: tk.accent,
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div>
                    <h3
                      style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}
                    >
                      {item.title}
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "4px",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: tk.textTer }}>
                        {item.by}
                      </span>
                      <span style={{ fontSize: "12px", color: tk.textTer }}>
                        •
                      </span>
                      <span style={{ fontSize: "12px", color: tk.textTer }}>
                        {item.time}
                      </span>
                      {item.team_name && (
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: "4px",
                            color: tk.textSecondary

,
                            marginLeft: "4px",
                          }}
                        >
                          {item.team_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {item.pinned && <Pin size={16} color={tk.accent} />}
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      background: pStyle.bg,
                      color: pStyle.color,
                      fontWeight: 600,
                    }}
                  >
                    {pStyle.label}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: tk.textTer,
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "4px",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = tk.danger)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = tk.textTer)
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <p
                style={{
                  margin: 0,
                  color: tk.textSecondary

,
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                {item.content}
              </p>

              {!item.is_read && (
                <div
                  style={{
                    marginTop: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: tk.accent,
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={14} /> Click to mark as read
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#0b1628",
              border: `1px solid ${tk.borderHover}`,
              borderRadius: "20px",
              padding: "28px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{ margin: "0 0 24px", fontSize: "18px", fontWeight: 700 }}
            >
              New Announcement
            </h2>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: tk.textTer,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Title
              </label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Announcement title"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: `1px solid ${tk.border}`,
                  background: tk.bg,
                  color: tk.text,
                  outline: "none",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: tk.textTer,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Content
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Write your message..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: `1px solid ${tk.border}`,
                  background: tk.bg,
                  color: tk.text,
                  outline: "none",
                  fontSize: "14px",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: tk.textTer,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Priority
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: `1px solid ${tk.border}`,
                  background: tk.bg,
                  color: tk.text,
                  outline: "none",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <option value="Normal">Normal</option>
                <option value="High">High Priority</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  border: `1px solid ${tk.border}`,
                  background: "transparent",
                  color: tk.textSecondary

,
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  background: tk.accent,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  opacity: isPublishing ? 0.6 : 1,
                }}
              >
                {isPublishing ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

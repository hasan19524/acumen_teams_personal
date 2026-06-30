// app/dashboard/announcements/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Bell, Search, Archive, AlertTriangle, Plus } from "lucide-react";
import { workspaceService } from "@/features/workspace/workspaceService";
import { apiFetch } from "@/lib/api";
import { getWorkspaceId } from "@/lib/auth";
import { tk, Announcement, Team } from "@/features/announcements/lib";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";
import { AnnouncementModal } from "@/features/announcements/components/AnnouncementModal";
import { AnnouncementDrawer } from "@/features/announcements/components/AnnouncementDrawer";

export default function AnnouncementsPage() {
  const [role, setRole] = useState("member");
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "archive">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [initialData, setInitialData] = useState<Announcement | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const canPost = role === "owner" || role === "admin" || role === "leader";

  useEffect(() => {
    workspaceService
      .getStats()
      .then((s: any) => setRole(s?.role || "member"))
      .catch(() => {});
    workspaceService
      .getTeams()
      .then((t: any) => setUserTeams(t || []))
      .catch(() => {});
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const wsId = getWorkspaceId();
    try {
      const res = await apiFetch(
        `/api/announcements/${wsId}/?filter=${activeTab}&search=${searchQuery}`,
      );
      const data = await res.json();
      setAnnouncements(data.results || []);
    } catch {
      setAnnouncements([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const delay = setTimeout(fetchAnnouncements, 300);
    return () => clearTimeout(delay);
  }, [activeTab, searchQuery]);

  const fetchAnnouncementDetail = async (id: number) => {
    setDetailLoading(true);
    const wsId = getWorkspaceId();
    try {
      const res = await apiFetch(`/api/announcements/${wsId}/${id}/`);
      if (res.ok) {
        const data = await res.json();
        setSelectedAnn((prev) => (prev ? { ...prev, ...data } : data));
      }
    } catch (e) {
      console.error(e);
    }
    setDetailLoading(false);
  };

  const openDetail = (item: Announcement) => {
    setSelectedAnn(item);
    if (!item.is_read) handleAction(item.id, "read");
    fetchAnnouncementDetail(item.id);
  };

  const handlePublish = async (formData: any) => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    setIsPublishing(true);
    const wsId = getWorkspaceId();

    try {
      if (editingId) {
        await apiFetch(`/api/announcements/${wsId}/${editingId}/update/`, {
          method: "PATCH",
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
            priority: formData.priority,
            pinned: formData.pinned,
          }),
        });
      } else {
        const res = await apiFetch(`/api/announcements/${wsId}/create/`, {
          method: "POST",
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
            priority: formData.priority,
            pinned: formData.pinned,
            team_ids: formData.team_ids,
            expiry_days: formData.expiry_days,
          }),
        });
        if (!res.ok) throw new Error("Failed to create");
        const newAnn = await res.json();
        if (formData.pendingFiles.length > 0 && newAnn.id) {
          const form = new FormData();
          formData.pendingFiles.forEach((file: File) =>
            form.append("files", file),
          );
          await apiFetch(
            `/api/announcements/${wsId}/${newAnn.id}/attachments/`,
            {
              method: "POST",
              body: form,
            },
          );
        }
      }
      setShowModal(false);
      setEditingId(null);
      setInitialData(null);
      fetchAnnouncements();
    } catch (e) {
      console.error(e);
    }
    setIsPublishing(false);
  };

  const handleAction = async (
    id: number,
    action: "pin" | "archive" | "read",
  ) => {
    const wsId = getWorkspaceId();
    try {
      if (action === "pin")
        await apiFetch(`/api/announcements/${wsId}/${id}/pin/`, {
          method: "PATCH",
        });
      else if (action === "archive")
        await apiFetch(`/api/announcements/${wsId}/${id}/archive/`, {
          method: "PATCH",
        });
      else if (action === "read")
        await apiFetch(`/api/announcements/${wsId}/${id}/mark-read/`, {
          method: "POST",
        });

      fetchAnnouncements();
      if (selectedAnn?.id === id) {
        setSelectedAnn((prev) =>
          prev
            ? {
                ...prev,
                [action === "pin"
                  ? "pinned"
                  : action === "archive"
                    ? "is_archived"
                    : "is_read"]:
                  action === "pin"
                    ? !prev.pinned
                    : action === "archive"
                      ? !prev.is_archived
                      : true,
              }
            : null,
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    const wsId = getWorkspaceId();
    try {
      await apiFetch(`/api/announcements/${wsId}/${confirmDeleteId}/delete/`, {
        method: "DELETE",
      });
      setConfirmDeleteId(null);
      if (selectedAnn?.id === confirmDeleteId) setSelectedAnn(null);
      fetchAnnouncements();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditClick = (item: Announcement) => {
    setSelectedAnn(null);
    setEditingId(item.id);
    setInitialData(item);
    setShowModal(true);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: tk.bg,
        color: tk.textPrimary,
        fontFamily: "'Inter', sans-serif",
        padding: "40px 24px",
      }}
    >
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .drawer-slide { animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .modal-fade { animation: fadeIn 0.2s ease-out; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .shimmer-bg { background: linear-gradient(90deg, ${tk.surface} 25%, ${tk.surfaceHover} 50%, ${tk.surface} 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: ${tk.border}; border-radius: 3px; }
        .ann-card { transition: all 0.2s ease; } .ann-card:hover { background: ${tk.surfaceHover}; border-color: ${tk.borderHover}; transform: translateX(4px); }
      `}</style>

            {/* PREMIUM LAYOUT WRAPPER */}
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: 700,
                letterSpacing: "-0.4px",
              }}
            >
              Announcements
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                color: tk.textSecondary,
                fontSize: "14px",
              }}
            >
              Stay updated with company news and updates.
            </p>
          </div>
          {canPost && (
            <button
              onClick={() => {
                setEditingId(null);
                setInitialData(null);
                setShowModal(true);
              }}
              style={{
                height: "40px",
                padding: "0 20px",
                borderRadius: "8px",
                border: "none",
                background: tk.brand,
                color: "#fff",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
                boxShadow: `0 4px 12px ${tk.brand}40`,
                transition: "filter 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.filter = "brightness(1.1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.filter = "brightness(1)")
              }
            >
              <Plus size={16} /> Create Announcement
            </button>
          )}
        </div>

        {/* CONTROLS */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: tk.textMuted,
                pointerEvents: "none",
              }}
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search announcements..."
              style={{
                width: "100%",
                padding: "10px 16px 10px 40px",
                borderRadius: "8px",
                border: `1px solid ${tk.border}`,
                background: tk.surface,
                color: tk.textPrimary,
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = tk.brandLight)
              }
              onBlur={(e) => (e.currentTarget.style.borderColor = tk.border)}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: 2,
              background: tk.surface,
              padding: 4,
              borderRadius: "8px",
              border: `1px solid ${tk.border}`,
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setActiveTab("all")}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                background: activeTab === "all" ? tk.brand : "transparent",
                color: activeTab === "all" ? "#fff" : tk.textSecondary,
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("archive")}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                background: activeTab === "archive" ? tk.brand : "transparent",
                color: activeTab === "archive" ? "#fff" : tk.textSecondary,
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              Archive
            </button>
          </div>
        </div>

        {/* FEED */}
        <div>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="shimmer-bg"
                  style={{
                    height: 92,
                    borderRadius: "10px",
                    border: `1px solid ${tk.border}`,
                  }}
                />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div
              style={{
                padding: 48,
                textAlign: "center",
                color: tk.textMuted,
                background: tk.surface,
                border: `1px solid ${tk.border}`,
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              {searchQuery ? (
                <>
                  <Search size={28} style={{ opacity: 0.4 }} />
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 15,
                      color: tk.textSecondary,
                    }}
                  >
                    No announcements matched "{searchQuery}"
                  </div>
                  <button
                    onClick={() => setSearchQuery("")}
                    style={{
                      background: "none",
                      border: "none",
                      color: tk.brandLight,
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 600,
                      textDecoration: "underline",
                    }}
                  >
                    Clear search
                  </button>
                </>
              ) : activeTab === "archive" ? (
                <>
                  <Archive size={32} style={{ opacity: 0.4 }} />
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 15,
                      color: tk.textSecondary,
                    }}
                  >
                    Archive is empty
                  </div>
                  <div style={{ fontSize: "13px" }}>
                    Expired announcements will appear here.
                  </div>
                </>
              ) : (
                <>
                  <Bell size={32} style={{ opacity: 0.4 }} />
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 15,
                      color: tk.textSecondary,
                    }}
                  >
                    No Announcements
                  </div>
                  <div style={{ fontSize: "13px" }}>
                    Check back later for updates.
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {announcements.map((item) => (
                <AnnouncementCard
                  key={item.id}
                  item={item}
                  onClick={() => openDetail(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      <AnnouncementModal
        showModal={showModal}
        onClose={() => setShowModal(false)}
        onPublish={handlePublish}
        isPublishing={isPublishing}
        editingId={editingId}
        initialData={initialData}
        userTeams={userTeams}
      />

      {/* DRAWER */}
      <AnnouncementDrawer
        selectedAnn={selectedAnn}
        detailLoading={detailLoading}
        canPost={canPost}
        onClose={() => setSelectedAnn(null)}
        handleAction={handleAction}
        handleEditClick={handleEditClick}
        setConfirmDeleteId={setConfirmDeleteId}
      />

      {/* DELETE CONFIRMATION */}
      {confirmDeleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            zIndex: 200,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="modal-fade"
            style={{
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: "12px",
              width: "100%",
              maxWidth: "400px",
              padding: 28,
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: `${tk.primary}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <AlertTriangle size={24} color={tk.primary} />
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>
                Delete Announcement?
              </h3>
              <p
                style={{
                  margin: "0 0 24px",
                  color: tk.textSecondary,
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                This action cannot be undone. This announcement will be
                permanently deleted.
              </p>
              <div style={{ display: "flex", gap: 12, width: "100%" }}>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    border: `1px solid ${tk.border}`,
                    background: "transparent",
                    color: tk.textSecondary,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = tk.bg)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    background: tk.primary,
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "filter 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.filter = "brightness(1.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.filter = "brightness(1)")
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

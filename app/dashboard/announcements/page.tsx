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
    <main className="h-full bg-[#081325] text-white font-sans flex flex-col overflow-hidden">
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .drawer-slide { animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .modal-fade { animation: fadeIn 0.2s ease-out; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .shimmer-bg { background: linear-gradient(90deg, ${tk.surface} 25%, ${tk.surfaceHover} 50%, ${tk.surface} 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: ${tk.border}; border-radius: 3px; }
      `}</style>

      {/* =========================================
          1. LOCKED TOP SECTION (No Scroll)
      ========================================== */}
      <div className="flex-shrink-0 p-4 sm:p-6 lg:p-8 border-b border-[#2A3A5C]/50">
        <div className="max-w-5xl mx-auto">
          {/* HEADER */}
          <div className="flex justify-between items-center gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Announcements</h1>
              <p className="text-sm text-[#B7C0D8] mt-1">Stay updated with company news and updates.</p>
            </div>
            {canPost && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setInitialData(null);
                  setShowModal(true);
                }}
                className="h-10 px-4 sm:px-5 rounded-lg bg-[#4B1587] text-white font-semibold text-sm flex items-center gap-2 flex-shrink-0 hover:brightness-110 transition-all"
              >
                <Plus size={16} /> 
                <span className="hidden sm:inline">Create Announcement</span>
                <span className="sm:hidden">Create</span>
              </button>
            )}
          </div>

          {/* CONTROLS */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A86A7] pointer-events-none" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search announcements..."
                className="w-full p-2.5 pl-10 rounded-lg border border-[#2A3A5C] bg-[#172440] text-white text-sm outline-none focus:border-[#5DADE2] transition-colors"
              />
            </div>
            <div className="flex gap-1 bg-[#172440] p-1 rounded-lg border border-[#2A3A5C] flex-shrink-0 self-stretch sm:self-auto">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === "all" ? "bg-[#4B1587] text-white" : "text-[#B7C0D8]"}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("archive")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === "archive" ? "bg-[#4B1587] text-white" : "text-[#B7C0D8]"}`}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          2. SCROLLABLE LOWER SECTION
      ========================================== */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 lg:p-8 pt-6">
        <div className="max-w-5xl mx-auto">
          {/* FEED */}
          <div>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="shimmer-bg h-24 rounded-xl border border-[#2A3A5C]"></div>
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-12 text-center text-[#7A86A7] bg-[#172440] border border-[#2A3A5C] rounded-xl flex flex-col items-center gap-3">
              {searchQuery ? (
                <>
                  <Search size={28} className="opacity-40" />
                  <div className="font-semibold text-base text-[#B7C0D8]">No announcements matched "{searchQuery}"</div>
                  <button onClick={() => setSearchQuery("")} className="bg-transparent border-none text-[#5DADE2] cursor-pointer text-sm font-semibold underline">
                    Clear search
                  </button>
                </>
              ) : activeTab === "archive" ? (
                <>
                  <Archive size={32} className="opacity-40" />
                  <div className="font-semibold text-base text-[#B7C0D8]">Archive is empty</div>
                  <div className="text-sm">Expired announcements will appear here.</div>
                </>
              ) : (
                <>
                  <Bell size={32} className="opacity-40" />
                  <div className="font-semibold text-base text-[#B7C0D8]">No Announcements</div>
                  <div className="text-sm">Check back later for updates.</div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
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
        <div className="fixed inset-0 z-[200] flex justify-center items-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal-fade bg-[#172440] border border-[#2A3A5C] rounded-xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <AlertTriangle size={24} className="text-[#E31E24]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Delete Announcement?</h3>
              <p className="text-sm text-[#B7C0D8] mb-6 leading-relaxed">
                This action cannot be undone. This announcement will be permanently deleted.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-3 rounded-lg border border-[#2A3A5C] bg-transparent text-[#B7C0D8] font-semibold text-sm hover:bg-[#081325] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-lg bg-[#E31E24] text-white font-semibold text-sm hover:brightness-110 transition-all"
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
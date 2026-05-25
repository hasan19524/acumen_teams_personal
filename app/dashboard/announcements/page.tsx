"use client";

import { useState, useEffect } from "react";
import { Bell, Trophy, CalendarDays, Plus, Pin } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

export default function AnnouncementsPage() {
  const [showModal, setShowModal] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://127.0.0.1:8000/api/announcements/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => (Array.isArray(d) ? setAnnouncements(d) : []))
      .catch(() => {});
  }, []);

  const publishAnnouncement = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const token = localStorage.getItem("token");
    const res = await fetch("http://127.0.0.1:8000/api/announcements/create/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: newTitle, content: newContent }),
    });
    const ann = await res.json();
    if (ann.id) {
      setAnnouncements((prev) => [ann, ...prev]);
      setShowModal(false);
      setNewTitle("");
      setNewContent("");
    }
  };

  const getBadgeStyle = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-500/20 text-red-400 border border-red-500/20";
      case "High":
        return "bg-amber-500/20 text-amber-400 border border-amber-500/20";
      default:
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20";
    }
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30">
      {/* SHARED SIDEBAR */}
      <DashboardSidebar />

      {/* Main Content — unchanged */}
      <main className="flex-1 p-10 max-w-6xl">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              Announcements
            </h1>
            <p className="text-white/50 mt-2">
              Stay updated with the latest company news.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition-all px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/25"
          >
            <Plus size={20} /> New Post
          </button>
        </header>

        <div className="grid gap-4">
          {announcements.map((item, i) => (
            <div
              key={item.id ?? `item-${i}`}
              className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 p-6 rounded-2xl transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <Bell size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{item.title}</h3>
                    <p className="text-xs text-white/40 mt-1">
                      {item.by} • {item.time}
                    </p>
                  </div>
                </div>
                {item.pinned && (
                  <span className="flex items-center gap-1 text-blue-400 text-sm font-medium">
                    <Pin size={14} /> Pinned
                  </span>
                )}
              </div>
              <p className="mt-4 text-white/70 leading-relaxed text-sm max-w-3xl">
                {item.content}
              </p>
              <div className="mt-5 flex gap-2">
                <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/60">
                  {item.tag}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getBadgeStyle(item.priority)}`}
                >
                  {item.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal — unchanged */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-5">New Announcement</h2>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mb-4 outline-none focus:border-blue-500"
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write message..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mb-4 outline-none focus:border-blue-500 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={publishAnnouncement}
                className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

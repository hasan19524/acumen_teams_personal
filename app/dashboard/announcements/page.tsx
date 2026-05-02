"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Home, Clock3, ClipboardList, MessageSquare, Users, 
  Megaphone, Settings, LogOut, Plus, Pin, Bell, Trophy, 
  CalendarDays 
} from "lucide-react";

export default function AnnouncementsPage() {
  const [showModal, setShowModal] = useState(false);

  const announcements = [
    {
      icon: <Bell size={18} />,
      title: "Eid Holiday Notice",
      content: "Office will remain closed on Monday due to Eid holiday. Operations resume Tuesday.",
      tag: "HR",
      priority: "High",
      by: "HR Team",
      time: "2 hrs ago",
      pinned: true,
    },
    {
      icon: <Trophy size={18} />,
      title: "Sales Team Achieved ₹10L Target",
      content: "Congratulations to the sales department for crossing monthly revenue targets.",
      tag: "Achievement",
      priority: "Normal",
      by: "CEO",
      time: "Today",
      pinned: false,
    },
    {
      icon: <CalendarDays size={18} />,
      title: "Quarterly Review Meeting",
      content: "All managers are requested to attend the quarterly review meeting tomorrow at 4 PM.",
      tag: "Management",
      priority: "Critical",
      by: "Admin",
      time: "1 day ago",
      pinned: false,
    },
  ];

  const getBadgeStyle = (priority: string) => {
    switch(priority) {
      case "Critical": return "bg-red-500/20 text-red-400 border border-red-500/20";
      case "High": return "bg-amber-500/20 text-amber-400 border border-amber-500/20";
      default: return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20";
    }
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside className="w-20 border-r border-white/10 p-6 flex flex-col items-center gap-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20">
          AT
        </div>
        <nav className="flex flex-col gap-4">
          {[Home, Clock3, ClipboardList, MessageSquare, Users, Megaphone, Settings].map((Icon, i) => (
            <Link key={i} href="#" className={`p-3 rounded-xl transition-all duration-200 ${i === 5 ? "bg-white/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]" : "text-white/40 hover:bg-white/5 hover:text-white"}`}>
              <Icon size={22} />
            </Link>
          ))}
        </nav>
        <button className="mt-auto text-white/40 hover:text-red-400 transition-colors">
          <LogOut size={22} />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 max-w-6xl">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Announcements</h1>
            <p className="text-white/50 mt-2">Stay updated with the latest company news.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition-all px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/25"
          >
            <Plus size={20} /> New Post
          </button>
        </header>

        {/* Feed */}
        <div className="grid gap-4">
          {announcements.map((item, i) => (
            <div key={i} className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 p-6 rounded-2xl transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{item.title}</h3>
                    <p className="text-xs text-white/40 mt-1">{item.by} • {item.time}</p>
                  </div>
                </div>
                {item.pinned && <span className="flex items-center gap-1 text-blue-400 text-sm font-medium"><Pin size={14} /> Pinned</span>}
              </div>
              <p className="mt-4 text-white/70 leading-relaxed text-sm max-w-3xl">{item.content}</p>
              <div className="mt-5 flex gap-2">
                <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/60">{item.tag}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBadgeStyle(item.priority)}`}>{item.priority}</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-5">New Announcement</h2>
            <input placeholder="Title" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mb-4 outline-none focus:border-blue-500" />
            <textarea placeholder="Write message..." rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mb-4 outline-none focus:border-blue-500 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5">Cancel</button>
              <button className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold">Publish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
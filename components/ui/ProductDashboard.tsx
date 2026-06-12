"use client";

import { 
  MessageSquare, 
  CheckSquare, 
  Bell, 
  Users, 
  Calendar, 
  BarChart3, 
  Sparkles,
  Search,
  Hash,
  Lock,
  MoreHorizontal,
  Mic,
  Paperclip,
  Send,
  Smile,
  Clock,
  TrendingUp,
  Target,
  Activity
} from "lucide-react";

export default function ProductDashboard() {
  return (
    <div className="relative w-full max-w-[640px] mx-auto">
      {/* Glow behind dashboard - LIGHT */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-cyan-400/10 rounded-[2rem] blur-2xl opacity-40" />
      
      {/* Main dashboard container - LIGHT */}
      <div className="relative rounded-2xl overflow-hidden bg-white shadow-2xl shadow-slate-200/60 border border-slate-200/80">
        
        {/* Top bar - LIGHT */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-amber-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 text-[11px] text-slate-400">
            <Search className="w-3 h-3" />
            <span>Search teams, messages, tasks...</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[9px] text-white font-bold">
              JD
            </div>
          </div>
        </div>

        <div className="flex h-[420px]">
          {/* Left Sidebar - LIGHT */}
          <div className="w-14 bg-slate-50/60 border-r border-slate-100 flex flex-col items-center py-3 gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer">
              <Users className="w-4 h-4" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="mt-auto w-9 h-9 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          {/* Channel List - LIGHT */}
          <div className="w-48 bg-slate-50/40 border-r border-slate-100 p-3 hidden sm:block">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Teams</span>
              <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
            </div>
            
            <div className="space-y-0.5 mb-4">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-blue-600/10 text-blue-700 text-[12px] font-medium">
                <Hash className="w-3.5 h-3.5" />
                general
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 text-[12px] transition-colors cursor-pointer">
                <Hash className="w-3.5 h-3.5" />
                engineering
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 text-[12px] transition-colors cursor-pointer">
                <Lock className="w-3.5 h-3.5" />
                leadership
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 text-[12px] transition-colors cursor-pointer">
                <Hash className="w-3.5 h-3.5" />
                marketing
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Direct</span>
            </div>
            <div className="space-y-0.5">
              {[
                { name: "Sarah Chen", status: "online", avatar: "SC", color: "from-emerald-500 to-teal-600" },
                { name: "Mike Ross", status: "away", avatar: "MR", color: "from-amber-500 to-orange-600" },
                { name: "Emma Wilson", status: "online", avatar: "EW", color: "from-pink-500 to-rose-600" },
              ].map((user) => (
                <div key={user.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 text-[12px] transition-colors cursor-pointer">
                  <div className="relative">
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center text-[8px] text-white font-bold`}>
                      {user.avatar}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white ${user.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </div>
                  <span className="truncate">{user.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Chat Area - LIGHT */}
          <div className="flex-1 flex flex-col bg-white/50">
            {/* Chat header - LIGHT */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400" />
                <span className="text-[13px] font-semibold text-slate-700">general</span>
                <span className="text-[11px] text-slate-300">|</span>
                <span className="text-[11px] text-slate-400">Team updates & announcements</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex -space-x-1.5">
                  {['SC', 'MR', 'EW', 'JD'].map((initial, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 border-2 border-white flex items-center justify-center text-[8px] text-white font-medium">
                      {initial}
                    </div>
                  ))}
                </div>
                <span className="text-[11px] text-slate-400 ml-1">+12</span>
              </div>
            </div>

            {/* Messages - LIGHT */}
            <div className="flex-1 p-4 space-y-3 overflow-hidden">
              {[
                { 
                  name: "Sarah Chen", 
                  role: "Product Lead", 
                  time: "2m ago",
                  message: "Just shipped the new AI summary feature! 🚀 The team dashboard now auto-generates daily reports.",
                  avatar: "SC",
                  color: "from-emerald-500 to-teal-600",
                  reactions: ["🎉", "👏"]
                },
                { 
                  name: "Mike Ross", 
                  role: "Engineering", 
                  time: "1m ago",
                  message: "Attendance analytics are looking great this quarter. 94% team utilization rate!",
                  avatar: "MR",
                  color: "from-amber-500 to-orange-600",
                  reactions: ["📊"]
                },
                {
                  name: "AI Assistant",
                  role: "Bot",
                  time: "now",
                  message: "Weekly summary ready: 47 tasks completed, 12 pending reviews, 3 meetings scheduled.",
                  avatar: "AI",
                  color: "from-blue-500 to-purple-600",
                  isBot: true,
                  reactions: []
                }
              ].map((msg, i) => (
                <div key={i} className="flex gap-3 group">
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${msg.color} flex-shrink-0 flex items-center justify-center text-[9px] text-white font-bold`}>
                    {msg.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[12px] font-semibold text-slate-700">{msg.name}</span>
                      {msg.isBot && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-medium border border-blue-100">
                          BOT
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">{msg.time}</span>
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed">{msg.message}</p>
                    {msg.reactions.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {msg.reactions.map((emoji, j) => (
                          <span key={j} className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] border border-slate-200">
                            {emoji} 2
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input - LIGHT */}
            <div className="px-4 py-3 border-t border-slate-100">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                <Paperclip className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Message #general..." 
                  className="flex-1 bg-transparent text-[12px] text-slate-700 placeholder:text-slate-400 outline-none"
                  readOnly
                />
                <Smile className="w-4 h-4 text-slate-400" />
                <Mic className="w-4 h-4 text-slate-400" />
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Send className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - LIGHT */}
          <div className="w-44 bg-slate-50/40 border-l border-slate-100 p-3 hidden lg:flex flex-col gap-3">
            {/* AI Summary Card - LIGHT */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">AI Summary</span>
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed mb-2">
                Team velocity up 23% this week. 3 blockers identified.
              </p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600">
                <TrendingUp className="w-3 h-3" />
                <span>+23% velocity</span>
              </div>
            </div>

            {/* Attendance - LIGHT */}
            <div className="p-3 rounded-xl bg-white border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Attendance</span>
                <Clock className="w-3 h-3 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-800 mb-1">94%</div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
              </div>
              <p className="text-[9px] text-slate-400 mt-1">+4% from last week</p>
            </div>

            {/* Tasks - LIGHT */}
            <div className="p-3 rounded-xl bg-white border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Tasks</span>
                <Target className="w-3 h-3 text-slate-400" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Done</span>
                  <span className="text-[10px] text-emerald-600 font-medium">47</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">In Progress</span>
                  <span className="text-[10px] text-blue-600 font-medium">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Review</span>
                  <span className="text-[10px] text-amber-600 font-medium">8</span>
                </div>
              </div>
            </div>

            {/* Activity - LIGHT */}
            <div className="mt-auto p-3 rounded-xl bg-white border border-slate-100">
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] text-slate-500">Live Activity</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-500">12 members active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
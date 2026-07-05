"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { workspaceService } from "@/features/workspace/workspaceService";
import { apiFetch } from "@/lib/api";
import {
  CheckSquare,
  Clock,
  MessageSquare,
  Megaphone,
  TrendingUp,
  AlertTriangle,
  Inbox,
  Sparkles,
  Bell,
} from "lucide-react";
import { useRouter } from "next/navigation";

const tk = {
  bg: "#081325",
  surface: "#172440",
  surfaceHover: "#20304E",
  border: "#2A3A5C",
  textPrimary: "#FFFFFF",
  textSecondary: "#B7C0D8",
  textMuted: "#7A86A7",
  brand: "#4B1587",
  brandLight: "#5DADE2",
  success: "#1FA463",
  warning: "#F5B041",
  primary: "#E31E24",
};

export default function EmployeeHome() {
  const { user, isIndependent } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!isIndependent) {
      workspaceService
        .getStats()
        .then((data) => setStats(data))
        .catch(() => {});
    }
  }, [isIndependent]);

  const handleCreateWorkspace = async () => {
    const name = prompt("Enter your workspace name:");
    if (!name) return;
    setLoading(true);
    try {
      await apiFetch("/api/workspaces/create/", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      window.location.reload();
    } catch (e) {
      alert("Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  // Layout for Independent Users (No Workspace)
  if (isIndependent) {
    return (
      <main className="min-h-full bg-[#081325] text-white p-8 font-sans flex items-center justify-center">
        <div className="max-w-4xl mx-auto w-full">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
              <Sparkles size={28} color={tk.brandLight} /> Welcome to Acumen
              Teams
            </h1>
            <p className="text-slate-400">
              You're not part of a workspace yet. Accept an invitation or start
              your own.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="bg-[#172440] border border-[#2A3A5C] rounded-2xl p-6 hover:border-blue-500/50 transition-colors cursor-pointer"
              onClick={() => router.push("/dashboard/invites")}
            >
              <Inbox size={24} color={tk.brandLight} className="mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Pending Invitations
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Check your invitations to join a team.
              </p>
              <span className="text-blue-400 hover:underline text-sm font-medium">
                View Invites →
              </span>
            </div>

            <div
              className="bg-[#172440] border border-[#2A3A5C] rounded-2xl p-6 hover:border-blue-500/50 transition-colors cursor-pointer"
              onClick={() => router.push("/dashboard/clock")}
            >
              <Clock size={24} color={tk.success} className="mb-4" />
              <h3 className="text-lg font-semibold mb-2">Quick Clock</h3>
              <p className="text-slate-400 text-sm mb-4">
                Track your personal time.
              </p>
              <span className="text-blue-400 hover:underline text-sm font-medium">
                Open Clock →
              </span>
            </div>

            <div
              className="bg-[#172440] border border-[#2A3A5C] rounded-2xl p-6 hover:border-blue-500/50 transition-colors cursor-pointer"
              onClick={handleCreateWorkspace}
            >
              <Megaphone size={24} color={tk.warning} className="mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start a Company</h3>
              <p className="text-slate-400 text-sm mb-4">
                Create your own workspace and invite others.
              </p>
              <span className="text-blue-400 hover:underline text-sm font-medium disabled:opacity-50">
                {loading ? "Creating..." : "Get Started →"}
              </span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Layout for Workspace Members
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 18
        ? "Good Afternoon"
        : "Good Evening";
  const todayString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main
      style={{
        minHeight: "100%",
        background: tk.bg,
        color: tk.textPrimary,
        fontFamily: "'Inter', sans-serif",
        padding: "32px 20px sm:32px 40px",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: tk.textMuted,
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
            }}
          >
            {todayString}
          </p>
          <h1
            style={{
              margin: "4px 0 0 0",
              color: tk.textPrimary,
              fontSize: "32px",
              fontWeight: 800,
              letterSpacing: "-1px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {greeting}, {user?.full_name?.split(" ")[0] || "User"}{" "}
            <Sparkles size={24} style={{ color: tk.brandLight }} />
          </h1>
        </div>
        <div
          onClick={() => router.push("/dashboard/notifications")}
          style={{
            position: "relative",
            cursor: "pointer",
            padding: "10px",
            borderRadius: "12px",
            background: tk.surface,
            border: `1px solid ${tk.border}`,
          }}
        >
          <Bell size={20} style={{ color: tk.textSecondary }} />
        </div>
      </header>

      {/* Personal KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <div
          style={{
            background: tk.surface,
            border: `1px solid ${tk.border}`,
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `${tk.success}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Clock size={24} style={{ color: tk.success }} />
          </div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
            Clocked In
          </h2>
          <p
            style={{
              marginTop: 8,
              color: tk.textSecondary,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            09:00 AM - 05:00 PM
          </p>
        </div>

        <div
          style={{
            background: tk.surface,
            border: `1px solid ${tk.border}`,
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `${tk.warning}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <CheckSquare size={24} style={{ color: tk.warning }} />
          </div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
            {stats?.my_pending_tasks ?? 0}
          </h2>
          <p
            style={{
              marginTop: 8,
              color: tk.textSecondary,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Pending Tasks
          </p>
        </div>

        <div
          style={{
            background: tk.surface,
            border: `1px solid ${tk.border}`,
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `${tk.primary}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={24} style={{ color: tk.primary }} />
          </div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
            {stats?.my_overdue_tasks ?? 0}
          </h2>
          <p
            style={{
              marginTop: 8,
              color: tk.textSecondary,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Overdue Tasks
          </p>
        </div>

        <div
          style={{
            background: tk.surface,
            border: `1px solid ${tk.border}`,
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `${tk.brandLight}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <MessageSquare size={24} style={{ color: tk.brandLight }} />
          </div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
            {stats?.my_dm_requests ?? 0}
          </h2>
          <p
            style={{
              marginTop: 8,
              color: tk.textSecondary,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            DM Requests
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Announcements */}
        <div
          className="lg:col-span-2"
          style={{
            background: tk.surface,
            border: `1px solid ${tk.border}`,
            borderRadius: 16,
            padding: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <Megaphone size={24} style={{ color: tk.brandLight }} />
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
              Recent Announcements
            </h3>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 0",
              color: tk.textMuted,
            }}
          >
            <Inbox size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p style={{ fontSize: 14, fontWeight: 500 }}>
              No new announcements
            </p>
            <p style={{ fontSize: 12, marginTop: 4 }}>
              Workspace updates will appear here.
            </p>
          </div>
        </div>

        {/* My Performance */}
        <div
          style={{
            background: `linear-gradient(135deg, ${tk.brand}, ${tk.brandLight})`,
            borderRadius: 16,
            padding: 28,
            position: "relative",
            overflow: "hidden",
            minHeight: 200,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <TrendingUp size={16} style={{ color: "rgba(255,255,255,.9)" }} />
            <p
              style={{
                margin: 0,
                color: "rgba(255,255,255,.8)",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "1.5px",
              }}
            >
              MY WEEKLY PERFORMANCE
            </p>
          </div>
          <h2
            style={{
              marginTop: 8,
              marginBottom: 0,
              color: "#fff",
              fontSize: 48,
              fontWeight: 800,
            }}
          >
            {stats?.productivity_score || 0}%
          </h2>
          <p
            style={{
              marginTop: 8,
              color: "rgba(255,255,255,.95)",
              lineHeight: 1.6,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Based on your task completion and attendance this week.
          </p>
        </div>
      </div>
    </main>
  );
}

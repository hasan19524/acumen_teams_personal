"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  CheckSquare,
  Clock,
  MessageSquare,
  AlertTriangle,
  Inbox,
  Sparkles,
  Bell,
  Plus,
  Megaphone,
  TrendingUp,
} from "lucide-react";
import { tk } from "@/lib/tokens";



export default function EmployeeDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

  return (
    <main className="min-h-full bg-[#081325] text-white p-8 font-sans flex items-center justify-center">
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Sparkles size={28} color={tk.brandLight} /> Welcome to Acumen Teams
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
            <h3 className="text-lg font-semibold mb-2">Pending Invitations</h3>
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

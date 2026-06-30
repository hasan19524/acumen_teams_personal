"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function EmployeeHome() {
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
      window.location.reload(); // Forces useAuth to re-run and unlock everything
    } catch (e) {
      alert("Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#081325] text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Welcome to Acumen Teams</h1>
        <p className="text-slate-400 mb-8">
          You're not part of a workspace yet. Accept an invitation to start
          collaborating.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#172440] border border-[#2A3A5C] rounded-2xl p-6 hover:border-blue-500/50 transition-colors">
            <h3 className="text-lg font-semibold mb-2">Pending Invitations</h3>
            <p className="text-slate-400 text-sm mb-4">
              Check your invitations to join a team.
            </p>
            <a
              href="/dashboard/invites"
              className="text-blue-400 hover:underline text-sm font-medium"
            >
              View Invites →
            </a>
          </div>

          <div className="bg-[#172440] border border-[#2A3A5C] rounded-2xl p-6 hover:border-blue-500/50 transition-colors">
            <h3 className="text-lg font-semibold mb-2">Quick Clock</h3>
            <p className="text-slate-400 text-sm mb-4">
              Track your personal time.
            </p>
            <a
              href="/dashboard/clock"
              className="text-blue-400 hover:underline text-sm font-medium"
            >
              Open Clock →
            </a>
          </div>

          <div className="bg-[#172440] border border-[#2A3A5C] rounded-2xl p-6 hover:border-blue-500/50 transition-colors">
            <h3 className="text-lg font-semibold mb-2">Start a Company</h3>
            <p className="text-slate-400 text-sm mb-4">
              Create your own workspace and invite others.
            </p>
            <button
              onClick={handleCreateWorkspace}
              disabled={loading}
              className="text-blue-400 hover:underline text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Creating..." : "Get Started →"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

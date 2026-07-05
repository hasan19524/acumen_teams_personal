"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Loader2,
  AlertTriangle,
  LogIn,
  UserPlus,
  CheckCircle2,
  Building2,
  Users,
  Calendar,
  ShieldCheck,
} from "lucide-react";

export default function JoinWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const { authChecked, user, isIndependent, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchInviteInfo = async () => {
      try {
        const res = await apiFetch(`/api/workspaces/join/${token}/info/`);
        const data = await res.json();
        if (res.ok) {
          setInviteInfo(data);
        } else {
          setError(data.error || "Invalid invite link.");
        }
      } catch {
        setError("Network connection error. Please check your internet.");
      } finally {
        setLoading(false);
      }
    };
    fetchInviteInfo();
  }, [token]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await apiFetch(`/api/workspaces/join/${token}/`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        await refreshUser();
        // Delay redirect slightly to show success animation
        setTimeout(() => router.push("/dashboard"), 1200);
      } else {
        setError(data.error || "Failed to join workspace.");
      }
    } catch {
      setError("Network connection error.");
    } finally {
      setJoining(false);
    }
  };

  // ── LOADING STATE (Skeletons) ──
  // FIX: Do not block on authChecked. Only block on local loading state.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white p-4 font-sans">
        <div className="w-full max-w-md bg-[#172440] border border-[#2A3A5C] rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-slate-700/50 animate-pulse"></div>
          <div className="h-6 bg-slate-700/50 rounded w-3/4 mx-auto mb-4 animate-pulse"></div>
          <div className="h-4 bg-slate-700/50 rounded w-1/2 mx-auto mb-8 animate-pulse"></div>
          <div className="h-12 bg-slate-700/50 rounded-xl animate-pulse"></div>
          <p className="text-slate-400 text-sm mt-6 flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Verifying
            invitation...
          </p>
        </div>
      </div>
    );
  }

  // ── SUCCESS STATE ──
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white p-4 font-sans">
        <div className="w-full max-w-md bg-[#172440] border border-[#2A3A5C] rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Joined Successfully!</h1>
          <p className="text-slate-400 mb-8">Entering workspace...</p>
          <Loader2 className="animate-spin mx-auto text-slate-500" size={24} />
        </div>
      </div>
    );
  }

  // ── MAIN UI ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white p-4 font-sans">
      <div className="w-full max-w-md bg-[#172440] border border-[#2A3A5C] rounded-2xl p-8 shadow-2xl text-center">
        {error ? (
          // ── ERROR STATE ──
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Invitation Error</h1>
            <p className="text-slate-400 mb-8">{error}</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
            >
              Back to Home
            </Link>
          </>
        ) : (
          // ── INVITE DETAILS ──
          <>
            {/* Workspace Branding */}
            <div
              className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${inviteInfo?.workspace_color || "#4B1587"}, #7C3AED)`,
              }}
            >
              {inviteInfo?.workspace_logo ? (
                <img
                  src={inviteInfo.workspace_logo}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <Building2 size={32} className="text-white" />
              )}
            </div>

            <h1 className="text-2xl font-bold mb-2">
              {inviteInfo?.workspace_name}
            </h1>

            {/* Meta Info */}
            <div className="flex items-center justify-center gap-4 text-slate-400 text-sm mb-8">
              <span className="flex items-center gap-1.5">
                <Users size={14} /> {inviteInfo?.member_count} Members
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> Est.{" "}
                {new Date(inviteInfo?.created_at).getFullYear()}
              </span>
            </div>

            {/* Inviter Profile */}
            <div className="p-4 bg-[#0f172a] border border-[#2A3A5C] rounded-xl mb-8 text-left flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-sm">
                {inviteInfo?.inviter_name?.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-slate-300">Invited by</p>
                <p className="font-semibold text-white">
                  {inviteInfo?.inviter_name}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <ShieldCheck size={10} /> Workspace {inviteInfo?.role}
                </p>
              </div>
            </div>

            {user ? (
              isIndependent ? (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-70"
                >
                  {joining ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  {joining ? "Joining..." : "Accept Invitation"}
                </button>
              ) : (
                <div className="p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-xl text-yellow-200 text-sm text-left">
                  <p className="font-semibold mb-1">
                    You are already in a workspace.
                  </p>
                  <p className="text-yellow-200/80 text-xs">
                    Please leave your current workspace before joining a new
                    one.
                  </p>
                  <Link
                    href="/dashboard/settings"
                    className="mt-3 inline-block text-yellow-300 underline text-xs font-medium"
                  >
                    Go to Settings to Leave
                  </Link>
                </div>
              )
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-slate-400 text-sm mb-2">
                  Sign in or create an account to accept this invitation.
                </p>
                <Link
                  href={`/login?redirect=/join/${token}`}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                >
                  <LogIn size={18} /> Login to Accept
                </Link>
                <Link
                  href={`/signup?redirect=/join/${token}`}
                  className="w-full py-3.5 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <UserPlus size={18} /> Create Account
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

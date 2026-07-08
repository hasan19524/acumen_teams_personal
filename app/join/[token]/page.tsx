"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { tk } from "@/lib/tokens";
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
      <div
        className="min-h-screen flex items-center justify-center p-4 font-sans"
        style={{ background: tk.bg, color: tk.heading }}
      >
        <div
          className="w-full max-w-md rounded-2xl p-8 shadow-2xl text-center"
          style={{ background: tk.surface, border: `1px solid ${tk.border}` }}
        >
          <div
            className="w-16 h-16 mx-auto mb-6 rounded-xl animate-pulse"
            style={{ background: tk.surfaceHover }}
          ></div>
          <div
            className="h-6 rounded w-3/4 mx-auto mb-4 animate-pulse"
            style={{ background: tk.surfaceHover }}
          ></div>
          <div
            className="h-4 rounded w-1/2 mx-auto mb-8 animate-pulse"
            style={{ background: tk.surfaceHover }}
          ></div>
          <div
            className="h-12 rounded-xl animate-pulse"
            style={{ background: tk.surfaceHover }}
          ></div>
          <p
            className="text-sm mt-6 flex items-center justify-center gap-2"
            style={{ color: tk.textMuted }}
          >
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
      <div
        className="min-h-screen flex items-center justify-center p-4 font-sans"
        style={{ background: tk.bg, color: tk.heading }}
      >
        <div
          className="w-full max-w-md rounded-2xl p-8 shadow-2xl text-center"
          style={{ background: tk.surface, border: `1px solid ${tk.border}` }}
        >
          <div
            className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ background: tk.tintGreen }}
          >
            <CheckCircle2 size={32} style={{ color: tk.success }} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Joined Successfully!</h1>
          <p className="mb-8" style={{ color: tk.textMuted }}>
            Entering workspace...
          </p>
          <Loader2
            className="animate-spin mx-auto"
            size={24}
            style={{ color: tk.textMuted }}
          />
        </div>
      </div>
    );
  }

  // ── MAIN UI ──
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 font-sans"
      style={{ background: tk.bg, color: tk.heading }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-2xl text-center"
        style={{ background: tk.surface, border: `1px solid ${tk.border}` }}
      >
        {error ? (
          // ── ERROR STATE ──
          <>
            <div
              className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: tk.tintDanger }}
            >
              <AlertTriangle size={32} style={{ color: tk.danger }} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Invitation Error</h1>
            <p className="mb-8" style={{ color: tk.textMuted }}>
              {error}
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-lg font-semibold transition-colors"
              style={{ background: tk.surfaceHover, color: tk.heading }}
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
                background: `linear-gradient(135deg, ${inviteInfo?.workspace_color || tk.brand}, ${tk.indigo})`,
              }}
            >
              {inviteInfo?.workspace_logo ? (
                <img
                  src={inviteInfo.workspace_logo}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <Building2 size={32} style={{ color: "#fff" }} />
              )}
            </div>

            <h1 className="text-2xl font-bold mb-2">
              {inviteInfo?.workspace_name}
            </h1>

            {/* Meta Info */}
            <div
              className="flex items-center justify-center gap-4 text-sm mb-8"
              style={{ color: tk.textMuted }}
            >
              <span className="flex items-center gap-1.5">
                <Users size={14} /> {inviteInfo?.member_count} Members
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> Est.{" "}
                {new Date(inviteInfo?.created_at).getFullYear()}
              </span>
            </div>

            {/* Inviter Profile */}
            <div
              className="p-4 rounded-xl mb-8 text-left flex items-center gap-4"
              style={{
                background: tk.bgSecondary,
                border: `1px solid ${tk.border}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                style={{
                  background: `linear-gradient(135deg, ${tk.brand}, ${tk.indigo})`,
                  color: "#fff",
                }}
              >
                {inviteInfo?.inviter_name?.charAt(0)}
              </div>
              <div>
                <p className="text-sm" style={{ color: tk.textSecondary }}>
                  Invited by
                </p>
                <p className="font-semibold" style={{ color: tk.heading }}>
                  {inviteInfo?.inviter_name}
                </p>
                <p
                  className="text-xs flex items-center gap-1 mt-0.5"
                  style={{ color: tk.textMuted }}
                >
                  <ShieldCheck size={10} /> Workspace {inviteInfo?.role}
                </p>
              </div>
            </div>

            {user ? (
              isIndependent ? (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-70"
                  style={{
                    background: `linear-gradient(135deg, ${tk.brand}, ${tk.indigo})`,
                    color: "#fff",
                  }}
                >
                  {joining ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                  {joining ? "Joining..." : "Accept Invitation"}
                </button>
              ) : (
                <div
                  className="p-4 rounded-xl text-sm text-left"
                  style={{
                    background: tk.tintAmber,
                    border: `1px solid ${tk.warning}`,
                    color: tk.warning,
                  }}
                >
                  <p className="font-semibold mb-1">
                    You are already in a workspace.
                  </p>
                  <p className="text-xs opacity-80">
                    Please leave your current workspace before joining a new
                    one.
                  </p>
                  <Link
                    href="/dashboard/settings"
                    className="mt-3 inline-block underline text-xs font-medium"
                  >
                    Go to Settings to Leave
                  </Link>
                </div>
              )
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm mb-2" style={{ color: tk.textMuted }}>
                  Sign in or create an account to accept this invitation.
                </p>
                <Link
                  href={`/login?redirect=/join/${token}`}
                  className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${tk.brand}, ${tk.indigo})`,
                    color: "#fff",
                  }}
                >
                  <LogIn size={18} /> Login to Accept
                </Link>
                <Link
                  href={`/signup?redirect=/join/${token}`}
                  className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                  style={{ background: tk.surfaceHover, color: tk.heading }}
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

"use client";

import { useState } from "react";
import {
  X,
  UserPlus,
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { workspaceService } from "@/features/workspace/workspaceService";
import { tk, Team } from "../lib";

interface InviteManagerProps {
  showModal: boolean;
  onClose: () => void;
  teams: Team[];
}

export function InviteManager({
  showModal,
  onClose,
  teams,
}: InviteManagerProps) {
  const [inviteType, setInviteType] = useState<"user" | "link">("user");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [linkRole, setLinkRole] = useState("member");
  const [linkExpiry, setLinkExpiry] = useState(96);
  const [generatedLink, setGeneratedLink] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  if (!showModal) return null;

  const handleInviteUser = async () => {
    setError("");
    setSuccess("");
    if (!username && !email) return setError("Username or email required");
    setLoading(true);
    try {
      const payload: any = { role };
      if (username) payload.username = username;
      if (email) payload.email = email;
      await workspaceService.inviteMember(payload);
      setSuccess("User invited successfully");
      setUsername("");
      setEmail("");
      setRole("member");
    } catch (err: any) {
      setError(err.message || "Failed to invite user");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setLinkLoading(true);
    setGeneratedLink("");
    setLinkCopied(false);
    setError("");
    try {
      const data = await workspaceService.generateInviteLink({
        role: linkRole,
        expires_hours: linkExpiry,
      });
      if (data.invite_url) setGeneratedLink(data.invite_url);
    } catch (err: any) {
      setError(err.message || "Failed to generate link");
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-[var(--heading)]">
            Invite Center
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-1 bg-[var(--bg)] rounded-lg p-1 mb-6">
          <button
            onClick={() => setInviteType("user")}
            className={`flex-1 p-2.5 rounded-md font-semibold text-sm cursor-pointer flex items-center justify-center gap-1.5 ${inviteType === "user" ? "bg-[var(--brand)] text-[var(--heading)]" : "text-[var(--text-secondary)]"}`}
          >
            <UserPlus size={14} /> By User
          </button>
          <button
            onClick={() => setInviteType("link")}
            className={`flex-1 p-2.5 rounded-md font-semibold text-sm cursor-pointer flex items-center justify-center gap-1.5 ${inviteType === "link" ? "bg-[var(--brand)] text-[var(--heading)]" : "text-[var(--text-secondary)]"}`}
          >
            <LinkIcon size={14} /> Link / QR
          </button>
        </div>

        {error && (
          <div className="text-[var(--primary)] text-sm mb-4 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="text-[var(--success)] text-sm mb-4 text-center">
            {success}
          </div>
        )}

        {inviteType === "user" && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                  Username
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="john_doe"
                  className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--heading)] text-sm outline-none focus:border-[var(--brand-light)]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                  Email (Optional)
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@acumen.app"
                  className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--heading)] text-sm outline-none focus:border-[var(--brand-light)]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--heading)] text-sm outline-none focus:border-[var(--brand-light)]"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleInviteUser}
              disabled={loading}
              className="w-full p-3 rounded-lg border-none bg-[var(--brand)] text-[var(--heading)] font-bold text-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Inviting...
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Send Invite
                </>
              )}
            </button>
          </div>
        )}

        {inviteType === "link" && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                  Role
                </label>
                <select
                  value={linkRole}
                  onChange={(e) => setLinkRole(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--heading)] text-sm outline-none focus:border-[var(--brand-light)]"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                  Expires In
                </label>
                <select
                  value={linkExpiry}
                  onChange={(e) => setLinkExpiry(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--heading)] text-sm outline-none focus:border-[var(--brand-light)]"
                >
                  <option value={24}>1 Day</option>
                  <option value={96}>4 Days</option>
                  <option value={168}>7 Days</option>
                  <option value={720}>30 Days</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleGenerateLink}
              disabled={linkLoading}
              className="w-full p-3 rounded-lg border-none bg-[var(--brand)] text-[var(--heading)] font-bold text-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {linkLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <LinkIcon size={16} /> Generate Link & QR
                </>
              )}
            </button>

            {generatedLink && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-4 items-center bg-[var(--bg)] p-4 rounded-lg border border-[var(--border)]">
                <div>
                  <div className="text-[11px] text-[var(--text-muted)] mb-2 uppercase">
                    Invite Link
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      readOnly
                      value={generatedLink}
                      className="flex-1 p-2 rounded-md border border-[var(--border)] bg-transparent text-[var(--success)] text-[11px] outline-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      }}
                      className="p-2 rounded-md border-none text-[var(--heading)] cursor-pointer font-semibold text-[11px] flex items-center gap-1"
                      style={{
                        background: linkCopied ? tk.success : tk.surfaceHover,
                      }}
                    >
                      {linkCopied ? (
                        <>
                          <CheckCircle2 size={14} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="bg-white p-1 rounded-lg w-32 h-32 flex items-center justify-center mx-auto sm:mx-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(generatedLink)}`}
                    alt="QR Code"
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

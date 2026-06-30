// features/teams/components/InviteManager.tsx
"use client";

import { useState } from "react";
import {
  X,
  UserPlus,
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  Loader2,
  Mail,
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
  // Form State for Username/Email
  const [inviteType, setInviteType] = useState<"user" | "link">("user");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // State for Link/QR
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
      if (teamId) payload.team_id = Number(teamId);
      await workspaceService.inviteMember(payload);
      setSuccess("User invited successfully");
      setUsername("");
      setEmail("");
      setRole("member");
      setTeamId("");
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
    try {
      const data = await workspaceService.generateInviteLink({
        role: linkRole,
        expires_hours: linkExpiry,
      });
      if (data.invite_url) setGeneratedLink(data.invite_url);
    } catch {
      setError("Failed to generate link");
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 200,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="modal-fade"
        style={{
          background: tk.surface,
          border: `1px solid ${tk.border}`,
          borderRadius: 12,
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 24,
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: tk.textPrimary,
            }}
          >
            Invite Center
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: tk.textMuted,
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: tk.bg,
            borderRadius: 8,
            padding: 4,
            marginBottom: 24,
          }}
        >
          <button
            onClick={() => setInviteType("user")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 6,
              border: "none",
              background: inviteType === "user" ? tk.brand : "transparent",
              color: inviteType === "user" ? "#fff" : tk.textSecondary,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <UserPlus size={14} /> By User
          </button>
          <button
            onClick={() => setInviteType("link")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 6,
              border: "none",
              background: inviteType === "link" ? tk.brand : "transparent",
              color: inviteType === "link" ? "#fff" : tk.textSecondary,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <LinkIcon size={14} /> Link / QR
          </button>
        </div>

        {error && (
          <div
            style={{
              color: tk.primary,
              fontSize: 13,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              color: tk.success,
              fontSize: 13,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {success}
          </div>
        )}

        {/* User Invite Form */}
        {inviteType === "user" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label style={labelStyle}>Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="john_doe"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email (Optional)</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@acumen.app"
                  style={inputStyle}
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label style={labelStyle}>Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={inputStyle}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Assign to Team</label>
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">None (Unassigned)</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleInviteUser}
              disabled={loading}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "none",
                background: tk.brand,
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader2
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />{" "}
                  Inviting...
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Send Invite
                </>
              )}
            </button>
          </div>
        )}

        {/* Link & QR Form */}
        {inviteType === "link" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label style={labelStyle}>Role</label>
                <select
                  value={linkRole}
                  onChange={(e) => setLinkRole(e.target.value)}
                  style={inputStyle}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Expires In</label>
                <select
                  value={linkExpiry}
                  onChange={(e) => setLinkExpiry(Number(e.target.value))}
                  style={inputStyle}
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
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "none",
                background: tk.brand,
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: linkLoading ? 0.6 : 1,
              }}
            >
              {linkLoading ? (
                <>
                  <Loader2
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />{" "}
                  Generating...
                </>
              ) : (
                <>
                  <LinkIcon size={16} /> Generate Link & QR
                </>
              )}
            </button>

            {generatedLink && (
              <div
                style={{
                  marginTop: 8,
                  display: "grid",
                  gridTemplateColumns: "1fr 140px",
                  gap: 16,
                  alignItems: "center",
                  background: tk.bg,
                  padding: 16,
                  borderRadius: 8,
                  border: `1px solid ${tk.border}`,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: tk.textMuted,
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    Invite Link
                  </div>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <input
                      readOnly
                      value={generatedLink}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: `1px solid ${tk.border}`,
                        background: "transparent",
                        color: tk.success,
                        fontSize: 11,
                      }}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: linkCopied ? tk.success : tk.surfaceHover,
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 11,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
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
                <div
                  style={{
                    background: "#fff",
                    padding: 4,
                    borderRadius: 8,
                    width: 140,
                    height: 140,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(generatedLink)}`}
                    alt="QR Code"
                    style={{ width: 130, height: 130 }}
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

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: tk.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  display: "block",
  marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${tk.border}`,
  background: tk.bg,
  color: tk.textPrimary,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

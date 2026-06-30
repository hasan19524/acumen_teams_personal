// features/teams/components/MemberDrawer.tsx
"use client";

import {
  X,
  Mail,
  CalendarDays,
  Shield,
  Crown,
  Trash2,
  ArrowRightCircle,
  MessageSquare,
  User,
} from "lucide-react";
import { tk, Member, getRoleBadgeStyle } from "../lib";

interface MemberDrawerProps {
  member: Member | null;
  myRole: string;
  onClose: () => void;
  onRemoveMember: (userId: number) => void;
  onMoveTeam: (userId: number) => void;
  onChangeRole: (userId: number) => void;
}

export function MemberDrawer({
  member,
  myRole,
  onClose,
  onRemoveMember,
  onMoveTeam,
  onChangeRole,
}: MemberDrawerProps) {
  if (!member) return null;

  const isAdmin = myRole === "owner" || myRole === "admin";
  const joinedDate = member.joined_at
    ? new Date(member.joined_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently";
  const daysAgo = member.joined_at
    ? Math.floor(
        (Date.now() - new Date(member.joined_at).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  const s = getRoleBadgeStyle(member.role);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 100,
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 400,
          maxWidth: "90vw",
          height: "100vh",
          background: tk.surface,
          borderLeft: `1px solid ${tk.border}`,
          padding: 24,
          overflowY: "auto",
          animation: "slideIn 0.3s ease-out",
        }}
      >
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: tk.textPrimary,
            }}
          >
            Member Profile
          </h3>
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

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${tk.brand}, ${tk.brandLight})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 700,
              color: "#fff",
              marginBottom: 16,
            }}
          >
            {(member.full_name || member.username).charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: tk.textPrimary }}>
            {member.full_name || member.username}
          </div>
          <div style={{ fontSize: 14, color: tk.textSecondary, marginTop: 4 }}>
            @{member.username}
          </div>
          <div style={{ marginTop: 12 }}>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                background: s.bg,
                color: s.color,
                textTransform: "capitalize",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Shield size={12} /> {member.role}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16, marginBottom: 32 }}>
          <div
            style={{
              padding: 16,
              background: tk.bg,
              borderRadius: 8,
              border: `1px solid ${tk.border}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: tk.textMuted,
                textTransform: "uppercase",
                marginBottom: 4,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Mail size={12} /> Email
            </div>
            <div style={{ fontSize: 14, color: tk.textSecondary }}>
              {member.username}@acumen.app
            </div>
          </div>

          <div
            style={{
              padding: 16,
              background: tk.bg,
              borderRadius: 8,
              border: `1px solid ${tk.border}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: tk.textMuted,
                textTransform: "uppercase",
                marginBottom: 4,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <CalendarDays size={12} /> Joined Workspace
            </div>
            <div style={{ fontSize: 14, color: tk.textSecondary }}>
              {joinedDate} ({daysAgo} days ago)
            </div>
          </div>

          <div
            style={{
              padding: 16,
              background: tk.bg,
              borderRadius: 8,
              border: `1px solid ${tk.border}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: tk.textMuted,
                textTransform: "uppercase",
                marginBottom: 4,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <User size={12} /> About
            </div>
            <div style={{ fontSize: 14, color: tk.textSecondary, lineHeight: 1.5 }}>
              No bio available. This user hasn't added a description yet.
            </div>
          </div>

          <div
            style={{
              padding: 16,
              background: tk.bg,
              borderRadius: 8,
              border: `1px solid ${tk.border}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: tk.textMuted,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Teams ({member.teams.length})
            </div>
            {member.teams.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {member.teams.map((t) => (
                  <span
                    key={t.id}
                    style={{
                      fontSize: 12,
                      padding: "4px 8px",
                      background: tk.surfaceHover,
                      borderRadius: 4,
                      color: tk.textPrimary,
                    }}
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 14, color: tk.textMuted }}>
                Unassigned
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <button
            style={{ ...drawerBtn, background: tk.surfaceHover }}
            onClick={() => alert("Redirecting to chat...")}
          >
            <MessageSquare size={16} color={tk.brandLight} /> Send Message
          </button>
          {isAdmin && (
            <button
              style={drawerBtn}
              onClick={() => onChangeRole(member.user_id)}
            >
              <Shield size={16} color={tk.textSecondary} /> Change Role
            </button>
          )}

          {isAdmin && (
            <button
              style={drawerBtn}
              onClick={() => onMoveTeam(member.user_id)}
            >
              <ArrowRightCircle size={16} color={tk.textSecondary} /> Move Team
            </button>
          )}
          {isAdmin && member.role !== "owner" && (
            <button
              style={{
                ...drawerBtn,
                color: tk.primary,
                borderColor: `${tk.primary}30`,
              }}
              onClick={() => onRemoveMember(member.user_id)}
            >
              <Trash2 size={16} color={tk.primary} /> Remove Member
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const drawerBtn: React.CSSProperties = {
  padding: "12px",
  borderRadius: 8,
  border: `1px solid ${tk.border}`,
  background: "transparent",
  color: tk.textPrimary,
  fontWeight: 500,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 14,
};

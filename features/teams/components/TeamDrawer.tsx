// features/teams/components/TeamDrawer.tsx
"use client";

import { useState } from "react";
import {
  X,
  Users,
  Trash2,
  Edit3,
  Search,
  Plus,
  Lock,
  Globe,
  CheckCircle2,
  Crown,
} from "lucide-react";
import { tk, Team, Member, getRoleBadgeStyle, getInitials } from "../lib";

interface TeamDrawerProps {
  team: Team | null;
  members: Member[];
  myRole: string;
  myUsername: string;
  isEditing: boolean;
  editName: string;
  editDesc: string;
  editIsPrivate: boolean;
  editColor: string;
  editLeaderId: string;
  setEditName: (v: string) => void;
  setEditDesc: (v: string) => void;
  setEditIsPrivate: (v: boolean) => void;
  setEditColor: (v: string) => void;
  setEditLeaderId: (v: string) => void;
  onClose: () => void;
  onEditClick: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onRemoveMember: (userId: number) => void;
  onAddMemberClick: () => void;
}

const PRESET_COLORS = [
  "#4B1587",
  "#E31E24",
  "#1FA463",
  "#F5B041",
  "#5DADE2",
  "#0D1B3D",
];

export function TeamDrawer({
  team,
  members,
  myRole,
  myUsername,
  isEditing,
  editName,
  editDesc,
  editIsPrivate,
  editColor,
  editLeaderId,
  setEditName,
  setEditDesc,
  setEditIsPrivate,
  setEditColor,
  setEditLeaderId,
  onClose,
  onEditClick,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onRemoveMember,
  onAddMemberClick,
}: TeamDrawerProps) {
  const [memberSearch, setMemberSearch] = useState("");

  if (!team) return null;

  const isAdmin = myRole === "owner" || myRole === "admin";
  // Contextual RBAC: Is the current user the leader of THIS specific team?
  const isLeaderOfThisTeam = team.leaders.includes(myUsername);
  const canManage = isAdmin || isLeaderOfThisTeam;

  const RoleBadge = ({ role }: { role: string }) => {
    const s = getRoleBadgeStyle(role);
    return (
      <span
        style={{
          padding: "4px 8px",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          background: s.bg,
          color: s.color,
          textTransform: "capitalize",
        }}
      >
        {role}
      </span>
    );
  };

  const filteredMembers = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.username.toLowerCase().includes(memberSearch.toLowerCase()),
  );

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
          width: 450,
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

        {/* Header */}
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
            Team Details
          </h3>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {canManage && !isEditing && (
              <button
                onClick={onEditClick}
                style={{
                  background: "transparent",
                  border: "none",
                  color: tk.brandLight,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Edit3 size={14} /> Edit
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: tk.textMuted,
                cursor: "pointer",
                padding: 4,
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Team Info / Edit Mode */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              background: isEditing ? editColor : team.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            {getInitials(isEditing ? editName : team.name)}
          </div>
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 6,
                  border: `1px solid ${tk.border}`,
                  background: tk.bg,
                  color: tk.textPrimary,
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              />
            ) : (
              <div
                style={{ fontSize: 20, fontWeight: 700, color: tk.textPrimary }}
              >
                {team.name}
              </div>
            )}
            <div
              style={{
                fontSize: 13,
                color: tk.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: tk.textSecondary, background: tk.surfaceHover, padding: "2px 8px", borderRadius: 4 }}>
                {team.leaders?.[0] || "No Leader"}
              </span>
              <span>•</span>
              {isEditing ? (
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    onClick={() => setEditIsPrivate(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      color: !editIsPrivate ? tk.brandLight : tk.textMuted,
                      fontWeight: 600,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    <Globe size={12} /> Public
                  </button>
                  <button
                    onClick={() => setEditIsPrivate(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      color: editIsPrivate ? tk.brandLight : tk.textMuted,
                      fontWeight: 600,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    <Lock size={12} /> Private
                  </button>
                </div>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {team.is_private ? <Lock size={12} /> : <Globe size={12} />}{" "}
                  {team.is_private ? "Private" : "Public"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description / Color Picker */}
        <div style={{ display: "grid", gap: 16, marginBottom: 32 }}>
          {isEditing ? (
            <>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: tk.textMuted,
                    textTransform: "uppercase",
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 6,
                    border: `1px solid ${tk.border}`,
                    background: tk.bg,
                    color: tk.textPrimary,
                    resize: "vertical",
                  }}
                  placeholder="What does this team do?"
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: tk.textMuted,
                    textTransform: "uppercase",
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Team Color
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: `2px solid ${editColor === c ? "#FFFFFF" : "transparent"}`,
                        background: c,
                        cursor: "pointer",
                        transition: "border-color 0.2s",
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: tk.textMuted,
                    textTransform: "uppercase",
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Team Leader
                </label>
                <select
                  value={editLeaderId}
                  onChange={(e) => setEditLeaderId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 6,
                    border: `1px solid ${tk.border}`,
                    background: tk.bg,
                    color: tk.textPrimary,
                    fontSize: 14,
                  }}
                >
                  <option value="">No Leader</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.full_name || m.username}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
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
                }}
              >
                Description
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: tk.textSecondary,
                  lineHeight: 1.5,
                }}
              >
                {team.description || "No description provided."}
              </div>
            </div>
          )}
        </div>

        {isEditing ? (
          <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
            <button
              onClick={onCancelEdit}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                border: `1px solid ${tk.border}`,
                background: "transparent",
                color: tk.textSecondary,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              onClick={onSaveEdit}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                border: "none",
                background: tk.brand,
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <CheckCircle2 size={16} /> Save Changes
            </button>
          </div>
        ) : (
          <>
            {/* Members Section */}
            <div style={{ marginBottom: 32 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <h4
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: tk.textSecondary,
                    margin: 0,
                    textTransform: "uppercase",
                  }}
                >
                  Members ({members.length})
                </h4>
                {canManage && (
                  <button
                    onClick={onAddMemberClick}
                    style={{
                      background: "none",
                      border: "none",
                      color: tk.brandLight,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Plus size={14} /> Add Member
                  </button>
                )}
              </div>

              {members.length > 5 && (
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <Search
                    size={14}
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: tk.textMuted,
                    }}
                  />
                  <input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members..."
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 32px",
                      borderRadius: 6,
                      border: `1px solid ${tk.border}`,
                      background: tk.bg,
                      color: tk.textPrimary,
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              )}

              <div style={{ display: "grid", gap: 8 }}>
                {filteredMembers.map((u) => (
                  <div
                    key={u.user_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 8,
                      background: tk.bg,
                      borderRadius: 8,
                      border: `1px solid ${tk.border}`,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${tk.brand}, ${tk.brandLight})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#fff",
                      }}
                    >
                      {(u.full_name || u.username).charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: tk.textPrimary,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {u.full_name || u.username}
                      </div>
                      <div style={{ fontSize: 12, color: tk.textMuted }}>
                        @{u.username}
                      </div>
                    </div>
                    {/* Check if user is leader of THIS specific team */}
                    {(() => {
                      const userTeams = (u as any).teams || [];
                      const teamMembership = userTeams.find((t: any) => t.id === team.id);
                      if (teamMembership?.is_leader) {
                        return (
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              background: "rgba(245, 176, 65, 0.15)",
                              color: tk.warning,
                              textTransform: "capitalize",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Crown size={12} /> Leader
                          </span>
                        );
                      }
                      return <RoleBadge role={u.role} />;
                    })()}
                    {canManage && u.role !== "owner" && (
                      <button
                        onClick={() => onRemoveMember(u.user_id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: tk.textMuted,
                          cursor: "pointer",
                          padding: 4,
                        }}
                        title="Remove from team"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {filteredMembers.length === 0 && (
                  <div
                    style={{
                      padding: 16,
                      textAlign: "center",
                      color: tk.textMuted,
                      background: tk.bg,
                      borderRadius: 8,
                      border: `1px solid ${tk.border}`,
                    }}
                  >
                    No members found.
                  </div>
                )}
              </div>
            </div>

            {/* Insights Placeholders Removed per Phase 8 MVP */}

            {/* Delete Section */}
            {isAdmin && (
              <div
                style={{ borderTop: `1px solid ${tk.border}`, paddingTop: 24 }}
              >
                <button
                  onClick={onDelete}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 8,
                    border: `1px solid ${tk.primary}30`,
                    background: "transparent",
                    color: tk.primary,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Trash2 size={16} /> Delete Team
                </button>
                <p
                  style={{
                    fontSize: 11,
                    color: tk.textMuted,
                    textAlign: "center",
                    marginTop: 8,
                  }}
                >
                  Members will be automatically moved to "Unassigned".
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

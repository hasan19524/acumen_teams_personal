// features/teams/components/AddMemberModal.tsx
"use client";

import { useState } from "react";
import { X, Search, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { tk, Member, Team } from "../lib";
import { workspaceService } from "@/features/workspace/workspaceService";

interface AddMemberModalProps {
  showModal: boolean;
  onClose: () => void;
  onAdd: (userId: number) => Promise<void>;
  isAdding: boolean;
  team: Team | null;
  workspaceMembers: Member[];
  currentTeamMemberIds: number[];
}

export function AddMemberModal({
  showModal,
  onClose,
  onAdd,
  isAdding,
  team,
  workspaceMembers,
  currentTeamMemberIds,
}: AddMemberModalProps) {
  const [search, setSearch] = useState("");
  const [invitedIds, setInvitedIds] = useState<number[]>([]);

  const handleInvite = async (userId: number) => {
    if (!team) return;
    try {
      await workspaceService.inviteTeamMember(team.id, userId);
      setInvitedIds((prev) => [...prev, userId]);
    } catch (err: any) {
      // If it's a 409 (Invite already pending), we can safely mark them as invited in the UI
      // to prevent them from clicking again, and show a friendly message.
      if (err.message.includes("pending")) {
        setInvitedIds((prev) => [...prev, userId]);
        alert("This user already has a pending invitation for this team.");
      } else {
        alert(err.message || "Failed to send team invite.");
      }
    }
  };

  if (!showModal || !team) return null;

  const availableMembers = workspaceMembers.filter(
    (m) =>
      !currentTeamMemberIds.includes(m.user_id) &&
      !invitedIds.includes(m.user_id) &&
      (m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        m.username.toLowerCase().includes(search.toLowerCase())),
  );

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
          maxWidth: 420,
          padding: 24,
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
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
            Add to {team.name}
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

        <div style={{ position: "relative", marginBottom: 16 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: tk.textMuted,
              pointerEvents: "none",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspace members..."
            autoFocus
            style={{
              width: "100%",
              padding: "10px 14px 10px 36px",
              borderRadius: 8,
              border: `1px solid ${tk.border}`,
              background: tk.bg,
              color: tk.textPrimary,
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div
          style={{
            maxHeight: 300,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {availableMembers.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: tk.textMuted,
                fontSize: 13,
              }}
            >
              No members available to add.
            </div>
          ) : (
            availableMembers.map((u) => (
              <div
                key={u.user_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 8,
                  borderRadius: 8,
                  background: tk.bg,
                  border: `1px solid ${tk.border}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: tk.textPrimary,
                      }}
                    >
                      {u.full_name || u.username}
                    </div>
                    <div style={{ fontSize: 12, color: tk.textMuted }}>
                      @{u.username}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleInvite(u.user_id)}
                  disabled={invitedIds.includes(u.user_id)}
                  style={{
                    background: invitedIds.includes(u.user_id) ? tk.surfaceHover : tk.brand,
                    border: "none",
                    color: "#fff",
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: invitedIds.includes(u.user_id) ? 0.5 : 1,
                  }}
                >
                  {invitedIds.includes(u.user_id) ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

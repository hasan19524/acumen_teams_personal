"use client";

import { useState } from "react";
import { X, Search, Plus, CheckCircle2 } from "lucide-react";
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

  const handleAddMember = async (userId: number) => {
    if (!team) return;
    try {
      await workspaceService.addTeamMember(team.id, userId);
      setInvitedIds((prev) => [...prev, userId]);
      // Trigger parent refresh to immediately reflect the new member
      await onAdd(userId);
    } catch (err: any) {
      if (err.message.includes("already belongs to this team")) {
        setInvitedIds((prev) => [...prev, userId]);
        alert("This user is already in the team.");
      } else {
        alert(err.message || "Failed to add member to team.");
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-sm p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-[var(--heading)]">
            Add to {team.name}
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspace members..."
            autoFocus
            className="w-full p-2.5 pl-9 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--heading)] text-sm outline-none focus:border-[var(--brand-light)]"
          />
        </div>

        <div className="max-h-72 overflow-y-auto flex flex-col gap-2">
          {availableMembers.length === 0 ? (
            <div className="p-6 text-center text-[var(--text-muted)] text-sm">
              No members available to add.
            </div>
          ) : (
            availableMembers.map((u) => (
              <div
                key={u.user_id}
                className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--heading)] font-semibold text-sm flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${tk.brand}, ${tk.brandLight})`,
                    }}
                  >
                    {(u.full_name || u.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--heading)] truncate">
                      {u.full_name || u.username}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      @{u.username}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleAddMember(u.user_id)}
                  disabled={invitedIds.includes(u.user_id)}
                  className="bg-[var(--brand)] border-none text-[var(--heading)] w-8 h-8 rounded-md cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:bg-[var(--surface-hover)]"
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

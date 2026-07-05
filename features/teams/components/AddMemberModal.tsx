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

  const handleInvite = async (userId: number) => {
    if (!team) return;
    try {
      await workspaceService.inviteTeamMember(team.id, userId);
      setInvitedIds((prev) => [...prev, userId]);
    } catch (err: any) {
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#172440] border border-[#2A3A5C] rounded-xl w-full max-w-sm p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-white">Add to {team.name}</h2>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-[#7A86A7] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A86A7] pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspace members..."
            autoFocus
            className="w-full p-2.5 pl-9 rounded-lg border border-[#2A3A5C] bg-[#081325] text-white text-sm outline-none focus:border-[#5DADE2]"
          />
        </div>

        <div className="max-h-72 overflow-y-auto flex flex-col gap-2">
          {availableMembers.length === 0 ? (
            <div className="p-6 text-center text-[#7A86A7] text-sm">
              No members available to add.
            </div>
          ) : (
            availableMembers.map((u) => (
              <div
                key={u.user_id}
                className="flex items-center justify-between p-2 rounded-lg bg-[#081325] border border-[#2A3A5C]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${tk.brand}, ${tk.brandLight})`,
                    }}
                  >
                    {(u.full_name || u.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {u.full_name || u.username}
                    </div>
                    <div className="text-xs text-[#7A86A7]">@{u.username}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleInvite(u.user_id)}
                  disabled={invitedIds.includes(u.user_id)}
                  className="bg-[#4B1587] border-none text-white w-8 h-8 rounded-md cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:bg-[#20304E]"
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

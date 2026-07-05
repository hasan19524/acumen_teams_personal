"use client";

import { useState } from "react";
import { X, Plus, Lock, Globe, Loader2, Search, Check } from "lucide-react";
import { tk, Member } from "../lib";

interface CreateTeamModalProps {
  showModal: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<any>;
  isCreating: boolean;
  users: Member[];
}

const PRESET_COLORS = [
  "#4B1587",
  "#E31E24",
  "#1FA463",
  "#F5B041",
  "#5DADE2",
  "#0D1B3D",
];

export function CreateTeamModal({
  showModal,
  onClose,
  onCreate,
  isCreating,
  users,
}: CreateTeamModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  if (!showModal) return null;

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await onCreate({
      name,
      description,
      leader_id: leaderId ? Number(leaderId) : null,
      is_private: isPrivate,
      color,
      member_ids: selectedMembers,
    });
    setName("");
    setDescription("");
    setLeaderId("");
    setIsPrivate(false);
    setColor(PRESET_COLORS[0]);
    setSelectedMembers([]);
    setMemberSearch("");
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#172440] border border-[#2A3A5C] rounded-xl w-full max-w-md p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">Create New Team</h2>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-[#7A86A7] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-[#7A86A7] uppercase tracking-wider mb-1.5 block">
                Team Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Engineering"
                autoFocus
                className="w-full p-2.5 rounded-lg border border-[#2A3A5C] bg-[#081325] text-white text-sm outline-none focus:border-[#5DADE2]"
              />
            </div>
            <div className="flex gap-1.5 pb-1 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-md cursor-pointer transition-all"
                  style={{
                    border: `2px solid ${color === c ? "#FFFFFF" : "transparent"}`,
                    background: c,
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#7A86A7] uppercase tracking-wider mb-1.5 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What does this team do?"
              className="w-full p-2.5 rounded-lg border border-[#2A3A5C] bg-[#081325] text-white text-sm outline-none focus:border-[#5DADE2] resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#7A86A7] uppercase tracking-wider mb-1.5 block">
                Team Leader
              </label>
              <select
                value={leaderId}
                onChange={(e) => setLeaderId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-[#2A3A5C] bg-[#081325] text-white text-sm outline-none focus:border-[#5DADE2]"
              >
                <option value="">Select a leader...</option>
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.full_name || u.username}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#7A86A7] uppercase tracking-wider mb-1.5 block">
                Visibility
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPrivate(false)}
                  className={`flex-1 p-2.5 rounded-lg border font-semibold text-sm cursor-pointer flex items-center justify-center gap-1.5 ${!isPrivate ? "bg-[#4B1587] border-[#4B1587] text-white" : "border-[#2A3A5C] text-[#B7C0D8]"}`}
                >
                  <Globe size={14} /> Public
                </button>
                <button
                  onClick={() => setIsPrivate(true)}
                  className={`flex-1 p-2.5 rounded-lg border font-semibold text-sm cursor-pointer flex items-center justify-center gap-1.5 ${isPrivate ? "bg-[#4B1587] border-[#4B1587] text-white" : "border-[#2A3A5C] text-[#B7C0D8]"}`}
                >
                  <Lock size={14} /> Private
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#7A86A7] uppercase tracking-wider mb-1.5 block">
              Add Members (Optional)
            </label>
            <div className="relative mb-3">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A86A7] pointer-events-none"
              />
              <input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search members to add..."
                className="w-full p-2.5 pl-9 rounded-lg border border-[#2A3A5C] bg-[#081325] text-white text-sm outline-none focus:border-[#5DADE2]"
              />
            </div>
            <div className="max-h-44 overflow-y-auto border border-[#2A3A5C] rounded-lg bg-[#081325]">
              {users
                .filter(
                  (u) =>
                    u.full_name
                      .toLowerCase()
                      .includes(memberSearch.toLowerCase()) ||
                    u.username
                      .toLowerCase()
                      .includes(memberSearch.toLowerCase()),
                )
                .map((u) => (
                  <div
                    key={u.user_id}
                    onClick={() =>
                      setSelectedMembers((prev) =>
                        prev.includes(u.user_id)
                          ? prev.filter((id) => id !== u.user_id)
                          : [...prev, u.user_id],
                      )
                    }
                    className="flex items-center gap-2.5 p-2.5 cursor-pointer border-b border-[#2A3A5C] last:border-0 hover:bg-[#172440]"
                  >
                    <div
                      className="w-5 h-5 rounded border flex items-center justify-center"
                      style={{
                        border: `1px solid ${selectedMembers.includes(u.user_id) ? "#4B1587" : "#2A3A5C"}`,
                        background: selectedMembers.includes(u.user_id)
                          ? "#4B1587"
                          : "transparent",
                      }}
                    >
                      {selectedMembers.includes(u.user_id) && (
                        <Check size={14} color="#fff" />
                      )}
                    </div>
                    <span className="text-sm text-white">
                      {u.full_name || u.username}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isCreating}
            className="w-full p-3 rounded-lg border-none bg-[#4B1587] text-white font-bold text-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creating...
              </>
            ) : (
              <>
                <Plus size={16} /> Create Team
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

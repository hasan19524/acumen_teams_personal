"use client";

import { useState } from "react";
import {
  X,
  Trash2,
  Edit3,
  Search,
  Plus,
  Lock,
  Globe,
  CheckCircle2,
  MoreHorizontal,
} from "lucide-react";
import { tk, Team, Member, getRoleBadgeStyle, getInitials } from "../lib";
import Avatar from "@/components/Avatar";
import { useProfileStore } from "@/features/dashboard/store/profileStore";

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
  onPromote: (userId: number) => void;
  onDemote: (userId: number) => void;
}

const PRESET_COLORS = [
  "#4B1587",
  "#E31E24",
  "#1FA463",
  "#F5B041",
  "#5DADE2",
  "#0D1B3D",
];
const menuBtnStyle: string =
  "flex items-center gap-2 px-3 py-2 bg-transparent border-none text-[#B7C0D8] text-[13px] w-full text-left cursor-pointer hover:bg-[#20304E]";

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
  onPromote,
  onDemote,
}: TeamDrawerProps) {
  const [memberSearch, setMemberSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const openProfile = useProfileStore((s) => s.openProfile);

  if (!team) return null;

  const isAdmin = myRole === "owner" || myRole === "admin";
  const isLeaderOfThisTeam = team.leaders.includes(myUsername);
  const canManage = isAdmin || isLeaderOfThisTeam;

  const RoleBadge = ({ role }: { role: string }) => {
    const s = getRoleBadgeStyle(role);
    return (
      <span
        className="px-2 py-1 rounded-md text-[11px] font-semibold capitalize"
        style={{ background: s.bg, color: s.color }}
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
      className="fixed inset-0 bg-black/60 z-[100] flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-[450px] h-screen bg-[#172440] border-l border-[#2A3A5C] p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-bold text-white">Team Details</h3>
          <div className="flex gap-3 items-center">
            {canManage && !isEditing && (
              <button
                onClick={onEditClick}
                className="bg-transparent border-none text-[#5DADE2] cursor-pointer text-sm font-semibold flex items-center gap-1"
              >
                <Edit3 size={14} /> Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-transparent border-none text-[#7A86A7] cursor-pointer p-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
            style={{ background: isEditing ? editColor : team.color }}
          >
            {getInitials(isEditing ? editName : team.name)}
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full p-2 rounded-md border border-[#2A3A5C] bg-[#081325] text-white text-lg font-bold mb-1"
              />
            ) : (
              <div className="text-xl font-bold text-white truncate">
                {team.name}
              </div>
            )}
            <div className="text-xs text-[#7A86A7] flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-[#B7C0D8] bg-[#20304E] px-2 py-0.5 rounded">
                {team.leaders?.[0] || "No Leader"}
              </span>
              <span>•</span>
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditIsPrivate(false)}
                    className={`flex items-center gap-1 font-semibold bg-none border-none cursor-pointer text-xs ${!editIsPrivate ? "text-[#5DADE2]" : "text-[#7A86A7]"}`}
                  >
                    <Globe size={12} /> Public
                  </button>
                  <button
                    onClick={() => setEditIsPrivate(true)}
                    className={`flex items-center gap-1 font-semibold bg-none border-none cursor-pointer text-xs ${editIsPrivate ? "text-[#5DADE2]" : "text-[#7A86A7]"}`}
                  >
                    <Lock size={12} /> Private
                  </button>
                </div>
              ) : (
                <span className="flex items-center gap-1">
                  {team.is_private ? <Lock size={12} /> : <Globe size={12} />}{" "}
                  {team.is_private ? "Private" : "Public"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 mb-8">
          {isEditing ? (
            <>
              <div>
                <label className="text-[11px] text-[#7A86A7] uppercase mb-1.5 block">
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full p-2 rounded-md border border-[#2A3A5C] bg-[#081325] text-white resize-y"
                  placeholder="What does this team do?"
                ></textarea>
              </div>
              <div>
                <label className="text-[11px] text-[#7A86A7] uppercase mb-1.5 block">
                  Team Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      className="w-7 h-7 rounded-md cursor-pointer transition-all"
                      style={{
                        border: `2px solid ${editColor === c ? "#FFFFFF" : "transparent"}`,
                        background: c,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#7A86A7] uppercase mb-1.5 block">
                  Team Leader
                </label>
                <select
                  value={editLeaderId}
                  onChange={(e) => setEditLeaderId(e.target.value)}
                  className="w-full p-2 rounded-md border border-[#2A3A5C] bg-[#081325] text-white text-sm"
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
            <div className="p-4 bg-[#081325] rounded-lg border border-[#2A3A5C]">
              <div className="text-[11px] text-[#7A86A7] uppercase mb-1">
                Description
              </div>
              <div className="text-sm text-[#B7C0D8] leading-relaxed">
                {team.description || "No description provided."}
              </div>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="flex gap-2 mb-8">
            <button
              onClick={onCancelEdit}
              className="flex-1 p-2.5 rounded-lg border border-[#2A3A5C] bg-transparent text-[#B7C0D8] cursor-pointer font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={onSaveEdit}
              className="flex-1 p-2.5 rounded-lg border-none bg-[#4B1587] text-white cursor-pointer font-semibold flex items-center justify-center gap-1"
            >
              <CheckCircle2 size={16} /> Save Changes
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-[#B7C0D8] uppercase">
                  Members ({members.length})
                </h4>
                {canManage && (
                  <button
                    onClick={onAddMemberClick}
                    className="bg-none border-none text-[#5DADE2] cursor-pointer text-sm font-semibold flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Member
                  </button>
                )}
              </div>

              {members.length > 5 && (
                <div className="relative mb-3">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A86A7]"
                  />
                  <input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members..."
                    className="w-full p-2 pl-8 rounded-md border border-[#2A3A5C] bg-[#081325] text-white text-sm outline-none"
                  />
                </div>
              )}

              <div className="grid gap-2">
                {filteredMembers.map((u) => {
                  const userTeams = (u as any).teams || [];
                  const teamMembership = userTeams.find(
                    (t: any) => t.id === team.id,
                  );
                  const isUserLeader = teamMembership?.is_leader;
                  const canManageUser =
                    canManage &&
                    u.role !== "owner" &&
                    (isAdmin || !isUserLeader);

                  return (
                    <div
                      key={u.user_id}
                      className="flex items-center gap-3 p-2 bg-[#081325] rounded-lg border border-[#2A3A5C]"
                    >
                      <div
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openProfile(u)}
                      >
                        <Avatar
                          src={u.profile_image}
                          name={u.full_name || u.username}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate">
                            {u.full_name || u.username}
                          </div>
                          <div className="text-xs text-[#7A86A7]">
                            @{u.username}
                          </div>
                        </div>
                      </div>

                      {isUserLeader ? (
                        <span
                          className="px-2 py-1 rounded-md text-[11px] font-semibold capitalize"
                          style={{
                            background: "rgba(245, 176, 65, 0.15)",
                            color: tk.warning,
                          }}
                        >
                          Leader
                        </span>
                      ) : (
                        <RoleBadge role={u.role} />
                      )}

                      {canManageUser && (
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === u.user_id ? null : u.user_id,
                              )
                            }
                            className="bg-none border-none text-[#7A86A7] cursor-pointer p-1"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          {openMenuId === u.user_id && (
                            <>
                              <div
                                className="fixed inset-0 z-[99]"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute top-8 right-0 bg-[#172440] border border-[#2A3A5C] rounded-lg z-[100] w-48 shadow-2xl">
                                {!isUserLeader && (
                                  <button
                                    onClick={() => {
                                      onPromote(u.user_id);
                                      setOpenMenuId(null);
                                    }}
                                    className={menuBtnStyle}
                                  >
                                    Promote to Leader
                                  </button>
                                )}
                                {isUserLeader && isAdmin && (
                                  <button
                                    onClick={() => {
                                      onDemote(u.user_id);
                                      setOpenMenuId(null);
                                    }}
                                    className={menuBtnStyle}
                                  >
                                    Demote from Leader
                                  </button>
                                )}
                                <div className="h-px bg-[#2A3A5C] my-1" />
                                <button
                                  onClick={() => {
                                    onRemoveMember(u.user_id);
                                    setOpenMenuId(null);
                                  }}
                                  className={`${menuBtnStyle} text-[#E31E24]`}
                                >
                                  Remove from Team
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredMembers.length === 0 && (
                  <div className="p-4 text-center text-[#7A86A7] bg-[#081325] rounded-lg border border-[#2A3A5C]">
                    No members found.
                  </div>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="border-t border-[#2A3A5C] pt-6">
                <button
                  onClick={onDelete}
                  className="w-full p-3 rounded-lg border border-[#E31E24]/30 bg-transparent text-[#E31E24] font-semibold cursor-pointer text-sm flex items-center justify-center gap-2 hover:bg-[#E31E24]/10"
                >
                  <Trash2 size={16} /> Delete Team
                </button>
                <p className="text-[11px] text-[#7A86A7] text-center mt-2">
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

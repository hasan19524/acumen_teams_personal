"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  UserPlus,
  Plus,
  Building2,
  Users,
  Mail,
  Loader2,
  AlertTriangle,
  X,
  Trash2,
  MoreHorizontal,
  Shield,
  Link as LinkIcon,
} from "lucide-react";
import { workspaceService } from "@/features/workspace/workspaceService";
import {
  tk,
  Team,
  Member,
  useGroupedMembers,
  getRoleBadgeStyle,
} from "@/features/teams/lib";
import { TeamCard } from "@/features/teams/components/TeamCard";
import { TeamDrawer } from "@/features/teams/components/TeamDrawer";
import { CreateTeamModal } from "@/features/teams/components/CreateTeamModal";
import { AddMemberModal } from "@/features/teams/components/AddMemberModal";
import { useProfileStore } from "@/features/dashboard/store/profileStore";
import { InviteManager } from "@/features/teams/components/InviteManager";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/Avatar";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";

type Tab = "teams" | "members" | "invites";

export default function TeamPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("teams");
  const [search, setSearch] = useState("");

  const [users, setUsers] = useState<Member[]>(
    () => useWorkspaceStore.getState().members || [],
  );
  const [teams, setTeams] = useState<Team[]>(() => {
    const cached = useWorkspaceStore.getState().teams || [];
    return cached.filter(
      (t: Team) =>
        t.team_type !== "general" && t.name?.toLowerCase() !== "general",
    );
  });
  const [isLoading, setIsLoading] = useState(() => {
    const s = useWorkspaceStore.getState();
    return s.members.length === 0 || s.teams.length === 0 || !s.stats;
  });
  const [statsData, setStatsData] = useState<any>(
    () => useWorkspaceStore.getState().stats || null,
  );
  const [myRole, setMyRole] = useState<string>(
    () => useWorkspaceStore.getState().stats?.role || "member",
  );
  const [myUsername, setMyUsername] = useState("");
  const [inviteCounts, setInviteCounts] = useState({
    workspace: 0,
    teams: 0,
    private_groups: 0,
  });
  const [activeLinks, setActiveLinks] = useState<any[]>([]);

  // Team Drawer State
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editIsPrivate, setIsEditPrivate] = useState(false);
  const [editColor, setEditColor] = useState("var(--brand)");
  const [editLeaderId, setEditLeaderId] = useState("");

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [confirmDeleteTeam, setConfirmDeleteTeam] = useState<Team | null>(null);
  const [showLeadersModal, setShowLeadersModal] = useState(false);

  // Member Drawer & Actions State
  const openProfile = useProfileStore((s) => s.openProfile);
  const [confirmAction, setConfirmAction] = useState<{
    type: string;
    user: Member;
  } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top?: string; bottom?: string }>({
    top: "100%",
  });

  const isAdmin = myRole === "owner" || myRole === "admin";

  const fetchAllData = async () => {
    const s = useWorkspaceStore.getState();
    // FIX: Only show skeletons if the pipeline didn't preload data
    if (s.members.length === 0 || s.teams.length === 0 || !s.stats) {
      setIsLoading(true);
    }

    try {
      const [membersData, teamsData, statsData, countsData] = await Promise.all(
        [
          s.members.length > 0
            ? Promise.resolve(s.members)
            : workspaceService.getMembers(),
          s.teams.length > 0
            ? Promise.resolve(s.teams)
            : workspaceService.getTeams(),
          s.stats ? Promise.resolve(s.stats) : workspaceService.getStats(),
          import("@/features/chat/services/inviteService").then((m) =>
            m.loadInviteCounts(),
          ),
        ],
      );

      setUsers(Array.isArray(membersData) ? membersData : []);
      const filtered = Array.isArray(teamsData)
        ? teamsData.filter(
            (t: Team) =>
              t.team_type !== "general" && t.name?.toLowerCase() !== "general",
          )
        : [];
      setTeams(filtered);
      setStatsData(statsData);
      if (statsData?.role) setMyRole(statsData.role);
      setMyUsername(localStorage.getItem("username") || "");
      setInviteCounts(countsData);

      if (statsData?.role === "owner" || statsData?.role === "admin") {
        try {
          const sentData = await workspaceService.getSentInvites();
          setActiveLinks(sentData.items || []);
        } catch (e) {
          console.error("Failed to fetch sent invites");
        }
      }
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const groupedMembers = useGroupedMembers(users);
  const selectedTeamMembers = selectedTeam
    ? groupedMembers.get(selectedTeam.id) || []
    : [];

  const filteredTeams = useMemo(() => {
    const q = search.toLowerCase();
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.leaders || []).some((l) => l.toLowerCase().includes(q)) ||
        (groupedMembers.get(t.id) || []).some(
          (m) =>
            m.full_name.toLowerCase().includes(q) ||
            m.username.toLowerCase().includes(q),
        ),
    );
  }, [teams, search, groupedMembers]);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.username || "").toLowerCase().includes(search.toLowerCase()),
    );
  }, [users, search]);

  const handleCreateTeam = async (data: any) => {
    try {
      await workspaceService.createTeam(data);
      setShowCreateModal(false);
      fetchAllData();
    } catch {
      alert("Failed to create team");
    }
  };

  const handleSaveTeam = async () => {
    if (!selectedTeam) return;
    try {
      await workspaceService.updateTeam(selectedTeam.id, {
        name: editName,
        description: editDesc,
        is_private: editIsPrivate,
        color: editColor,
      });
      fetchAllData();
      setIsEditingTeam(false);
      setSelectedTeam(null);
    } catch (err: any) {
      alert(err.message || "Failed to update team");
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirmDeleteTeam) return;
    try {
      await workspaceService.deleteTeam(confirmDeleteTeam.id);
      setConfirmDeleteTeam(null);
      setSelectedTeam(null);
      fetchAllData();
    } catch {
      alert("Failed to delete team");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!selectedTeam) return;
    try {
      await workspaceService.moveTeam(userId, null);
      fetchAllData();
    } catch {
      alert("Failed to remove member");
    }
  };

  const handlePromoteLeader = async (userId: number) => {
    if (!selectedTeam) return;
    try {
      await workspaceService.promoteTeamLeader(selectedTeam.id, userId);
      await fetchAllData();
      await refreshUser();
    } catch (err: any) {
      alert(err.message || "Failed to promote leader");
    }
  };

  const handleDemoteLeader = async (userId: number) => {
    if (!selectedTeam) return;
    try {
      await workspaceService.demoteTeamLeader(selectedTeam.id, userId);
      await fetchAllData();
      await refreshUser();
    } catch (err: any) {
      alert(err.message || "Failed to demote leader");
    }
  };

  const handleAddMember = async (userId: number) => {
    if (!selectedTeam) return;
    try {
      await workspaceService.moveTeam(userId, selectedTeam.id);
      await fetchAllData();
      setShowAddMemberModal(false);
    } catch (err: any) {
      let errorMsg = "Failed to add member to team.";
      if (err.message) {
        try {
          const parsed = JSON.parse(err.message);
          errorMsg = parsed.error || parsed.detail || errorMsg;
        } catch {
          errorMsg = err.message;
        }
      }
      alert(errorMsg);
    }
  };

  const handleMemberAction = async (
    action: string,
    userId: number,
    value?: string,
  ) => {
    try {
      if (action === "remove") await workspaceService.removeMember(userId);
      else if (action === "role")
        await workspaceService.updateMemberRole(userId, value || "");
      else if (action === "move")
        await workspaceService.moveTeam(userId, value ? Number(value) : null);
      setConfirmAction(null);
      fetchAllData();
    } catch {
      alert(`Failed to ${action}`);
    }
  };

  const RoleBadge = ({
    role,
    isLeader = false,
  }: {
    role: string;
    isLeader?: boolean;
  }) => {
    const displayRole = isLeader && role === "member" ? "leader" : role;
    const s = getRoleBadgeStyle(displayRole);
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
        {displayRole}
      </span>
    );
  };

  const menuBtnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    background: "transparent",
    border: "none",
    color: tk.textSecondary,
    fontSize: 13,
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
  };

  return (
    <main
      className="w-full"
      style={{
        background: tk.bg,
        color: tk.textPrimary,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .skeleton { background: linear-gradient(90deg, ${tk.surface} 25%, ${tk.surfaceHover} 50%, ${tk.surface} 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        .member-row:hover { background: ${tk.surfaceHover} !important; }
      `}</style>

      {/* =========================================
          1. LOCKED TOP SECTION (Sticky)
      ========================================= */}
      <div className="sticky top-0 z-10 p-4 md:p-8 pb-4 bg-[var(--bg)] border-b border-[var(--border)]/50">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">
                Workspace Administration
              </h1>
              <p className="text-sm mt-1" style={{ color: tk.textSecondary }}>
                Manage members, teams and permissions.
              </p>
            </div>
            {isAdmin && (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ background: tk.brand, color: "#fff" }}
                >
                  <UserPlus size={16} /> Invite
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border"
                  style={{ borderColor: tk.borderHover, color: tk.textPrimary }}
                >
                  <Plus size={16} /> Create Team
                </button>
              </div>
            )}
          </div>

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <SummaryCard
              label="Members"
              value={isLoading ? "..." : (statsData?.total_members ?? 0)}
              icon={Users}
              color={tk.brandLight}
            />
            <SummaryCard
              label="Teams"
              value={isLoading ? "..." : teams.length}
              icon={Building2}
              color={tk.indigo}
            />
            <SummaryCard
              label="Pending Invites"
              value={
                isLoading ? "..." : inviteCounts.workspace + inviteCounts.teams
              }
              icon={Mail}
              color={tk.warning}
            />
            <SummaryCard
              label="Leaders"
              value={isLoading ? "..." : (statsData?.total_leaders ?? 0)}
              icon={Shield}
              color={tk.success}
              onClick={() => !isLoading && setShowLeadersModal(true)}
              interactive={!isLoading}
            />
          </div>

          {/* CONTROLS */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: tk.textMuted }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teams, members, leaders..."
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border outline-none text-sm"
                style={{
                  borderColor: tk.border,
                  background: tk.surface,
                  color: tk.textPrimary,
                }}
              />
            </div>
            <div
              className="flex gap-1 p-1 rounded-lg border"
              style={{ background: tk.surface, borderColor: tk.border }}
            >
              {(["teams", "members", "invites"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-semibold capitalize transition-colors"
                  style={{
                    background: activeTab === tab ? tk.brand : "transparent",
                    color: activeTab === tab ? "#fff" : tk.textSecondary,
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          2. SCROLLABLE LOWER SECTION
      ========================================= */}
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === "teams" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="skeleton h-48 rounded-2xl border"
                    style={{ borderColor: tk.border }}
                  />
                ))
              ) : filteredTeams.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No Teams Found"
                  subtitle={
                    search
                      ? "Try another keyword."
                      : "Create your first team to get started."
                  }
                />
              ) : (
                filteredTeams.map((t) => (
                  <TeamCard
                    key={t.id}
                    team={t}
                    onClick={() => {
                      setSelectedTeam(t);
                      setEditName(t.name);
                      setEditDesc(t.description || "");
                      setIsEditPrivate(t.is_private);
                      setEditColor(t.color || "var(--brand)");
                      setIsEditingTeam(false);
                    }}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === "members" && (
            <div
              className="rounded-xl border overflow-visible"
              style={{ background: tk.surface, borderColor: tk.border }}
            >
              {/* Desktop Header */}
              <div
                className="hidden md:grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_40px] gap-4 px-4 py-3 border-b"
                style={{
                  borderColor: tk.border,
                  color: tk.textMuted,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                <div>Name</div>
                <div>Role</div>
                <div>Teams</div>
                <div>Status</div>
                <div>Joined</div>
                <div></div>
              </div>

              {isLoading ? (
                <div
                  className="p-10 text-center flex justify-center items-center gap-2"
                  style={{ color: tk.textMuted }}
                >
                  <Loader2 size={16} className="animate-spin" /> Loading
                  members...
                </div>
              ) : filteredUsers.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No Members Found"
                  subtitle={
                    search
                      ? "Try another keyword."
                      : "Invite users to your workspace."
                  }
                />
              ) : (
                filteredUsers.map((u, i) => {
                  const isLeader = u.teams.some((t: any) => t.is_leader);
                  return (
                    <div
                      key={u.user_id || i}
                      className="member-row grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1fr_1.5fr_1fr_1fr_40px] gap-4 px-4 py-3 border-b last:border-0 items-center cursor-pointer relative"
                      style={{ borderColor: tk.border }}
                      onClick={() => openProfile(u)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          user={u}
                          src={u.profile_image}
                          name={u.full_name || u.username}
                          size="sm"
                        />
                        <div>
                          <div className="font-semibold text-sm">
                            {u.full_name || u.username}
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: tk.textMuted }}
                          >
                            @{u.username}
                          </div>
                        </div>
                      </div>
                      <div className="hidden md:block">
                        <RoleBadge role={u.role} isLeader={isLeader} />
                      </div>
                      <div className="hidden md:flex flex-wrap gap-1">
                        {u.teams && u.teams.length > 0 ? (
                          u.teams.map((t) => (
                            <span
                              key={t.id}
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{
                                background: tk.bg,
                                color: tk.textSecondary,
                              }}
                            >
                              {t.name}
                            </span>
                          ))
                        ) : (
                          <span
                            className="text-xs"
                            style={{ color: tk.textMuted }}
                          >
                            Unassigned
                          </span>
                        )}
                      </div>
                      <div className="hidden md:flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: tk.success }}
                        />
                        <span
                          className="text-xs"
                          style={{ color: tk.textSecondary }}
                        >
                          Active
                        </span>
                      </div>
                      <div
                        className="hidden md:block text-xs"
                        style={{ color: tk.textSecondary }}
                      >
                        {new Date(u.joined_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div
                        className="flex justify-end relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              if (window.innerHeight - rect.bottom < 200) {
                                setMenuPos({ bottom: "100%", top: "auto" });
                              } else {
                                setMenuPos({ top: "100%", bottom: "auto" });
                              }
                              setOpenMenuId(
                                openMenuId === u.user_id ? null : u.user_id,
                              );
                            }}
                            className="p-1"
                            style={{ color: tk.textMuted }}
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        )}
                        {openMenuId === u.user_id && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div
                              className="absolute right-0 z-30 w-48 rounded-lg shadow-2xl border mt-2 mb-2"
                              style={{
                                ...menuPos,
                                background: tk.surface,
                                borderColor: tk.borderHover,
                              }}
                            >
                              <button
                                onClick={() => {
                                  setConfirmAction({ type: "role", user: u });
                                  setOpenMenuId(null);
                                }}
                                style={menuBtnStyle}
                              >
                                Change Role
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmAction({ type: "move", user: u });
                                  setOpenMenuId(null);
                                }}
                                style={menuBtnStyle}
                              >
                                Move Team
                              </button>
                              <div
                                className="h-px my-1"
                                style={{ background: tk.border }}
                              ></div>
                              <button
                                onClick={() => {
                                  setConfirmAction({ type: "remove", user: u });
                                  setOpenMenuId(null);
                                }}
                                style={{ ...menuBtnStyle, color: tk.primary }}
                              >
                                Remove Member
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "invites" && (
            <div
              className="rounded-xl border overflow-hidden"
              style={{ background: tk.surface, borderColor: tk.border }}
            >
              <div
                className="flex justify-between items-center p-4 border-b"
                style={{ borderColor: tk.border }}
              >
                <h3 className="text-base font-bold">
                  Pending Invitations & Links
                </h3>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                  style={{ background: tk.brand, color: "#fff" }}
                >
                  <Plus size={14} /> Invite User
                </button>
              </div>
              {activeLinks.length === 0 ? (
                <div
                  className="p-10 text-center"
                  style={{ color: tk.textMuted }}
                >
                  No pending invitations or active links. Click "Invite User" to
                  add someone.
                </div>
              ) : (
                activeLinks.map((invite) => (
                  <div
                    key={invite.id}
                    className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-4 p-4 border-b last:border-0 text-sm items-center"
                    style={{ borderColor: tk.border, color: tk.textSecondary }}
                  >
                    <div className="flex items-center gap-2">
                      {invite.type === "Link" ? (
                        <LinkIcon size={16} color={tk.brandLight} />
                      ) : (
                        <Users size={16} color={tk.brandLight} />
                      )}
                      <span
                        className="font-medium truncate"
                        style={{ color: tk.textPrimary }}
                      >
                        {invite.invitee_name}
                      </span>
                    </div>
                    <div className="capitalize">{invite.role}</div>
                    {invite.type === "Link" ? (
                      <div>
                        Uses: {invite.use_count}/
                        {invite.max_uses === 0 ? "∞" : invite.max_uses}
                      </div>
                    ) : (
                      <div className="capitalize">{invite.status}</div>
                    )}
                    <div
                      className="font-semibold capitalize"
                      style={{
                        color: invite.is_valid ? tk.success : tk.textMuted,
                      }}
                    >
                      {invite.type === "Link"
                        ? invite.is_valid
                          ? "Active"
                          : "Expired"
                        : invite.status === "pending"
                          ? "Waiting"
                          : invite.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <CreateTeamModal
        showModal={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateTeam}
        isCreating={false}
        users={users}
      />
      <AddMemberModal
        showModal={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onAdd={handleAddMember}
        isAdding={false}
        team={selectedTeam}
        workspaceMembers={users}
        currentTeamMemberIds={selectedTeamMembers.map((m) => m.user_id)}
      />
      <TeamDrawer
        team={selectedTeam}
        members={selectedTeamMembers}
        myRole={myRole}
        myUsername={myUsername}
        isEditing={isEditingTeam}
        editName={editName}
        editDesc={editDesc}
        editIsPrivate={editIsPrivate}
        editColor={editColor}
        editLeaderId={editLeaderId}
        setEditName={setEditName}
        setEditDesc={setEditDesc}
        setEditIsPrivate={setIsEditPrivate}
        setEditColor={setEditColor}
        setEditLeaderId={setEditLeaderId}
        onClose={() => {
          setSelectedTeam(null);
          setIsEditingTeam(false);
        }}
        onEditClick={() => setIsEditingTeam(true)}
        onCancelEdit={() => setIsEditingTeam(false)}
        onSaveEdit={handleSaveTeam}
        onDelete={() => setConfirmDeleteTeam(selectedTeam)}
        onRemoveMember={handleRemoveMember}
        onAddMemberClick={() => setShowAddMemberModal(true)}
        onPromote={handlePromoteLeader}
        onDemote={handleDemoteLeader}
      />
      <InviteManager
        showModal={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        teams={teams}
      />

      {showLeadersModal && (
        <div
          className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4"
          onClick={() => setShowLeadersModal(false)}
        >
          <div
            className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-xl border"
            style={{ background: tk.surface, borderColor: tk.borderHover }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex justify-between items-center p-4 border-b"
              style={{ borderColor: tk.border }}
            >
              <h3 className="text-base font-bold flex items-center gap-2">
                <Shield size={18} color={tk.success} /> Leaders Directory
              </h3>
              <button
                onClick={() => setShowLeadersModal(false)}
                style={{ color: tk.textMuted }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              {["owner", "admin", "member"].map((role) => {
                const roleUsers = users.filter(
                  (u) =>
                    u.role === role &&
                    (role !== "member" ||
                      u.teams.some((t: any) => t.is_leader)),
                );
                if (roleUsers.length === 0) return null;
                return (
                  <div key={role} className="mb-5">
                    <div
                      className="text-[11px] font-bold uppercase mb-2"
                      style={{ color: tk.textMuted }}
                    >
                      {role === "member" ? "Team Leaders" : role + "s"}
                    </div>
                    {roleUsers.map((u) => (
                      <div
                        key={u.user_id}
                        className="flex items-center gap-3 py-2"
                      >
                        <Avatar
                          user={u}
                          name={u.full_name || u.username}
                          size="sm"
                        />
                        <div className="flex-1">
                          <div
                            className="text-sm font-semibold"
                            style={{ color: tk.textPrimary }}
                          >
                            {u.full_name || u.username}
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: tk.textMuted }}
                          >
                            @{u.username}{" "}
                            {u.teams.length > 0 &&
                              `• Leads: ${u.teams
                                .filter((t: any) => t.is_leader)
                                .map((t: any) => t.name)
                                .join(", ")}`}
                          </div>
                        </div>
                        <RoleBadge
                          role={u.role}
                          isLeader={u.teams.some((t: any) => t.is_leader)}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div
          className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="w-full max-w-sm p-6 rounded-xl border"
            style={{ background: tk.surface, borderColor: tk.border }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold capitalize">
                {confirmAction.type === "remove"
                  ? "Remove Member"
                  : confirmAction.type === "role"
                    ? "Change Role"
                    : "Move Team"}
              </h3>
              <button
                onClick={() => setConfirmAction(null)}
                style={{ color: tk.textMuted }}
              >
                <X size={20} />
              </button>
            </div>
            {confirmAction.type === "remove" && (
              <div>
                <p className="text-sm mb-5" style={{ color: tk.textSecondary }}>
                  Remove{" "}
                  <b style={{ color: tk.textPrimary }}>
                    {confirmAction.user.full_name}
                  </b>{" "}
                  from the workspace?
                </p>
                <div className="flex gap-2">
                  <button
                    className="flex-1 p-2.5 rounded-lg border"
                    style={{ borderColor: tk.border, color: tk.textSecondary }}
                    onClick={() => setConfirmAction(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 p-2.5 rounded-lg"
                    style={{ background: tk.primary, color: "#fff" }}
                    onClick={() =>
                      handleMemberAction("remove", confirmAction.user.user_id)
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
            {confirmAction.type === "role" && (
              <div>
                <select
                  id="role-select"
                  defaultValue={confirmAction.user.role}
                  className="w-full p-2.5 rounded-lg border mb-5"
                  style={{
                    borderColor: tk.border,
                    background: tk.bg,
                    color: tk.textPrimary,
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
                <div className="flex gap-2">
                  <button
                    className="flex-1 p-2.5 rounded-lg border"
                    style={{ borderColor: tk.border, color: tk.textSecondary }}
                    onClick={() => setConfirmAction(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 p-2.5 rounded-lg"
                    style={{ background: tk.brand, color: "#fff" }}
                    onClick={() => {
                      const newRole = (
                        document.getElementById(
                          "role-select",
                        ) as HTMLSelectElement
                      ).value;
                      handleMemberAction(
                        "role",
                        confirmAction.user.user_id,
                        newRole,
                      );
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmDeleteTeam && (
        <div
          className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4"
          onClick={() => setConfirmDeleteTeam(null)}
        >
          <div
            className="w-full max-w-sm p-7 rounded-xl border text-center"
            style={{ background: tk.surface, borderColor: tk.border }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: `${tk.primary}15` }}
            >
              <AlertTriangle size={24} color={tk.primary} />
            </div>
            <h3 className="text-lg font-bold mb-2">Delete Team?</h3>
            <p className="text-sm mb-6" style={{ color: tk.textSecondary }}>
              Members will be moved to "Unassigned". This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 p-3 rounded-lg border font-semibold"
                style={{ borderColor: tk.border, color: tk.textSecondary }}
                onClick={() => setConfirmDeleteTeam(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 p-3 rounded-lg font-semibold"
                style={{ background: tk.primary, color: "#fff" }}
                onClick={handleDeleteTeam}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const SummaryCard = ({
  label,
  value,
  icon: Icon,
  color,
  onClick,
  interactive,
}: any) => (
  <div
    onClick={onClick}
    className="p-4 md:p-5 rounded-xl border transition-colors"
    style={{
      background: tk.surface,
      borderColor: tk.border,
      cursor: interactive ? "pointer" : "default",
    }}
    onMouseEnter={(e) =>
      interactive && (e.currentTarget.style.borderColor = tk.borderHover)
    }
    onMouseLeave={(e) =>
      interactive && (e.currentTarget.style.borderColor = tk.border)
    }
  >
    <div className="flex justify-between items-center mb-3">
      <span
        className="text-xs md:text-sm font-medium"
        style={{ color: tk.textMuted }}
      >
        {label}
      </span>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
      >
        <Icon size={16} style={{ color }} />
      </div>
    </div>
    <div className="text-xl md:text-2xl font-bold">{value}</div>
  </div>
);

const EmptyState = ({ icon: Icon, title, subtitle }: any) => (
  <div
    className="col-span-full p-12 text-center rounded-xl border flex flex-col items-center gap-3"
    style={{
      color: tk.textMuted,
      background: tk.surface,
      borderColor: tk.border,
    }}
  >
    <Icon size={32} style={{ opacity: 0.4 }} />
    <div
      className="font-semibold text-base"
      style={{ color: tk.textSecondary }}
    >
      {title}
    </div>
    <div className="text-sm">{subtitle}</div>
  </div>
);

// app/dashboard/team/page.tsx
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
  ArrowRightCircle,
  MoreHorizontal,
  Shield,
  Link as LinkIcon,
  Crown,
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

type Tab = "teams" | "members" | "invites";

export default function TeamPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("teams");
  const [search, setSearch] = useState("");

  const [users, setUsers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState<any>(null);
  const [myRole, setMyRole] = useState("member");
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
  const [editColor, setEditColor] = useState("#4B1587");
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

  const isAdmin = myRole === "owner" || myRole === "admin";

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [membersData, teamsData, , statsData, countsData] =
        await Promise.all([
          workspaceService.getMembers(),
          workspaceService.getTeams(),
          null,
          workspaceService.getStats(),
          import("@/features/chat/services/inviteService").then((m) =>
            m.loadInviteCounts(),
          ),
        ]);
      setUsers(Array.isArray(membersData) ? membersData : []);
      // Filter: Team page shows custom teams + Unassigned system team, NOT General
      const filtered = Array.isArray(teamsData)
        ? teamsData.filter(
            (t: Team) => t.team_type !== "general" && t.name?.toLowerCase() !== "general"
          )
        : [];
      setTeams(filtered);
      setStatsData(statsData);
      if (statsData?.role) setMyRole(statsData.role);
      setMyUsername(localStorage.getItem("username") || "");
      setInviteCounts(countsData);

      if (statsData?.role === "owner" || statsData?.role === "admin") {
        try {
          const linkData = await workspaceService.getActiveInvites();
          setActiveLinks(linkData.items || []);
        } catch (e) {
          console.error("Failed to fetch invite links");
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

      const currentLeader = users.find((u) =>
        selectedTeam.leaders.includes(u.username),
      );
      const currentLeaderId = currentLeader
        ? String(currentLeader.user_id)
        : "";
      if (editLeaderId && editLeaderId !== currentLeaderId) {
        await workspaceService.promoteTeamLeader(
          selectedTeam.id,
          Number(editLeaderId),
        );
      }

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
      await refreshUser(); // Sync global state instantly
    } catch (err: any) {
      alert(err.message || "Failed to promote leader");
    }
  };

  const handleDemoteLeader = async (userId: number) => {
    if (!selectedTeam) return;
    try {
      await workspaceService.demoteTeamLeader(selectedTeam.id, userId);
      await fetchAllData();
      await refreshUser(); // Sync global state instantly
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
      // Fix: Clean up raw Django JSON response if it exists
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

  return (
    <main
      style={{
        minHeight: "100vh",
        background: tk.bg,
        color: tk.textPrimary,
        fontFamily: "'Inter', sans-serif",
        padding: "32px 40px",
      }}
    >
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .skeleton { background: linear-gradient(90deg, ${tk.surface} 25%, ${tk.surfaceHover} 50%, ${tk.surface} 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        .member-row:hover { background: ${tk.surfaceHover} !important; }
      `}</style>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>
              Workspace Administration
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                color: tk.textSecondary,
                fontSize: "14px",
              }}
            >
              Manage members, teams and permissions.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {isAdmin && (
              <button
                onClick={() => setShowInviteModal(true)}
                style={{
                  height: 40,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: "none",
                  background: tk.brand,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <UserPlus size={16} /> Invite
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  height: 40,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: `1px solid ${tk.borderHover}`,
                  background: "transparent",
                  color: tk.textPrimary,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Plus size={16} /> Create Team
              </button>
            )}
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 24,
          }}
        >
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
            color={tk.brand}
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
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 24,
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: tk.textMuted,
                pointerEvents: "none",
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams, members, leaders..."
              style={{
                width: "100%",
                padding: "10px 16px 10px 40px",
                borderRadius: 8,
                border: `1px solid ${tk.border}`,
                background: tk.surface,
                color: tk.textPrimary,
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: 2,
              background: tk.surface,
              padding: 3,
              borderRadius: 8,
              border: `1px solid ${tk.border}`,
            }}
          >
            {(["teams", "members", "invites"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: activeTab === tab ? tk.brand : "transparent",
                  color: activeTab === tab ? "#fff" : tk.textSecondary,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT AREA */}
        {activeTab === "teams" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{
                    height: 180,
                    borderRadius: 16,
                    border: `1px solid ${tk.border}`,
                  }}
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
                    setEditColor(t.color || "#4B1587");
                    const currentLeader = users.find((u) =>
                      t.leaders.includes(u.username),
                    );
                    setEditLeaderId(
                      currentLeader ? String(currentLeader.user_id) : "",
                    );
                    setIsEditingTeam(false);
                  }}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "members" && (
          <div className="bg-[#172440] border border-[#2A3A5C] rounded-xl">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1.5fr 1fr 1fr 40px",
                padding: "12px 16px",
                borderBottom: `1px solid ${tk.border}`,
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
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: tk.textMuted,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                }}
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
                    className="member-row grid grid-cols-2 md:grid-cols-[2fr_1fr_1.5fr_1fr_1fr_40px] gap-4 px-4 py-3 border-b border-[#2A3A5C] last:border-0 items-center transition-colors cursor-pointer relative"
                    onClick={() => openProfile(u)}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <Avatar
                        user={u}
                        src={u.profile_image}
                        name={u.full_name || u.username}
                        size="sm"
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>
                          {u.full_name || u.username}
                        </div>
                        <div style={{ fontSize: 12, color: tk.textMuted }}>
                          @{u.username}
                        </div>
                      </div>
                    </div>
                    <div>
                      <RoleBadge role={u.role} isLeader={isLeader} />
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {u.teams && u.teams.length > 0 ? (
                        u.teams.map((t) => (
                          <span
                            key={t.id}
                            style={{
                              fontSize: 10,
                              padding: "2px 6px",
                              background: tk.bg,
                              borderRadius: 4,
                              color: tk.textSecondary,
                            }}
                          >
                            {t.name}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 12, color: tk.textMuted }}>
                          Unassigned
                        </span>
                      )}
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: tk.success,
                        }}
                      />
                      <span style={{ fontSize: 13, color: tk.textSecondary }}>
                        Active
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: tk.textSecondary }}>
                      {new Date(u.joined_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "center" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isAdmin && (
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === u.user_id ? null : u.user_id,
                            )
                          }
                          style={{
                            background: "transparent",
                            border: "none",
                            color: tk.textMuted,
                            cursor: "pointer",
                          }}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      )}
                      {openMenuId === u.user_id && (
                        <div
                          style={{
                            position: "absolute",
                            top: 40,
                            right: 10,
                            background: tk.surface,
                            border: `1px solid ${tk.borderHover}`,
                            borderRadius: 8,
                            zIndex: 20,
                            width: 180,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
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
                            style={{
                              height: 1,
                              background: tk.border,
                              margin: "4px 0",
                            }}
                          />
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
            style={{
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 24px",
                borderBottom: `1px solid ${tk.border}`,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Active Invite Links
              </h3>
              <button
                onClick={() => setShowInviteModal(true)}
                style={{
                  height: 36,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: "none",
                  background: tk.brand,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Plus size={14} /> Generate New
              </button>
            </div>
            {activeLinks.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: tk.textMuted,
                }}
              >
                No active invite links. Click "Generate New" to invite someone.
              </div>
            ) : (
              activeLinks.map((link, i) => (
                <div
                  key={link.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr",
                    padding: "12px 24px",
                    borderBottom:
                      i !== activeLinks.length - 1
                        ? `1px solid ${tk.border}`
                        : "none",
                    alignItems: "center",
                    fontSize: 13,
                    color: tk.textSecondary,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <LinkIcon size={14} color={tk.brandLight} />
                    <span style={{ color: tk.textPrimary, fontWeight: 500 }}>
                      {link.role_to_assign}
                    </span>
                  </div>
                  <div>
                    Uses: {link.use_count}/
                    {link.max_uses === 0 ? "∞" : link.max_uses}
                  </div>
                  <div>By: {link.created_by}</div>
                  <div
                    style={{
                      color: link.is_valid ? tk.success : tk.textMuted,
                      fontWeight: 600,
                    }}
                  >
                    {link.is_valid ? "Active" : "Expired"}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {/* MODALS & DRAWERS */}
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
      {/* LEADERS DIRECTORY MODAL */}
      {showLeadersModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
          onClick={() => setShowLeadersModal(false)}
        >
          <div
            style={{
              background: tk.surface,
              border: `1px solid ${tk.borderHover}`,
              borderRadius: 12,
              width: "100%",
              maxWidth: 500,
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: `1px solid ${tk.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Shield size={18} color={tk.success} /> Leaders Directory
              </h3>
              <button
                onClick={() => setShowLeadersModal(false)}
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
            <div style={{ padding: 20 }}>
              {["owner", "admin", "member"].map((role) => {
                const roleUsers = users.filter(
                  (u) =>
                    u.role === role &&
                    (role !== "member" ||
                      u.teams.some((t: any) => t.is_leader)),
                );
                if (roleUsers.length === 0) return null;
                return (
                  <div key={role} style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: tk.textMuted,
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      {role === "member" ? "Team Leaders" : role + "s"}
                    </div>
                    {roleUsers.map((u) => (
                      <div
                        key={u.user_id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "8px 0",
                        }}
                      >
                        <Avatar
                          user={u}
                          name={u.full_name || u.username}
                          size="sm"
                        />
                        <div style={{ flex: 1 }}>
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
      {/* MEMBER ACTION MODALS */}
      {confirmAction && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
          onClick={() => setConfirmAction(null)}
        >
          <div
            style={{
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: 12,
              padding: 24,
              width: "100%",
              maxWidth: 400,
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
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  textTransform: "capitalize",
                }}
              >
                {confirmAction.type === "remove"
                  ? "Remove Member"
                  : confirmAction.type === "role"
                    ? "Change Role"
                    : "Move Team"}
              </h3>
              <button
                onClick={() => setConfirmAction(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: tk.textMuted,
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>
            {confirmAction.type === "remove" && (
              <div>
                <p
                  style={{
                    color: tk.textSecondary,
                    fontSize: 14,
                    margin: "0 0 20px",
                  }}
                >
                  Remove{" "}
                  <b style={{ color: tk.textPrimary }}>
                    {confirmAction.user.full_name}
                  </b>{" "}
                  from the workspace?
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: `1px solid ${tk.border}`,
                      background: "transparent",
                      color: tk.textSecondary,
                      cursor: "pointer",
                    }}
                    onClick={() => setConfirmAction(null)}
                  >
                    Cancel
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: "none",
                      background: tk.primary,
                      color: "#fff",
                      cursor: "pointer",
                    }}
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
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: `1px solid ${tk.border}`,
                    background: tk.bg,
                    color: tk.textPrimary,
                    marginBottom: 20,
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: `1px solid ${tk.border}`,
                      background: "transparent",
                      color: tk.textSecondary,
                      cursor: "pointer",
                    }}
                    onClick={() => setConfirmAction(null)}
                  >
                    Cancel
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: "none",
                      background: tk.brand,
                      color: "#fff",
                      cursor: "pointer",
                    }}
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
            {/* Move Team action removed from global Member Drawer to prevent logic flaws */}
          </div>
        </div>
      )}
      {/* DELETE CONFIRMATION */}
      {confirmDeleteTeam && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
          onClick={() => setConfirmDeleteTeam(null)}
        >
          <div
            style={{
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: 12,
              padding: 28,
              width: "100%",
              maxWidth: 400,
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: `${tk.primary}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <AlertTriangle size={24} color={tk.primary} />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>
              Delete Team?
            </h3>
            <p
              style={{
                margin: "0 0 24px",
                color: tk.textSecondary,
                fontSize: 14,
              }}
            >
              Members will be moved to "Unassigned". This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setConfirmDeleteTeam(null)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${tk.border}`,
                  background: "transparent",
                  color: tk.textSecondary,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTeam}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  border: "none",
                  background: tk.primary,
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
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

// Sub Components
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
    style={{
      background: tk.surface,
      border: `1px solid ${tk.border}`,
      borderRadius: 12,
      padding: 20,
      cursor: interactive ? "pointer" : "default",
      transition: "border-color 0.2s",
    }}
    onMouseEnter={(e) =>
      interactive && (e.currentTarget.style.borderColor = tk.borderHover)
    }
    onMouseLeave={(e) =>
      interactive && (e.currentTarget.style.borderColor = tk.border)
    }
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <span style={{ color: tk.textMuted, fontSize: 13, fontWeight: 500 }}>
        {label}
      </span>
      <Icon size={18} style={{ color, opacity: 0.8 }} />
    </div>
    <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
  </div>
);

const EmptyState = ({ icon: Icon, title, subtitle }: any) => (
  <div
    style={{
      gridColumn: "1 / -1",
      padding: 48,
      textAlign: "center",
      color: tk.textMuted,
      background: tk.surface,
      border: `1px solid ${tk.border}`,
      borderRadius: 12,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
    }}
  >
    <Icon size={32} style={{ opacity: 0.4 }} />
    <div style={{ fontWeight: 600, fontSize: 15, color: tk.textSecondary }}>
      {title}
    </div>
    <div style={{ fontSize: 13 }}>{subtitle}</div>
  </div>
);

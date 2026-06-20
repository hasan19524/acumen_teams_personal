// app/dashboard/team/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  UserPlus,
  MoreHorizontal,
  X,
  Users,
  Building2,
  Mail,
  Copy,
  Trash2,
  CheckCircle2,
  Link as LinkIcon,
  Shield,
  MessageSquare,
  ArrowRightCircle,
  Loader2,
  Crown,
  CalendarDays,
} from "lucide-react";

import { workspaceService } from "@/features/workspace/workspaceService";
import { loadChannels } from "@/features/chat/services/channelService";
import {
  sendTeamInvite,
  sendGroupInvites,
} from "@/features/chat/services/inviteService";

// ── Design Tokens ─────────────────────────────────────────────────
const tk = {
  bgApp: "#020617",
  bgSurface: "rgba(15,23,42,0.8)",
  bgHover: "rgba(255,255,255,0.04)",
  bgHoverStrong: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.14)",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  accent: "#3b82f6",
  accentHover: "#4f46e5",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  radiusMd: "12px",
  radiusLg: "16px",
};

type Tab = "members" | "teams" | "invites";

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Data State
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myRole, setMyRole] = useState("member");
  const [inviteCounts, setInviteCounts] = useState({
    workspace: 0,
    teams: 0,
    private_groups: 0,
    dm_requests: 0,
  });

  const isAdmin = myRole === "owner" || myRole === "admin";

  // UI State
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDesc, setEditTeamDesc] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: string;
    user: any;
  } | null>(null);

  // Form State
  const [inviteType, setInviteType] = useState<"workspace" | "team" | "group">(
    "workspace",
  );
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteTeamId, setInviteTeamId] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [teamInviteUserId, setTeamInviteUserId] = useState("");
  const [teamInviteTeamId, setTeamInviteTeamId] = useState("");
  const [groupInviteChannelId, setGroupInviteChannelId] = useState("");
  const [groupInviteUserIds, setGroupInviteUserIds] = useState<number[]>([]);

  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamLeaderId, setNewTeamLeaderId] = useState("");
  const [createTeamLoading, setCreateTeamLoading] = useState(false);

  const [linkRole, setLinkRole] = useState("member");
  const [linkExpiry, setLinkExpiry] = useState(96);
  const [generatedLink, setGeneratedLink] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // ── Data Fetching ──────────────────────────────────────────────
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [membersData, teamsData, channelsData, statsData, countsData] =
        await Promise.all([
          workspaceService.getMembers(),
          workspaceService.getTeams(),
          loadChannels(),
          workspaceService.getStats(),
          import("@/features/chat/services/inviteService").then((m) =>
            m.loadInviteCounts(),
          ),
        ]);
      setUsers(Array.isArray(membersData) ? membersData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setChannels(
        Array.isArray(channelsData)
          ? channelsData.filter((c: any) => c.channel_type === "private_group")
          : [],
      );
      if (statsData?.role) setMyRole(statsData.role);
      setInviteCounts(countsData);
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Removed the global mousedown listener to prevent the menu from closing before clicks register.
  // The root container's onClick now handles closing the menu when clicking outside.

  // ── Handlers ───────────────────────────────────────────────────
  const handleInvite = async () => {
    setInviteError("");
    setInviteSuccess("");
    if (inviteType === "workspace" && !inviteUsername && !inviteEmail)
      return setInviteError("Username or email required");
    if (inviteType === "team" && (!teamInviteUserId || !teamInviteTeamId))
      return setInviteError("User and team are required");
    if (
      inviteType === "group" &&
      (!groupInviteChannelId || groupInviteUserIds.length === 0)
    )
      return setInviteError("Group and at least one user are required");

    setInviteLoading(true);
    try {
      if (inviteType === "workspace") {
        const payload: any = { role: inviteRole };
        if (inviteUsername) payload.username = inviteUsername;
        if (inviteEmail) payload.email = inviteEmail;
        if (inviteTeamId) payload.team_id = Number(inviteTeamId);
        await workspaceService.inviteMember(payload);
        setInviteSuccess("User invited successfully");
      } else if (inviteType === "team") {
        await sendTeamInvite(
          Number(teamInviteUserId),
          Number(teamInviteTeamId),
        );
        setInviteSuccess("Team invite sent successfully");
      } else if (inviteType === "group") {
        const data = await sendGroupInvites(
          Number(groupInviteChannelId),
          groupInviteUserIds,
        );
        setInviteSuccess(`Invited ${data.created_count} user(s) to group`);
      }
      setInviteUsername("");
      setInviteEmail("");
      setInviteRole("member");
      setInviteTeamId("");
      setTeamInviteUserId("");
      setTeamInviteTeamId("");
      setGroupInviteChannelId("");
      setGroupInviteUserIds([]);
      fetchAllData();
    } catch (err: any) {
      setInviteError(err.message || "Failed to send invite");
    } finally {
      setInviteLoading(false);
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
      setInviteError("Network error");
    } finally {
      setLinkLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    setCreateTeamLoading(true);
    try {
      const payload: any = { name: newTeamName };
      if (newTeamLeaderId) payload.leader_id = Number(newTeamLeaderId);
      await workspaceService.createTeam(payload);
      setShowCreateTeamModal(false);
      setNewTeamName("");
      setNewTeamLeaderId("");
      fetchAllData();
    } catch {
    } finally {
      setCreateTeamLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u)),
    );
    setConfirmAction(null);
    try {
      await workspaceService.updateMemberRole(userId, newRole);
      if (selectedMember?.user_id === userId)
        setSelectedMember((prev: any) => ({ ...prev, role: newRole }));
    } catch (err: any) {
      alert(err.message || "Failed to update role");
      fetchAllData();
    }
  };

  const handleMoveTeam = async (userId: number, teamId: number | null) => {
    const team = teams.find((t) => t.id === teamId);
    setUsers((prev) =>
      prev.map((u) =>
        u.user_id === userId ? { ...u, team: team?.name || "Unassigned" } : u,
      ),
    );
    setConfirmAction(null);
    try {
      await workspaceService.moveTeam(userId, teamId);
      if (selectedMember?.user_id === userId)
        setSelectedMember((prev: any) => ({
          ...prev,
          team: team?.name || "Unassigned",
        }));
    } catch (err: any) {
      alert(err.message || "Failed to move team");
      fetchAllData();
    }
  };

  const handleRemoveMember = async (userId: number) => {
    setUsers((prev) => prev.filter((u) => u.user_id !== userId));
    setSelectedMember(null);
    setConfirmAction(null);
    try {
      await workspaceService.removeMember(userId);
    } catch (err: any) {
      alert(err.message || "Failed to remove member");
      fetchAllData();
    }
  };

  const handleOpenTeamDrawer = (team: any) => {
    setSelectedTeam(team);
    setEditTeamName(team.name);
    setEditTeamDesc(team.description || "");
    setIsEditingTeam(false);
  };

  const handleSaveTeam = async () => {
    try {
      await workspaceService.updateTeam(selectedTeam.id, {
        name: editTeamName,
        description: editTeamDesc,
      });
      const updatedTeam = {
        ...selectedTeam,
        name: editTeamName,
        description: editTeamDesc,
      };
      setSelectedTeam(updatedTeam);
      setIsEditingTeam(false);
      fetchAllData();
    } catch (err) {
      alert("Failed to update team");
    }
  };

  const handleDeleteTeam = async () => {
    if (
      !confirm(
        `Are you sure you want to delete the team "${selectedTeam.name}"? This will also delete the team chat channel.`,
      )
    )
      return;
    try {
      await workspaceService.deleteTeam(selectedTeam.id);
      setSelectedTeam(null);
      fetchAllData();
    } catch (err) {
      alert("Failed to delete team");
    }
  };

  // ── Derived Data ───────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.username || "").toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const standardTeams = useMemo(
    () => teams.filter((t) => t.team_type === "standard" || !t.team_type),
    [teams],
  );

  const getRoleBadge = (role: string) => {
    const styles: Record<string, any> = {
      owner: { bg: "rgba(168,85,247,0.15)", color: "#c084fc" },
      admin: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
      member: { bg: "rgba(255,255,255,0.08)", color: "#94a3b8" },
      guest: { bg: "rgba(255,255,255,0.05)", color: "#64748b" },
    };
    const s = styles[role] || styles.member;
    return (
      <span
        style={{
          padding: "4px 8px",
          borderRadius: "6px",
          fontSize: "11px",
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

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: tk.bgApp,
        color: tk.textPrimary,
        fontFamily: "Inter, sans-serif",
        padding: "32px 40px",
      }}
      onClick={() => setActiveMenuId(null)}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            Workspace Administration
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              color: tk.textSecondary,
              fontSize: "15px",
            }}
          >
            Manage members, teams and workspace permissions.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {isAdmin && (
            <button
              onClick={() => {
                setShowInviteModal(true);
                setInviteError("");
                setInviteSuccess("");
              }}
              style={btnPrimary}
            >
              <UserPlus size={16} /> Invite
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowCreateTeamModal(true)}
              style={btnSecondary}
            >
              + Create Team
            </button>
          )}
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <SummaryCard
          label="Members"
          value={isLoading ? "..." : users.length}
          icon={Users}
          color="#3b82f6"
        />
        <SummaryCard
          label="Teams"
          value={isLoading ? "..." : standardTeams.length}
          icon={Building2}
          color="#8b5cf6"
        />
        <SummaryCard
          label="Pending Invites"
          value={
            isLoading
              ? "..."
              : inviteCounts.workspace +
                inviteCounts.teams +
                inviteCounts.private_groups +
                inviteCounts.dm_requests
          }
          icon={Mail}
          color="#f59e0b"
        />
      </div>

      {/* TABS */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          borderBottom: `1px solid ${tk.border}`,
          marginBottom: "20px",
        }}
      >
        {(["members", "teams", "invites"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom:
                activeTab === tab
                  ? `2px solid ${tk.accent}`
                  : "2px solid transparent",
              color: activeTab === tab ? tk.textPrimary : tk.textMuted,
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* MEMBERS TAB */}
      {activeTab === "members" && (
        <div>
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <div
              style={{
                flex: 1,
                background: tk.bgSurface,
                border: `1px solid ${tk.border}`,
                borderRadius: tk.radiusMd,
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <Search size={16} color={tk.textMuted} />
              <input
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: tk.textPrimary,
                  fontSize: "14px",
                }}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                background: tk.bgSurface,
                border: `1px solid ${tk.border}`,
                borderRadius: tk.radiusMd,
                padding: "0 16px",
                color: tk.textPrimary,
                outline: "none",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="guest">Guest</option>
            </select>
          </div>

          <div
            style={{
              background: tk.bgSurface,
              border: `1px solid ${tk.border}`,
              borderRadius: tk.radiusLg,
              overflow: "visible", // Fix: Allow dropdown to overflow
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1.5fr 1fr 40px",
                padding: "12px 16px",
                borderBottom: `1px solid ${tk.border}`,
                color: tk.textMuted,
                fontSize: "12px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <div>Name</div>
              <div>Role</div>
              <div>Team</div>
              <div>Status</div>
              <div></div>
            </div>

            {isLoading ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: tk.textMuted,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Loader2 size={16} className="animate-spin" /> Loading
                members...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: tk.textMuted,
                }}
              >
                No members found.
              </div>
            ) : (
              filteredUsers.map((u, i) => (
                <div
                  key={u.user_id || i}
                  onClick={() => {
                    setSelectedMember(u);
                    setActiveMenuId(null);
                  }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1.5fr 1fr 40px",
                    padding: "12px 16px",
                    alignItems: "center",
                    borderBottom:
                      i !== filteredUsers.length - 1
                        ? `1px solid ${tk.border}`
                        : "none",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = tk.bgHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: "13px",
                      }}
                    >
                      {(u.full_name || u.username || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "14px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {u.full_name || u.username}
                      </div>
                      <div style={{ fontSize: "12px", color: tk.textMuted }}>
                        @{u.username}
                      </div>
                    </div>
                  </div>
                  <div>{getRoleBadge(u.role)}</div>
                  <div style={{ color: tk.textSecondary, fontSize: "14px" }}>
                    {u.team || "Unassigned"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: tk.success,
                        display: "inline-block",
                      }}
                    ></span>
                    <span style={{ color: tk.textSecondary, fontSize: "13px" }}>
                      Online
                    </span>
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isAdmin)
                        setActiveMenuId(
                          activeMenuId === u.user_id ? null : u.user_id,
                        );
                    }}
                    style={{
                      position: "relative",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {isAdmin && (
                      <button
                        style={{
                          background: "transparent",
                          border: "none",
                          color: tk.textMuted,
                          cursor: "pointer",
                          padding: "4px",
                        }}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    )}
                    {activeMenuId === u.user_id && isAdmin && (
                      <div
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "100%",
                          marginTop: "4px",
                          background: tk.bgSurface,
                          border: `1px solid ${tk.borderHover}`,
                          borderRadius: "8px",
                          padding: "4px",
                          zIndex: 50,
                          minWidth: "180px",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()} // FIX: Prevent bubbling
                      >
                        <MenuButton
                          icon={<MessageSquare size={14} />}
                          label="View Profile"
                          onClick={() => {
                            setSelectedMember(u);
                            setActiveMenuId(null);
                          }}
                        />
                        <MenuButton
                          icon={<Shield size={14} />}
                          label="Change Role"
                          onClick={() => {
                            setSelectedMember(u);
                            setConfirmAction({ type: "role", user: u });
                            setActiveMenuId(null);
                          }}
                        />
                        <MenuButton
                          icon={<ArrowRightCircle size={14} />}
                          label="Move Team"
                          onClick={() => {
                            setSelectedMember(u);
                            setConfirmAction({ type: "move", user: u });
                            setActiveMenuId(null);
                          }}
                        />
                        <div
                          style={{
                            height: "1px",
                            background: tk.border,
                            margin: "4px 0",
                          }}
                        ></div>
                        <MenuButton
                          icon={<Trash2 size={14} />}
                          label="Remove"
                          danger
                          onClick={() =>
                            setConfirmAction({ type: "remove", user: u })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TEAMS TAB */}
      {activeTab === "teams" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          {isLoading ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: tk.textMuted,
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Loader2 size={16} className="animate-spin" /> Loading teams...
            </div>
          ) : standardTeams.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: tk.textMuted,
                gridColumn: "1 / -1",
              }}
            >
              <Building2
                size={32}
                style={{ marginBottom: "8px", opacity: 0.5 }}
              />
              <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                No Teams Yet
              </div>
              <div style={{ fontSize: "14px" }}>
                Create your first team to get started.
              </div>
            </div>
          ) : (
            standardTeams.map((t) => (
              <div
                key={t.id}
                style={{
                  background: tk.bgSurface,
                  border: `1px solid ${tk.border}`,
                  borderRadius: tk.radiusLg,
                  padding: "20px",
                  transition: "border-color 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = tk.borderHover)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = tk.border)
                }
                onClick={() => setSelectedTeam(t)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "10px",
                        background: "rgba(139,92,246,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Users size={22} style={{ color: "#a78bfa" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "16px" }}>
                        {t.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: tk.textMuted,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <CalendarDays size={12} />{" "}
                        {new Date(t.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "4px 8px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "4px",
                      color: tk.textSecondary,
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Public
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: `1px solid ${tk.border}`,
                    paddingTop: "16px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: tk.textMuted,
                        textTransform: "uppercase",
                        marginBottom: "4px",
                      }}
                    >
                      Members
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{ display: "flex" }}>
                        {users
                          .filter((u) => u.team === t.name)
                          .slice(0, 3)
                          .map((u, i) => (
                            <div
                              key={i}
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                background:
                                  "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                                border: `2px solid ${tk.bgSurface}`,
                                marginLeft: i > 0 ? "-8px" : "0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "10px",
                                fontWeight: 600,
                              }}
                            >
                              {(u.full_name || u.username).charAt(0)}
                            </div>
                          ))}
                      </div>
                      <span
                        style={{
                          fontSize: "13px",
                          color: tk.textSecondary,
                          marginLeft: "8px",
                        }}
                      >
                        {t.member_count} Total
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        color: tk.textMuted,
                        textTransform: "uppercase",
                        marginBottom: "4px",
                      }}
                    >
                      Leader
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: tk.textPrimary,
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Crown size={12} color={tk.warning} />{" "}
                      {t.leaders?.[0] || "None"}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* INVITES TAB */}
      {activeTab === "invites" && (
        <div
          style={{
            background: tk.bgSurface,
            border: `1px solid ${tk.border}`,
            borderRadius: tk.radiusLg,
            padding: "24px",
          }}
        >
          <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 700 }}>
            Generate Invite Link
          </h3>
          <p
            style={{
              margin: "0 0 20px",
              fontSize: "13px",
              color: tk.textSecondary,
            }}
          >
            Create a shareable link to invite users to this workspace.
          </p>

          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Role</label>
              <select
                value={linkRole}
                onChange={(e) => setLinkRole(e.target.value)}
                style={selectStyle}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="guest">Guest</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Expires In</label>
              <select
                value={linkExpiry}
                onChange={(e) => setLinkExpiry(Number(e.target.value))}
                style={selectStyle}
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
            style={{ ...btnPrimary, width: "100%" }}
          >
            {linkLoading ? (
              "Generating..."
            ) : (
              <>
                <LinkIcon size={16} /> Generate Link
              </>
            )}
          </button>
          {generatedLink && (
            <div
              style={{
                marginTop: "20px",
                background: tk.bgApp,
                border: `1px solid ${tk.border}`,
                borderRadius: "8px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: tk.textMuted,
                  marginBottom: "8px",
                  textTransform: "uppercase",
                }}
              >
                Active Invite Link
              </div>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <input
                  readOnly
                  value={generatedLink}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: `1px solid ${tk.border}`,
                    background: "transparent",
                    color: tk.success,
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "6px",
                    border: "none",
                    background: linkCopied ? tk.success : tk.bgHoverStrong,
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
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
          )}
        </div>
      )}

      {/* MEMBER DRAWER */}
      {selectedMember && !confirmAction && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 100,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setSelectedMember(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "400px",
              maxWidth: "90vw",
              height: "100vh",
              background: tk.bgSurface,
              borderLeft: `1px solid ${tk.border}`,
              padding: "24px",
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
                marginBottom: "32px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                Member Details
              </h3>
              <button
                onClick={() => setSelectedMember(null)}
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
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  fontWeight: 700,
                  marginBottom: "16px",
                }}
              >
                {(selectedMember.full_name || selectedMember.username)
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div style={{ fontSize: "20px", fontWeight: 700 }}>
                {selectedMember.full_name || selectedMember.username}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: tk.textSecondary,
                  marginTop: "4px",
                }}
              >
                @{selectedMember.username}
              </div>
              <div style={{ marginTop: "12px" }}>
                {getRoleBadge(selectedMember.role)}
              </div>
            </div>
            <div style={{ display: "grid", gap: "16px", marginBottom: "32px" }}>
              <InfoRow
                label="Email"
                value={`${selectedMember.username}@acumen.app`}
              />
              <InfoRow
                label="Team"
                value={selectedMember.team || "Unassigned"}
              />
              <InfoRow
                label="Joined Workspace"
                value={
                  selectedMember.joined_at
                    ? new Date(selectedMember.joined_at).toLocaleDateString()
                    : "Recently"
                }
              />
              <InfoRow label="Status" value="Active" statusColor={tk.success} />
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <button
                style={drawerBtn}
                onClick={() => alert("Redirecting to chat...")}
              >
                <MessageSquare size={16} /> Send Message
              </button>
              {isAdmin && (
                <button
                  style={drawerBtn}
                  onClick={() =>
                    setConfirmAction({ type: "role", user: selectedMember })
                  }
                >
                  <Shield size={16} /> Change Role
                </button>
              )}
              {isAdmin && (
                <button
                  style={drawerBtn}
                  onClick={() =>
                    setConfirmAction({ type: "move", user: selectedMember })
                  }
                >
                  <ArrowRightCircle size={16} /> Move Team
                </button>
              )}
              {isAdmin && (
                <button
                  style={{
                    ...drawerBtn,
                    color: tk.danger,
                    borderColor: "rgba(239,68,68,0.3)",
                  }}
                  onClick={() =>
                    setConfirmAction({ type: "remove", user: selectedMember })
                  }
                >
                  <Trash2 size={16} /> Remove Member
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TEAM DRAWER */}
      {selectedTeam && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 100,
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setSelectedTeam(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "450px",
              maxWidth: "90vw",
              height: "100vh",
              background: tk.bgSurface,
              borderLeft: `1px solid ${tk.border}`,
              padding: "24px",
              overflowY: "auto",
              animation: "slideIn 0.3s ease-out",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "32px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                Team Details
              </h3>
              <div style={{ display: "flex", gap: "12px" }}>
                {isAdmin && !isEditingTeam && (
                  <button
                    onClick={() => setIsEditingTeam(true)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: tk.accent,
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => setSelectedTeam(null)}
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
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "12px",
                  background: "rgba(139,92,246,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users size={28} style={{ color: "#a78bfa" }} />
              </div>
              <div style={{ flex: 1 }}>
                {isEditingTeam ? (
                  <input
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
                    style={{
                      ...inputStyle,
                      fontSize: "18px",
                      fontWeight: 700,
                      marginBottom: "4px",
                    }}
                  />
                ) : (
                  <div style={{ fontSize: "20px", fontWeight: 700 }}>
                    {selectedTeam.name}
                  </div>
                )}
                <div
                  style={{
                    fontSize: "13px",
                    color: tk.textMuted,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Crown size={12} color={tk.warning} />{" "}
                  {selectedTeam.leaders?.[0] || "No Leader"} •{" "}
                  {selectedTeam.member_count} Members
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: "16px", marginBottom: "32px" }}>
              {isEditingTeam ? (
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    value={editTeamDesc}
                    onChange={(e) => setEditTeamDesc(e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                    placeholder="What does this team do?"
                  />
                </div>
              ) : (
                <InfoRow
                  label="Description"
                  value={selectedTeam.description || "No description provided."}
                />
              )}
              <InfoRow
                label="Created On"
                value={new Date(selectedTeam.created_at).toLocaleDateString()}
              />
              <InfoRow label="Visibility" value="Public" />
            </div>

            {isEditingTeam ? (
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "32px" }}
              >
                <button
                  style={{ ...btnSecondary, flex: 1 }}
                  onClick={() => setIsEditingTeam(false)}
                >
                  Cancel
                </button>
                <button
                  style={{ ...btnPrimary, flex: 1 }}
                  onClick={handleSaveTeam}
                >
                  Save Changes
                </button>
              </div>
            ) : (
              <>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: tk.textSecondary,
                    margin: "0 0 12px",
                    textTransform: "uppercase",
                  }}
                >
                  Team Members
                </h4>
                <div
                  style={{ display: "grid", gap: "8px", marginBottom: "32px" }}
                >
                  {users
                    .filter((u) => u.team === selectedTeam.name)
                    .map((u) => (
                      <div
                        key={u.user_id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "8px",
                          background: tk.bgApp,
                          borderRadius: "8px",
                          border: `1px solid ${tk.border}`,
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 600,
                            fontSize: "13px",
                          }}
                        >
                          {(u.full_name || u.username).charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "14px", fontWeight: 600 }}>
                            {u.full_name || u.username}
                          </div>
                          <div
                            style={{ fontSize: "12px", color: tk.textMuted }}
                          >
                            @{u.username}
                          </div>
                        </div>
                        {getRoleBadge(u.role)}
                      </div>
                    ))}
                  {users.filter((u) => u.team === selectedTeam.name).length ===
                    0 && (
                    <div
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        color: tk.textMuted,
                        background: tk.bgApp,
                        borderRadius: "8px",
                        border: `1px solid ${tk.border}`,
                      }}
                    >
                      No members assigned to this team yet.
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div
                    style={{
                      borderTop: `1px solid ${tk.border}`,
                      paddingTop: "24px",
                    }}
                  >
                    <button
                      onClick={handleDeleteTeam}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: `1px solid rgba(239,68,68,0.3)`,
                        background: "transparent",
                        color: tk.danger,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <Trash2 size={16} /> Delete Team
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* CONFIRMATION MODALS */}
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
              background: tk.bgSurface,
              border: `1px solid ${tk.border}`,
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "400px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
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
                    fontSize: "14px",
                    margin: "0 0 20px",
                  }}
                >
                  Are you sure you want to remove{" "}
                  <b style={{ color: tk.textPrimary }}>
                    {confirmAction.user.full_name ||
                      confirmAction.user.username}
                  </b>{" "}
                  from the workspace? This action cannot be undone.
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    style={{ ...btnSecondary, flex: 1 }}
                    onClick={() => setConfirmAction(null)}
                  >
                    Cancel
                  </button>
                  <button
                    style={{ ...btnDanger, flex: 1 }}
                    onClick={() =>
                      handleRemoveMember(confirmAction.user.user_id)
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {confirmAction.type === "role" && (
              <div>
                <p
                  style={{
                    color: tk.textSecondary,
                    fontSize: "14px",
                    margin: "0 0 12px",
                  }}
                >
                  Select a new role for{" "}
                  <b style={{ color: tk.textPrimary }}>
                    {confirmAction.user.full_name ||
                      confirmAction.user.username}
                  </b>
                  .
                </p>
                <select
                  id="role-select"
                  defaultValue={confirmAction.user.role}
                  style={{
                    ...selectStyle,
                    marginBottom: "20px",
                    width: "100%",
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="guest">Guest</option>
                </select>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    style={{ ...btnSecondary, flex: 1 }}
                    onClick={() => setConfirmAction(null)}
                  >
                    Cancel
                  </button>
                  <button
                    style={{ ...btnPrimary, flex: 1 }}
                    onClick={() =>
                      handleRoleChange(
                        confirmAction.user.user_id,
                        (
                          document.getElementById(
                            "role-select",
                          ) as HTMLSelectElement
                        ).value,
                      )
                    }
                  >
                    Save Role
                  </button>
                </div>
              </div>
            )}

            {confirmAction.type === "move" && (
              <div>
                <p
                  style={{
                    color: tk.textSecondary,
                    fontSize: "14px",
                    margin: "0 0 12px",
                  }}
                >
                  Select a new team for{" "}
                  <b style={{ color: tk.textPrimary }}>
                    {confirmAction.user.full_name ||
                      confirmAction.user.username}
                  </b>
                  .
                </p>
                <select
                  id="team-select"
                  defaultValue=""
                  style={{
                    ...selectStyle,
                    marginBottom: "20px",
                    width: "100%",
                  }}
                >
                  <option value="">Unassigned</option>
                  {standardTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    style={{ ...btnSecondary, flex: 1 }}
                    onClick={() => setConfirmAction(null)}
                  >
                    Cancel
                  </button>
                  <button
                    style={{ ...btnPrimary, flex: 1 }}
                    onClick={() =>
                      handleMoveTeam(
                        confirmAction.user.user_id,
                        (
                          document.getElementById(
                            "team-select",
                          ) as HTMLSelectElement
                        ).value
                          ? Number(
                              (
                                document.getElementById(
                                  "team-select",
                                ) as HTMLSelectElement
                              ).value,
                            )
                          : null,
                      )
                    }
                  >
                    Move Team
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE TEAM MODAL */}
      {showCreateTeamModal && (
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
          onClick={() => setShowCreateTeamModal(false)}
        >
          <div
            style={{
              background: tk.bgSurface,
              border: `1px solid ${tk.border}`,
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "420px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                Create New Team
              </h2>
              <button
                onClick={() => setShowCreateTeamModal(false)}
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
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Team Name</label>
              <input
                placeholder="e.g. Design Team"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Team Leader (Optional)</label>
              <select
                value={newTeamLeaderId}
                onChange={(e) => setNewTeamLeaderId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select a leader...</option>
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.full_name || u.username}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                style={{ ...btnSecondary, flex: 1 }}
                onClick={() => setShowCreateTeamModal(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  ...btnPrimary,
                  flex: 1,
                  opacity: !newTeamName.trim() || createTeamLoading ? 0.6 : 1,
                }}
                onClick={handleCreateTeam}
                disabled={createTeamLoading || !newTeamName.trim()}
              >
                {createTeamLoading ? "Creating..." : "Create Team"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVITE MODAL */}
      {showInviteModal && (
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
          onClick={() => setShowInviteModal(false)}
        >
          <div
            style={{
              background: tk.bgSurface,
              border: `1px solid ${tk.border}`,
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "480px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                Invite to Acumen Teams
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
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
            <div
              style={{
                display: "flex",
                gap: "4px",
                background: tk.bgApp,
                borderRadius: "8px",
                padding: "4px",
                marginBottom: "20px",
              }}
            >
              {[
                { key: "workspace", label: "Workspace" },
                { key: "team", label: "Team" },
                { key: "group", label: "Group" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setInviteType(t.key as any)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "6px",
                    border: "none",
                    background:
                      inviteType === t.key ? tk.bgHoverStrong : "transparent",
                    color: inviteType === t.key ? tk.textPrimary : tk.textMuted,
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {inviteError && (
              <div
                style={{
                  color: tk.danger,
                  fontSize: "13px",
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                {inviteError}
              </div>
            )}
            {inviteSuccess && (
              <div
                style={{
                  color: tk.success,
                  fontSize: "13px",
                  marginBottom: "16px",
                  textAlign: "center",
                }}
              >
                {inviteSuccess}
              </div>
            )}
            {inviteType === "workspace" && (
              <div style={{ display: "grid", gap: "12px" }}>
                <input
                  placeholder="Username"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  style={inputStyle}
                />
                <input
                  placeholder="Email (alternative)"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={inputStyle}
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  style={inputStyle}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="guest">Guest</option>
                </select>
                <select
                  value={inviteTeamId}
                  onChange={(e) => setInviteTeamId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">No team (unassigned)</option>
                  {standardTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {inviteType === "team" && (
              <div style={{ display: "grid", gap: "12px" }}>
                <select
                  value={teamInviteUserId}
                  onChange={(e) => setTeamInviteUserId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select user...</option>
                  {users.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.full_name || u.username}
                    </option>
                  ))}
                </select>
                <select
                  value={teamInviteTeamId}
                  onChange={(e) => setTeamInviteTeamId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select team...</option>
                  {standardTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {inviteType === "group" && (
              <div style={{ display: "grid", gap: "12px" }}>
                <select
                  value={groupInviteChannelId}
                  onChange={(e) => setGroupInviteChannelId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select group...</option>
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div
                  style={{
                    maxHeight: "150px",
                    overflowY: "auto",
                    border: `1px solid ${tk.border}`,
                    borderRadius: "8px",
                    padding: "8px 12px",
                  }}
                >
                  {users.map((u) => {
                    const id = u.user_id;
                    const checked = groupInviteUserIds.includes(id);
                    return (
                      <label
                        key={id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 0",
                          cursor: "pointer",
                          color: tk.textPrimary,
                          fontSize: "14px",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setGroupInviteUserIds(
                              checked
                                ? groupInviteUserIds.filter((x) => x !== id)
                                : [...groupInviteUserIds, id],
                            )
                          }
                        />
                        {u.full_name || u.username}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <button
              onClick={handleInvite}
              disabled={inviteLoading}
              style={{
                ...btnPrimary,
                width: "100%",
                marginTop: "24px",
                opacity: inviteLoading ? 0.6 : 1,
              }}
            >
              {inviteLoading ? "Inviting..." : "Send Invite"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components & Styles ───────────────────────────────────────
const SummaryCard = ({ label, value, icon: Icon, color }: any) => (
  <div
    style={{
      background: "rgba(15,23,42,0.8)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "16px",
      padding: "20px",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
      }}
    >
      <span style={{ color: "#64748b", fontSize: "13px", fontWeight: 500 }}>
        {label}
      </span>
      <Icon size={18} style={{ color, opacity: 0.8 }} />
    </div>
    <div style={{ fontSize: "24px", fontWeight: 700 }}>{value}</div>
  </div>
);

const MenuButton = ({ icon, label, onClick, danger }: any) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      width: "100%",
      padding: "8px 12px",
      background: "transparent",
      border: "none",
      color: danger ? "#ef4444" : "#94a3b8",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 500,
      borderRadius: "4px",
      transition: "background 0.1s",
    }}
    onMouseEnter={(e) =>
      (e.currentTarget.style.background = danger
        ? "rgba(239,68,68,0.1)"
        : "rgba(255,255,255,0.04)")
    }
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
  >
    {icon} {label}
  </button>
);

const InfoRow = ({ label, value, statusColor }: any) => (
  <div
    style={{
      padding: "16px",
      background: "#020617",
      borderRadius: "8px",
      border: "1px solid rgba(255,255,255,0.06)",
    }}
  >
    <div
      style={{
        fontSize: "11px",
        color: "#64748b",
        textTransform: "uppercase",
        marginBottom: "4px",
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: "14px",
        color: statusColor || "#f1f5f9",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      {statusColor && (
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: statusColor,
            display: "inline-block",
          }}
        ></span>
      )}
      {value}
    </div>
  </div>
);

const btnPrimary: React.CSSProperties = {
  height: "40px",
  padding: "0 18px",
  borderRadius: "8px",
  border: "none",
  background: "#3b82f6",
  color: "#fff",
  fontWeight: 600,
  fontSize: "14px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  transition: "background 0.2s",
};
const btnSecondary: React.CSSProperties = {
  height: "40px",
  padding: "0 18px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "transparent",
  color: "#f1f5f9",
  fontWeight: 600,
  fontSize: "14px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  transition: "background 0.2s",
};
const btnDanger: React.CSSProperties = {
  height: "40px",
  padding: "0 18px",
  borderRadius: "8px",
  border: "none",
  background: "#ef4444",
  color: "#fff",
  fontWeight: 600,
  fontSize: "14px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  transition: "background 0.2s",
};
const drawerBtn: React.CSSProperties = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "transparent",
  color: "#f1f5f9",
  fontWeight: 500,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontSize: "14px",
  transition: "background 0.2s",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "#020617",
  color: "#f1f5f9",
  outline: "none",
  fontSize: "14px",
  boxSizing: "border-box",
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  color: "#64748b",
  marginBottom: "6px",
  textTransform: "uppercase",
};

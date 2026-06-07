"use client";

import { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  Shield,
  Download,
  MoreHorizontal,
  X,
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

export default function TeamPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [inviteTeamId, setInviteTeamId] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteType, setInviteType] = useState<"workspace" | "team" | "group">(
    "workspace",
  );
  const [teamInviteUserId, setTeamInviteUserId] = useState("");
  const [teamInviteTeamId, setTeamInviteTeamId] = useState("");
  const [groupInviteChannelId, setGroupInviteChannelId] = useState("");
  const [groupInviteUserIds, setGroupInviteUserIds] = useState<number[]>([]);
  const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamLeaderId, setNewTeamLeaderId] = useState("");
  const [createTeamLoading, setCreateTeamLoading] = useState(false);
  const [createTeamError, setCreateTeamError] = useState("");
  const [createTeamSuccess, setCreateTeamSuccess] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkRole, setLinkRole] = useState("employee");
  const [linkExpiry, setLinkExpiry] = useState(96);
  const [generatedLink, setGeneratedLink] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const fetchMembers = () => {
    const token = localStorage.getItem("token");
    fetch("http://127.0.0.1:8000/api/workspaces/members/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => (Array.isArray(d) ? setUsers(d) : setUsers([])))
      .catch(() => {});
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://127.0.0.1:8000/api/workspaces/teams/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => (Array.isArray(d) ? setTeams(d) : setTeams([])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://127.0.0.1:8000/api/workspaces/members/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) =>
        Array.isArray(d) ? setWorkspaceUsers(d) : setWorkspaceUsers([]),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://127.0.0.1:8000/api/chat/channels/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : d.results || [];
        setChannels(
          list.filter((c: any) => c.channel_type === "private_group"),
        );
      })
      .catch(() => {});
  }, []);

  const handleInvite = async () => {
    setInviteError("");
    setInviteSuccess("");
    if (!inviteUsername && !inviteEmail) {
      setInviteError("Username or email required");
      return;
    }
    setInviteLoading(true);
    try {
      const token = localStorage.getItem("token");
      const body: Record<string, any> = { role: inviteRole };
      if (inviteUsername) body.username = inviteUsername;
      if (inviteEmail) body.email = inviteEmail;
      if (inviteTeamId) body.team_id = Number(inviteTeamId);

      const res = await fetch("http://127.0.0.1:8000/api/workspaces/invite/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "Failed to invite user");
      } else {
        setInviteSuccess(data.detail || "User invited successfully");
        setInviteUsername("");
        setInviteEmail("");
        setInviteRole("employee");
        setInviteTeamId("");
        fetchMembers();
      }
    } catch {
      setInviteError("Network error");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleTeamInvite = async () => {
    setInviteError("");
    setInviteSuccess("");
    if (!teamInviteUserId || !teamInviteTeamId) {
      setInviteError("User and team are required");
      return;
    }
    setInviteLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "http://127.0.0.1:8000/api/workspaces/teams/invite/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: Number(teamInviteUserId),
            team_id: Number(teamInviteTeamId),
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "Failed to send team invite");
      } else {
        setInviteSuccess("Team invite sent successfully");
        setTeamInviteUserId("");
        setTeamInviteTeamId("");
      }
    } catch {
      setInviteError("Network error");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleGroupInvite = async () => {
    setInviteError("");
    setInviteSuccess("");
    if (!groupInviteChannelId || groupInviteUserIds.length === 0) {
      setInviteError("Group and at least one user are required");
      return;
    }
    setInviteLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "http://127.0.0.1:8000/api/workspaces/groups/invite/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            channel_id: Number(groupInviteChannelId),
            user_ids: groupInviteUserIds,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "Failed to send group invite");
      } else {
        setInviteSuccess(`Invited ${data.created_count} user(s) to group`);
        setGroupInviteChannelId("");
        setGroupInviteUserIds([]);
      }
    } catch {
      setInviteError("Network error");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setLinkLoading(true);
    setGeneratedLink("");
    setLinkCopied(false);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "http://127.0.0.1:8000/api/workspaces/invite/generate/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: linkRole, expires_hours: linkExpiry }),
        },
      );
      const data = await res.json();
      if (res.ok && data.invite_url) {
        setGeneratedLink(data.invite_url);
      } else {
        setInviteError(data.error || "Failed to generate link");
      }
    } catch {
      setInviteError("Network error");
    } finally {
      setLinkLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setInviteError("Failed to copy");
    }
  };

  const openInviteModal = (type: "workspace" | "team" | "group") => {
    setInviteType(type);
    setShowInviteModal(true);
    setInviteError("");
    setInviteSuccess("");
  };

  const handleCreateTeam = async () => {
    setCreateTeamError("");
    setCreateTeamSuccess("");
    if (!newTeamName.trim()) {
      setCreateTeamError("Team name is required");
      return;
    }
    setCreateTeamLoading(true);
    try {
      const token = localStorage.getItem("token");
      const body: Record<string, any> = { name: newTeamName };
      if (newTeamLeaderId) body.leader_id = Number(newTeamLeaderId);

      const res = await fetch(
        "http://127.0.0.1:8000/api/workspaces/teams/create/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setCreateTeamError(data.error || "Failed to create team");
      } else {
        setCreateTeamSuccess("Team created successfully");
        setNewTeamName("");
        setNewTeamLeaderId("");
        fetchMembers();
      }
    } catch {
      setCreateTeamError("Network error");
    } finally {
      setCreateTeamLoading(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.username || "").toLowerCase().includes(search.toLowerCase()),
  );

  // REMOVED: Fake presence badge function.
  // Backend presence system exists (Redis-based, used in ChatConsumer).
  // When real presence data is wired to this page, a new badge function
  // should be built on actual WebSocket presence events — not hardcoded.

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#020617 0%, #020b22 100%)",
        color: "#fff",
        display: "flex",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* SHARED SIDEBAR */}
      <DashboardSidebar />

      {/* Main — unchanged */}
      <main style={{ flex: 1, padding: "26px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 48,
                fontWeight: 800,
                letterSpacing: -1,
              }}
            >
              Workspace Admin Console
            </h1>
            <p
              style={{
                marginTop: 8,
                color: "rgba(255,255,255,.65)",
                fontSize: 16,
              }}
            >
              Manage users, roles, permissions and members
            </p>
          </div>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {[
              { icon: Shield, text: "Permissions" },
              { icon: Download, text: "Export" },
            ].map((btn, i) => {
              const Icon = btn.icon;
              return (
                <button
                  key={`btn-${i}`}
                  style={{
                    height: 46,
                    padding: "0 18px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,.06)",
                    background: "rgba(255,255,255,.03)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Icon size={17} /> {btn.text}
                </button>
              );
            })}
            <button
              onClick={() => {
                setShowCreateTeamModal(true);
                setCreateTeamError("");
                setCreateTeamSuccess("");
              }}
              style={{
                height: 46,
                padding: "0 20px",
                borderRadius: 14,
                border: "1px solid rgba(34,197,94,.3)",
                background: "rgba(34,197,94,.1)",
                color: "#86efac",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              + Create Team
            </button>
            <button
              onClick={() => {
                setShowLinkModal(true);
                setGeneratedLink("");
                setLinkCopied(false);
                setInviteError("");
              }}
              style={{
                height: 46,
                padding: "0 20px",
                borderRadius: 14,
                border: "1px solid rgba(251,191,36,.3)",
                background: "rgba(251,191,36,.1)",
                color: "#fcd34d",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              🔗 Invite Link
            </button>
            <button
              onClick={() => openInviteModal("workspace")}
              style={{
                height: 46,
                padding: "0 20px",
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(135deg,#3b82f6,#4f46e5)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <UserPlus size={18} /> Workspace Invite
            </button>
            <button
              onClick={() => openInviteModal("team")}
              style={{
                height: 46,
                padding: "0 20px",
                borderRadius: 14,
                border: "1px solid rgba(139,92,246,.3)",
                background: "rgba(139,92,246,.1)",
                color: "#c4b5fd",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <UserPlus size={18} /> Team Invite
            </button>
            <button
              onClick={() => openInviteModal("group")}
              style={{
                height: 46,
                padding: "0 20px",
                borderRadius: 14,
                border: "1px solid rgba(8,145,178,.3)",
                background: "rgba(8,145,178,.1)",
                color: "#67e8f9",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <UserPlus size={18} /> Group Invite
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: 28,
            background: "rgba(255,255,255,.025)",
            border: "1px solid rgba(255,255,255,.05)",
            borderRadius: 18,
            padding: 14,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Search size={18} color="rgba(255,255,255,.6)" />
          <input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: 15,
            }}
          />
        </div>

        <div
          style={{
            marginTop: 24,
            borderRadius: 22,
            overflow: "visible",
            border: "1px solid rgba(255,255,255,.05)",
            background: "rgba(255,255,255,.02)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1.6fr 1fr 1fr 70px",
              padding: "18px 22px",
              color: "rgba(255,255,255,.55)",
              fontWeight: 700,
              fontSize: 14,
              borderBottom: "1px solid rgba(255,255,255,.05)",
            }}
          >
            <div>User</div>
            <div>Email</div>
            <div>Role</div>
            <div>Department</div>
            <div></div>
          </div>

          {filtered.map((u, i) => {
            return (
              <div
                key={u.id ?? `user-${i}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.6fr 1.6fr 1fr 1fr 70px",
                  padding: "18px 22px",
                  alignItems: "center",
                  borderBottom:
                    i !== filtered.length - 1
                      ? "1px solid rgba(255,255,255,.04)"
                      : "none",
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {u.full_name || u.username}
                </div>
                <div style={{ color: "rgba(255,255,255,.75)" }}>
                  {u.username}
                </div>
                <select
                  defaultValue={u.role}
                  style={{
                    height: 42,
                    background: "rgba(255,255,255,.03)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,.06)",
                    borderRadius: 12,
                    padding: "0 12px",
                    outline: "none",
                  }}
                >
                  <option>Super Admin</option>
                  <option>Admin</option>
                  <option>Manager</option>
                  <option>HR</option>
                  <option>Employee</option>
                </select>
                <select
                  defaultValue={u.team || "No Team"}
                  style={{
                    height: 42,
                    background: "rgba(255,255,255,.03)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,.06)",
                    borderRadius: 12,
                    padding: "0 12px",
                    outline: "none",
                  }}
                >
                  <option>Management</option>
                  <option>Sales</option>
                  <option>Human Resources</option>
                  <option>Development</option>
                  <option>Support</option>
                </select>
                <button
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    border: "none",
                    background: "rgba(255,255,255,.04)",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>
            );
          })}
        </div>
        {/* Generate Invite Link Modal */}
        {showLinkModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
            onClick={() => setShowLinkModal(false)}
          >
            <div
              style={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 20,
                padding: 28,
                width: 460,
                maxWidth: "90vw",
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
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                  Generate Invite Link
                </h2>
                <button
                  onClick={() => setShowLinkModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <p
                style={{
                  color: "rgba(255,255,255,.5)",
                  fontSize: 13,
                  margin: "0 0 16px",
                }}
              >
                Create a shareable link. Send it to anyone — they can sign up
                and join your workspace.
              </p>

              {inviteError && (
                <p
                  style={{ color: "#f87171", fontSize: 14, margin: "0 0 12px" }}
                >
                  {inviteError}
                </p>
              )}

              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(255,255,255,.5)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Role for new member
              </label>
              <select
                value={linkRole}
                onChange={(e) => setLinkRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,.1)",
                  background: "rgba(255,255,255,.05)",
                  color: "#fff",
                  marginBottom: 16,
                  outline: "none",
                }}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="guest">Guest</option>
              </select>

              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(255,255,255,.5)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Link expires in
              </label>
              <select
                value={linkExpiry}
                onChange={(e) => setLinkExpiry(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,.1)",
                  background: "rgba(255,255,255,.05)",
                  color: "#fff",
                  marginBottom: 20,
                  outline: "none",
                }}
              >
                <option value={24}>1 day</option>
                <option value={96}>4 days</option>
                <option value={168}>7 days</option>
                <option value={720}>30 days</option>
              </select>

              {!generatedLink && (
                <button
                  onClick={handleGenerateLink}
                  disabled={linkLoading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg,#f59e0b,#d97706)",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: linkLoading ? "wait" : "pointer",
                    opacity: linkLoading ? 0.7 : 1,
                  }}
                >
                  {linkLoading ? "Generating..." : "Generate Link"}
                </button>
              )}

              {generatedLink && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "rgba(255,255,255,.5)",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Share this link
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      readOnly
                      value={generatedLink}
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,.1)",
                        background: "rgba(255,255,255,.05)",
                        color: "#4ade80",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={handleCopyLink}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 10,
                        border: "none",
                        background: linkCopied
                          ? "#16a34a"
                          : "rgba(255,255,255,.1)",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {linkCopied ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setGeneratedLink("");
                      setLinkCopied(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,.1)",
                      background: "transparent",
                      color: "rgba(255,255,255,.5)",
                      fontWeight: 600,
                      cursor: "pointer",
                      marginTop: 10,
                    }}
                  >
                    Generate Another
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateTeamModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
            onClick={() => setShowCreateTeamModal(false)}
          >
            <div
              style={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 20,
                padding: 28,
                width: 420,
                maxWidth: "90vw",
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
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                  Create New Team
                </h2>
                <button
                  onClick={() => setShowCreateTeamModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {createTeamError && (
                <p
                  style={{ color: "#f87171", fontSize: 14, margin: "0 0 12px" }}
                >
                  {createTeamError}
                </p>
              )}
              {createTeamSuccess && (
                <p
                  style={{ color: "#4ade80", fontSize: 14, margin: "0 0 12px" }}
                >
                  {createTeamSuccess}
                </p>
              )}

              <input
                placeholder="Team Name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,.1)",
                  background: "rgba(255,255,255,.05)",
                  color: "#fff",
                  marginBottom: 12,
                  outline: "none",
                }}
              />

              <select
                value={newTeamLeaderId}
                onChange={(e) => setNewTeamLeaderId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,.1)",
                  background: "rgba(255,255,255,.05)",
                  color: "#fff",
                  marginBottom: 20,
                  outline: "none",
                }}
              >
                <option value="">Select leader (optional)</option>
                {workspaceUsers.map((u: any) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.full_name || u.username}
                  </option>
                ))}
              </select>

              <button
                onClick={handleCreateTeam}
                disabled={createTeamLoading}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg,#22c55e,#16a34a)",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: createTeamLoading ? "wait" : "pointer",
                  opacity: createTeamLoading ? 0.7 : 1,
                }}
              >
                {createTeamLoading ? "Creating..." : "Create Team"}
              </button>
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
            onClick={() => setShowInviteModal(false)}
          >
            <div
              style={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 20,
                padding: 28,
                width: 420,
                maxWidth: "90vw",
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
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                  {inviteType === "workspace" && "Invite to Workspace"}
                  {inviteType === "team" && "Invite to Team"}
                  {inviteType === "group" && "Invite to Private Group"}
                </h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {inviteError && (
                <p
                  style={{ color: "#f87171", fontSize: 14, margin: "0 0 12px" }}
                >
                  {inviteError}
                </p>
              )}
              {inviteSuccess && (
                <p
                  style={{ color: "#4ade80", fontSize: 14, margin: "0 0 12px" }}
                >
                  {inviteSuccess}
                </p>
              )}

              {/* WORKSPACE INVITE FORM */}
              {inviteType === "workspace" && (
                <>
                  <input
                    placeholder="Username"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,.1)",
                      background: "rgba(255,255,255,.05)",
                      color: "#fff",
                      marginBottom: 12,
                      outline: "none",
                    }}
                  />
                  <input
                    placeholder="Email (alternative)"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,.1)",
                      background: "rgba(255,255,255,.05)",
                      color: "#fff",
                      marginBottom: 12,
                      outline: "none",
                    }}
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,.1)",
                      background: "rgba(255,255,255,.05)",
                      color: "#fff",
                      marginBottom: 12,
                      outline: "none",
                    }}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="guest">Guest</option>
                  </select>
                  <select
                    value={inviteTeamId}
                    onChange={(e) => setInviteTeamId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,.1)",
                      background: "rgba(255,255,255,.05)",
                      color: "#fff",
                      marginBottom: 20,
                      outline: "none",
                    }}
                  >
                    <option value="">No team (unassigned)</option>
                    {teams.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleInvite}
                    disabled={inviteLoading}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(135deg,#3b82f6,#4f46e5)",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: inviteLoading ? "wait" : "pointer",
                      opacity: inviteLoading ? 0.7 : 1,
                    }}
                  >
                    {inviteLoading ? "Inviting..." : "Add to Workspace"}
                  </button>
                </>
              )}

              {/* TEAM INVITE FORM */}
              {inviteType === "team" && (
                <>
                  <select
                    value={teamInviteUserId}
                    onChange={(e) => setTeamInviteUserId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,.1)",
                      background: "rgba(255,255,255,.05)",
                      color: "#fff",
                      marginBottom: 12,
                      outline: "none",
                    }}
                  >
                    <option value="">Select user...</option>
                    {workspaceUsers.map((u: any) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.full_name || u.username}
                      </option>
                    ))}
                  </select>
                  <select
                    value={teamInviteTeamId}
                    onChange={(e) => setTeamInviteTeamId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,.1)",
                      background: "rgba(255,255,255,.05)",
                      color: "#fff",
                      marginBottom: 20,
                      outline: "none",
                    }}
                  >
                    <option value="">Select team...</option>
                    {teams.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleTeamInvite}
                    disabled={inviteLoading}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: inviteLoading ? "wait" : "pointer",
                      opacity: inviteLoading ? 0.7 : 1,
                    }}
                  >
                    {inviteLoading ? "Inviting..." : "Send Team Invite"}
                  </button>
                </>
              )}

              {/* GROUP INVITE FORM */}
              {inviteType === "group" && (
                <>
                  <select
                    value={groupInviteChannelId}
                    onChange={(e) => setGroupInviteChannelId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,.1)",
                      background: "rgba(255,255,255,.05)",
                      color: "#fff",
                      marginBottom: 12,
                      outline: "none",
                    }}
                  >
                    <option value="">Select group...</option>
                    {channels.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div
                    style={{
                      maxHeight: 160,
                      overflowY: "auto",
                      marginBottom: 20,
                    }}
                  >
                    {workspaceUsers.map((u: any) => {
                      const id = u.user_id;
                      const checked = groupInviteUserIds.includes(id);
                      return (
                        <label
                          key={id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 4px",
                            cursor: "pointer",
                            color: "#fff",
                            fontSize: 14,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setGroupInviteUserIds((prev) =>
                                checked
                                  ? prev.filter((x) => x !== id)
                                  : [...prev, id],
                              );
                            }}
                          />
                          {u.full_name || u.username}
                        </label>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleGroupInvite}
                    disabled={inviteLoading}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(135deg,#0891b2,#06b6d4)",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: inviteLoading ? "wait" : "pointer",
                      opacity: inviteLoading ? 0.7 : 1,
                    }}
                  >
                    {inviteLoading ? "Inviting..." : "Send Group Invite"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

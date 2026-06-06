"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import {
  loadInviteCounts,
  loadInviteTab,
  InviteCounts,
  WorkspaceInviteItem,
  DMRequestItem,
  TeamInviteItem,
  PrivateGroupInviteItem,
  respondTeamInvite,
  respondGroupInvite,
} from "@/features/chat/services/inviteService";
import { respondDMRequest } from "@/features/chat/services/dmRequestService";

type TabKey = "workspace" | "teams" | "private_groups" | "dm_requests";

const tabs: { key: TabKey; label: string }[] = [
  { key: "workspace", label: "Workspace" },
  { key: "teams", label: "Teams" },
  { key: "private_groups", label: "Groups" },
  { key: "dm_requests", label: "DM Requests" },
];

export default function InvitesPage() {
  const [counts, setCounts] = useState<InviteCounts>({
    workspace: 0,
    teams: 0,
    private_groups: 0,
    dm_requests: 0,
  });
  const [activeTab, setActiveTab] = useState<TabKey>("dm_requests");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Load counts on mount
  useEffect(() => {
    loadInviteCounts()
      .then(setCounts)
      .catch(() => {});
  }, []);

  // Load tab data only when tab is selected
  const loadTab = useCallback(async (tab: TabKey) => {
    setActiveTab(tab);
    setLoading(true);
    try {
      const data = await loadInviteTab(tab);
      setItems(data.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTab(activeTab);
  }, [activeTab, loadTab]);

  const handleAcceptDM = async (requestId: number) => {
    setActionLoading(requestId);
    try {
      await respondDMRequest(requestId, { status: "accepted" });
      setItems((prev) => prev.filter((i) => i.id !== requestId));
      setCounts((prev) => ({ ...prev, dm_requests: prev.dm_requests - 1 }));
    } catch (err) {
      console.error("Failed to accept DM request:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectDM = async (requestId: number) => {
    setActionLoading(requestId);
    try {
      await respondDMRequest(requestId, { status: "rejected" });
      setItems((prev) => prev.filter((i) => i.id !== requestId));
      setCounts((prev) => ({ ...prev, dm_requests: prev.dm_requests - 1 }));
    } catch (err) {
      console.error("Failed to reject DM request:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptTeam = async (inviteId: number) => {
    setActionLoading(inviteId);
    try {
      await respondTeamInvite(inviteId, "accepted");
      setItems((prev) => prev.filter((i) => i.id !== inviteId));
      setCounts((prev) => ({ ...prev, teams: prev.teams - 1 }));
    } catch (err) {
      console.error("Failed to accept team invite:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectTeam = async (inviteId: number) => {
    setActionLoading(inviteId);
    try {
      await respondTeamInvite(inviteId, "rejected");
      setItems((prev) => prev.filter((i) => i.id !== inviteId));
      setCounts((prev) => ({ ...prev, teams: prev.teams - 1 }));
    } catch (err) {
      console.error("Failed to reject team invite:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptGroup = async (inviteId: number) => {
    setActionLoading(inviteId);
    try {
      await respondGroupInvite(inviteId, "accepted");
      setItems((prev) => prev.filter((i) => i.id !== inviteId));
      setCounts((prev) => ({ ...prev, private_groups: prev.private_groups - 1 }));
    } catch (err) {
      console.error("Failed to accept group invite:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectGroup = async (inviteId: number) => {
    setActionLoading(inviteId);
    try {
      await respondGroupInvite(inviteId, "rejected");
      setItems((prev) => prev.filter((i) => i.id !== inviteId));
      setCounts((prev) => ({ ...prev, private_groups: prev.private_groups - 1 }));
    } catch (err) {
      console.error("Failed to reject group invite:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const refreshCounts = async () => {
    try {
      const c = await loadInviteCounts();
      setCounts(c);
    } catch {}
  };

  useEffect(() => {
    refreshCounts();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#020617 0%,#020b22 100%)",
        color: "#fff",
        display: "flex",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <DashboardSidebar />

      <div style={{ flex: 1, padding: 32 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: -0.5,
          }}
        >
          Invite Center
        </h1>
        <p
          style={{
            marginTop: 6,
            color: "rgba(255,255,255,.55)",
            fontSize: 15,
          }}
        >
          Manage your pending invitations and requests
        </p>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginTop: 28,
            background: "rgba(255,255,255,.04)",
            borderRadius: 14,
            padding: 4,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = counts[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: isActive
                    ? "linear-gradient(135deg,#6366f1,#818cf8)"
                    : "transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,.6)",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    style={{
                      background: isActive
                        ? "rgba(255,255,255,.25)"
                        : "#ef4444",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 999,
                      minWidth: 20,
                      textAlign: "center",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div style={{ marginTop: 24 }}>
          {loading && (
            <div
              style={{
                color: "rgba(255,255,255,.4)",
                textAlign: "center",
                padding: 40,
              }}
            >
              Loading...
            </div>
          )}

          {!loading && items.length === 0 && (
            <div
              style={{
                color: "rgba(255,255,255,.35)",
                textAlign: "center",
                padding: 60,
                fontSize: 15,
              }}
            >
              No pending {activeTab.replace("_", " ")}
            </div>
          )}

          {!loading && activeTab === "workspace" && items.length > 0 && (
            <div style={{ display: "grid", gap: 8 }}>
              {(items as WorkspaceInviteItem[]).map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.06)",
                    borderRadius: 14,
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      Role: {inv.role_to_assign}
                    </div>
                    <div
                      style={{
                        color: "rgba(255,255,255,.5)",
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      Uses: {inv.use_count}/{inv.max_uses || "∞"} · Expires:{" "}
                      {inv.expires_at
                        ? new Date(inv.expires_at).toLocaleDateString()
                        : "Never"}
                    </div>
                  </div>
                  <div
                    style={{
                      background: inv.is_valid
                        ? "rgba(34,197,94,.15)"
                        : "rgba(239,68,68,.15)",
                      color: inv.is_valid ? "#22c55e" : "#ef4444",
                      padding: "4px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {inv.is_valid ? "Active" : "Expired"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && activeTab === "teams" && items.length > 0 && (
            <div style={{ display: "grid", gap: 8 }}>
              {(items as TeamInviteItem[]).map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.06)",
                    borderRadius: 14,
                    padding: "16px 20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {inv.team_name}
                      </div>
                      <div
                        style={{
                          color: "rgba(255,255,255,.5)",
                          fontSize: 13,
                          marginTop: 4,
                        }}
                      >
                        Invited by {inv.inviter_name}
                      </div>
                      <div
                        style={{
                          color: "rgba(255,255,255,.35)",
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        Expires:{" "}
                        {inv.expires_at
                          ? new Date(inv.expires_at).toLocaleDateString()
                          : "—"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleAcceptTeam(inv.id)}
                        disabled={actionLoading === inv.id}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 10,
                          border: "none",
                          background: "#16a34a",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                          opacity: actionLoading === inv.id ? 0.5 : 1,
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectTeam(inv.id)}
                        disabled={actionLoading === inv.id}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 10,
                          border: "none",
                          background: "rgba(239,68,68,.15)",
                          color: "#ef4444",
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                          opacity: actionLoading === inv.id ? 0.5 : 1,
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && activeTab === "private_groups" && items.length > 0 && (
            <div style={{ display: "grid", gap: 8 }}>
              {(items as PrivateGroupInviteItem[]).map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.06)",
                    borderRadius: 14,
                    padding: "16px 20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {inv.channel_name}
                      </div>
                      <div
                        style={{
                          color: "rgba(255,255,255,.5)",
                          fontSize: 13,
                          marginTop: 4,
                        }}
                      >
                        Invited by {inv.inviter_name}
                      </div>
                      <div
                        style={{
                          color: "rgba(255,255,255,.35)",
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        Expires:{" "}
                        {inv.expires_at
                          ? new Date(inv.expires_at).toLocaleDateString()
                          : "—"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleAcceptGroup(inv.id)}
                        disabled={actionLoading === inv.id}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 10,
                          border: "none",
                          background: "#16a34a",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                          opacity: actionLoading === inv.id ? 0.5 : 1,
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectGroup(inv.id)}
                        disabled={actionLoading === inv.id}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 10,
                          border: "none",
                          background: "rgba(239,68,68,.15)",
                          color: "#ef4444",
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                          opacity: actionLoading === inv.id ? 0.5 : 1,
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && activeTab === "dm_requests" && items.length > 0 && (
            <div style={{ display: "grid", gap: 8 }}>
              {(items as DMRequestItem[]).map((req) => (
                <div
                  key={req.id}
                  style={{
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.06)",
                    borderRadius: 14,
                    padding: "16px 20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {req.sender_name}
                      </div>
                      {req.initial_message && (
                        <div
                          style={{
                            color: "rgba(255,255,255,.5)",
                            fontSize: 13,
                            marginTop: 4,
                          }}
                        >
                          &ldquo;{req.initial_message}&rdquo;
                        </div>
                      )}
                      <div
                        style={{
                          color: "rgba(255,255,255,.35)",
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        Expires:{" "}
                        {req.expires_at
                          ? new Date(req.expires_at).toLocaleDateString()
                          : "—"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleAcceptDM(req.id)}
                        disabled={actionLoading === req.id}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 10,
                          border: "none",
                          background: "#16a34a",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                          opacity: actionLoading === req.id ? 0.5 : 1,
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectDM(req.id)}
                        disabled={actionLoading === req.id}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 10,
                          border: "none",
                          background: "rgba(239,68,68,.15)",
                          color: "#ef4444",
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: "pointer",
                          opacity: actionLoading === req.id ? 0.5 : 1,
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

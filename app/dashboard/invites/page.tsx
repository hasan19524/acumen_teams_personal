"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Mail,
  Users,
  MessageSquare,
  AlertTriangle,
  X,
} from "lucide-react";
import { tk } from "@/lib/tokens";
import { getWorkspaceId } from "@/lib/auth";
import {
  loadInviteCounts,
  loadInviteTab,
  InviteCounts,
  TeamInviteItem,
  PrivateGroupInviteItem,
  respondTeamInvite,
  respondGroupInvite,
} from "@/features/chat/services/inviteService";
import { workspaceService } from "@/features/workspace/workspaceService";
import { useAuth } from "@/hooks/useAuth";

type TabKey = "workspace" | "teams" | "private_groups";
type StatusFilter = "all" | "pending" | "accepted" | "rejected" | "expired";

export default function InvitesPage() {
  const router = useRouter();
  const { refreshUser, isIndependent } = useAuth();
  const [counts, setCounts] = useState<InviteCounts>({
    workspace: 0,
    teams: 0,
    private_groups: 0,
  });
  
  // Dynamic tabs based on user state
  const tabs = useMemo(() => {
    if (isIndependent) {
      return [{ key: "workspace" as TabKey, label: "Workspace" }];
    }
    // Company users can see invites to other workspaces, plus their team/group invites
    return [
      { key: "workspace" as TabKey, label: "Workspace" },
      { key: "teams" as TabKey, label: "Teams" },
      { key: "private_groups" as TabKey, label: "Groups" },
    ];
  }, [isIndependent]);

  // Default to "teams" for company users, "workspace" for independent
  const [activeTab, setActiveTab] = useState<TabKey>(isIndependent ? "workspace" : "teams");
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [showWarning, setShowWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  // Ensure tab resets if state changes (e.g., after accepting invite)
  useEffect(() => {
    setActiveTab(isIndependent ? "workspace" : "teams");
  }, [isIndependent]);

  const refreshCounts = async () => {
    try {
      // Fetch independent workspace invites
      const wsInvites = await workspaceService.getActiveInvites();
      // Fetch team/group counts from existing service
      const c = await loadInviteCounts();
      setCounts({
        workspace: wsInvites.items?.length || 0,
        teams: c.teams || 0,
        private_groups: c.private_groups || 0,
      });
    } catch {}
  };

  useEffect(() => {
    refreshCounts();
  }, []);

  const loadTab = async (tab: TabKey) => {
    setLoading(true);
    setSearch("");
    try {
      let data;
      if (tab === "workspace") {
        data = await workspaceService.getActiveInvites();
      } else {
        data = await loadInviteTab(tab);
      }
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTab(activeTab);
  }, [activeTab]);

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (i) => (i.status || "pending") === statusFilter,
      );
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          (i.team_name || i.channel_name || i.role_to_assign || "")
            .toLowerCase()
            .includes(q) ||
          (i.inviter_name || i.created_by || "").toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [items, statusFilter, search]);

  const handleAccept = async (inviteId: number, type: TabKey) => {
    setActionLoading(inviteId);
    try {
      if (type === "workspace") {
        await workspaceService.respondWorkspaceInvite(inviteId, "accepted");
        
        // 1. Clear local UI state to prevent re-render race conditions
        setItems([]);
        setLoading(false);
        
        // 2. Sync auth state to transition to Workspace Mode
        await refreshUser();
        
        // 3. Redirect to the workspace dashboard
        router.push("/dashboard");
        return; 
      }
      if (type === "teams") await respondTeamInvite(inviteId, "accepted");
      if (type === "private_groups")
        await respondGroupInvite(inviteId, "accepted");

      setItems((prev) =>
        prev.map((i) => (i.id === inviteId ? { ...i, status: "accepted" } : i)),
      );
      refreshCounts();
    } catch (err) {
      console.error("Failed to accept:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (inviteId: number, type: TabKey) => {
    setActionLoading(inviteId);
    try {
      if (type === "teams") await respondTeamInvite(inviteId, "rejected");
      if (type === "private_groups")
        await respondGroupInvite(inviteId, "rejected");

      setItems((prev) =>
        prev.map((i) => (i.id === inviteId ? { ...i, status: "rejected" } : i)),
      );
      refreshCounts();
    } catch (err) {
      console.error("Failed to reject:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const initiateAccept = (inviteId: number, type: TabKey) => {
    // Independent users don't need the "leave workspace" warning
    if (type === "workspace" && !isIndependent) {
      setPendingAction(() => () => handleAccept(inviteId, type));
      setShowWarning(true);
      return;
    }
    handleAccept(inviteId, type);
  };

  const confirmAndExecute = () => {
    if (pendingAction) {
      pendingAction();
    }
    setShowWarning(false);
    setPendingAction(null);
  };

  const getStatusBadge = (status: string) => {
    const s = status || "pending";
    const styles: Record<string, any> = {
      pending: { bg: "rgba(245, 176, 65, 0.15)", color: "#F5B041" },
      accepted: { bg: "rgba(31, 164, 99, 0.15)", color: "#1FA463" },
      rejected: { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" },
      expired: { bg: "rgba(100, 116, 139, 0.15)", color: "#64748b" },
    };
    const style = styles[s] || styles.pending;
    return (
      <span
        style={{
          padding: "4px 8px",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          background: style.bg,
          color: style.color,
          textTransform: "capitalize",
        }}
      >
        {s}
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
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>
            Invitations
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              color: tk.textSecondary,
              fontSize: "14px",
            }}
          >
            Review and respond to invitations sent to you.
          </p>
        </div>

        {/* TABS - Only render if there is more than 1 tab to prevent stretching */}
        {tabs.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 2,
            background: tk.surface,
            padding: 3,
            borderRadius: 8,
            border: `1px solid ${tk.border}`,
            marginBottom: "24px",
            overflowX: "auto",
            flexShrink: 0,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = counts[tab.key] || 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: isActive ? tk.brand : "transparent",
                  color: isActive ? "#fff" : tk.textSecondary,
                  fontWeight: 600,
                  fontSize: 13,
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
                      background: isActive ? "rgba(255,255,255,.25)" : tk.primary,
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
        )}

        {/* CONTROLS - Search & Status Filter */}
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
              placeholder="Search invitations..."
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
            {(["all", "pending", "accepted", "rejected", "expired"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  background:
                    statusFilter === s ? tk.brand : "transparent",
                  color: statusFilter === s ? "#fff" : tk.textMuted,
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {/* CONTENT */}
        {loading ? (
          <div
            style={{ textAlign: "center", padding: 40, color: tk.textMuted }}
          >
            Loading...
          </div>
        ) : filteredItems.length === 0 ? (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              color: tk.textMuted,
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: 12,
            }}
          >
            <Mail size={48} style={{ opacity: 0.3, margin: "0 auto 20px" }} />
            <div style={{ fontWeight: 600, fontSize: 16, color: tk.textSecondary, marginBottom: 8 }}>
              No pending invitations
            </div>
            <div style={{ fontSize: 14, color: tk.textMuted, lineHeight: 1.5 }}>
              You're all caught up. <br />
              When someone invites you, <br />
              it'll appear here.
            </div>
          </div>
        ) : (
          <div
            style={{
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {filteredItems.map((inv, i) => {
              const isPending = (inv.status || "pending") === "pending";
              const title =
                inv.team_name || inv.channel_name || "Workspace Invite";
              const invitedBy = inv.inviter_name || inv.created_by;

              return (
                <div
                  key={inv.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 20px",
                    borderBottom:
                      i !== filteredItems.length - 1
                        ? `1px solid ${tk.border}`
                        : "none",
                    opacity: (inv.status === "accepted" || inv.status === "rejected") ? 0.6 : 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background:
                          activeTab === "teams"
                            ? tk.brand
                            : activeTab === "private_groups"
                              ? tk.brandLight
                              : tk.surfaceHover,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {activeTab === "teams" && (
                        <Users size={18} color="#fff" />
                      )}
                      {activeTab === "private_groups" && (
                        <MessageSquare size={18} color="#fff" />
                      )}
                      {activeTab === "workspace" && (
                        <Mail size={18} color={tk.textSecondary} />
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: tk.textPrimary,
                        }}
                      >
                        {title}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: tk.textSecondary,
                          marginTop: 2,
                        }}
                      >
                        By <span style={{ fontWeight: 500 }}>{invitedBy}</span>
                        {inv.expires_at &&
                          ` · Expires ${new Date(inv.expires_at).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    {getStatusBadge(inv.status || "pending")}
                    {isPending && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => initiateAccept(inv.id, activeTab)}
                          disabled={actionLoading === inv.id}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 6,
                            border: "none",
                            background: tk.success,
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                            opacity: actionLoading === inv.id ? 0.5 : 1,
                          }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(inv.id, activeTab)}
                          disabled={actionLoading === inv.id}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 6,
                            border: `1px solid ${tk.border}`,
                            background: "transparent",
                            color: tk.textSecondary,
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                            opacity: actionLoading === inv.id ? 0.5 : 1,
                          }}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WORKSPACE SWITCH WARNING */}
      {showWarning && (
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
          onClick={() => setShowWarning(false)}
        >
          <div
            style={{
              background: tk.surface,
              border: `1px solid ${tk.border}`,
              borderRadius: 12,
              padding: 24,
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
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>
              Join New Workspace?
            </h3>
            <p
              style={{
                margin: "0 0 24px",
                color: tk.textSecondary,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              You are currently in another workspace. Joining will require
              leaving it.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowWarning(false)}
                style={{
                  flex: 1,
                  padding: 10,
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
                onClick={confirmAndExecute}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  border: "none",
                  background: tk.primary,
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

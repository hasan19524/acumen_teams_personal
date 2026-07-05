"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Mail, Users, AlertTriangle } from "lucide-react";
import { tk } from "@/lib/tokens";
import {
  loadInviteCounts,
  loadInviteTab,
  InviteCounts,
  respondTeamInvite,
} from "@/features/chat/services/inviteService";
import { workspaceService } from "@/features/workspace/workspaceService";
import { useAuth } from "@/hooks/useAuth";

type TabKey = "workspace" | "teams";

export default function InvitesPage() {
  const router = useRouter();
  const { refreshUser, isIndependent } = useAuth();
  const [counts, setCounts] = useState<InviteCounts>({
    workspace: 0,
    teams: 0,
    private_groups: 0, // Kept for type compatibility
  });

  // FIX: Removed "private_groups" tab as they are now handled in Chat Requests
  const tabs = useMemo(() => {
    if (isIndependent) {
      return [{ key: "workspace" as TabKey, label: "Workspace" }];
    }
    return [
      { key: "workspace" as TabKey, label: "Workspace" },
      { key: "teams" as TabKey, label: "Teams" },
    ];
  }, [isIndependent]);

  const [activeTab, setActiveTab] = useState<TabKey>(
    isIndependent ? "workspace" : "teams",
  );
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    (() => Promise<void>) | null
  >(null);

  useEffect(() => {
    setActiveTab(isIndependent ? "workspace" : "teams");
  }, [isIndependent]);

  const refreshCounts = async () => {
    try {
      const wsInvites = await workspaceService.getActiveInvites();
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

      // FIX: Ensure we only ever show pending invites.
      // If the backend returns accepted/rejected, we filter them out immediately.
      const pendingOnly = (data.items || []).filter(
        (i: any) => (i.status || "pending") === "pending",
      );
      setItems(pendingOnly);
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
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        (i.team_name || i.workspace_name || i.role_to_assign || "")
          .toLowerCase()
          .includes(q) ||
        (i.inviter_name || i.created_by || "").toLowerCase().includes(q),
    );
  }, [items, search]);

  const handleAccept = async (inviteId: number, type: TabKey) => {
    setActionLoading(inviteId);
    try {
      if (type === "workspace") {
        await workspaceService.respondWorkspaceInvite(inviteId, "accepted");
        setItems([]);
        setLoading(false);
        await refreshUser();
        router.push("/dashboard");
        return;
      }
      if (type === "teams") await respondTeamInvite(inviteId, "accepted");

      // FIX: Remove the item from the list instantly instead of updating status
      setItems((prev) => prev.filter((i) => i.id !== inviteId));
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

      // FIX: Remove the item from the list instantly instead of updating status
      setItems((prev) => prev.filter((i) => i.id !== inviteId));
      refreshCounts();
    } catch (err) {
      console.error("Failed to reject:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const initiateAccept = (inviteId: number, type: TabKey) => {
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

  return (
    <main
      className="min-h-screen w-full"
      style={{
        background: tk.bg,
        color: tk.textPrimary,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="max-w-[1400px] mx-auto p-4 md:p-8">
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

        {/* TABS */}
        {tabs.length > 1 && (
          <div className="flex gap-2 bg-[#172440] p-1.5 rounded-lg border border-[#2A3A5C] mb-6 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = counts[tab.key] || 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-md font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    isActive
                      ? "bg-[#4B1587] text-white"
                      : "text-[#B7C0D8] hover:bg-[#20304E]"
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center ${
                        isActive
                          ? "bg-white/25 text-white"
                          : "bg-[#E31E24] text-white"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* SEARCH BAR */}
        <div className="mb-6">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A86A7] pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invitations..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#2A3A5C] bg-[#172440] text-white text-sm outline-none focus:border-[#5DADE2] transition-colors box-border"
            />
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="text-center py-10 text-[#7A86A7]">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-10 md:p-16 text-center text-[#7A86A7] bg-[#172440] border border-[#2A3A5C] rounded-xl">
            <Mail size={48} className="opacity-30 mx-auto mb-5" />
            <div className="font-semibold text-base text-[#B7C0D8] mb-2">
              No pending invitations
            </div>
            <div className="text-sm leading-relaxed">
              You're all caught up.
              <br />
              When someone invites you, it'll appear here.
            </div>
          </div>
        ) : (
          <div className="bg-[#172440] border border-[#2A3A5C] rounded-xl overflow-hidden">
            {filteredItems.map((inv, i) => {
              const title =
                inv.team_name || inv.workspace_name || "Workspace Invite";
              const invitedBy = inv.inviter_name || inv.created_by;

              return (
                <div
                  key={inv.id}
                  className="flex flex-col md:flex-row justify-between gap-4 p-4 md:p-5 border-b border-[#2A3A5C] last:border-b-0"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background:
                          activeTab === "teams" ? tk.brand : tk.surfaceHover,
                      }}
                    >
                      {activeTab === "teams" ? (
                        <Users size={18} color="#fff" />
                      ) : (
                        <Mail size={18} color={tk.textSecondary} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-white truncate">
                        {title}
                      </div>
                      <div className="text-xs text-[#B7C0D8] mt-1 truncate">
                        By <span className="font-medium">{invitedBy}</span>
                        {inv.expires_at &&
                          ` · Expires ${new Date(inv.expires_at).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 self-end md:self-center">
                    <button
                      onClick={() => initiateAccept(inv.id, activeTab)}
                      disabled={actionLoading === inv.id}
                      className="px-3 py-2 rounded-md bg-[#1FA463] text-white font-semibold text-xs cursor-pointer disabled:opacity-50 transition-opacity"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(inv.id, activeTab)}
                      disabled={actionLoading === inv.id}
                      className="px-3 py-2 rounded-md border border-[#2A3A5C] bg-transparent text-[#B7C0D8] font-semibold text-xs cursor-pointer disabled:opacity-50 transition-opacity"
                    >
                      Decline
                    </button>
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
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4"
          onClick={() => setShowWarning(false)}
        >
          <div
            className="bg-[#172440] border border-[#2A3A5C] rounded-xl p-6 w-full max-w-sm text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-[#E31E24]/15 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} color="#E31E24" />
            </div>
            <h3 className="m-0 mb-2 text-base font-bold text-white">
              Join New Workspace?
            </h3>
            <p className="m-0 mb-6 text-[#B7C0D8] text-sm leading-relaxed">
              You are currently in another workspace. Joining will require
              leaving it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 py-2.5 rounded-lg border border-[#2A3A5C] bg-transparent text-[#B7C0D8] font-semibold cursor-pointer hover:bg-[#20304E] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndExecute}
                className="flex-1 py-2.5 rounded-lg border-none bg-[#E31E24] text-white font-semibold cursor-pointer hover:bg-[#c71a20] transition-colors"
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

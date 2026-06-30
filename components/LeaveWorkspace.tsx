"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  X,
  Loader2,
  UserCheck,
  LogOut,
  Check,
} from "lucide-react";
import { workspaceService } from "@/features/workspace/workspaceService";
import { useAuth } from "@/hooks/useAuth";
import { useChatStore } from "@/features/chat/store/chatStore";
import { useTaskStore } from "@/features/tasks/store/taskStore";
import { useNotificationStore } from "@/features/notification/store/notificationStore";

export function LeaveWorkspace() {
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState("");

  const [members, setMembers] = useState<any[]>([]);
  const [selectedNewOwner, setSelectedNewOwner] = useState<number | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [transferSuccess, setTransferSuccess] = useState(false);

  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const resetChat = useChatStore((s) => s.resetWorkspaceState);
  const resetTasks = useTaskStore((s) => s.resetWorkspaceState);
  const resetNotifications = useNotificationStore((s) => s.resetWorkspaceState);

  const clearStateAndRedirect = async () => {
    localStorage.removeItem("workspace_id");
    resetChat();
    resetTasks();
    resetNotifications();
    await refreshUser();
    router.replace("/dashboard");
  };

  const handleLeave = async () => {
    setLeaveLoading(true);
    setLeaveError("");
    try {
      await workspaceService.leaveWorkspace();
      await clearStateAndRedirect();
      setShowLeaveModal(false);
    } catch (err: any) {
      setLeaveError(
        err.message ||
          "Failed to leave workspace. You may need to transfer ownership first.",
      );
    } finally {
      setLeaveLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await workspaceService.getMembers();
      setMembers(data.filter((m: any) => m.user_id !== user?.id));
    } catch (err) {
      setTransferError("Failed to load workspace members.");
    }
  };

  const openTransferModal = () => {
    setTransferError("");
    setTransferSuccess(false);
    setSelectedNewOwner(null);
    fetchMembers();
    setShowTransferModal(true);
  };

  const handleTransfer = async () => {
    if (!selectedNewOwner) {
      setTransferError("Please select a new owner.");
      return;
    }
    setTransferLoading(true);
    setTransferError("");
    try {
      await workspaceService.transferOwnership(selectedNewOwner);
      setTransferSuccess(true);
      await refreshUser(); // Update local state so user is now Admin, not Owner
      setTimeout(() => setShowTransferModal(false), 1500);
    } catch (err: any) {
      setTransferError(err.message || "Failed to transfer ownership.");
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <>
      {/* Danger Zone Card */}
      <div
        style={{
          border: "1px solid #332020",
          background: "rgba(239, 68, 68, 0.03)",
          borderRadius: 12,
        }}
      >
        {/* Transfer Ownership Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: "1px solid #332020",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <UserCheck size={20} color="#94a3b8" style={{ marginTop: 2 }} />
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#f1f5f9",
                }}
              >
                Transfer Ownership
              </h3>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                  color: "#64748b",
                  maxWidth: 400,
                }}
              >
                Transfer ownership of this workspace to another admin. You will
                be downgraded to an admin.
              </p>
            </div>
          </div>
          <button
            onClick={openTransferModal}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #3b82f6",
              background: "transparent",
              color: "#3b82f6",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Transfer
          </button>
        </div>

        {/* Leave Workspace Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <LogOut size={20} color="#94a3b8" style={{ marginTop: 2 }} />
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#f1f5f9",
                }}
              >
                Leave Workspace
              </h3>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                  color: "#64748b",
                  maxWidth: 400,
                }}
              >
                Permanently leave this workspace. You will lose access to all
                channels, teams, and data.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLeaveModal(true)}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #ef4444",
              background: "transparent",
              color: "#ef4444",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Leave
          </button>
        </div>
      </div>

      {/* LEAVE MODAL */}
      {showLeaveModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 200,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
          onClick={() => !leaveLoading && setShowLeaveModal(false)}
        >
          <div
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 12,
              width: "100%",
              maxWidth: 420,
              padding: 24,
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
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "rgba(239, 68, 68, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={18} color="#ef4444" />
              </div>
              <button
                onClick={() => !leaveLoading && setShowLeaveModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 8,
              }}
            >
              Are you absolutely sure?
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "#94a3b8",
                lineHeight: 1.5,
                marginBottom: 24,
              }}
            >
              This action will remove you from the workspace. You will need to
              be invited again to rejoin.
            </p>
            {leaveError && (
              <div
                style={{
                  color: "#ef4444",
                  fontSize: 12,
                  marginBottom: 16,
                  textAlign: "center",
                  background: "rgba(239,68,68,0.1)",
                  padding: "8px",
                  borderRadius: 6,
                }}
              >
                {leaveError}
              </div>
            )}
            <button
              onClick={handleLeave}
              disabled={leaveLoading}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "none",
                background: "#ef4444",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: leaveLoading ? 0.6 : 1,
              }}
            >
              {leaveLoading ? (
                <>
                  <Loader2
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />{" "}
                  Leaving...
                </>
              ) : (
                "Yes, leave workspace"
              )}
            </button>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 200,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
          onClick={() =>
            !transferLoading && !transferSuccess && setShowTransferModal(false)
          }
        >
          <div
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 12,
              width: "100%",
              maxWidth: 480,
              padding: 24,
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
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "rgba(59, 130, 246, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserCheck size={18} color="#3b82f6" />
              </div>
              <button
                onClick={() =>
                  !transferLoading &&
                  !transferSuccess &&
                  setShowTransferModal(false)
                }
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {!transferSuccess ? (
              <>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: 8,
                  }}
                >
                  Transfer Ownership
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#94a3b8",
                    lineHeight: 1.5,
                    marginBottom: 24,
                  }}
                >
                  Select a new owner from your active workspace members. You
                  will be downgraded to an admin.
                </p>

                <div
                  style={{
                    maxHeight: 200,
                    overflowY: "auto",
                    border: "1px solid #1e293b",
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  {members.length === 0 ? (
                    <div
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: "#94a3b8",
                        fontSize: 13,
                      }}
                    >
                      No other members available to transfer to.
                    </div>
                  ) : (
                    members.map((m) => (
                      <div
                        key={m.user_id}
                        onClick={() => setSelectedNewOwner(m.user_id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid #1e293b",
                          background:
                            selectedNewOwner === m.user_id
                              ? "rgba(59, 130, 246, 0.1)"
                              : "transparent",
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            border: `1px solid ${selectedNewOwner === m.user_id ? "#3b82f6" : "#334155"}`,
                            background:
                              selectedNewOwner === m.user_id
                                ? "#3b82f6"
                                : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {selectedNewOwner === m.user_id && (
                            <Check size={14} color="#fff" />
                          )}
                        </div>
                        <span style={{ fontSize: 14, color: "#f1f5f9" }}>
                          {m.full_name || m.username}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {transferError && (
                  <div
                    style={{
                      color: "#ef4444",
                      fontSize: 12,
                      marginBottom: 16,
                      textAlign: "center",
                    }}
                  >
                    {transferError}
                  </div>
                )}

                <button
                  onClick={handleTransfer}
                  disabled={!selectedNewOwner || transferLoading}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 8,
                    border: "none",
                    background: "#3b82f6",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    opacity: !selectedNewOwner || transferLoading ? 0.6 : 1,
                  }}
                >
                  {transferLoading ? (
                    <>
                      <Loader2
                        size={16}
                        style={{ animation: "spin 1s linear infinite" }}
                      />{" "}
                      Transferring...
                    </>
                  ) : (
                    "Transfer Ownership"
                  )}
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "rgba(16, 185, 129, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Check size={24} color="#10b981" />
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: 8,
                  }}
                >
                  Ownership Transferred
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#94a3b8",
                    lineHeight: 1.5,
                  }}
                >
                  You are now an admin of this workspace.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

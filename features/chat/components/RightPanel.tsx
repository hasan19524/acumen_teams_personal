"use client";

import { useState } from "react";
import {
  X,
  Users,
  FileText,
  Image as ImageIcon,
  Search,
  UserPlus,
  Inbox,
} from "lucide-react";
import { T } from "../design/tokens";
import { Channel } from "../types/channel";
import { Message } from "../types/message";
import { resolveFileUrl } from "../utils/rendering";
import { sendGroupInvite } from "../services/channelService";
import Avatar from "@/components/Avatar";
import { useProfileStore } from "@/features/dashboard/store/profileStore";

interface RightPanelProps {
  channel: Channel | null;
  members: any[];
  onlineUsers: any[];
  messages: Message[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onClose: () => void;
  onGalleryOpen: (
    items: Array<{ url: string; type: string; name: string }>,
    index: number,
  ) => void;
  workspaceUsers: Array<{ id: number; username: string; full_name: string }>;
  onMembersUpdated: () => void;
}

export function RightPanel({
  channel,
  members,
  onlineUsers,
  messages,
  activeTab,
  setActiveTab,
  onClose,
  onGalleryOpen,
  workspaceUsers,
}: RightPanelProps) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [search, setSearch] = useState("");
  const [addingId, setAddingId] = useState<number | null>(null);
  const openProfile = useProfileStore((s) => s.openProfile);

  const allAttachments = messages.flatMap((m) => m.attachments || []);
  const mediaAtts = allAttachments.filter(
    (att) =>
      att.file_type?.startsWith("image/") ||
      att.file_type?.startsWith("video/"),
  );
  const fileAtts = allAttachments.filter(
    (att) =>
      !att.file_type?.startsWith("image/") &&
      !att.file_type?.startsWith("video/"),
  );

  const tabs = [
    { key: "members", label: "Members", icon: Users },
    { key: "files", label: "Files", icon: FileText },
    { key: "media", label: "Media", icon: ImageIcon },
  ];

  const handleAddMember = async (userId: number) => {
    if (!channel) return;
    setAddingId(userId);
    try {
      await sendGroupInvite(channel.id, userId);
      alert("Invitation sent successfully!");
      setShowAddMember(false);
    } catch (err: any) {
      // FIX: Clean up error message so it doesn't show raw JSON
      let errorMsg = "Failed to send invite.";
      if (err.message) {
        try {
          const parsed = JSON.parse(err.message);
          errorMsg = parsed.error || parsed.detail || errorMsg;
        } catch {
          errorMsg = err.message;
        }
      }
      alert(errorMsg);
    } finally {
      setAddingId(null);
    }
  };

  const availableUsers = workspaceUsers.filter(
    (u) =>
      !members.some((m) => m.user_id === u.id) &&
      (u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <aside
      className="relative w-full md:w-[320px] h-full"
      style={{
        background: T.bgSidebar,
        borderLeft: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: T.textPrimary,
          }}
        >
          Info
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: T.textMuted,
            cursor: "pointer",
            padding: 6,
            borderRadius: T.radiusSm,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = T.textPrimary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = T.textMuted)}
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: "12px 8px",
                background: "transparent",
                border: "none",
                borderBottom: isActive
                  ? `2px solid ${T.accent}`
                  : "2px solid transparent",
                color: isActive ? T.accentHover : T.textMuted,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                transition: "color 0.1s",
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
        {activeTab === "members" && (
          <div>
            {!showAddMember ? (
              <>
                {channel?.channel_type === "private_group" && (
                  <button
                    onClick={() => setShowAddMember(true)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginBottom: 12,
                      borderRadius: T.radiusSm,
                      border: `1px dashed ${T.borderHover}`,
                      background: "transparent",
                      color: T.accentHover,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <UserPlus size={14} /> Add Members
                  </button>
                )}

                {members.length === 0 ? (
                  <EmptyState text="No members found." />
                ) : (
                  members.map((m) => {
                    const isOnline = onlineUsers.some(
                      (u) => u.id === m.user_id,
                    );
                    return (
                      <div
                        key={m.id}
                        onClick={() => openProfile(m)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "8px 12px",
                          borderRadius: T.radiusSm,
                          marginBottom: 2,
                          transition: "background 0.1s",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = T.bgHover)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <Avatar
                          user={m}
                          name={m.full_name || m.username}
                          size="sm"
                        />
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: T.textPrimary,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {m.full_name || m.username}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: isOnline ? T.success : T.textMuted,
                              fontWeight: isOnline ? 600 : 400,
                              textTransform: "capitalize",
                            }}
                          >
                            {isOnline ? "Active Now" : m.role}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            ) : (
              <div>
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <Search
                    size={14}
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 12,
                      color: T.textMuted,
                    }}
                  />
                  <input
                    placeholder="Search members..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 32px",
                      borderRadius: T.radiusSm,
                      border: `1px solid ${T.border}`,
                      background: T.bgInputField,
                      color: T.textPrimary,
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                </div>
                {availableUsers.length === 0 ? (
                  <EmptyState text="No users available to add." />
                ) : (
                  availableUsers.map((u) => (
                    <div
                      key={u.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: T.radiusSm,
                        marginBottom: 2,
                        background: T.bgHover,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Avatar
                          user={u}
                          name={u.full_name || u.username}
                          size="sm"
                        />
                        <span style={{ fontSize: 13, color: T.textPrimary }}>
                          {u.full_name || u.username}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddMember(u.id)}
                        disabled={addingId === u.id}
                        style={{
                          background: T.accent,
                          border: "none",
                          color: "#fff",
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: addingId === u.id ? 0.5 : 1,
                        }}
                      >
                        <UserPlus size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "files" && (
          <div>
            {fileAtts.length === 0 ? (
              <EmptyState text="No files shared yet." />
            ) : (
              fileAtts.map((att) => (
                <a
                  key={att.id}
                  href={resolveFileUrl(att.file_url)}
                  download={att.original_filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: T.radiusSm,
                    marginBottom: 4,
                    background: T.bgHover,
                    textDecoration: "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = T.surfaceHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = T.bgHover)
                  }
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      background: T.accentMuted,
                      borderRadius: T.radiusXs,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={16} style={{ color: T.accentHover }} />
                  </div>
                  <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: T.textPrimary,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {att.original_filename}
                    </div>
                    <div
                      style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}
                    >
                      {(att.file_size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        )}

        {activeTab === "media" && (
          <div>
            {mediaAtts.length === 0 ? (
              <EmptyState text="No media shared yet." />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 4,
                }}
              >
                {mediaAtts.map((att, i) => {
                  const url = resolveFileUrl(att.file_url);
                  const isVideo = att.file_type?.startsWith("video/");
                  return (
                    <div
                      key={att.id}
                      onClick={() => {
                        const items = mediaAtts.map((a) => ({
                          url: resolveFileUrl(a.file_url),
                          type: a.file_type || "",
                          name: a.original_filename || "",
                        }));
                        onGalleryOpen(items, i);
                      }}
                      style={{
                        position: "relative",
                        width: "100%",
                        paddingBottom: "100%",
                        borderRadius: T.radiusSm,
                        overflow: "hidden",
                        cursor: "pointer",
                        background: T.bgHover,
                      }}
                    >
                      {isVideo ? (
                        <video
                          src={url}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          muted
                        />
                      ) : (
                        <img
                          src={url}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          alt=""
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        color: T.textMuted,
        textAlign: "center",
      }}
    >
      <Inbox size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
      <p style={{ fontSize: 13, margin: 0 }}>{text}</p>
    </div>
  );
}

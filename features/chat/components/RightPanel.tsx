// features/chat/components/RightPanel.tsx
"use client";

import { X, Users, FileText, Image, Pin, Search } from "lucide-react";
import { T } from "../design/tokens";
import { Channel } from "../types/channel";
import { Message } from "../types/message";
import { resolveFileUrl } from "../utils/rendering";

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
}: RightPanelProps) {
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
    { key: "media", label: "Media", icon: Image },
    { key: "pinned", label: "Pinned", icon: Pin },
  ];

  return (
    <aside
      style={{
        width: 320,
        height: "100vh",
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
          Channel Info
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
            {members.length === 0 ? (
              <EmptyState text="No members found." />
            ) : (
              members.map((m) => {
                const isOnline = onlineUsers.some((u) => u.id === m.user_id);
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: T.radiusSm,
                      marginBottom: 2,
                      transition: "background 0.1s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.bgHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: T.accent,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        {m.username.charAt(0).toUpperCase()}
                      </div>
                      {isOnline && (
                        <div style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, borderRadius: "50%", background: T.success, border: `2px solid ${T.bgSidebar}` }} />
                      )}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {m.full_name || m.username}
                      </div>
                      <div style={{ fontSize: 11, color: isOnline ? T.success : T.textMuted, fontWeight: isOnline ? 600 : 400 }}>
                        {isOnline ? "Active Now" : (m.role === "admin" ? "Admin" : "Offline")}
                      </div>
                    </div>
                  </div>
                );
              })
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

        {activeTab === "pinned" && (
          <EmptyState text="No pinned messages yet." />
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
      <Search size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
      <p style={{ fontSize: 13, margin: 0 }}>{text}</p>
    </div>
  );
}

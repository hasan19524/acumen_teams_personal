// features/chat/components/ChatHeader.tsx
"use client";

import {
  Phone,
  Video,
  X,
  Copy,
  Trash2,
  Hash,
  Users,
  Lock,
  Search,
  MoreHorizontal,
} from "lucide-react";
import { ConnectionStatus } from "./ConnectionStatus";
import { T } from "../design/tokens";
import { ConnectionState } from "../hooks/useWebSocket";
import { Channel } from "../types/channel";

interface ChatHeaderProps {
  selectedChannel: Channel | null;
  wsState: ConnectionState;
  isSelectMode: boolean;
  selectedCount: number;
  onExitSelectMode: () => void;
  onCopySelected: () => void;
  onBulkDelete: () => void;
  typingUsers?: { id: number; username: string }[];
}

export function ChatHeader({
  selectedChannel,
  wsState,
  isSelectMode,
  selectedCount,
  onExitSelectMode,
  onCopySelected,
  onBulkDelete,
  typingUsers,
}: ChatHeaderProps) {
  const isDM = selectedChannel?.channel_type === "dm";
  const dmPartner = selectedChannel?.dm_partner;

  const displayName = isDM
    ? dmPartner?.full_name || dmPartner?.username || "Direct Message"
    : selectedChannel?.name || "Select Chat";

  const subtitle = isDM
    ? `@${dmPartner?.username || ""}`
    : `${selectedChannel?.member_count || 0} members`;

  const renderAvatar = () => {
    if (isDM) {
      return (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: T.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
      );
    }

    const Icon =
      selectedChannel?.channel_type === "official"
        ? Hash
        : selectedChannel?.channel_type === "team"
          ? Users
          : Lock;

    return (
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: T.radiusSm,
          background: T.bgHoverStrong,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: T.textSecondary,
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </div>
    );
  };

  return (
    <div
      style={{
        padding: "12px 20px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: T.bgSecondary,
        flexShrink: 0,
        height: 60,
      }}
    >
      {isSelectMode ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={onExitSelectMode}
              style={{
                background: "transparent",
                border: "none",
                color: T.textPrimary,
                cursor: "pointer",
                display: "flex",
                padding: 4,
              }}
            >
              <X size={20} />
            </button>
            <span style={{ fontWeight: 600, fontSize: 15 }}>
              {selectedCount} selected
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onCopySelected}
              style={{
                background: "transparent",
                border: "none",
                color: T.textSecondary,
                cursor: "pointer",
                display: "flex",
                padding: 6,
                borderRadius: T.radiusSm,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = T.textPrimary)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = T.textSecondary)
              }
            >
              <Copy size={18} />
            </button>
            <button
              onClick={onBulkDelete}
              style={{
                background: "transparent",
                border: "none",
                color: T.danger,
                cursor: "pointer",
                display: "flex",
                padding: 6,
                borderRadius: T.radiusSm,
              }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Left: Avatar + Info */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              overflow: "hidden",
              flex: 1,
            }}
          >
            {renderAvatar()}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {displayName}
                </span>
                <ConnectionStatus state={wsState} />
              </div>
              {typingUsers && typingUsers.length > 0 ? (
                <span
                  style={{
                    fontSize: 12,
                    color: T.accentHover,
                    fontStyle: "italic",
                  }}
                >
                  {typingUsers.map((u) => u.username).join(", ")}{" "}
                  {typingUsers.length === 1 ? "is" : "are"} typing...
                </span>
              ) : (
                <span
                  style={{
                    fontSize: 12,
                    color: T.textMuted,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          {/* Right: Action Icons */}
          <div
            style={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <HeaderIcon icon={<Search size={16} />} />
            <HeaderIcon icon={<Users size={16} />} />
            <HeaderIcon icon={<Phone size={16} />} />
            <HeaderIcon icon={<Video size={16} />} />
            <HeaderIcon icon={<MoreHorizontal size={16} />} />
          </div>
        </>
      )}
    </div>
  );
}

function HeaderIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <button
      style={{
        width: 34,
        height: 34,
        borderRadius: T.radiusSm,
        background: "transparent",
        border: "none",
        color: T.textMuted,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = T.bgHoverStrong;
        e.currentTarget.style.color = T.textPrimary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = T.textMuted;
      }}
    >
      {icon}
    </button>
  );
}

"use client";

import { useState } from "react";
import {
  X,
  Copy,
  Trash2,
  MoreHorizontal,
  ArrowLeft,
  Info,
  Eraser,
} from "lucide-react";
import { T } from "../design/tokens";
import { Channel } from "../types/channel";
import Avatar from "@/components/Avatar";
import { useProfileStore } from "@/features/dashboard/store/profileStore";

interface ChatHeaderProps {
  selectedChannel: Channel | null;
  isSelectMode: boolean;
  selectedCount: number;
  onExitSelectMode: () => void;
  onCopySelected: () => void;
  onBulkDelete: () => void;
  typingUsers?: { id: number; username: string }[];
  onTogglePanel?: () => void;
  onBack?: () => void;
  onClearChat?: () => void;
  onDeleteChat?: () => void;
}

export function ChatHeader({
  selectedChannel,
  isSelectMode,
  selectedCount,
  onExitSelectMode,
  onCopySelected,
  onBulkDelete,
  typingUsers,
  onTogglePanel,
  onBack,
  onClearChat,
  onDeleteChat,
}: ChatHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDM = selectedChannel?.channel_type === "dm";
  const dmPartner = selectedChannel?.dm_partner;
  const openProfile = useProfileStore((s) => s.openProfile);

  const displayName = isDM
    ? dmPartner?.full_name || dmPartner?.username || "Direct Message"
    : selectedChannel?.name || "Select Chat";

  const subtitle = isDM
    ? `@${dmPartner?.username || ""}`
    : `${selectedChannel?.member_count || 0} members`;

  const menuBtnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    background: "transparent",
    border: "none",
    color: T.textSecondary,
    fontSize: 13,
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        padding: "12px 16px",
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
          {/* Left: Back Button (Mobile) + Avatar + Info (Clickable to open Right Panel) */}
          <button
            onClick={onTogglePanel}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              overflow: "hidden",
              flex: 1,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              textAlign: "left",
            }}
          >
            {onBack && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onBack();
                }}
                className="md:hidden"
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.textPrimary,
                  cursor: "pointer",
                  padding: 4,
                  flexShrink: 0,
                }}
              >
                <ArrowLeft size={20} />
              </div>
            )}

            {isDM ? (
              <div 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  openProfile(dmPartner); 
                }}
                style={{ display: "flex", alignItems: "center" }}
              >
                <Avatar user={dmPartner} name={displayName} size="md" />
              </div>
            ) : (
              <Avatar
                src={(selectedChannel as any)?.avatar_url}
                name={displayName}
                size="md"
                className="rounded-lg"
              />
            )}

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
          </button>

          {/* Right: 3-Dots Dropdown Menu */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: 36,
                height: 36,
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
              <MoreHorizontal size={18} />
            </button>

            {menuOpen && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 99 }}
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 40,
                    right: 0,
                    background: T.bgModal,
                    border: `1px solid ${T.borderHover}`,
                    borderRadius: T.radiusMd,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    zIndex: 100,
                    width: 180,
                    overflow: "hidden",
                  }}
                >
                  <button
                    style={menuBtnStyle}
                    onClick={() => {
                      onTogglePanel?.();
                      setMenuOpen(false);
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = T.bgHover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Info size={16} /> View Info
                  </button>
                  <button
                    style={menuBtnStyle}
                    onClick={() => {
                      onClearChat?.();
                      setMenuOpen(false);
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = T.bgHover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Eraser size={16} /> Clear Chat
                  </button>
                  <div
                    style={{ height: 1, background: T.border, margin: "4px 0" }}
                  />
                  <button
                    style={{ ...menuBtnStyle, color: T.danger }}
                    onClick={() => {
                      onDeleteChat?.();
                      setMenuOpen(false);
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = T.dangerHover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Trash2 size={16} /> Delete Chat
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

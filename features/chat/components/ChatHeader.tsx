// features/chat/components/ChatHeader.tsx

"use client";

import { Phone, Video, X, Copy, Trash2 } from "lucide-react";
import { ConnectionStatus } from "./ConnectionStatus";
import { T } from "../design/tokens";
import { ConnectionState } from "../hooks/useWebSocket"; // ADDED

interface ChatHeaderProps {
  selectedChatName: string | undefined;
  wsState: ConnectionState; // CHANGED from string
  isSelectMode: boolean;
  selectedCount: number;
  onExitSelectMode: () => void;
  onCopySelected: () => void;
  onBulkDelete: () => void;
  typingUsers?: { id: number; username: string }[];
}

export function ChatHeader({
  selectedChatName,
  wsState,
  isSelectMode,
  selectedCount,
  onExitSelectMode,
  onCopySelected,
  onBulkDelete,
  typingUsers,
}: ChatHeaderProps) {
  return (
    <div
      style={{
        padding: "14px 20px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: T.bgHeader,
        flexShrink: 0,
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
              }}
            >
              <X size={20} />
            </button>
            <span style={{ fontWeight: 600, fontSize: 15 }}>
              {selectedCount} selected
            </span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={onCopySelected}
              style={{
                background: "transparent",
                border: "none",
                color: T.textSecondary,
                cursor: "pointer",
                display: "flex",
                padding: 6,
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
              }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>
                {selectedChatName || "Select Chat"}
              </div>
              {typingUsers && typingUsers.length > 0 && (
                <div style={{ fontSize: 12, color: T.accentHover, fontWeight: 500, lineHeight: 1.2 }}>
                  {typingUsers.map(u => u.username).join(', ')} typing...
                </div>
              )}
            </div>
            <ConnectionStatus state={wsState} />
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[Phone, Video].map((Icon, i) => (
              <button
                key={`h-${i}`}
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
                <Icon size={16} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

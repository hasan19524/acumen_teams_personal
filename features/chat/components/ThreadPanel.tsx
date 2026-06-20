// features/chat/components/ThreadPanel.tsx
"use client";
import { useState } from "react";
import { X, Send } from "lucide-react";
import { T } from "../design/tokens";
import { Message } from "../types/message";

interface ThreadPanelProps {
  parentMessage: Message;
  messages: Message[];
  myUserId: number;
  onClose: () => void;
  onSend: (content: string) => void;
}

export function ThreadPanel({
  parentMessage,
  messages,
  myUserId,
  onClose,
  onSend,
}: ThreadPanelProps) {
  const [input, setInput] = useState("");

  // Filter replies from the main message list
  const threadReplies = messages.filter(
    (m) => m.reply_to?.id === parentMessage.id && !m.is_deleted,
  );

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <aside
      style={{
        width: 400,
        height: "100vh",
        background: T.bgApp,
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
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: T.textPrimary,
            }}
          >
            Thread
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: T.textMuted }}>
            Replying to {parentMessage.sender_name}
          </p>
        </div>
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

      {/* Parent Message */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${T.border}`,
          background: T.bgSecondary,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
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
              fontSize: 13,
            }}
          >
            {parentMessage.sender_name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span
                style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}
              >
                {parentMessage.sender_name}
              </span>
              <span style={{ fontSize: 11, color: T.textMuted }}>
                {parentMessage.created_time}
              </span>
            </div>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 14,
                color: T.textSecondary,
                lineHeight: 1.4,
              }}
            >
              {parentMessage.content || "[Attachment]"}
            </p>
          </div>
        </div>
      </div>

      {/* Replies List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {threadReplies.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: T.textMuted,
              fontSize: 13,
              padding: "20px 0",
            }}
          >
            No replies yet. Start the conversation!
          </div>
        ) : (
          threadReplies.map((msg) => {
            const mine = msg.sender?.id === myUserId;
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  gap: 12,
                  marginBottom: 16,
                  flexDirection: mine ? "row-reverse" : "row",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: mine ? T.accent : T.border,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 11,
                    flexShrink: 0,
                  }}
                >
                  {msg.sender_name?.charAt(0).toUpperCase()}
                </div>
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "8px 12px",
                    borderRadius: mine
                      ? "12px 12px 2px 12px"
                      : "12px 12px 12px 2px",
                    background: mine ? T.bgBubbleMine : T.bgBubbleOther,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: mine ? T.textMuted : T.accentHover,
                      }}
                    >
                      {msg.sender_name}
                    </span>
                    <span style={{ fontSize: 10, color: T.textMuted }}>
                      {msg.created_time}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: T.textPrimary,
                      lineHeight: 1.4,
                    }}
                  >
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Reply..."
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: T.radiusMd,
              border: `1px solid ${T.border}`,
              background: T.bgInputField,
              color: T.textPrimary,
              outline: "none",
              fontSize: T.fontSizeSm,
            }}
          />
          <button
            onClick={handleSend}
            style={{
              width: 36,
              height: 36,
              borderRadius: T.radiusSm,
              background: T.accent,
              border: "none",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

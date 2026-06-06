// features/chat/components/ChatInput.tsx

"use client";

import { useRef, useEffect } from "react";
import { Paperclip, Smile, Send, X, FileText, WifiOff } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { T } from "../design/tokens";
import { Message } from "../types/message";

interface ChatInputProps {
  messageInput: string;
  setMessageInput: (v: string) => void;
  replyingTo: Message | null;
  setReplyingTo: (msg: Message | null) => void;
  pendingFiles: File[];
  setPendingFiles: (fn: (prev: File[]) => File[]) => void;
  wsState: string;
  isReady: () => boolean;
  sending: boolean;
  onSend: () => void;
  onGalleryOpen: (
    items: Array<{ url: string; type: string; name: string }>,
    index: number,
  ) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (v: boolean) => void;
  handleEmojiClick: (emojiData: any) => void;
  onTyping: () => void;
}

export function ChatInput({
  messageInput,
  setMessageInput,
  replyingTo,
  setReplyingTo,
  pendingFiles,
  setPendingFiles,
  wsState,
  isReady,
  sending,
  onSend,
  onGalleryOpen,
  showEmojiPicker,
  setShowEmojiPicker,
  handleEmojiClick,
  onTyping,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiRef.current &&
        !emojiRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker, setShowEmojiPicker]);

  return (
    <>
      {/* Disconnected State */}
      {wsState !== "connected" && (
        <div
          style={{
            padding: "8px 20px",
            background: "rgba(239,68,68,0.08)",
            borderBottom: `1px solid ${T.dangerHover}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: T.fontSizeSm,
            color: T.danger,
          }}
        >
          <WifiOff size={14} /> Reconnecting...
        </div>
      )}

      <div
        style={{
          position: "relative",
          padding: "12px 20px",
          borderTop: `1px solid ${T.border}`,
          background: T.bgInput,
          flexShrink: 0,
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov,.pdf,.txt,.zip"
          style={{ display: "none" }}
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              setPendingFiles((prev) => {
                const combined = [...prev, ...files];
                return combined.slice(0, 20);
              });
            }
            e.target.value = "";
          }}
        />

        {/* Reply Bar */}
        {replyingTo && (
          <div
            className="reply-bar"
            style={{
              display: "flex",
              alignItems: "stretch",
              marginBottom: 8,
              borderRadius: T.radiusSm,
              background: T.accentSubtle,
              overflow: "hidden",
            }}
          >
            <div style={{ width: 2, flexShrink: 0, background: T.accent }} />
            <div
              style={{
                flex: 1,
                padding: "6px 10px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
                <div
                  style={{
                    fontSize: T.fontSizeXs + 1,
                    fontWeight: 600,
                    color: T.accentHover,
                    marginBottom: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {replyingTo.sender?.username || "User"}
                </div>
                <div
                  style={{
                    fontSize: T.fontSizeSm,
                    color: T.textMuted,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {replyingTo.is_deleted
                    ? "[Deleted]"
                    : replyingTo.content?.substring(0, 60) || "📎 Media"}
                </div>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.textFaint,
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  transition: "color 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = T.textSecondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = T.textFaint;
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* File Preview Strip */}
        {pendingFiles.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              padding: "8px 0",
              marginBottom: 4,
            }}
          >
            {pendingFiles.map((file, i) => {
              const isImage = file.type.startsWith("image/");
              const isVideo = file.type.startsWith("video/");
              const previewUrl = URL.createObjectURL(file);
              const isMedia = isImage || isVideo;

              return (
                <div
                  key={i}
                  onClick={() => {
                    if (isMedia) {
                      const mediaFiles = pendingFiles.filter(
                        (f) =>
                          f.type.startsWith("image/") ||
                          f.type.startsWith("video/"),
                      );
                      const items = mediaFiles.map((f) => ({
                        url: URL.createObjectURL(f),
                        type: f.type,
                        name: f.name,
                      }));
                      onGalleryOpen(items, mediaFiles.indexOf(file));
                    }
                  }}
                  style={{
                    position: "relative",
                    width: 64,
                    height: 64,
                    borderRadius: T.radiusSm,
                    overflow: "hidden",
                    flexShrink: 0,
                    background: T.bgInputField,
                    border: `1px solid ${T.border}`,
                    cursor: isMedia ? "pointer" : "default",
                  }}
                >
                  {isImage && (
                    <img
                      src={previewUrl}
                      alt="preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  {isVideo && (
                    <video
                      src={previewUrl}
                      muted
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  {!isImage && !isVideo && (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: T.textMuted,
                      }}
                    >
                      <FileText size={20} />
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingFiles((prev) =>
                        prev.filter((_, idx) => idx !== i),
                      );
                    }}
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.65)",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = T.danger)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "rgba(0,0,0,0.65)")
                    }
                  >
                    <X size={10} />
                  </button>
                  {!isImage && !isVideo && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "rgba(0,0,0,0.7)",
                        padding: "2px 4px",
                        fontSize: 8,
                        color: T.textSecondary,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {file.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div
            ref={emojiRef}
            style={{
              position: "absolute",
              bottom: "70px",
              right: "20px",
              zIndex: 100,
              borderRadius: T.radiusMd,
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              border: `1px solid ${T.borderHover}`,
            }}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              autoFocusSearch={false}
              theme={Theme.DARK}
              skinTonesDisabled
              width={350}
              height={400}
            />
          </div>
        )}

        {/* Input Row */}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <button
            onClick={() => fileInputRef.current?.click()}
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
              transition: "all 0.1s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = T.bgHoverStrong;
              e.currentTarget.style.color = T.textSecondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = T.textMuted;
            }}
          >
            <Paperclip size={16} />
          </button>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            style={{
              width: 36,
              height: 36,
              borderRadius: T.radiusSm,
              background: showEmojiPicker ? T.bgHoverStrong : "transparent",
              border: "none",
              color: showEmojiPicker ? T.accentHover : T.textMuted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.1s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = T.bgHoverStrong;
              e.currentTarget.style.color = T.accentHover;
            }}
            onMouseLeave={(e) => {
              if (!showEmojiPicker) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = T.textMuted;
              }
            }}
          >
            <Smile size={16} />
          </button>
          <input
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              onTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                onSend();
                setShowEmojiPicker(false);
              }
            }}
            placeholder={
              replyingTo
                ? `Reply to ${replyingTo.sender?.username || "User"}...`
                : "Message..."
            }
            disabled={wsState !== "connected"}
            style={{
              flex: 1,
              padding: "9px 14px",
              borderRadius: T.radiusMd,
              border: `1px solid ${T.border}`,
              background: T.bgInputField,
              color: T.textPrimary,
              outline: "none",
              fontSize: T.fontSizeBase,
              opacity: wsState !== "connected" ? 0.5 : 1,
              transition: "border-color 0.12s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = T.borderFocus;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = T.border;
            }}
          />
          <button
            disabled={sending || (!isReady() && pendingFiles.length === 0)}
            onClick={onSend}
            style={{
              width: 36,
              height: 36,
              borderRadius: T.radiusSm,
              border: "none",
              background: T.accent,
              color: "#fff",
              cursor: !sending && isReady() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity:
                !sending && (isReady() || pendingFiles.length > 0) ? 1 : 0.4,
              flexShrink: 0,
              transition: "background 0.12s, opacity 0.12s",
            }}
            onMouseEnter={(e) => {
              if (isReady()) e.currentTarget.style.background = T.accentHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = T.accent;
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </>
  );
}

// features/chat/components/ChatInput.tsx
"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import {
  Paperclip,
  Smile,
  Send,
  X,
  FileText,
  WifiOff,
  Mic,
  Trash2,
  Loader2,
  StopCircle,
} from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { T } from "../design/tokens";
import { Message } from "../types/message";
import Avatar from "@/components/Avatar";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { AudioPlayer } from "./AudioPlayer";

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
  onSendVoice: (file: File) => void;
  onGalleryOpen: (
    items: Array<{ url: string; type: string; name: string }>,
    index: number,
  ) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (v: boolean) => void;
  handleEmojiClick: (emojiData: any) => void;
  onTyping: () => void;
  isDMPending?: boolean;
  isDMReceiver?: boolean;
  onAcceptDM?: () => void;
  onBlockDM?: () => void;
  workspaceUsers?: Array<{ id: number; username: string; full_name: string }>;
  isDisabled?: boolean;
  isTemp?: boolean;
}

export function ChatInput({
  messageInput,
  setMessageInput,
  replyingTo,
  setReplyingTo,
  pendingFiles,
  setPendingFiles,
  wsState, isReady, sending, onSend, onSendVoice, onGalleryOpen, showEmojiPicker, setShowEmojiPicker,
  handleEmojiClick,
  onTyping,
  isDMPending = false,
  isDMReceiver = false,
  onAcceptDM,
  onBlockDM,
  workspaceUsers = [],
  isDisabled = false,
  isTemp = false,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  const handleVoiceSend = (file: File) => {
    // Bypass the file attachment UI entirely and upload instantly
    onSendVoice(file);
  };

  const {
    status,
    recordingTime,
    previewUrl,
    startRecording,
    stopRecording,
    cancelRecording,
    sendRecording,
    formatTime,
  } = useVoiceRecorder(handleVoiceSend);

  const filteredUsers = useMemo(() => {
    if (!showMentions) return [];
    return workspaceUsers
      .filter(
        (u) =>
          u.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
          u.full_name.toLowerCase().includes(mentionQuery.toLowerCase()),
      )
      .sort((a, b) => a.username.localeCompare(b.username))
      .slice(0, 5);
  }, [showMentions, mentionQuery, workspaceUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessageInput(val);
    onTyping();
    const cursorPos = e.target.selectionStart ?? 0;
    const textBeforeCursor = val.substring(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setShowMentions(true);
      setMentionQuery(atMatch[1]);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (user: { username: string }) => {
    const cursorPos = inputRef.current?.selectionStart || messageInput.length;
    const textBeforeCursor = messageInput.substring(0, cursorPos);
    const textAfterCursor = messageInput.substring(cursorPos);
    const mentionStartIndex = textBeforeCursor.lastIndexOf("@");
    const newVal =
      textBeforeCursor.substring(0, mentionStartIndex) +
      `@${user.username} ` +
      textAfterCursor;
    setMessageInput(newVal);
    setShowMentions(false);
    setTimeout(() => {
      if (inputRef.current) {
        const newPos = mentionStartIndex + user.username.length + 2;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiRef.current &&
        !emojiRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker, setShowEmojiPicker]);

  return (
    <>
      {/* Removed WebSocket "Reconnecting..." banner to prevent UI blocking */}

      <div
        style={{
          position: "relative",
          padding: "12px 20px",
          borderTop: `1px solid ${T.border}`,
          background: T.bgSecondary,
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
            if (files.length > 0)
              setPendingFiles((prev) => [...prev, ...files].slice(0, 20));
            e.target.value = "";
          }}
        />

        {isDMPending && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              marginBottom: 8,
              borderRadius: T.radiusSm,
              background: T.accentSubtle,
              border: `1px solid ${T.accent}`,
            }}
          >
            <span style={{ fontSize: T.fontSizeSm, color: T.textSecondary }}>
              {isDMReceiver
                ? "You haven't accepted this message request yet."
                : "Request sent. Waiting for acceptance."}
            </span>
            {isDMReceiver ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={onBlockDM}
                  style={{
                    background: "transparent",
                    border: `1px solid ${T.danger}`,
                    color: T.danger,
                    padding: "5px 12px",
                    borderRadius: T.radiusXs,
                    fontSize: T.fontSizeXs,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Block
                </button>
                <button
                  onClick={onAcceptDM}
                  style={{
                    background: T.accent,
                    border: "none",
                    color: "#fff",
                    padding: "5px 12px",
                    borderRadius: T.radiusXs,
                    fontSize: T.fontSizeXs,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Accept
                </button>
              </div>
            ) : (
              <span
                style={{
                  fontSize: T.fontSizeXs,
                  color: T.textMuted,
                  fontStyle: "italic",
                }}
              >
                Pending
              </span>
            )}
          </div>
        )}

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
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

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
                      onGalleryOpen(
                        mediaFiles.map((f) => ({
                          url: URL.createObjectURL(f),
                          type: f.type,
                          name: f.name,
                        })),
                        mediaFiles.indexOf(file),
                      );
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
                    }}
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

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

        {/* Voice Recording / Preview UI */}
        {status !== "idle" ? (
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              padding: "8px 12px",
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: T.radiusMd,
            }}
          >
            {status === "uploading" ? (
              <Loader2
                size={20}
                style={{
                  color: T.accent,
                  animation: "spin 1s linear infinite",
                }}
              />
            ) : status === "recording" ? (
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: T.danger,
                  animation: "pulse 1.5s infinite",
                }}
              />
            ) : null}

            {status === "uploading" ? (
              <span
                style={{
                  color: T.textSecondary,
                  fontSize: T.fontSizeBase,
                  flex: 1,
                }}
              >
                Uploading voice note...
              </span>
            ) : status === "recording" ? (
              <span
                style={{
                  color: T.textSecondary,
                  fontSize: T.fontSizeBase,
                  flex: 1,
                }}
              >
                Recording... {formatTime(recordingTime)}
              </span>
            ) : status === "preview" && previewUrl ? (
              <div style={{ flex: 1, minWidth: 0 }}>
                <AudioPlayer src={previewUrl} mine={true} />
              </div>
            ) : null}

            {status !== "uploading" && (
              <>
                {status === "recording" ? (
                  <button
                    onClick={stopRecording}
                    style={{
                      background: T.accent,
                      border: "none",
                      color: "#fff",
                      borderRadius: "50%",
                      width: 36,
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    title="Stop"
                  >
                    <StopCircle size={18} />
                  </button>
                ) : status === "preview" ? (
                  <button
                    onClick={sendRecording}
                    style={{
                      background: T.accent,
                      border: "none",
                      color: "#fff",
                      borderRadius: "50%",
                      width: 36,
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    title="Send"
                  >
                    <Send size={18} />
                  </button>
                ) : null}

                <button
                  onClick={cancelRecording}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: T.textMuted,
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Cancel"
                >
                  <Trash2 size={20} />
                </button>
              </>
            )}
          </div>
        ) : (
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
                flexShrink: 0,
              }}
            >
              <Paperclip size={16} />
            </button>
            <button
              onClick={startRecording}
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
                flexShrink: 0,
              }}
            >
              <Mic size={18} />
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
              }}
            >
              <Smile size={16} />
            </button>

            <input
              ref={inputRef}
              value={messageInput}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  onSend();
                  setShowEmojiPicker(false);
                }
              }}
              placeholder={
                isDisabled
                  ? "Waiting for acceptance..."
                  : replyingTo
                    ? `Reply to ${replyingTo.sender?.username || "User"}...`
                    : "Message..."
              }
              disabled={
                (isDMPending && isDMReceiver) ||
                isDisabled
              }
              style={{
                flex: 1,
                padding: "9px 14px",
                borderRadius: T.radiusMd,
                border: `1px solid ${T.border}`,
                background: T.bgInputField,
                color: T.textPrimary,
                outline: "none",
                fontSize: T.fontSizeBase,
                opacity: isDisabled ? 0.5 : 1,
                cursor: isDisabled ? "not-allowed" : "text",
              }}
            />

            {showMentions && filteredUsers.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  bottom: "60px",
                  left: "80px",
                  width: 260,
                  background: T.bgMenu,
                  border: `1px solid ${T.borderHover}`,
                  borderRadius: T.radiusMd,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  zIndex: 100,
                  overflow: "hidden",
                  padding: "4px 0",
                }}
              >
                <div
                  style={{
                    padding: "4px 12px",
                    fontSize: 10,
                    color: T.textMuted,
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Members
                </div>
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertMention(user);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "8px 12px",
                      background: "transparent",
                      border: "none",
                      color: T.textPrimary,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <Avatar user={user} size="xs" />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {user.full_name || user.username}
                      </div>
                      <div style={{ fontSize: 11, color: T.textMuted }}>
                        @{user.username}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              disabled={
                sending ||
                (!isTemp && !isReady() && pendingFiles.length === 0) ||
                isDisabled
              }
              onClick={onSend}
              style={{
                width: 36,
                height: 36,
                borderRadius: T.radiusSm,
                border: "none",
                background:
                  sending ||
                  (!isTemp && !isReady() && pendingFiles.length === 0) ||
                  isDisabled
                    ? "#475569"
                    : T.accent,
                color: "#fff",
                cursor:
                  !sending &&
                  (isTemp || isReady() || pendingFiles.length > 0) &&
                  !isDisabled
                    ? "pointer"
                    : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity:
                  sending ||
                  (!isTemp && !isReady() && pendingFiles.length === 0) ||
                  isDisabled
                    ? 0.6
                    : 1,
                flexShrink: 0,
              }}
            >
              <Send size={15} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

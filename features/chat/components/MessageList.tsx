// features/chat/components/MessageList.tsx

"use client";

import { RefObject } from "react";
import {
  Send,
  Loader2,
  ArrowDown,
  Reply,
  Copy,
  Pencil,
  Trash2,
  CheckCircle2,
  Check,
  MoreVertical,
  AlertCircle,
  FileText,
  Download,
} from "lucide-react";
import { T } from "../design/tokens";
import { Message, Attachment } from "../types/message";
import { Channel } from "../types/channel";
import { isGrouped } from "../utils/grouping";
import { renderMessageContent, resolveFileUrl } from "../utils/rendering";

interface MessageListProps {
  selectedChannel: Channel | null;
  messages: Record<number, Message[]>;
  pagination: Record<number, { nextOffset: number; hasOlder: boolean }>;
  myUserId: number;
  isLoadingOlder: boolean;
  isAtBottom: boolean;
  isSelectMode: boolean;
  selectedMsgIds: Set<number>;
  activeMenuMsgId: number | null;
  copiedMsgId: number | null;
  bottomRef: RefObject<HTMLDivElement | null>;
  messagesContainerRef: RefObject<HTMLDivElement | null>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onScrollToBottom: () => void;
  onScrollToMessage: (messageId: number) => void;
  onToggleMessageSelection: (msgId: number) => void;
  onSetActiveMenuMsgId: (id: number | null) => void;
  onReply: (msg: Message) => void;
  onCopy: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  onEnterSelectMode: (msgId: number) => void;
  onDeleteForMe: (msgId: number) => void;
  onDeleteForEveryone: (msgId: number) => void;
  setDeleteModalMsgId: (id: number | null) => void;
  // ADDED: Gallery opening
  onGalleryOpen: (
    items: Array<{ url: string; type: string; name: string }>,
    index: number,
  ) => void;
  // Reactions & Read Receipts
  onToggleReaction: (messageId: number, emoji: string) => void;
  onMarkRead: (messageId: number) => void;
}

function renderAttachments(
  msg: Message,
  displayText: string,
  onGalleryOpen: (
    items: Array<{ url: string; type: string; name: string }>,
    index: number,
  ) => void,
) {
  if (!msg.attachments || msg.attachments.length === 0) return null;

  const mediaAtts = msg.attachments.filter(
    (att) =>
      att.file_type?.startsWith("image/") ||
      att.file_type?.startsWith("video/"),
  );
  const fileAtts = msg.attachments.filter((att) => !mediaAtts.includes(att));

  return (
    <>
      {fileAtts.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginTop: displayText ? 8 : 0,
          }}
        >
          {fileAtts.map((att) => (
            <div
              key={att.id}
              style={{
                background: T.borderSubtle,
                borderRadius: T.radiusSm,
                padding: 6,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "background 0.12s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: T.radiusXs,
                  background: T.accentMuted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FileText size={14} style={{ color: T.accentHover }} />
              </div>
              <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
                <div
                  style={{
                    fontSize: T.fontSizeSm,
                    color: T.textPrimary,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {att.original_filename}
                </div>
                <div
                  style={{
                    fontSize: T.fontSizeXs,
                    color: T.textMuted,
                    marginTop: 1,
                  }}
                >
                  {(att.file_size / 1024).toFixed(1)} KB
                </div>
              </div>
              <a
                href={resolveFileUrl(att.file_url)}
                download={att.original_filename}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  color: T.textMuted,
                  padding: 6,
                  borderRadius: T.radiusSm,
                  transition: "color 0.12s",
                  display: "flex",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = T.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = T.textMuted;
                }}
              >
                <Download size={14} />
              </a>
            </div>
          ))}
        </div>
      )}
      {mediaAtts.length > 0 && (
        <div
          style={{
            marginTop: displayText || fileAtts.length > 0 ? 6 : 0,
            display: "grid",
            gridTemplateColumns: mediaAtts.length === 1 ? "1fr" : "1fr 1fr",
            gap: 3,
            maxWidth: T.mediaGridMax,
            borderRadius: T.radiusXs,
            overflow: "hidden",
          }}
        >
          {mediaAtts.slice(0, mediaAtts.length === 3 ? 3 : 4).map((att, i) => {
            const fileUrl = resolveFileUrl(att.file_url);
            const isVideo = att.file_type?.startsWith("video/");
            const isLastAndHasMore = mediaAtts.length > 4 && i === 3;
            return (
              <div
                key={att.id}
                style={{
                  position: "relative",
                  cursor: "pointer",
                  gridColumn:
                    mediaAtts.length === 3 && i === 0 ? "1 / -1" : undefined,
                  overflow: "hidden",
                }}
                onClick={() => {
                  const items = mediaAtts.map((a) => ({
                    url: resolveFileUrl(a.file_url),
                    type: a.file_type || "",
                    name: a.original_filename || "",
                  }));
                  onGalleryOpen(items, i);
                }}
              >
                {isVideo && fileUrl ? (
                  <div style={{ position: "relative" }}>
                    <video
                      src={fileUrl}
                      style={{
                        width: "100%",
                        height: T.imageHeight,
                        objectFit: "cover",
                        display: "block",
                        borderRadius: T.radiusXs,
                      }}
                      muted
                    />
                    {/* Video play icon overlay */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0,0,0,0.25)",
                        borderRadius: T.radiusXs,
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          width="14"
                          height="16"
                          viewBox="0 0 14 16"
                          fill="none"
                        >
                          <path d="M2 1.5L12 8L2 14.5V1.5Z" fill="white" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : fileUrl ? (
                  <img
                    src={fileUrl}
                    alt={att.original_filename}
                    style={{
                      width: "100%",
                      height: T.imageHeight,
                      objectFit: "cover",
                      display: "block",
                      borderRadius: T.radiusXs,
                    }}
                  />
                ) : null}
                {isLastAndHasMore && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.55)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 20,
                      fontWeight: 600,
                    }}
                  >
                    +{mediaAtts.length - 4}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function isEmojiOnly(text: string) {
  if (!text) return false;
  const noSpaces = text.replace(/\s/g, "");
  if (noSpaces.length === 0 || noSpaces.length > 8) return false;
  return /^[\p{Extended_Pictographic}]+$/u.test(noSpaces);
}

export function MessageList({
  selectedChannel,
  messages,
  pagination,
  myUserId,
  isLoadingOlder,
  isAtBottom,
  isSelectMode,
  selectedMsgIds,
  activeMenuMsgId,
  copiedMsgId,
  bottomRef,
  messagesContainerRef,
  onScroll,
  onScrollToBottom,
  onScrollToMessage,
  onToggleMessageSelection,
  onSetActiveMenuMsgId,
  onReply,
  onCopy,
  onEdit,
  onEnterSelectMode,
  setDeleteModalMsgId,
  onGalleryOpen,
  onToggleReaction,
  onMarkRead,
}: MessageListProps) {
  const channelMessages = selectedChannel
    ? messages[selectedChannel.id] || []
    : [];

  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      <div
        ref={messagesContainerRef}
        onScroll={onScroll}
        style={{
          width: "100%",
          height: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: T.chatMaxWidth,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {/* Load older indicator */}
          {selectedChannel && pagination[selectedChannel.id]?.hasOlder && (
            <div
              style={{
                textAlign: "center",
                padding: "12px 0",
                color: T.textMuted,
                fontSize: T.fontSizeSm,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {isLoadingOlder ? (
                <>
                  <Loader2
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />{" "}
                  Loading...
                </>
              ) : (
                "↑ Scroll up for older messages"
              )}
            </div>
          )}

          {channelMessages.length > 0
            ? channelMessages.map((msg, index) => {
                const allMsgs = channelMessages;
                const mine = msg.sender?.id === myUserId;
                const displayName = msg.sender?.username || "User";
                const displayText = msg.is_deleted
                  ? "[Message deleted]"
                  : msg.content;
                const showMenu = !msg.is_deleted && msg._status !== "pending";
                const grouped = isGrouped(msg, index, allMsgs);

                let resolvedReplyTo: any = msg.reply_to;
                if (
                  msg.reply_to != null &&
                  typeof (msg.reply_to as any) !== "object"
                ) {
                  const replyId = msg.reply_to as any as number;
                  const originalMsg = allMsgs?.find((m) => m.id === replyId);
                  if (originalMsg) {
                    resolvedReplyTo = {
                      id: originalMsg.id,
                      content: originalMsg.content,
                      sender: originalMsg.sender,
                      sender_name: originalMsg.sender_name,
                      is_deleted: originalMsg.is_deleted,
                      attachments: originalMsg.attachments,
                    };
                  } else {
                    resolvedReplyTo = null;
                  }
                }

                const isSelected = selectedMsgIds.has(msg.id);

                return (
                  <div
                    key={msg.id}
                    id={`msg-${msg.id}`}
                    className="message-row"
                    onClick={() => {
                      if (isSelectMode) onToggleMessageSelection(msg.id);
                    }}
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      gap: 0,
                      marginTop: grouped ? 2 : 14,
                      paddingTop: grouped ? 0 : 2,
                      background: isSelected ? T.accentMuted : "transparent",
                      cursor: isSelectMode ? "pointer" : "default",
                      transition: "background 0.1s",
                    }}
                  >
                    {/* Select Mode Checkbox */}
                    {isSelectMode && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 36,
                          flexShrink: 0,
                          paddingTop: grouped ? 0 : 2,
                        }}
                      >
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            border: isSelected
                              ? "none"
                              : `2px solid ${T.textMuted}`,
                            background: isSelected ? T.accent : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.1s",
                          }}
                        >
                          {isSelected && <Check size={12} color="#fff" />}
                        </div>
                      </div>
                    )}

                    {/* Avatar */}
                    {!mine && (
                      <div
                        style={{
                          width: 36,
                          flexShrink: 0,
                          display: "flex",
                          justifyContent: "center",
                          paddingTop: grouped ? 0 : 2,
                        }}
                      >
                        {!grouped ? (
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg,#4f46e5,#7c3aed)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#fff",
                            }}
                          >
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        ) : null}
                      </div>
                    )}
                    {mine && <div style={{ width: 36, flexShrink: 0 }} />}

                    <div
                      style={{
                        maxWidth: T.bubbleMaxWidth,
                        flex: "0 1 auto",
                        minWidth: 80,
                        marginLeft: mine ? "auto" : 0,
                      }}
                    >
                      {/* Sender name */}
                      {!mine && !grouped && (
                        <div
                          style={{
                            fontSize: T.fontSizeXs + 1,
                            fontWeight: 600,
                            color: T.accentHover,
                            marginBottom: 3,
                            paddingLeft: 2,
                          }}
                        >
                          {displayName}
                        </div>
                      )}

                      {/* Bubble + Menu row */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 2,
                          flexDirection: mine ? "row-reverse" : "row",
                          marginBottom:
                            msg.reactions && msg.reactions.length > 0 ? 28 : 0,
                        }}
                      >
                        {/* Bubble */}
                        <div
                          style={{
                            padding:
                              !displayText &&
                              msg.attachments?.some(
                                (a) =>
                                  a.file_type?.startsWith("image/") ||
                                  a.file_type?.startsWith("video/"),
                              )
                                ? "4px"
                                : grouped
                                  ? "6px 12px"
                                  : "8px 12px",
                            borderRadius: mine
                              ? grouped
                                ? "12px 12px 4px 12px"
                                : "14px 14px 4px 14px"
                              : grouped
                                ? "12px 12px 12px 4px"
                                : "14px 14px 4px 14px",
                            background: mine ? T.bgBubbleMine : T.bgBubbleOther,
                            position: "relative",
                            overflow: "visible",
                          }}
                        >
                          {/* Reply Preview */}
                          {resolvedReplyTo &&
                            typeof resolvedReplyTo === "object" && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (resolvedReplyTo.id)
                                    onScrollToMessage(resolvedReplyTo.id);
                                }}
                                style={{
                                  background: mine
                                    ? "rgba(0,0,0,0.15)"
                                    : T.accentSubtle,
                                  borderLeft: mine
                                    ? "2px solid rgba(255,255,255,0.3)"
                                    : `2px solid ${T.accent}`,
                                  borderRadius: T.radiusXs,
                                  padding: "4px 8px",
                                  marginBottom: 6,
                                  cursor: "pointer",
                                  overflow: "hidden",
                                  maxWidth: "100%",
                                  display: "flex",
                                  gap: 8,
                                  alignItems: "center",
                                  transition: "background 0.1s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = mine
                                    ? "rgba(0,0,0,0.2)"
                                    : "rgba(99,102,241,0.1)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = mine
                                    ? "rgba(0,0,0,0.14)"
                                    : T.accentSubtle;
                                }}
                              >
                                {resolvedReplyTo.attachments?.length > 0 &&
                                  resolvedReplyTo.attachments[0].file_type?.startsWith(
                                    "image/",
                                  ) && (
                                    <div
                                      style={{
                                        flexShrink: 0,
                                        width: 32,
                                        height: 32,
                                        borderRadius: 3,
                                        overflow: "hidden",
                                      }}
                                    >
                                      <img
                                        src={resolveFileUrl(
                                          resolvedReplyTo.attachments[0]
                                            .file_url,
                                        )}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                        }}
                                        alt=""
                                      />
                                    </div>
                                  )}
                                {resolvedReplyTo.attachments?.length > 0 &&
                                  resolvedReplyTo.attachments[0].file_type?.startsWith(
                                    "video/",
                                  ) && (
                                    <div
                                      style={{
                                        flexShrink: 0,
                                        width: 32,
                                        height: 32,
                                        borderRadius: 3,
                                        overflow: "hidden",
                                        background: "rgba(0,0,0,0.3)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 11,
                                      }}
                                    >
                                      🎬
                                    </div>
                                  )}
                                <div
                                  style={{
                                    flex: 1,
                                    minWidth: 0,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: mine
                                        ? "rgba(255,255,255,0.65)"
                                        : T.accentHover,
                                      marginBottom: 2,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {resolvedReplyTo.sender?.username ||
                                      resolvedReplyTo.sender_name ||
                                      "User"}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      lineHeight: 1.35,
                                      color: mine
                                        ? "rgba(255,255,255,0.45)"
                                        : T.textMuted,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      overflowWrap: "anywhere",
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    {resolvedReplyTo.is_deleted
                                      ? "[Deleted]"
                                      : resolvedReplyTo.content?.substring(
                                          0,
                                          80,
                                        ) || "📎 Media"}
                                  </div>
                                </div>
                              </div>
                            )}

                          {displayText && (
                            <div
                              style={{
                                fontSize: isEmojiOnly(displayText)
                                  ? "2.5rem"
                                  : T.fontSizeBase,
                                lineHeight: isEmojiOnly(displayText)
                                  ? 1.2
                                  : 1.45,
                                wordBreak: "break-word",
                                overflowWrap: "anywhere",
                                hyphens: "auto",
                                color: msg.is_deleted
                                  ? T.textMuted
                                  : T.textPrimary,
                                fontStyle: msg.is_deleted ? "italic" : "normal",
                                minWidth: 0,
                              }}
                            >
                              {msg.is_deleted
                                ? displayText
                                : renderMessageContent(displayText, mine)}
                            </div>
                          )}

                          {renderAttachments(msg, displayText, onGalleryOpen)}

                          {/* Upload progress */}
                          {msg._status === "pending" &&
                            msg._progress !== undefined &&
                            msg._progress < 100 && (
                              <div
                                style={{
                                  marginTop: 6,
                                  background: "rgba(0,0,0,0.2)",
                                  borderRadius: 3,
                                  height: 3,
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${msg._progress}%`,
                                    height: "100%",
                                    background: T.accentHover,
                                    borderRadius: 3,
                                    transition: "width 0.2s",
                                  }}
                                />
                              </div>
                            )}
                          {msg._status === "failed" && (
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: T.fontSizeXs + 1,
                                color: T.danger,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <AlertCircle size={12} /> Upload failed
                            </div>
                          )}

                          {/* Metadata Row */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: mine ? "flex-end" : "flex-start",
                              gap: 6,
                              marginTop: 4,
                            }}
                          >
                            {msg.is_edited && !msg.is_deleted && (
                              <span
                                style={{
                                  fontSize: T.fontSizeXs,
                                  color: T.textMeta,
                                  fontWeight: 400,
                                }}
                              >
                                edited
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: T.fontSizeXs,
                                color: T.textMeta,
                              }}
                            >
                              {msg.created_time}
                            </span>
                            {/* Read Receipts (Double Ticks) */}
                            {mine && !msg.is_deleted && (
                              <span
                                style={{
                                  fontSize: 12,
                                  color:
                                    msg.reads && msg.reads.length > 0
                                      ? "#53bdeb"
                                      : T.textMeta,
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                {msg.reads && msg.reads.length > 0 ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>

                          {/* Reactions Display — WhatsApp/Messenger floating pill */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div
                              style={{
                                position: "absolute",
                                bottom: -16,
                                [mine ? "right" : "left"]: 4,
                                display: "flex",
                                gap: 3,
                                zIndex: 10,
                              }}
                            >
                              {Object.values(
                                msg.reactions.reduce((acc: any, r: any) => {
                                  if (!acc[r.emoji])
                                    acc[r.emoji] = {
                                      emoji: r.emoji,
                                      count: 0,
                                      reacted: false,
                                    };
                                  acc[r.emoji].count++;
                                  if (r.user?.id === myUserId)
                                    acc[r.emoji].reacted = true;
                                  return acc;
                                }, {}),
                              ).map((group: any) => (
                                <button
                                  key={group.emoji}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleReaction(msg.id, group.emoji);
                                  }}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 4,
                                    minWidth: 28,
                                    height: 24,
                                    padding: "0 8px",
                                    borderRadius: 12,
                                    border: "none",
                                    background: group.reacted
                                      ? "rgba(99,102,241,0.35)"
                                      : "rgba(40,42,54,0.95)",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                    boxShadow: group.reacted
                                      ? "0 0 0 1.5px rgba(99,102,241,0.5), 0 2px 8px rgba(0,0,0,0.3)"
                                      : "0 0 0 1px rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.3)",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform =
                                      "scale(1.12)";
                                    e.currentTarget.style.boxShadow =
                                      group.reacted
                                        ? "0 0 0 1.5px rgba(99,102,241,0.7), 0 4px 12px rgba(0,0,0,0.4)"
                                        : "0 0 0 1px rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.4)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform =
                                      "scale(1)";
                                    e.currentTarget.style.boxShadow =
                                      group.reacted
                                        ? "0 0 0 1.5px rgba(99,102,241,0.5), 0 2px 8px rgba(0,0,0,0.3)"
                                        : "0 0 0 1px rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.3)";
                                  }}
                                >
                                  <span style={{ fontSize: 14, lineHeight: 1 }}>
                                    {group.emoji}
                                  </span>
                                  {group.count > 1 && (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: group.reacted
                                          ? "#a5b4fc"
                                          : "rgba(255,255,255,0.6)",
                                        lineHeight: 1,
                                      }}
                                    >
                                      {group.count}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Menu trigger */}
                        {showMenu && (
                          <div
                            className="msg-menu-trigger"
                            style={{
                              opacity: 0,
                              pointerEvents: "none",
                              transition: "opacity 0.12s",
                              position: "relative",
                              flexShrink: 0,
                              alignSelf: "center",
                            }}
                          >
                            <button
                              className="msg-menu-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSetActiveMenuMsgId(
                                  activeMenuMsgId === msg.id ? null : msg.id,
                                );
                              }}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: T.radiusSm,
                                background: "transparent",
                                border: "none",
                                color: T.textMuted,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.1s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  T.bgHoverStrong;
                                e.currentTarget.style.color = T.textSecondary;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "transparent";
                                e.currentTarget.style.color = T.textMuted;
                              }}
                            >
                              <MoreVertical size={14} />
                            </button>

                            {activeMenuMsgId === msg.id && (
                              <div
                                className="msg-dropdown"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: "absolute",
                                  top: "auto",
                                  bottom: 30,
                                  right: mine ? -4 : "auto",
                                  left: mine ? "auto" : 0,
                                  background: T.bgMenu,
                                  border: `1px solid ${T.borderHover}`,
                                  borderRadius: T.radiusMd,
                                  padding: `${T.gapXs} 0`,
                                  minWidth: 160,
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                                  zIndex: 50,
                                  overflow: "hidden",
                                }}
                              >
                                {[
                                  {
                                    icon: <span>👍</span>,
                                    label: "Like",
                                    action: () =>
                                      onToggleReaction(msg.id, "👍"),
                                    danger: false,
                                  },
                                  {
                                    icon: <span>❤️</span>,
                                    label: "Love",
                                    action: () =>
                                      onToggleReaction(msg.id, "❤️"),
                                    danger: false,
                                  },
                                  {
                                    icon: <span>😂</span>,
                                    label: "Laugh",
                                    action: () =>
                                      onToggleReaction(msg.id, "😂"),
                                    danger: false,
                                  },
                                  {
                                    icon: <Reply size={14} />,
                                    label: "Reply",
                                    action: () => onReply(msg),
                                    danger: false,
                                  },
                                  {
                                    icon: <CheckCircle2 size={14} />,
                                    label: "Select",
                                    action: () => onEnterSelectMode(msg.id),
                                    danger: false,
                                  },
                                  {
                                    icon:
                                      copiedMsgId === msg.id ? (
                                        <Check size={14} />
                                      ) : (
                                        <Copy size={14} />
                                      ),
                                    label:
                                      copiedMsgId === msg.id
                                        ? "Copied"
                                        : "Copy",
                                    action: () => onCopy(msg),
                                    danger: false,
                                    color:
                                      copiedMsgId === msg.id
                                        ? T.success
                                        : undefined,
                                  },
                                  ...(mine
                                    ? [
                                        {
                                          icon: <Pencil size={14} />,
                                          label: "Edit",
                                          action: () => onEdit(msg),
                                          danger: false,
                                        },
                                      ]
                                    : []),
                                  ...(mine
                                    ? [
                                        {
                                          icon: <Trash2 size={14} />,
                                          label: "Delete",
                                          action: () => {
                                            onSetActiveMenuMsgId(null);
                                            setDeleteModalMsgId(msg.id);
                                          },
                                          danger: true,
                                        },
                                      ]
                                    : []),
                                ].map((item, i, arr) => {
                                  const isLast =
                                    i === arr.length - 1 && item.danger;
                                  return (
                                    <div key={i}>
                                      {isLast && (
                                        <div
                                          style={{
                                            height: 1,
                                            background: T.border,
                                            margin: "3px 0",
                                          }}
                                        />
                                      )}
                                      <button
                                        onClick={item.action}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 10,
                                          width: "100%",
                                          padding: "8px 14px",
                                          background: "transparent",
                                          border: "none",
                                          color: item.danger
                                            ? T.danger
                                            : item.color || T.textSecondary,
                                          cursor: "pointer",
                                          fontSize: T.fontSizeSm,
                                          fontFamily: "inherit",
                                          transition: "background 0.08s",
                                          fontWeight: 500,
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background =
                                            item.danger
                                              ? T.dangerHover
                                              : T.bgHoverStrong;
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background =
                                            "transparent";
                                        }}
                                      >
                                        {item.icon}
                                        <span>{item.label}</span>
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            : selectedChannel && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 60,
                    color: T.textMuted,
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: T.bgHoverStrong,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Send size={20} style={{ color: T.textFaint }} />
                  </div>
                  <div style={{ fontSize: T.fontSizeSm }}>No messages yet</div>
                  <div
                    style={{
                      fontSize: T.fontSizeXs + 1,
                      color: T.textFaint,
                    }}
                  >
                    Start the conversation
                  </div>
                </div>
              )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Scroll to bottom */}
      {!isAtBottom && (
        <button
          onClick={onScrollToBottom}
          style={{
            position: "absolute",
            bottom: 16,
            right: 24,
            height: 32,
            paddingLeft: 10,
            paddingRight: 10,
            borderRadius: 16,
            background: T.bgMenu,
            border: `1px solid ${T.borderHover}`,
            color: T.textSecondary,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: T.fontSizeSm,
            fontWeight: 500,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            zIndex: 10,
            transition: "all 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = T.bgHoverStrong;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = T.bgMenu;
          }}
        >
          <ArrowDown size={14} /> Down
        </button>
      )}
    </div>
  );
}

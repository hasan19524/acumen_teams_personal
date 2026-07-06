// features/chat/components/MessageList.tsx
"use client";

import { useState, RefObject } from "react";
import {
  Send,
  Loader2,
  ArrowDown,
  Reply,
  Copy,
  Pencil,
  CheckCircle2,
  Check,
  MoreVertical,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { T } from "../design/tokens";
import { Message } from "../types/message";
import { Channel } from "../types/channel";
import { isGrouped } from "../utils/grouping";
import { renderMessageContent } from "../utils/rendering";
import Avatar from "@/components/Avatar";
import { MessageAttachments } from "./MessageAttachments";

const formatDateSeparator = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return ""; // FIX: Prevent crash if date is invalid
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const isWithin30Min = (createdAt: string) => {
  const time = new Date(createdAt).getTime();
  if (isNaN(time)) return false; // FIX: Prevent crash
  return (Date.now() - time) / 60000 <= 30;
};
const isUnread = (msg: Message, myUserId: number) => {
  if (msg.sender?.id === myUserId || msg.is_deleted) return false;
  return !msg.reads?.some((r: any) => r.user?.id === myUserId);
};

const isEmojiOnly = (text: string) => {
  if (!text) return false;
  const noSpaces = text.replace(/\s/g, "");
  if (noSpaces.length === 0 || noSpaces.length > 8) return false;
  return /^[\p{Extended_Pictographic}]+$/u.test(noSpaces);
};

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
  setDeleteModalMsgId: (id: number | null) => void;
  onGalleryOpen: (
    items: Array<{ url: string; type: string; name: string }>,
    index: number,
  ) => void;
  onToggleReaction: (messageId: number, emoji: string) => void;
  typingUsers?: { id: number; username: string }[];
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
  typingUsers,
}: MessageListProps) {
  const channelMessages = selectedChannel
    ? messages[selectedChannel.id] || []
    : [];
  const [menuPos, setMenuPos] = useState<{ top?: string; bottom?: string }>({
    bottom: "100%",
  });

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
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
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
                const prevMsg = index > 0 ? allMsgs[index - 1] : null;
                const showDateSeparator =
                  !prevMsg ||
                  new Date(prevMsg.created_at || Date.now()).toDateString() !==
                    new Date(msg.created_at || Date.now()).toDateString();
                const isLastMine =
                  mine &&
                  (index === allMsgs.length - 1 ||
                    allMsgs[index + 1]?.sender?.id !== myUserId);
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
                const currentUnread = isUnread(msg, myUserId);
                const prevMsgUnread = prevMsg
                  ? isUnread(prevMsg, myUserId)
                  : false;
                const showUnreadDivider = currentUnread && !prevMsgUnread;
                const hasMedia = msg.attachments?.some(
                  (a) =>
                    a.file_type?.startsWith("image/") ||
                    a.file_type?.startsWith("video/"),
                );

                return (
                  <div
                    key={msg.id}
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      animation: "msgFadeIn 0.2s ease-out",
                    }}
                  >
                    {showUnreadDivider && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          margin: "12px 0 6px",
                          width: "100%",
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: 1,
                            background: T.accent,
                            opacity: 0.5,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: T.accent,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Unread Messages
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: 1,
                            background: T.accent,
                            opacity: 0.5,
                          }}
                        />
                      </div>
                    )}
                    {showDateSeparator && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          margin: "12px 0 6px",
                          width: "100%",
                        }}
                      >
                        <div
                          style={{
                            background: T.bgHoverStrong,
                            padding: "4px 12px",
                            borderRadius: T.radiusMd,
                            fontSize: "11px",
                            color: T.textMuted,
                            fontWeight: 600,
                          }}
                        >
                          {formatDateSeparator(msg.created_at)}
                        </div>
                      </div>
                    )}

                    <div
                      id={`msg-${msg.id}`}
                      className="message-row"
                      onClick={() =>
                        isSelectMode && onToggleMessageSelection(msg.id)
                      }
                      onDoubleClick={(e) => {
                        if (!isSelectMode && !msg.is_deleted) {
                          e.stopPropagation();
                          onReply(msg);
                        }
                      }}
                      onContextMenu={(e) => {
                        if (!msg.is_deleted && msg._status !== "pending") {
                          e.preventDefault();
                          onSetActiveMenuMsgId(msg.id);
                        }
                      }}
                      style={{
                        display: "flex",
                        justifyContent: mine ? "flex-end" : "flex-start",
                        alignItems: "flex-end",
                        gap: T.gapSm,
                        marginTop: grouped ? 2 : 10,
                        cursor: isSelectMode ? "pointer" : "default",
                        background: isSelected ? T.accentMuted : "transparent",
                        borderRadius: T.radiusSm,
                        padding: "2px 4px",
                      }}
                    >
                      {isSelectMode && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 24,
                            flexShrink: 0,
                            paddingBottom: 4,
                          }}
                        >
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              border: isSelected
                                ? "none"
                                : `2px solid ${T.textMuted}`,
                              background: isSelected ? T.accent : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {isSelected && <Check size={12} color="#fff" />}
                          </div>
                        </div>
                      )}

                      {!mine && (
                        <div
                          style={{
                            width: 28,
                            flexShrink: 0,
                            display: "flex",
                            justifyContent: "center",
                            paddingBottom: 4,
                          }}
                        >
                          {!grouped ? (
                            <Avatar
                              user={msg.sender || selectedChannel?.dm_partner}
                              name={
                                msg.sender?.username ||
                                selectedChannel?.dm_partner?.username
                              }
                              size="chat"
                            />
                          ) : null}
                        </div>
                      )}
                      {mine && <div style={{ width: 28, flexShrink: 0 }} />}

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          maxWidth: "75%",
                          alignItems: mine ? "flex-end" : "flex-start",
                        }}
                      >
                        {!mine && !grouped && (
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: T.textSecondary,
                              marginLeft: 4,
                              marginBottom: 2,
                            }}
                          >
                            {displayName}
                          </div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: 4,
                            flexDirection: mine ? "row-reverse" : "row",
                          }}
                        >
                          <div
                            style={{
                              padding:
                                !displayText && hasMedia ? "0px" : "8px 12px",
                              borderRadius: mine
                                ? grouped
                                  ? "12px 12px 4px 12px"
                                  : "14px 14px 4px 14px"
                                : grouped
                                  ? "12px 12px 12px 4px"
                                  : "14px 14px 14px 4px",
                              background: mine ? T.accent : T.surface,
                              border: mine ? "none" : `1px solid ${T.border}`,
                              position: "relative",
                              overflow: "visible",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            }}
                          >
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
                                  }}
                                >
                                  <div style={{ flex: 1, minWidth: 0 }}>
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
                                    : 1.4,
                                  wordBreak: "break-word",
                                  overflowWrap: "anywhere",
                                  hyphens: "auto",
                                  color: msg.is_deleted
                                    ? T.textMuted
                                    : T.textPrimary,
                                  fontStyle: msg.is_deleted
                                    ? "italic"
                                    : "normal",
                                  minWidth: 0,
                                }}
                              >
                                {msg.is_deleted
                                  ? displayText
                                  : renderMessageContent(displayText, mine)}
                              </div>
                            )}

                            <MessageAttachments
                              msg={msg}
                              displayText={displayText}
                              onGalleryOpen={onGalleryOpen}
                              mine={mine}
                            />

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
                                  fontSize: 11,
                                  color: T.danger,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <AlertCircle size={12} /> Upload failed
                              </div>
                            )}

                            {hasMedia && !displayText ? (
                              <span
                                style={{
                                  position: "absolute",
                                  bottom: 6,
                                  right: 8,
                                  background: "rgba(0,0,0,0.6)",
                                  color: "#fff",
                                  fontSize: 10,
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  zIndex: 5,
                                }}
                              >
                                {new Date(msg.created_at || Date.now()).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                            ) : (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  alignItems: "center",
                                  gap: 4,
                                  marginTop: 2,
                                  fontSize: 10,
                                  color: mine
                                    ? "rgba(255,255,255,0.6)"
                                    : T.textMuted,
                                }}
                              >
                                {msg.is_edited && !msg.is_deleted && (
                                  <span style={{ fontStyle: "italic" }}>
                                    edited
                                  </span>
                                )}
                                <span>
                                  {new Date(msg.created_at || Date.now()).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </span>
                              </div>
                            )}

                            {msg.reactions && msg.reactions.length > 0 && (
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: -10,
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
                                      height: 22,
                                      padding: "0 8px",
                                      borderRadius: 12,
                                      border: "none",
                                      background: group.reacted
                                        ? "rgba(99,102,241,0.35)"
                                        : T.surfaceHover,
                                      cursor: "pointer",
                                      transition: "all 0.15s ease",
                                      boxShadow:
                                        "0 0 0 1px rgba(255,255,255,0.08), 0 2px 4px rgba(0,0,0,0.2)",
                                    }}
                                  >
                                    <span
                                      style={{ fontSize: 13, lineHeight: 1 }}
                                    >
                                      {group.emoji}
                                    </span>
                                    {group.count > 1 && (
                                      <span
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: T.textSecondary,
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
                                paddingBottom: 4,
                              }}
                            >
                              <button
                                className="msg-menu-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect =
                                    e.currentTarget.getBoundingClientRect();
                                  if (window.innerHeight - rect.bottom < 250) {
                                    setMenuPos({ bottom: "100%", top: "auto" });
                                  } else {
                                    setMenuPos({ top: "100%", bottom: "auto" });
                                  }
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
                              >
                                <MoreVertical size={14} />
                              </button>

                              {activeMenuMsgId === msg.id && (
                                <div
                                  className="msg-dropdown"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    position: "absolute",
                                    ...menuPos,
                                    marginTop: "4px",
                                    marginBottom: "4px",
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
                                    ...(mine && isWithin30Min(msg.created_at)
                                      ? [
                                          {
                                            icon: <Pencil size={14} />,
                                            label: "Edit",
                                            action: () => onEdit(msg),
                                            danger: false,
                                          },
                                        ]
                                      : []),
                                    {
                                      icon: <Trash2 size={14} />,
                                      label: "Delete",
                                      action: () => setDeleteModalMsgId(msg.id),
                                      danger: true,
                                    },
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

                        {mine &&
                          !msg.is_deleted &&
                          msg._status !== "pending" &&
                          isLastMine &&
                          msg.reads &&
                          msg.reads.length > 0 &&
                          (() => {
                            const otherRead =
                              msg.reads.find(
                                (r: any) => r.user?.id !== myUserId,
                              ) || msg.reads[0];
                            if (!otherRead || !otherRead.read_at) return null;
                            const readTime = new Date(otherRead.read_at).getTime();
                            if (isNaN(readTime)) return null;
                            const diffMin = Math.floor(
                              (Date.now() - readTime) / 60000,
                            );
                            let text = "Seen";
                            if (diffMin < 1) text = "Seen just now";
                            else if (diffMin < 60)
                              text = `Seen ${diffMin}m ago`;
                            else if (diffMin < 1440)
                              text = `Seen ${Math.floor(diffMin / 60)}h ago`;
                            return (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: T.accentHover,
                                  fontWeight: 500,
                                  marginTop: 2,
                                  marginRight: 4,
                                }}
                              >
                                {text}
                              </span>
                            );
                          })()}
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
                    height: "100%",
                    padding: 40,
                    color: T.textMuted,
                    gap: 16,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: T.bgHoverStrong,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Send size={28} style={{ color: T.textFaint }} />
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      color: T.textSecondary,
                      fontWeight: 600,
                    }}
                  >
                    No messages yet
                  </div>
                  <div
                    style={{ fontSize: 14, color: T.textFaint, maxWidth: 300 }}
                  >
                    Send a message to start the conversation in{" "}
                    {selectedChannel.name}
                  </div>
                </div>
              )}

          {typingUsers && typingUsers.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                marginTop: 12,
                marginLeft: 44,
              }}
            >
              <Avatar user={typingUsers[0]} size="chat" />
              <div
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  padding: "8px 12px",
                  borderRadius: "14px 14px 14px 4px",
                  display: "flex",
                  gap: 4,
                  alignItems: "center",
                  height: 28,
                }}
              >
                <div className="typing-dots-bubble">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <style>{`.typing-dots-bubble { display: flex; gap: 4px; align-items: center; } .typing-dots-bubble span { width: 6px; height: 6px; border-radius: "50%"; background: ${T.textMuted}; animation: typingBounce 1.4s infinite ease-in-out both; } .typing-dots-bubble span:nth-child(1) { animation-delay: -0.32s; } .typing-dots-bubble span:nth-child(2) { animation-delay: -0.16s; } @keyframes typingBounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }`}</style>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <style>{`@keyframes msgFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {!isAtBottom && (
        <button
          onClick={onScrollToBottom}
          style={{
            position: "absolute",
            bottom: 20,
            right: 28,
            height: 40,
            width: 40,
            borderRadius: "50%",
            background: T.accent,
            border: "none",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            zIndex: 10,
            transition: "all 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.background = T.accentHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.background = T.accent;
          }}
        >
          <ArrowDown size={20} />
        </button>
      )}
    </div>
  );
}

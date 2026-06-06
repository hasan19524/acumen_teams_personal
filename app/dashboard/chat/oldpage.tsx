"use client";
import { useWebSocket } from "@/features/chat/hooks/useWebSocket";
import { ConnectionStatus } from "@/features/chat/components/ConnectionStatus";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import {
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  Reply,
  Copy,
  Pencil,
  Trash2,
  X,
  Check,
  CheckCircle2,
  Loader2,
  AlertCircle,
  WifiOff,
  ArrowDown,
  Image as ImageIcon,
  FileText,
  Download,
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useChatStore } from "@/features/chat/store/chatStore";
import { Message, WSEventEnvelope } from "@/features/chat/types/message";
import { useFileUpload } from "@/features/chat/hooks/useFileUpload";

// ── Design Tokens ─────────────────────────────────────────────────────────────
// Single source of truth for spacing, colors, radii, and typography.
// Change these values to theme the entire chat surface.
const T = {
  // Surfaces
  bgApp: "#0a0b10",
  bgSidebar: "#10111a",
  bgHeader: "#0f1019",
  bgInput: "#0f1019",
  bgBubbleMine: "#2e3a52",
  bgBubbleOther: "#161825",
  bgHover: "rgba(255,255,255,0.03)",
  bgHoverStrong: "rgba(255,255,255,0.06)",
  bgMenu: "#1a1c2a",
  bgModal: "#161825",
  bgInputField: "#1a1c2a",
  bgOverlay: "rgba(0,0,0,0.55)",

  // Accent
  accent: "#6366f1",
  accentHover: "#818cf8",
  accentMuted: "rgba(99,102,241,0.12)",
  accentSubtle: "rgba(99,102,241,0.06)",
  danger: "#ef4444",
  dangerHover: "rgba(239,68,68,0.1)",
  success: "#22c55e",

  // Text
  textPrimary: "#e4e5eb",
  textSecondary: "#8b8d9a",
  textMuted: "#5c5e6e",
  textFaint: "#7c8296",
  textMeta: "rgba(255,255,255,0.32)",

  // Borders
  border: "rgba(255,255,255,0.06)",
  borderSubtle: "rgba(255,255,255,0.04)",
  borderHover: "rgba(255,255,255,0.1)",
  borderFocus: "rgba(99,102,241,0.5)",

  // Spacing
  gapXs: 4,
  gapSm: 8,
  gapMd: 12,
  gapLg: 16,
  gapXl: 20,

  // Radii
  radiusXs: 4,
  radiusSm: 6,
  radiusMd: 10,
  radiusLg: 14,
  radiusXl: 18,

  // Typography
  fontSizeXs: 10,
  fontSizeSm: 12,
  fontSizeBase: 14,
  fontSizeMd: 15,

  // Layout
  chatMaxWidth: 860,
  bubbleMaxWidth: 440,
  mediaGridMax: 280,
  imageHeight: 110,
  sidebarWidth: 280,
} as const;

type ChatUser = {
  id: number;
  name: string;
  avatar: string;
  color: string;
  unread: number;
  last: string;
  channel_id: number;
};

export default function ChatPage() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const selectedChatRef = useRef<ChatUser | null>(null);
  const messagesRef = useRef<Record<number, Message[]>>({});
  const isAtBottomRef = useRef(true);
  const isLoadingOlderRef = useRef(false);
  const initialLoadDoneRef = useRef<Set<number>>(new Set());
  const prevScrollHeightRef = useRef(0);

  const [, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [conversations, setConversations] = useState<ChatUser[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatUser | null>(null);
  const {
    messages,
    pagination,
    setMessages,
    prependMessages,
    setPagination,
    handleWSEvent,
  } = useChatStore();
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFiles } = useFileUpload(selectedChat?.channel_id ?? null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");

  const [activeMenuMsgId, setActiveMenuMsgId] = useState<number | null>(null);
  const [deleteModalMsgId, setDeleteModalMsgId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<number | null>(null);

  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<number>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const enterSelectMode = (msgId: number) => {
    setIsSelectMode(true);
    setSelectedMsgIds(new Set([msgId]));
    setActiveMenuMsgId(null);
  };

  const toggleMessageSelection = (msgId: number) => {
    setSelectedMsgIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(msgId)) {
        newSet.delete(msgId);
      } else {
        if (newSet.size < 50) newSet.add(msgId); // Max 50 limit
      }
      if (newSet.size === 0) setIsSelectMode(false);
      return newSet;
    });
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedMsgIds(new Set());
  };

  const handleCopySelected = async () => {
    if (!selectedChat) return;
    const currentMsgs = messages[selectedChat.channel_id] || [];
    const selectedMsgs = currentMsgs.filter((m) => selectedMsgIds.has(m.id));
    const textToCopy = selectedMsgs.map((m) => m.content).join("\n");
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      console.error("Failed to copy");
    }
    exitSelectMode();
  };

  const handleBulkDeleteForMe = () => {
    if (!selectedChat) return;
    const currentMsgs = messages[selectedChat.channel_id] || [];
    setMessages(
      selectedChat.channel_id,
      currentMsgs.filter((m) => !selectedMsgIds.has(m.id)),
    );
    setShowBulkDeleteModal(false);
    exitSelectMode();
  };

  const handleBulkDeleteForEveryone = async () => {
    if (!selectedChat) return;
    const currentMsgs = messages[selectedChat.channel_id] || [];
    const selectedMsgs = currentMsgs.filter((m) => selectedMsgIds.has(m.id));

    for (const msg of selectedMsgs) {
      if (msg.sender?.id === myUserId) {
        try {
          await apiFetch(`/api/chat/messages/${msg.id}/delete/`, {
            method: "DELETE",
          });
        } catch (error) {
          console.error("Failed to delete message:", error);
        }
      }
    }
    setShowBulkDeleteModal(false);
    exitSelectMode();
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest(".msg-dropdown") &&
        !target.closest(".msg-menu-btn")
      ) {
        setActiveMenuMsgId(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setActiveMenuMsgId(null);
    setDeleteModalMsgId(null);
    setReplyingTo(null);
    setEditingMessageId(null);
    exitSelectMode();
  }, [selectedChat?.channel_id]);

  const handleCopy = async (msg: Message) => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedMsgId(msg.id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch {
      console.error("Failed to copy");
    }
    setActiveMenuMsgId(null);
  };

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
    setActiveMenuMsgId(null);
  };

  const handleEditMessage = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
    setActiveMenuMsgId(null);
  };

  const handleSaveEdit = async (messageId: number) => {
    if (!editContent.trim()) return;
    try {
      await apiFetch(`/api/chat/messages/${messageId}/edit/`, {
        method: "PATCH",
        body: JSON.stringify({ content: editContent }),
      });
      setEditingMessageId(null);
      setEditContent("");
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  const handleDeleteForEveryone = async (msgId: number) => {
    try {
      await apiFetch(`/api/chat/messages/${msgId}/delete/`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
    setDeleteModalMsgId(null);
  };

  const handleDeleteForMe = (msgId: number) => {
    if (selectedChat) {
      const currentMsgs = messages[selectedChat.channel_id] || [];
      setMessages(
        selectedChat.channel_id,
        currentMsgs.filter((m) => m.id !== msgId),
      );
    }
    setDeleteModalMsgId(null);
  };

  const { authChecked } = useAuth();

  const myUserId =
    typeof window !== "undefined"
      ? parseInt(localStorage.getItem("user_id") || "0")
      : 0;

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);
  useEffect(() => {
    isAtBottomRef.current = isAtBottom;
  }, [isAtBottom]);

  useEffect(() => {
    if (!authChecked) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    loadChannels();
  }, [authChecked]);

  const [galleryItems, setGalleryItems] = useState<
    Array<{ url: string; type: string; name: string }>
  >([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const {
    state: wsState,
    send: wsSend,
    isReady,
  } = useWebSocket({
    channelId: selectedChat?.channel_id ?? null,
    token: authChecked
      ? typeof window !== "undefined"
        ? localStorage.getItem("token")
        : null
      : null,
    onMessage: (data) => {
      const currentChat = selectedChatRef.current;
      if (!currentChat) return;
      if (data.type === "message" && data.data?.reply_to != null) {
        const replyId =
          typeof data.data.reply_to === "object"
            ? data.data.reply_to.id
            : data.data.reply_to;
        if (
          typeof data.data.reply_to !== "object" ||
          !data.data.reply_to.content
        ) {
          const channelId = data.data.channel || currentChat.channel_id;
          const currentMsgs = messagesRef.current[channelId] || [];
          const originalMsg = currentMsgs.find((m) => m.id === replyId);
          if (originalMsg) {
            data.data.reply_to = {
              id: originalMsg.id,
              content: originalMsg.content,
              sender: originalMsg.sender,
              sender_name: originalMsg.sender_name,
              is_deleted: originalMsg.is_deleted,
              attachments: originalMsg.attachments,
            };
          }
        }
      }
      handleWSEvent(data as WSEventEnvelope);
      if (data.type === "message" && data.event === "message.created") {
        const targetChannelId = data.data?.channel || currentChat.channel_id;
        if (
          isAtBottomRef.current &&
          targetChannelId === currentChat.channel_id
        ) {
          setTimeout(
            () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
            50,
          );
        }
      } else if (data.type === "typing") {
        console.debug("Typing:", data.username);
      } else if (data.type === "presence") {
        console.debug("Presence:", data.username, data.status);
      }
    },
    onError: (error) => console.error("WebSocket error:", error),
  });

  useEffect(() => {
    if (!selectedChat) return;
    initialLoadDoneRef.current.delete(selectedChat.channel_id);
    setMessages(selectedChat.channel_id, []);
    setPagination(selectedChat.channel_id, { nextOffset: 0, hasOlder: false });
    isLoadingOlderRef.current = false;
    setIsLoadingOlder(false);
    loadMessages(selectedChat.channel_id);
  }, [selectedChat?.channel_id]);

  useEffect(() => {
    if (isLoadingOlder && messagesContainerRef.current) {
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      messagesContainerRef.current.scrollTop =
        newScrollHeight - prevScrollHeightRef.current;
      isLoadingOlderRef.current = false;
      setIsLoadingOlder(false);
    }
  }, [messages, isLoadingOlder]);

  const randomColor = () => {
    const colors = [
      "#6366f1",
      "#8b5cf6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#06b6d4",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const createChannel = async () => {
    if (!newChannelName.trim()) return;
    const res = await apiFetch(`/api/chat/channels/`, {
      method: "POST",
      body: JSON.stringify({ name: newChannelName }),
    });
    const data = await res.json();
    if (data.id) {
      const newChat = {
        id: data.id,
        name: data.name,
        avatar: data.name?.charAt(0)?.toUpperCase(),
        color: randomColor(),
        unread: 0,
        last: "Open conversation",
        channel_id: data.id,
      };
      setConversations((prev) => [...prev, newChat]);
      setSelectedChat(newChat);
      setNewChannelName("");
      setShowNewChannel(false);
    }
  };

  const loadChannels = async () => {
    try {
      const res = await apiFetch(`/api/chat/channels/`);
      const data = await res.json();
      const parsed = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        avatar: item.name?.charAt(0)?.toUpperCase(),
        color: randomColor(),
        unread: 0,
        last: "Open conversation",
        channel_id: item.id,
      }));
      setConversations(parsed);
      if (parsed.length > 0) setSelectedChat(parsed[0]);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const loadMessages = async (channelId: number) => {
    try {
      const limit = 30;
      const countRes = await apiFetch(
        `/api/chat/messages/${channelId}/?limit=1&offset=0`,
      );
      const countData = await countRes.json();
      const total = countData.total || 0;
      const initialOffset = Math.max(0, total - limit);
      const res = await apiFetch(
        `/api/chat/messages/${channelId}/?limit=${limit}&offset=${initialOffset}`,
      );
      const data = await res.json();
      const rawMessages = Array.isArray(data.results) ? data.results : [];
      const parsed: Message[] = rawMessages.map((msg: any) => ({
        id: msg.id,
        channel: msg.channel,
        sender: msg.sender,
        sender_name: msg.sender_name,
        content: msg.content,
        display_content: msg.display_content,
        client_id: msg.client_id,
        is_edited: msg.is_edited,
        edited_at: msg.edited_at,
        is_deleted: msg.is_deleted,
        reply_to: msg.reply_to,
        attachments: msg.attachments || [],
        created_at: msg.created_at,
        created_time: msg.created_time,
      }));
      const msgMap = new Map(parsed.map((m) => [m.id, m]));
      const enriched = parsed.map((msg) => {
        if (msg.reply_to && typeof msg.reply_to === "number") {
          const original = msgMap.get(msg.reply_to);
          if (original)
            return {
              ...msg,
              reply_to: {
                id: original.id,
                content: original.content,
                sender: original.sender,
                sender_name: original.sender_name,
                is_deleted: original.is_deleted,
                attachments: original.attachments,
              },
            };
        }
        return msg;
      });
      setMessages(channelId, enriched);
      setPagination(channelId, {
        nextOffset: Math.max(0, initialOffset - limit),
        hasOlder: initialOffset > 0,
      });
      if (!initialLoadDoneRef.current.has(channelId)) {
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: "auto" });
          setIsAtBottom(true);
          initialLoadDoneRef.current.add(channelId);
        }, 100);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessages(channelId, []);
    }
  };

  const loadOlderMessages = async () => {
    if (!selectedChat) return;
    if (isLoadingOlderRef.current) return;
    const pag = pagination[selectedChat.channel_id];
    if (!pag || !pag.hasOlder) return;
    isLoadingOlderRef.current = true;
    setIsLoadingOlder(true);
    const limit = 30;
    const offset = pag.nextOffset;
    if (messagesContainerRef.current)
      prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
    try {
      const res = await apiFetch(
        `/api/chat/messages/${selectedChat.channel_id}/?limit=${limit}&offset=${offset}`,
      );
      const data = await res.json();
      const rawMessages = Array.isArray(data.results) ? data.results : [];
      if (rawMessages.length === 0) {
        const currentPag = pagination[selectedChat.channel_id];
        if (currentPag)
          setPagination(selectedChat.channel_id, {
            ...currentPag,
            hasOlder: false,
          });
        isLoadingOlderRef.current = false;
        setIsLoadingOlder(false);
        return;
      }
      const parsed: Message[] = rawMessages.map((msg: any) => ({
        id: msg.id,
        channel: msg.channel,
        sender: msg.sender,
        sender_name: msg.sender_name,
        content: msg.content,
        display_content: msg.display_content,
        client_id: msg.client_id,
        is_edited: msg.is_edited,
        edited_at: msg.edited_at,
        is_deleted: msg.is_deleted,
        reply_to: msg.reply_to,
        attachments: msg.attachments || [],
        created_at: msg.created_at,
        created_time: msg.created_time,
      }));
      const currentMsgs = messages[selectedChat.channel_id] || [];
      const msgMap = new Map([...currentMsgs, ...parsed].map((m) => [m.id, m]));
      const enriched = parsed.map((msg) => {
        if (msg.reply_to && typeof msg.reply_to === "number") {
          const original = msgMap.get(msg.reply_to);
          if (original)
            return {
              ...msg,
              reply_to: {
                id: original.id,
                content: original.content,
                sender: original.sender,
                sender_name: original.sender_name,
                is_deleted: original.is_deleted,
                attachments: original.attachments,
              },
            };
        }
        return msg;
      });
      prependMessages(selectedChat.channel_id, enriched);
      setPagination(selectedChat.channel_id, {
        nextOffset: Math.max(0, offset - limit),
        hasOlder: offset > 0,
      });
    } catch (error) {
      console.error("Failed to load older messages:", error);
      isLoadingOlderRef.current = false;
      setIsLoadingOlder(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!selectedChat) return;
    const container = e.currentTarget;
    const isBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      80;
    setIsAtBottom(isBottom);
    if (container.scrollTop < 100) loadOlderMessages();
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
  };

  const handleSend = () => {
    if (!selectedChat) return;

    // Upload pending files first
    if (pendingFiles.length > 0) {
      uploadFiles(pendingFiles);
      setPendingFiles([]);
    }

    // Send text message if present
    if (messageInput.trim()) {
      if (!isReady()) {
        console.warn("WebSocket not ready");
        return;
      }
      wsSend({
        type: "message",
        content: messageInput,
        ...(replyingTo ? { reply_to: replyingTo.id } : {}),
      });
      setMessageInput("");
      setReplyingTo(null);
    }
  };

  const scrollToMessage = (messageId: number) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("msg-highlight");
      setTimeout(() => el.classList.remove("msg-highlight"), 2000);
    }
  };

  const filteredChats = conversations.filter((chat) =>
    chat.name.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Message Grouping Logic ──────────────────────────────────────────────────
  // Determines if consecutive messages are from the same sender for compact grouping
  const isGrouped = (msg: Message, index: number, allMsgs: Message[]) => {
    if (index === 0) return false;
    const prev = allMsgs[index - 1];
    return (
      prev.sender?.id === msg.sender?.id &&
      !prev.is_deleted &&
      !msg.reply_to &&
      !prev.reply_to &&
      new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() <
        120000
    ); // 2 min
  };

  // Render message content with clickable URLs and safe overflow
  const renderMessageContent = (text: string, isMine: boolean) => {
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: isMine ? "#93c5fd" : T.accentHover,
              textDecoration: "none",
              wordBreak: "break-all",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };
  const resolveFileUrl = (url: string | null | undefined) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}${url}`;
  };

  const renderAttachments = (msg: Message, displayText: string) => {
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
            {mediaAtts
              .slice(0, mediaAtts.length === 3 ? 3 : 4)
              .map((att, i) => {
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
                        mediaAtts.length === 3 && i === 0
                          ? "1 / -1"
                          : undefined,
                      overflow: "hidden",
                    }}
                    onClick={() => {
                      const items = mediaAtts.map((a) => ({
                        url: resolveFileUrl(a.file_url),
                        type: a.file_type || "",
                        name: a.original_filename || "",
                      }));
                      setGalleryItems(items);
                      setGalleryIndex(i);
                    }}
                  >
                    {isVideo && fileUrl ? (
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
  };

  if (!authChecked) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        background: T.bgApp,
        color: T.textPrimary,
        overflow: "hidden",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        .message-row:hover .msg-menu-trigger { opacity: 1 !important; pointer-events: auto !important; }
        .msg-dropdown { animation: dropdownIn 0.1s ease-out; }
        @keyframes dropdownIn { from { opacity:0; transform:scale(0.96) translateY(-2px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .delete-modal-enter { animation: modalIn 0.12s ease-out; }
        @keyframes modalIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        .reply-bar { animation: slideUp 0.12s ease-out; }
        @keyframes slideUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes msgHighlight { 0% { background: ${T.accentMuted}; } 100% { background: transparent; } }
        .msg-highlight { animation: msgHighlight 1.5s ease-out forwards; border-radius: 8px; }
        @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:0.8; } }
        .skeleton-pulse { animation: pulse 1.5s ease-in-out infinite; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
      `}</style>

      {/* SIDEBAR */}
      <DashboardSidebar />

      {/* CHANNEL LIST */}
      <section
        style={{
          width: T.sidebarWidth,
          background: T.bgSidebar,
          borderRight: `1px solid ${T.border}`,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: T.gapLg }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: T.gapMd,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                color: T.textPrimary,
              }}
            >
              Chats
            </h2>
            <button
              onClick={() => setShowNewChannel(true)}
              style={{
                width: 30,
                height: 30,
                borderRadius: T.radiusSm,
                background: T.accentMuted,
                border: "none",
                color: T.accentHover,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 400,
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(99,102,241,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = T.accentMuted;
              }}
            >
              +
            </button>
          </div>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                color: T.textMuted,
              }}
            />
            <input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
                borderRadius: T.radiusMd,
                border: `1px solid ${T.border}`,
                background: T.bgInputField,
                color: T.textPrimary,
                outline: "none",
                fontSize: T.fontSizeSm,
                transition: "border-color 0.12s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = T.borderFocus;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = T.border;
              }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: `0 ${T.gapSm}` }}>
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              style={{
                padding: "10px 12px",
                borderRadius: T.radiusMd,
                marginBottom: 2,
                cursor: "pointer",
                background:
                  selectedChat?.id === chat.id ? T.accentMuted : "transparent",
                display: "flex",
                gap: T.gapMd,
                alignItems: "center",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => {
                if (selectedChat?.id !== chat.id)
                  e.currentTarget.style.background = T.bgHover;
              }}
              onMouseLeave={(e) => {
                if (selectedChat?.id !== chat.id)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: chat.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {chat.avatar}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div
                  style={{
                    fontSize: T.fontSizeSm,
                    fontWeight: 600,
                    color: T.textPrimary,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {chat.name}
                </div>
                <div
                  style={{
                    fontSize: T.fontSizeXs + 1,
                    color: T.textMuted,
                    marginTop: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {chat.last}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CHAT WINDOW */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          background: T.bgApp,
          height: "100vh",
          maxHeight: "100vh",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
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
                  onClick={exitSelectMode}
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
                  {selectedMsgIds.size} selected
                </span>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={handleCopySelected}
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
                  onClick={() => setShowBulkDeleteModal(true)}
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
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  {selectedChat?.name || "Select Chat"}
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

        {/* MESSAGES */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
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
              {selectedChat &&
                pagination[selectedChat.channel_id]?.hasOlder && (
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

              {selectedChat && messages[selectedChat.channel_id]?.length > 0 ? (
                messages[selectedChat.channel_id].map((msg, index) => {
                  const allMsgs = messages[selectedChat.channel_id];
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
                        if (isSelectMode) toggleMessageSelection(msg.id);
                      }}
                      style={{
                        display: "flex",
                        // Removed forced left alignment so your messages stay on the right
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
                      {/* Select Mode Checkbox - Fixed width column to align perfectly */}
                      {isSelectMode && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 36, // Fixed width ensures all checkboxes are at the exact same X coordinate
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
                          // Pushes your message bubbles to the right (like WhatsApp)
                          marginLeft: mine ? "auto" : 0,
                        }}
                      >
                        {/* Sender name — only show on first message of group */}
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
                              background: mine
                                ? T.bgBubbleMine
                                : T.bgBubbleOther,
                              position: "relative",
                              overflow: "hidden",
                            }}
                          >
                            {/* Reply Preview */}
                            {resolvedReplyTo &&
                              typeof resolvedReplyTo === "object" && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (resolvedReplyTo.id)
                                      scrollToMessage(resolvedReplyTo.id);
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
                                  fontSize: T.fontSizeBase,
                                  lineHeight: 1.45,
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

                            {renderAttachments(msg, displayText)}

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
                                justifyContent: mine
                                  ? "flex-end"
                                  : "flex-start",
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
                            </div>
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
                                  setActiveMenuMsgId(
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
                                      icon: <Reply size={14} />,
                                      label: "Reply",
                                      action: () => handleReply(msg),
                                      danger: false,
                                    },
                                    {
                                      icon: <CheckCircle2 size={14} />,
                                      label: "Select",
                                      action: () => enterSelectMode(msg.id),
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
                                      action: () => handleCopy(msg),
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
                                            action: () =>
                                              handleEditMessage(msg),
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
                                              setActiveMenuMsgId(null);
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
              ) : selectedChat ? (
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
                    style={{ fontSize: T.fontSizeXs + 1, color: T.textFaint }}
                  >
                    Start the conversation
                  </div>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Scroll to bottom */}
          {!isAtBottom && (
            <button
              onClick={scrollToBottom}
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

        {/* DISCONNECTED STATE */}
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

        {/* INPUT AREA */}
        <div
          style={{
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
                  return combined.slice(0, 20); // Hard limit at 20
                });
              }
              e.target.value = "";
            }}
          />

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
          {/* FILE PREVIEW STRIP */}
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
                      // Open full gallery preview for images/videos
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
                        setGalleryItems(items);
                        setGalleryIndex(mediaFiles.indexOf(file));
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
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent opening the gallery when removing
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
                    {/* Filename tooltip for non-media */}
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
              <Smile size={16} />
            </button>
            <input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSend()
              }
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
              onClick={handleSend}
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
      </section>

      {/* EDIT MODAL */}
      {editingMessageId !== null && (
        <div
          onClick={() => setEditingMessageId(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: T.bgOverlay,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.bgModal,
              border: `1px solid ${T.borderHover}`,
              borderRadius: T.radiusLg,
              width: 420,
              maxWidth: "90vw",
              overflow: "hidden",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              animation: "modalIn 0.12s ease-out",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Pencil size={14} style={{ color: T.accentHover }} />
              <span style={{ fontSize: T.fontSizeSm + 1, fontWeight: 600 }}>
                Edit message
              </span>
            </div>
            <div style={{ padding: "14px 18px 6px" }}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit(editingMessageId);
                  }
                  if (e.key === "Escape") setEditingMessageId(null);
                }}
                autoFocus
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: T.radiusSm,
                  border: `1px solid ${T.border}`,
                  background: T.bgInputField,
                  color: T.textPrimary,
                  outline: "none",
                  fontSize: T.fontSizeBase,
                  fontFamily: "inherit",
                  resize: "vertical",
                  boxSizing: "border-box",
                  lineHeight: 1.45,
                  transition: "border-color 0.12s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = T.borderFocus;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = T.border;
                }}
              />
            </div>
            <div
              style={{
                padding: "6px 18px 14px",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                onClick={() => setEditingMessageId(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.textMuted,
                  cursor: "pointer",
                  fontSize: T.fontSizeSm,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  padding: "7px 14px",
                  borderRadius: T.radiusSm,
                  transition: "all 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = T.textPrimary;
                  e.currentTarget.style.background = T.bgHoverStrong;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = T.textMuted;
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveEdit(editingMessageId)}
                style={{
                  background: T.accent,
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: T.fontSizeSm,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  padding: "7px 18px",
                  borderRadius: T.radiusSm,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.accentHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = T.accent;
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CHANNEL MODAL */}
      {showNewChannel && (
        <div
          onClick={() => setShowNewChannel(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: T.bgOverlay,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.bgModal,
              border: `1px solid ${T.borderHover}`,
              borderRadius: T.radiusLg,
              padding: 24,
              width: 340,
            }}
          >
            <h3
              style={{
                margin: "0 0 14px",
                color: T.textPrimary,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              New Channel
            </h3>
            <input
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createChannel()}
              placeholder="Channel name"
              autoFocus
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: T.radiusMd,
                border: `1px solid ${T.border}`,
                background: T.bgInputField,
                color: T.textPrimary,
                outline: "none",
                fontSize: T.fontSizeBase,
                boxSizing: "border-box",
                transition: "border-color 0.12s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = T.borderFocus;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = T.border;
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                onClick={() => {
                  setShowNewChannel(false);
                  setNewChannelName("");
                }}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: T.radiusMd,
                  border: `1px solid ${T.border}`,
                  background: "transparent",
                  color: T.textSecondary,
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: T.fontSizeSm,
                  transition: "all 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = T.borderHover;
                  e.currentTarget.style.color = T.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.border;
                  e.currentTarget.style.color = T.textSecondary;
                }}
              >
                Cancel
              </button>
              <button
                onClick={createChannel}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: T.radiusMd,
                  border: "none",
                  background: T.accent,
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: T.fontSizeSm,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.accentHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = T.accent;
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModalMsgId !== null && (
        <div
          onClick={() => setDeleteModalMsgId(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: T.bgOverlay,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
        >
          <div
            className="delete-modal-enter"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.bgModal,
              border: `1px solid ${T.borderHover}`,
              borderRadius: T.radiusLg,
              width: 340,
              overflow: "hidden",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                padding: "18px 20px 14px",
                borderBottom: `1px solid ${T.border}`,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: T.textPrimary,
                  marginBottom: 4,
                }}
              >
                Delete message?
              </div>
              <div
                style={{
                  fontSize: T.fontSizeSm,
                  color: T.textMuted,
                  lineHeight: 1.45,
                }}
              >
                This can't be undone. Choose who sees it deleted.
              </div>
            </div>
            <div style={{ padding: "6px 0" }}>
              {[
                {
                  label: "Delete for everyone",
                  action: () => handleDeleteForEveryone(deleteModalMsgId),
                  danger: true,
                },
                {
                  label: "Delete for me",
                  action: () => handleDeleteForMe(deleteModalMsgId),
                  danger: false,
                  muted: true,
                },
              ].map((item, i, arr) => (
                <button
                  key={i}
                  onClick={item.action}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = item.danger
                      ? T.dangerHover
                      : T.bgHoverStrong;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "12px 20px",
                    background: "transparent",
                    border: "none",
                    color: item.danger
                      ? T.danger
                      : item.muted
                        ? T.textMuted
                        : T.textSecondary,
                    cursor: "pointer",
                    fontSize: T.fontSizeSm + 1,
                    fontFamily: "inherit",
                    fontWeight: item.danger ? 600 : 400,
                    transition: "background 0.08s",
                  }}
                >
                  <Trash2 size={15} style={{ opacity: item.muted ? 0.4 : 1 }} />
                  {item.label}
                </button>
              ))}
              <div
                style={{ height: 1, background: T.border, margin: "3px 0" }}
              />
              <button
                onClick={() => setDeleteModalMsgId(null)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.bgHoverStrong;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  padding: "12px 20px",
                  background: "transparent",
                  border: "none",
                  color: T.textSecondary,
                  cursor: "pointer",
                  fontSize: T.fontSizeSm + 1,
                  fontFamily: "inherit",
                  fontWeight: 500,
                  transition: "background 0.08s",
                  justifyContent: "center",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE MODAL */}
      {showBulkDeleteModal && selectedChat && (
        <div
          onClick={() => setShowBulkDeleteModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: T.bgOverlay,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
        >
          <div
            className="delete-modal-enter"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.bgModal,
              border: `1px solid ${T.borderHover}`,
              borderRadius: T.radiusLg,
              width: 340,
              overflow: "hidden",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                padding: "18px 20px 14px",
                borderBottom: `1px solid ${T.border}`,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: T.textPrimary,
                  marginBottom: 4,
                }}
              >
                Delete {selectedMsgIds.size} messages?
              </div>
              <div
                style={{
                  fontSize: T.fontSizeSm,
                  color: T.textMuted,
                  lineHeight: 1.45,
                }}
              >
                This can't be undone. Choose who sees it deleted.
              </div>
            </div>
            <div style={{ padding: "6px 0" }}>
              {(() => {
                const currentMsgs = messages[selectedChat.channel_id] || [];
                const allMine = Array.from(selectedMsgIds).every((id) => {
                  const msg = currentMsgs.find((m) => m.id === id);
                  return msg?.sender?.id === myUserId;
                });

                return (
                  <>
                    {allMine && (
                      <button
                        onClick={handleBulkDeleteForEveryone}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = T.dangerHover)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          width: "100%",
                          padding: "12px 20px",
                          background: "transparent",
                          border: "none",
                          color: T.danger,
                          cursor: "pointer",
                          fontSize: T.fontSizeSm + 1,
                          fontFamily: "inherit",
                          fontWeight: 600,
                          transition: "background 0.08s",
                        }}
                      >
                        <Trash2 size={15} />
                        Delete for everyone
                      </button>
                    )}
                    <button
                      onClick={handleBulkDeleteForMe}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = T.bgHoverStrong)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "12px 20px",
                        background: "transparent",
                        border: "none",
                        color: T.textMuted,
                        cursor: "pointer",
                        fontSize: T.fontSizeSm + 1,
                        fontFamily: "inherit",
                        fontWeight: 400,
                        transition: "background 0.08s",
                      }}
                    >
                      <Trash2 size={15} style={{ opacity: 0.4 }} />
                      Delete for me
                    </button>
                  </>
                );
              })()}
              <div
                style={{ height: 1, background: T.border, margin: "3px 0" }}
              />
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.bgHoverStrong;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  padding: "12px 20px",
                  background: "transparent",
                  border: "none",
                  color: T.textSecondary,
                  cursor: "pointer",
                  fontSize: T.fontSizeSm + 1,
                  fontFamily: "inherit",
                  fontWeight: 500,
                  transition: "background 0.08s",
                  justifyContent: "center",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GALLERY MODAL */}
      {galleryItems.length > 0 && (
        <div
          onClick={() => {
            setGalleryItems([]);
            setGalleryIndex(0);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.92)",
            display: "flex",
            flexDirection: "column",
            zIndex: 200,
            cursor: "pointer",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: "10px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: T.bgModal,
              borderBottom: `1px solid ${T.border}`,
              cursor: "default",
            }}
          >
            <div
              style={{
                color: T.textSecondary,
                fontSize: T.fontSizeSm,
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginRight: 16,
              }}
            >
              {galleryItems[galleryIndex]?.name}
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <a
                href={galleryItems[galleryIndex]?.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: T.textSecondary,
                  background: T.bgHoverStrong,
                  padding: "6px 14px",
                  borderRadius: T.radiusSm,
                  cursor: "pointer",
                  textDecoration: "none",
                  fontSize: T.fontSizeSm,
                  fontWeight: 500,
                  transition: "color 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = T.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = T.textSecondary;
                }}
              >
                💾 Save
              </a>
              <button
                onClick={() => {
                  setGalleryItems([]);
                  setGalleryIndex(0);
                }}
                style={{
                  color: T.textSecondary,
                  background: T.bgHoverStrong,
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: T.radiusSm,
                  cursor: "pointer",
                  fontSize: T.fontSizeSm,
                  fontWeight: 500,
                  transition: "color 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = T.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = T.textSecondary;
                }}
              >
                ✕ Close
              </button>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              cursor: "default",
            }}
          >
            {galleryItems.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setGalleryIndex((prev) =>
                      prev > 0 ? prev - 1 : galleryItems.length - 1,
                    );
                  }}
                  style={{
                    position: "absolute",
                    left: 16,
                    background: "rgba(0,0,0,0.5)",
                    border: "none",
                    color: "#fff",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    cursor: "pointer",
                    fontSize: 18,
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ←
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setGalleryIndex((prev) =>
                      prev < galleryItems.length - 1 ? prev + 1 : 0,
                    );
                  }}
                  style={{
                    position: "absolute",
                    right: 16,
                    background: "rgba(0,0,0,0.5)",
                    border: "none",
                    color: "#fff",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    cursor: "pointer",
                    fontSize: 18,
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  →
                </button>
              </>
            )}
            {galleryItems[galleryIndex]?.type?.startsWith("video/") &&
            galleryItems[galleryIndex].url ? (
              <video
                src={galleryItems[galleryIndex].url}
                controls
                autoPlay
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: "90vw",
                  maxHeight: "70vh",
                  borderRadius: 4,
                  cursor: "default",
                }}
              />
            ) : galleryItems[galleryIndex]?.url ? (
              <img
                src={galleryItems[galleryIndex].url}
                alt=""
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: "90vw",
                  maxHeight: "70vh",
                  objectFit: "contain",
                  cursor: "default",
                }}
              />
            ) : null}
          </div>
          {galleryItems.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                height: 80,
                background: T.bgModal,
                borderTop: `1px solid ${T.border}`,
                cursor: "default",
                display: "flex",
                alignItems: "center",
                padding: "0 18px",
                gap: 8,
                overflowX: "auto",
              }}
            >
              {galleryItems.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setGalleryIndex(idx)}
                  style={{
                    minWidth: 56,
                    height: 56,
                    borderRadius: T.radiusSm,
                    overflow: "hidden",
                    border:
                      idx === galleryIndex
                        ? `2px solid ${T.accent}`
                        : "2px solid transparent",
                    cursor: "pointer",
                    opacity: idx === galleryIndex ? 1 : 0.4,
                    flexShrink: 0,
                    transition: "all 0.12s",
                  }}
                >
                  {item.type?.startsWith("video/") && item.url ? (
                    <video
                      src={item.url}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      muted
                    />
                  ) : item.url ? (
                    <img
                      src={item.url}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      alt=""
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

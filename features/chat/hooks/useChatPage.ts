// features/chat/hooks/useChatPage.ts

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useChatStore } from "../store/chatStore";
import { useWebSocket } from "./useWebSocket";
import { useFileUpload } from "./useFileUpload";
import { Message, WSEventEnvelope } from "../types/message";
import { Channel } from "../types/channel";
import {
  loadChannels,
  loadDMs,
  loadMessages,
  loadOlderMessages,
  createChannel as createChannelService,
  deleteMessageForEveryone,
  editMessage,
  toggleReaction,
  markMessageRead,
} from "../services/channelService";


export function useChatPage() {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const selectedChannelRef = useRef<Channel | null>(null);
  const messagesRef = useRef<Record<number, Message[]>>({});
  const isAtBottomRef = useRef(true);
  const isLoadingOlderRef = useRef(false);
  const initialLoadDoneRef = useRef<Set<number>>(new Set());
  const prevScrollHeightRef = useRef(0);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { authChecked } = useAuth();
  const myUserId =
    typeof window !== "undefined"
      ? parseInt(localStorage.getItem("user_id") || "0")
      : 0;

  // ── Store ─────────────────────────────────────────────────────────────────
  const {
    messages,
    pagination,
    channels,
    selectedChannelId,
    setMessages,
    prependMessages,
    setPagination,
    handleWSEvent,
    selectChannel,
    setChannels,
    addChannel,
    typingUsers,
    clearTypingUser,
  } = useChatStore();

  // Keep ref in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const typingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const lastTypingSentRef = useRef(0);

  // ── Local State ───────────────────────────────────────────────────────────
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState("official");
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<number | null>(null);
  const [deleteModalMsgId, setDeleteModalMsgId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<number>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [galleryItems, setGalleryItems] = useState<
    Array<{ url: string; type: string; name: string }>
  >([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // ── Derived State ─────────────────────────────────────────────────────────
  const selectedChannel =
    channels.find((c) => c.id === selectedChannelId) ?? null;

  // ── Sync Refs ─────────────────────────────────────────────────────────────
  useEffect(() => {
    selectedChannelRef.current = selectedChannel;
  }, [selectedChannel]);

  useEffect(() => {
    isAtBottomRef.current = isAtBottom;
  }, [isAtBottom]);

  // ── File Upload ───────────────────────────────────────────────────────────
  const { uploadFiles } = useFileUpload(selectedChannelId);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  const {
    state: wsState,
    send: wsSend,
    isReady,
  } = useWebSocket({
    channelId: selectedChannelId,
    token: authChecked
      ? typeof window !== "undefined"
        ? localStorage.getItem("token")
        : null
      : null,
    onMessage: (data) => {
      const currentChat = selectedChannelRef.current;
      if (!currentChat) return;

      // Resolve reply_to if it's a numeric ID
      if (data.type === "message" && data.data?.reply_to != null) {
        const replyId =
          typeof data.data.reply_to === "object"
            ? data.data.reply_to.id
            : data.data.reply_to;
        if (
          typeof data.data.reply_to !== "object" ||
          !data.data.reply_to.content
        ) {
          const channelId = data.data.channel || currentChat.id;
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

      // Auto-clear typing indicators after 3 seconds of inactivity
      if (data.type === "typing" && data.data?.user?.id && data.data?.channel) {
        const typingUserId = data.data.user.id;
        const typingChannelId = data.data.channel;
        const key = `${typingChannelId}-${typingUserId}`;

        if (typingTimeoutsRef.current[key]) {
          clearTimeout(typingTimeoutsRef.current[key]);
        }

        typingTimeoutsRef.current[key] = setTimeout(() => {
          clearTypingUser(typingChannelId, typingUserId);
        }, 3000);
      }

      // Auto-scroll on new message
      if (data.type === "message" && data.event === "message.created") {
        const targetChannelId = data.data?.channel || currentChat.id;
        if (targetChannelId === currentChat.id) {
          const senderId = data.data?.sender?.id;
          // Always scroll if it's your own message, otherwise only if at bottom
          const shouldScroll = senderId === myUserId || isAtBottomRef.current;
          if (shouldScroll) {
            setTimeout(() => {
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
              setIsAtBottom(true);
            }, 50);
          }

          // Mark message as read if it's not our own message and we are at the bottom
          if (senderId !== myUserId && isAtBottomRef.current && data.data?.id) {
            markMessageRead(data.data.id);
          }
        }
      }
    },
    onError: (error) => console.error("WebSocket error:", error),
  });

  // ── Load Channels on Auth ─────────────────────────────────────────────────
  useEffect(() => {
    if (!authChecked) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    Promise.all([loadChannels(), loadDMs()]).then(([channels, dms]) => {
      const all = [...channels, ...dms];
      setChannels(all);
      if (all.length > 0) selectChannel(all[0].id);
    });
  }, [authChecked, setChannels, selectChannel]);

  // ── Load Messages on Channel Select ───────────────────────────────────────
  useEffect(() => {
    if (!selectedChannelId) return;
    initialLoadDoneRef.current.delete(selectedChannelId);
    setMessages(selectedChannelId, []);
    setPagination(selectedChannelId, { nextOffset: 0, hasOlder: false });
    isLoadingOlderRef.current = false;
    setIsLoadingOlder(false);

    loadMessages(selectedChannelId).then(
      ({ messages: msgs, pagination: pag }) => {
        setMessages(selectedChannelId, msgs);
        setPagination(selectedChannelId, pag);

        if (!initialLoadDoneRef.current.has(selectedChannelId)) {
          setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "auto" });
            setIsAtBottom(true);
            initialLoadDoneRef.current.add(selectedChannelId);
          }, 300);
        }

        // Mark other people's messages as read when opening a channel
        const otherMsgs = msgs.filter(
          (m) => m.sender?.id !== myUserId && !m.is_deleted,
        );
        otherMsgs.forEach((m) => {
          const alreadyRead = m.reads?.some(
            (r: any) => r.user?.id === myUserId,
          );
          if (!alreadyRead) {
            markMessageRead(m.id);
          }
        });
      },
    );
  }, [selectedChannelId, setMessages, setPagination]);

  // ── Scroll Restoration after loading older ────────────────────────────────
  // Handled directly inside handleScroll callback for precision.

  // ── Reset UI State on Channel Switch ──────────────────────────────────────
  useEffect(() => {
    setActiveMenuMsgId(null);
    setDeleteModalMsgId(null);
    setReplyingTo(null);
    setEditingMessageId(null);
    setIsSelectMode(false);
    setSelectedMsgIds(new Set());
    setShowEmojiPicker(false);
  }, [selectedChannelId]);

  // ── Close Menu on Outside Click ───────────────────────────────────────────
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

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    if (!selectedChannelId) return;

    if (pendingFiles.length > 0) {
      uploadFiles(pendingFiles);
      setPendingFiles([]);
    }

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

      // Always scroll to bottom after sending
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        setIsAtBottom(true);
      }, 50);
    }
  }, [
    selectedChannelId,
    pendingFiles,
    messageInput,
    isReady,
    wsSend,
    replyingTo,
    uploadFiles,
  ]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!selectedChannelId) return;
      const container = e.currentTarget;
      const isBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        80;
      setIsAtBottom(isBottom);

      if (container.scrollTop < 100) {
        const pag = pagination[selectedChannelId];
        if (!pag || !pag.hasOlder || isLoadingOlderRef.current) return;

        isLoadingOlderRef.current = true;
        setIsLoadingOlder(true);
        const limit = 30;
        const offset = pag.nextOffset;

        const prevHeight = messagesContainerRef.current?.scrollHeight || 0;

        const currentMsgs = messages[selectedChannelId] || [];
        loadOlderMessages(selectedChannelId, offset, currentMsgs, limit)
          .then(({ messages: olderMsgs, pagination: newPag }) => {
            if (olderMsgs.length === 0) {
              setPagination(selectedChannelId, {
                ...pag,
                hasOlder: false,
              });
              isLoadingOlderRef.current = false;
              setIsLoadingOlder(false);
              return;
            }
            prependMessages(selectedChannelId, olderMsgs);
            setPagination(selectedChannelId, newPag);

            // Restore scroll position after DOM updates
            // Keep loading flag TRUE until restoration completes to prevent duplicate loads
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                if (messagesContainerRef.current) {
                  const newHeight = messagesContainerRef.current.scrollHeight;
                  messagesContainerRef.current.scrollTop =
                    newHeight - prevHeight;
                }
                // NOW safe to reset — scroll position is restored
                isLoadingOlderRef.current = false;
                setIsLoadingOlder(false);
              });
            });
          })
          .catch((error) => {
            console.error("Failed to load older messages:", error);
            isLoadingOlderRef.current = false;
            setIsLoadingOlder(false);
          });
      }
    },
    [selectedChannelId, pagination, messages, prependMessages, setPagination],
  );

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
  }, []);

  const scrollToMessage = useCallback((messageId: number) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("msg-highlight");
      setTimeout(() => el.classList.remove("msg-highlight"), 2000);
    }
  }, []);

  const handleCreateChannel = useCallback(async () => {
    if (!newChannelName.trim()) return;
    try {
      const newChat = await createChannelService({
        name: newChannelName,
        channel_type: newChannelType as any,
      });
      addChannel(newChat);
      selectChannel(newChat.id);
    } catch (error) {
      console.error("Failed to create channel:", error);
    }
    setNewChannelName("");
    setNewChannelType("official");
    setShowNewChannel(false);
  }, [newChannelName, newChannelType, addChannel, selectChannel]);

  const handleCopy = useCallback(async (msg: Message) => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedMsgId(msg.id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch {
      console.error("Failed to copy");
    }
    setActiveMenuMsgId(null);
  }, []);

  const handleEmojiClick = useCallback((emojiData: any) => {
    setMessageInput((prev) => prev + emojiData.emoji);
  }, []);

  const handleTyping = useCallback(() => {
    if (!selectedChannelId || !isReady()) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current > 3000) {
      wsSend({ type: "typing", channel: selectedChannelId });
      lastTypingSentRef.current = now;
    }
  }, [selectedChannelId, isReady, wsSend]);

  const handleToggleReaction = useCallback(
    async (messageId: number, emoji: string) => {
      try {
        await toggleReaction(messageId, emoji);
      } catch (error) {
        console.error("Failed to toggle reaction:", error);
      }
    },
    [],
  );

  const handleMarkRead = useCallback(async (messageId: number) => {
    try {
      await markMessageRead(messageId);
    } catch (error) {
      // Silently fail - read receipts are non-critical
    }
  }, []);

  const handleReply = useCallback((msg: Message) => {
    setReplyingTo(msg);
    setActiveMenuMsgId(null);
  }, []);

  const handleEditMessage = useCallback((msg: Message) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
    setActiveMenuMsgId(null);
  }, []);

  const handleSaveEdit = useCallback(
    async (messageId: number) => {
      if (!editContent.trim()) return;
      try {
        await editMessage(messageId, editContent);
        setEditingMessageId(null);
        setEditContent("");
      } catch (error) {
        console.error("Failed to edit message:", error);
      }
    },
    [editContent],
  );

  const handleDeleteForEveryone = useCallback(async (msgId: number) => {
    try {
      await deleteMessageForEveryone(msgId);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
    setDeleteModalMsgId(null);
  }, []);

  const handleDeleteForMe = useCallback(
    (msgId: number) => {
      if (selectedChannelId) {
        const currentMsgs = messages[selectedChannelId] || [];
        setMessages(
          selectedChannelId,
          currentMsgs.filter((m) => m.id !== msgId),
        );
      }
      setDeleteModalMsgId(null);
    },
    [selectedChannelId, messages, setMessages],
  );

  // ── Select Mode ───────────────────────────────────────────────────────────

  const enterSelectMode = useCallback((msgId: number) => {
    setIsSelectMode(true);
    setSelectedMsgIds(new Set([msgId]));
    setActiveMenuMsgId(null);
  }, []);

  const toggleMessageSelection = useCallback((msgId: number) => {
    setSelectedMsgIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(msgId)) {
        newSet.delete(msgId);
      } else {
        if (newSet.size < 50) newSet.add(msgId);
      }
      if (newSet.size === 0) setIsSelectMode(false);
      return newSet;
    });
  }, []);

  const exitSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedMsgIds(new Set());
  }, []);

  const handleCopySelected = useCallback(async () => {
    if (!selectedChannelId) return;
    const currentMsgs = messages[selectedChannelId] || [];
    const selectedMsgs = currentMsgs.filter((m) => selectedMsgIds.has(m.id));
    const textToCopy = selectedMsgs.map((m) => m.content).join("\n");
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      console.error("Failed to copy");
    }
    exitSelectMode();
  }, [selectedChannelId, messages, selectedMsgIds, exitSelectMode]);

  const handleBulkDeleteForMe = useCallback(() => {
    if (!selectedChannelId) return;
    const currentMsgs = messages[selectedChannelId] || [];
    setMessages(
      selectedChannelId,
      currentMsgs.filter((m) => !selectedMsgIds.has(m.id)),
    );
    setShowBulkDeleteModal(false);
    exitSelectMode();
  }, [
    selectedChannelId,
    messages,
    selectedMsgIds,
    setMessages,
    exitSelectMode,
  ]);

  const handleBulkDeleteForEveryone = useCallback(async () => {
    if (!selectedChannelId) return;
    const currentMsgs = messages[selectedChannelId] || [];
    const selectedMsgs = currentMsgs.filter((m) => selectedMsgIds.has(m.id));

    for (const msg of selectedMsgs) {
      if (msg.sender?.id === myUserId) {
        try {
          await deleteMessageForEveryone(msg.id);
        } catch (error) {
          console.error("Failed to delete message:", error);
        }
      }
    }
    setShowBulkDeleteModal(false);
    exitSelectMode();
  }, [selectedChannelId, messages, selectedMsgIds, myUserId, exitSelectMode]);

  // ── Filtered Chats ────────────────────────────────────────────────────────

  const filteredChats = channels.filter((chat) =>
    chat.name.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    // Refs (needed by page for DOM binding)
    bottomRef,
    messagesContainerRef,

    // Auth
    authChecked,
    myUserId,

    // State
    sending,
    search,
    setSearch,
    messageInput,
    setMessageInput,
    channels,
    selectedChannel,
    selectChannel,
    isLoadingOlder,
    isAtBottom,
    showNewChannel,
    setShowNewChannel,
    newChannelName,
    setNewChannelName,
    newChannelType,
    setNewChannelType,
    activeMenuMsgId,
    setActiveMenuMsgId,
    deleteModalMsgId,
    setDeleteModalMsgId,
    replyingTo,
    setReplyingTo,
    copiedMsgId,
    editingMessageId,
    setEditingMessageId,
    editContent,
    setEditContent,
    pendingFiles,
    setPendingFiles,
    showEmojiPicker,
    setShowEmojiPicker,
    isSelectMode,
    selectedMsgIds,
    showBulkDeleteModal,
    setShowBulkDeleteModal,
    galleryItems,
    setGalleryItems,
    galleryIndex,
    setGalleryIndex,

    // Derived
    filteredChats,
    messages,
    pagination,

    // WS
    wsState,
    isReady,

    // Actions
    handleSend,
    handleScroll,
    scrollToBottom,
    scrollToMessage,
    handleCreateChannel,
    handleCopy,
    handleReply,
    handleEmojiClick,
    handleTyping,
    typingUsers,
    handleToggleReaction,
    handleMarkRead,
    handleEditMessage,
    handleSaveEdit,
    handleDeleteForEveryone,
    handleDeleteForMe,
    enterSelectMode,
    toggleMessageSelection,
    exitSelectMode,
    handleCopySelected,
    handleBulkDeleteForMe,
    handleBulkDeleteForEveryone,
  };
}

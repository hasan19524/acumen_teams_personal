// features/chat/hooks/useChatPage.ts

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentUserId, getWorkspaceId } from "@/lib/auth";
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
  markChannelRead,
  hideMessageForMe,
  getWorkspaceUsers,
  getChannelMembers,
} from "../services/channelService";
import { workspaceService } from "@/features/workspace/workspaceService";
import { createDMRequest, respondDMRequest } from "../services/dmRequestService";


export function useChatPage() {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const selectedChannelRef = useRef<Channel | null>(null);
  const messagesRef = useRef<Record<number, Message[]>>({});
  const isAtBottomRef = useRef(true);
  const isLoadingOlderRef = useRef(false);
  const initialLoadDoneRef = useRef<Set<number>>(new Set());

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { authChecked } = useAuth();
  const myUserId = getCurrentUserId() || 0;

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
  const [newChannelType, setNewChannelType] = useState("private_group");
  const [newChannelTeamId, setNewChannelTeamId] = useState("");
  const [newChannelMemberIds, setNewChannelMemberIds] = useState<number[]>([]);
  const [newChannelDMUserId, setNewChannelDMUserId] = useState("");
  const [newChannelDMMessage, setNewChannelDMMessage] = useState("");
  const [workspaceUsers, setWorkspaceUsers] = useState<Array<{ id: number; username: string; full_name: string }>>([]);
  const [userTeams, setUserTeams] = useState<Array<{ id: number; name: string }>>([]);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<number | null>(null);
  const [deleteModalMsgId, setDeleteModalMsgId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [activeThread, setActiveThread] = useState<Message | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<number>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [galleryItems, setGalleryItems] = useState<
    Array<{ url: string; type: string; name: string }>
  >([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState("members");
  const [channelMembers, setChannelMembers] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

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
    // FIX: Do not connect WebSocket for temporary (negative ID) channels
    channelId: selectedChannelId && selectedChannelId > 0 ? selectedChannelId : null,
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

          // FIX: If we are at the bottom and it's not our message, mark the whole channel as read via bulk API
          if (senderId !== myUserId && isAtBottomRef.current) {
            markChannelRead(targetChannelId).catch(() => {});
          }
        }
      }
    },
    onError: (error) => console.warn("WebSocket connection issue:", error),
  });

  // ── Load Channels on Auth ─────────────────────────────────────────────────
  useEffect(() => {
    if (!authChecked) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    // FIX: Only fetch channels if they haven't been loaded yet.
    // This prevents overwriting local unread counts (like 0 for the active channel) 
    // with stale backend data when navigating back to the chat page.
    if (useChatStore.getState().channels.length === 0) {
      Promise.all([loadChannels(), loadDMs()])
        .then(([loadedChannels, loadedDms]) => {
          setChannels([...loadedChannels, ...loadedDms]);
        })
        .finally(() => setIsInitialLoading(false));
    } else {
      setIsInitialLoading(false);
    }

    // Initial fetch of workspace users
    refreshWorkspaceUsers();

    // Fetch teams for team channel creation
    workspaceService.getTeams()
      .then((data) => setUserTeams(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [authChecked, setChannels]);

  // ── Load Messages on Channel Select ───────────────────────────────────────
  useEffect(() => {
    if (!selectedChannelId) return;

    // FIX: Do not fetch messages for temporary (negative ID) channels
    if (selectedChannelId < 0) {
      setMessages(selectedChannelId, []);
      return;
    }

    // FIX: Check if messages are already cached in the store to prevent UI reload flashes
    const cachedMsgs = useChatStore.getState().messages[selectedChannelId];
    const hasCache = cachedMsgs && cachedMsgs.length > 0;

    if (hasCache) {
      // Instantly scroll to bottom using cached messages without wiping the UI
      initialLoadDoneRef.current.delete(selectedChannelId);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
        setIsAtBottom(true);
        initialLoadDoneRef.current.add(selectedChannelId);
      }, 0);
    } else {
      // Only show loading skeleton if we have NO cached data
      initialLoadDoneRef.current.delete(selectedChannelId);
      setMessages(selectedChannelId, []);
      setPagination(selectedChannelId, { nextOffset: 0, hasOlder: false });
      isLoadingOlderRef.current = false;
      setIsLoadingOlder(false);
    }

    // Always fetch in the background to sync any missed messages silently
    loadMessages(selectedChannelId).then(
      ({ messages: msgs, pagination: pag }) => {
        // Ensure we haven't switched channels while this request was in flight
        if (useChatStore.getState().selectedChannelId !== selectedChannelId) return;

        setMessages(selectedChannelId, msgs);
        setPagination(selectedChannelId, pag);

        if (!initialLoadDoneRef.current.has(selectedChannelId)) {
          setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "auto" });
            setIsAtBottom(true);
            initialLoadDoneRef.current.add(selectedChannelId);
          }, 50); // Faster timeout since DOM is likely already painted
        }

        // Mark channel as read in the background (only for real channels)
        if (selectedChannelId > 0) {
          markChannelRead(selectedChannelId).catch(() => {});
        }
      },
    );
  }, [selectedChannelId, setMessages, setPagination, myUserId, markChannelRead]);

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
    setShowRightPanel(false);
    setChannelMembers([]);
  }, [selectedChannelId]);

  const fetchChannelMembers = useCallback(() => {
    // FIX: Only fetch members for real (positive ID) channels
    if (selectedChannelId && selectedChannelId > 0) {
      getChannelMembers(selectedChannelId)
        .then(setChannelMembers)
        .catch(() => {});
    }
  }, [selectedChannelId]);

  // Fetch members and presence when panel is opened
  useEffect(() => {
    if (showRightPanel && selectedChannelId && selectedChannelId > 0) {
      fetchChannelMembers();
        
      const fetchPresence = () => {
        workspaceService.getOnlineMembers()
          .then((data: any) => setOnlineUsers(data?.online_users || []))
          .catch(() => {});
      };

      fetchPresence(); // Fetch immediately
      const interval = setInterval(fetchPresence, 15000); // Poll every 15s

      return () => clearInterval(interval); // Cleanup on close
    }
  }, [showRightPanel, selectedChannelId]);

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

    const handleSendThread = useCallback((content: string) => {
    if (!selectedChannelId || !activeThread || !isReady()) return;

    const clientId = crypto.randomUUID();
    const tempId = -Date.now();
    const myUsername = localStorage.getItem("username") || "You";

    const optimisticMsg: Message = {
      id: tempId,
      channel: selectedChannelId,
      sender: { id: myUserId, username: myUsername, first_name: "", last_name: "", full_name: myUsername },
      sender_name: myUsername,
      content: content,
      display_content: content,
      client_id: clientId,
      is_edited: false,
      edited_at: null,
      is_deleted: false,
      reply_to: activeThread,
      attachments: [],
      reactions: [],
      reads: [],
      created_at: new Date().toISOString(),
      created_time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      _status: "pending",
    };

    const currentMsgs = messages[selectedChannelId] || [];
    setMessages(selectedChannelId, [...currentMsgs, optimisticMsg]);

    wsSend({
      type: "message",
      content: content,
      client_id: clientId,
      reply_to: activeThread.id,
    });
  }, [selectedChannelId, activeThread, isReady, wsSend, messages, setMessages, myUserId]);

  const handleSend = useCallback(async () => {
    if (!selectedChannelId || !selectedChannel) return;

    // FIX: Intercept send for Temporary DM Request channels
    if ((selectedChannel as any).is_temp) {
      const content = messageInput.trim();
      if (!content) return;

      const clientId = crypto.randomUUID();
      const tempId = -Date.now();
      const myUsername = localStorage.getItem("username") || "You";

      const optimisticMsg: Message = {
        id: tempId,
        channel: selectedChannelId,
        sender: { id: myUserId, username: myUsername, first_name: "", last_name: "", full_name: myUsername },
        sender_name: myUsername,
        content: content,
        display_content: content,
        client_id: clientId,
        is_edited: false,
        edited_at: null,
        is_deleted: false,
        reply_to: null,
        attachments: [],
        reactions: [],
        reads: [],
        created_at: new Date().toISOString(),
        created_time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        _status: "pending",
      };

      // Add message locally
      const currentMsgs = messages[selectedChannelId] || [];
      setMessages(selectedChannelId, [...currentMsgs, optimisticMsg]);
      
      // Lock the input by marking request as pending
      useChatStore.getState().updateChannel(selectedChannelId, { is_request_pending: true });
      setMessageInput("");

      // Send API Request
      try {
        await createDMRequest({
          receiver_id: (selectedChannel as any).dm_partner.id,
          initial_message: content,
        });
        
        // Update workspace users so they don't show up in search again
        refreshWorkspaceUsers();
      } catch (err: any) {
        alert(err.message || "Failed to send DM request");
        // Remove the optimistic message and unlock on failure
        setMessages(selectedChannelId, currentMsgs);
        useChatStore.getState().updateChannel(selectedChannelId, { is_request_pending: false });
      }
      return; // Stop normal WS send
    }

    if (pendingFiles.length > 0) {
      uploadFiles(pendingFiles);
      setPendingFiles([]);
    }

    if (messageInput.trim()) {
      if (!isReady()) {
        console.warn("WebSocket not ready");
        return;
      }

      const clientId = crypto.randomUUID();
      const tempId = -Date.now(); // Negative ID to avoid collision
      const myUsername = localStorage.getItem("username") || "You";

      const optimisticMsg: Message = {
        id: tempId,
        channel: selectedChannelId,
        sender: { id: myUserId, username: myUsername, first_name: "", last_name: "", full_name: myUsername },
        sender_name: myUsername,
        content: messageInput,
        display_content: messageInput,
        client_id: clientId,
        is_edited: false,
        edited_at: null,
        is_deleted: false,
        reply_to: replyingTo ? replyingTo : null,
        attachments: [],
        reactions: [],
        reads: [],
        created_at: new Date().toISOString(),
        created_time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        _status: "pending",
      };

      // Add optimistic message to store immediately
      const currentMsgs = messages[selectedChannelId] || [];
      setMessages(selectedChannelId, [...currentMsgs, optimisticMsg]);

      const contentCopy = messageInput;
      const replyToCopy = replyingTo ? replyingTo.id : null;
      
      setMessageInput("");
      setReplyingTo(null);

      try {
        if (isReady()) {
          // Use WebSocket if available
          wsSend({
            type: "message",
            content: contentCopy,
            client_id: clientId, // Send client_id for deduplication
            ...(replyToCopy ? { reply_to: replyToCopy } : {}),
          });
        } else {
          // Fallback to HTTP if WebSocket is not connected
          import("../services/channelService").then(({ sendMessageHttp }) => {
            sendMessageHttp({
              channel_id: selectedChannelId,
              content: contentCopy,
              client_id: clientId,
              reply_to_id: replyToCopy || null,
            }).catch(() => {
              // If HTTP fails, remove the optimistic message
              const latestMsgs = useChatStore.getState().messages[selectedChannelId] || [];
              setMessages(selectedChannelId, latestMsgs.filter(m => m.id !== tempId));
              alert("Failed to send message. Please try again.");
            });
          });
        }
      } catch (err) {
        // If wsSend throws synchronously, fallback to HTTP
        import("../services/channelService").then(({ sendMessageHttp }) => {
          sendMessageHttp({
            channel_id: selectedChannelId,
            content: contentCopy,
            client_id: clientId,
            reply_to_id: replyToCopy || null,
          }).catch(() => {
            const latestMsgs = useChatStore.getState().messages[selectedChannelId] || [];
            setMessages(selectedChannelId, latestMsgs.filter(m => m.id !== tempId));
            alert("Failed to send message. Please try again.");
          });
        });
      }

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
    messages,
    setMessages,
    myUserId,
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
    try {
      if (newChannelType === "dm") {
        if (!newChannelDMUserId) return;
        try {
          // Backend creates a PENDING DM Request, NOT a channel.
          await createDMRequest({
            receiver_id: Number(newChannelDMUserId),
            initial_message: newChannelDMMessage || "Hello!",
          });
          
          // Show success state or notify user that request is pending
          // We do NOT add a channel or switch to it until the receiver accepts.
          alert("DM Request sent! You can start chatting once they accept.");
        } catch (err: any) {
          console.error("DM request failed:", err.message);
          alert(err.message || "Failed to send DM request");
        }
      } else {
        if (!newChannelName.trim()) return;
        const newChat = await createChannelService({
          name: newChannelName,
          channel_type: newChannelType as any,
          team_id: newChannelType === "team" && newChannelTeamId ? Number(newChannelTeamId) : undefined,
        });
        addChannel(newChat);
        selectChannel(newChat.id);
      }
    } catch (error) {
      console.error("Failed to create channel:", error);
    }
    setNewChannelName("");
    setNewChannelType("private_group");
    setNewChannelTeamId("");
    setNewChannelMemberIds([]);
    setNewChannelDMUserId("");
    setNewChannelDMMessage("");
    setShowNewChannel(false);
  }, [newChannelName, newChannelType, newChannelTeamId, newChannelDMUserId, newChannelDMMessage, addChannel, selectChannel]);

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

  const refreshWorkspaceUsers = useCallback(() => {
    getWorkspaceUsers()
      .then((data) => setWorkspaceUsers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleStartDMRequest = useCallback((userId: number) => {
    const user = workspaceUsers.find(u => u.id === userId);
    if (!user) return;

    // 1. Create a temporary local channel to open the chat window
    const tempId = -Date.now(); // Negative ID to avoid collision with backend
    const tempChannel: any = {
      id: tempId,
      name: user.full_name || user.username,
      slug: `temp_dm_${user.id}`,
      is_private: true,
      is_dm: true,
      channel_type: "dm",
      workspace: Number(getWorkspaceId()),
      created_by: myUserId,
      created_at: new Date().toISOString(),
      member_count: 2,
      dm_partner: { id: user.id, username: user.username, full_name: user.full_name },
      is_member_active: true,
      is_pending: false,
      is_temp: true, // Flag to identify this is a temporary request channel
      is_request_pending: false, // Flag to lock input after sending
    };

    addChannel(tempChannel);
    selectChannel(tempId);
  }, [workspaceUsers, addChannel, selectChannel, myUserId]);

  // ── Catch Send Message Route from Team Page ───────────────────────────────
  useEffect(() => {
    if (authChecked) {
      const dmUserId = localStorage.getItem("start_dm_user_id");
      if (dmUserId) {
        localStorage.removeItem("start_dm_user_id");
        handleStartDMRequest(Number(dmUserId));
      }
    }
  }, [authChecked, handleStartDMRequest]);

  const handleAcceptDM = useCallback(async () => {
    const reqId = (selectedChannel as any)?.dm_request_id;
    if (!reqId) return;
    try {
      const result = await respondDMRequest(reqId, { status: "accepted" });
      // Backend returns the real dm_channel_id after acceptance.
      // We must replace the pending channel in the store with the real one
      // and switch to it so messaging is fully unlocked.
      const realChannelId = result.dm_channel_id;
      if (realChannelId && selectedChannel) {
        // Reload DMs from server to get the fresh real channel
        const freshDMs = await loadDMs();
        const realChannel = freshDMs.find((c) => c.id === realChannelId);
        if (realChannel) {
          // Remove temp/pending channel, add real one
          useChatStore.getState().removeChannel(selectedChannel.id);
          useChatStore.getState().addChannel(realChannel);
          selectChannel(realChannelId);
        } else {
          // Fallback: just unlock the existing channel
          useChatStore.getState().updateChannel(selectedChannel.id, {
            is_pending: false,
            id: realChannelId,
          });
          selectChannel(realChannelId);
        }
      } else {
        // No channel ID returned — just unlock in place
        if (selectedChannel) {
          useChatStore.getState().updateChannel(selectedChannel.id, { is_pending: false });
        }
      }
    } catch (error) {
      console.error("Failed to accept DM:", error);
    }
  }, [selectedChannel, selectChannel]);

  const handleBlockDM = useCallback(async () => {
    const reqId = (selectedChannel as any)?.dm_request_id;
    if (!reqId) return;
    try {
      await respondDMRequest(reqId, { status: "rejected" });
      // Remove the channel from the list locally
      if (selectedChannel) {
        useChatStore.getState().removeChannel(selectedChannel.id);
        selectChannel(null);
      }
    } catch (error) {
      console.error("Failed to block DM:", error);
    }
  }, [selectedChannel, selectChannel]);

  const handleReply = useCallback((msg: Message) => {
    // FIX: Only set inline reply preview. Do NOT open the thread panel.
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
    // 1. Optimistic UI Update - instantly REMOVE the message locally
    if (selectedChannelId) {
      const currentMsgs = messages[selectedChannelId] || [];
      setMessages(selectedChannelId, currentMsgs.filter((m) => m.id !== msgId));
    }

    setDeleteModalMsgId(null);

    // 2. Persist in backend
    try {
      await deleteMessageForEveryone(msgId);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  }, [selectedChannelId, messages, setMessages]);

  const handleDeleteForMe = useCallback(
    async (msgId: number) => {
      if (selectedChannelId) {
        // 1. Optimistic UI update
        const currentMsgs = messages[selectedChannelId] || [];
        setMessages(selectedChannelId, currentMsgs.filter((m) => m.id !== msgId));
        setDeleteModalMsgId(null);

        // 2. Persist in backend
        try {
          await hideMessageForMe(msgId);
        } catch (error) {
          console.error("Failed to hide message on backend:", error);
        }
      }
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
    newChannelTeamId,
    setNewChannelTeamId,
    newChannelMemberIds,
    setNewChannelMemberIds,
    newChannelDMUserId,
    setNewChannelDMUserId,
    newChannelDMMessage,
    setNewChannelDMMessage,
    workspaceUsers,
    userTeams,
    activeMenuMsgId,
    setActiveMenuMsgId,
    deleteModalMsgId,
    setDeleteModalMsgId,
    replyingTo,
    setReplyingTo,
    activeThread,
    setActiveThread,
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
    handleSendThread,
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
    handleStartDMRequest,
    refreshWorkspaceUsers,
    fetchChannelMembers,
    handleAcceptDM,
    handleBlockDM,
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
    isInitialLoading,
    showRightPanel,
    setShowRightPanel,
    rightPanelTab,
    setRightPanelTab,
    channelMembers,
    onlineUsers,
  };
}

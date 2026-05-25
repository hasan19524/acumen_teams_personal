"use client";

import { useWebSocket } from "@/features/chat/hooks/useWebSocket";
import { ConnectionStatus } from "@/features/chat/components/ConnectionStatus";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import {
  Search,
  Bell,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { ChevronDown } from "lucide-react";

type ChatUser = {
  id: number;
  name: string;
  avatar: string;
  color: string;
  unread: number;
  last: string;
  channel_id: number;
};

type MessageType = {
  id?: number;
  sender: string;
  sender_id?: number;
  text: string;
  time: string;
};

type PaginationState = {
  nextOffset: number;
  hasOlder: boolean;
};

export default function ChatPage() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // --- NEW: Refs for synchronization & stability (Fixes 2, 4, 5, 8) ---
  const selectedChatRef = useRef<ChatUser | null>(null);
  const isAtBottomRef = useRef(true);
  const isLoadingOlderRef = useRef(false); // Issue 4: Sync concurrency lock
  const initialLoadDoneRef = useRef<Set<number>>(new Set()); // Issue 2: Track initial loads
  const prevScrollHeightRef = useRef(0); // Issue 8: Scroll restoration

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [conversations, setConversations] = useState<ChatUser[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Record<number, MessageType[]>>({});
  const [pagination, setPagination] = useState<Record<number, PaginationState>>(
    {},
  );
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");

  const MAX_MESSAGES = 200; // Issue 6: Memory cap per channel

  const { authChecked } = useAuth();

  const myUserId =
    typeof window !== "undefined"
      ? parseInt(localStorage.getItem("user_id") || "0")
      : 0;

  // Keep selectedChat ref in sync to avoid stale closures (Fix 5)
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

  const {
    state: wsState,
    send: wsSend,
    isReady,
  } = useWebSocket({
    channelId: selectedChat?.channel_id ?? null,
    onMessage: (data) => {
      // Issue 5: Use ref to avoid stale closure channel mismatch
      const currentChat = selectedChatRef.current;
      if (!currentChat) return;

      if (data.type === "message") {
        // Use channel_id from WS payload (requires consumer fix), fallback to currentChat
        const targetChannelId = data.channel_id || currentChat.channel_id;

        const newMsg = {
          id: data.id,
          sender: data.sender,
          sender_id: data.sender_id,
          text: data.content,
          time: new Date(data.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setMessages((prev) => {
          const existing = prev[targetChannelId] || [];

          // Issue 1: Deduplicate WS insertions
          if (newMsg.id && existing.some((m) => m.id === newMsg.id)) {
            return prev;
          }

          const updated = [...existing, newMsg];

          // Issue 6: Cap memory growth
          const trimmed =
            updated.length > MAX_MESSAGES
              ? updated.slice(updated.length - MAX_MESSAGES)
              : updated;

          return { ...prev, [targetChannelId]: trimmed };
        });

        // Auto-scroll only if user is at bottom
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
    // Reset state for new channel
    initialLoadDoneRef.current.delete(selectedChat.channel_id);
    setMessages((prev) => ({ ...prev, [selectedChat.channel_id]: [] }));
    setPagination((prev) => ({
      ...prev,
      [selectedChat.channel_id]: { nextOffset: 0, hasOlder: false },
    }));
    isLoadingOlderRef.current = false;
    setIsLoadingOlder(false);
    loadMessages(selectedChat.channel_id);
  }, [selectedChat?.channel_id]);

  // Issue 8: Scroll restoration after prepending older messages
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
      // 1. Get total count
      const countRes = await apiFetch(
        `/api/chat/messages/${channelId}/?limit=1&offset=0`,
      );
      const countData = await countRes.json();
      const total = countData.total || 0;

      // 2. Calculate offset for LATEST messages (Ascending order)
      const initialOffset = Math.max(0, total - limit);

      const res = await apiFetch(
        `/api/chat/messages/${channelId}/?limit=${limit}&offset=${initialOffset}`,
      );
      const data = await res.json();
      const rawMessages = Array.isArray(data.results) ? data.results : [];

      const parsed = rawMessages.map((msg: any) => ({
        id: msg.id,
        sender: msg.sender?.username || "User",
        sender_id: msg.sender?.id,
        text: msg.content,
        time: new Date(msg.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      setMessages((prev) => ({ ...prev, [channelId]: parsed }));

      // 3. Set pagination state
      setPagination((prev) => ({
        ...prev,
        [channelId]: {
          nextOffset: Math.max(0, initialOffset - limit), // Issue 3: Clamp offset
          hasOlder: initialOffset > 0,
        },
      }));

      // Issue 2: Auto-scroll ONLY on initial load
      if (!initialLoadDoneRef.current.has(channelId)) {
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: "auto" });
          setIsAtBottom(true);
          initialLoadDoneRef.current.add(channelId);
        }, 100);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessages((prev) => ({ ...prev, [channelId]: [] }));
    }
  };

  const loadOlderMessages = async () => {
    if (!selectedChat) return;

    // Issue 4: Synchronous concurrency lock
    if (isLoadingOlderRef.current) return;

    const pag = pagination[selectedChat.channel_id];
    if (!pag || !pag.hasOlder) return;

    isLoadingOlderRef.current = true;
    setIsLoadingOlder(true);

    const limit = 30;
    const offset = pag.nextOffset;

    // Save scroll height before state update (Fix 8)
    if (messagesContainerRef.current) {
      prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
    }

    try {
      const res = await apiFetch(
        `/api/chat/messages/${selectedChat.channel_id}/?limit=${limit}&offset=${offset}`,
      );
      const data = await res.json();
      const rawMessages = Array.isArray(data.results) ? data.results : [];

      if (rawMessages.length === 0) {
        setPagination((prev) => ({
          ...prev,
          [selectedChat.channel_id]: {
            ...prev[selectedChat.channel_id],
            hasOlder: false,
          },
        }));
        isLoadingOlderRef.current = false;
        setIsLoadingOlder(false);
        return;
      }

      const parsed = rawMessages.map((msg: any) => ({
        id: msg.id,
        sender: msg.sender?.username || "User",
        sender_id: msg.sender?.id,
        text: msg.content,
        time: new Date(msg.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      setMessages((prev) => {
        const existing: MessageType[] = prev[selectedChat.channel_id] || [];

        // Explicitly type 'm' as MessageType
        const existingIds = new Set(existing.map((m: MessageType) => m.id));

        // Explicitly type 'm' as MessageType
        const newMsgs = parsed.filter(
          (m: MessageType) => !m.id || !existingIds.has(m.id),
        );

        const updated = [...newMsgs, ...existing];
        const trimmed =
          updated.length > MAX_MESSAGES
            ? updated.slice(0, MAX_MESSAGES)
            : updated;
        return { ...prev, [selectedChat.channel_id]: trimmed };
      });

      // Update pagination pointer
      setPagination((prev) => ({
        ...prev,
        [selectedChat.channel_id]: {
          nextOffset: Math.max(0, offset - limit), // Issue 3: Clamp offset
          hasOlder: offset > 0,
        },
      }));
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
      100;
    setIsAtBottom(isBottom);

    if (container.scrollTop < 100) {
      loadOlderMessages();
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
  };

  const handleSend = () => {
    if (!selectedChat || !messageInput.trim()) return;
    if (!isReady()) {
      console.warn("WebSocket not ready");
      return;
    }

    wsSend({
      type: "message",
      content: messageInput,
    });

    setMessageInput("");
  };

  const filteredChats = conversations.filter((chat) =>
    chat.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (!authChecked) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#0b0c14",
        color: "#fff",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* SHARED SIDEBAR */}
      <DashboardSidebar />

      {/* CHAT LIST */}
      <section
        style={{
          width: 320,
          background: "#12141f",
          borderRight: "1px solid rgba(255,255,255,.05)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <h2 style={{ margin: 0 }}>Chats</h2>
            <button
              onClick={() => setShowNewChannel(true)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg,#6366f1,#818cf8)",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 300,
              }}
            >
              +
            </button>
          </div>

          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{ position: "absolute", top: 13, left: 14, opacity: 0.5 }}
            />
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px 12px 38px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.05)",
                background: "#1a1d2b",
                color: "#fff",
                outline: "none",
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              style={{
                padding: 12,
                borderRadius: 14,
                marginBottom: 8,
                cursor: "pointer",
                background:
                  selectedChat?.id === chat.id
                    ? "rgba(99,102,241,.15)"
                    : "transparent",
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background: chat.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                }}
              >
                {chat.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <strong>{chat.name}</strong>
                <div style={{ fontSize: 13, opacity: 0.6 }}>{chat.last}</div>
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
          background: "#0b0c14",
          height: "100vh",
          maxHeight: "100vh",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255,255,255,.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#11131d",
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>
              {selectedChat?.name || "Select Chat"}
            </div>
            <ConnectionStatus state={wsState} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {[Phone, Video, MoreVertical].map((Icon, i) => (
              <div
                key={`header-icon-${i}`}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(255,255,255,.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={18} />
              </div>
            ))}
          </div>
        </div>

        {/* MESSAGES */}
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            style={{
              width: "100%",
              height: "100%",
              overflowY: "auto",
              overflowX: "hidden",
              overflowAnchor: 'auto',
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* Load Older Indicator */}
            {selectedChat && pagination[selectedChat.channel_id]?.hasOlder && (
              <div
                style={{
                  textAlign: "center",
                  padding: 10,
                  opacity: 0.6,
                  fontSize: 14,
                }}
              >
                {isLoadingOlder
                  ? "Loading older messages..."
                  : "Scroll up to load more"}
              </div>
            )}

            {selectedChat && messages[selectedChat.channel_id]?.length > 0 ? (
              messages[selectedChat.channel_id].map((msg) => {
                const mine = msg.sender_id === myUserId;
                return (
                  <div
                    key={msg.id} // Fix 7: No index fallback, ID is enforced
                    style={{
                      display: "flex",
                      justifyContent: mine ? "flex-end" : "flex-start",
                      alignItems: "flex-end",
                      gap: 8,
                    }}
                  >
                    {!mine && (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        {msg.sender.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ maxWidth: "65%" }}>
                      {!mine && (
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#818cf8",
                            marginBottom: 4,
                            paddingLeft: 2,
                          }}
                        >
                          {msg.sender}
                        </div>
                      )}
                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: mine
                            ? "16px 16px 4px 16px"
                            : "16px 16px 16px 4px",
                          background: mine
                            ? "linear-gradient(135deg,#6366f1,#818cf8)"
                            : "#1a1d2b",
                        }}
                      >
                        <div style={{ fontSize: 14 }}>{msg.text}</div>
                        <div
                          style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}
                        >
                          {msg.time}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ opacity: 0.6 }}>No messages yet.</div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Down Arrow Button */}
          {!isAtBottom && (
            <button
              onClick={scrollToBottom}
              style={{
                position: "absolute",
                bottom: 20,
                right: 20,
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#6366f1,#818cf8)",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
                zIndex: 10,
              }}
            >
              ↓
            </button>
          )}
        </div>

        {/* INPUT */}
        <div
          style={{
            padding: 18,
            borderTop: "1px solid rgba(255,255,255,.05)",
            background: "#11131d",
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            {[Paperclip, Smile].map((Icon, i) => (
              <div
                key={`input-icon-${i}`}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "rgba(255,255,255,.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={18} />
              </div>
            ))}
            <input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type message..."
              disabled={wsState !== "connected"}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.05)",
                background: "#1a1d2b",
                color: "#fff",
                outline: "none",
                opacity: wsState !== "connected" ? 0.5 : 1,
              }}
            />
            <button
              disabled={sending || !isReady()}
              onClick={handleSend}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg,#6366f1,#818cf8)",
                color: "#fff",
                cursor: !sending && isReady() ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: !sending && isReady() ? 1 : 0.5,
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* CREATE CHANNEL MODAL */}
      {showNewChannel && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "#12141f",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 20,
              padding: 28,
              width: 360,
            }}
          >
            <h3 style={{ margin: "0 0 18px", color: "#fff", fontSize: 18 }}>
              New Channel
            </h3>
            <input
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createChannel()}
              placeholder="Channel name (e.g. general)"
              autoFocus
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.1)",
                background: "#1a1d2b",
                color: "#fff",
                outline: "none",
                fontSize: 14,
                boxSizing: "border-box" as const,
              }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                onClick={() => {
                  setShowNewChannel(false);
                  setNewChannelName("");
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,.1)",
                  background: "transparent",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={createChannel}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg,#6366f1,#818cf8)",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

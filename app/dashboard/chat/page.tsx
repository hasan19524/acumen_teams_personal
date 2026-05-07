"use client";

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

const API_URL = "http://127.0.0.1:8000";

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
  text: string;
  time: string;
};

export default function ChatPage() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [conversations, setConversations] = useState<ChatUser[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Record<number, MessageType[]>>({});
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");

  const { authChecked } = useAuth();

  useEffect(() => {
    if (!authChecked) return;
    loadChannels();
  }, [authChecked]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChat]);

  useEffect(() => {
    if (!selectedChat) return;

    // Load history from REST API first
    loadMessages(selectedChat.channel_id);

    // Close previous WebSocket if switching channels
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Open new WebSocket for this channel
    const ws = new WebSocket(
      `ws://127.0.0.1:8000/ws/chat/${selectedChat.channel_id}/`,
    );

    ws.onopen = () => {
      console.log("WebSocket connected to channel", selectedChat.channel_id);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const newMsg = {
        sender: data.sender,
        text: data.content,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => ({
        ...prev,
        [selectedChat.channel_id]: [
          ...(prev[selectedChat.channel_id] || []),
          newMsg,
        ],
      }));
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [selectedChat]);

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
      const res = await apiFetch(`/api/chat/messages/${channelId}/`);
      const data = await res.json();
      const rawMessages = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
          ? data.results
          : [];
      const parsed = rawMessages.map((msg: any) => ({
        id: msg.id,
        sender: msg.sender?.username || "User",
        text: msg.content,
        time: new Date(msg.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
      setMessages((prev) => ({ ...prev, [channelId]: parsed }));
    } catch {
      setMessages((prev) => ({ ...prev, [channelId]: [] }));
    }
  };

  const handleSend = () => {
    if (!selectedChat || !messageInput.trim()) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const username = localStorage.getItem("username") || "User";

    wsRef.current.send(
      JSON.stringify({
        content: messageInput,
        sender: username,
      }),
    );

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
            <div style={{ fontSize: 13, opacity: 0.6 }}>Active now</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {[Phone, Video, MoreVertical].map((Icon, i) => (
              <div
                key={i}
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
            overflowY: "auto",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {(selectedChat &&
            messages[selectedChat.channel_id]?.map((msg, i) => {
              const mine = msg.sender === localStorage.getItem("username");
              return (
                <div
                  key={i}
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
                      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                        {msg.time}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })) || <div style={{ opacity: 0.6 }}>No messages yet.</div>}
          <div ref={bottomRef} />
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
                key={i}
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
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.05)",
                background: "#1a1d2b",
                color: "#fff",
                outline: "none",
              }}
            />
            <button
              disabled={sending}
              onClick={handleSend}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg,#6366f1,#818cf8)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  Calendar,
  Megaphone,
  Users,
  Settings,
  LogOut,
  Search,
  Bell,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
} from "lucide-react";

/* ============================= */
/* CONFIG */
/* ============================= */

const API_URL = "http://127.0.0.1:8000";

/* ============================= */
/* TYPES */
/* ============================= */

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

/* ============================= */
/* PAGE */
/* ============================= */

export default function ChatPage() {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [search, setSearch] = useState("");
  const [messageInput, setMessageInput] = useState("");

  const [conversations, setConversations] = useState<ChatUser[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatUser | null>(null);

  const [messages, setMessages] = useState<Record<number, MessageType[]>>({});

  /* ============================= */
  /* AUTH CHECK */
  /* ============================= */

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    loadChannels();
  }, []);

  /* ============================= */
  /* AUTO SCROLL */
  /* ============================= */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChat]);

  /* ============================= */
  /* AUTO REFRESH */
  /* ============================= */

  useEffect(() => {
    if (!selectedChat) return;

    loadMessages(selectedChat.channel_id);

    const interval = setInterval(() => {
      loadMessages(selectedChat.channel_id);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedChat]);

  /* ============================= */
  /* HELPERS */
  /* ============================= */

  const authHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

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

  /* ============================= */
  /* LOAD CHANNELS */
  /* ============================= */

  const loadChannels = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chat/channels/`, {
        headers: authHeaders(),
      });

      const data = await res.json();

      const parsed = data.map((item: any, index: number) => ({
        id: item.id,
        name: item.name,
        avatar: item.name?.charAt(0)?.toUpperCase(),
        color: randomColor(),
        unread: 0,
        last: "Open conversation",
        channel_id: item.id,
      }));

      setConversations(parsed);

      if (parsed.length > 0) {
        setSelectedChat(parsed[0]);
      }

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  /* ============================= */
  /* LOAD MESSAGES */
  /* ============================= */

 const loadMessages = async (channelId: number) => {
  try {
    const res = await fetch(
      `${API_URL}/api/chat/messages/${channelId}/`,
      {
        headers: authHeaders(),
      }
    );

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

    setMessages((prev) => ({
      ...prev,
      [channelId]: parsed,
    }));
  } catch (error) {
    console.error(error);

    setMessages((prev) => ({
      ...prev,
      [channelId]: [],
    }));
  }
};

  /* ============================= */
  /* SEND MESSAGE */
  /* ============================= */

  const handleSend = async () => {
    if (!selectedChat) return;
    if (!messageInput.trim()) return;

    setSending(true);

    try {
      const res = await fetch(`${API_URL}/api/chat/send/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          channel_id: selectedChat.channel_id,
          content: messageInput,
        }),
      });

      if (res.ok) {
        setMessageInput("");
        await loadMessages(selectedChat.channel_id);
      }
    } catch (error) {
      console.error(error);
    }

    setSending(false);
  };

  /* ============================= */
  /* LOGOUT */
  /* ============================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    router.push("/login");
  };

  /* ============================= */
  /* FILTER */
  /* ============================= */

  const filteredChats = conversations.filter((chat) =>
    chat.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ============================= */
  /* UI */
  /* ============================= */

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "68px 320px 1fr",
        background: "#0b0c14",
        color: "#fff",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* LEFT SIDEBAR */}
      <aside
        style={{
          background: "#11131d",
          borderRight: "1px solid rgba(255,255,255,.05)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "16px 10px",
          gap: 14,
        }}
      >
        {[
          { href: "/dashboard", icon: LayoutDashboard },
          { href: "/dashboard/chat", icon: MessageSquare },
          { href: "/dashboard/tasks", icon: CheckSquare },
          { href: "/dashboard/attendance", icon: Calendar },
          { href: "/dashboard/announcements", icon: Megaphone },
          { href: "/dashboard/team", icon: Users },
          { href: "/dashboard/settings", icon: Settings },
        ].map((item, i) => {
          const Icon = item.icon;
          const active = item.href === "/dashboard/chat";

          return (
            <Link
              key={i}
              href={item.href}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: active
                  ? "linear-gradient(135deg,#6366f1,#818cf8)"
                  : "rgba(255,255,255,.04)",
                color: "#fff",
              }}
            >
              <Icon size={20} />
            </Link>
          );
        })}

        <div style={{ marginTop: "auto" }}>
          <button
            onClick={handleLogout}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: "none",
              background: "#ef4444",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* CHAT LIST */}
      <section
        style={{
          background: "#12141f",
          borderRight: "1px solid rgba(255,255,255,.05)",
          display: "flex",
          flexDirection: "column",
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

            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(255,255,255,.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={18} />
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                top: 13,
                left: 14,
                opacity: 0.5,
              }}
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
                <div style={{ fontSize: 13, opacity: 0.6 }}>
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
            <div style={{ fontSize: 13, opacity: 0.6 }}>
              Active now
            </div>
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
              const mine = msg.sender !== selectedChat.name;

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: mine
                      ? "flex-end"
                      : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "65%",
                      padding: "12px 16px",
                      borderRadius: 16,
                      background: mine
                        ? "linear-gradient(135deg,#6366f1,#818cf8)"
                        : "#1a1d2b",
                    }}
                  >
                    <div>{msg.text}</div>

                    <div
                      style={{
                        fontSize: 11,
                        opacity: 0.6,
                        marginTop: 6,
                      }}
                    >
                      {msg.time}
                    </div>
                  </div>
                </div>
              );
            })) || (
            <div style={{ opacity: 0.6 }}>
              No messages yet.
            </div>
          )}

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
              onChange={(e) =>
                setMessageInput(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" && handleSend()
              }
              placeholder="Type message..."
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.05)",
                background: "#1a1d2b",
                color: "#fff",
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
                background:
                  "linear-gradient(135deg,#6366f1,#818cf8)",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
// features/chat/components/ChatSidebar.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Users,
  Building2,
  Folder,
  MessageSquare,
  Pin,
  BellOff,
  CheckCheck,
  Trash2,
  Eraser,
  UserPlus,
  Inbox,
  ChevronDown,
  X,
  ArrowLeft,
  Check,
} from "lucide-react";
import { T } from "../design/tokens";
import { Channel } from "../types/channel";
import { useChatStore } from "../store/chatStore";
import {
  loadChannels,
  loadDMs,
  clearChat,
  deleteChat,
} from "../services/channelService";
import { loadDMRequests, respondDMRequest } from "../services/dmRequestService";
import { loadInviteTab, respondGroupInvite } from "../services/inviteService";
import Avatar from "@/components/Avatar";
import { useProfileStore } from "@/features/dashboard/store/profileStore";

interface ChatSidebarProps {
  width?: string | number;
  search: string;
  setSearch: (v: string) => void;
  filteredChats: Channel[];
  selectedChannel: Channel | null;
  selectChannel: (id: number) => void;
  showNewChannel: boolean;
  setShowNewChannel: (v: boolean) => void;
  newChannelName: string;
  setNewChannelName: (v: string) => void;
  newChannelType: string;
  setNewChannelType: (v: string) => void;
  newChannelTeamId: string;
  setNewChannelTeamId: (v: string) => void;
  newChannelMemberIds: number[];
  setNewChannelMemberIds: (v: number[]) => void;
  workspaceUsers: Array<{
    id: number;
    username: string;
    full_name: string;
    has_dm?: boolean;
    has_pending_request?: boolean;
  }>;
  userTeams: Array<{ id: number; name: string }>;
  onCreateChannel: () => void;
  onStartDMRequest: (userId: number) => void;
  onRefreshWorkspaceUsers: () => void;
}

const formatChatTime = (isoString: string | null | undefined) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

function ChannelIcon({ chat }: { chat: Channel }) {
  switch (chat.channel_type) {
    case "official": // intentional fallthrough for system/official channels
      return (
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: T.radiusSm,
            background: T.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Building2 size={18} color="#fff" />
        </div>
      );
    case "team":
      return (
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: T.radiusSm,
            background: T.indigo,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Users size={18} color="#fff" />
        </div>
      );
    case "private_group":
      return (
        <Avatar
          src={(chat as any)?.avatar_url}
          name={chat.name}
          size="md"
          className="rounded-lg"
        />
      );
    case "dm": {
      const myUsername =
        typeof window !== "undefined"
          ? localStorage.getItem("username") || ""
          : "";
      const dmName =
        chat.dm_partner?.full_name ||
        chat.dm_partner?.username ||
        (
          chat.name.split(",").find((n) => n.trim() !== myUsername) || "Unknown"
        ).trim();
      return <Avatar user={chat.dm_partner} name={dmName} size="md" />;
    }
    default:
      return (
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: T.radiusSm,
            background: T.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Users size={18} color="#fff" />
        </div>
      );
  }
}

interface ChatItemProps {
  chat: Channel;
  isSelected: boolean;
  onSelect: () => void;
  isPinned: boolean;
  isMuted: boolean;
  onTogglePin: () => void;
  onToggleMute: () => void;
  onToggleRead: () => void;
  onClearChat: () => void;
  onDeleteChat: () => void;
}

function ChatItem({
  chat,
  isSelected,
  onSelect,
  isPinned,
  isMuted,
  onTogglePin,
  onToggleMute,
  onToggleRead,
  onClearChat,
  onDeleteChat,
}: ChatItemProps) {
  const unread = chat.unread_count || 0;
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const openProfile = useProfileStore((s) => s.openProfile);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Adjust position so menu doesn't overflow screen
    const menuWidth = 200;
    const menuHeight = 160;
    let x = e.clientX;
    let y = e.clientY;
    if (x + menuWidth > window.innerWidth)
      x = window.innerWidth - menuWidth - 10;
    if (y + menuHeight > window.innerHeight)
      y = window.innerHeight - menuHeight - 10;

    setMenuPos({ x, y });
  };

  // Removed the global useEffect listener.
  // We will use a full-screen backdrop div below to catch outside clicks.

  const menuItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    color: T.textSecondary,
    cursor: "pointer",
    fontSize: 13,
    width: "100%",
    background: "transparent",
    border: "none",
    textAlign: "left",
  };

  return (
    <>
      <div
        onClick={onSelect}
        onContextMenu={handleContextMenu}
        style={{
          padding: "10px 12px",
          borderRadius: T.radiusMd,
          marginBottom: 2,
          cursor: "pointer",
          background: isSelected ? T.accentMuted : "transparent",
          display: "flex",
          gap: T.gapMd,
          alignItems: "center",
          transition: "background 0.1s",
          opacity: isMuted ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.background = T.bgHover;
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.background = "transparent";
        }}
      >
        <div
          onClick={(e) => {
            if (chat.channel_type === "dm" && chat.dm_partner) {
              e.stopPropagation();
              openProfile(chat.dm_partner);
            }
          }}
          style={{ display: "flex", alignItems: "center" }}
        >
          <ChannelIcon chat={chat} />
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: T.fontSizeSm,
                fontWeight: unread > 0 ? 700 : 600,
                color: T.textPrimary,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {isPinned && (
                <Pin size={12} style={{ color: T.textMuted, flexShrink: 0 }} />
              )}
              {(() => {
                if (chat.channel_type !== "dm") return chat.name;
                const myUsername =
                  typeof window !== "undefined"
                    ? localStorage.getItem("username") || ""
                    : "";
                return (
                  chat.dm_partner?.full_name ||
                  chat.dm_partner?.username ||
                  (
                    chat.name.split(",").find((n) => n.trim() !== myUsername) ||
                    "Unknown User"
                  ).trim()
                );
              })()}
            </span>
            <span
              style={{
                fontSize: 10,
                color: unread > 0 ? T.accentHover : T.textMuted,
                marginLeft: 8,
                flexShrink: 0,
                fontWeight: unread > 0 ? 600 : 400,
              }}
            >
              {formatChatTime(chat.last_message_time)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 2,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: unread > 0 ? T.textSecondary : T.textMuted,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontWeight: unread > 0 ? 500 : 400,
              }}
            >
              {(() => {
                if (!chat.last_message) return "No messages yet";
                const sender = chat.last_message_sender;
                const myUsername =
                  typeof window !== "undefined"
                    ? localStorage.getItem("username") || ""
                    : "";
                if (chat.channel_type === "dm") {
                  return sender === myUsername
                    ? `You: ${chat.last_message}`
                    : `${sender || "User"}: ${chat.last_message}`;
                }
                return sender
                  ? `${sender}: ${chat.last_message}`
                  : chat.last_message;
              })()}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginLeft: 8,
                flexShrink: 0,
              }}
            >
              {isMuted && <BellOff size={12} style={{ color: T.textMuted }} />}
              {unread > 0 && (
                <span
                  style={{
                    background: T.accent,
                    color: "#fff",
                    borderRadius: "50%",
                    minWidth: 18,
                    height: 18,
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                  }}
                >
                  {unread}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {menuPos && (
        <>
          {/* Transparent backdrop to catch outside clicks */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setMenuPos(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenuPos(null);
            }}
          />
          <div
            style={{
              position: "fixed",
              top: menuPos.y,
              left: menuPos.x,
              zIndex: 100,
              background: T.bgModal,
              border: `1px solid ${T.borderHover}`,
              borderRadius: T.radiusMd,
              padding: "4px 0",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              minWidth: 200,
            }}
          >
            <button
              style={menuItemStyle}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = T.bgHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin();
                setMenuPos(null);
              }}
            >
              <Pin size={14} /> {isPinned ? "Unpin Chat" : "Pin Chat"}
            </button>
            <button
              style={menuItemStyle}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = T.bgHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
                setMenuPos(null);
              }}
            >
              <BellOff size={14} />{" "}
              {isMuted ? "Unmute Notifications" : "Mute Notifications"}
            </button>
            <button
              style={menuItemStyle}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = T.bgHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              onClick={(e) => {
                e.stopPropagation();
                onToggleRead();
                setMenuPos(null);
              }}
            >
              <CheckCheck size={14} />{" "}
              {unread > 0 ? "Mark as Read" : "Mark as Unread"}
            </button>

            {/* Only show Clear/Delete for DMs and Private Groups */}
            {(chat.channel_type === "dm" ||
              chat.channel_type === "private_group") && (
              <>
                <button
                  style={menuItemStyle}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = T.bgHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearChat();
                    setMenuPos(null);
                  }}
                >
                  <Eraser size={14} /> Clear Chat
                </button>
                {/* Divider */}
                <div
                  style={{ height: 1, background: T.border, margin: "4px 0" }}
                />
                <button
                  style={{ ...menuItemStyle, color: T.danger }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = T.dangerHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat();
                    setMenuPos(null);
                  }}
                >
                  <Trash2 size={14} /> Delete Chat
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}

export function ChatSidebar({
  width,
  search,
  setSearch,
  filteredChats,
  selectedChannel,
  selectChannel,
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
  workspaceUsers,
  userTeams,
  onCreateChannel,
  onStartDMRequest,
  onRefreshWorkspaceUsers,
}: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const openProfile = useProfileStore((s) => s.openProfile);
  const [groupInvites, setGroupInvites] = useState<any[]>([]);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showNewChatOverlay, setShowNewChatOverlay] = useState(false);
  const [overlayMode, setOverlayMode] = useState<"dm" | "group">("dm");
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [showRequestsList, setShowRequestsList] = useState(false);

  const handleCreateGroup = () => {
    if (!newChannelName.trim()) return; // Don't create if empty
    setNewChannelType("private_group");
    setNewChannelMemberIds(selectedMembers);
    onCreateChannel();
    setShowNewChatOverlay(false);
    setSelectedMembers([]);
    setNewChannelName(""); // Clear for next time
  };

  // Local UI state for context menu actions
  const [pinnedChats, setPinnedChats] = useState<Set<number>>(new Set());
  const [mutedChats, setMutedChats] = useState<Set<number>>(new Set());
  const [unreadOverrides, setUnreadOverrides] = useState<
    Record<number, number>
  >({});

  const setChannels = useChatStore((s) => s.setChannels);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const [dmData, groupData] = await Promise.all([
          loadDMRequests(),
          loadInviteTab("private_groups"),
        ]);
        setReceivedRequests(dmData.received || []);
        setGroupInvites(groupData.items || []);
      } catch (e) {}
    };
    fetchRequests();
  }, []);

  const handleAcceptGroupInvite = async (reqId: number) => {
    try {
      // FIX: Pass string instead of object
      await respondGroupInvite(reqId, "accepted");
      setGroupInvites((prev) => prev.filter((r) => r.id !== reqId));
      const [loadedChannels, loadedDms] = await Promise.all([
        loadChannels(),
        loadDMs(),
      ]);
      setChannels([...loadedChannels, ...loadedDms]);
    } catch (e) {
      alert("Failed to accept group invite");
    }
  };

  const handleDeclineGroupInvite = async (reqId: number) => {
    try {
      // FIX: Pass string instead of object
      await respondGroupInvite(reqId, "rejected");
      setGroupInvites((prev) => prev.filter((r) => r.id !== reqId));
    } catch (e) {
      alert("Failed to decline group invite");
    }
  };

  const handleAcceptDm = async (reqId: number) => {
    try {
      await respondDMRequest(reqId, { status: "accepted" });
      setReceivedRequests((prev) => prev.filter((r) => r.id !== reqId));
      const [loadedChannels, loadedDms] = await Promise.all([
        loadChannels(),
        loadDMs(),
      ]);
      setChannels([...loadedChannels, ...loadedDms]);
    } catch (e) {
      alert("Failed to accept request");
    }
  };

  const handleDeclineDm = async (reqId: number) => {
    try {
      await respondDMRequest(reqId, { status: "rejected" });
      setReceivedRequests((prev) => prev.filter((r) => r.id !== reqId));
    } catch (e) {
      alert("Failed to decline request");
    }
  };

  const togglePin = (id: number) => {
    setPinnedChats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleMute = (id: number) => {
    setMutedChats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleRead = (id: number, currentUnread: number) => {
    setUnreadOverrides((prev) => ({
      ...prev,
      [id]: currentUnread > 0 ? 0 : 1, // Toggle to 0 or 1
    }));
  };

  const handleClearChat = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to clear all messages in this chat? This cannot be undone.",
      )
    )
      return;
    try {
      await clearChat(id);
      // Optimistically clear locally as well
      useChatStore.getState().setMessages(id, []);
    } catch (err) {
      alert("Failed to clear chat.");
    }
  };

  const handleDeleteChat = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this chat? It will be removed from your sidebar.",
      )
    )
      return;
    try {
      await deleteChat(id);
      useChatStore.getState().removeChannel(id);
      if (useChatStore.getState().selectedChannelId === id) {
        useChatStore.getState().selectChannel(null);
      }
      // Refresh workspace users so the user becomes searchable again
      onRefreshWorkspaceUsers();
    } catch (err) {
      alert("Failed to delete chat.");
    }
  };

  const tabs = [
    { key: "all", label: "All" },
    { key: "official", label: "Workspace" },
    { key: "team", label: "Teams" },
    { key: "private_group", label: "Groups" },
    { key: "dm", label: "DMs" },
  ];

  // Combine channels and apply local overrides
  const processedChats = filteredChats.map((c) => ({
    ...c,
    unread_count:
      unreadOverrides[c.id] !== undefined
        ? unreadOverrides[c.id]
        : c.unread_count || 0,
  }));

  // Sort: Pinned first, then by last message time (Newest first)
  const sortedChats = [...processedChats].sort((a, b) => {
    const aPinned = pinnedChats.has(a.id);
    const bPinned = pinnedChats.has(b.id);

    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    // If both are pinned or both are unpinned, sort by latest message time
    const timeA = a.last_message_time
      ? new Date(a.last_message_time).getTime()
      : 0;
    const timeB = b.last_message_time
      ? new Date(b.last_message_time).getTime()
      : 0;

    return timeB - timeA; // Descending order (newest first)
  });

  const tabFilteredChats =
    activeTab === "all"
      ? sortedChats
      : sortedChats.filter((c) => c.channel_type === activeTab);

  const filteredExistingChats = sortedChats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );
  // FIX: Removed !u.has_dm filter so all members show up in search immediately
  const filteredMembers = workspaceUsers.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <section
      style={{
        width: width || T.sidebarWidth,
        maxWidth: "100%", // FIX: Ensure it never overflows on mobile
        height: "100%",
        background: T.bgSidebar,
        borderRight: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
        position: "relative",
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
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowPlusMenu(!showPlusMenu)}
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
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(99,102,241,0.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = T.accentMuted)
              }
            >
              +
            </button>
            {showPlusMenu && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 99 }}
                  onClick={() => setShowPlusMenu(false)}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 40,
                    right: 0,
                    background: T.bgModal,
                    border: `1px solid ${T.borderHover}`,
                    borderRadius: T.radiusMd,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    zIndex: 100,
                    width: 180,
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => {
                      setOverlayMode("group");
                      setShowNewChatOverlay(true);
                      setShowPlusMenu(false);
                      setSelectedMembers([]);
                      setSearch("");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      color: T.textSecondary,
                      cursor: "pointer",
                      fontSize: 13,
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = T.bgHover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Users size={16} /> Create Group
                  </button>
                  <button
                    onClick={() => {
                      setOverlayMode("dm");
                      setShowNewChatOverlay(true);
                      setShowPlusMenu(false);
                      setSearch("");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      color: T.textSecondary,
                      cursor: "pointer",
                      fontSize: 13,
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = T.bgHover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <UserPlus size={16} /> Add Contacts
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              color: T.textMuted,
              pointerEvents: "none",
            }}
          />
          <input
            placeholder="Search chats or members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 34px",
              borderRadius: T.radiusMd,
              border: `1px solid ${search ? T.borderFocus : T.border}`,
              background: T.bgInputField,
              color: T.textPrimary,
              outline: "none",
              fontSize: T.fontSizeSm,
              transition: "border-color 0.12s",
            }}
          />

          {search && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: 4,
                background: T.bgModal,
                border: `1px solid ${T.borderHover}`,
                borderRadius: T.radiusMd,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                zIndex: 50,
                maxHeight: 400,
                overflowY: "auto",
              }}
            >
              {filteredExistingChats.length > 0 && (
                <>
                  <div
                    style={{
                      padding: "8px 12px",
                      fontSize: 10,
                      fontWeight: 700,
                      color: T.textMuted,
                      textTransform: "uppercase",
                    }}
                  >
                    Existing Chats
                  </div>
                  {filteredExistingChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => {
                        selectChannel(chat.id);
                        setSearch("");
                      }}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = T.bgHover)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <ChannelIcon chat={chat} />
                      <span style={{ fontSize: 13, color: T.textPrimary }}>
                        {(() => {
                          if (chat.channel_type !== "dm") return chat.name;
                          const myUsername =
                            typeof window !== "undefined"
                              ? localStorage.getItem("username") || ""
                              : "";
                          return (
                            chat.dm_partner?.full_name ||
                            chat.dm_partner?.username ||
                            (
                              chat.name
                                .split(",")
                                .find((n) => n.trim() !== myUsername) ||
                              "Unknown User"
                            ).trim()
                          );
                        })()}
                      </span>
                    </div>
                  ))}
                </>
              )}

              {filteredMembers.length > 0 && (
                <>
                  <div
                    style={{
                      padding: "8px 12px",
                      fontSize: 10,
                      fontWeight: 700,
                      color: T.textMuted,
                      textTransform: "uppercase",
                      marginTop: 4,
                    }}
                  >
                    Workspace Members
                  </div>
                  {filteredMembers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        onStartDMRequest(u.id);
                        setSearch("");
                      }}
                      style={{
                        padding: "8px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = T.bgHover)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openProfile(u);
                        }}
                      >
                        <Avatar user={u} size="sm" />
                      </div>
                      <div style={{ overflow: "hidden" }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: T.textPrimary,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {u.full_name || u.username}
                        </div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>
                          Click to start DM request
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {filteredExistingChats.length === 0 &&
                filteredMembers.length === 0 && (
                  <div
                    style={{
                      padding: 16,
                      textAlign: "center",
                      color: T.textMuted,
                      fontSize: 13,
                    }}
                  >
                    No results found
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "0 10px 8px",
          borderBottom: `1px solid ${T.border}`,
          marginBottom: 8,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: "6px 4px",
              borderRadius: T.radiusSm,
              border: "none",
              background: activeTab === tab.key ? T.accentMuted : "transparent",
              color: activeTab === tab.key ? T.accentHover : T.textMuted,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
              textAlign: "center",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.key)
                e.currentTarget.style.color = T.textSecondary;
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.key)
                e.currentTarget.style.color = T.textMuted;
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List Header: Messages & Requests Tabs (Static) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 12px 8px",
          borderBottom: `1px solid ${T.border}`,
          marginBottom: 8,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setShowRequestsList(false)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 700,
            color: !showRequestsList ? T.textPrimary : T.textMuted,
            textTransform: "uppercase",
          }}
        >
          Messages
        </button>
        <button
          onClick={() => setShowRequestsList(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: "none",
            color: showRequestsList ? T.textPrimary : T.accentHover,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Requests
          {(receivedRequests.length > 0 || groupInvites.length > 0) && (
            <span
              style={{
                background: T.accent,
                color: "#fff",
                borderRadius: "50%",
                minWidth: 16,
                height: 16,
                fontSize: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {receivedRequests.length + groupInvites.length}
            </span>
          )}
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: `0 ${T.gapSm} 80px ${T.gapSm}`,
        }}
      >
        {showRequestsList ? (
          <div style={{ padding: "8px 12px" }}>
            {receivedRequests.length === 0 ? (
              <div
                style={{
                  padding: "20px 0",
                  textAlign: "center",
                  color: T.textMuted,
                  fontSize: 12,
                }}
              >
                No message requests.
              </div>
            ) : (
              receivedRequests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flex: 1,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: T.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {req.sender_name?.charAt(0) || "?"}
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: T.textPrimary,
                        }}
                      >
                        {req.sender_name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: T.textMuted,
                          maxWidth: 120,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {req.initial_message}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => handleAcceptDm(req.id)}
                      style={{
                        background: T.accent,
                        border: "none",
                        color: "#fff",
                        borderRadius: T.radiusSm,
                        padding: "4px 10px",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineDm(req.id)}
                      style={{
                        background: "transparent",
                        border: `1px solid ${T.border}`,
                        color: T.textSecondary,
                        borderRadius: T.radiusSm,
                        padding: "4px 10px",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            {tabFilteredChats.length === 0 ? (
              <div
                style={{
                  padding: "24px 12px",
                  textAlign: "center",
                  color: T.textMuted,
                  fontSize: 13,
                }}
              >
                No conversations found.
              </div>
            ) : (
              tabFilteredChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedChannel?.id === chat.id}
                  onSelect={() => selectChannel(chat.id)}
                  isPinned={pinnedChats.has(chat.id)}
                  isMuted={mutedChats.has(chat.id)}
                  onTogglePin={() => togglePin(chat.id)}
                  onToggleMute={() => toggleMute(chat.id)}
                  onToggleRead={() =>
                    toggleRead(chat.id, chat.unread_count || 0)
                  }
                  onClearChat={() => handleClearChat(chat.id)}
                  onDeleteChat={() => handleDeleteChat(chat.id)}
                />
              ))
            )}
          </>
        )}
      </div>

      {showNewChatOverlay && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: T.bgSidebar,
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px",
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            <button
              onClick={() => {
                setShowNewChatOverlay(false);
                setSearch(""); // FIX: Clear search when closing overlay
                setSelectedMembers([]); // FIX: Clear selected members
              }}
              style={{
                background: "none",
                border: "none",
                color: T.textSecondary,
                cursor: "pointer",
                padding: 4,
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: T.textPrimary,
              }}
            >
              {overlayMode === "group" ? "New Group" : "New Chat"}
            </h3>
            {overlayMode === "group" && selectedMembers.length > 0 && (
              <button
                onClick={handleCreateGroup}
                disabled={!newChannelName.trim()}
                style={{
                  marginLeft: "auto",
                  background: newChannelName.trim() ? T.accent : T.border,
                  border: "none",
                  color: "#fff",
                  borderRadius: T.radiusSm,
                  padding: "6px 14px",
                  cursor: newChannelName.trim() ? "pointer" : "not-allowed",
                  fontWeight: 600,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Check size={14} /> Create ({selectedMembers.length})
              </button>
            )}
          </div>

          {/* Group Name Input (Only shown for Groups) */}
          {overlayMode === "group" && (
            <div
              style={{
                padding: "12px 16px",
                borderBottom: `1px solid ${T.border}`,
              }}
            >
              <input
                type="text"
                placeholder="Enter group name..."
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: T.bgInputField,
                  border: `1px solid ${T.border}`,
                  borderRadius: T.radiusSm,
                  color: T.textPrimary,
                  outline: "none",
                  fontSize: 14,
                }}
                autoFocus
              />
            </div>
          )}

          <div style={{ padding: "12px 16px" }}>
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  top: 10,
                  left: 12,
                  color: T.textMuted,
                }}
              />
              <input
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 34px",
                  background: T.bgInputField,
                  border: `1px solid ${T.border}`,
                  borderRadius: T.radiusMd,
                  color: T.textPrimary,
                  outline: "none",
                  fontSize: 13,
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
            {(() => {
              const availableUsers = workspaceUsers.filter(
                (u) =>
                  u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                  u.username?.toLowerCase().includes(search.toLowerCase()),
              );

              if (availableUsers.length === 0) {
                return (
                  <div
                    style={{
                      textAlign: "center",
                      color: T.textMuted,
                      fontSize: 13,
                      padding: "40px 0",
                    }}
                  >
                    No members found.
                  </div>
                );
              }

              return availableUsers.map((u) => {
                const isSelected = selectedMembers.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      if (overlayMode === "group") {
                        setSelectedMembers((prev) =>
                          isSelected
                            ? prev.filter((id) => id !== u.id)
                            : [...prev, u.id],
                        );
                      } else {
                        // FIX: Check if DM already exists. If yes, open it. If no, send request.
                        const existingDm = useChatStore
                          .getState()
                          .channels.find(
                            (c) =>
                              c.channel_type === "dm" &&
                              c.dm_partner?.id === u.id,
                          );
                        if (existingDm) {
                          selectChannel(existingDm.id);
                        } else {
                          onStartDMRequest(u.id);
                        }
                        setShowNewChatOverlay(false);
                        setSearch("");
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      cursor: "pointer",
                      borderRadius: T.radiusSm,
                      marginBottom: 2,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = T.bgHover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {overlayMode === "group" && (
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          border: `2px solid ${isSelected ? T.accent : T.border}`,
                          background: isSelected ? T.accent : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <Check size={14} color="#fff" />}
                      </div>
                    )}
                    <Avatar
                      user={u}
                      name={u.full_name || u.username}
                      size="md"
                    />
                    <div style={{ overflow: "hidden" }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: T.textPrimary,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {u.full_name || u.username}
                      </div>
                      <div style={{ fontSize: 12, color: T.textMuted }}>
                        @{u.username}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

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
              width: 380,
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
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: T.textMuted,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Type
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[{ value: "private_group", label: "Group", icon: "🔒" }].map(
                  (opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setNewChannelType(opt.value)}
                      style={{
                        flex: 1,
                        minWidth: 70,
                        padding: "8px 6px",
                        borderRadius: T.radiusSm,
                        border: `1px solid ${newChannelType === opt.value ? T.accent : T.border}`,
                        background:
                          newChannelType === opt.value
                            ? T.accentMuted
                            : "transparent",
                        color:
                          newChannelType === opt.value
                            ? T.accentHover
                            : T.textSecondary,
                        cursor: "pointer",
                        fontWeight: newChannelType === opt.value ? 600 : 500,
                        fontSize: 12,
                        textAlign: "center",
                        transition: "all 0.1s",
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{opt.icon}</span>
                      <div style={{ marginTop: 2 }}>{opt.label}</div>
                    </button>
                  ),
                )}
              </div>
            </div>

            {newChannelType === "private_group" && (
              <>
                <input
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onCreateChannel()}
                  placeholder="Group name"
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
                    marginBottom: 10,
                  }}
                />
                <div
                  style={{
                    maxHeight: 140,
                    overflowY: "auto",
                    border: `1px solid ${T.border}`,
                    borderRadius: T.radiusMd,
                    padding: "6px 10px",
                  }}
                >
                  {workspaceUsers.length === 0 && (
                    <div
                      style={{
                        fontSize: 12,
                        color: T.textMuted,
                        padding: "4px 0",
                      }}
                    >
                      No users available
                    </div>
                  )}
                  {workspaceUsers.map((u) => {
                    const checked = newChannelMemberIds.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "4px 0",
                          cursor: "pointer",
                          color: T.textPrimary,
                          fontSize: T.fontSizeSm,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setNewChannelMemberIds(
                              checked
                                ? newChannelMemberIds.filter((x) => x !== u.id)
                                : [...newChannelMemberIds, u.id],
                            );
                          }}
                        />
                        {u.full_name || u.username}
                      </label>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>
                  Invite-only group. Starts pending until 2 members join.
                </div>
              </>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                onClick={() => {
                  setShowNewChannel(false);
                  setNewChannelName("");
                  setNewChannelType("official");
                  setNewChannelTeamId("");
                  setNewChannelMemberIds([]);
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
                onClick={onCreateChannel}
                disabled={!newChannelName.trim()}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: T.radiusMd,
                  border: "none",
                  background: newChannelName.trim() ? T.accent : T.border,
                  color: newChannelName.trim() ? "#fff" : T.textMuted,
                  cursor: newChannelName.trim() ? "pointer" : "not-allowed",
                  fontWeight: 600,
                  fontSize: T.fontSizeSm,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (newChannelName.trim())
                    e.currentTarget.style.background = T.accentHover;
                }}
                onMouseLeave={(e) => {
                  if (newChannelName.trim())
                    e.currentTarget.style.background = T.accent;
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

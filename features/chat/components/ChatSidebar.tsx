// features/chat/components/ChatSidebar.tsx

"use client";

import { useState, useEffect } from "react";
import { Search, Users, Building2, Folder } from "lucide-react";
import { T } from "../design/tokens";
import { Channel } from "../types/channel";
import { useChatStore } from "../store/chatStore";
import { loadChannels, loadDMs } from "../services/channelService";
import { loadDMRequests, respondDMRequest } from "../services/dmRequestService";

interface ChatSidebarProps {
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
  newChannelDMUserId: string;
  setNewChannelDMUserId: (v: string) => void;
  newChannelDMMessage: string;
  setNewChannelDMMessage: (v: string) => void;
  workspaceUsers: Array<{ id: number; username: string; full_name: string }>;
  userTeams: Array<{ id: number; name: string }>;
  onCreateChannel: () => void;
}

function ChannelIcon({ chat }: { chat: Channel }) {
  const baseStyle: React.CSSProperties = {
    width: 38,
    height: 38,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    fontSize: 16,
    color: "#fff",
  };

  switch (chat.channel_type) {
    case "official":
      return (
        <div
          style={{
            ...baseStyle,
            borderRadius: T.radiusSm,
            background: "#4f46e5",
          }}
        >
          <Building2 size={18} />
        </div>
      );
    case "team":
      return (
        <div
          style={{
            ...baseStyle,
            borderRadius: T.radiusSm,
            background: "#7c3aed",
          }}
        >
          <Users size={18} />
        </div>
      );
    case "private_group":
      return (
        <div
          style={{
            ...baseStyle,
            borderRadius: T.radiusSm,
            background: "#0891b2",
          }}
        >
          <Folder size={18} />
        </div>
      );
    case "dm":
      return (
        <div
          style={{ ...baseStyle, borderRadius: "50%", background: "#0d9488" }}
        >
          {chat.dm_partner?.full_name?.charAt(0).toUpperCase() ||
            chat.dm_partner?.username?.charAt(0).toUpperCase() ||
            "?"}
        </div>
      );
    default:
      return (
        <div
          style={{
            ...baseStyle,
            borderRadius: T.radiusSm,
            background: "#4f46e5",
          }}
        >
          <Users size={18} />
        </div>
      );
  }
}

function ChatItem({
  chat,
  isSelected,
  onSelect,
}: {
  chat: Channel;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const unread = chat.unread_count || 0;

  return (
    <div
      onClick={onSelect}
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
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = T.bgHover;
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = "transparent";
      }}
    >
      <ChannelIcon chat={chat} />
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
            }}
          >
            {chat.name}
          </span>
          {chat.last_message_time && (
            <span
              style={{
                fontSize: 10,
                color: unread > 0 ? T.accentHover : T.textMuted,
                marginLeft: 8,
                flexShrink: 0,
                fontWeight: unread > 0 ? 600 : 400,
              }}
            >
              {chat.last_message_time}
            </span>
          )}
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
            {chat.last_message || "No messages yet"}
          </span>
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
                marginLeft: 8,
                flexShrink: 0,
                padding: "0 4px",
              }}
            >
              {unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatSidebar({
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
  newChannelDMUserId,
  setNewChannelDMUserId,
  newChannelDMMessage,
  setNewChannelDMMessage,
  workspaceUsers,
  userTeams,
  onCreateChannel,
}: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  
  const setChannels = useChatStore((s) => s.setChannels);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await loadDMRequests();
        setReceivedRequests(data.received || []);
      } catch (e) {}
    };
    fetchRequests();
  }, []);

  const handleAcceptDm = async (reqId: number) => {
    try {
      await respondDMRequest(reqId, { status: "accepted" });
      setReceivedRequests(prev => prev.filter(r => r.id !== reqId));
      // Reload channels to fetch the newly created DM channel instantly
      const [loadedChannels, loadedDms] = await Promise.all([loadChannels(), loadDMs()]);
      const all = [...loadedChannels, ...loadedDms];
      setChannels(all);
    } catch (e) {
      alert("Failed to accept request");
    }
  };

  const handleDeclineDm = async (reqId: number) => {
    try {
      await respondDMRequest(reqId, { status: "rejected" });
      setReceivedRequests(prev => prev.filter(r => r.id !== reqId));
    } catch (e) {
      alert("Failed to decline request");
    }
  };

  const tabs = [
    { key: "all", label: "All" },
    { key: "official", label: "Workspace" },
    { key: "team", label: "Teams" },
    { key: "private_group", label: "Groups" },
    { key: "dm", label: "DMs" },
  ];

  const tabFilteredChats =
    activeTab === "all"
      ? filteredChats
      : filteredChats.filter((c) => c.channel_type === activeTab);

  return (
    <section
      style={{
        width: T.sidebarWidth,
        height: "100%",
        background: T.bgSidebar,
        borderRight: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
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

      {/* Filter Tabs */}
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

      <div style={{ flex: 1, overflowY: "auto", padding: `0 ${T.gapSm}` }}>
        {receivedRequests.length > 0 && (
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}`, marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 8 }}>Message Requests</div>
            {receivedRequests.map(req => (
              <div key={req.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600 }}>
                    {req.sender_name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{req.sender_name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.initial_message}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => handleAcceptDm(req.id)} style={{ background: T.accent, border: "none", color: "#fff", borderRadius: T.radiusSm, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Accept</button>
                  <button onClick={() => handleDeclineDm(req.id)} style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.textSecondary, borderRadius: T.radiusSm, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
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
            />
          ))
        )}
      </div>

      {/* Create Channel Modal */}
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

            {/* Channel Type Selector */}
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
                {[
                  { value: "private_group", label: "Group", icon: "🔒" },
                  { value: "dm", label: "DM", icon: "💬" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setNewChannelType(opt.value)}
                    style={{
                      flex: 1,
                      minWidth: 70,
                      padding: "8px 6px",
                      borderRadius: T.radiusSm,
                      border: `1px solid ${
                        newChannelType === opt.value ? T.accent : T.border
                      }`,
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
                ))}
              </div>
            </div>

            {/* PRIVATE GROUP: Name + Member selector */}
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

            {/* DM: User selector + initial message */}
            {newChannelType === "dm" && (
              <>
                <select
                  value={newChannelDMUserId}
                  onChange={(e) => setNewChannelDMUserId(e.target.value)}
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
                >
                  <option value="">Select user...</option>
                  {workspaceUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.username}
                    </option>
                  ))}
                </select>
                <input
                  value={newChannelDMMessage}
                  onChange={(e) => setNewChannelDMMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onCreateChannel()}
                  placeholder="Initial message..."
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
                  }}
                />
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>
                  Sends a DM request. The other user must accept before
                  chatting.
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
                  setNewChannelDMUserId("");
                  setNewChannelDMMessage("");
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
                disabled={
                  newChannelType === "dm"
                    ? !newChannelDMUserId
                    : !newChannelName.trim()
                }
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: T.radiusMd,
                  border: "none",
                  background: (
                    newChannelType === "dm"
                      ? !!newChannelDMUserId
                      : newChannelName.trim()
                  )
                    ? T.accent
                    : T.border,
                  color: (
                    newChannelType === "dm"
                      ? !!newChannelDMUserId
                      : newChannelName.trim()
                  )
                    ? "#fff"
                    : T.textMuted,
                  cursor: (
                    newChannelType === "dm"
                      ? !!newChannelDMUserId
                      : newChannelName.trim()
                  )
                    ? "pointer"
                    : "not-allowed",
                  fontWeight: 600,
                  fontSize: T.fontSizeSm,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  const ok =
                    newChannelType === "dm"
                      ? !!newChannelDMUserId
                      : newChannelName.trim();
                  if (ok) e.currentTarget.style.background = T.accentHover;
                }}
                onMouseLeave={(e) => {
                  const ok =
                    newChannelType === "dm"
                      ? !!newChannelDMUserId
                      : newChannelName.trim();
                  if (ok) e.currentTarget.style.background = T.accent;
                }}
              >
                {newChannelType === "dm" ? "Send Request" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

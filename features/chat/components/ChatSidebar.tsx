// features/chat/components/ChatSidebar.tsx

"use client";

import { Search, Users, Building2, Folder } from "lucide-react";
import { T } from "../design/tokens";
import { Channel } from "../types/channel";

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
  onCreateChannel: () => void;
}

// ── Channel Icon by Type ──────────────────────────────────────────────

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
        <div style={{ ...baseStyle, borderRadius: T.radiusSm, background: "#4f46e5" }}>
          <Building2 size={18} />
        </div>
      );
    case "team":
      return (
        <div style={{ ...baseStyle, borderRadius: T.radiusSm, background: "#7c3aed" }}>
          <Users size={18} />
        </div>
      );
    case "private_group":
      return (
        <div style={{ ...baseStyle, borderRadius: T.radiusSm, background: "#0891b2" }}>
          <Folder size={18} />
        </div>
      );
    case "dm":
      return (
        <div style={{ ...baseStyle, borderRadius: "50%", background: "#0d9488" }}>
          {chat.dm_partner?.full_name?.charAt(0).toUpperCase() ||
            chat.dm_partner?.username?.charAt(0).toUpperCase() ||
            "?"}
        </div>
      );
    default:
      return (
        <div style={{ ...baseStyle, borderRadius: T.radiusSm, background: "#4f46e5" }}>
          <Users size={18} />
        </div>
      );
  }
}

// ── Chat List Item ────────────────────────────────────────────────────

function ChatItem({
  chat,
  isSelected,
  onSelect,
}: {
  chat: Channel;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const subtypeLabel: Record<string, string> = {
    official: "Official Channel",
    team: chat.team_name ? `Team: ${chat.team_name}` : "Team Chat",
    private_group: "Private Group",
    dm: "Direct Message",
  };

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
          {subtypeLabel[chat.channel_type] || "Channel"}
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
  onCreateChannel,
}: ChatSidebarProps) {
  return (
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
        {/* Official Channels */}
        {filteredChats.filter((c) => c.channel_type === "official").length > 0 && (
          <>
            <div style={{ padding: "8px 12px 4px", fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Official
            </div>
            {filteredChats
              .filter((c) => c.channel_type === "official")
              .map((chat) => (
                <ChatItem key={chat.id} chat={chat} isSelected={selectedChannel?.id === chat.id} onSelect={() => selectChannel(chat.id)} />
              ))}
          </>
        )}

        {/* Team Channels */}
        {filteredChats.filter((c) => c.channel_type === "team").length > 0 && (
          <>
            <div style={{ padding: "8px 12px 4px", fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Teams
            </div>
            {filteredChats
              .filter((c) => c.channel_type === "team")
              .map((chat) => (
                <ChatItem key={chat.id} chat={chat} isSelected={selectedChannel?.id === chat.id} onSelect={() => selectChannel(chat.id)} />
              ))}
          </>
        )}

        {/* Private Groups */}
        {filteredChats.filter((c) => c.channel_type === "private_group").length > 0 && (
          <>
            <div style={{ padding: "8px 12px 4px", fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Groups
            </div>
            {filteredChats
              .filter((c) => c.channel_type === "private_group")
              .map((chat) => (
                <ChatItem key={chat.id} chat={chat} isSelected={selectedChannel?.id === chat.id} onSelect={() => selectChannel(chat.id)} />
              ))}
          </>
        )}

        {/* DMs */}
        {filteredChats.filter((c) => c.channel_type === "dm").length > 0 && (
          <>
            <div style={{ padding: "8px 12px 4px", fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Direct Messages
            </div>
            {filteredChats
              .filter((c) => c.channel_type === "dm")
              .map((chat) => (
                <ChatItem key={chat.id} chat={chat} isSelected={selectedChannel?.id === chat.id} onSelect={() => selectChannel(chat.id)} />
              ))}
          </>
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
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { value: "official", label: "Official", icon: "🏢" },
                  { value: "team", label: "Team", icon: "👥" },
                  { value: "private_group", label: "Group", icon: "🔒" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setNewChannelType(opt.value)}
                    style={{
                      flex: 1,
                      padding: "8px 6px",
                      borderRadius: T.radiusSm,
                      border: `1px solid ${
                        newChannelType === opt.value ? T.accent : T.border
                      }`,
                      background:
                        newChannelType === opt.value ? T.accentMuted : "transparent",
                      color:
                        newChannelType === opt.value ? T.accentHover : T.textSecondary,
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

            {/* Channel Name */}
            <input
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onCreateChannel()}
              placeholder={
                newChannelType === "official"
                  ? "Official channel name"
                  : newChannelType === "team"
                  ? "Team channel name"
                  : "Group name"
              }
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

            {/* Type hint */}
            <div
              style={{
                fontSize: 11,
                color: T.textMuted,
                marginTop: 6,
                minHeight: 16,
              }}
            >
              {newChannelType === "official" &&
                "Workspace-wide channel. Only admins/managers can create."}
              {newChannelType === "team" &&
                "Linked to your team. Members auto-join."}
              {newChannelType === "private_group" &&
                "Invite-only group. Starts pending until 2 members join."}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                onClick={() => {
                  setShowNewChannel(false);
                  setNewChannelName("");
                  setNewChannelType("official");
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

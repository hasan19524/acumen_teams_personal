"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { useChatPage } from "@/features/chat/hooks/useChatPage";
import { useFileUpload } from "@/features/chat/hooks/useFileUpload";
import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
import { ChatHeader } from "@/features/chat/components/ChatHeader";
import { ChatInput } from "@/features/chat/components/ChatInput";
import { MessageList } from "@/features/chat/components/MessageList";
import { ChatModals } from "@/features/chat/components/ChatModals";
import { ThreadPanel } from "@/features/chat/components/ThreadPanel";
import { RightPanel } from "@/features/chat/components/RightPanel";
import { T } from "@/features/chat/design/tokens";

export default function ChatPage() {
  const chat = useChatPage();
  const { uploadFiles } = useFileUpload(chat.selectedChannel?.id || null);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const deltaX = e.clientX - (handleMouseDown as any).startX;
    const newWidth = (handleMouseDown as any).startWidth + deltaX;
    if (newWidth > 250 && newWidth < 500) {
      setSidebarWidth(newWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "default";
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    (handleMouseDown as any).startX = e.clientX;
    (handleMouseDown as any).startWidth = sidebarWidth;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
  }, [handleMouseMove, handleMouseUp, sidebarWidth]);

  // FIX: Added clear/delete handlers here so the ChatHeader has access to them
  const handleClearChat = async () => {
    if (!chat.selectedChannel) return;
    if (!confirm("Are you sure you want to clear all messages in this chat? This cannot be undone.")) return;
    try {
      const { clearChat } = await import("@/features/chat/services/channelService");
      await clearChat(chat.selectedChannel.id);
      const { useChatStore } = await import("@/features/chat/store/chatStore");
      useChatStore.getState().setMessages(chat.selectedChannel.id, []);
    } catch (err) {
      alert("Failed to clear chat.");
    }
  };

  const handleDeleteChat = async () => {
    if (!chat.selectedChannel) return;
    if (!confirm("Are you sure you want to delete this chat? It will be removed from your sidebar.")) return;
    try {
      const { deleteChat } = await import("@/features/chat/services/channelService");
      await deleteChat(chat.selectedChannel.id);
      const { useChatStore } = await import("@/features/chat/store/chatStore");
      useChatStore.getState().removeChannel(chat.selectedChannel.id);
      useChatStore.getState().selectChannel(null);
      chat.refreshWorkspaceUsers();
    } catch (err) {
      alert("Failed to delete chat.");
    }
  };

  if (!chat.authChecked || chat.isInitialLoading) {
    return (
      <main style={{ height: "100%", display: "flex", background: T.bgApp, color: T.textPrimary, overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
        <aside style={{ width: 320, background: T.bgSidebar, borderRight: `1px solid ${T.border}`, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="shimmer" style={{ height: 30, borderRadius: 8, background: T.surfaceHover }} />
          <div className="shimmer" style={{ height: 40, borderRadius: 12, background: T.surfaceHover }} />
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="shimmer" style={{ height: 50, borderRadius: 8, background: T.surfaceHover }} />
            <div className="shimmer" style={{ height: 50, borderRadius: 8, background: T.surfaceHover }} />
            <div className="shimmer" style={{ height: 50, borderRadius: 8, background: T.surfaceHover }} />
          </div>
        </aside>
        <section style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <style>{`
            .shimmer { position: relative; overflow: hidden; }
            .shimmer::after { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); animation: shimmer 1.5s infinite; }
            @keyframes shimmer { 0% { left: -100%; } 100% { left: 100%; } }
          `}</style>
          <div style={{ display: "flex", gap: 4, alignItems: "center", color: T.textMuted }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent, animation: "bounce 1s infinite" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent, animation: "bounce 1s infinite 0.2s" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent, animation: "bounce 1s infinite 0.4s" }} />
            <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(-4px); opacity: 1; } }`}</style>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      style={{
        height: "100%", 
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

      {/* Mobile Responsive Wrapper: Shows Sidebar OR Chat */}
      <div className={`${chat.selectedChannel ? "hidden md:flex" : "flex"}`} style={{ width: isMobile ? "100%" : `${sidebarWidth}px`, flexShrink: 0 }}>
        <ChatSidebar
          width="100%"
          search={chat.search}
          setSearch={chat.setSearch}
          filteredChats={chat.filteredChats}
          selectedChannel={chat.selectedChannel}
          selectChannel={chat.selectChannel}
          showNewChannel={chat.showNewChannel}
          setShowNewChannel={chat.setShowNewChannel}
          newChannelName={chat.newChannelName}
          setNewChannelName={chat.setNewChannelName}
          newChannelType={chat.newChannelType}
          setNewChannelType={chat.setNewChannelType}
          newChannelTeamId={chat.newChannelTeamId}
          setNewChannelTeamId={chat.setNewChannelTeamId}
          newChannelMemberIds={chat.newChannelMemberIds}
          setNewChannelMemberIds={chat.setNewChannelMemberIds}
          workspaceUsers={chat.workspaceUsers}
          userTeams={chat.userTeams}
          onCreateChannel={chat.handleCreateChannel}
          onStartDMRequest={chat.handleStartDMRequest}
          onRefreshWorkspaceUsers={chat.refreshWorkspaceUsers}
        />
      </div>

      {/* Desktop Resize Handle (Seamless) */}
      <div
        className="hidden md:flex cursor-col-resize items-center justify-center"
        style={{ width: "2px", flexShrink: 0, background: T.border, transition: "background 0.2s" }}
        onMouseDown={handleMouseDown}
        onMouseEnter={(e) => (e.currentTarget.style.background = T.accentHover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = T.border)}
      />

      <section
        className={`${chat.selectedChannel ? "flex" : "hidden md:flex"} w-full md:flex-1`}
        style={{
          display: "flex",
          flexDirection: "column",
          background: T.bgApp,
          height: "100%", 
          maxHeight: "100%",
          overflow: "hidden",
          minHeight: 0, 
        }}
      >
        {chat.selectedChannel ? (
          <>
            <ChatHeader
              selectedChannel={chat.selectedChannel}
              isSelectMode={chat.isSelectMode}
              selectedCount={chat.selectedMsgIds.size}
              onExitSelectMode={chat.exitSelectMode}
              onCopySelected={chat.handleCopySelected}
              onBulkDelete={() => chat.setShowBulkDeleteModal(true)}
              typingUsers={
                chat.selectedChannel
                  ? chat.typingUsers[chat.selectedChannel.id]
                  : []
              }
              onTogglePanel={() => chat.setShowRightPanel(!chat.showRightPanel)}
              onBack={() => chat.selectChannel(null)} 
              onClearChat={handleClearChat}
              onDeleteChat={handleDeleteChat}
            />

            <MessageList
              selectedChannel={chat.selectedChannel}
              messages={chat.messages}
              pagination={chat.pagination}
              myUserId={chat.myUserId}
              isLoadingOlder={chat.isLoadingOlder}
              isAtBottom={chat.isAtBottom}
              isSelectMode={chat.isSelectMode}
              selectedMsgIds={chat.selectedMsgIds}
              activeMenuMsgId={chat.activeMenuMsgId}
              copiedMsgId={chat.copiedMsgId}
              bottomRef={chat.bottomRef}
              messagesContainerRef={chat.messagesContainerRef}
              onScroll={chat.handleScroll}
              onScrollToBottom={chat.scrollToBottom}
              onScrollToMessage={chat.scrollToMessage}
              onToggleMessageSelection={chat.toggleMessageSelection}
              onSetActiveMenuMsgId={chat.setActiveMenuMsgId}
              onReply={chat.handleReply}
              onCopy={chat.handleCopy}
              onEdit={chat.handleEditMessage}
              onEnterSelectMode={chat.enterSelectMode}
              setDeleteModalMsgId={chat.setDeleteModalMsgId}
              onGalleryOpen={(items, index) => {
                chat.setGalleryItems(items);
                chat.setGalleryIndex(index);
              }}
              onToggleReaction={chat.handleToggleReaction}
              typingUsers={
                chat.selectedChannel ? chat.typingUsers[chat.selectedChannel.id] : []
              }
            />

            {/* DM Request Waiting Banner */}
            {(chat.selectedChannel as any)?.is_request_pending && (
              <div style={{
                padding: "12px 20px",
                background: "rgba(59, 130, 246, 0.1)",
                borderTop: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: T.accentHover,
                fontSize: 13,
                fontWeight: 500,
              }}>
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                Waiting for response. Your message has been sent as a conversation request.
              </div>
            )}

            <ChatInput
              messageInput={chat.messageInput}
              setMessageInput={chat.setMessageInput}
              replyingTo={chat.replyingTo}
              setReplyingTo={chat.setReplyingTo}
              pendingFiles={chat.pendingFiles}
              setPendingFiles={chat.setPendingFiles}
              wsState={chat.wsState}
              isReady={chat.isReady}
              sending={chat.sending}
              onSend={chat.handleSend}
              onSendVoice={(file) => uploadFiles([file])}
              onGalleryOpen={(items, index) => {
                chat.setGalleryItems(items);
                chat.setGalleryIndex(index);
              }}
              showEmojiPicker={chat.showEmojiPicker}
              setShowEmojiPicker={chat.setShowEmojiPicker}
              handleEmojiClick={chat.handleEmojiClick}
              onTyping={chat.handleTyping}
              isDMPending={chat.selectedChannel?.is_pending}
              isDMReceiver={chat.selectedChannel?.channel_type === "dm" && (chat.selectedChannel as any)?.created_by !== chat.myUserId}
              onAcceptDM={chat.handleAcceptDM}
              onBlockDM={chat.handleBlockDM}
              workspaceUsers={chat.workspaceUsers}
              isDisabled={(chat.selectedChannel as any)?.is_request_pending}
              isTemp={(chat.selectedChannel as any)?.is_temp}
            />
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.textMuted, gap: "16px" }}>
            <MessageSquare size={48} strokeWidth={1.5} style={{ opacity: 0.3 }} />
            <div style={{ fontSize: "16px", fontWeight: "500", color: T.textSecondary }}>Select a conversation</div>
            <div style={{ fontSize: "13px" }}>Choose a chat from the sidebar to start messaging</div>
          </div>
        )}
      </section>

      {chat.activeThread && (
        <ThreadPanel
          parentMessage={chat.activeThread}
          messages={chat.messages[chat.selectedChannel?.id || 0] || []}
          myUserId={chat.myUserId}
          onClose={() => chat.setActiveThread(null)}
          onSend={(content) => {
            chat.handleSendThread(content);
          }}
        />
      )}

      {chat.showRightPanel && (
        <div className="fixed inset-0 z-[60] md:relative md:z-auto md:flex">
          {/* Mobile Backdrop */}
          <div className="absolute inset-0 bg-black/60 md:hidden" onClick={() => chat.setShowRightPanel(false)} />
          <RightPanel
            channel={chat.selectedChannel}
            members={chat.channelMembers}
            onlineUsers={chat.onlineUsers}
            messages={chat.messages[chat.selectedChannel?.id || 0] || []}
            activeTab={chat.rightPanelTab}
            setActiveTab={chat.setRightPanelTab}
            onClose={() => chat.setShowRightPanel(false)}
            onGalleryOpen={(items, index) => {
              chat.setGalleryItems(items);
              chat.setGalleryIndex(index);
            }}
            workspaceUsers={chat.workspaceUsers}
            onMembersUpdated={chat.fetchChannelMembers}
          />
        </div>
      )}

      <ChatModals
        editingMessageId={chat.editingMessageId}
        setEditingMessageId={chat.setEditingMessageId}
        editContent={chat.editContent}
        setEditContent={chat.setEditContent}
        onSaveEdit={chat.handleSaveEdit}
        deleteModalMsgId={chat.deleteModalMsgId}
        setDeleteModalMsgId={chat.setDeleteModalMsgId}
        onDeleteForEveryone={chat.handleDeleteForEveryone}
        onDeleteForMe={chat.handleDeleteForMe}
        showBulkDeleteModal={chat.showBulkDeleteModal}
        setShowBulkDeleteModal={chat.setShowBulkDeleteModal}
        selectedMsgIds={chat.selectedMsgIds}
        selectedChannel={chat.selectedChannel}
        messages={chat.messages}
        myUserId={chat.myUserId}
        onBulkDeleteForMe={chat.handleBulkDeleteForMe}
        onBulkDeleteForEveryone={chat.handleBulkDeleteForEveryone}
        galleryItems={chat.galleryItems}
        setGalleryItems={chat.setGalleryItems}
        galleryIndex={chat.galleryIndex}
        setGalleryIndex={chat.setGalleryIndex}
      />
    </main>
  );
}
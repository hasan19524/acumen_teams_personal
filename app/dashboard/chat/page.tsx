// app/dashboard/chat/page.tsx

"use client";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useChatPage } from "@/features/chat/hooks/useChatPage";
import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
import { ChatHeader } from "@/features/chat/components/ChatHeader";
import { ChatInput } from "@/features/chat/components/ChatInput";
import { MessageList } from "@/features/chat/components/MessageList";
import { ChatModals } from "@/features/chat/components/ChatModals";
import { T } from "@/features/chat/design/tokens";

export default function ChatPage() {
  const chat = useChatPage();

  if (!chat.authChecked) return null;

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

      <DashboardSidebar />

      <ChatSidebar
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
        newChannelDMUserId={chat.newChannelDMUserId}
        setNewChannelDMUserId={chat.setNewChannelDMUserId}
        newChannelDMMessage={chat.newChannelDMMessage}
        setNewChannelDMMessage={chat.setNewChannelDMMessage}
        workspaceUsers={chat.workspaceUsers}
        userTeams={chat.userTeams}
        onCreateChannel={chat.handleCreateChannel}
      />

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
        <ChatHeader
          selectedChatName={chat.selectedChannel?.name}
          wsState={chat.wsState}
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
          onDeleteForMe={chat.handleDeleteForMe}
          onDeleteForEveryone={chat.handleDeleteForEveryone}
          setDeleteModalMsgId={chat.setDeleteModalMsgId}
          onGalleryOpen={(items, index) => {
            chat.setGalleryItems(items);
            chat.setGalleryIndex(index);
          }}
          onToggleReaction={chat.handleToggleReaction}
          onMarkRead={chat.handleMarkRead}
        />

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
          onGalleryOpen={(items, index) => {
            chat.setGalleryItems(items);
            chat.setGalleryIndex(index);
          }}
          showEmojiPicker={chat.showEmojiPicker}
          setShowEmojiPicker={chat.setShowEmojiPicker}
          handleEmojiClick={chat.handleEmojiClick}
          onTyping={chat.handleTyping}
        />
      </section>

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

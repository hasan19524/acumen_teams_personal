// features/chat/components/ChatModals.tsx

"use client";

import { Pencil, Trash2, X } from "lucide-react";
import { T } from "../design/tokens";
import { Message } from "../types/message";
import { Channel } from "../types/channel";

interface ChatModalsProps {
  // Edit
  editingMessageId: number | null;
  setEditingMessageId: (id: number | null) => void;
  editContent: string;
  setEditContent: (v: string) => void;
  onSaveEdit: (messageId: number) => void;

  // Delete
  deleteModalMsgId: number | null;
  setDeleteModalMsgId: (id: number | null) => void;
  onDeleteForEveryone: (msgId: number) => void;
  onDeleteForMe: (msgId: number) => void;

  // Bulk Delete
  showBulkDeleteModal: boolean;
  setShowBulkDeleteModal: (v: boolean) => void;
  selectedMsgIds: Set<number>;
  selectedChannel: Channel | null;
  messages: Record<number, Message[]>;
  myUserId: number;
  onBulkDeleteForMe: () => void;
  onBulkDeleteForEveryone: () => void;

  // Gallery
  galleryItems: Array<{ url: string; type: string; name: string }>;
  setGalleryItems: (
    items: Array<{ url: string; type: string; name: string }>,
  ) => void;
  galleryIndex: number;
  setGalleryIndex: (index: number) => void;
}

export function ChatModals({
  editingMessageId,
  setEditingMessageId,
  editContent,
  setEditContent,
  onSaveEdit,
  deleteModalMsgId,
  setDeleteModalMsgId,
  onDeleteForEveryone,
  onDeleteForMe,
  showBulkDeleteModal,
  setShowBulkDeleteModal,
  selectedMsgIds,
  selectedChannel,
  messages,
  myUserId,
  onBulkDeleteForMe,
  onBulkDeleteForEveryone,
  galleryItems,
  setGalleryItems,
  galleryIndex,
  setGalleryIndex,
}: ChatModalsProps) {
  return (
    <>
      {/* EDIT MODAL */}
      {editingMessageId !== null && (
        <div
          onClick={() => setEditingMessageId(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: T.bgOverlay,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.bgModal,
              border: `1px solid ${T.borderHover}`,
              borderRadius: T.radiusLg,
              width: 420,
              maxWidth: "90vw",
              overflow: "hidden",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              animation: "modalIn 0.12s ease-out",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Pencil size={14} style={{ color: T.accentHover }} />
              <span
                style={{
                  fontSize: T.fontSizeSm + 1,
                  fontWeight: 600,
                }}
              >
                Edit message
              </span>
            </div>
            <div style={{ padding: "14px 18px 6px" }}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSaveEdit(editingMessageId);
                  }
                  if (e.key === "Escape") setEditingMessageId(null);
                }}
                autoFocus
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: T.radiusSm,
                  border: `1px solid ${T.border}`,
                  background: T.bgInputField,
                  color: T.textPrimary,
                  outline: "none",
                  fontSize: T.fontSizeBase,
                  fontFamily: "inherit",
                  resize: "vertical",
                  boxSizing: "border-box",
                  lineHeight: 1.45,
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
            <div
              style={{
                padding: "6px 18px 14px",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                onClick={() => setEditingMessageId(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.textMuted,
                  cursor: "pointer",
                  fontSize: T.fontSizeSm,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  padding: "7px 14px",
                  borderRadius: T.radiusSm,
                  transition: "all 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = T.textPrimary;
                  e.currentTarget.style.background = T.bgHoverStrong;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = T.textMuted;
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => onSaveEdit(editingMessageId)}
                style={{
                  background: T.accent,
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: T.fontSizeSm,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  padding: "7px 18px",
                  borderRadius: T.radiusSm,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.accentHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = T.accent;
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModalMsgId !== null && (
        <div
          onClick={() => setDeleteModalMsgId(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: T.bgOverlay,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
        >
          <div
            className="delete-modal-enter"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.bgModal,
              border: `1px solid ${T.borderHover}`,
              borderRadius: T.radiusLg,
              width: 340,
              overflow: "hidden",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                padding: "18px 20px 14px",
                borderBottom: `1px solid ${T.border}`,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: T.textPrimary,
                  marginBottom: 4,
                }}
              >
                Delete message?
              </div>
              <div
                style={{
                  fontSize: T.fontSizeSm,
                  color: T.textMuted,
                  lineHeight: 1.45,
                }}
              >
                This can&apos;t be undone. Choose who sees it deleted.
              </div>
            </div>
            <div style={{ padding: "6px 0" }}>
              {[
                {
                  label: "Delete for everyone",
                  action: () => onDeleteForEveryone(deleteModalMsgId),
                  danger: true,
                },
                {
                  label: "Delete for me",
                  action: () => onDeleteForMe(deleteModalMsgId),
                  danger: false,
                  muted: true,
                },
              ].map((item, i, arr) => (
                <button
                  key={i}
                  onClick={item.action}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = item.danger
                      ? T.dangerHover
                      : T.bgHoverStrong;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "12px 20px",
                    background: "transparent",
                    border: "none",
                    color: item.danger
                      ? T.danger
                      : item.muted
                        ? T.textMuted
                        : T.textSecondary,
                    cursor: "pointer",
                    fontSize: T.fontSizeSm + 1,
                    fontFamily: "inherit",
                    fontWeight: item.danger ? 600 : 400,
                    transition: "background 0.08s",
                  }}
                >
                  <Trash2 size={15} style={{ opacity: item.muted ? 0.4 : 1 }} />
                  {item.label}
                </button>
              ))}
              <div
                style={{
                  height: 1,
                  background: T.border,
                  margin: "3px 0",
                }}
              />
              <button
                onClick={() => setDeleteModalMsgId(null)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.bgHoverStrong;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  padding: "12px 20px",
                  background: "transparent",
                  border: "none",
                  color: T.textSecondary,
                  cursor: "pointer",
                  fontSize: T.fontSizeSm + 1,
                  fontFamily: "inherit",
                  fontWeight: 500,
                  transition: "background 0.08s",
                  justifyContent: "center",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE MODAL */}
      {showBulkDeleteModal && selectedChannel && (
        <div
          onClick={() => setShowBulkDeleteModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: T.bgOverlay,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
        >
          <div
            className="delete-modal-enter"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.bgModal,
              border: `1px solid ${T.borderHover}`,
              borderRadius: T.radiusLg,
              width: 340,
              overflow: "hidden",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                padding: "18px 20px 14px",
                borderBottom: `1px solid ${T.border}`,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: T.textPrimary,
                  marginBottom: 4,
                }}
              >
                Delete {selectedMsgIds.size} messages?
              </div>
              <div
                style={{
                  fontSize: T.fontSizeSm,
                  color: T.textMuted,
                  lineHeight: 1.45,
                }}
              >
                This can&apos;t be undone. Choose who sees it deleted.
              </div>
            </div>
            <div style={{ padding: "6px 0" }}>
              {(() => {
                const currentMsgs = messages[selectedChannel.id] || [];
                const allMine = Array.from(selectedMsgIds).every((id) => {
                  const msg = currentMsgs.find((m) => m.id === id);
                  return msg?.sender?.id === myUserId;
                });

                return (
                  <>
                    {allMine && (
                      <button
                        onClick={onBulkDeleteForEveryone}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = T.dangerHover)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          width: "100%",
                          padding: "12px 20px",
                          background: "transparent",
                          border: "none",
                          color: T.danger,
                          cursor: "pointer",
                          fontSize: T.fontSizeSm + 1,
                          fontFamily: "inherit",
                          fontWeight: 600,
                          transition: "background 0.08s",
                        }}
                      >
                        <Trash2 size={15} />
                        Delete for everyone
                      </button>
                    )}
                    <button
                      onClick={onBulkDeleteForMe}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = T.bgHoverStrong)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "12px 20px",
                        background: "transparent",
                        border: "none",
                        color: T.textMuted,
                        cursor: "pointer",
                        fontSize: T.fontSizeSm + 1,
                        fontFamily: "inherit",
                        fontWeight: 400,
                        transition: "background 0.08s",
                      }}
                    >
                      <Trash2 size={15} style={{ opacity: 0.4 }} />
                      Delete for me
                    </button>
                  </>
                );
              })()}
              <div
                style={{
                  height: 1,
                  background: T.border,
                  margin: "3px 0",
                }}
              />
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.bgHoverStrong;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  padding: "12px 20px",
                  background: "transparent",
                  border: "none",
                  color: T.textSecondary,
                  cursor: "pointer",
                  fontSize: T.fontSizeSm + 1,
                  fontFamily: "inherit",
                  fontWeight: 500,
                  transition: "background 0.08s",
                  justifyContent: "center",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GALLERY MODAL */}
      {galleryItems.length > 0 && (
        <div
          onClick={() => {
            setGalleryItems([]);
            setGalleryIndex(0);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.92)",
            display: "flex",
            flexDirection: "column",
            zIndex: 200,
            cursor: "pointer",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: "10px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: T.bgModal,
              borderBottom: `1px solid ${T.border}`,
              cursor: "default",
            }}
          >
            <div
              style={{
                color: T.textSecondary,
                fontSize: T.fontSizeSm,
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginRight: 16,
              }}
            >
              {galleryItems[galleryIndex]?.name}
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <a
                href={galleryItems[galleryIndex]?.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: T.textSecondary,
                  background: T.bgHoverStrong,
                  padding: "6px 14px",
                  borderRadius: T.radiusSm,
                  cursor: "pointer",
                  textDecoration: "none",
                  fontSize: T.fontSizeSm,
                  fontWeight: 500,
                  transition: "color 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = T.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = T.textSecondary;
                }}
              >
                💾 Save
              </a>
              <button
                onClick={() => {
                  setGalleryItems([]);
                  setGalleryIndex(0);
                }}
                style={{
                  color: T.textSecondary,
                  background: T.bgHoverStrong,
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: T.radiusSm,
                  cursor: "pointer",
                  fontSize: T.fontSizeSm,
                  fontWeight: 500,
                  transition: "color 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = T.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = T.textSecondary;
                }}
              >
                ✕ Close
              </button>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              cursor: "default",
            }}
          >
            {galleryItems.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setGalleryIndex(
                      galleryIndex > 0 ? galleryIndex - 1 : galleryItems.length - 1,
                    );

                  }}
                  style={{
                    position: "absolute",
                    left: 16,
                    background: "rgba(0,0,0,0.5)",
                    border: "none",
                    color: "#fff",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    cursor: "pointer",
                    fontSize: 18,
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ←
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setGalleryIndex(
                      galleryIndex < galleryItems.length - 1 ? galleryIndex + 1 : 0,
                    );
                  }}
                  style={{
                    position: "absolute",
                    right: 16,
                    background: "rgba(0,0,0,0.5)",
                    border: "none",
                    color: "#fff",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    cursor: "pointer",
                    fontSize: 18,
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  →
                </button>
              </>
            )}
            {galleryItems[galleryIndex]?.type?.startsWith("video/") &&
            galleryItems[galleryIndex].url ? (
              <video
                src={galleryItems[galleryIndex].url}
                controls
                autoPlay
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: "90vw",
                  maxHeight: "70vh",
                  borderRadius: 4,
                  cursor: "default",
                }}
              />
            ) : galleryItems[galleryIndex]?.url ? (
              <img
                src={galleryItems[galleryIndex].url}
                alt=""
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: "90vw",
                  maxHeight: "70vh",
                  objectFit: "contain",
                  cursor: "default",
                }}
              />
            ) : null}
          </div>
          {galleryItems.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                height: 80,
                background: T.bgModal,
                borderTop: `1px solid ${T.border}`,
                cursor: "default",
                display: "flex",
                alignItems: "center",
                padding: "0 18px",
                gap: 8,
                overflowX: "auto",
              }}
            >
              {galleryItems.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setGalleryIndex(idx)}
                  style={{
                    minWidth: 56,
                    height: 56,
                    borderRadius: T.radiusSm,
                    overflow: "hidden",
                    border:
                      idx === galleryIndex
                        ? `2px solid ${T.accent}`
                        : "2px solid transparent",
                    cursor: "pointer",
                    opacity: idx === galleryIndex ? 1 : 0.4,
                    flexShrink: 0,
                    transition: "all 0.12s",
                  }}
                >
                  {item.type?.startsWith("video/") && item.url ? (
                    <video
                      src={item.url}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      muted
                    />
                  ) : item.url ? (
                    <img
                      src={item.url}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      alt=""
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

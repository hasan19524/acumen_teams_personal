// features/announcements/components/AnnouncementDrawer.tsx
"use client";

import {
  X,
  Pin,
  PinOff,
  Archive,
  Trash2,
  FileText,
  Download,
  User,
  Clock,
  Edit3,
} from "lucide-react";
import {
  tk,
  Announcement,
  PriorityStyle,
  getPriorityStyle,
  getAudienceLabel,
  getExpiryLabel,
  getFileIcon,
  renderMarkdown,
} from "../lib";

interface AnnouncementDrawerProps {
  selectedAnn: Announcement | null;
  detailLoading: boolean;
  canPost: boolean;
  onClose: () => void;
  handleAction: (id: number, action: "pin" | "archive" | "read") => void;
  handleEditClick: (item: Announcement) => void;
  setConfirmDeleteId: (id: number | null) => void;
}

export function AnnouncementDrawer({
  selectedAnn,
  detailLoading,
  canPost,
  onClose,
  handleAction,
  handleEditClick,
  setConfirmDeleteId,
}: AnnouncementDrawerProps) {
  if (!selectedAnn) return null;

  const pStyle = getPriorityStyle(selectedAnn.priority);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 40,
        }}
      />
      <aside
        className="drawer-slide"
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: "100%",
          maxWidth: "460px",
          background: tk.surface,
          borderLeft: `1px solid ${tk.border}`,
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-16px 0 48px rgba(0,0,0,0.4)",
        }}
      >
        <header
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${tk.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexShrink: 0, // Prevent header from shrinking
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                lineHeight: 1.3,
                wordBreak: "break-word",
              }}
            >
              {selectedAnn.title}
            </h2>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginTop: 8,
                fontSize: 12,
                color: tk.textMuted,
                flexWrap: "wrap",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <User size={11} /> {selectedAnn.by}
              </span>
              <span>•</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={11} /> {selectedAnn.time}
              </span>
              {selectedAnn.edited && (
                <>
                  <span>•</span>
                  <span style={{ fontStyle: "italic" }}>Updated</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: tk.textMuted,
              cursor: "pointer",
              padding: 4,
              borderRadius: 6,
              flexShrink: 0,
            }}
          >
            <X size={20} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            {selectedAnn.pinned && (
              <span
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: `1px solid ${tk.warning}`,
                  color: tk.warning,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Pin size={11} fill={tk.warning} /> Pinned
              </span>
            )}
            <span
              style={{
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: "6px",
                background: pStyle.bg,
                color: pStyle.color,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {pStyle.icon && <pStyle.icon size={10} />} {pStyle.label}
            </span>
            <span
              style={{
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: "6px",
                background: tk.bg,
                color: tk.textSecondary,
                fontWeight: 600,
              }}
            >
              {getAudienceLabel(selectedAnn)}
            </span>
          </div>

          <div
            style={{
              margin: "0 0 24px",
              color: tk.textPrimary,
              fontSize: 14,
              lineHeight: 1.7,
              wordBreak: "break-word",
            }}
          >
            {renderMarkdown(selectedAnn.content)}
          </div>

          <div
            style={{
              borderTop: `1px solid ${tk.border}`,
              borderBottom: `1px solid ${tk.border}`,
              padding: "16px 0",
              marginBottom: 20,
            }}
          >
            <h4
              style={{
                margin: "0 0 12px",
                fontSize: 10,
                fontWeight: 700,
                color: tk.textMuted,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Details
            </h4>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: tk.textMuted }}>
                  Created
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: tk.textSecondary,
                    fontWeight: 500,
                  }}
                >
                  {selectedAnn.time}
                </span>
              </div>
              {getExpiryLabel(selectedAnn.expiry_date) && (
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: 13, color: tk.textMuted }}>
                    Expiry
                  </span>
                  <span
                    style={{ fontSize: 13, color: tk.warning, fontWeight: 500 }}
                  >
                    {getExpiryLabel(selectedAnn.expiry_date)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Attachments (Clickable) */}
          {(selectedAnn.attachment_count > 0 ||
            (selectedAnn.attachments &&
              selectedAnn.attachments.length > 0)) && (
            <div style={{ marginBottom: 20 }}>
              <h4
                style={{
                  margin: "0 0 12px",
                  fontSize: 10,
                  fontWeight: 700,
                  color: tk.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Attachments (
                {selectedAnn.attachments?.length ||
                  selectedAnn.attachment_count}
                )
              </h4>
              {detailLoading ? (
                <div
                  className="shimmer-bg"
                  style={{
                    height: 60,
                    borderRadius: 8,
                    border: `1px solid ${tk.border}`,
                  }}
                />
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {(selectedAnn.attachments || []).map((att) => (
                    <a
                      key={att.id}
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={att.file_name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px",
                        background: tk.bg,
                        borderRadius: 8,
                        border: `1px solid ${tk.border}`,
                        transition: "all 0.2s",
                        cursor: "pointer",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = tk.borderHover;
                        e.currentTarget.style.background = tk.surfaceHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = tk.border;
                        e.currentTarget.style.background = tk.bg;
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: tk.bgSecondary,
                            border: `1px solid ${tk.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {(() => {
                            const fileIcon = getFileIcon(att.file_name);
                            return <fileIcon.Icon size={18} color={fileIcon.color} />;
                          })()}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: tk.textPrimary,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {att.file_name}
                          </div>
                          <div style={{ fontSize: 11, color: tk.textMuted }}>
                            {att.file_size || "Click to download"}
                          </div>
                        </div>
                      </div>
                      <Download
                        size={16}
                        color={tk.textMuted}
                        style={{ flexShrink: 0 }}
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {canPost && (
          <footer
            style={{
              padding: "14px 24px",
              borderTop: `1px solid ${tk.border}`,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: 8,
              background: tk.surface,
            }}
          >
            <button
              onClick={() => handleEditClick(selectedAnn)}
              style={btnStyle}
            >
              <Edit3 size={14} /> Edit
            </button>
            <button
              onClick={() => handleAction(selectedAnn.id, "pin")}
              style={{
                ...btnStyle,
                color: selectedAnn.pinned ? tk.warning : tk.textSecondary,
              }}
            >
              {selectedAnn.pinned ? <PinOff size={14} /> : <Pin size={14} />}{" "}
              {selectedAnn.pinned ? "Unpin" : "Pin"}
            </button>
            <button
              onClick={() => handleAction(selectedAnn.id, "archive")}
              style={btnStyle}
            >
              <Archive size={14} /> Archive
            </button>
            <button
              onClick={() => setConfirmDeleteId(selectedAnn.id)}
              style={{ ...btnStyle, color: tk.primary }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}

const btnStyle: React.CSSProperties = {
  background: "none",
  border: `1px solid ${tk.border}`,
  color: tk.textSecondary,
  padding: "9px",
  borderRadius: 8,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  fontSize: 12,
  fontWeight: 600,
  transition: "all 0.2s",
};

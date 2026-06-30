// features/announcements/components/AnnouncementModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { X, FileText, Paperclip, Pin, Loader2 } from "lucide-react";
import { tk, Team, Announcement } from "../lib";

interface AnnouncementModalProps {
  showModal: boolean;
  onClose: () => void;
  onPublish: (data: any) => Promise<void>;
  isPublishing: boolean;
  editingId: number | null;
  initialData: Announcement | null;
  userTeams: Team[];
}

export function AnnouncementModal({
  showModal,
  onClose,
  onPublish,
  isPublishing,
  editingId,
  initialData,
  userTeams,
}: AnnouncementModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [audience, setAudience] = useState("workspace");
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [expiryDays, setExpiryDays] = useState(60);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showModal) {
      if (initialData) {
        setTitle(initialData.title);
        setContent(initialData.content);
        setPriority(initialData.priority);
        setAudience(initialData.scope === "workspace" ? "workspace" : "teams");
        setSelectedTeamIds(initialData.teams.map((t) => t.id));
        setIsPinned(initialData.pinned);
      } else {
        setTitle("");
        setContent("");
        setPriority("normal");
        setAudience("workspace");
        setSelectedTeamIds([]);
        setIsPinned(false);
        setExpiryDays(60);
        setPendingFiles([]);
      }
    }
  }, [showModal, initialData]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).slice(0, 5 - pendingFiles.length);
    setPendingFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    await onPublish({
      title,
      content,
      priority,
      pinned: isPinned,
      team_ids: audience === "teams" ? selectedTeamIds : [],
      expiry_days: expiryDays,
      pendingFiles,
    });
  };

  if (!showModal) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        zIndex: 100,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="modal-fade"
        style={{
          background: tk.surface,
          border: `1px solid ${tk.border}`,
          borderRadius: "12px",
          width: "100%",
          maxWidth: "520px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "24px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            flexShrink: 0, // Prevent header from shrinking
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "17px",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {editingId ? "Edit Announcement" : "New Announcement"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: tk.textMuted,
              cursor: "pointer",
              padding: 4,
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              autoFocus
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your message..."
              rows={4}
              maxLength={2000}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
            />
                          <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: tk.textMuted,
                    marginTop: 4,
                  }}
                >
                  <span>Supports: **bold**, *italic*, - bullet, [link](url)</span>
                  <span>{content.length} / 2000</span>
                </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label style={labelStyle}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={selectStyle}
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Archive After</label>
              <select
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                style={selectStyle}
                disabled={!!editingId}
              >
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
                <option value={0}>Never</option>
              </select>
            </div>
          </div>

          {!editingId && (
            <div>
              <label style={labelStyle}>Who should receive this?</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setAudience("workspace")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: `1px solid ${audience === "workspace" ? tk.brand : tk.border}`,
                    background:
                      audience === "workspace" ? tk.brand : "transparent",
                    color: audience === "workspace" ? "#fff" : tk.textSecondary,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Entire Workspace
                </button>
                <button
                  onClick={() => setAudience("teams")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: `1px solid ${audience === "teams" ? tk.brand : tk.border}`,
                    background: audience === "teams" ? tk.brand : "transparent",
                    color: audience === "teams" ? "#fff" : tk.textSecondary,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Selected Teams
                </button>
              </div>
              {audience === "teams" && (
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {userTeams.length === 0 && (
                    <span style={{ fontSize: 12, color: tk.textMuted }}>
                      No selectable teams available.
                    </span>
                  )}
                  {userTeams.map((t) => (
                    <button
                      key={t.id}
                      onClick={() =>
                        setSelectedTeamIds((prev) =>
                          prev.includes(t.id)
                            ? prev.filter((id) => id !== t.id)
                            : [...prev, t.id],
                        )
                      }
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: `1px solid ${selectedTeamIds.includes(t.id) ? tk.brandLight : tk.border}`,
                        background: selectedTeamIds.includes(t.id)
                          ? `${tk.brandLight}15`
                          : "transparent",
                        color: selectedTeamIds.includes(t.id)
                          ? tk.brandLight
                          : tk.textSecondary,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          <div>
            <label style={labelStyle}>Attachments (Max 5)</label>

            {pendingFiles.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                {pendingFiles.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      background: tk.bg,
                      borderRadius: "8px",
                      border: `1px solid ${tk.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        minWidth: 0,
                      }}
                    >
                      <FileText
                        size={16}
                        color={tk.brandLight}
                        style={{ flexShrink: 0 }}
                      />
                      <span
                        style={{
                          fontSize: 13,
                          color: tk.textPrimary,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {file.name}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: tk.textMuted,
                        cursor: "pointer",
                        padding: 4,
                        flexShrink: 0,
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFileSelect(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? tk.brandLight : tk.border}`,
                borderRadius: "8px",
                padding: pendingFiles.length > 0 ? "12px" : "20px", // Shrinks when files exist
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                background: isDragging ? `${tk.brandLight}08` : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <input
                type="file"
                multiple
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e.target.files)}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.pptx,.xlsx"
              />
              <Paperclip size={16} color={tk.textMuted} />
              <p
                style={{ margin: 0, fontSize: "13px", color: tk.textSecondary }}
              >
                {pendingFiles.length > 0 ? (
                  <span style={{ color: tk.brandLight, fontWeight: 600 }}>
                    Add more files
                  </span>
                ) : (
                  <>
                    <span style={{ color: tk.brandLight, fontWeight: 600 }}>
                      Click to browse
                    </span>{" "}
                    or drag files here
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Pin Toggle */}
          <div
            onClick={() => setIsPinned(!isPinned)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              padding: "4px 0",
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: tk.textSecondary,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Pin
                size={14}
                color={isPinned ? tk.warning : tk.textMuted}
                fill={isPinned ? tk.warning : "none"}
              />{" "}
              Pin this announcement
            </span>
            <div
              style={{
                width: 36,
                height: 20,
                background: isPinned ? tk.warning : tk.border,
                borderRadius: 10,
                position: "relative",
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: isPinned ? 18 : 2,
                  width: 16,
                  height: 16,
                  background: "#fff",
                  borderRadius: "50%",
                  transition: "left 0.2s",
                }}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || isPublishing}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: "8px",
              border: "none",
              background:
                !title.trim() || !content.trim() ? tk.border : tk.brand,
              color: "#fff",
              fontWeight: 700,
              fontSize: "14px",
              cursor:
                !title.trim() || !content.trim() ? "not-allowed" : "pointer",
              opacity: !title.trim() || !content.trim() ? 0.6 : 1,
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {isPublishing ? (
              <>
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />{" "}
                {editingId ? "Saving..." : "Publishing..."}
              </>
            ) : editingId ? (
              "Save Changes"
            ) : (
              "Publish Announcement"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  color: tk.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  display: "block",
  marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: `1px solid ${tk.border}`,
  background: tk.bg,
  color: tk.textPrimary,
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

"use client";
import React, { useState, useRef, useEffect } from "react";
import { Star, Trash2, X, ChevronRight, Folder, Tag } from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import { noteService } from "../services/noteService";
import { Note, Notebook } from "../types/note";
import { tk } from "@/lib/tokens";

interface NoteEditorProps {
  selectedNote: Note | null;
  notebooks: Notebook[];
  saveStatus: "saved" | "saving";
  scheduleSave: (id: number, updates: Partial<Note>) => void;
  flushSave: () => void;
  toggleFavorite: (id: number) => void;
  handleDeleteClick: (note: Note) => void;
  setSelectedNote: (note: Note | null) => void;
  updateNote: (id: number, updates: Partial<Note>) => void; // Used for immediate tag updates
  handleMoveNoteToNotebook: (notebookId: number | null) => void;
}

export default function NoteEditor({
  selectedNote,
  notebooks,
  saveStatus,
  scheduleSave,
  flushSave,
  toggleFavorite,
  handleDeleteClick,
  setSelectedNote,
  updateNote,
  handleMoveNoteToNotebook,
}: NoteEditorProps) {
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInputValue, setTagInputValue] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showTagInput && tagInputRef.current) tagInputRef.current.focus();
  }, [showTagInput]);

  if (!selectedNote) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: tk.bgSecondary }}
      >
        <p style={{ color: tk.textMuted }}>Select a note to view or edit</p>
      </div>
    );
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInputValue.trim()) {
      e.preventDefault();
      const newTag = tagInputValue.trim();
      if (!selectedNote.tags.includes(newTag)) {
        updateNote(selectedNote.id, { tags: [...selectedNote.tags, newTag] });
      }
      setTagInputValue("");
      setShowTagInput(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setTagInputValue("");
      setShowTagInput(false);
    }
  };

  // S3 Upload handler passed to RichTextEditor
  const handleFileUpload = async (file: File): Promise<string> => {
    return await noteService.uploadAttachment(selectedNote.id, file);
  };

  return (
    <div
      className="flex flex-1 flex-col min-w-0 h-full"
      style={{ backgroundColor: tk.bgSecondary }}
    >
      {/* Top Bar */}
      <div
        className="flex items-center justify-between p-3"
        style={{ borderBottom: `1px solid ${tk.border}` }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              flushSave();
              setSelectedNote(null);
            }}
            className="p-2 rounded-lg md:hidden"
            style={{ color: tk.textSecondary }}
          >
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: tk.textSecondary }}
          >
            <Folder size={16} style={{ color: tk.brand }} />
            <select
              value={selectedNote.notebook || ""}
              onChange={(e) =>
                handleMoveNoteToNotebook(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className="bg-transparent outline-none font-medium cursor-pointer"
              style={{ color: tk.textPrimary }}
            >
              <option value="">All Notes</option>
              {notebooks.map((nb) => (
                <option key={nb.id} value={nb.id}>
                  {nb.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs mr-2" style={{ color: tk.textMuted }}>
            {saveStatus === "saving" ? "Saving..." : "Saved"}
          </span>
          <button
            onClick={() => toggleFavorite(selectedNote.id)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: tk.textSecondary }}
          >
            <Star
              size={16}
              fill={selectedNote.is_favorite ? tk.warning : "none"}
              color={selectedNote.is_favorite ? tk.warning : tk.textSecondary}
            />
          </button>
          <button
            onClick={() => handleDeleteClick(selectedNote)}
            className="p-2 rounded-lg"
            style={{ color: tk.primary }}
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => {
              flushSave();
              setSelectedNote(null);
            }}
            className="p-2 rounded-lg"
            style={{ color: tk.textSecondary }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Title Input */}
      <div className="px-4 md:px-6 pt-4 pb-2">
        <input
          type="text"
          value={selectedNote.title}
          onChange={(e) => {
            const newTitle = e.target.value;
            setSelectedNote({ ...selectedNote, title: newTitle });
            scheduleSave(selectedNote.id, { title: newTitle });
          }}
          className="w-full text-2xl font-semibold outline-none bg-transparent"
          style={{ color: tk.heading }}
          placeholder="Title"
        />
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <RichTextEditor
          key={selectedNote.id}
          content={selectedNote.content}
          onChange={(html) => {
            setSelectedNote({ ...selectedNote, content: html });
            scheduleSave(selectedNote.id, { content: html });
          }}
          onFileUpload={handleFileUpload}
        />
      </div>

      {/* Bottom Tags */}
      <div
        className="px-4 md:px-6 py-3 flex items-center gap-2 flex-wrap"
        style={{ borderTop: `1px solid ${tk.border}` }}
      >
        <Tag size={16} style={{ color: tk.textMuted }} />
        <div className="flex gap-2 flex-wrap items-center">
          {selectedNote.tags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-1 rounded text-xs flex items-center gap-1"
              style={{ backgroundColor: `${tk.brand}20`, color: tk.brand }}
            >
              {tag}
              <button
                onClick={() =>
                  updateNote(selectedNote.id, {
                    tags: selectedNote.tags.filter((_, idx) => idx !== i),
                  })
                }
                className="hover:text-[var(--danger)]"
              >
                <X size={10} />
              </button>
            </span>
          ))}
          {!showTagInput ? (
            <button
              onClick={() => setShowTagInput(true)}
              className="px-2 py-1 border border-dashed rounded text-xs transition-colors"
              style={{ borderColor: tk.border, color: tk.textMuted }}
            >
              + Add Tag
            </button>
          ) : (
            <input
              ref={tagInputRef}
              type="text"
              value={tagInputValue}
              onChange={(e) => setTagInputValue(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              onBlur={() => {
                if (!tagInputValue.trim()) setShowTagInput(false);
              }}
              placeholder="Add tag..."
              className="px-2 py-1 border rounded text-xs outline-none"
              style={{
                borderColor: tk.brand,
                backgroundColor: tk.bgSecondary,
                color: tk.textPrimary,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

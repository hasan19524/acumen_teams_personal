"use client";
import React from "react";
import {
  Plus,
  Search,
  Star,
  Pin,
  Trash2,
  BookOpen,
  Folder,
  MoreVertical,
  StickyNote,
  FileText,
  Heart,
} from "lucide-react";
import { tk } from "@/lib/tokens";
import { Note, Notebook } from "../types/note";

interface NotesSidebarProps {
  notes: Note[];
  notebooks: Notebook[];
  selectedNote: Note | null;
  activeFilter: string;
  searchQuery: string;
  openNotebookMenu: number | null;
  setSelectedNote: (note: Note | null) => void;
  setActiveFilter: (filter: string) => void;
  setSearchQuery: (query: string) => void;
  flushSave: () => void;
  togglePin: (id: number) => void;
  toggleFavorite: (id: number) => void;
  setShowCreateModal: (show: boolean) => void;
  setShowCreateNotebook: (show: boolean) => void;
  setOpenNotebookMenu: (id: number | null) => void;
  handleOpenRenameNotebook: (notebook: Notebook) => void;
  handleOpenDeleteNotebook: (notebook: Notebook) => void;
}

export default function NotesSidebar({
  notes,
  notebooks,
  selectedNote,
  activeFilter,
  searchQuery,
  openNotebookMenu,
  setSelectedNote,
  setActiveFilter,
  setSearchQuery,
  flushSave,
  togglePin,
  toggleFavorite,
  setShowCreateModal,
  setShowCreateNotebook,
  setOpenNotebookMenu,
  handleOpenRenameNotebook,
  handleOpenDeleteNotebook,
}: NotesSidebarProps) {
  const filteredNotes = notes.filter((note) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  };

  const filterBtn = (isActive: boolean) => ({
    backgroundColor: isActive ? tk.surfaceHover : "transparent",
    color: isActive ? tk.brand : tk.textSecondary,
    ":hover": { backgroundColor: tk.surface },
  });

  return (
        <div className="w-full md:w-72 flex flex-col flex-shrink-0 h-full relative z-0" style={{ backgroundColor: tk.bg, borderRight: `1px solid ${tk.border}` }}>
      {/* Header */}
      <div className="p-4" style={{ borderBottom: `1px solid ${tk.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-lg font-bold flex items-center gap-2"
            style={{ color: tk.heading }}
          >
            <StickyNote size={20} style={{ color: tk.brand }} />
            Notes
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: tk.brand, color: tk.heading }}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2"
            size={14}
            style={{ color: tk.textMuted }}
          />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg pl-9 pr-3 py-2 text-sm placeholder-gray-500 outline-none focus:ring-1"
            style={{
              backgroundColor: tk.surface,
              color: tk.textPrimary,
              borderColor: tk.brand,
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="p-2 space-y-0.5">
        <button
          onClick={() => setActiveFilter("all")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          style={filterBtn(activeFilter === "all")}
        >
          <FileText size={15} /> All Notes
          <span className="ml-auto text-xs" style={{ color: tk.textMuted }}>
            {notes.length}
          </span>
        </button>
        <button
          onClick={() => setActiveFilter("favorites")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          style={filterBtn(activeFilter === "favorites")}
        >
          <Heart size={15} /> Favorites
        </button>
        <button
          onClick={() => setActiveFilter("pinned")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          style={filterBtn(activeFilter === "pinned")}
        >
          <Pin size={15} /> Pinned
        </button>
      </div>

      {/* Notebooks */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <h3
            className="text-xs font-semibold uppercase tracking-wider px-2"
            style={{ color: tk.textMuted }}
          >
            Notebooks
          </h3>
          <button
            onClick={() => setShowCreateNotebook(true)}
            className="p-1 transition-colors rounded"
            style={{ color: tk.textMuted }}
            title="Create notebook"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="space-y-0.5">
          {notebooks.map((notebook) => (
            <div key={notebook.id} className="group relative">
              <button
                onClick={() => setActiveFilter(`notebook_${notebook.id}`)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                style={filterBtn(activeFilter === `notebook_${notebook.id}`)}
              >
                <Folder size={15} style={{ color: notebook.color }} />
                <span className="flex-1 truncate text-left">
                  {notebook.name}
                </span>
                <span className="text-xs" style={{ color: tk.textMuted }}>
                  {notebook.note_count}
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenNotebookMenu(
                    openNotebookMenu === notebook.id ? null : notebook.id,
                  );
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: tk.textMuted }}
              >
                <MoreVertical size={14} />
              </button>
              {openNotebookMenu === notebook.id && (
                <div
                  className="absolute right-0 top-full mt-1 w-32 rounded-lg shadow-lg z-40"
                  style={{
                    backgroundColor: tk.surface,
                    border: `1px solid ${tk.border}`,
                  }}
                >
                  <button
                    onClick={() => handleOpenRenameNotebook(notebook)}
                    className="w-full text-left px-3 py-2 text-xs transition-colors first:rounded-t-lg"
                    style={{ color: tk.textSecondary }}
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleOpenDeleteNotebook(notebook)}
                    className="w-full text-left px-3 py-2 text-xs transition-colors last:rounded-b-lg"
                    style={{ color: tk.warning }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              flushSave();
              setSelectedNote({ ...note });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                flushSave();
                setSelectedNote({ ...note });
              }
            }}
            className="w-full text-left p-3 rounded-lg transition-all group cursor-pointer"
            style={{
              backgroundColor:
                selectedNote?.id === note.id ? tk.surfaceHover : "transparent",
              border:
                selectedNote?.id === note.id
                  ? `1px solid ${tk.brand}`
                  : `1px solid transparent`,
            }}
          >
            <div className="flex items-start justify-between mb-1">
              <h4
                className="font-medium text-sm truncate pr-2"
                style={{ color: tk.textPrimary }}
              >
                {note.title}
              </h4>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(note.id);
                  }}
                  className="p-1 rounded"
                  style={{ color: note.is_pinned ? tk.warning : tk.textMuted }}
                >
                  <Pin size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(note.id);
                  }}
                  className="p-1 rounded"
                  style={{
                    color: note.is_favorite ? tk.primary : tk.textMuted,
                  }}
                >
                  <Heart size={12} />
                </button>
              </div>
            </div>
            <p
              className="text-xs line-clamp-2 mb-2"
              style={{ color: tk.textMuted }}
            >
              {stripHtml(note.content) || "No content"}
            </p>
            <div
              className="flex items-center justify-between text-xs"
              style={{ color: tk.textMuted }}
            >
              <span>{formatDate(note.updated_at)}</span>
              {note.notebook_name && (
                <span className="flex items-center gap-1">
                  <BookOpen size={10} /> {note.notebook_name}
                </span>
              )}
            </div>
            {note.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {note.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-xs"
                    style={{
                      backgroundColor: `${tk.brand}20`,
                      color: tk.brand,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

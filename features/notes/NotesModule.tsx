"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  X,
  Sparkles,
  FileText,
  Lightbulb,
  GraduationCap,
  Briefcase,
  Calendar,
} from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { useNotes } from "./hooks/useNotes";
import NotesSidebar from "./components/NotesSidebar";
import NoteEditor from "./components/NoteEditor";
import { tk } from "@/lib/tokens";
import { noteService } from "./services/noteService";
import { Note, Notebook } from "./types/note";

const NOTEBOOK_COLORS = [
  { name: "Purple", value: "#8B5CF6" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Orange", value: "#F97316" },
  { name: "Red", value: "#EF4444" },
  { name: "Pink", value: "#EC4899" },
  { name: "Gray", value: "#6B7280" },
  { name: "Teal", value: "#14B8A6" },
];

const QUICK_START_TEMPLATES = [
  {
    key: "meeting",
    title: "Meeting Notes",
    description: "Capture agendas, decisions, and action items",
    icon: Calendar,
    noteTitle: "Meeting Notes",
  },
  {
    key: "ideas",
    title: "Ideas",
    description: "Jot down thoughts before they slip away",
    icon: Lightbulb,
    noteTitle: "New Idea",
  },
  {
    key: "study",
    title: "Study Notes",
    description: "Organize concepts, summaries, and key terms",
    icon: GraduationCap,
    noteTitle: "Study Notes",
  },
  {
    key: "project",
    title: "Project Docs",
    description: "Track specs, plans, and project details",
    icon: Briefcase,
    noteTitle: "Project Doc",
  },
];

export default function NotesModule() {
  const {
    notes,
    notebooks,
    selectedNote,
    activeFilter,
    loading,
    saveStatus,
    setActiveFilter,
    setSelectedNote,
    scheduleSave,
    flushSave,
    createNote,
    deleteNote,
    toggleFavorite,
    togglePin,
    createNotebook,
    renameNotebook,
    deleteNotebook,
    handleMoveNoteToNotebook,
  } = useNotes();

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteNotebook, setNewNoteNotebook] = useState<number | "">("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  const [showCreateNotebook, setShowCreateNotebook] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [newNotebookColor, setNewNotebookColor] = useState("#8B5CF6");

  const [showRenameNotebook, setShowRenameNotebook] = useState(false);
  const [notebookToRename, setNotebookToRename] = useState<Notebook | null>(
    null,
  );
  const [renameNotebookName, setRenameNotebookName] = useState("");
  const [renameNotebookColor, setRenameNotebookColor] = useState("");

  const [showDeleteNotebook, setShowDeleteNotebook] = useState(false);
  const [notebookToDelete, setNotebookToDelete] = useState<Notebook | null>(
    null,
  );
  const [openNotebookMenu, setOpenNotebookMenu] = useState<number | null>(null);

  useEffect(() => {
    const close = () => setOpenNotebookMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) return;
    await createNote(newNoteTitle, newNoteNotebook || null);
    setShowCreateModal(false);
    setNewNoteTitle("");
    setNewNoteNotebook("");
  };

  const handleDeleteClick = (note: Note) => {
    setNoteToDelete(note);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    await deleteNote(noteToDelete.id);
    setShowDeleteConfirm(false);
    setNoteToDelete(null);
  };

  const handleCreateNotebook = async () => {
    if (!newNotebookName.trim()) return;
    await createNotebook(newNotebookName, newNotebookColor);
    setShowCreateNotebook(false);
    setNewNotebookName("");
    setNewNotebookColor("#8B5CF6");
  };

  const handleRenameNotebook = async () => {
    if (!notebookToRename || !renameNotebookName.trim()) return;
    await renameNotebook(
      notebookToRename.id,
      renameNotebookName,
      renameNotebookColor,
    );
    setShowRenameNotebook(false);
    setNotebookToRename(null);
    setOpenNotebookMenu(null);
  };

  const handleDeleteNotebook = async () => {
    if (!notebookToDelete) return;
    await deleteNotebook(notebookToDelete.id);
    setShowDeleteNotebook(false);
    setNotebookToDelete(null);
    setOpenNotebookMenu(null);
  };

  const handleOpenRenameNotebook = (notebook: Notebook) => {
    setNotebookToRename(notebook);
    setRenameNotebookName(notebook.name);
    setRenameNotebookColor(notebook.color);
    setShowRenameNotebook(true);
    setOpenNotebookMenu(null);
  };

  const handleOpenDeleteNotebook = (notebook: Notebook) => {
    setNotebookToDelete(notebook);
    setShowDeleteNotebook(true);
    setOpenNotebookMenu(null);
  };

  // Immediate update for tags
  const updateNoteImmediate = async (id: number, updates: Partial<Note>) => {
    setSelectedNote((prev) =>
      prev && prev.id === id ? { ...prev, ...updates } : prev,
    );
    await noteService.updateNote(id, updates);
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ color: tk.textMuted }}
      >
        Loading notes...
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-full relative"
      style={{ backgroundColor: tk.bg }}
    >
      {/* Mobile Responsive Wrappers */}
      <div className={`w-full md:w-72 flex-shrink-0 ${selectedNote ? "hidden md:flex" : "flex"} flex-col h-full`}>
        <NotesSidebar
          notes={notes}
          notebooks={notebooks}
          selectedNote={selectedNote}
          activeFilter={activeFilter}
          searchQuery={searchQuery}
          openNotebookMenu={openNotebookMenu}
          setSelectedNote={setSelectedNote}
          setActiveFilter={setActiveFilter}
          setSearchQuery={setSearchQuery}
          flushSave={flushSave}
          togglePin={togglePin}
          toggleFavorite={toggleFavorite}
          setShowCreateModal={setShowCreateModal}
          setShowCreateNotebook={setShowCreateNotebook}
          setOpenNotebookMenu={setOpenNotebookMenu}
          handleOpenRenameNotebook={handleOpenRenameNotebook}
          handleOpenDeleteNotebook={handleOpenDeleteNotebook}
        />
      </div>

      <div className={`flex-1 w-full ${selectedNote ? "flex" : "hidden md:flex"} flex-col`}>
        {selectedNote ? (
          <NoteEditor
            selectedNote={selectedNote}
            notebooks={notebooks}
            saveStatus={saveStatus}
            scheduleSave={scheduleSave}
            flushSave={flushSave}
            toggleFavorite={toggleFavorite}
            handleDeleteClick={handleDeleteClick}
            setSelectedNote={setSelectedNote}
            updateNote={updateNoteImmediate}
            handleMoveNoteToNotebook={handleMoveNoteToNotebook}
          />
        ) : (
          /* Empty State */
          <div
            className="flex-1 overflow-y-auto"
            style={{ backgroundColor: tk.bgSecondary }}
          >
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
              <div
                className="mb-8 pb-8"
                style={{ borderBottom: `1px solid ${tk.border}` }}
              >
                <h1
                  className="text-3xl font-bold mb-2 tracking-tight"
                  style={{ color: tk.heading }}
                >
                  Welcome back 👋
                </h1>
                <p
                  className="text-base mb-5 leading-relaxed max-w-md"
                  style={{ color: tk.textSecondary }}
                >
                  Capture ideas, meeting notes, research and documents.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium shadow-md transition-all duration-200 hover:-translate-y-0.5"
                  style={{ backgroundColor: tk.brand, color: tk.heading }}
                >
                  <Plus size={18} /> Create New Note
                </button>
              </div>

              {notes.length === 0 && (
                <div className="flex flex-col items-center text-center pt-2 pb-10">
                  <h2
                    className="text-2xl font-bold mb-1.5"
                    style={{ color: tk.heading }}
                  >
                    No notes yet
                  </h2>
                  <p
                    className="max-w-sm mb-4 leading-relaxed"
                    style={{ color: tk.textSecondary }}
                  >
                    Your first note is just one click away. Start writing and
                    watch your workspace come to life.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium shadow-md transition-all duration-200 hover:-translate-y-0.5 mb-6"
                    style={{ backgroundColor: tk.brand, color: tk.heading }}
                  >
                    <Sparkles size={18} /> Create Your First Note
                  </button>
                  <div className="w-full max-w-3xl">
                    <h3
                      className="text-xs font-semibold uppercase tracking-wider mb-4 text-left"
                      style={{ color: tk.textMuted }}
                    >
                      Quick Start
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {QUICK_START_TEMPLATES.map((template) => {
                        const Icon = template.icon;
                        return (
                          <button
                            key={template.key}
                            onClick={() => {
                              setNewNoteTitle(template.noteTitle);
                              setShowCreateModal(true);
                            }}
                            className="flex flex-col items-start gap-3 p-5 rounded-2xl shadow-sm transition-all duration-200 text-left hover:-translate-y-1"
                            style={{
                              backgroundColor: tk.surface,
                              border: `1px solid ${tk.border}`,
                            }}
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${tk.brand}20` }}
                            >
                              <Icon size={18} style={{ color: tk.brand }} />
                            </div>
                            <div>
                              <p
                                className="text-sm font-semibold mb-1"
                                style={{ color: tk.textPrimary }}
                              >
                                {template.title}
                              </p>
                              <p
                                className="text-xs leading-relaxed"
                                style={{ color: tk.textMuted }}
                              >
                                {template.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals (Create Note, Create/Rename/Delete Notebook) */}
      {noteToDelete && (
        <ConfirmDeleteDialog
          isOpen={showDeleteConfirm}
          noteTitle={noteToDelete.title}
          noteContent={noteToDelete.content}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setNoteToDelete(null);
          }}
        />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="rounded-2xl p-6 w-96"
            style={{
              backgroundColor: tk.surface,
              border: `1px solid ${tk.border}`,
            }}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: tk.heading }}
            >
              Create New Note
            </h3>
            <input
              type="text"
              placeholder="Note title..."
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter"
                  ? handleCreateNote()
                  : e.key === "Escape"
                    ? setShowCreateModal(false)
                    : null
              }
              className="w-full rounded-lg px-4 py-3 mb-3 outline-none focus:ring-1"
              style={{
                backgroundColor: tk.bg,
                color: tk.textPrimary,
                borderColor: tk.brand,
              }}
            />
            <select
              value={newNoteNotebook}
              onChange={(e) =>
                setNewNoteNotebook(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full rounded-lg px-4 py-3 mb-4 outline-none focus:ring-1"
              style={{ backgroundColor: tk.bg, color: tk.textPrimary }}
            >
              <option value="">Select Notebook (Optional)</option>
              {notebooks.map((nb) => (
                <option key={nb.id} value={nb.id}>
                  {nb.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewNoteTitle("");
                  setNewNoteNotebook("");
                }}
                className="px-4 py-2 transition-colors"
                style={{ color: tk.textMuted }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNote}
                disabled={!newNoteTitle.trim()}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: newNoteTitle.trim()
                    ? tk.brand
                    : tk.surfaceHover,
                  color: tk.heading,
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateNotebook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="rounded-2xl p-6 w-96"
            style={{
              backgroundColor: tk.surface,
              border: `1px solid ${tk.border}`,
            }}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: tk.heading }}
            >
              Create Notebook
            </h3>
            <input
              type="text"
              placeholder="Notebook name..."
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" ? handleCreateNotebook() : null
              }
              className="w-full rounded-lg px-4 py-3 mb-4 outline-none focus:ring-1"
              style={{
                backgroundColor: tk.bg,
                color: tk.textPrimary,
                borderColor: tk.brand,
              }}
            />
            <div className="mb-4">
              <p className="text-sm mb-2" style={{ color: tk.textSecondary }}>
                Color
              </p>
              <div className="grid grid-cols-4 gap-2">
                {NOTEBOOK_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewNotebookColor(color.value)}
                    className={`w-full h-10 rounded-lg transition-all border-2 ${newNotebookColor === color.value ? "border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreateNotebook(false);
                  setNewNotebookName("");
                  setNewNotebookColor("#8B5CF6");
                }}
                className="px-4 py-2"
                style={{ color: tk.textMuted }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNotebook}
                disabled={!newNotebookName.trim()}
                className="px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: newNotebookName.trim()
                    ? tk.brand
                    : tk.surfaceHover,
                  color: tk.heading,
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showRenameNotebook && notebookToRename && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="rounded-2xl p-6 w-96"
            style={{
              backgroundColor: tk.surface,
              border: `1px solid ${tk.border}`,
            }}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: tk.heading }}
            >
              Rename Notebook
            </h3>
            <input
              type="text"
              placeholder="Notebook name..."
              value={renameNotebookName}
              onChange={(e) => setRenameNotebookName(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" ? handleRenameNotebook() : null
              }
              className="w-full rounded-lg px-4 py-3 mb-4 outline-none focus:ring-1"
              style={{
                backgroundColor: tk.bg,
                color: tk.textPrimary,
                borderColor: tk.brand,
              }}
            />
            <div className="mb-4">
              <p className="text-sm mb-2" style={{ color: tk.textSecondary }}>
                Color
              </p>
              <div className="grid grid-cols-4 gap-2">
                {NOTEBOOK_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setRenameNotebookColor(color.value)}
                    className={`w-full h-10 rounded-lg transition-all border-2 ${renameNotebookColor === color.value ? "border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowRenameNotebook(false);
                  setNotebookToRename(null);
                }}
                className="px-4 py-2"
                style={{ color: tk.textMuted }}
              >
                Cancel
              </button>
              <button
                onClick={handleRenameNotebook}
                disabled={!renameNotebookName.trim()}
                className="px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: renameNotebookName.trim()
                    ? tk.brand
                    : tk.surfaceHover,
                  color: tk.heading,
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteNotebook && notebookToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="rounded-xl p-6 w-96 shadow-lg"
            style={{
              backgroundColor: tk.surface,
              border: `1px solid ${tk.border}`,
            }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${tk.primary}20` }}
              >
                <Trash2 size={20} style={{ color: tk.primary }} />
              </div>
              <div className="flex-1 pt-0.5">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: tk.heading }}
                >
                  Delete notebook?
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowDeleteNotebook(false);
                  setNotebookToDelete(null);
                }}
                style={{ color: tk.textMuted }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="mb-4">
              <p
                className="text-sm font-medium mb-1"
                style={{ color: tk.textPrimary }}
              >
                {notebookToDelete.name}
              </p>
              <p className="text-sm" style={{ color: tk.textSecondary }}>
                If this notebook contains notes, those notes will be moved to
                All Notes.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteNotebook(false);
                  setNotebookToDelete(null);
                }}
                className="px-4 py-2 rounded-lg font-medium"
                style={{
                  backgroundColor: tk.surfaceHover,
                  color: tk.textPrimary,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteNotebook}
                className="px-4 py-2 rounded-lg font-medium"
                style={{ backgroundColor: tk.primary, color: tk.heading }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import { noteService } from "../services/noteService";
import { Note, Notebook } from "../types/note";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");

  const pendingSaveRef = useRef<{ id: number; updates: Partial<Note> } | null>(
    null,
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await noteService.getNotes(activeFilter);
      setNotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  const fetchNotebooks = useCallback(async () => {
    try {
      const data = await noteService.getNotebooks();
      setNotebooks(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
    fetchNotebooks();
  }, [activeFilter, fetchNotes, fetchNotebooks]);

  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const pending = pendingSaveRef.current;
    pendingSaveRef.current = null;
    if (!pending) return;

    setSaveStatus("saving");
    try {
      const updated = await noteService.updateNote(pending.id, pending.updates);
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setSelectedNote((prev) => (prev?.id === updated.id ? updated : prev));
    } catch (err) {
      console.error("Failed to flush save", err);
    } finally {
      setSaveStatus("saved");
    }
  }, []);

  const scheduleSave = useCallback(
    (id: number, updates: Partial<Note>) => {
      if (pendingSaveRef.current && pendingSaveRef.current.id !== id) {
        flushSave();
      }
      pendingSaveRef.current = {
        id,
        updates: {
          ...(pendingSaveRef.current?.id === id
            ? pendingSaveRef.current.updates
            : {}),
          ...updates,
        },
      };
      setSaveStatus("saving");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(flushSave, 800);
    },
    [flushSave],
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const createNote = async (title: string, notebook: number | null) => {
    const note = await noteService.createNote({ title, content: "", notebook });
    setNotes([note, ...notes]);
    setSelectedNote({ ...note });
    await fetchNotebooks();
  };

  const deleteNote = async (id: number) => {
    await noteService.deleteNote(id);
    setNotes(notes.filter((n) => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);
    await fetchNotebooks();
  };

  const toggleFavorite = async (id: number) => {
    const data = await noteService.toggleFavorite(id);
    setNotes(
      notes.map((n) =>
        n.id === id ? { ...n, is_favorite: data.is_favorite } : n,
      ),
    );
    if (selectedNote?.id === id)
      setSelectedNote({ ...selectedNote, is_favorite: data.is_favorite });
  };

  const togglePin = async (id: number) => {
    const data = await noteService.togglePin(id);
    setNotes(
      notes.map((n) => (n.id === id ? { ...n, is_pinned: data.is_pinned } : n)),
    );
  };

  const createNotebook = async (name: string, color: string) => {
    const newNotebook = await noteService.createNotebook({ name, color });
    setNotebooks([...notebooks, newNotebook]);
    setActiveFilter(`notebook_${newNotebook.id}`);
    await fetchNotes();
  };

  const renameNotebook = async (id: number, name: string, color: string) => {
    const updated = await noteService.updateNotebook(id, { name, color });
    setNotebooks(notebooks.map((nb) => (nb.id === id ? updated : nb)));
    if (selectedNote?.notebook === id) {
      setSelectedNote({ ...selectedNote, notebook_name: updated.name });
    }
  };

  const deleteNotebook = async (id: number) => {
    await noteService.deleteNotebook(id);
    setNotebooks(notebooks.filter((nb) => nb.id !== id));
    if (activeFilter === `notebook_${id}`) setActiveFilter("all");
    if (selectedNote?.notebook === id) {
      setSelectedNote({ ...selectedNote, notebook: null, notebook_name: "" });
    }
    await fetchNotes();
  };

  const handleMoveNoteToNotebook = async (notebookId: number | null) => {
    if (!selectedNote) return;
    await noteService.updateNote(selectedNote.id, { notebook: notebookId });
    await fetchNotebooks();
  };

  return {
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
    fetchNotebooks,
  };
}

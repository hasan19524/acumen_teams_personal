"use client";

import React, { useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { tk } from "@/lib/tokens";

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  noteTitle: string;
  noteContent: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteDialog({
  isOpen,
  noteTitle,
  noteContent,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const plainText =
    new DOMParser().parseFromString(noteContent, "text/html").body
      .textContent || "";

  const PREVIEW_LENGTH = 20;

  const preview = plainText.slice(0, PREVIEW_LENGTH);
  const hasMoreContent = plainText.length > PREVIEW_LENGTH;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="rounded-xl p-6 w-96 shadow-lg"
        style={{ background: tk.surface, border: `1px solid ${tk.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: tk.tintDanger }}
          >
            <Trash2 size={22} strokeWidth={2} style={{ color: tk.danger }} />
          </div>
          <div className="flex-1 pt-0.5">
            <h2 className="text-lg font-semibold" style={{ color: tk.heading }}>
              Delete Note
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="transition-colors"
            style={{ color: tk.textMuted }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Note Title */}
        <div className="mb-4">
          <p className="text-sm mb-1" style={{ color: tk.textSecondary }}>
            Note title:
          </p>
          <p
            className="text-base font-medium line-clamp-2"
            style={{ color: tk.heading }}
          >
            {noteTitle}
          </p>
        </div>

        {/* Content Preview */}
        {noteContent && (
          <div
            className="mb-4 p-3 rounded-lg"
            style={{
              background: tk.bgSecondary,
              border: `1px solid ${tk.border}`,
            }}
          >
            <p className="text-sm" style={{ color: tk.textSecondary }}>
              {preview}
              {hasMoreContent && "…"}
            </p>
          </div>
        )}

        {/* Warning Message */}
        <p className="text-sm mb-6" style={{ color: tk.textSecondary }}>
          This action cannot be undone.
        </p>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ background: tk.surfaceHover, color: tk.textSecondary }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-[var(--heading)] rounded-lg font-medium transition-colors"
            style={{ background: tk.danger }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

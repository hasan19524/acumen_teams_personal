"use client";

import type { Editor } from "@tiptap/react";
import { useState } from "react";
import { tk } from "@/lib/tokens";
import { CheckSquare, Image, Paperclip, Table, ArrowLeft } from "lucide-react";

interface PlusMenuProps {
  editor: Editor | null;
  onChecklist: () => void;
  onImage: () => void;
  onFile: () => void;
  onTable: (rows: number, cols: number) => void;
}
export default function PlusMenu({
  editor,
  onChecklist,
  onImage,
  onFile,
  onTable,
}: PlusMenuProps) {
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [hoveredRows, setHoveredRows] = useState(0);
  const [hoveredCols, setHoveredCols] = useState(0);

  const itemHover = (e: React.MouseEvent<HTMLElement>, on: boolean) => {
    e.currentTarget.style.background = on ? tk.tintBrand : "transparent";
    e.currentTarget.style.color = on ? tk.brand : tk.textSecondary;
  };

  return (
    <div
      className="w-52 rounded-xl border shadow-xl p-2"
      style={{
        background: tk.surface,
        borderColor: tk.border,
        color: tk.textPrimary,
      }}
    >
      <button
        onClick={onChecklist}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors"
        style={{ color: tk.textSecondary }}
        onMouseEnter={(e) => itemHover(e, true)}
        onMouseLeave={(e) => itemHover(e, false)}
      >
        <CheckSquare size={18} />
        <span>To-do Checklist</span>
      </button>
      <button
        onClick={onImage}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors"
        style={{ color: tk.textSecondary }}
        onMouseEnter={(e) => itemHover(e, true)}
        onMouseLeave={(e) => itemHover(e, false)}
      >
        <Image size={18} />
        <span>Upload Image</span>
      </button>

      <button
        onClick={onFile}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors"
        style={{ color: tk.textSecondary }}
        onMouseEnter={(e) => itemHover(e, true)}
        onMouseLeave={(e) => itemHover(e, false)}
      >
        <Paperclip size={18} />
        <span>Attach File</span>
      </button>
      {showTablePicker ? (
        <div className="mt-2 border-t pt-2" style={{ borderColor: tk.border }}>
          <div
            onClick={() => setShowTablePicker(false)}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg transition"
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = tk.surfaceHover)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <ArrowLeft size={18} />
            <span className="font-medium">Insert Table</span>
          </div>
          <div className="grid grid-cols-10 gap-1 px-3 pt-2">
            {Array.from({ length: 100 }).map((_, index) => {
              const row = Math.floor(index / 10) + 1;
              const col = (index % 10) + 1;

              const active = row <= hoveredRows && col <= hoveredCols;

              return (
                <div
                  key={index}
                  onMouseEnter={() => {
                    setHoveredRows(row);
                    setHoveredCols(col);
                  }}
                  onClick={() => {
                    onTable(row, col);
                    setShowTablePicker(false);
                  }}
                  className="h-4 w-4 border cursor-pointer transition-colors"
                  style={{
                    background: active ? tk.brand : "transparent",
                    borderColor: active ? tk.brand : tk.border,
                  }}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowTablePicker(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors"
          style={{ color: tk.textSecondary }}
          onMouseEnter={(e) => itemHover(e, true)}
          onMouseLeave={(e) => itemHover(e, false)}
        >
          <Table size={18} />
          <span>Insert Table</span>
        </button>
      )}
    </div>
  );
}

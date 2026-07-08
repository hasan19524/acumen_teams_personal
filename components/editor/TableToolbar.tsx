"use client";

import type { Editor } from "@tiptap/react";
import { tk } from "@/lib/tokens";
import { Plus, Columns3, Trash2 } from "lucide-react";

interface TableToolbarProps {
  editor: Editor;
}

export default function TableToolbar({ editor }: TableToolbarProps) {
  return (
    <div
      className="
inline-flex
items-center
gap-2
rounded-xl
border
px-3
py-2
shadow-xl
"
      style={{ background: tk.surface, borderColor: tk.border }}
    >
      <button
        onClick={() => editor.chain().focus().addRowAfter().run()}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition"
        style={{ background: tk.tintBrand, color: tk.brand }}
      >
        <Plus size={16} />
        <span>Row</span>
      </button>

      <button
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition"
        style={{ background: tk.tintBrand, color: tk.brand }}
      >
        <Columns3 size={16} />
        <span>Column</span>
      </button>
      <div className="h-6 w-px" style={{ background: tk.border }} />

      <button
        onClick={() => editor.chain().focus().deleteTable().run()}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition"
        style={{ background: tk.tintDanger, color: tk.danger }}
      >
        <Trash2 size={16} />
        <span>Delete</span>
      </button>
    </div>
  );
}

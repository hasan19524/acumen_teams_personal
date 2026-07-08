"use client";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import ResizableImage from "@/components/editor/extensions/ResizableImage";
import { useState } from "react";
import PlusMenu from "@/components/editor/PlusMenu";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import UnderlineExtension from "@tiptap/extension-underline";
import FileAttachment from "@/components/editor/extensions/FileAttachment";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableToolbar from "@/components/editor/TableToolbar";
import { tk } from "@/lib/tokens";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onFileUpload?: (file: File) => Promise<string>; // Returns S3 URL
}

export default function RichTextEditor({
  content,
  onChange,
  onFileUpload,
}: RichTextEditorProps) {
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [isTableActive, setIsTableActive] = useState(false);

  const insertChecklist = () => {
    if (!editor) return;
    editor.chain().focus().toggleTaskList().run();
    setShowPlusMenu(false);
  };

  const insertImage = async () => {
    if (!editor) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      let imageUrl = URL.createObjectURL(file); // Fallback optimistic preview

      if (onFileUpload) {
        try {
          imageUrl = await onFileUpload(file); // Wait for real S3 URL
        } catch (err) {
          console.error("Image upload failed", err);
          alert("Image upload failed. Using local preview.");
        }
      }

      editor
        .chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: {
            src: imageUrl,
            alt: file.name,
            title: file.name,
          },
        })
        .run();
      setShowPlusMenu(false);
    };
    input.click();
  };

  const insertFile = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;

    input.onchange = async () => {
      const files = input.files;
      if (!files || !editor) return;

      const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
      };

      for (const file of Array.from(files)) {
        let fileUrl = URL.createObjectURL(file);

        if (onFileUpload) {
          try {
            fileUrl = await onFileUpload(file);
          } catch (err) {
            console.error("File upload failed", err);
            alert("File upload failed. Using local preview.");
          }
        }

        editor
          .chain()
          .focus()
          .insertContent({
            type: "fileAttachment",
            attrs: {
              filename: file.name,
              size: formatSize(file.size),
              url: fileUrl,
              mimeType: file.type,
            },
          })
          .run();
      }
    };
    input.click();
  };

  const insertTable = (rows: number, cols: number) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
    setShowPlusMenu(false);
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      UnderlineExtension,
      ResizableImage,
      TaskList,
      FileAttachment,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { class: "task-item" },
      }),
      Placeholder.configure({ placeholder: "Start writing your note here..." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
    },
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      setIsTableActive(editor.isActive("table"));
    },
    onSelectionUpdate: ({ editor }) => {
      setIsTableActive(editor.isActive("table"));
    },
  });

  const btnBase = "p-2 rounded transition-colors";
  const btnActive = { backgroundColor: tk.surfaceHover, color: tk.brand };
  const btnInactive = { color: tk.textSecondary };

  return (
    <div
      className="flex flex-col h-full min-h-0"
      style={{ backgroundColor: tk.bgSecondary }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-1 px-4 py-2"
        style={{ borderBottom: `1px solid ${tk.border}` }}
      >
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().toggleUnderline().run();
          }}
          className={btnBase}
          style={editor?.isActive("underline") ? btnActive : btnInactive}
        >
          <Underline size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().toggleBold().run();
          }}
          className={btnBase}
          style={editor?.isActive("bold") ? btnActive : btnInactive}
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().toggleItalic().run();
          }}
          className={btnBase}
          style={editor?.isActive("italic") ? btnActive : btnInactive}
        >
          <Italic size={16} />
        </button>

        <div className="w-px h-6 mx-2" style={{ backgroundColor: tk.border }} />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().toggleBulletList().run();
          }}
          className={btnBase}
          style={editor?.isActive("bulletList") ? btnActive : btnInactive}
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().toggleOrderedList().run();
          }}
          className={btnBase}
          style={editor?.isActive("orderedList") ? btnActive : btnInactive}
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().setTextAlign("left").run();
          }}
          className={btnBase}
          style={
            editor?.isActive({ textAlign: "left" }) ? btnActive : btnInactive
          }
        >
          <AlignLeft size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().setTextAlign("center").run();
          }}
          className={btnBase}
          style={
            editor?.isActive({ textAlign: "center" }) ? btnActive : btnInactive
          }
        >
          <AlignCenter size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().setTextAlign("right").run();
          }}
          className={btnBase}
          style={
            editor?.isActive({ textAlign: "right" }) ? btnActive : btnInactive
          }
        >
          <AlignRight size={16} />
        </button>

        <div className="w-px h-6 mx-2" style={{ backgroundColor: tk.border }} />
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPlusMenu(!showPlusMenu)}
            className={btnBase}
            style={showPlusMenu ? btnActive : btnInactive}
          >
            <Plus size={18} />
          </button>

          {showPlusMenu && (
            <div className="absolute top-14 right-0 z-50">
              <PlusMenu
                onChecklist={insertChecklist}
                onImage={insertImage}
                editor={editor}
                onFile={insertFile}
                onTable={insertTable}
              />
            </div>
          )}
        </div>
      </div>

      {isTableActive && editor && (
        <div className="px-6 pt-3">
          <TableToolbar editor={editor} />
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <EditorContent
          editor={editor}
          className="prose max-w-none h-full focus:outline-none"
        />
      </div>
    </div>
  );
}

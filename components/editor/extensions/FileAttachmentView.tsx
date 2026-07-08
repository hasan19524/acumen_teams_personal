import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useState } from "react";
import { tk } from "@/lib/tokens";
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileSpreadsheet,
  FileCode,
  MoreHorizontal,
  Download,
  Copy,
  Trash2,
  ExternalLink,
} from "lucide-react";
export default function FileAttachmentView({
  node,
  selected,
  editor,
  getPos,
}: NodeViewProps) {
  const [showMenu, setShowMenu] = useState(false);

  const openFile = () => {
    window.open(node.attrs.url, "_blank");
  };

  const downloadFile = () => {
    const link = document.createElement("a");

    link.href = node.attrs.url;
    link.download = node.attrs.filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyFileLink = async () => {
    try {
      await navigator.clipboard.writeText(node.attrs.url);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteFile = () => {
    const pos = getPos?.();

    if (typeof pos !== "number") return;

    editor
      .chain()
      .focus()
      .deleteRange({
        from: pos,
        to: pos + node.nodeSize,
      })
      .run();
  };
  const getFileIcon = () => {
    const type = node.attrs.mimeType;

    if (type.startsWith("image/")) {
      return <FileImage size={28} className="text-green-500" />;
    }

    if (type.startsWith("video/")) {
      return <FileVideo size={28} className="text-purple-500" />;
    }

    if (type.startsWith("audio/")) {
      return <FileAudio size={28} className="text-pink-500" />;
    }

    if (
      type.includes("zip") ||
      type.includes("rar") ||
      type.includes("compressed")
    ) {
      return <FileArchive size={28} className="text-yellow-500" />;
    }

    if (type.includes("excel") || type.includes("spreadsheet")) {
      return <FileSpreadsheet size={28} className="text-green-600" />;
    }

    if (
      type.includes("javascript") ||
      type.includes("json") ||
      type.includes("typescript") ||
      type.includes("html") ||
      type.includes("css")
    ) {
      return <FileCode size={28} className="text-blue-500" />;
    }

    return <FileText size={28} className="text-red-500" />;
  };
  return (
    <NodeViewWrapper className="relative w-full">
      <div
        onDoubleClick={openFile}
        className="
  relative
  flex
  items-center
  gap-4
  px-4
  py-3
  max-w-md
  rounded-2xl
  border
  cursor-pointer
  transition-all
  duration-200
  hover:shadow-md
  hover:-translate-y-0.5
"
        style={{ background: tk.surface, borderColor: tk.border }}
      >
        {showMenu && (
          <div
            className="
      absolute
      top-0
     left-full
    ml-2
      right-2
      z-[9999]
      w-56
      rounded-xl
      border
      shadow-xl
    "
            style={{ background: tk.surface, borderColor: tk.border }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                openFile();
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2"
              style={{ color: tk.textPrimary }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = tk.surfaceHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <ExternalLink size={16} />
              Open File
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadFile();
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2"
              style={{ color: tk.textPrimary }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = tk.surfaceHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Download size={16} />
              Download
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                copyFileLink();
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2"
              style={{ color: tk.textPrimary }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = tk.surfaceHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Copy size={16} />
              Copy Link
            </button>

            <div className="my-2 border-t" style={{ borderColor: tk.border }} />

            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteFile();
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2"
              style={{ color: tk.danger }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = tk.tintDanger)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}
        <div
          className="
    w-11
    h-11
    rounded-xl
    flex
    items-center
    justify-center
    shrink-0
  "
          style={{ background: tk.bgSecondary }}
        >
          {getFileIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className="font-medium truncate"
              style={{ color: tk.heading }}
            >
              {node.attrs.filename}
            </span>

            {selected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-full
          transition-colors
          shrink-0
        "
                style={{ color: tk.textSecondary }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = tk.surfaceHover)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <MoreHorizontal size={16} />
              </button>
            )}
          </div>

          <span className="text-xs" style={{ color: tk.textMuted }}>
            {node.attrs.size} • {node.attrs.mimeType.split("/")[0]}
          </span>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

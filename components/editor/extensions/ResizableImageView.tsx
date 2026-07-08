import { NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useState } from "react";
import { tk } from "@/lib/tokens";

import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Replace,
  MoreHorizontal,
  Maximize2,
} from "lucide-react";
import { GripVertical } from "lucide-react";

export default function ResizableImageView({
  node,
  updateAttributes,
  selected,
  editor,
  getPos,
}: NodeViewProps) {
  const [showMenu, setShowMenu] = useState(false);
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    if (node.attrs.fullWidth) return;
    const startX = e.clientX;
    const startWidth = node.attrs.width ? parseInt(node.attrs.width) : 500;
    const image = e.currentTarget.parentElement?.querySelector(
      "img",
    ) as HTMLImageElement;

    const aspectRatio =
      image?.naturalWidth && image?.naturalHeight
        ? image.naturalWidth / image.naturalHeight
        : 1;
    const onMouseMove = (event: MouseEvent) => {
      const newWidth = Math.max(150, startWidth + (event.clientX - startX));

      updateAttributes({
        width: `${newWidth}px`,
        height: `${newWidth / aspectRatio}px`,
      });
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };
  const deleteImage = () => {
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
  const replaceImage = () => {
    const input = document.createElement("input");

    input.type = "file";
    input.accept = "image/*";

    input.onchange = () => {
      const file = input.files?.[0];

      if (!file) return;

      const url = URL.createObjectURL(file);

      updateAttributes({
        src: url,
        alt: file.name,
      });
    };

    input.click();
  };
  const setAlign = (align: "left" | "center" | "right") => {
    updateAttributes({
      align,
    });
  };
  const toggleFullWidth = () => {
    updateAttributes({
      fullWidth: !node.attrs.fullWidth,
    });
  };
  const copyImage = async () => {
    try {
      const response = await fetch(node.attrs.src);
      const blob = await response.blob();

      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const downloadImage = () => {
    const link = document.createElement("a");

    link.href = node.attrs.src;
    link.download = node.attrs.alt || "image";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <NodeViewWrapper
      className={`
      w-full
      ${
        node.attrs.align === "left"
          ? "text-left"
          : node.attrs.align === "right"
            ? "text-right"
            : "text-center"
      }
    `}
    >
      {/* Image container */}
      <div
        className={`relative ${
          node.attrs.fullWidth ? "block w-full" : "inline-block"
        }`}
      >
        {selected && (
          <div
            className="
            absolute
            -top-12
            left-1/2
            -translate-x-1/2
            flex
            items-center
            gap-1
            border
            rounded-xl
            shadow-lg
            px-2
            py-1
            z-50
          "
            style={{
              background: tk.surface,
              borderColor: tk.border,
              color: tk.textPrimary,
            }}
          >
            <div
              data-drag-handle
              className="
    p-2
    rounded-lg
    cursor-grab
    active:cursor-grabbing
  "
              title="Move"
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = tk.surfaceHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <GripVertical size={16} />
            </div>
            <button
              onClick={() => setAlign("left")}
              className="p-2 rounded-lg"
              style={
                node.attrs.align === "left"
                  ? { background: tk.tintIndigo, color: tk.indigo }
                  : {}
              }
              onMouseEnter={(e) => {
                if (node.attrs.align !== "left")
                  e.currentTarget.style.background = tk.surfaceHover;
              }}
              onMouseLeave={(e) => {
                if (node.attrs.align !== "left")
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <AlignLeft size={16} />
            </button>

            <button
              onClick={() => setAlign("center")}
              className="p-2 rounded-lg"
              style={
                node.attrs.align === "center"
                  ? { background: tk.tintIndigo, color: tk.indigo }
                  : {}
              }
              onMouseEnter={(e) => {
                if (node.attrs.align !== "center")
                  e.currentTarget.style.background = tk.surfaceHover;
              }}
              onMouseLeave={(e) => {
                if (node.attrs.align !== "center")
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <AlignCenter size={16} />
            </button>

            <button
              onClick={() => setAlign("right")}
              className="p-2 rounded-lg"
              style={
                node.attrs.align === "right"
                  ? { background: tk.tintIndigo, color: tk.indigo }
                  : {}
              }
              onMouseEnter={(e) => {
                if (node.attrs.align !== "right")
                  e.currentTarget.style.background = tk.surfaceHover;
              }}
              onMouseLeave={(e) => {
                if (node.attrs.align !== "right")
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <AlignRight size={16} />
            </button>
            <button
              onClick={toggleFullWidth}
              className="p-2 rounded-lg transition"
              style={
                node.attrs.fullWidth
                  ? { background: tk.tintBrand, color: tk.brand }
                  : {}
              }
              onMouseEnter={(e) => {
                if (!node.attrs.fullWidth)
                  e.currentTarget.style.background = tk.surfaceHover;
              }}
              onMouseLeave={(e) => {
                if (!node.attrs.fullWidth)
                  e.currentTarget.style.background = "transparent";
              }}
              title="Full Width"
            >
              <Maximize2 size={16} />
            </button>
            <button
              onClick={replaceImage}
              className="p-2 rounded-lg"
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = tk.surfaceHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              title="Replace Image"
            >
              <Replace size={16} />
            </button>

            <button
              onClick={deleteImage}
              className="p-2 rounded-lg"
              style={{ color: tk.danger }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = tk.tintDanger)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              title="Delete"
            >
              <Trash2 size={16} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = tk.surfaceHover)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <MoreHorizontal size={16} />
              </button>

              {showMenu && (
                <div
                  className="
        absolute
        right-0
        top-10
        w-44
        rounded-xl
        shadow-xl
        border
        overflow-hidden
        z-50
      "
                  style={{ background: tk.surface, borderColor: tk.border }}
                >
                  <button
                    onClick={() => {
                      copyImage();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = tk.surfaceHover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    📋 Copy Image
                  </button>

                  <button
                    onClick={() => {
                      downloadImage();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = tk.surfaceHover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    ⬇ Download Image
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <img
          src={node.attrs.src}
          alt={node.attrs.alt}
          style={{
            width: node.attrs.fullWidth ? "100%" : node.attrs.width,

            height: node.attrs.height,

            maxWidth: "100%",

            display: "block",

            userSelect: "none",
          }}
        />

        {selected && (
          <div
            onMouseDown={startResize}
            className="
            absolute
            w-4
            h-4
            bottom-0
            right-0
            rounded-full
            cursor-se-resize
          "
            style={{ background: tk.brand }}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
}

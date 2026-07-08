import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import FileAttachmentView from "./FileAttachmentView";

const FileAttachment = Node.create({
  name: "fileAttachment",

  group: "block",

  atom: true,

  selectable: true,

  draggable: true,

  addAttributes() {
    return {
      filename: {
        default: "",
      },

      url: {
        default: "",
      },

      size: {
        default: "",
      },

      mimeType: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "file-attachment",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["file-attachment", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileAttachmentView);
  },
});

export default FileAttachment;

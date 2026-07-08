import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ResizableImageView from "./ResizableImageView";

const ResizableImage = Image.extend({
  draggable: true,
    addNodeView() {
  return ReactNodeViewRenderer(ResizableImageView);
},
  addAttributes() {
    return {
      ...this.parent?.(),

      width: {
        default: "500px",
      },

height: {
    default: null,
},
align: {
  default: "center",
},
fullWidth: {
    default: false,
},

    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      {
        ...HTMLAttributes,
        style: `
          width:${HTMLAttributes.width};
          height:${HTMLAttributes.height};
          max-width:100%;
          cursor:pointer;
        `,
      },
    ];
  },
});

export default ResizableImage;

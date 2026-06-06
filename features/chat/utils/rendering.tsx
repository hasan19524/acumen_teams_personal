// features/chat/utils/rendering.ts

import React from "react";
import { T } from "../design/tokens";

/**
 * Renders message text with clickable URLs.
 * Pure function — no React state dependencies.
 */
export function renderMessageContent(text: string, isMine: boolean) {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: isMine ? "#93c5fd" : T.accentHover,
            textDecoration: "none",
            wordBreak: "break-all",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = "none";
          }}
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * Resolves relative file URLs to absolute URLs using the API base.
 */
export function resolveFileUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  return `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}${url}`;
}
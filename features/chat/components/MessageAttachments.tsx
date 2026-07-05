// features/chat/components/MessageAttachments.tsx
"use client";
import { FileText, Download } from "lucide-react";
import { T } from "../design/tokens";
import { Message } from "../types/message";
import { resolveFileUrl } from "../utils/rendering";
import { AudioPlayer } from "./AudioPlayer";

interface Props {
  msg: Message;
  displayText: string;
  onGalleryOpen: (items: Array<{ url: string; type: string; name: string }>, index: number) => void;
  mine: boolean;
}

export function MessageAttachments({ msg, displayText, onGalleryOpen, mine }: Props) {
  if (!msg.attachments || msg.attachments.length === 0) return null;

  const mediaAtts = msg.attachments.filter(
    (att) => att.file_type?.startsWith("image/") || att.file_type?.startsWith("video/")
  );
  const audioAtts = msg.attachments.filter((att) => att.file_type?.startsWith("audio/"));
  const fileAtts = msg.attachments.filter((att) => !mediaAtts.includes(att) && !audioAtts.includes(att));

  return (
    <>
      {audioAtts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: displayText ? 8 : 0 }}>
          {audioAtts.map((att) => {
            const url = resolveFileUrl(att.file_url);
            return url ? <AudioPlayer key={att.id} src={url} mine={mine} /> : null;
          })}
        </div>
      )}

      {fileAtts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: displayText || audioAtts.length > 0 ? 8 : 0 }}>
          {fileAtts.map((att) => (
            <div
              key={att.id}
              style={{
                background: "rgba(255,255,255,0.05)", borderRadius: T.radiusSm, padding: 8,
                display: "flex", alignItems: "center", gap: 10, transition: "background 0.12s", cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            >
              <div style={{ width: 32, height: 32, borderRadius: T.radiusXs, background: T.accentMuted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileText size={16} style={{ color: T.accentHover }} />
              </div>
              <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
                <div style={{ fontSize: T.fontSizeSm, color: T.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {att.original_filename}
                </div>
                <div style={{ fontSize: T.fontSizeXs, color: T.textMuted, marginTop: 2 }}>
                  {(att.file_size / 1024).toFixed(1)} KB
                </div>
              </div>
              <a
                href={resolveFileUrl(att.file_url)}
                download={att.original_filename}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ color: T.textMuted, padding: 8, borderRadius: T.radiusSm, transition: "color 0.12s", display: "flex" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = T.textPrimary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = T.textMuted)}
              >
                <Download size={16} />
              </a>
            </div>
          ))}
        </div>
      )}

      {mediaAtts.length > 0 && (
        <div
          style={{
            marginTop: displayText || fileAtts.length > 0 || audioAtts.length > 0 ? 8 : 0,
            display: "grid", gridTemplateColumns: mediaAtts.length === 1 ? "1fr" : "1fr 1fr",
            gap: 4, maxWidth: T.mediaGridMax, borderRadius: T.radiusXs, overflow: "hidden",
          }}
        >
          {mediaAtts.slice(0, mediaAtts.length === 3 ? 3 : 4).map((att, i) => {
            // FIX: If it's already an absolute S3 URL, use it directly. Otherwise, resolve it.
            const rawUrl = att.file_url || "";
            const fileUrl = rawUrl.startsWith("http") ? rawUrl : resolveFileUrl(rawUrl);
            const isVideo = att.file_type?.startsWith("video/");
            const isLastAndHasMore = mediaAtts.length > 4 && i === 3;
            return (
              <div
                key={att.id}
                style={{ position: "relative", cursor: "pointer", gridColumn: mediaAtts.length === 3 && i === 0 ? "1 / -1" : undefined, overflow: "hidden" }}
                onClick={() => {
                  const items = mediaAtts.map((a) => {
                    const url = (a.file_url || "").startsWith("http") ? a.file_url : resolveFileUrl(a.file_url);
                    return { url: url || "", type: a.file_type || "", name: a.original_filename || "" };
                  });
                  onGalleryOpen(items, i);
                }}
              >
                {isVideo && fileUrl ? (
                  <div style={{ position: "relative" }}>
                    <video src={fileUrl} style={{ width: "100%", height: T.imageHeight, objectFit: "cover", display: "block" }} muted />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.25)", pointerEvents: "none" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="16" height="18" viewBox="0 0 14 16" fill="none"><path d="M2 1.5L12 8L2 14.5V1.5Z" fill="white" /></svg>
                      </div>
                    </div>
                  </div>
                ) : fileUrl ? (
                  <img src={fileUrl} alt={att.original_filename} style={{ width: "100%", height: T.imageHeight, objectFit: "cover", display: "block" }} />
                ) : null}
                {isLastAndHasMore && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 600 }}>
                    +{mediaAtts.length - 4}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
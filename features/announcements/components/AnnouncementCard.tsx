// features/announcements/components/AnnouncementCard.tsx
"use client";

import { Pin, ChevronRight, Paperclip, AlertTriangle } from "lucide-react";
import {
  tk,
  Announcement,
  PriorityStyle,
  getAudienceLabel,
  getPriorityStyle,
} from "../lib";

interface AnnouncementCardProps {
  item: Announcement;
  onClick: () => void;
}

export function AnnouncementCard({ item, onClick }: AnnouncementCardProps) {
  const pStyle = getPriorityStyle(item.priority);
  const unread = !item.is_read;

  return (
    <div
      onClick={onClick}
      className="ann-card"
      style={{
        background: tk.surface,
        border: `1px solid ${tk.border}`,
        boxShadow: unread ? `inset 3px 0 0 0 ${tk.brandLight}` : "none",
        borderRadius: "10px",
        padding: "14px 16px",
        cursor: "pointer",
        position: "relative",
        opacity: item.is_read ? 0.85 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: "9px",
            padding: "3px 8px",
            borderRadius: "4px",
            background: pStyle.bg,
            color: pStyle.color,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            display: "flex",
            alignItems: "center",
            gap: 4,
            flexShrink: 0,
          }}
        >
          {pStyle.icon && <pStyle.icon size={10} />} {pStyle.label}
        </span>

        <span
          style={{
            fontSize: "10px",
            padding: "3px 8px",
            borderRadius: "4px",
            background: tk.bg,
            color: tk.textSecondary,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {getAudienceLabel(item)}
        </span>

        <h3
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 600,
            color: tk.textPrimary,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: 1,
            minWidth: 0,
          }}
        >
          {item.title}
        </h3>

        {item.pinned && (
          <Pin
            size={13}
            color={tk.warning}
            fill={tk.warning}
            style={{ flexShrink: 0 }}
          />
        )}
        <ChevronRight
          size={16}
          color={tk.textMuted}
          style={{ flexShrink: 0, opacity: 0.6 }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 6,
          fontSize: "11px",
          color: tk.textMuted,
        }}
      >
        <span style={{ fontWeight: 500 }}>{item.by}</span>
        <span>•</span>
        <span>{item.time}</span>
        {item.edited && (
          <>
            <span>•</span>
            <span style={{ fontStyle: "italic" }}>Updated</span>
          </>
        )}
        {item.attachment_count > 0 && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              marginLeft: "auto",
              color: tk.textSecondary,
            }}
          >
            <Paperclip size={11} /> {item.attachment_count}
          </span>
        )}
      </div>

      <p
        style={{
          margin: 0,
          color: tk.textSecondary,
          fontSize: "13px",
          lineHeight: 1.45,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {item.content}
      </p>
    </div>
  );
}

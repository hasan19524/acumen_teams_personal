// features/announcements/lib.tsx
import React, { type ComponentType } from "react";
import {
  AlertTriangle,
  Pin,
  FileText,
  Image,
  FileSpreadsheet,
  FileArchive,
  File as FileIcon,
} from "lucide-react";
import { tk } from "@/lib/tokens";

export type Team = { id: number; name: string };
export type Attachment = {
  id: number;
  file_name: string;
  file_url: string;
  file_size?: string;
};

export type Announcement = {
  id: number;
  title: string;
  content: string;
  priority: "normal" | "important" | "urgent";
  pinned: boolean;
  is_read: boolean;
  by: string;
  time: string;
  updated_at?: string;
  scope: "team" | "workspace";
  teams: Team[];
  attachment_count: number;
  attachments?: Attachment[];
  edited: boolean;
  is_archived: boolean;
  expiry_date?: string | null;
};

export type PriorityStyle = {
  bg: string;
  color: string;
  label: string;
  icon: ComponentType<{ size?: number }> | null;
};

export const getPriorityStyle = (p: string): PriorityStyle => {
  if (p === "urgent")
    return {
      bg: tk.tintDanger,
      color: tk.priorityUrgentFg,
      label: "URGENT",
      icon: AlertTriangle,
    };
  if (p === "important")
    return {
      bg: tk.tintAmber,
      color: tk.priorityImportantFg,
      label: "IMPORTANT",
      icon: Pin,
    };
  return {
    bg: "color-mix(in srgb, var(--text-muted) 15%, transparent)",
    color: "var(--text-secondary)",
    label: "NORMAL",
    icon: null,
  };
};

export const getAudienceLabel = (item: Announcement) => {
  if (item.scope === "workspace") return "Workspace";
  const names = item.teams.map((t) => t.name);
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")}, +${names.length - 2}`;
};

export const getExpiryLabel = (dateString?: string | null) => {
  if (!dateString) return null;
  const expiry = new Date(dateString);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Expired";
  if (diffDays === 0) return "Expires Today";
  if (diffDays === 1) return "Expires Tomorrow";
  if (diffDays <= 30) return `Expires in ${diffDays} days`;
  return `Expires ${expiry.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
};

// ─── Dynamic File Icons ───
export const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || ""))
    return { Icon: Image, color: tk.success };
  if (["pdf"].includes(ext || "")) return { Icon: FileText, color: tk.primary };
  if (["doc", "docx"].includes(ext || ""))
    return { Icon: FileText, color: tk.brandLight };
  if (["xls", "xlsx", "csv"].includes(ext || ""))
    return { Icon: FileSpreadsheet, color: tk.success };
  if (["zip", "rar", "7z"].includes(ext || ""))
    return { Icon: FileArchive, color: tk.warning };
  return { Icon: FileIcon, color: tk.textMuted };
};

// ─── Lightweight Markdown Parser ───
export const renderMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;

  const lines = text.split("\n");
  return lines.map((line, i) => {
    let isBullet = false;
    let content = line;

    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      isBullet = true;
      content = line.trim().substring(2);
    }

    const parts = content.split(
      /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g,
    );
    const renderedParts: React.ReactNode[] = parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={j} style={{ color: tk.textPrimary, fontWeight: 700 }}>
            {part.slice(2, -2)}
          </strong>
        );
      } else if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={j} style={{ fontStyle: "italic" }}>
            {part.slice(1, -1)}
          </em>
        );
      } else if (part.startsWith("[") && part.includes("](")) {
        const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (match && match[1] && match[2]) {
          return (
            <a
              key={j}
              href={match[2]}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: tk.brandLight, textDecoration: "underline" }}
            >
              {match[1]}
            </a>
          );
        }
      }
      return <span key={j}>{part}</span>;
    });

    return (
      <span key={i} style={{ display: "block", marginBottom: "4px" }}>
        {isBullet && (
          <span style={{ marginRight: "6px", color: tk.textMuted }}>•</span>
        )}
        {renderedParts}
      </span>
    );
  });
};

// features/announcements/types/announcement.ts
export type AnnouncementPriority = "normal" | "important" | "urgent";
export type AnnouncementScope = "workspace" | "team";

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
  priority: AnnouncementPriority;
  pinned: boolean;
  by: string;
  time: string;
  updated_at?: string;
  team_id: number | null;
  team_name: string | null;
  teams: { id: number; name: string }[];
  scope: AnnouncementScope;
  is_read: boolean;
  is_archived: boolean;
  edited: boolean;
  attachment_count: number;
  attachments?: Attachment[];
  expiry_date?: string | null;
};

export type CreateAnnouncementPayload = {
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  pinned?: boolean;
  team_id?: number | null;
  team_ids?: number[];
  expiry_days?: number;
};

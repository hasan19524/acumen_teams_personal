// features/chat/types/announcement.ts

export type AnnouncementPriority = "Normal" | "High" | "Critical";

export type AnnouncementScope = "workspace" | "team";

export type Announcement = {
  id: number;
  title: string;
  content: string;
  tag: string;
  priority: AnnouncementPriority;
  pinned: boolean;
  by: string;
  time: string;
  team_id: number | null;
  team_name: string | null;
  scope: AnnouncementScope;
};

export type CreateAnnouncementPayload = {
  title: string;
  content: string;
  tag?: string;
  priority?: AnnouncementPriority;
  pinned?: boolean;
  team_id?: number | null;       // If null = workspace announcement
};
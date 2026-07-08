export interface Notebook {
  id: number;
  name: string;
  color: string;
  note_count: number;
  created_at?: string;
}

export interface NoteAttachment {
  id: number;
  url: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  notebook: number | null;
  notebook_name: string | null;
  is_favorite: boolean;
  is_pinned: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  attachments?: NoteAttachment[];
}

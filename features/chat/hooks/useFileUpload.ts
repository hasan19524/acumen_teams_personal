import { useCallback } from "react";
import { useChatStore } from "../store/chatStore";
import { Message, UserMini } from "../types/message";
import { getWorkspaceId } from "@/lib/auth";

// ── Frontend Validation (Matches backend file_service.py exactly) ────────────

const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "mp4",
  "webm",
  "mov",
  "pdf",
  "txt",
  "zip",
]);
const MAX_FILES = 20;
const MAX_TOTAL_SIZE_MB = 150;
const SIZE_LIMITS_MB: Record<string, number> = {
  jpg: 20,
  jpeg: 20,
  png: 20,
  webp: 20,
  mp4: 120,
  webm: 120,
  mov: 120,
  pdf: 10,
  txt: 5,
  zip: 25,
};

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

function validateFiles(files: File[]): string | null {
  if (files.length > MAX_FILES)
    return `Cannot upload more than ${MAX_FILES} files at once.`;

  let totalSize = 0;
  for (const file of files) {
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext))
      return `File type '.${ext}' is not allowed.`;

    const limitMb = SIZE_LIMITS_MB[ext] || 10;
    if (file.size > limitMb * 1024 * 1024)
      return `File '${file.name}' exceeds the ${limitMb}MB size limit.`;

    totalSize += file.size;
  }

  if (totalSize > MAX_TOTAL_SIZE_MB * 1024 * 1024)
    return `Total upload size cannot exceed ${MAX_TOTAL_SIZE_MB}MB.`;

  return null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useFileUpload(channelId: number | null) {
  const addOptimisticMessage = useChatStore((s) => s.addOptimisticMessage);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!channelId || files.length === 0) return;

      // 1. Client-Side Validation (Fail fast)
      const validationError = validateFiles(files);
      if (validationError) {
        alert(validationError); // Replace with a toast notification later
        return;
      }

      // 2. Generate Idempotency Key
      const clientId = crypto.randomUUID();

      // 3. Construct Current User for Optimistic Message
      const myUserId =
        typeof window !== "undefined"
          ? parseInt(localStorage.getItem("user_id") || "0")
          : 0;
      const myUsername =
        typeof window !== "undefined"
          ? localStorage.getItem("username") || "You"
          : "You";

      const sender: UserMini = {
        id: myUserId,
        username: myUsername,
        first_name: "",
        last_name: "",
        full_name: myUsername,
      };

      // 4. Create Object URLs for immediate image preview rendering
      const previewUrls = files
        .filter((f) => f.type.startsWith("image/"))
        .map((f) => URL.createObjectURL(f));

      // 5. Create the Optimistic Message
      const tempId = -Date.now(); // Negative ID to avoid collision with DB IDs

      const optimisticMsg: Message = {
        id: tempId,
        channel: channelId,
        sender: sender,
        sender_name: myUsername,
        content: "",
        display_content: "",
        client_id: clientId,
        is_edited: false,
        edited_at: null,
        reply_to: null,
        is_deleted: false,
        attachments: files.map((f) => ({
          id: Math.random(),
          file_url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
          original_filename: f.name,
          file_type: f.type,
          file_size: f.size,
        })),

        reactions: [],
        reads: [],

        created_at: new Date().toISOString(),
        created_time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        _status: "pending",
        _progress: 0,
        _previewUrls: previewUrls,
      };

      // 6. Insert into Store (Instant UI render)
      addOptimisticMessage(channelId, optimisticMsg);

      // 7. Upload via XHR for progress tracking (fetch doesn't support upload progress)
      const formData = new FormData();
      formData.append("channel_id", channelId.toString());
      formData.append("client_id", clientId);
      files.forEach((f) => formData.append("files", f));

      const xhr = new XMLHttpRequest();

      // Track progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          // Update progress directly in store
          useChatStore.setState((state) => {
            const msgs = state.messages[channelId];
            if (!msgs) return state;
            return {
              messages: {
                ...state.messages,
                [channelId]: msgs.map((m) =>
                  m.client_id === clientId ? { ...m, _progress: progress } : m,
                ),
              },
            };
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Success! The WS broadcast (message.created) will automatically
          // reconcile this optimistic message via the client_id.
        } else {
          // Server rejected (validation error, etc)
          markAsFailed(channelId, clientId);
          // Optionally parse xhr.responseText for error message
        }
      };

      xhr.onerror = () => {
        // Network error
        markAsFailed(channelId, clientId);
      };

      // Get API URL and Token
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const wsId = getWorkspaceId();

      xhr.open("POST", `${apiUrl}/api/chat/${wsId}/upload/`);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    },
    [channelId, addOptimisticMessage],
  );

  return { uploadFiles };
}

// ── Helper ───────────────────────────────────────────────────────────────────

function markAsFailed(channelId: number, clientId: string) {
  useChatStore.setState((state) => {
    const msgs = state.messages[channelId];
    if (!msgs) return state;
    return {
      messages: {
        ...state.messages,
        [channelId]: msgs.map((m) =>
          m.client_id === clientId ? { ...m, _status: "failed" } : m,
        ),
      },
    };
  });
}

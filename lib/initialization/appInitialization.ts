import { workspaceService } from "@/features/workspace/workspaceService";
import {
  loadChannels,
  loadDMs,
  loadMessages,
} from "@/features/chat/services/channelService";
import { useChatStore } from "@/features/chat/store/chatStore";
import { useAvatarStore } from "@/lib/stores/avatarStore";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";
import { useDashboardStore } from "@/features/dashboard/store/dashboardStore";
import { useAttendanceStore } from "@/features/attendance/store/attendanceStore";

let initializedForWorkspace: number | null = null;

export async function runInitializationPipeline(
  workspaceId: number,
): Promise<void> {
  if (initializedForWorkspace === workspaceId) return;
  initializedForWorkspace = workspaceId;

  try {
    // ── PRIORITY 1 & 2: Critical & Likely Next Actions ──
    // Fire all essential data loads in parallel, hydrating all stores from a single fetch
    const p1Stats = workspaceService
      .getStats()
      .then((stats) => {
        useWorkspaceStore.getState().setStats(stats);
        // Hydrate dashboard store from the same response
        useDashboardStore.setState({ 
          stats, 
          lastFetchedStats: Date.now(), 
          isDirtyStats: false, 
          errorStats: null 
        });
      })
      .catch(() => {});

    const p2Members = workspaceService
      .getMembers()
      .then((members) => {
        useWorkspaceStore.getState().setMembers(members);
        useAvatarStore.getState().upsertUsers(members);
      })
      .catch(() => {});

    const p2Teams = workspaceService
      .getTeams()
      .then((teams) => {
        useWorkspaceStore.getState().setTeams(teams);
      })
      .catch(() => {});

    const p2Channels = Promise.all([loadChannels(), loadDMs()])
      .then(([channels, dms]) => {
        useChatStore.getState().setChannels([...channels, ...dms]);
      })
      .catch(() => {});

    const p2Announcements =
      import("@/features/announcements/store/announcementStore")
        .then(({ useAnnouncementStore }) =>
          useAnnouncementStore.getState().fetchAnnouncements(),
        )
        .catch(() => {});

    // P2.5: Fetch remaining dashboard/attendance data in parallel
    const p2TaskAnalytics = workspaceService.getTaskAnalytics()
      .then((data) => useDashboardStore.setState({ taskAnalytics: data }))
      .catch(() => {});

    const p2MyAttendance = workspaceService.getMyAttendance()
      .then((data) => useAttendanceStore.setState({ 
        myAttendance: data, 
        lastFetchedMyAtt: Date.now(), 
        error: null 
      }))
      .catch(() => {});

    const p2OnlineUsers = workspaceService.getOnlineMembers()
      .then((data) => useWorkspaceStore.getState().setOnlineUsers(data?.online_users || []))
      .catch(() => {});

    await Promise.all([
      p1Stats,
      p2Members,
      p2Teams,
      p2Channels,
      p2Announcements,
      p2OnlineUsers,
      p2TaskAnalytics,
      p2MyAttendance,
    ]);

    // ── PRIORITY 3: Background Cache (Top 10 Chats Messages) ──
    try {
      const channels = useChatStore.getState().channels;

      // Sort by last message time, exactly as the sidebar does
      const sortedChannels = [...channels].sort((a, b) => {
        const timeA = a.last_message_time
          ? new Date(a.last_message_time).getTime()
          : 0;
        const timeB = b.last_message_time
          ? new Date(b.last_message_time).getTime()
          : 0;
        return timeB - timeA;
      });

      const top10Channels = sortedChannels.slice(0, 10);

      // Preload messages for top 10 chats in parallel
      await Promise.all(
        top10Channels.map((channel) => {
          // Skip if already cached somehow
          if (useChatStore.getState().messages[channel.id]?.length > 0)
            return Promise.resolve();

          return loadMessages(channel.id)
            .then(({ messages, pagination }) => {
              useChatStore.getState().setMessages(channel.id, messages);
              useChatStore.getState().setPagination(channel.id, pagination);
            })
            .catch(() => {});
        }),
      );
    } catch (error) {
      // Best-effort: do not block app
      console.warn("Priority 3 message preloading failed:", error);
    }
  } catch (error) {
    // If the whole pipeline fails, reset the flag so it can try again next time
    initializedForWorkspace = null;
    console.error("Initialization pipeline failed:", error);
  }
}

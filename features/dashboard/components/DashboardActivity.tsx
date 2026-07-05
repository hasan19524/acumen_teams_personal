"use client";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  Inbox,
  Coffee,
  UserCheck,
  MessageSquare,
  CheckSquare,
  Megaphone,
  UserPlus,
  Users,
} from "lucide-react";
import { tk } from "@/lib/tokens";

export default function DashboardActivity({
  loading,
  errors,
  notifications,
}: any) {
  const router = useRouter();

  const formatActivityGroup = (items: any[]) => {
    if (!items || items.length === 0) return [];
    const groups: { [key: string]: any[] } = {};
    items.forEach((item) => {
      const msg = (item.title + " " + item.description).toLowerCase();
      let key = item.title;
      let icon = Activity;
      let color = tk.textMuted;
      let route = "/dashboard/notifications"; // Default route

      if (msg.includes("leadership")) {
        key = "Leadership transferred";
        icon = UserCheck;
        color = tk.brand;
        route = "/dashboard/team";
      } else if (msg.includes("dm request")) {
        key = "DM request received";
        icon = MessageSquare;
        color = tk.brandLight;
        route = "/dashboard/chat";
      } else if (msg.includes("task assigned")) {
        key = "Task assigned";
        icon = CheckSquare;
        color = "#FF8C00";
        route = "/dashboard/tasks";
      } else if (msg.includes("announcement")) {
        key = "Announcement posted";
        icon = Megaphone;
        color = tk.success;
        route = "/dashboard/announcements";
      } else if (msg.includes("joined")) {
        key = "User joined workspace";
        icon = UserPlus;
        color = tk.warning;
        route = "/dashboard/team";
      } else if (msg.includes("team created")) {
        key = "Team created";
        icon = Users;
        color = tk.warning;
        route = "/dashboard/team";
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push({ ...item, _icon: icon, _color: color, _route: route });
    });

    return Object.keys(groups)
      .map((key) => {
        const group = groups[key];
        let text = key;
        if (group.length > 1) {
          if (key.endsWith("y"))
            text = `${group.length} New ${key.slice(0, -1)}ies`;
          else if (key.endsWith("s")) text = `${group.length} New ${key}`;
          else text = `${group.length} New ${key}s`;
        }
        return {
          id: key,
          icon: group[0]._icon,
          color: group[0]._color,
          text,
          route: group[0]._route,
          time: new Date(group[0].created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      })
      .slice(0, 5);
  };

  const groupedActivities = formatActivityGroup(notifications);

  return (
    <div
      className="card-hover lg:col-span-2 p-6 rounded-2xl flex flex-col h-full"
      style={{ background: tk.surface, border: `1px solid ${tk.border}` }}
    >
      <style>{`
        .activity-item { transition: all 0.25s ease; cursor: pointer; }
        .activity-item:hover { 
          background: ${tk.surfaceHover} !important; 
          transform: translateY(-2px); 
          border-color: ${tk.brandLight} !important;
        }
      `}</style>
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2.5">
          <Activity size={20} style={{ color: tk.brandLight }} />
          <h3
            className="m-0 text-lg font-bold"
            style={{ color: tk.textPrimary }}
          >
            Recent Activity
          </h3>
        </div>
      </div>
      <div className="grid gap-2.5 flex-1">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="shimmer rounded-xl"
              style={{
                height: 50,
                background: tk.bg,
                border: `1px solid ${tk.border}`,
              }}
            />
          ))
        ) : errors.notifications ? (
          <div
            className="flex flex-col items-center justify-center py-5"
            style={{ color: tk.textMuted }}
          >
            <AlertCircle
              size={28}
              className="mb-3"
              style={{ color: tk.primary }}
            />
            <p className="text-sm font-medium">Failed to load activity</p>
          </div>
        ) : groupedActivities.length > 0 ? (
          groupedActivities.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => router.push(item.route)}
                className="activity-item p-3 rounded-xl flex justify-between items-center gap-3"
                style={{ background: tk.bg, border: `1px solid ${tk.border}` }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{
                      width: 32,
                      height: 32,
                      background: `${item.color}20`,
                    }}
                  >
                    <Icon size={16} color={item.color} />
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: tk.textPrimary }}
                  >
                    {item.text}
                  </span>
                </div>
                <span
                  className="text-xs font-semibold whitespace-nowrap"
                  style={{ color: tk.textMuted }}
                >
                  {item.time}
                </span>
              </div>
            );
          })
        ) : (
          <div
            className="flex flex-col items-center justify-center py-8 text-center"
            style={{ color: tk.textMuted }}
          >
            <Coffee
              size={32}
              className="mb-3 opacity-50"
              style={{ color: tk.warning }}
            />
            <p
              className="text-sm font-semibold"
              style={{ color: tk.textPrimary }}
            >
              Everything has been calm today.
            </p>
            <p className="text-xs mt-1">No new activity to show.</p>
          </div>
        )}
      </div>
    </div>
  );
}

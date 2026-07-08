"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { workspaceService } from "@/features/workspace/workspaceService";
import { useNotificationStore } from "@/features/notification/store/notificationStore";
import DashboardTopbar from "../components/DashboardTopbar";
import DashboardStats from "../components/DashboardStats";
import DashboardActivity from "../components/DashboardActivity";
import DashboardActiveMembers from "../components/DashboardActiveMembers";
import DashboardProductivity from "../components/DashboardProductivity";
import { tk } from "@/lib/tokens";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";

export default function TeamLeaderDashboard() {
  const router = useRouter();
  const { authChecked, user } = useAuth();

  // FIX: Initialize state from global store to prevent skeleton flash
  const [stats, setStats] = useState<any>(useWorkspaceStore.getState().stats);
  const [onlineUsers, setOnlineUsers] = useState<any[]>(
    useWorkspaceStore.getState().onlineUsers,
  );
  const [teams, setTeams] = useState<any[]>(useWorkspaceStore.getState().teams);

  // FIX: If data already exists from pipeline, don't show skeletons
  const hasCachedData = !!useWorkspaceStore.getState().stats;
  const [loading, setLoading] = useState(!hasCachedData);
  const [errors, setErrors] = useState({
    stats: false,
    tasks: false,
    attendance: false,
    notifications: false,
  });
  const initialLoad = useRef(!hasCachedData);

  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const notifications = useNotificationStore((s) => s.persistentNotifications);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  const fetchDashboardData = useCallback(async () => {
    if (initialLoad.current) {
      setLoading(true);
      setErrors({
        stats: false,
        tasks: false,
        attendance: false,
        notifications: false,
      });
    }

    const results = await Promise.allSettled([
      workspaceService.getStats(),
      workspaceService.getOnlineMembers(),
      workspaceService.getTeams(),
    ]);

    if (results[0].status === "fulfilled" && results[0].value)
      setStats(results[0].value);
    else if (initialLoad.current) setErrors((p) => ({ ...p, stats: true }));

    if (results[1].status === "fulfilled" && results[1].value)
      setOnlineUsers(results[1].value?.online_users || []);
    else if (initialLoad.current) setOnlineUsers([]);

    if (results[2].status === "fulfilled" && results[2].value)
      setTeams(results[2].value || []);
    else if (initialLoad.current) setTeams([]);

    try {
      await fetchNotifications();
    } catch {
      if (initialLoad.current)
        setErrors((p) => ({ ...p, notifications: true }));
    }
    initialLoad.current = false;
    setLoading(false);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!authChecked) return;
    fetchDashboardData();
    const presenceInterval = setInterval(async () => {
      try {
        const data = await workspaceService.getOnlineMembers();
        setOnlineUsers(data?.online_users || []);
      } catch (err) {}
    }, 15000);
    return () => clearInterval(presenceInterval);
  }, [authChecked, fetchDashboardData]);

  if (!authChecked) return null;

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 18
        ? "Good Afternoon"
        : "Good Evening";
  const todayString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // FIX: Filter online users to only show members of the teams this user leads
  const myLedTeams = teams
    .filter((t) => t.leaders?.includes(user?.username))
    .map((t) => t.name);
  const teamOnlineUsers = onlineUsers.filter((u) =>
    myLedTeams.includes(u.team),
  );

  return (
    <main
      className="relative"
      style={{
        background: tk.bg,
        color: tk.textPrimary,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        @keyframes float { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(50px, -50px) scale(1.1); } 66% { transform: translate(-50px, 50px) scale(0.9); } }
        .bg-orb-1 { position: fixed; width: 600px; height: 600px; background: radial-gradient(circle, ${tk.brand}22, transparent); border-radius: 50%; filter: blur(120px); top: -200px; right: -200px; pointer-events: none; z-index: 0; animation: float 20s ease-in-out infinite; }
        .bg-orb-2 { position: fixed; width: 500px; height: 500px; background: radial-gradient(circle, ${tk.brandLight}22, transparent); border-radius: 50%; filter: blur(120px); bottom: -150px; left: -150px; pointer-events: none; z-index: 0; animation: float 20s ease-in-out infinite 5s; }
        .card-hover { transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); position: relative; }
        .card-hover::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: inherit; opacity: 0; transition: opacity 0.35s; background: linear-gradient(135deg, ${tk.brand}15, ${tk.brandLight}15); pointer-events: none; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,.3); border-color: ${tk.border} !important; }
        .card-hover:hover::after { opacity: 1; }
      `}</style>

      <div className="bg-orb-1" />
      <div className="bg-orb-2" />

      <section className="relative z-10 flex flex-col p-4 md:p-6 lg:p-8 pb-4 md:pb-8 overflow-x-hidden">
        <DashboardTopbar
          user={user}
          todayString={todayString}
          greeting={greeting}
          unreadCount={unreadCount}
        />

        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-3">
            <h3
              className="m-0 text-sm font-bold uppercase tracking-wider"
              style={{ color: tk.textPrimary }}
            >
              Today's Focus
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {stats?.pending_approvals === 0 && stats?.overdue_tasks === 0 ? (
              <div
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
                style={{
                  background: tk.surface,
                  border: `1px solid var(--success)40`,
                }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: tk.textPrimary }}
                >
                  Everything looks good today.
                </span>
              </div>
            ) : (
              <>
                {stats?.pending_approvals > 0 && (
                  <div
                    onClick={() =>
                      router.push("/dashboard/tasks?status=pending_approval")
                    }
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl cursor-pointer"
                    style={{
                      background: tk.surface,
                      border: `1px solid var(--warning)40`,
                    }}
                  >
                    <span
                      className="text-sm font-semibold"
                      style={{ color: tk.textPrimary }}
                    >
                      Review {stats?.pending_approvals} approval request(s)
                    </span>
                  </div>
                )}
                {stats?.overdue_tasks > 0 && (
                  <div
                    onClick={() =>
                      router.push("/dashboard/tasks?status=overdue")
                    }
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl cursor-pointer"
                    style={{
                      background: tk.surface,
                      border: `1px solid var(--primary)40`,
                    }}
                  >
                    <span
                      className="text-sm font-semibold"
                      style={{ color: tk.textPrimary }}
                    >
                      Complete {stats?.overdue_tasks} overdue task(s)
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <DashboardStats stats={stats} loading={loading} errors={errors} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6 items-stretch">
          <DashboardActivity
            loading={loading}
            errors={errors}
            notifications={notifications}
          />
          {/* Pass the filtered teamOnlineUsers here */}
          <DashboardActiveMembers
            loading={loading}
            onlineUsers={teamOnlineUsers}
            totalMembers={teamOnlineUsers.length}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          <div
            className="lg:col-span-2 card-hover p-6 rounded-2xl flex flex-col"
            style={{ background: tk.surface, border: `1px solid ${tk.border}` }}
          >
            <h3 className="text-lg font-bold mb-4">Team Activity</h3>
            <div
              className="flex flex-col items-center justify-center flex-1 py-8 text-center"
              style={{ color: tk.textMuted }}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: tk.textPrimary }}
              >
                No recent team activity
              </p>
            </div>
          </div>
          <DashboardProductivity
            loading={loading}
            productivityData={stats?.productivity}
          />
        </div>
      </section>
    </main>
  );
}

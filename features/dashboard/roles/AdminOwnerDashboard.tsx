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
import DashboardTeams from "../components/DashboardTeams";
import DashboardProductivity from "../components/DashboardProductivity";
import { Target, X } from "lucide-react";
import { tk } from "@/lib/tokens";

export default function AdminOwnerDashboard() {
  const router = useRouter();
  const { authChecked, user } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [taskAnalytics, setTaskAnalytics] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [errors, setErrors] = useState({
    stats: false,
    tasks: false,
    attendance: false,
    notifications: false,
  });
  const initialLoad = useRef(true);

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
      workspaceService.getTaskAnalytics(),
      workspaceService.getMyAttendance(),
      workspaceService.getOnlineMembers(),
      workspaceService.getTeams(),
    ]);

    if (results[0].status === "fulfilled" && results[0].value)
      setStats(results[0].value);
    else if (initialLoad.current) setErrors((p) => ({ ...p, stats: true }));

    if (results[1].status === "fulfilled" && results[1].value)
      setTaskAnalytics(results[1].value);
    else if (initialLoad.current) setErrors((p) => ({ ...p, tasks: true }));

    if (results[2].status === "fulfilled" && results[2].value)
      setAttendanceData(results[2].value);

    if (results[3].status === "fulfilled" && results[3].value)
      setOnlineUsers(results[3].value?.online_users || []);
    else if (initialLoad.current) setOnlineUsers([]);

    if (results[4].status === "fulfilled" && results[4].value)
      setTeams(results[4].value || []);
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

  const productivityScore = stats?.productivity_score || 0;
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
        .shimmer { position: relative; overflow: hidden; }
        .shimmer::after { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); animation: shimmer 3s infinite; }
        @keyframes shimmer { 0% { left: -100%; } 100% { left: 100%; } }
      `}</style>

      <div className="bg-orb-1" />
      <div className="bg-orb-2" />

      <section className="relative z-10 flex flex-col p-4 md:p-6 lg:p-8 pb-4 md:pb-8 overflow-x-hidden">
        <DashboardTopbar
          user={user}
          todayString={todayString}
          greeting={greeting}
          unreadCount={unreadCount}
          onModalOpen={setActiveModal}
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
                  border: `1px solid #1FA46340`,
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
                      border: `1px solid #F5B04140`,
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
                      border: `1px solid #E31E2440`,
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
          <DashboardActiveMembers
            loading={loading}
            onlineUsers={onlineUsers}
            totalMembers={stats?.total_members ?? 0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          <DashboardTeams
            loading={loading}
            teams={teams}
            onlineUsers={onlineUsers}
          />
          <DashboardProductivity
            loading={loading}
            productivityScore={productivityScore}
          />
        </div>
      </section>

      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setActiveModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl p-8 max-w-sm w-full text-center"
            style={{ background: tk.surface, border: `1px solid ${tk.border}` }}
          >
            <Target
              size={32}
              className="mx-auto mb-4"
              style={{ color: tk.brandLight }}
            />
            <h2
              className="m-0 mb-2 text-lg font-bold capitalize"
              style={{ color: tk.textPrimary }}
            >
              {activeModal} Modal
            </h2>
            <p className="m-0 mb-6 text-sm" style={{ color: tk.textSecondary }}>
              In the final build, this button will open the {activeModal}{" "}
              creation modal directly on top of the dashboard without navigating
              away.
            </p>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full p-3 rounded-lg font-semibold cursor-pointer text-white"
              style={{ background: tk.brand, border: "none" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

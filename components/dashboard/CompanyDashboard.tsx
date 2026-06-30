// app/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { workspaceService } from "@/features/workspace/workspaceService";
import { useNotificationStore } from "@/features/notification/store/notificationStore";
import {
  CheckSquare,
  Calendar,
  Megaphone,
  Users,
  Search,
  User,
  TrendingUp,
  Clock,
  Activity,
  Sparkles,
  Bell,
  Target,
  Zap,
  Shield,
  AlertCircle,
  AlertTriangle,
  Inbox,
  UserPlus,
} from "lucide-react";

// Design Tokens (Acumen Design System) - FROZEN
const tk = {
  bg: "#081325",
  surface: "#172440",
  surfaceHover: "#20304E",
  border: "#2A3A5C",
  textPrimary: "#FFFFFF",
  textSecondary: "#B7C0D8",
  textMuted: "#7A86A7",
  brand: "#4B1587",
  brandLight: "#5DADE2",
  success: "#1FA463",
  warning: "#F5B041",
  primary: "#E31E24",
};

export default function CompanyDashboard() {
  const router = useRouter();
  const { authChecked } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [taskAnalytics, setTaskAnalytics] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({
    stats: false,
    tasks: false,
    attendance: false,
    notifications: false,
  });
  
  // Track initial load to prevent background polls from flashing loading screens
  const initialLoad = useRef(true);

  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const notifications = useNotificationStore((s) => s.persistentNotifications);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  const fetchDashboardData = useCallback(async () => {
    // Only show loading skeleton and reset errors on the very first mount
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
    ]);

    // Cache-First: Only update state if the API call succeeded and returned data
    if (results[0].status === "fulfilled" && results[0].value) setStats(results[0].value);
    else if (initialLoad.current) setErrors((prev) => ({ ...prev, stats: true }));

    if (results[1].status === "fulfilled" && results[1].value) setTaskAnalytics(results[1].value);
    else if (initialLoad.current) setErrors((prev) => ({ ...prev, tasks: true }));

    if (results[2].status === "fulfilled" && results[2].value) setAttendanceData(results[2].value);
    else if (initialLoad.current) setErrors((prev) => ({ ...prev, attendance: true }));

    if (results[3].status === "fulfilled" && results[3].value) setOnlineUsers(results[3].value?.online_users || []);
    else if (initialLoad.current) setOnlineUsers([]);

    try {
      await fetchNotifications();
    } catch {
      if (initialLoad.current) setErrors((prev) => ({ ...prev, notifications: true }));
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
      } catch (err) {
        console.error("Presence poll failed:", err);
      }
    }, 15000); // 15 seconds for real-time feel

    return () => clearInterval(presenceInterval);
  }, [authChecked, fetchDashboardData]);

  if (!authChecked) return null;

  const role = stats?.role || "member";
  const productivityScore = taskAnalytics?.productivity_score || 0;
  const attendancePercentage = attendanceData?.attendance_percentage || 0;

  // Dynamic KPIs based on Role
  const getKpiCards = () => {
    if (role === "owner" || role === "admin") {
      return [
        {
          value: String(stats?.total_members || 0),
          label: "Workspace Members",
          color: tk.brandLight,
          icon: Users,
          error: errors.stats,
        },
        {
          value: String(stats?.total_teams || 0),
          label: "Workspace Teams",
          color: tk.brand,
          icon: CheckSquare,
          error: errors.stats,
        },
        {
          value: String(taskAnalytics?.pending_approval || 0),
          label: "Pending Approvals",
          color: tk.warning,
          icon: AlertCircle,
          error: errors.tasks,
        },
        {
          value: String(taskAnalytics?.overdue || 0),
          label: "Overdue Tasks",
          color: tk.primary,
          icon: AlertTriangle,
          error: errors.tasks,
        },
      ];
    }
    if (role === "leader") {
      return [
        {
          value: String(stats?.total_teams || 0),
          label: "My Teams",
          color: tk.brandLight,
          icon: Users,
          error: errors.stats,
        },
        {
          value: String(taskAnalytics?.team_overdue || 0),
          label: "Blocked Tasks",
          color: tk.primary,
          icon: AlertTriangle,
          error: errors.tasks,
        },
        {
          value: `${productivityScore}%`,
          label: "Team Productivity",
          color: tk.brand,
          icon: TrendingUp,
          error: errors.tasks,
        },
        {
          value: `${attendancePercentage}%`,
          label: "My Attendance",
          color: tk.success,
          icon: Shield,
          error: errors.attendance,
        },
      ];
    }
    return [
      {
        value: String(taskAnalytics?.my_tasks || 0),
        label: "My Pending Tasks",
        color: tk.warning,
        icon: CheckSquare,
        error: errors.tasks,
      },
      {
        value: String(taskAnalytics?.my_overdue || 0),
        label: "My Overdue Tasks",
        color: tk.primary,
        icon: AlertTriangle,
        error: errors.tasks,
      },
      {
        value: `${productivityScore}%`,
        label: "My Productivity",
        color: tk.brand,
        icon: TrendingUp,
        error: errors.tasks,
      },
      {
        value: `${attendancePercentage}%`,
        label: "My Attendance",
        color: tk.success,
        icon: Shield,
        error: errors.attendance,
      },
    ];
  };

  // Dynamic Quick Actions based on Role
  const getQuickActions = () => {
    if (role === "owner" || role === "admin") {
      return [
        {
          icon: UserPlus,
          label: "Invite User",
          color: tk.success,
          path: "/dashboard/team",
        },
        {
          icon: Users,
          label: "Create Team",
          color: tk.brand,
          path: "/dashboard/team",
        },
        {
          icon: Megaphone,
          label: "Announcement",
          color: tk.brandLight,
          path: "/dashboard/announcements",
        },
        {
          icon: CheckSquare,
          label: "Create Task",
          color: tk.warning,
          path: "/dashboard/tasks",
        },
      ];
    }
    if (role === "leader") {
      return [
        {
          icon: CheckSquare,
          label: "Assign Task",
          color: tk.warning,
          path: "/dashboard/tasks",
        },
        {
          icon: Megaphone,
          label: "Announcement",
          color: tk.brandLight,
          path: "/dashboard/announcements",
        },
        {
          icon: Calendar,
          label: "Attendance",
          color: tk.success,
          path: "/dashboard/attendance",
        },
      ];
    }
    return [
      {
        icon: CheckSquare,
        label: "Create Task",
        color: tk.brand,
        path: "/dashboard/tasks",
      },
      {
        icon: Calendar,
        label: "Mark Attendance",
        color: tk.success,
        path: "/dashboard/attendance",
      },
      {
        icon: Inbox,
        label: "Open Chat",
        color: tk.brandLight,
        path: "/dashboard/chat",
      },
    ];
  };

  const renderKpiValue = (item: any) => {
    if (loading)
      return (
        <div
          className="shimmer"
          style={{
            height: 40,
            width: 80,
            borderRadius: 8,
            background: tk.surfaceHover,
          }}
        />
      );
    if (item.error)
      return (
        <span style={{ fontSize: 14, color: tk.primary }}>Failed to load</span>
      );
    return item.value;
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: tk.bg,
        color: tk.textPrimary,
        fontFamily: "'Inter', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes float { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(50px, -50px) scale(1.1); } 66% { transform: translate(-50px, 50px) scale(0.9); } }
        .bg-orb-1 { position: fixed; width: 600px; height: 600px; background: radial-gradient(circle, ${tk.brand}22, transparent); border-radius: 50%; filter: blur(120px); top: -200px; right: -200px; pointer-events: none; z-index: 0; animation: float 20s ease-in-out infinite; }
        .bg-orb-2 { position: fixed; width: 500px; height: 500px; background: radial-gradient(circle, ${tk.brandLight}22, transparent); border-radius: 50%; filter: blur(120px); bottom: -150px; left: -150px; pointer-events: none; z-index: 0; animation: float 20s ease-in-out infinite 5s; }
        .card-hover { transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); position: relative; }
        .card-hover::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: inherit; opacity: 0; transition: opacity 0.35s; background: linear-gradient(135deg, ${tk.brand}15, ${tk.brandLight}15); pointer-events: none; }
        .card-hover:hover { transform: translateY(-8px); box-shadow: 0 20px 60px rgba(0,0,0,.4); border-color: ${tk.border} !important; }
        .card-hover:hover::after { opacity: 1; }
        .stat-card { animation: fadeInUp 0.6s ease-out backwards; }
        .stat-card:nth-child(1) { animation-delay: 0.1s; } .stat-card:nth-child(2) { animation-delay: 0.2s; } .stat-card:nth-child(3) { animation-delay: 0.3s; } .stat-card:nth-child(4) { animation-delay: 0.4s; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        input:focus { outline: none; border-color: ${tk.brandLight} !important; box-shadow: 0 0 0 4px ${tk.brandLight}15; }
        .activity-item { transition: all 0.25s ease; cursor: pointer; }
        .activity-item:hover { background: ${tk.surfaceHover} !important; transform: translateX(4px); border-left: 3px solid ${tk.brandLight}; padding-left: 13px !important; }
        .productivity-card { position: relative; overflow: hidden; }
        .productivity-card::before { content: ''; position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1), transparent); animation: rotate 20s linear infinite; }
        @keyframes rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .pulse { animation: pulse 2s ease-in-out infinite; } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .shimmer { position: relative; overflow: hidden; }
        .shimmer::after { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); animation: shimmer 3s infinite; }
        @keyframes shimmer { 0% { left: -100%; } 100% { left: 100%; } }
        .avatar { position: relative; transition: all 0.3s ease; cursor: pointer; }
        .avatar:hover { transform: scale(1.1); box-shadow: 0 8px 24px ${tk.brand}44; }
        .stat-icon { animation: iconFloat 3s ease-in-out infinite; } @keyframes iconFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .search-wrapper { position: relative; } .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: ${tk.textMuted}; pointer-events: none; }
        .progress-bar { height: 6px; background: ${tk.border}; border-radius: 10px; overflow: hidden; position: relative; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, ${tk.brand}, ${tk.brandLight}); border-radius: 10px; transition: width 1s ease; position: relative; overflow: hidden; }
        .progress-fill::after { content: ''; position: absolute; top: 0; left: 0; bottom: 0; right: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation: shimmer 2s infinite; }
        .quick-action { transition: all 0.3s ease; cursor: pointer; } .quick-action:hover { transform: translateY(-4px); background: ${tk.brand}22 !important; }
        .team-member { transition: all 0.3s ease; } .team-member:hover { transform: scale(1.1); z-index: 10; }
        .notification-badge { animation: bounce 2s ease-in-out infinite; } @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      `}</style>

      <div className="bg-orb-1" />
      <div className="bg-orb-2" />

      <section
        style={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 1,
          padding: "32px 40px",
        }}
      >
        {/* TOPBAR */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                color: tk.textPrimary,
                fontSize: "32px",
                fontWeight: 700,
                letterSpacing: "-0.5px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <Sparkles size={28} style={{ color: tk.brandLight }} />
              Welcome Back
            </h1>
            <p
              style={{
                color: tk.textSecondary,
                marginTop: "8px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Manage your business operations from one place.
            </p>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                placeholder="Search..."
                style={{
                  width: 280,
                  padding: "12px 18px 12px 44px",
                  borderRadius: "12px",
                  border: `1px solid ${tk.border}`,
                  background: tk.surface,
                  color: tk.textPrimary,
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "all 0.3s ease",
                }}
              />
            </div>

            <div
              onClick={() => router.push("/dashboard/notifications")}
              style={{
                position: "relative",
                cursor: "pointer",
                padding: "10px",
                borderRadius: "12px",
                background: tk.surface,
                border: `1px solid ${tk.border}`,
                transition: "all 0.3s ease",
              }}
              className="card-hover"
            >
              <Bell size={20} style={{ color: tk.textSecondary }} />
              {unreadCount > 0 && (
                <div
                  className="notification-badge"
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    background: tk.primary,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                    border: `2px solid ${tk.bg}`,
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </div>
              )}
            </div>

            <div
              className="avatar"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${tk.brand}, ${tk.brandLight})`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 16,
                boxShadow: `0 4px 16px ${tk.brand}55`,
              }}
            >
              <User size={20} />
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <div style={{ overflowY: "auto" }}>
          {/* STATS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 20,
              marginBottom: 24,
            }}
          >
            {getKpiCards().map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="card-hover stat-card"
                  style={{
                    background: tk.surface,
                    border: `1px solid ${tk.border}`,
                    borderRadius: 20,
                    padding: 28,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: `${item.color}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon
                        size={24}
                        style={{ color: item.color }}
                        className="stat-icon"
                      />
                    </div>
                    {item.error && (
                      <button
                        onClick={fetchDashboardData}
                        style={{
                          background: "none",
                          border: "none",
                          color: tk.brandLight,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Retry
                      </button>
                    )}
                    {!item.error && !loading && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: tk.success,
                          boxShadow: `0 0 8px ${tk.success}`,
                        }}
                      />
                    )}
                  </div>
                  <h2
                    style={{
                      margin: 0,
                      color: tk.textPrimary,
                      fontSize: 40,
                      fontWeight: 700,
                      letterSpacing: "-1px",
                      minHeight: 50,
                    }}
                  >
                    {renderKpiValue(item)}
                  </h2>
                  <p
                    style={{
                      marginTop: 12,
                      color: tk.textSecondary,
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* MIDDLE SECTION */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 20,
              marginBottom: 24,
            }}
          >
            {/* Quick Actions */}
            <div
              className="card-hover"
              style={{
                background: tk.surface,
                border: `1px solid ${tk.border}`,
                borderRadius: 20,
                padding: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <Zap size={20} style={{ color: tk.warning }} />
                <h3
                  style={{
                    margin: 0,
                    color: tk.textPrimary,
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  Quick Actions
                </h3>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {getQuickActions().map((action) => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.label}
                      className="quick-action"
                      onClick={() => router.push(action.path)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 12,
                        background: tk.bg,
                        border: `1px solid ${tk.border}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: `${action.color}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon size={16} style={{ color: action.color }} />
                      </div>
                      <span
                        style={{
                          color: tk.textPrimary,
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                      >
                        {action.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Members (Live Presence) */}
            <div
              className="card-hover"
              style={{
                background: tk.surface,
                border: `1px solid ${tk.border}`,
                borderRadius: 20,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                minHeight: 220,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <Users size={20} style={{ color: tk.brandLight }} />
                <h3
                  style={{
                    margin: 0,
                    color: tk.textPrimary,
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  Active Members
                </h3>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    color: tk.success,
                    fontWeight: 600,
                    background: tk.surfaceHover,
                    padding: "2px 8px",
                    borderRadius: "10px",
                  }}
                >
                  {onlineUsers.length} Online
                </span>
              </div>

              {loading ? (
                <div
                  className="shimmer"
                  style={{
                    height: 120,
                    borderRadius: 12,
                    background: tk.surfaceHover,
                  }}
                />
              ) : onlineUsers.length === 0 ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: tk.textMuted,
                  }}
                >
                  <Inbox size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <p style={{ fontSize: 13, fontWeight: 500 }}>
                    No users online
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {onlineUsers.map((user) => (
                    <div
                      key={user.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 8px",
                        borderRadius: "10px",
                        transition: "background 0.1s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = tk.surfaceHover)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: `linear-gradient(135deg, ${tk.brand}, ${tk.brandLight})`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: tk.success,
                            border: `2px solid ${tk.surface}`,
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div
                          style={{
                            fontSize: 13,
                            color: tk.textPrimary,
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {user.full_name || user.username}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: tk.success,
                            fontWeight: 500,
                          }}
                        >
                          Active Now
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* System Status (Placeholder for Phase 10) */}
            <div
              className="card-hover"
              style={{
                background: `linear-gradient(135deg, ${tk.success}, #0d7a48)`,
                borderRadius: 20,
                padding: 24,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "50%",
                  filter: "blur(40px)",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <Activity size={20} style={{ color: "rgba(255,255,255,.9)" }} />
                <h3
                  style={{
                    margin: 0,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  System Status
                </h3>
              </div>
              <h2
                style={{
                  margin: 0,
                  color: "#fff",
                  fontSize: 36,
                  fontWeight: 800,
                  letterSpacing: "-1px",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                Operational
              </h2>
              <p
                style={{
                  marginTop: 8,
                  color: "rgba(255,255,255,.8)",
                  fontSize: 13,
                  fontWeight: 500,
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <span style={{ color: "#fff", fontWeight: 700 }}>
                  All systems
                </span>{" "}
                are running smoothly.
              </p>
            </div>
          </div>

          {/* LOWER GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr",
              gap: 20,
            }}
          >
            {/* Recent Activity */}
            <div
              className="card-hover"
              style={{
                background: tk.surface,
                border: `1px solid ${tk.border}`,
                borderRadius: 20,
                padding: 28,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Activity size={24} style={{ color: tk.brandLight }} />
                  <h3
                    style={{
                      margin: 0,
                      color: tk.textPrimary,
                      fontSize: 22,
                      fontWeight: 700,
                    }}
                  >
                    Recent Activity
                  </h3>
                </div>
                <div
                  className="pulse"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: tk.success,
                    boxShadow: `0 0 12px ${tk.success}`,
                  }}
                />
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="shimmer"
                      style={{
                        height: 60,
                        borderRadius: 12,
                        background: tk.bg,
                        border: `1px solid ${tk.border}`,
                      }}
                    />
                  ))
                ) : errors.notifications ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "40px 0",
                      color: tk.textMuted,
                    }}
                  >
                    <AlertCircle
                      size={32}
                      style={{ marginBottom: 12, color: tk.primary }}
                    />
                    <p style={{ fontSize: 14, fontWeight: 500 }}>
                      Failed to load activity
                    </p>
                    <button
                      onClick={fetchDashboardData}
                      style={{
                        marginTop: 12,
                        background: tk.surfaceHover,
                        border: `1px solid ${tk.border}`,
                        color: tk.textPrimary,
                        padding: "8px 16px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Retry
                    </button>
                  </div>
                ) : notifications && notifications.length > 0 ? (
                  notifications.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="activity-item"
                      onClick={async () => {
                        // Auto-mark as read when user clicks activity
                        try {
                          await useNotificationStore
                            .getState()
                            .markAsRead(item.id);
                        } catch (error) {
                          console.error(
                            "Failed to mark notification as read:",
                            error,
                          );
                        }
                      }}
                      style={{
                        padding: "16px",
                        borderRadius: 12,
                        background: tk.bg,
                        border: `1px solid ${tk.border}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          flex: 1,
                        }}
                      >
                        <Inbox
                          size={16}
                          style={{ color: tk.textMuted, flexShrink: 0 }}
                        />
                        <span
                          style={{
                            color: tk.textPrimary,
                            fontSize: 14,
                            fontWeight: 500,
                          }}
                        >
                          {item.title}: {item.description}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Clock size={12} style={{ color: tk.textMuted }} />
                        <span
                          style={{
                            color: tk.textMuted,
                            fontSize: 12,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {new Date(item.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "40px 0",
                      color: tk.textMuted,
                    }}
                  >
                    <Inbox
                      size={32}
                      style={{ marginBottom: 12, opacity: 0.5 }}
                    />
                    <p style={{ fontSize: 14, fontWeight: 500 }}>
                      No new activity
                    </p>
                    <p style={{ fontSize: 12, marginTop: 4 }}>
                      You're all caught up.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: "grid", gap: 20 }}>
              {/* Productivity / Status Card */}
              <div
                className="card-hover productivity-card"
                style={{
                  background: `linear-gradient(135deg, ${tk.brand}, ${tk.brandLight})`,
                  borderRadius: 20,
                  padding: 28,
                  position: "relative",
                  overflow: "hidden",
                  minHeight: 180,
                }}
              >
                {loading ? (
                  <div
                    className="shimmer"
                    style={{
                      height: 120,
                      width: "100%",
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.1)",
                    }}
                  />
                ) : errors.tasks ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      height: "100%",
                      color: "#fff",
                    }}
                  >
                    <AlertCircle size={24} style={{ marginBottom: 12 }} />
                    <p style={{ fontSize: 14, fontWeight: 500 }}>
                      Failed to load productivity
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <TrendingUp
                        size={16}
                        style={{ color: "rgba(255,255,255,.9)" }}
                      />
                      <p
                        style={{
                          margin: 0,
                          color: "rgba(255,255,255,.8)",
                          fontWeight: 700,
                          fontSize: 12,
                          letterSpacing: "1.5px",
                          position: "relative",
                          zIndex: 2,
                        }}
                      >
                        {role === "member"
                          ? "MY PRODUCTIVITY"
                          : role === "leader"
                            ? "TEAM PRODUCTIVITY"
                            : "WORKSPACE PRODUCTIVITY"}
                      </p>
                    </div>
                    <h2
                      style={{
                        marginTop: 12,
                        marginBottom: 0,
                        color: "#fff",
                        fontSize: 56,
                        fontWeight: 800,
                        letterSpacing: "-2px",
                        position: "relative",
                        zIndex: 2,
                      }}
                    >
                      {productivityScore}%
                    </h2>
                    <p
                      style={{
                        marginTop: 12,
                        color: "rgba(255,255,255,.95)",
                        lineHeight: 1.6,
                        fontSize: 14,
                        fontWeight: 500,
                        position: "relative",
                        zIndex: 2,
                      }}
                    >
                      {role === "owner" || role === "admin"
                        ? "Workspace completion rate across all tasks."
                        : role === "leader"
                          ? "Completion rate for tasks in your teams."
                          : "Your personal task completion rate."}
                    </p>
                  </>
                )}
                <div
                  style={{
                    position: "absolute",
                    bottom: -20,
                    right: -20,
                    width: 120,
                    height: 120,
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "50%",
                    filter: "blur(40px)",
                  }}
                />
              </div>

              {/* Modules (Placeholder for Phase 10) */}
              <div
                className="card-hover"
                style={{
                  background: tk.surface,
                  border: `1px solid ${tk.border}`,
                  borderRadius: 20,
                  padding: 24,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  <Target size={20} style={{ color: tk.warning }} />
                  <h3
                    style={{
                      margin: 0,
                      color: tk.textPrimary,
                      fontSize: 18,
                      fontWeight: 700,
                    }}
                  >
                    Modules
                  </h3>
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    { label: "Chat", color: tk.success },
                    { label: "Tasks", color: tk.success },
                    { label: "Attendance", color: tk.success },
                    { label: "Team Admin", color: tk.success },
                  ].map((goal) => (
                    <div key={goal.label}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            color: tk.textSecondary,
                            fontWeight: 500,
                          }}
                        >
                          {goal.label}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            color: goal.color,
                            fontWeight: 700,
                          }}
                        >
                          Active
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: "100%", background: goal.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

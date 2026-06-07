"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import {
  CheckSquare,
  Calendar,
  Megaphone,
  Users,
  Settings,
  LogOut,
  Search,
  User,
  TrendingUp,
  Clock,
  Activity,
  Sparkles,
  Bell,
  Target,
  Zap,
  ArrowUpRight,
  MoreVertical,
  FileText,
  DollarSign,
  Award,
} from "lucide-react";

import DashboardSidebar from "@/components/DashboardSidebar";
import { NotificationBadge } from "@/features/notification/components/NotificationBadge";
import { useNotificationStore } from "@/features/notification/store/notificationStore";

export default function DashboardPage() {
  const router = useRouter();
  const { authChecked } = useAuth();
  const [stats, setStats] = useState({
    total_members: 0,
    total_teams: 0,
    role: "employee",
  });
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  useEffect(() => {
    if (!authChecked) return;
    apiFetch("/api/workspaces/stats/")
      .then((r) => r.json())
      .then((d) => {
        if (d) setStats(d);
      })
      .catch(() => {});
  }, [authChecked]);
  if (!authChecked) return null;
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#0a0b14",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        .syne {
          font-family: 'Syne', sans-serif;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, -50px) scale(1.1); }
          66% { transform: translate(-50px, 50px) scale(0.9); }
        }

        .bg-orb-1 {
          position: fixed;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent);
          border-radius: 50%;
          filter: blur(120px);
          top: -200px;
          right: -200px;
          pointer-events: none;
          z-index: 0;
          animation: float 20s ease-in-out infinite;
        }

        .bg-orb-2 {
          position: fixed;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(129, 140, 248, 0.15), transparent);
          border-radius: 50%;
          filter: blur(120px);
          bottom: -150px;
          left: -150px;
          pointer-events: none;
          z-index: 0;
          animation: float 20s ease-in-out infinite 5s;
        }
        .card-hover {
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .card-hover::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: inherit;
          opacity: 0;
          transition: opacity 0.35s;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(129, 140, 248, 0.1));
          pointer-events: none;
        }

        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 60px rgba(0,0,0,.4);
          border-color: rgba(255,255,255,.12) !important;
        }

        .card-hover:hover::after {
          opacity: 1;
        }

        .stat-card {
          animation: fadeInUp 0.6s ease-out backwards;
        }

        .stat-card:nth-child(1) { animation-delay: 0.1s; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; }
        .stat-card:nth-child(3) { animation-delay: 0.3s; }
        .stat-card:nth-child(4) { animation-delay: 0.4s; }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        input:focus {
          outline: none;
          border-color: rgba(99, 102, 241, 0.6) !important;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        .activity-item {
          transition: all 0.25s ease;
          cursor: pointer;
        }

        .activity-item:hover {
          background: rgba(255,255,255,.06) !important;
          transform: translateX(4px);
          border-left: 3px solid #6366f1;
          padding-left: 13px !important;
        }

        .productivity-card {
          position: relative;
          overflow: hidden;
        }

        .productivity-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1), transparent);
          animation: rotate 20s linear infinite;
        }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .logo-gradient {
          background: linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .pulse {
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .shimmer {
          position: relative;
          overflow: hidden;
        }

        .shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .avatar {
          position: relative;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .avatar:hover {
          transform: scale(1.1);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }

        .logout-btn {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .logout-btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(0,0,0,0.2);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .logout-btn:hover::before {
          width: 300px;
          height: 300px;
        }

        .logout-btn:hover {
          background: #dc2626 !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
        }

        .stat-icon {
          animation: iconFloat 3s ease-in-out infinite;
        }

        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .search-wrapper {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,.4);
          pointer-events: none;
        }

        .progress-bar {
          height: 6px;
          background: rgba(255,255,255,.1);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #818cf8);
          border-radius: 10px;
          transition: width 1s ease;
          position: relative;
          overflow: hidden;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: shimmer 2s infinite;
        }

        .quick-action {
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .quick-action:hover {
          transform: translateY(-4px);
          background: rgba(99, 102, 241, 0.2) !important;
        }

        .team-member {
          transition: all 0.3s ease;
        }

        .team-member:hover {
          transform: scale(1.1);
          z-index: 10;
        }

        .notification-badge {
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      <div className="bg-orb-1" />
      <div className="bg-orb-2" />

      <DashboardSidebar />

      {/* CONTENT AREA */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* TOPBAR */}
        <header
          style={{
            padding: "24px 32px",
            borderBottom: "1px solid rgba(255,255,255,.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(18, 20, 31, 0.6)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div>
            <h1
              className="syne"
              style={{
                color: "#fff",
                margin: 0,
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: "-0.5px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Sparkles size={28} style={{ color: "#818cf8" }} />
              Welcome Back
            </h1>

            <p
              style={{
                color: "rgba(255,255,255,.55)",
                marginTop: 8,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Manage your business operations from one place.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                placeholder="Search..."
                style={{
                  width: 280,
                  padding: "12px 18px 12px 44px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,.08)",
                  background: "rgba(26, 29, 46, 0.6)",
                  color: "#fff",
                  fontSize: 14,
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
                padding: 10,
                borderRadius: 12,
                background: "rgba(26, 29, 46, 0.6)",
                border: "1px solid rgba(255,255,255,.08)",
                transition: "all 0.3s ease",
              }}
              className="card-hover"
            >
              <Bell size={20} style={{ color: "rgba(255,255,255,.7)" }} />
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
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                    border: "2px solid #12141f",
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
                background: "linear-gradient(135deg,#6366f1,#818cf8)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 16,
                boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
              }}
            >
              <User size={20} />
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <div
          style={{
            padding: 32,
            overflowY: "auto",
          }}
        >
          {/* STATS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 20,
              marginBottom: 24,
            }}
          >
            {[
              {
                value: String(stats.total_members),
                label: "Team Members",
                color: "#6366f1",
                icon: Users,
                change: "",
              },
              {
                value: String(stats.total_teams || 0),
                label: "Teams",
                color: "#8b5cf6",
                icon: CheckSquare,
                change: "",
              },
              {
                value:
                  (stats.role || "employee").charAt(0).toUpperCase() +
                  (stats.role || "employee").slice(1),
                label: "Your Role",
                color: "#10b981",
                icon: TrendingUp,
                change: "",
              },
              {
                value: "✓",
                label: "System Live",
                color: "#10b981",
                icon: Megaphone,
                change: "",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="card-hover stat-card"
                  style={{
                    background: "rgba(26, 29, 46, 0.6)",
                    border: "1px solid rgba(255,255,255,.08)",
                    borderRadius: 20,
                    padding: 28,
                    backdropFilter: "blur(20px)",
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
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#10b981",
                        boxShadow: "0 0 8px #10b981",
                      }}
                    />
                  </div>

                  <h2
                    className="syne"
                    style={{
                      margin: 0,
                      color: "#fff",
                      fontSize: 40,
                      fontWeight: 700,
                      letterSpacing: "-1px",
                    }}
                  >
                    {item.value}
                  </h2>

                  <p
                    style={{
                      marginTop: 12,
                      color: "rgba(255,255,255,.6)",
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
                background: "rgba(26, 29, 46, 0.6)",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 20,
                padding: 24,
                backdropFilter: "blur(20px)",
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
                <Zap size={20} style={{ color: "#f59e0b" }} />
                <h3
                  className="syne"
                  style={{
                    margin: 0,
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  Quick Actions
                </h3>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  { icon: CheckSquare, label: "Create Task", color: "#8b5cf6" },
                  { icon: Calendar, label: "Schedule Meet", color: "#10b981" },
                  { icon: FileText, label: "New Report", color: "#6366f1" },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.label}
                      className="quick-action"
                      style={{
                        padding: "12px 14px",
                        borderRadius: 12,
                        background: "rgba(255,255,255,.03)",
                        border: "1px solid rgba(255,255,255,.05)",
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
                          color: "rgba(255,255,255,.75)",
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

            {/* Team Overview */}
            <div
              className="card-hover"
              style={{
                background: "rgba(26, 29, 46, 0.6)",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 20,
                padding: 24,
                backdropFilter: "blur(20px)",
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
                <Users size={20} style={{ color: "#6366f1" }} />
                <h3
                  className="syne"
                  style={{
                    margin: 0,
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  Team Online
                </h3>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={`team-member-${i}`} 
                    className="team-member"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${i % 2 === 0 ? "#6366f1" : "#8b5cf6"}, ${i % 2 === 0 ? "#818cf8" : "#a78bfa"})`,
                      border: "3px solid #12141f",
                      marginLeft: i > 1 ? -12 : 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,.1)",
                    border: "3px solid #12141f",
                    marginLeft: -12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,.6)",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  +10
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,.5)",
                  fontWeight: 500,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span>Active Now</span>
                  <span style={{ color: "#10b981", fontWeight: 700 }}>
                    12/15
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "80%" }} />
                </div>
              </div>
            </div>

            {/* Revenue */}
            <div
              className="card-hover"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
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
                <DollarSign
                  size={20}
                  style={{ color: "rgba(255,255,255,.9)" }}
                />
                <h3
                  className="syne"
                  style={{
                    margin: 0,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  Revenue
                </h3>
              </div>
              <h2
                className="syne"
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
                $128.4K
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
                <span style={{ color: "#fff", fontWeight: 700 }}>↑ 23.5%</span>{" "}
                from last month
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
            <div
              className="card-hover"
              style={{
                background: "rgba(26, 29, 46, 0.6)",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 20,
                padding: 28,
                backdropFilter: "blur(20px)",
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
                  <Activity size={24} style={{ color: "#6366f1" }} />
                  <h3
                    className="syne"
                    style={{
                      margin: 0,
                      color: "#fff",
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
                    background: "#10b981",
                    boxShadow: "0 0 12px #10b981",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 12,
                }}
              >
                {[
                  {
                    text: "John marked attendance at 9:02 AM",
                    time: "2m ago",
                    icon: Calendar,
                  },
                  {
                    text: "New task assigned to Sales Team",
                    time: "15m ago",
                    icon: CheckSquare,
                  },
                  {
                    text: "Meeting announced for 5 PM",
                    time: "1h ago",
                    icon: Megaphone,
                  },
                  {
                    text: "Invoice report uploaded",
                    time: "2h ago",
                    icon: TrendingUp,
                  },
                  {
                    text: "Team member Sarah joined",
                    time: "3h ago",
                    icon: Users,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.text}
                      className="activity-item"
                      style={{
                        padding: "16px",
                        borderRadius: 12,
                        background: "rgba(255,255,255,.03)",
                        border: "1px solid rgba(255,255,255,.05)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
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
                        <Icon
                          size={16}
                          style={{
                            color: "rgba(255,255,255,.4)",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            color: "rgba(255,255,255,.75)",
                            fontSize: 14,
                            fontWeight: 500,
                          }}
                        >
                          {item.text}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Clock
                          size={12}
                          style={{ color: "rgba(255,255,255,.3)" }}
                        />
                        <span
                          style={{
                            color: "rgba(255,255,255,.4)",
                            fontSize: 12,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: "grid", gap: 20 }}>
              {/* Productivity */}
              <div
                className="card-hover productivity-card"
                style={{
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  borderRadius: 20,
                  padding: 28,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
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
                    PRODUCTIVITY SCORE
                  </p>
                </div>

                <h2
                  className="syne"
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
                  89%
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
                  Your team is performing strongly this week. Keep momentum
                  high.
                </p>

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

              {/* Goals */}
              <div
                className="card-hover"
                style={{
                  background: "rgba(26, 29, 46, 0.6)",
                  border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: 20,
                  padding: 24,
                  backdropFilter: "blur(20px)",
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
                  <Target size={20} style={{ color: "#f59e0b" }} />
                  <h3
                    className="syne"
                    style={{
                      margin: 0,
                      color: "#fff",
                      fontSize: 18,
                      fontWeight: 700,
                    }}
                  >
                    Monthly Goals
                  </h3>
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    {
                      label: "Tasks Completed",
                      value: 78,
                      max: 100,
                      color: "#6366f1",
                    },
                    {
                      label: "Team Meetings",
                      value: 12,
                      max: 15,
                      color: "#10b981",
                    },
                    {
                      label: "Client Calls",
                      value: 24,
                      max: 30,
                      color: "#f59e0b",
                    },
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
                            color: "rgba(255,255,255,.7)",
                            fontWeight: 500,
                          }}
                        >
                          {goal.label}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            color: "#fff",
                            fontWeight: 700,
                          }}
                        >
                          {goal.value}/{goal.max}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${(goal.value / goal.max) * 100}%`,
                            background: goal.color,
                          }}
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

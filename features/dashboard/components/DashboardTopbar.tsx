"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/features/dashboard/store/profileStore";
import {
  Sparkles,
  Bell,
  Plus,
  UserPlus,
  Users,
  Megaphone,
  CheckSquare,
  Building2,
  ChevronDown,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import { tk } from "@/lib/tokens";

export default function DashboardTopbar({
  user,
  todayString,
  greeting,
  unreadCount,
  onModalOpen,
}: any) {
  const router = useRouter();
  const openProfile = useProfileStore((s) => s.openProfile);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const quickActionsList = [
    {
      icon: UserPlus,
      label: "Invite User",
      color: tk.success,
      modal: "invite",
    },
    { icon: Users, label: "Create Team", color: tk.brand, modal: "team" },
    {
      icon: Megaphone,
      label: "Announcement",
      color: tk.brandLight,
      modal: "announcement",
    },
    {
      icon: CheckSquare,
      label: "Create Task",
      color: tk.warning,
      modal: "task",
    },
  ];

  return (
    <>
      <style>{`
        .avatar { position: relative; transition: all 0.3s ease; cursor: pointer; }
        .avatar:hover { transform: scale(1.1); box-shadow: 0 8px 24px ${tk.brand}44; }
        .notification-badge { animation: bounce 2s ease-in-out infinite; } @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      `}</style>

      {/* MOBILE GREETING */}
      <div className="lg:hidden flex justify-between items-center mt-4 mb-6">
        <div>
          <p
            className="m-0 text-xs font-semibold uppercase tracking-wider"
            style={{ color: tk.textMuted }}
          >
            {todayString}
          </p>
          <h1
            className="m-1 text-xl font-extrabold tracking-tight flex items-center gap-2"
            style={{ color: tk.textPrimary }}
          >
            <span className="whitespace-nowrap overflow-hidden text-ellipsis">
              {greeting}, {user?.full_name?.split(" ")[0] || "User"}
            </span>
            <Sparkles
              size={18}
              className="flex-shrink-0"
              style={{ color: tk.brandLight }}
            />
          </h1>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="avatar flex items-center justify-center cursor-pointer"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: tk.surface,
              border: `1px solid ${tk.border}`,
            }}
          >
            <Plus size={18} color={tk.brandLight} />
          </button>
          {showQuickActions && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowQuickActions(false)}
              />
              <div
                className="absolute top-12 right-0 z-50 p-2 rounded-xl shadow-2xl"
                style={{
                  background: tk.surface,
                  border: `1px solid ${tk.border}`,
                  minWidth: 180,
                }}
              >
                {quickActionsList.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => {
                        onModalOpen(action.modal);
                        setShowQuickActions(false);
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-700/50"
                      style={{
                        color: tk.textPrimary,
                        background: "transparent",
                        border: "none",
                      }}
                    >
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: `${action.color}20`,
                        }}
                      >
                        <Icon size={12} color={action.color} />
                      </div>
                      <span className="text-xs font-medium">
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* DESKTOP TOPBAR */}
      <header className="hidden lg:flex justify-between items-center mb-8 flex-wrap gap-4 w-full">
        <div className="min-w-0 flex-1">
          <p
            className="m-0 text-xs font-semibold uppercase tracking-wider"
            style={{ color: tk.textMuted }}
          >
            {todayString}
          </p>
          <h1
            className="m-1 text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3"
            style={{ color: tk.textPrimary }}
          >
            <span className="truncate">
              {greeting}, {user?.full_name?.split(" ")[0] || "User"}
            </span>
            <Sparkles
              size={24}
              className="flex-shrink-0"
              style={{ color: tk.brandLight }}
            />
          </h1>
          {user?.company_name && (
            <button
              onClick={() => router.push("/dashboard/workspace")}
              className="flex items-center gap-1.5 mt-1 text-sm font-medium transition-colors hover:underline"
              style={{ color: tk.textMuted }}
            >
              <Building2 size={14} /> {user.company_name}{" "}
              <ChevronDown size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2 items-center flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="avatar flex items-center justify-center cursor-pointer"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: tk.surface,
                border: `1px solid ${tk.border}`,
              }}
            >
              <Plus size={18} color={tk.brandLight} />
            </button>
            {showQuickActions && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowQuickActions(false)}
                />
                <div
                  className="absolute top-12 right-0 z-50 p-2 rounded-xl shadow-2xl"
                  style={{
                    background: tk.surface,
                    border: `1px solid ${tk.border}`,
                    minWidth: 200,
                  }}
                >
                  {quickActionsList.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        onClick={() => {
                          onModalOpen(action.modal);
                          setShowQuickActions(false);
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-700/50"
                        style={{
                          color: tk.textPrimary,
                          background: "transparent",
                          border: "none",
                        }}
                      >
                        <div
                          className="flex items-center justify-center"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: `${action.color}20`,
                          }}
                        >
                          <Icon size={14} color={action.color} />
                        </div>
                        <span className="text-sm font-medium">
                          {action.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <div
            onClick={() => router.push("/dashboard/notifications")}
            className="card-hover relative cursor-pointer p-2.5 rounded-xl"
            style={{ background: tk.surface, border: `1px solid ${tk.border}` }}
          >
            <Bell size={20} style={{ color: tk.textSecondary }} />
            {unreadCount > 0 && (
              <div
                className="notification-badge absolute top-1 right-1 flex items-center justify-center"
                style={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  background: tk.primary,
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "0 4px",
                  border: `2px solid ${tk.bg}`,
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}
          </div>
          <div
            onClick={() => openProfile(user)}
            className="cursor-pointer"
            title="My Profile"
          >
            <Avatar user={user} size="md" />
          </div>
        </div>
      </header>
    </>
  );
}

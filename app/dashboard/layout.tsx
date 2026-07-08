"use client";

import { useAuth } from "@/hooks/useAuth";
import CompanySidebar from "@/components/sidebar/CompanySidebar";
import IndependentSidebar from "@/components/sidebar/IndependentSidebar";
import { useHttpNotifications } from "@/features/notification/hooks/useHttpNotifications";
import { NotificationStack } from "@/features/notification/components/NotificationStack";
import { useNotificationStore } from "@/features/notification/store/notificationStore";
import { useProfileStore } from "@/features/dashboard/store/profileStore";
import { useChatStore } from "@/features/chat/store/chatStore";
import ProfileDrawer from "@/features/dashboard/components/ProfileDrawer";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  MessageSquare,
  CheckSquare,
  Clock,
  MoreHorizontal,
  Bell,
  Users,
  Settings,
  Menu,
  X,
  Megaphone,
  Mail,
  Building2,
  ChevronDown,
  StickyNote,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import WelcomeExperience from "@/components/WelcomeExperience";
import { shouldShowWelcome } from "@/lib/content";

const ALLOWED_WITHOUT_WORKSPACE = [
  "/dashboard",
  "/dashboard/invites",
  "/dashboard/clock",
  "/dashboard/notes",
  "/dashboard/settings",
];

const INDEPENDENT_NAV_ITEMS = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Invitations", href: "/dashboard/invites", icon: Mail },
  { name: "Clock", href: "/dashboard/clock", icon: Clock },
  { name: "Notes", href: "/dashboard/notes", icon: StickyNote },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const MORE_ITEMS = [
  { label: "Announcements", path: "/dashboard/announcements", icon: Megaphone },
  { label: "Teams", path: "/dashboard/team", icon: Users },
  { label: "Notes", path: "/dashboard/notes", icon: StickyNote },
  { label: "Settings", path: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authChecked, isIndependent, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showTabletSidebar, setShowTabletSidebar] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    if (typeof window === "undefined") return false;
    const freshLogin = sessionStorage.getItem("show_welcome");
    if (freshLogin === "true") return true;
    const lastActive = localStorage.getItem("last_active_time");
    if (!lastActive) return true;
    const diff = Date.now() - parseInt(lastActive, 10);
    return diff / (1000 * 60 * 60) >= 4;
  });
  const [isInitializing, setIsInitializing] = useState(true);

  const openProfile = useProfileStore((s) => s.openProfile);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const selectedChatId = useChatStore((s) => s.selectedChannelId);

  useHttpNotifications();

  useEffect(() => {
    if (authChecked && user) {
      // Clear the fresh login flag now that we've consumed it in useState initializer
      sessionStorage.removeItem("show_welcome");

      // Trigger the initialization pipeline the moment user is confirmed
      import("@/lib/initialization/appInitialization").then(
        async ({ runInitializationPipeline }) => {
          try {
            await runInitializationPipeline(user.workspace_id);
          } catch (e) {
            console.error("Initialization pipeline failed", e);
          } finally {
            setIsInitializing(false);
          }
        },
      );
    }
  }, [authChecked, user]);

  useEffect(() => {
    if (authChecked && isIndependent) {
      const isAllowed = ALLOWED_WITHOUT_WORKSPACE.some((route) => {
        if (route === "/dashboard") return pathname === "/dashboard";
        return pathname === route || pathname.startsWith(route + "/");
      });
      if (!isAllowed) {
        router.replace("/dashboard");
      }
    }

    setShowTabletSidebar(false);
    setShowMoreSheet(false);
  }, [authChecked, isIndependent, pathname, router]);

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)]" />
    );
  }

  if (isIndependent) {
    const isAllowed = ALLOWED_WITHOUT_WORKSPACE.some((route) => {
      if (route === "/dashboard") return pathname === "/dashboard";
      return pathname === route || pathname.startsWith(route + "/");
    });
    if (!isAllowed) {
      return (
        <div className="flex h-screen items-center justify-center bg-[var(--bg)] text-[var(--heading)]">
          Redirecting...
        </div>
      );
    }
  }

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  const isChatRoute = pathname.startsWith("/dashboard/chat");
  const hideBottomNav = isChatRoute && selectedChatId !== null;
  const showMobileTopBar = pathname === "/dashboard";

  const isMoreRoute = MORE_ITEMS.some((item) => pathname.startsWith(item.path));

  return (
    <>
      {showWelcome && (
        <WelcomeExperience
          isBackendReady={!isInitializing}
          onFinished={() => setShowWelcome(false)}
        />
      )}
      <style>{`
        .dashboard-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .dashboard-scroll::-webkit-scrollbar-track { background: transparent; }
        .dashboard-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .dashboard-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
      `}</style>

      <div className="flex h-screen bg-[var(--bg)] overflow-hidden">
        {!isIndependent ? <CompanySidebar /> : <IndependentSidebar />}

        {showTabletSidebar && (
          <div className="hidden md:flex lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowTabletSidebar(false)}
            />
            <div className="relative h-full shadow-2xl">
              <button
                onClick={() => setShowTabletSidebar(false)}
                className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--heading)] z-10"
              >
                <X size={24} />
              </button>
              {!isIndependent ? (
                <CompanySidebar isMobileDrawer={true} />
              ) : (
                <IndependentSidebar isMobileDrawer={true} />
              )}
            </div>
          </div>
        )}

        <main className="flex-1 flex flex-col overflow-hidden h-full">
          {showMobileTopBar && (
            <header className="md:hidden flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg)] flex-shrink-0 z-30 sticky top-0">
              <div className="flex flex-col">
                <div className="text-[var(--heading)] font-bold text-lg tracking-wide leading-tight">
                  Acumen Teams
                </div>
                {user?.company_name && (
                  <button
                    onClick={() => router.push("/dashboard/workspace")}
                    className="flex items-center gap-1 text-xs font-medium mt-0.5 hover:underline text-left"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Building2 size={12} /> {user.company_name}{" "}
                    <ChevronDown size={12} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div
                  onClick={() => router.push("/dashboard/notifications")}
                  className="relative cursor-pointer p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
                >
                  <Bell size={18} color="var(--text-secondary)" />
                  {unreadCount > 0 && (
                    <div
                      className="absolute top-1 right-1 flex items-center justify-center bg-[var(--primary)] text-[var(--heading)] font-bold rounded-full"
                      style={{
                        minWidth: 16,
                        height: 16,
                        fontSize: 9,
                        padding: "0 4px",
                        border: "2px solid var(--bg)",
                      }}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </div>
                  )}
                </div>
                <div
                  onClick={() => openProfile(user)}
                  className="cursor-pointer"
                >
                  <Avatar user={user} size="sm" />
                </div>
              </div>
            </header>
          )}

          <header className="hidden md:flex lg:hidden items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg)] flex-shrink-0 z-30 sticky top-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTabletSidebar(true)}
                className="text-[var(--text-secondary)] hover:text-[var(--heading)] p-2"
              >
                <Menu size={24} />
              </button>
              <div className="flex flex-col">
                <div className="text-[var(--heading)] font-bold text-lg tracking-wide leading-tight">
                  Acumen Teams
                </div>
                {user?.company_name && (
                  <button
                    onClick={() => router.push("/dashboard/workspace")}
                    className="flex items-center gap-1 text-xs font-medium mt-0.5 hover:underline text-left"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Building2 size={12} /> {user.company_name}{" "}
                    <ChevronDown size={12} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                onClick={() => router.push("/dashboard/notifications")}
                className="relative cursor-pointer p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
              >
                <Bell size={18} color="var(--text-secondary)" />
                {unreadCount > 0 && (
                  <div
                    className="absolute top-1 right-1 flex items-center justify-center bg-[var(--primary)] text-[var(--heading)] font-bold rounded-full"
                    style={{
                      minWidth: 16,
                      height: 16,
                      fontSize: 9,
                      padding: "0 4px",
                      border: "2px solid var(--bg)",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </div>
                )}
              </div>
              <div onClick={() => openProfile(user)} className="cursor-pointer">
                <Avatar user={user} size="sm" />
              </div>
            </div>
          </header>

          <div
            className={`flex-1 ${!isChatRoute ? "overflow-y-auto pb-20 md:pb-0" : ""} overflow-x-hidden dashboard-scroll w-full`}
            style={{ background: "var(--bg)" }}
          >
            <div className={`${!isChatRoute ? "" : "h-full flex flex-col"}`}>
              {children}
            </div>
          </div>
        </main>
      </div>

      {!hideBottomNav && !isIndependent && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg)] border-t border-[var(--border)] flex justify-around items-center h-16 z-40 px-1">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex flex-col items-center p-1.5 transition-colors w-1/5"
            style={{
              color: isActive("/dashboard")
                ? "var(--brand-light)"
                : "var(--text-secondary)",
            }}
          >
            <Home size={20} />
            <span className="text-[9px] mt-1 font-semibold whitespace-nowrap">
              Home
            </span>
          </button>
          <button
            onClick={() => router.push("/dashboard/chat")}
            className="flex flex-col items-center p-1.5 transition-colors w-1/5"
            style={{
              color: isActive("/dashboard/chat")
                ? "var(--brand-light)"
                : "var(--text-secondary)",
            }}
          >
            <MessageSquare size={20} />
            <span className="text-[9px] mt-1 font-semibold whitespace-nowrap">
              Chat
            </span>
          </button>
          <button
            onClick={() => router.push("/dashboard/tasks")}
            className="flex flex-col items-center p-1.5 transition-colors w-1/5"
            style={{
              color: isActive("/dashboard/tasks")
                ? "var(--brand-light)"
                : "var(--text-secondary)",
            }}
          >
            <CheckSquare size={20} />
            <span className="text-[9px] mt-1 font-semibold whitespace-nowrap">
              Tasks
            </span>
          </button>

          <button
            onClick={() => router.push("/dashboard/attendance")}
            className="flex flex-col items-center p-1.5 transition-colors w-1/5"
            style={{
              color: isActive("/dashboard/attendance")
                ? "var(--brand-light)"
                : "var(--text-secondary)",
            }}
          >
            <Clock size={20} />
            <span className="text-[9px] mt-1 font-semibold whitespace-nowrap">
              Attendance
            </span>
          </button>

          <button
            onClick={() => setShowMoreSheet(!showMoreSheet)}
            className="flex flex-col items-center p-1.5 transition-colors w-1/5"
            style={{
              color:
                showMoreSheet || isMoreRoute
                  ? "var(--brand-light)"
                  : "var(--text-secondary)",
            }}
          >
            <MoreHorizontal size={20} />
            <span className="text-[9px] mt-1 font-semibold whitespace-nowrap">
              More
            </span>
          </button>
        </div>
      )}

      {!hideBottomNav && isIndependent && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg)] border-t border-[var(--border)] flex justify-around items-center h-16 z-40 px-1">
          {INDEPENDENT_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center p-1.5 transition-colors w-1/5"
                style={{
                  color: active
                    ? "var(--brand-light)"
                    : "var(--text-secondary)",
                }}
              >
                <Icon size={20} />
                <span className="text-[9px] mt-1 font-semibold whitespace-nowrap">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {showMoreSheet && !isIndependent && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40"
            style={{ background: "transparent" }}
            onClick={() => setShowMoreSheet(false)}
          />
          <div
            className="md:hidden fixed bottom-20 right-4 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl z-50 p-2 origin-bottom-right"
            onClick={(e) => e.stopPropagation()}
          >
            {MORE_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  router.push(item.path);
                  setShowMoreSheet(false);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--heading)] transition-colors"
              >
                <item.icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <ProfileDrawer />
      <NotificationStack />
    </>
  );
}

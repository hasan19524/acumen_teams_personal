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
} from "lucide-react";
import Avatar from "@/components/Avatar";

const ALLOWED_WITHOUT_WORKSPACE = [
  "/dashboard",
  "/dashboard/invites",
  "/dashboard/clock",
  "/dashboard/settings",
];

// Independent users mobile nav items
const INDEPENDENT_NAV_ITEMS = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Invitations", href: "/dashboard/invites", icon: Mail },
  { name: "Clock", href: "/dashboard/clock", icon: Clock },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

// Items inside the "More" menu
const MORE_ITEMS = [
  { label: "Announcements", path: "/dashboard/announcements", icon: Megaphone },
  { label: "Teams", path: "/dashboard/team", icon: Users },
  { label: "Invites", path: "/dashboard/invites", icon: Mail },
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

  const openProfile = useProfileStore((s) => s.openProfile);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const selectedChatId = useChatStore((s) => s.selectedChannelId);

  useHttpNotifications();

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
      <div className="flex h-screen items-center justify-center bg-[#081325] text-white">
        Loading Workspace...
      </div>
    );
  }

  if (isIndependent) {
    const isAllowed = ALLOWED_WITHOUT_WORKSPACE.some((route) => {
      if (route === "/dashboard") return pathname === "/dashboard";
      return pathname === route || pathname.startsWith(route + "/");
    });
    if (!isAllowed) {
      return (
        <div className="flex h-screen items-center justify-center bg-[#081325] text-white">
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
      <style>{`
        .dashboard-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .dashboard-scroll::-webkit-scrollbar-track { background: transparent; }
        .dashboard-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .dashboard-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
      `}</style>

      <div className="flex h-screen bg-[#081325] overflow-hidden">
        {/* 1. DESKTOP SIDEBAR (Separated Logic) */}
        {!isIndependent ? <CompanySidebar /> : <IndependentSidebar />}

        {/* 2. TABLET SIDEBAR DRAWER */}
        {showTabletSidebar && (
          <div className="hidden md:flex lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowTabletSidebar(false)}
            />
            <div className="relative h-full shadow-2xl">
              <button
                onClick={() => setShowTabletSidebar(false)}
                className="absolute top-4 right-4 text-[#B7C0D8] hover:text-white z-10"
              >
                <X size={24} />
              </button>
              {!isIndependent ? <CompanySidebar isMobileDrawer={true} /> : <IndependentSidebar isMobileDrawer={true} />}
            </div>
          </div>
        )}

        {/* 3. MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col overflow-hidden h-full">
          {/* MOBILE GLOBAL TOP BAR */}
          {showMobileTopBar && (
            <header className="md:hidden flex items-center justify-between p-4 border-b border-[#2A3A5C] bg-[#081325] flex-shrink-0 z-30 sticky top-0">
              <div className="flex flex-col">
                <div className="text-white font-bold text-lg tracking-wide leading-tight">
                  Acumen Teams
                </div>
                {user?.company_name && (
                  <button
                    onClick={() => router.push("/dashboard/workspace")}
                    className="flex items-center gap-1 text-xs font-medium mt-0.5 hover:underline text-left"
                    style={{ color: "#7A86A7" }}
                  >
                    <Building2 size={12} /> {user.company_name}{" "}
                    <ChevronDown size={12} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div
                  onClick={() => router.push("/dashboard/notifications")}
                  className="relative cursor-pointer p-2.5 rounded-xl bg-[#172440] border border-[#2A3A5C]"
                >
                  <Bell size={18} color="#B7C0D8" />
                  {unreadCount > 0 && (
                    <div
                      className="absolute top-1 right-1 flex items-center justify-center bg-[#E31E24] text-white font-bold rounded-full"
                      style={{
                        minWidth: 16,
                        height: 16,
                        fontSize: 9,
                        padding: "0 4px",
                        border: "2px solid #081325",
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

          {/* TABLET GLOBAL TOP BAR */}
          <header className="hidden md:flex lg:hidden items-center justify-between p-4 border-b border-[#2A3A5C] bg-[#081325] flex-shrink-0 z-30 sticky top-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTabletSidebar(true)}
                className="text-[#B7C0D8] hover:text-white p-2"
              >
                <Menu size={24} />
              </button>
              <div className="flex flex-col">
                <div className="text-white font-bold text-lg tracking-wide leading-tight">
                  Acumen Teams
                </div>
                {user?.company_name && (
                  <button
                    onClick={() => router.push("/dashboard/workspace")}
                    className="flex items-center gap-1 text-xs font-medium mt-0.5 hover:underline text-left"
                    style={{ color: "#7A86A7" }}
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
                className="relative cursor-pointer p-2.5 rounded-xl bg-[#172440] border border-[#2A3A5C]"
              >
                <Bell size={18} color="#B7C0D8" />
                {unreadCount > 0 && (
                  <div
                    className="absolute top-1 right-1 flex items-center justify-center bg-[#E31E24] text-white font-bold rounded-full"
                    style={{
                      minWidth: 16,
                      height: 16,
                      fontSize: 9,
                      padding: "0 4px",
                      border: "2px solid #081325",
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

          {/* SCROLLABLE CONTENT CONTAINER */}
          <div
            className={`flex-1 ${!isChatRoute ? "overflow-y-auto" : ""} overflow-x-hidden dashboard-scroll w-full`}
          >
            <div className={`${!isChatRoute ? "pb-20 md:pb-0 min-h-full" : "h-full flex flex-col"}`}>
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* 4. MOBILE BOTTOM NAV */}
      {!hideBottomNav && !isIndependent && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#081325] border-t border-[#2A3A5C] flex justify-around items-center h-16 z-40 px-1">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex flex-col items-center p-1.5 transition-colors w-1/5"
            style={{ color: isActive("/dashboard") ? "#5DADE2" : "#B7C0D8" }}
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
              color: isActive("/dashboard/chat") ? "#5DADE2" : "#B7C0D8",
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
              color: isActive("/dashboard/tasks") ? "#5DADE2" : "#B7C0D8",
            }}
          >
            <CheckSquare size={20} />
            <span className="text-[9px] mt-1 font-semibold whitespace-nowrap">
              Tasks
            </span>
          </button>

          {/* 4TH SLOT: ATTENDANCE */}
          <button
            onClick={() => router.push("/dashboard/attendance")}
            className="flex flex-col items-center p-1.5 transition-colors w-1/5"
            style={{
              color: isActive("/dashboard/attendance") ? "#5DADE2" : "#B7C0D8",
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
              color: showMoreSheet || isMoreRoute ? "#5DADE2" : "#B7C0D8",
            }}
          >
            <MoreHorizontal size={20} />
            <span className="text-[9px] mt-1 font-semibold whitespace-nowrap">
              More
            </span>
          </button>
        </div>
      )}

      {/* 5. INDEPENDENT MOBILE BOTTOM NAV */}
      {!hideBottomNav && isIndependent && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#081325] border-t border-[#2A3A5C] flex justify-around items-center h-16 z-40 px-1">
          {INDEPENDENT_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center p-1.5 transition-colors w-1/4"
                style={{ color: active ? "#5DADE2" : "#B7C0D8" }}
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

      {/* 6. MOBILE "MORE" NATIVE POPOVER */}
      {showMoreSheet && !isIndependent && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40"
            style={{ background: "transparent" }}
            onClick={() => setShowMoreSheet(false)}
          />
          <div
            className="md:hidden fixed bottom-20 right-4 w-48 bg-[#172440] border border-[#2A3A5C] rounded-xl shadow-2xl z-50 p-2 origin-bottom-right"
            onClick={(e) => e.stopPropagation()}
          >
            {MORE_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  router.push(item.path);
                  setShowMoreSheet(false);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#20304E] text-[#B7C0D8] hover:text-white transition-colors"
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
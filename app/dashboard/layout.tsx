// app/dashboard/layout.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useHttpNotifications } from "@/features/notification/hooks/useHttpNotifications";
import { NotificationStack } from "@/features/notification/components/NotificationStack";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const ALLOWED_WITHOUT_WORKSPACE = [
  "/dashboard",
  "/dashboard/invites",
  "/dashboard/clock",
  "/dashboard/settings",
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authChecked, isIndependent } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useHttpNotifications();

  useEffect(() => {
    if (authChecked && isIndependent) {
      // Strict check: /dashboard is allowed, but /dashboard/attendance is NOT
      const isAllowed = ALLOWED_WITHOUT_WORKSPACE.some((route) => {
        if (route === "/dashboard") return pathname === "/dashboard";
        return pathname === route || pathname.startsWith(route + "/");
      });
      if (!isAllowed) {
        router.replace("/dashboard");
      }
    }
  }, [authChecked, isIndependent, pathname, router]);

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617] text-white">
        Loading Workspace...
      </div>
    );
  }

  // If independent user tries to access a restricted route, show loading screen while redirecting
  if (isIndependent) {
    const isAllowed = ALLOWED_WITHOUT_WORKSPACE.some((route) => {
      if (route === "/dashboard") return pathname === "/dashboard";
      return pathname === route || pathname.startsWith(route + "/");
    });
    if (!isAllowed) {
      return (
        <div className="flex h-screen items-center justify-center bg-[#020617] text-white">
          Redirecting...
        </div>
      );
    }
  }

  return (
    <>
      <style>{`
        .dashboard-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .dashboard-scroll::-webkit-scrollbar-track { background: transparent; }
        .dashboard-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .dashboard-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
      `}</style>

      <div className="flex h-screen bg-[#020617] overflow-hidden">
        <DashboardSidebar hasWorkspace={!isIndependent} />
        <main className="flex-1 overflow-y-auto h-screen dashboard-scroll">
          {children}
        </main>
      </div>

      <NotificationStack />
    </>
  );
}

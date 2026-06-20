// app/dashboard/layout.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useHttpNotifications } from "@/features/notification/hooks/useHttpNotifications";
import { NotificationStack } from "@/features/notification/components/NotificationStack";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authChecked } = useAuth();

  // Initialize HTTP polling for notifications
  useHttpNotifications();

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617] text-white">
        Loading Workspace...
      </div>
    );
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
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto h-screen dashboard-scroll">
          {children}
        </main>
      </div>

      {/* Render the popups globally */}
      <NotificationStack />
    </>
  );
}

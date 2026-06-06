"use client";

import React, { useEffect } from "react";
import { useNotificationStore } from "@/features/notification/store/notificationStore"; // Use the exact path ChatGPT helped you fix!

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const addNotification = useNotificationStore((s) => s.addNotification);

  // TEMPORARY TEST: Fire a notification 3 seconds after the dashboard loads
  useEffect(() => {
    const timer = setTimeout(() => {
      addNotification({
        type: "notification",
        notification_type: "mention",
        notification_id: `test-${Date.now()}`,
        data: {
          title: "New Mention",
          message: "John Doe mentioned you in #general",
          avatar_url: null,
          redirect_url: "/dashboard/chat",
        },
        timestamp: new Date().toISOString(),
      });
    }, 3000); // 3 seconds delay

    return () => clearTimeout(timer);
  }, [addNotification]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6">
        <h2 className="font-bold text-xl mb-8">Acumen Teams</h2>
        <nav className="space-y-4">
          <a href="/dashboard" className="block text-gray-700 font-medium">
            Dashboard
          </a>
          <a href="/chat" className="block text-gray-500 hover:text-blue-600">
            Chat
          </a>
          <a href="/tasks" className="block text-gray-500 hover:text-blue-600">
            Tasks Board
          </a>
          <a
            href="/attendance"
            className="block text-gray-500 hover:text-blue-600"
          >
            Attendance
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
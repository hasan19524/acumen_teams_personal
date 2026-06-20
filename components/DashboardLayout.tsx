// app/dashboard/layout.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // useAuth() will block rendering until workspace_id is guaranteed to be in localStorage
  const { authChecked } = useAuth();

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617] text-white">
        Loading Workspace...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617]">
      {/* Shared Sidebar */}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

import React from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6">
        <h2 className="font-bold text-xl mb-8">Acumen Teams</h2>
        <nav className="space-y-4">
          <a href="/dashboard" className="block text-gray-700 font-medium">Dashboard</a>
          <a href="/chat" className="block text-gray-500 hover:text-blue-600">Chat</a>
          <a href="/tasks" className="block text-gray-500 hover:text-blue-600">Tasks Board</a>
          <a href="/attendance" className="block text-gray-500 hover:text-blue-600">Attendance</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { workspaceService } from "@/features/workspace/workspaceService";
import {
  Building2,
  Calendar,
  Users,
  Shield,
  Hash,
  FileText,
  ArrowLeft,
  Mail,
} from "lucide-react";

import Avatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";

import { tk } from "@/lib/tokens";

export default function WorkspaceProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    workspaceService
      .getStats()
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  const canManage = user?.role === "owner" || user?.role === "admin";

  const statCards = [
    {
      label: "Total Members",
      value: stats?.total_members ?? 0,
      icon: Users,
      color: tk.brandLight,
    },
    {
      label: "Total Teams",
      value: stats?.total_teams ?? 0,
      icon: Building2,
      color: "var(--success)",
    },
    {
      label: "Total Leaders",
      value: stats?.total_leaders ?? 0,
      icon: Shield,
      color: "var(--warning)",
    },
    {
      label: "Pending Invites",
      value: stats?.open_invites ?? 0,
      icon: Mail,
      color: "var(--primary)",
    },
  ];

  const infoItems = [
    { label: "Workspace Name", value: user?.company_name, icon: Building2 },
    { label: "Workspace ID", value: `#${user?.workspace_id}`, icon: Hash },
    {
      label: "Workspace Owner",
      value: `@${user?.workspace_owner}`,
      icon: Shield,
    },
    {
      label: "Created Date",
      value: user?.workspace_created_at
        ? new Date(user.workspace_created_at).toLocaleDateString()
        : null,
      icon: Calendar,
    },
    {
      label: "Joined Date",
      value: user?.joined_at
        ? new Date(user.joined_at).toLocaleDateString()
        : null,
      icon: Calendar,
    },
  ];

  return (
    <main
      className="min-h-screen p-4 md:p-6 lg:p-8"
      style={{
        background: tk.bg,
        color: tk.textPrimary,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="w-full max-w-7xl mx-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard")}
          className="mb-4 -ml-2"
        >
          <ArrowLeft size={20} />
        </Button>

        {/* Identity Header (Compact) */}
        <div className="flex items-center gap-5 mb-8">
          <Avatar
            src={user?.workspace_logo}
            name={user?.company_name}
            size="lg"
            className="rounded-2xl border-2"
            style={{ borderColor: tk.border, width: "80px", height: "80px" }}
          />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {user?.company_name || "Workspace"}
            </h1>
            <p className="text-sm mt-1" style={{ color: tk.textMuted }}>
              {canManage
                ? "Workspace Owner & Administrator"
                : "Workspace Member"}
            </p>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="p-5 rounded-2xl flex flex-col items-center justify-center text-center"
              style={{
                background: tk.surface,
                border: `1px solid ${tk.border}`,
              }}
            >
              <stat.icon
                size={20}
                style={{ color: stat.color, marginBottom: 8 }}
              />
              <h2 className="text-2xl font-extrabold m-0">{stat.value}</h2>
              <p
                className="text-xs font-medium mt-1"
                style={{ color: tk.textMuted }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Description Card (Quote Style) */}
          {user?.workspace_description && (
            <div
              className="p-6 rounded-2xl"
              style={{
                background: tk.surface,
                border: `1px solid ${tk.border}`,
                borderLeft: `4px solid ${tk.brandLight}`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} style={{ color: tk.brandLight }} />
                <h2
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: tk.textMuted }}
                >
                  Description
                </h2>
              </div>
              <p
                className="text-sm"
                style={{
                  color: tk.textSecondary,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {user.workspace_description}
              </p>
            </div>
          )}

          {/* Expanded Information Card */}
          <div
            className="p-6 rounded-2xl"
            style={{ background: tk.surface, border: `1px solid ${tk.border}` }}
          >
            <h2 className="text-lg font-bold mb-6">Workspace Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {infoItems.map(
                (item) =>
                  item.value && (
                    <div key={item.label} className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: tk.bg }}
                      >
                        <item.icon size={18} style={{ color: tk.brandLight }} />
                      </div>
                      <div>
                        <p
                          className="text-xs uppercase tracking-wider"
                          style={{ color: tk.textMuted }}
                        >
                          {item.label}
                        </p>
                        <p className="text-sm font-semibold">{item.value}</p>
                      </div>
                    </div>
                  ),
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

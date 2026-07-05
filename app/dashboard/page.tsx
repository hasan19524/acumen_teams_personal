"use client";
import { useAuth } from "@/hooks/useAuth";
import EmployeeDashboard from "@/features/dashboard/roles/EmployeeDashboard";
import MemberDashboard from "@/features/dashboard/roles/MemberDashboard";
import TeamLeaderDashboard from "@/features/dashboard/roles/TeamLeaderDashboard";
import AdminOwnerDashboard from "@/features/dashboard/roles/AdminOwnerDashboard";

export default function DashboardPage() {
  const { isIndependent, user, authChecked } = useAuth();

  if (!authChecked) return null;

  if (isIndependent) {
    return <EmployeeDashboard />;
  }

  if (user?.role === "member") {
    return <MemberDashboard />;
  }

  if (user?.role === "leader") {
    return <TeamLeaderDashboard />;
  }

  // Owners and Admins
  return <AdminOwnerDashboard />;
}
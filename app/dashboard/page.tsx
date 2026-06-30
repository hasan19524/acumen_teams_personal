"use client";
import { useAuth } from "@/hooks/useAuth";
import CompanyDashboard from "@/components/dashboard/CompanyDashboard";
import EmployeeHome from "@/components/dashboard/EmployeeHome";

export default function DashboardPage() {
  const { isIndependent } = useAuth();

  if (isIndependent) {
    return <EmployeeHome />;
  }

  return <CompanyDashboard />;
}
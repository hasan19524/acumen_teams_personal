"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";
import {
  MessageSquare,
  CheckSquare,
  Bell,
  Activity,
  Users,
  Shield,
  BarChart3,
  Layers,
  FileText,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Real-Time Team Messaging",
    desc: "Direct conversations, workspace channels, and group discussions with rich text, file sharing, and instant delivery. Every message is searchable and permanently archived.",
    badge: "Communication",
    gradient: "from-blue-500 to-cyan-500",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    icon: CheckSquare,
    title: "Task & Work Management",
    desc: "Assign tasks with due dates and priorities, track progress across personal and team boards, and hold every member accountable with clear ownership and status visibility.",
    badge: "Productivity",
    gradient: "from-emerald-500 to-teal-500",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: Bell,
    title: "Announcements & Broadcasts",
    desc: "Publish pinned company-wide or department-level announcements that rise above daily noise. Keep your entire organization aligned with structured, centralized communication.",
    badge: "Organization",
    gradient: "from-amber-500 to-orange-500",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    icon: Activity,
    title: "Attendance & Presence Tracking",
    desc: "Monitor team availability, daily attendance records, and workforce presence without manual reporting. Get an at-a-glance view of who is active and when.",
    badge: "Workforce",
    gradient: "from-purple-500 to-pink-500",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    icon: Users,
    title: "Multi-Workspace Collaboration",
    desc: "Create and manage multiple workspaces for different departments or teams. Invite members, assign roles, and maintain structured collaboration across your entire organization.",
    badge: "Collaboration",
    gradient: "from-cyan-500 to-blue-500",
    badgeColor: "bg-cyan-100 text-cyan-700",
  },
  {
    icon: Shield,
    title: "Role-Based Access & Security",
    desc: "Control exactly who can see and do what. Workspace isolation, permission management, secure JWT authentication, and an enterprise security model built for organizations that take data seriously.",
    badge: "Security",
    gradient: "from-indigo-500 to-purple-500",
    badgeColor: "bg-indigo-100 text-indigo-700",
  },
  {
    icon: BarChart3,
    title: "Productivity Dashboards",
    desc: "Personal and team dashboards give every member a snapshot of their assigned work, pending tasks, and recent activity. Managers get the workspace overview they need without chasing updates.",
    badge: "Insights",
    gradient: "from-rose-500 to-pink-500",
    badgeColor: "bg-rose-100 text-rose-700",
  },
  {
    icon: FileText,
    title: "File & Asset Management",
    desc: "Upload and share files directly within conversations and workspaces. Centralized file accessibility means your team's documents, images, and resources are always where you need them.",
    badge: "Content",
    gradient: "from-teal-500 to-emerald-500",
    badgeColor: "bg-teal-100 text-teal-700",
  },
  {
    icon: Layers,
    title: "Unified Notification Center",
    desc: "Task updates, announcement alerts, workspace activity, and team changes — all surfaced in one place. Stay informed without being overwhelmed.",
    badge: "Awareness",
    gradient: "from-slate-500 to-slate-700",
    badgeColor: "bg-slate-100 text-slate-700",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="w-full py-20 lg:py-28 relative bg-gradient-to-b from-white via-slate-50/30 to-white"
    >
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <ScrollReveal>
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/80 rounded-full mb-6 border border-blue-200">
              <span className="text-sm font-semibold text-blue-700">
                Platform Capabilities
              </span>
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-5">
              Everything Your Team Needs
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              A complete collaboration platform built around how real teams
              actually work — communication, accountability, and visibility in
              one place.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 lg:gap-8">
          {features.map((feature, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <div className="group relative h-full">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-2xl transform group-hover:scale-105 transition-all duration-300`}
                />
                <div className="relative bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-8 h-full flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5">
                  <div
                    className={`inline-flex w-fit px-3 py-1 ${feature.badgeColor} text-xs font-bold rounded-full mb-5`}
                  >
                    {feature.badge}
                  </div>
                  <div
                    className={`w-13 h-13 w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-300`}
                  >
                    <feature.icon className="w-6 h-6 text-[var(--heading)]" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed flex-1">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

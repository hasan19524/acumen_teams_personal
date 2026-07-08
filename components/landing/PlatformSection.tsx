"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";

const pillars = [
  {
    title: "Communication",
    gradient: "from-blue-500 to-cyan-500",
    description: "Built for how teams actually talk",
    items: [
      "Real-Time Team Messaging",
      "Direct & Group Conversations",
      "Workspace-Based Channels",
      "Rich Text Message Composer",
      "File & Attachment Sharing",
      "Read Status & History",
      "Announcement Broadcasting",
      "Smart Notification Center",
    ],
  },
  {
    title: "Collaboration",
    gradient: "from-emerald-500 to-teal-500",
    description: "Structured teamwork at every level",
    items: [
      "Multi-Workspace Management",
      "Team-Based Organization",
      "Department Collaboration",
      "Workspace Invitations",
      "Member Directory",
      "Team Leadership Controls",
      "Collaborative File Sharing",
      "Cross-Team Coordination",
    ],
  },
  {
    title: "Work Management",
    gradient: "from-amber-500 to-orange-500",
    description: "Clear ownership, visible progress",
    items: [
      "Task Assignment & Tracking",
      "Personal & Team Task Boards",
      "Due Date Management",
      "Task Prioritization",
      "Progress Monitoring",
      "Archived Task History",
      "Task Ownership Controls",
      "Productivity Dashboard",
    ],
  },
  {
    title: "Administration",
    gradient: "from-purple-500 to-indigo-500",
    description: "Control without complexity",
    items: [
      "Workspace Creation",
      "Role-Based Permissions",
      "Member Lifecycle Management",
      "Admin Controls",
      "Organization Structure",
      "Secure Access Control",
      "Workspace Governance",
      "Attendance Records",
    ],
  },
  {
    title: "Security",
    gradient: "from-cyan-500 to-blue-600",
    description: "Enterprise-ready from the start",
    items: [
      "Secure JWT Authentication",
      "Role-Based Access Control",
      "Workspace Isolation",
      "Permission Management",
      "Protected Collaboration",
      "Controlled Data Access",
      "Member Verification",
      "Audit-Ready Architecture",
    ],
  },
];

export default function PlatformSection() {
  return (
    <section
      id="platform"
      className="w-full py-20 lg:py-28 relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-[var(--heading)] overflow-hidden"
    >
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6 border border-white/20">
              <span className="text-sm font-semibold text-[var(--heading)]/80">
                The Platform
              </span>
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold mb-5">
              Five Pillars. One Platform.
            </h2>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Acumen Teams is not a collection of tools. It is a single,
              coherent platform built around five core areas that enterprises
              depend on.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 lg:gap-6 items-stretch">
          {pillars.map((pillar, i) => (
            <ScrollReveal key={i} delay={i * 90}>
              <div className="group relative h-full">
                <div className="relative bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-white/25 p-7 h-full flex flex-col transition-all duration-300 group-hover:bg-white/10 group-hover:-translate-y-1.5">
                  <div
                    className={`w-8 h-1 rounded-full bg-gradient-to-r ${pillar.gradient} mb-5`}
                  />
                  <h3 className="text-lg font-bold mb-1.5">{pillar.title}</h3>
                  <p className="text-xs text-slate-400 mb-5 leading-relaxed min-h-[32px]">
                    {pillar.description}
                  </p>
                  <ul className="space-y-2.5 flex-1">
                    {pillar.items.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2.5 text-sm text-slate-300"
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${pillar.gradient} mt-1.5 flex-shrink-0`}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import ScrollReveal from "@/components/ui/ScrollReveal";
import {
  Code,
  BookOpen,
  Megaphone,
  Briefcase,
  Heart,
  Palette,
  BarChart3,
  Radio,
  Scale,
  Stethoscope,
  DollarSign,
  Sparkles,
  Workflow,
  Bot,
} from "lucide-react";

const futureWorkspaces = [
  {
    icon: Code,
    label: "Developer",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: BookOpen,
    label: "Education",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Megaphone,
    label: "Marketing",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: Briefcase,
    label: "Sales",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: Heart,
    label: "HR",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    icon: Palette,
    label: "Design",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: BarChart3,
    label: "Analytics",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  {
    icon: Radio,
    label: "Support",
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
  {
    icon: Scale,
    label: "Legal",
    color: "text-slate-300",
    bg: "bg-slate-500/10 border-slate-500/20",
  },
  {
    icon: Stethoscope,
    label: "Healthcare",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  {
    icon: DollarSign,
    label: "Finance",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
  {
    icon: Sparkles,
    label: "AI Tools",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
];

const futureCapabilities = [
  {
    icon: Workflow,
    title: "Workflow Automation",
    desc: "Trigger actions, automate recurring tasks, and remove manual steps across your team's daily processes.",
  },
  {
    icon: Bot,
    title: "AI Assistants",
    desc: "Domain-specific AI assistants that understand your team's context, history, and priorities.",
  },
  {
    icon: Sparkles,
    title: "Intelligent Productivity",
    desc: "Smart suggestions, auto-prioritization, and insights that surface what matters before you ask.",
  },
];

export default function RoadmapSection() {
  return (
    <section
      id="roadmap"
      className="w-full py-20 lg:py-28 relative bg-gradient-to-b from-slate-900 to-slate-950 text-[var(--heading)] overflow-hidden"
    >
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-blue-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-14 lg:mb-18">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/15 rounded-full mb-6 border border-amber-500/25">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-amber-300">
                Future Vision — Not Current Features
              </span>
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold mb-5">
              The Roadmap Ahead
            </h2>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Acumen Teams is built to grow with your organization. These are
              the workspaces and capabilities we are developing — purpose-built
              for every industry.
            </p>
          </div>
        </ScrollReveal>

        {/* Industry Workspaces */}
        <ScrollReveal>
          <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">
            Industry-Specific Workspaces
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-16 lg:mb-20">
          {futureWorkspaces.map((domain, i) => (
            <ScrollReveal key={i} delay={i * 50}>
              <div
                className={`group relative rounded-2xl border ${domain.bg} p-5 text-center flex flex-col items-center gap-3 hover:scale-105 transition-all duration-200 cursor-default`}
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <domain.icon className={`w-5 h-5 ${domain.color}`} />
                </div>
                <span className="text-sm font-semibold text-slate-200">
                  {domain.label}
                </span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  Coming Soon
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Future Capabilities */}
        <ScrollReveal>
          <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">
            Platform Intelligence
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-6">
          {futureCapabilities.map((cap, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-7 hover:border-white/20 hover:bg-white/8 transition-all">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center mb-5">
                  <cap.icon className="w-5 h-5 text-blue-300" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 rounded-full border border-amber-500/20 mb-4">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Planned
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2">{cap.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {cap.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

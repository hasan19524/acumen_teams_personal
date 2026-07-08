"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import ScrollReveal from "@/components/ui/ScrollReveal";
import {
  ArrowRight,
  ShieldCheck,
  Heart,
  Compass,
  Sparkles,
  Layers,
  ExternalLink,
  Rocket,
  Code,
  Palette,
  Users,
} from "lucide-react";

const values = [
  {
    icon: ShieldCheck,
    title: "Trust",
    desc: "Built over 20+ years of consistent, reliable service.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Heart,
    title: "Integrity",
    desc: "Honest and transparent in everything we do.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Users,
    title: "Customer First",
    desc: "Your success is the core metric we optimize for.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Compass,
    title: "Long-Term Vision",
    desc: "We build for the next decade, not the next quarter.",
    gradient: "from-purple-500 to-indigo-500",
  },
];

const principles = [
  {
    icon: ShieldCheck,
    title: "Trust",
    desc: "The foundation of our company. We protect your data and your business.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Sparkles,
    title: "Craftsmanship",
    desc: "We treat engineering as a craft, not just a deliverable. Every detail matters.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Layers,
    title: "Ownership",
    desc: "We take full responsibility for the tools we build and the experiences we deliver.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Compass,
    title: "Practicality",
    desc: "We build what is needed to solve real problems, not just what is trendy.",
    gradient: "from-purple-500 to-indigo-500",
  },
];

const trustPoints = [
  {
    icon: Compass,
    title: "22+ Years of Industry Experience",
    desc: "Rooted in real-world operations and corporate service since 2002.",
    gradient: "from-blue-600 to-cyan-600",
  },
  {
    icon: Users,
    title: "Trusted by Travelers & Businesses",
    desc: "Built relationships with thousands of satisfied customers over two decades.",
    gradient: "from-emerald-600 to-teal-600",
  },
  {
    icon: Heart,
    title: "Built on Long-Term Relationships",
    desc: "We focus on partnerships, not transactions. We grow when you grow.",
    gradient: "from-amber-600 to-orange-600",
  },
  {
    icon: Layers,
    title: "Expanding into Enterprise Technology",
    desc: "Applying our operational excellence to modern enterprise software.",
    gradient: "from-indigo-600 to-purple-600",
  },
];

const ecosystem = [
  {
    name: "Acumen Travels",
    tagline: "The Established Business",
    desc: "Where our legacy of trust and operational excellence began in 2002. A premier travel platform serving individuals and corporate clients alike.",
    status: "Live",
    statusColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    href: "https://acumentravels.com",
    gradient: "from-teal-600 to-emerald-600",
    external: true,
  },
  {
    name: "Acumen Teams",
    tagline: "Enterprise Software",
    desc: "A new platform created by Acumen. Bringing our operational standards to modern enterprise software.",
    status: "Live",
    statusColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    href: "/",
    gradient: "from-blue-600 to-cyan-600",
    current: true,
  },
  {
    name: "Acumen AI",
    tagline: "Future Initiative",
    desc: "A future initiative within the Acumen ecosystem. We continue to explore new ways to solve business problems.",
    status: "Coming Soon",
    statusColor: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    href: "#",
    gradient: "from-violet-600 to-purple-600",
  },
];
const teamMembers = [
  {
    name: "Areesh Jabbar",
    role: "Founder",
    bio: "Founded the vision behind Acumen Teams and continues to guide the overall direction of the platform, ensuring it reflects Acumen's long-standing commitment to solving real business challenges.",
    icon: Rocket,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Hasan Siddique",
    role: "Backend Lead Engineer",
    bio: "Responsible for backend architecture, APIs, authentication, database design, and real-time infrastructure, helping build a scalable and reliable foundation for Acumen Teams.",
    icon: Code,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    name: "Lubna Suhail Quadri",
    role: "UI/UX Engineer",
    bio: "Responsible for user interface design, user experience, interaction flows, visual consistency, usability improvements, and helping shape a clean and intuitive product experience.",
    icon: Palette,
    gradient: "from-amber-500 to-orange-500",
  },
];
export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white overflow-x-clip">
      <Navbar />

      {/* HERO */}
      <section className="relative w-full min-h-[480px] flex items-center overflow-hidden pt-24 pb-12 sm:pb-16 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-cyan-500 rounded-full blur-[100px]" />
        </div>

        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6 border border-white/15 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
              <span className="text-sm font-semibold text-[var(--heading)]/80">
                Trusted Since 2002
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--heading)] leading-tight mb-6">
              Two decades of trust.{" "}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Building the future of work.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl">
              Acumen has served travelers and businesses since 2002. Today, we
              are expanding our legacy of reliability into modern enterprise
              software.
            </p>
          </div>
        </div>
      </section>

      {/* OUR STORY & VALUES */}
      <section className="w-full py-12 sm:py-16 lg:py-24 bg-white">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <ScrollReveal>
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">
                  Our Story
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                  From travel operations to enterprise technology.
                </h2>
                <div className="space-y-4 text-slate-600 leading-relaxed">
                  <p>
                    Founded in 2002, Acumen Travels has spent over two decades
                    serving individuals, families, students, and corporate
                    clients. Years of handling real-world operational challenges
                    taught us the true meaning of reliability, organization, and
                    customer service.
                  </p>
                  <p>
                    This deep operational expertise inspired us to build better
                    software. Acumen Teams is our first step into enterprise
                    technology—a natural evolution of our commitment to solving
                    business problems.
                  </p>
                  <p>
                    We are bringing the same standard of trust that travelers
                    have relied on for 20 years to modern team collaboration.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="grid grid-cols-2 gap-4">
                {values.map((value, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow h-full"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${value.gradient} flex items-center justify-center mb-4`}
                    >
                      <value.icon className="w-5 h-5 text-[var(--heading)]" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      {value.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {value.desc}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="w-full py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <ScrollReveal delay={100}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl" />
                <div className="relative rounded-3xl border border-blue-200 p-10 lg:p-12">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6">
                    <Compass className="w-6 h-6 text-[var(--heading)]" />
                  </div>
                  <blockquote className="text-xl font-bold text-slate-900 leading-snug mb-4">
                    "Translating two decades of operational experience into
                    thoughtful technology."
                  </blockquote>
                  <p className="text-slate-500 text-sm">
                    The principle behind every product decision we make.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">
                  Mission
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                  Reduce friction. Increase clarity.
                </h2>
                <div className="space-y-4 text-slate-600 leading-relaxed">
                  <p>
                    Our mission is to help organizations simplify work. We don't
                    just build tools; we build infrastructure that organizations
                    can rely on, backed by the trust Acumen has earned since
                    2002.
                  </p>
                  <p>
                    We build for the people doing the work — and for the
                    organizations that depend on them.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* VISION (Editorial) */}
      <section className="w-full py-16 lg:py-24 bg-gradient-to-br from-slate-950 to-slate-900 text-[var(--heading)]">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="w-full max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10 text-center">
          <ScrollReveal>
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4">
              Vision
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 leading-tight">
              Why we build.
            </h2>
            <div className="space-y-4 text-slate-300 leading-relaxed text-lg">
              <p>
                Real operational experience matters. Technology should solve
                practical business problems, not create new ones.
              </p>
              <p>
                Acumen Teams represents our next chapter—bringing the
                reliability of Acumen Travels into modern enterprise software.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CORE PRINCIPLES */}
      <section className="w-full py-16 lg:py-24 bg-white">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">
                Core Principles
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-5">
                What guides every decision.
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                These principles shape how we design, build, and evolve the
                company.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {principles.map((p, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 h-full">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}
                  >
                    <p.icon className="w-6 h-6 text-[var(--heading)]" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">
                    {p.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* WHY TRUST US */}
      <section className="w-full py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">
                Why Trust Us
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-5">
                Built on a legacy of reliability.
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                We don't just build software; we build on a legacy of real-world
                operational success.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {trustPoints.map((point, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all p-6 h-full">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${point.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}
                  >
                    <point.icon className="w-6 h-6 text-[var(--heading)]" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {point.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {point.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ECOSYSTEM */}
      <section className="w-full py-16 lg:py-24 bg-gradient-to-b from-slate-950 to-slate-900 text-[var(--heading)]">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4">
                Acumen Ecosystem
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-5">
                Our Evolution
              </h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                From a trusted travel company to an enterprise technology
                studio.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-7">
            {ecosystem.map((product, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div
                  className={`relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 hover:bg-white/8 hover:border-white/20 transition-all h-full flex flex-col ${product.current ? "ring-1 ring-blue-500/30" : ""}`}
                >
                  {product.current && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-2xl" />
                  )}
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${product.gradient} flex items-center justify-center mb-5`}
                  >
                    <span className="text-[var(--heading)] font-bold text-xs">
                      {product.name.slice(7, 9).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <h3 className="text-lg font-bold">{product.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${product.statusColor}`}
                    >
                      {product.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">
                    {product.tagline}
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed flex-1 mb-6">
                    {product.desc}
                  </p>
                  {product.status !== "Coming Soon" &&
                    (product.external ? (
                      <a
                        href={product.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Visit Website <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <Link
                        href={product.href}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Open Platform <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ))}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* MEET THE TEAM */}
      <section className="w-full py-16 lg:py-24 bg-white">
        <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">
                The People
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-5">
                Meet the Team Building Acumen Teams
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                The team driving our transition into enterprise technology.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, i) => (
              <ScrollReveal key={i} delay={i * 120}>
                <div className="group bg-slate-50 rounded-3xl border border-slate-200 p-8 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full">
                  {/* Circular Placeholder */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full bg-slate-200 border-4 border-white shadow-md mb-6 flex items-center justify-center group-hover:scale-105 transition-transform relative">
                    <member.icon className="w-12 h-12 sm:w-14 sm:h-14 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-sm text-blue-600 font-semibold mb-4">
                    {member.role}
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-16 lg:py-20 bg-white">
        <div className="w-full max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <ScrollReveal>
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                Ready to experience the next chapter of Acumen?
              </h2>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
                Start with a free account. No credit card, no time limit.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-[var(--heading)] px-8 py-6 text-base rounded-full font-semibold transition-all hover:scale-105 group"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/support">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-slate-300 text-slate-700 hover:bg-slate-100 px-8 py-6 text-base rounded-full font-semibold"
                  >
                    Talk to Us
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}

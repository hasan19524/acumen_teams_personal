"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  MessageSquare,
  CheckSquare,
  Bell,
  Activity,
  Zap,
  Shield,
} from "lucide-react";

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative w-full min-h-[calc(100vh-68px)] flex items-center overflow-clip pt-12 lg:pt-16 pb-4 lg:pb-6"
    >
      {/* Slow floating animation keyframes */}
      <style>{`
        @keyframes slowFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
      `}</style>

      {/* Background blobs - clean, no logos */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[600px] lg:h-[600px] bg-blue-500/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 lg:bottom-0 left-0 w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] lg:w-[500px] lg:h-[500px] bg-emerald-500/25 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] lg:w-[800px] lg:h-[800px] bg-cyan-400/15 rounded-full blur-[120px]" />

      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* LEFT */}
          <div className="w-full max-w-2xl">
            <h1 className="text-5xl sm:text-6xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight mb-8 lg:mb-10">
              <span className="text-slate-900 block">Work Smarter.</span>
              <span className="block h-auto bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent mt-2">
                Lead Stronger.
              </span>
            </h1>

            <p className="text-lg sm:text-xl lg:text-xl text-slate-600 leading-relaxed max-w-xl font-medium mb-12 lg:mb-14">
              A structured enterprise workspace. Integrate communication, task
              management, attendance, and organizational hierarchy into one
              secure platform.
            </p>

            <div className="grid grid-cols-2 gap-8 mb-12 lg:mb-14">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                  Multi-Workspace
                </div>
                <p className="text-sm sm:text-base text-slate-600 mt-2">
                  Isolated Environments
                </p>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-600">
                  Role-Based Access
                </div>
                <p className="text-sm sm:text-base text-slate-600 mt-2">
                  Enterprise Security
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 lg:gap-5 mb-12 lg:mb-14">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-[var(--heading)] px-8 py-6 text-base lg:text-lg rounded-full transition-all hover:scale-105 hover:shadow-[0_20px_50px_rgba(6,182,212,0.3)] group font-semibold"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Link href="#features" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-2 border-slate-300 text-slate-700 hover:bg-slate-100 px-8 py-6 text-base lg:text-lg rounded-full font-semibold"
                >
                  Explore Features
                </Button>
              </Link>
            </div>

            <div className="pt-2 lg:pt-3 border-t border-slate-200">
              <p className="text-xs lg:text-sm text-slate-500 mb-4">
                Trusted by leading teams:
              </p>
              <div className="flex flex-wrap gap-4 text-xs lg:text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-500 flex-shrink-0" />{" "}
                  Enterprise Security
                </span>
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500 flex-shrink-0" />{" "}
                  Real-Time Sync
                </span>
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-500 flex-shrink-0" />{" "}
                  99.9% Uptime
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT - Visual */}
          <div className="hidden lg:flex relative h-[550px] items-center justify-center">
            <div className="relative w-full h-full max-w-md">
              {/* Main Card - Premium Hover Interaction */}
              <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 transition-all duration-500 hover:scale-[1.03] hover:shadow-blue-500/10 hover:rotate-0 rotate-[2deg]">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-slate-200">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      Acumen Teams
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-[var(--heading)]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">
                          Team Chat
                        </div>
                        <div className="text-xs text-slate-500">
                          Real-time messaging
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <CheckSquare className="w-5 h-5 text-[var(--heading)]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">
                          Tasks
                        </div>
                        <div className="text-xs text-slate-500">
                          Track & collaborate
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                        <Activity className="w-5 h-5 text-[var(--heading)]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">
                          Attendance
                        </div>
                        <div className="text-xs text-slate-500">
                          Auto-tracked
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-[var(--heading)]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">
                          Announcements
                        </div>
                        <div className="text-xs text-slate-500">
                          Broadcast updates
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intentionally Placed Floating Elements */}
              <div
                className="absolute -top-4 right-12 w-16 h-16 bg-blue-500/20 rounded-2xl border border-blue-200 flex items-center justify-center shadow-lg backdrop-blur-sm"
                style={{ animation: "slowFloat 6s ease-in-out infinite" }}
              >
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <div
                className="absolute top-1/4 -left-8 w-16 h-16 bg-emerald-500/20 rounded-2xl border border-emerald-200 flex items-center justify-center shadow-lg backdrop-blur-sm"
                style={{ animation: "slowFloat 6s ease-in-out infinite 1.5s" }}
              >
                <CheckSquare className="w-8 h-8 text-emerald-600" />
              </div>
              <div
                className="absolute bottom-12 -right-4 w-16 h-16 bg-amber-500/20 rounded-2xl border border-amber-200 flex items-center justify-center shadow-lg backdrop-blur-sm"
                style={{ animation: "slowFloat 6s ease-in-out infinite 3s" }}
              >
                <Activity className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

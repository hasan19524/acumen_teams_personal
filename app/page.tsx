"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Navbar from "@/components/ui/Navbar";  // ← ADDED THIS LINE
import { 
  ArrowRight, MessageSquare, CheckSquare, Bell, Users, 
  Shield, BarChart3, Globe, Zap 
} from "lucide-react";

export default function LandingPage() {
  const features = [
    { icon: MessageSquare, title: "Team Chat", desc: "Real-time messaging with channels and threads.", color: "blue" },
    { icon: CheckSquare, title: "Task Management", desc: "Create, assign, and track tasks with deadlines.", color: "green" },
    { icon: Bell, title: "Announcements", desc: "Broadcast important updates to your team.", color: "yellow" },
    { icon: Shield, title: "Attendance", desc: "Track attendance and work hours effortlessly.", color: "purple" },
    { icon: BarChart3, title: "Analytics", desc: "Insights into team performance metrics.", color: "cyan" },
    { icon: Globe, title: "Integrations", desc: "Connect with GitHub, VS Code, and 50+ tools.", color: "indigo" },
  ];

  const plans = [
    { name: "Free", price: "₹0", features: ["Up to 10 users", "Basic chat", "5GB storage"] },
    { name: "Starter", price: "₹49", features: ["Up to 50 users", "Advanced chat", "50GB storage", "Priority support"] },
    { name: "Growth", price: "₹99", features: ["Unlimited users", "All features", "500GB storage", "24/7 support", "Analytics"] },
    { name: "Enterprise", price: "₹149", features: ["Everything in Growth", "Custom integrations", "Unlimited storage", "Dedicated manager", "SSO"] },
  ];

  return (
    <main className="min-h-screen bg-white">
      <Navbar />  {/* ← ADDED THIS LINE */}
      
      {/* HERO - No ScrollReveal */}
      <section id="home" className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
        <div className="absolute top-32 right-32 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-32 left-20 w-[400px] h-[400px] bg-purple-400/15 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-[150px]" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex items-center justify-between gap-12">
            <div className="max-w-2xl">
              <h1 className="text-7xl font-bold leading-[1.1] tracking-tight">
                <span className="text-slate-900">Work Smarter.</span>
                <br />
                <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 bg-clip-text text-transparent">
                  Lead Stronger.
                </span>
              </h1>
              
              <p className="mt-8 text-xl text-slate-500 leading-relaxed max-w-lg">
                Chat, tasks, attendance, announcements and productivity tools. All in one place.
              </p>

              <div className="mt-10 flex items-center gap-4">
                <Link href="/signup">
                  <Button 
                    size="lg" 
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 text-lg rounded-full transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(37,99,235,0.4)] group"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                
                <Link href="#features">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-slate-300 text-slate-700 hover:bg-slate-100 px-8 py-6 text-lg rounded-full backdrop-blur-sm"
                  >
                    Watch Demo
                  </Button>
                </Link>
              </div>

              <div className="mt-12 flex items-center gap-6 text-slate-500 text-sm">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" /> 10K+ Teams
                </span>
                <span className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" /> Free Forever
                </span>
              </div>
            </div>

            <div className="hidden lg:block relative w-[550px] h-[500px]">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100/80 to-white/60 rounded-3xl backdrop-blur-md border border-slate-200 p-6 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500 shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      <div className="h-2 bg-slate-200 rounded w-32" />
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                      <CheckSquare className="w-5 h-5 text-green-500" />
                      <div className="h-2 bg-slate-200 rounded w-40" />
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                      <Bell className="w-5 h-5 text-yellow-500" />
                      <div className="h-2 bg-slate-200 rounded w-28" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 right-[40px] w-14 h-14 bg-blue-500/20 rounded-2xl backdrop-blur-md border border-blue-200 animate-float flex items-center justify-center shadow-lg z-20">
                <MessageSquare className="w-7 h-7 text-blue-600" />
              </div>

              <div className="absolute top-[35%] -left-[30px] w-14 h-14 bg-[#181717] rounded-2xl shadow-[0_8px_20px_rgba(24,23,23,0.2)] border border-[#333] flex items-center justify-center z-20 animate-float-delayed">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>

              <div className="absolute top-[28%] -right-[25px] w-14 h-14 bg-[#007ACC] rounded-2xl shadow-[0_8px_20px_rgba(0,122,204,0.25)] border border-[rgba(0,122,204,0.3)] flex items-center justify-center z-20 animate-float-slow">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/>
                </svg>
              </div>

              <div className="absolute bottom-[15%] -right-[20px] w-14 h-14 bg-green-500/20 rounded-2xl backdrop-blur-md border border-green-200 animate-float flex items-center justify-center shadow-lg z-20">
                <CheckSquare className="w-7 h-7 text-green-600" />
              </div>

              <div className="absolute -bottom-8 -left-10 w-[60px] h-[60px] bg-gradient-to-br from-[#2563EB] to-[#7C3AED] rounded-2xl shadow-[0_8px_20px_rgba(37,99,235,0.3)] flex items-center justify-center z-20 text-white animate-float-delayed">
                <Users className="w-8 h-8" />
              </div>

              <div className="absolute bottom-10 right-10 w-4 h-4 bg-blue-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-slate-300 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 relative bg-slate-50">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-slate-900 mb-4">Features</h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                Everything your team needs to collaborate effectively.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <ScrollReveal key={i} delay={i * 150}>
                <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1 group h-full">
                  <div className={`w-14 h-14 rounded-xl bg-${feature.color}-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-7 h-7 text-${feature.color}-600`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 relative bg-white">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/50 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-slate-900 mb-4">Pricing</h2>
              <p className="text-slate-500 text-lg">Choose the perfect plan for your team</p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-4 gap-6">
            {plans.map((plan, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div className={`
                  relative p-8 rounded-3xl backdrop-blur-sm border transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] group cursor-pointer h-full
                  ${i === 2 
                    ? 'bg-gradient-to-b from-blue-500/10 to-purple-500/10 border-blue-300 shadow-[0_0_40px_rgba(37,99,235,0.1)] scale-105' 
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]'
                  }
                `}>
                  {i === 2 && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-sm rounded-full font-medium shadow-lg">
                      Most Popular
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-500">/month</span>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-slate-600 text-sm">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  
                  <Link href="/signup" className="w-full">
                    <Button 
                      className={`
                        w-full rounded-xl py-3 font-semibold transition-all hover:scale-[1.02]
                        ${i === 2 
                          ? 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                          : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                        }
                      `}
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SUPPORT */}
      <section id="support" className="py-24 relative bg-slate-50">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-slate-900 mb-4">Support</h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                We're here to help you every step of the way.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: MessageSquare, title: "Live Chat", desc: "Get instant help from our team.", color: "blue" },
              { icon: Zap, title: "Documentation", desc: "Comprehensive guides and API docs.", color: "green" },
              { icon: Users, title: "Community", desc: "Join our forum for discussions.", color: "purple" },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 200}>
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center hover:shadow-xl hover:scale-[1.02] transition-all h-full">
                  <div className={`w-14 h-14 rounded-full bg-${item.color}-100 flex items-center justify-center mx-auto mb-6`}>
                    <item.icon className={`w-7 h-7 text-${item.color}-600`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-500">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-slate-900 text-white">
        <ScrollReveal>
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">Acumen Teams</h3>
                <p className="text-slate-400">Work Smarter. Lead Stronger.</p>
              </div>
              <div className="flex gap-8">
                <Link href="#" className="text-slate-400 hover:text-white transition-colors">Privacy</Link>
                <Link href="#" className="text-slate-400 hover:text-white transition-colors">Terms</Link>
                <Link href="#" className="text-slate-400 hover:text-white transition-colors">Contact</Link>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-500">
              © 2026 Acumen Teams. All rights reserved.
            </div>
          </div>
        </ScrollReveal>
      </footer>
    </main>
  );
}
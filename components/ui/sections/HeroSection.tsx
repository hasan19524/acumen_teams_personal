"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function HeroSection() {
  const graphicRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!graphicRef.current) return;
      const mouseX = (e.clientX / window.innerWidth - 0.5) * 20;
      const mouseY = (e.clientY / window.innerHeight - 0.5) * 20;
      
      const floats = graphicRef.current.querySelectorAll(".float-element");
      floats.forEach((el, i) => {
        const factor = (i + 1) * 0.5;
        (el as HTMLElement).style.transform = `translate(${mouseX * factor}px, ${mouseY * factor}px)`;
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="relative z-10 min-h-screen flex items-center pt-[120px] pb-20 px-6 lg:px-10 max-w-[1400px] mx-auto">
      {/* Left Content */}
      <div className="flex-1 max-w-[600px] lg:pr-[60px]">
        {/* Badge */}
        <div 
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgba(37,99,235,0.08)] border border-[rgba(37,99,235,0.15)] text-[12px] font-semibold text-[#2563EB] mb-7"
          style={{ animation: "fadeInUp 0.6s ease forwards" }}
        >
          <i className="fas fa-sparkles text-[10px]"></i>
          New: AI-Powered Workflows
        </div>

        {/* Title */}
        <h1 
          className="text-5xl lg:text-[64px] font-extrabold leading-[1.1] tracking-tight mb-6 text-slate-900"
          style={{ animation: "fadeInUp 0.6s ease 0.1s forwards", opacity: 0 }}
        >
          Work Smarter.
          <br />
          <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent relative">
            Lead Stronger.
            <span className="absolute bottom-[-4px] left-0 w-full h-2 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] opacity-15 rounded blur-sm" />
          </span>
        </h1>

        {/* Subtitle */}
        <p 
          className="text-lg leading-[1.7] text-[#475569] mb-10 max-w-[480px]"
          style={{ animation: "fadeInUp 0.6s ease 0.2s forwards", opacity: 0 }}
        >
          Chat, tasks, attendance, announcements and productivity tools. 
          Seamlessly integrated with GitHub and VS Code for the modern developer team.
        </p>

        {/* Buttons */}
        <div 
          className="flex items-center gap-4 mb-12"
          style={{ animation: "fadeInUp 0.6s ease 0.3s forwards", opacity: 0 }}
        >
          <Link 
            href="/signup"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#7C3AED] shadow-[0_4px_14px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_25px_rgba(37,99,235,0.35),0_0_0_4px_rgba(37,99,235,0.1)] hover:-translate-y-0.5 transition-all"
          >
            Start Free Trial <i className="fas fa-arrow-right text-sm"></i>
          </Link>
          <Link 
            href="#demo"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold text-[#0F172A] border-[1.5px] border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-white hover:border-[#94A3B8] hover:shadow-[0_4px_6px_-1px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 transition-all"
          >
            <i className="fas fa-play text-xs"></i> Watch Demo
          </Link>
        </div>

        {/* Stats */}
        <div 
          className="flex items-center gap-6"
          style={{ animation: "fadeInUp 0.6s ease 0.4s forwards", opacity: 0 }}
        >
          <div className="flex items-center gap-2 text-[13px] text-[#94A3B8] font-medium">
            <i className="fas fa-users text-[#2563EB] text-sm"></i>
            <span>10K+ Teams</span>
          </div>
          <div className="w-px h-4 bg-[#E2E8F0]" />
          <div className="flex items-center gap-2 text-[13px] text-[#94A3B8] font-medium">
            <i className="fas fa-check-circle text-[#2563EB] text-sm"></i>
            <span>Free Forever</span>
          </div>
          <div className="w-px h-4 bg-[#E2E8F0]" />
          <div className="flex items-center gap-2 text-[13px] text-[#94A3B8] font-medium">
            <i className="fas fa-code-branch text-[#2563EB] text-sm"></i>
            <span>GitHub Sync</span>
          </div>
        </div>
      </div>

      {/* Right Graphic */}
      <div 
        ref={graphicRef}
        className="flex-1 relative h-[600px] hidden lg:flex items-center justify-center"
        style={{ animation: "fadeInUp 0.8s ease 0.3s forwards", opacity: 0 }}
      >
        <div className="relative w-[520px] h-[420px]">
          
          {/* Connection Lines SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-[5]" viewBox="0 0 520 420" preserveAspectRatio="none">
            <path 
              className="stroke-[#E2E8F0] stroke-[1.5] fill-none opacity-60"
              strokeDasharray="6 4"
              style={{ animation: "dashFlow 20s linear infinite" }}
              d="M 100 140 Q 160 180 190 120" 
            />
            <path 
              className="stroke-[#E2E8F0] stroke-[1.5] fill-none opacity-60"
              strokeDasharray="6 4"
              style={{ animation: "dashFlow 20s linear infinite" }}
              d="M 420 300 Q 360 260 330 200" 
            />
          </svg>

          {/* Main Dashboard Card */}
          <div 
            className="absolute w-[380px] h-[280px] bg-white rounded-3xl shadow-[0_20px_25px_-5px_rgba(15,23,42,0.08),0_0_40px_rgba(37,99,235,0.12)] border border-[#E2E8F0] overflow-hidden top-5 left-1/2 -translate-x-1/2 z-10"
            style={{ animation: "cardFloat 6s ease-in-out infinite" }}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#F1F5F9]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
              <span className="ml-2 text-xs text-[#94A3B8] font-medium">Dashboard</span>
            </div>
            <div className="p-4 space-y-2">
              {[
                { icon: "fa-comment", color: "bg-[rgba(37,99,235,0.1)] text-[#2563EB]", checked: false },
                { icon: "fa-check-square", color: "bg-[rgba(34,197,94,0.1)] text-[#16A34A]", checked: true },
                { icon: "fa-bell", color: "bg-[rgba(245,158,11,0.1)] text-[#D97706]", checked: true },
                { icon: "fa-calendar", color: "bg-[rgba(124,58,237,0.1)] text-[#7C3AED]", checked: false },
              ].map((task, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-3 px-3 py-2.5 bg-[#F0F4F8] rounded-xl border border-[#F1F5F9] hover:translate-x-1 hover:shadow-sm transition-all cursor-default"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${task.color}`}>
                    <i className={`fas ${task.icon}`}></i>
                  </div>
                  <div className="flex-1 h-2 bg-[#E2E8F0] rounded relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-[70%] h-full bg-gradient-to-r from-[#E2E8F0] to-[#CBD5E1] rounded" />
                  </div>
                  <div className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center text-white text-[10px] transition-all ${
                    task.checked 
                      ? "bg-[#16A34A] border-[#16A34A]" 
                      : "border-[#E2E8F0]"
                  }`}>
                    {task.checked && <i className="fas fa-check"></i>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GitHub Card */}
          <div 
            className="absolute w-[200px] bg-white rounded-xl shadow-[0_10px_15px_-3px_rgba(15,23,42,0.06)] border border-[#E2E8F0] p-4 top-20 -left-5 z-20"
            style={{ animation: "cardFloat 5s ease-in-out infinite", animationDelay: "-2s" }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#181717] flex items-center justify-center text-white text-lg">
                <i className="fab fa-github"></i>
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-[#0F172A]">acumen-teams</h4>
                <span className="text-[11px] text-[#94A3B8]">Synced just now</span>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center gap-1 text-xs text-[#475569] font-semibold">
                <i className="fas fa-star text-[#F59E0B] text-xs"></i> 2.4k
              </span>
              <span className="flex items-center gap-1 text-xs text-[#475569] font-semibold">
                <i className="fas fa-code-branch text-[#94A3B8] text-xs"></i> 186
              </span>
              <span className="flex items-center gap-1 text-xs text-[#475569] font-semibold">
                <i className="fas fa-circle text-[#2563EB] text-[8px]"></i> TypeScript
              </span>
            </div>
          </div>

          {/* VS Code Card */}
          <div 
            className="absolute w-[220px] bg-white rounded-xl shadow-[0_10px_15px_-3px_rgba(15,23,42,0.06)] border border-[#E2E8F0] p-4 bottom-16 -right-2 z-20"
            style={{ animation: "cardFloat 7s ease-in-out infinite", animationDelay: "-4s" }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#007ACC] flex items-center justify-center text-white text-lg relative">
                <i className="fas fa-code"></i>
                <div className="absolute inset-[-2px] rounded-lg border-2 border-[rgba(0,122,204,0.2)]" />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-[#0F172A]">VS Code</h4>
                <span className="text-[11px] text-[#94A3B8]">Extension Active</span>
              </div>
            </div>
            <div className="bg-[#1E1E2E] rounded-lg p-3 font-mono text-[11px] leading-relaxed">
              <div className="flex gap-2">
                <span className="text-[#6B7280] min-w-[16px] text-right">1</span>
                <span>
                  <span className="code-keyword">import</span> {"{ "}
                  <span className="code-variable">Team</span>
                  {" } "}
                  <span className="code-keyword">from</span> <span className="code-string">&apos;@acumen/core&apos;</span>;
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#6B7280] min-w-[16px] text-right">2</span>
                <span>
                  <span className="code-keyword">const</span> <span className="code-variable">productivity</span> = <span className="code-keyword">new</span> <span className="code-function">Team</span>({"{ "}
                  <span className="code-variable">sync</span>: <span className="code-keyword">true</span>
                  {" }"});
                </span>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div 
            className="float-element absolute w-12 h-12 bg-white rounded-xl shadow-[0_4px_6px_-1px_rgba(15,23,42,0.05)] border border-[#E2E8F0] flex items-center justify-center z-[15] text-[#2563EB] text-xl top-0 right-[60px]"
            style={{ animation: "gentleFloat 4s ease-in-out infinite", animationDelay: "-1s" }}
          >
            <i className="fas fa-comment-dots"></i>
          </div>
          <div 
            className="float-element absolute w-11 h-11 bg-[rgba(34,197,94,0.08)] rounded-xl shadow-[0_4px_6px_-1px_rgba(15,23,42,0.05)] border border-[rgba(34,197,94,0.15)] flex items-center justify-center z-[15] text-[#16A34A] text-lg bottom-[100px] right-10"
            style={{ animation: "gentleFloat 4s ease-in-out infinite", animationDelay: "-3s" }}
          >
            <i className="fas fa-check"></i>
          </div>
          <div 
            className="float-element absolute w-[52px] h-[52px] rounded-xl flex items-center justify-center z-[15] text-white text-xl bottom-5 left-20 shadow-[0_8px_20px_rgba(37,99,235,0.3)] bg-gradient-to-br from-[#2563EB] to-[#7C3AED] border-none"
            style={{ animation: "gentleFloat 4s ease-in-out infinite", animationDelay: "-2s" }}
          >
            <i className="fas fa-users"></i>
          </div>
          <div 
            className="float-element absolute w-9 h-9 bg-[rgba(124,58,237,0.08)] rounded-xl shadow-[0_4px_6px_-1px_rgba(15,23,42,0.05)] border border-[rgba(124,58,237,0.15)] flex items-center justify-center z-[15] text-[#7C3AED] text-sm top-[140px] left-5"
            style={{ animation: "gentleFloat 4s ease-in-out infinite", animationDelay: "-4s" }}
          >
            <i className="fas fa-bell"></i>
          </div>

          {/* GitHub Floating Icon - Right Side */}
          <div 
            className="float-element absolute w-[52px] h-[52px] bg-[#181717] rounded-2xl shadow-[0_8px_20px_rgba(24,23,23,0.25)] border border-[#333] flex items-center justify-center z-[15] text-white text-xl top-[10px] right-[-30px]"
            style={{ animation: "gentleFloat 5s ease-in-out infinite", animationDelay: "-1.5s" }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </div>

          {/* VS Code Floating Icon - Right Side */}
          <div 
            className="float-element absolute w-[52px] h-[52px] bg-[#007ACC] rounded-2xl shadow-[0_8px_20px_rgba(0,122,204,0.3)] border border-[rgba(0,122,204,0.3)] flex items-center justify-center z-[15] text-white text-xl top-[180px] right-[-45px]"
            style={{ animation: "gentleFloat 6s ease-in-out infinite", animationDelay: "-3.5s" }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
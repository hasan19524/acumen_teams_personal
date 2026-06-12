"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePublicRoute } from "@/hooks/usePublicRoute";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Users,
  BarChart3,
  Infinity,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Zap,
  MessageSquare,
  Star,
  Bell,
  Rocket,
  Lightbulb,
  Globe,
  Layers,
  Target,
  User,
  Building2,
} from "lucide-react";

/* ─── Floating icon helper ─── */
const Float = ({
  icon: Icon,
  className,
  delay = 0,
  size = 20,
}: {
  icon: React.ElementType;
  className: string;
  delay?: number;
  size?: number;
}) => (
  <div
    className={`absolute animate-float ${className}`}
    style={{ animationDelay: `${delay}s` }}
  >
    <Icon size={size} />
  </div>
);

/* ─── Feature item for left side ─── */
const Feature = ({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) => (
  <div className="flex items-center gap-3 text-slate-300/90 text-sm">
    <div className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 text-white/80 border border-white/10">
      <Icon size={16} />
    </div>
    <span>{text}</span>
  </div>
);

/* ─── Social signup button with colored logo ─── */
const SocialBtn = ({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) => (
  <button
    type="button"
    className="flex-1 py-2.5 px-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center gap-2 text-white font-medium text-sm transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:-translate-y-0.5"
  >
    {children}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export default function SignupPage() {
  usePublicRoute();
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.fullName || !formData.username || !formData.email || !formData.password) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/accounts/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("username", data.username);
        if (data.user_id) localStorage.setItem("user_id", String(data.user_id));
        router.push("/dashboard");
      } else {
        setError(data.detail || Object.values(data).flat().join(" ") || "Signup failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden font-sans"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #312e81 60%, #1e1b4b 100%)" }}>

      {/* ═══ Animated background elements ═══ */}

      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "4s" }} />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating icons scattered across both sides */}
      <Float icon={MessageSquare} className="top-[8%] left-[8%] text-white/20" delay={0} size={24} />
      <Float icon={Star} className="top-[15%] left-[45%] text-white/15" delay={1.5} size={18} />
      <Float icon={Bell} className="top-[25%] left-[15%] text-white/20" delay={2} size={22} />
      <Float icon={Rocket} className="top-[10%] right-[8%] text-white/15" delay={1} size={28} />
      <Float icon={Lightbulb} className="top-[30%] right-[12%] text-white/20" delay={3} size={20} />
      <Float icon={Globe} className="bottom-[20%] left-[10%] text-white/15" delay={2.5} size={24} />
      <Float icon={Layers} className="bottom-[15%] right-[15%] text-white/20" delay={1.5} size={22} />
      <Float icon={Target} className="bottom-[30%] left-[40%] text-white/10" delay={3.5} size={26} />
      <Float icon={Sparkles} className="top-[45%] left-[5%] text-white/15" delay={0.5} size={20} />
      <Float icon={CheckCircle2} className="top-[50%] right-[5%] text-white/20" delay={2.5} size={18} />

      {/* ════════════════════════════════════════
          LEFT SIDE — Open, no box
      ════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-start p-16 relative z-10">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Zap size={24} />
          </div>
          <span className="text-2xl font-bold text-white">Acumen Teams</span>
        </div>

        {/* Headline */}
        <h2 className="text-5xl font-bold text-white mb-4 leading-tight">
          Build Faster.<br />
          <span className="text-blue-300">Grow Smarter.</span>
        </h2>
        <p className="text-slate-300 text-lg leading-relaxed mb-10 max-w-md">
          Launch your workspace in minutes with chat, tasks, attendance, 
          analytics and team collaboration tools.
        </p>

        {/* Stats row */}
        <div className="flex gap-8 mb-10">
          <div>
            <div className="text-3xl font-bold text-white">10K+</div>
            <div className="text-sm text-slate-400">Teams</div>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <div className="text-3xl font-bold text-white">99.9%</div>
            <div className="text-sm text-slate-400">Uptime</div>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <div className="text-3xl font-bold text-white">Free</div>
            <div className="text-sm text-slate-400">Forever</div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-10">
          <Feature icon={Shield} text="Enterprise-grade security & compliance" />
          <Feature icon={Users} text="Real-time collaboration & video calls" />
          <Feature icon={BarChart3} text="Advanced analytics & team insights" />
          <Feature icon={Infinity} text="Unlimited projects, storage & integrations" />
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-8 text-sm text-slate-400">
          <span className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 size={12} className="text-green-400" />
            </div>
            SOC 2 Compliant
          </span>
          <span className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Shield size={12} className="text-blue-400" />
            </div>
            End-to-end encrypted
          </span>
          <span className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Sparkles size={12} className="text-amber-400" />
            </div>
            GDPR Ready
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════
          RIGHT SIDE — Glass card
      ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 relative z-10">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white">
            <Zap size={18} />
          </div>
          <span className="text-xl font-bold text-white">Acumen Teams</span>
        </div>

        {/* Glass signup card */}
        <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 lg:p-10 shadow-2xl">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Start Free Today
            </h1>
            <p className="text-slate-300 text-base">
              No credit card required. Create your workspace instantly.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 bg-red-500/20 border border-red-400/30 rounded-xl flex items-center gap-3 text-red-200 text-sm backdrop-blur-sm">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Social signup — ONLY GOOGLE & GITHUB */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <SocialBtn label="Google">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </SocialBtn>
            <SocialBtn label="GitHub">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </SocialBtn>
          </div>

          {/* Divider */}
          <div className="flex items-center mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="px-4 text-slate-400 text-xs font-medium uppercase tracking-wider">or signup</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block mb-1.5 text-slate-200 font-medium text-sm">
                Full Name
              </label>
              <div className="relative group">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className="w-full py-3 pl-11 pr-4 bg-white/10 border border-white/20 rounded-xl text-base text-white placeholder-slate-400 transition-all duration-300 outline-none focus:bg-white/15 focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 hover:bg-white/15"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-300 transition-colors" size={18} />
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block mb-1.5 text-slate-200 font-medium text-sm">
                Company Name <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <div className="relative group">
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  className="w-full py-3 pl-11 pr-4 bg-white/10 border border-white/20 rounded-xl text-base text-white placeholder-slate-400 transition-all duration-300 outline-none focus:bg-white/15 focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 hover:bg-white/15"
                  placeholder="Enter company name"
                  value={formData.companyName}
                  onChange={handleChange}
                />
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-300 transition-colors" size={18} />
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block mb-1.5 text-slate-200 font-medium text-sm">
                Username
              </label>
              <div className="relative group">
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="w-full py-3 pl-11 pr-4 bg-white/10 border border-white/20 rounded-xl text-base text-white placeholder-slate-400 transition-all duration-300 outline-none focus:bg-white/15 focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 hover:bg-white/15"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-300 transition-colors" size={18} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block mb-1.5 text-slate-200 font-medium text-sm">
                Email Address
              </label>
              <div className="relative group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="w-full py-3 pl-11 pr-4 bg-white/10 border border-white/20 rounded-xl text-base text-white placeholder-slate-400 transition-all duration-300 outline-none focus:bg-white/15 focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 hover:bg-white/15"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-300 transition-colors" size={18} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block mb-1.5 text-slate-200 font-medium text-sm">
                Create Password
              </label>
              <div className="relative group">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full py-3 pl-11 pr-12 bg-white/10 border border-white/20 rounded-xl text-base text-white placeholder-slate-400 transition-all duration-300 outline-none focus:bg-white/15 focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 hover:bg-white/15"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-300 transition-colors" size={18} />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 hover:from-blue-400 hover:to-indigo-400 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group mt-2"
              disabled={loading}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Free Account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-slate-300 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-300 font-semibold hover:text-blue-200 hover:underline transition-colors">
              Login
            </Link>
          </p>
        </div>
      </div>

      {/* ═══ Global animations ═══ */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
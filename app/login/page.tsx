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
  ArrowLeft,
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

/* ─── Social login button ─── */
const SocialBtn = ({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) => (
  <button
    type="button"
    className="w-11 h-11 rounded-xl bg-white/80 backdrop-blur-sm border border-white/40 flex items-center justify-center transition-all duration-300 hover:bg-white hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 hover:scale-105"
    title={`Continue with ${label}`}
  >
    {children}
  </button>
);

export default function LoginPage() {
  usePublicRoute();
  const router = useRouter();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!login || !password) {
      setError("Please enter your email/username and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/accounts/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      // Safely attempt to parse JSON body (throttled responses might not have JSON)
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Body is empty or not JSON
      }

      if (res.ok) {
        localStorage.setItem("token", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("username", data.username || login);
        if (data.user_id) localStorage.setItem("user_id", String(data.user_id));
        if (data.workspace_id) localStorage.setItem("workspace_id", String(data.workspace_id));
        router.push("/dashboard");
      } else {
        // Handle specific HTTP status codes with exact messages
        if (res.status === 401) {
          setError("Invalid email or password.");
        } else if (res.status === 403) {
          setError("Your account has been disabled.");
        } else if (res.status === 429) {
          setError("Too many login attempts. Please try again later.");
        } else if (res.status >= 500) {
          setError("Something went wrong. Please try again.");
        } else {
          setError(data?.detail || data?.error || "Login failed.");
        }
      }
    } catch {
      // This catch block is ONLY hit on actual network failures (server unreachable, offline)
      setError("Network connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden font-sans"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #312e81 60%, #1e1b4b 100%)" }}>

      {/* Back to Home Button */}
      <Link href="/" className="absolute top-8 left-8 z-20 flex items-center gap-2 text-slate-300 hover:text-white transition-colors group">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

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

        {/* Logo — open, no box */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Zap size={24} />
          </div>
          <span className="text-2xl font-bold text-white">Acumen Teams</span>
        </div>

        {/* Headline — open, no box */}
        <h2 className="text-5xl font-bold text-white mb-4 leading-tight">
          Work smarter,<br />
          <span className="text-blue-300">collaborate better</span>
        </h2>
        <p className="text-slate-300 text-lg leading-relaxed mb-10 max-w-md">
          The all-in-one workspace for modern teams. Chat, share files, 
          manage projects, and stay in sync — all in one place.
        </p>

        {/* Stats row — open */}
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
            <div className="text-3xl font-bold text-white">256-bit</div>
            <div className="text-sm text-slate-400">Encryption</div>
          </div>
        </div>

        {/* Features — open, no box */}
        <div className="space-y-3 mb-10">
          <Feature icon={Shield} text="Enterprise-grade security & compliance" />
          <Feature icon={Users} text="Real-time collaboration & video calls" />
          <Feature icon={BarChart3} text="Advanced analytics & team insights" />
          <Feature icon={Infinity} text="Unlimited projects, storage & integrations" />
        </div>

        {/* Trust badges — open */}
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
          RIGHT SIDE — Glass box stays
      ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 relative z-10">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white">
            <Zap size={18} />
          </div>
          <span className="text-xl font-bold text-white">Acumen Teams</span>
        </div>

        {/* Glass login card — BOX STAYS */}
        <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 lg:p-10 shadow-2xl">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back
            </h1>
            <p className="text-slate-300 text-base">
              Sign in to access your workspace
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 bg-red-500/20 border border-red-400/30 rounded-xl flex items-center gap-3 text-red-200 text-sm backdrop-blur-sm">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email / Username */}
            <div>
              <label htmlFor="login" className="block mb-2 text-slate-200 font-medium text-sm">
                Email or Username
              </label>
              <div className="relative group">
                <input
                  id="login"
                  type="text"
                  className="w-full py-3.5 pl-11 pr-4 bg-white/10 border border-white/20 rounded-xl text-base text-white placeholder-slate-400 transition-all duration-300 outline-none focus:bg-white/15 focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 hover:bg-white/15"
                  placeholder="Enter your email or username"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-300 transition-colors" size={18} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block mb-2 text-slate-200 font-medium text-sm">
                Password
              </label>
              <div className="relative group">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full py-3.5 pl-11 pr-12 bg-white/10 border border-white/20 rounded-xl text-base text-white placeholder-slate-400 transition-all duration-300 outline-none focus:bg-white/15 focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 hover:bg-white/15"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Options */}
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-500 bg-white/10 text-blue-400 focus:ring-blue-500/30"
                />
                <span>Remember me</span>
              </label>
              <Link href="#" className="text-blue-300 font-medium text-sm hover:text-blue-200 hover:underline transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 hover:from-blue-400 hover:to-indigo-400 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
              disabled={loading}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="px-4 text-slate-400 text-sm">or continue with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Social login */}
          <div className="flex justify-center gap-3">
            <SocialBtn label="Google">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#ea4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#4285f4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </SocialBtn>
            <SocialBtn label="Microsoft">
              <svg width="20" height="20" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
            </SocialBtn>
            <SocialBtn label="Apple">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#000">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.21-1.98 1.07-3.11-1.05.05-2.31.72-3.06 1.64-.68.84-1.28 2.18-1.12 3.13 1.19.09 2.41-.6 3.11-1.66" />
              </svg>
            </SocialBtn>
            <SocialBtn label="GitHub">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#333">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </SocialBtn>
          </div>

          {/* Sign up link */}
          <p className="text-center text-slate-300 text-sm mt-8">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-blue-300 font-semibold hover:text-blue-200 hover:underline transition-colors">
              Sign up now
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
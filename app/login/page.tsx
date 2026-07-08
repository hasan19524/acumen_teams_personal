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
  CheckSquare,
  Activity,
  Bell,
  AlertCircle,
} from "lucide-react";

/* ─── Feature item, colors pulled from the landing page's app-card icons ─── */
const Feature = ({
  icon: Icon,
  text,
  tint,
}: {
  icon: React.ElementType;
  text: string;
  tint: "blue" | "green" | "orange" | "purple";
}) => {
  const tints = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-amber-50 text-amber-600 border-amber-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };
  return (
    <div className="flex items-center gap-3 text-slate-700 text-sm font-medium">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${tints[tint]}`}
      >
        <Icon size={16} />
      </div>
      <span>{text}</span>
    </div>
  );
};

/* ─── Compact pill for the mobile hero strip ─── */
const MobileFeaturePill = ({
  icon: Icon,
  label,
  tint,
}: {
  icon: React.ElementType;
  label: string;
  tint: string;
}) => (
  <div
    className={`flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium ${tint}`}
  >
    <Icon size={13} />
    {label}
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
    className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center transition-all duration-300 hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 hover:scale-105"
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/accounts/login/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ login, password }),
        },
      );

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
        if (data.workspace_id)
          localStorage.setItem("workspace_id", String(data.workspace_id));

        sessionStorage.setItem("show_welcome", "true");

        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get("redirect");
        router.push(redirectUrl || "/dashboard");
      } else {
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
      setError("Network connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden font-sans bg-white">
      {/* ═══ Ambient mesh — full-viewport wash, matches the landing page's color energy ═══ */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-[900px] h-[900px] bg-blue-100/70 rounded-full blur-[140px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-[900px] h-[900px] bg-cyan-100/70 rounded-full blur-[140px] translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-emerald-50/60 rounded-full blur-[130px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-cyan-50/40" />
      </div>

      {/* ═══ Nav — identical to landing so there's no visual seam ═══ */}
      <nav className="w-full px-6 sm:px-8 lg:px-12 py-5 flex justify-between items-center relative z-20 border-b border-slate-100 bg-white/60 backdrop-blur-md">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Back to Home
        </Link>

        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center text-[var(--heading)] font-bold text-xs shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
            AT
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            Acumen Teams
          </span>
        </Link>
      </nav>

      {/* ═══ Mobile hero — the desktop left column has real content; mobile needs its own ═══ */}
      <div className="lg:hidden px-6 pt-8 pb-2 relative z-10">
        <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight mb-2">
          Pick up right{" "}
          <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            where you left off.
          </span>
        </h2>
        <p className="text-slate-600 text-sm mb-5">
          Chat, tasks, attendance, and announcements — one workspace.
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
          <MobileFeaturePill
            icon={Shield}
            label="Chat"
            tint="bg-blue-50 text-blue-600 border-blue-100"
          />
          <MobileFeaturePill
            icon={CheckSquare}
            label="Tasks"
            tint="bg-emerald-50 text-emerald-600 border-emerald-100"
          />
          <MobileFeaturePill
            icon={Activity}
            label="Attendance"
            tint="bg-amber-50 text-amber-600 border-amber-100"
          />
          <MobileFeaturePill
            icon={Bell}
            label="Announcements"
            tint="bg-purple-50 text-purple-600 border-purple-100"
          />
        </div>
      </div>

      {/* ═══ Main Content ═══ */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 p-6 sm:p-12 relative z-10">
        {/* ─── LEFT: same headline weight and gradient as the landing hero (desktop only) ─── */}
        <div className="hidden lg:flex flex-col w-1/2 max-w-md">
          <div className="space-y-9">
            <div>
              <h2 className="text-5xl font-black text-slate-900 mb-4 leading-[1.05] tracking-tight">
                Pick up right
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  where you left off.
                </span>
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                Chat, tasks, attendance, and announcements — all in one secure
                workspace.
              </p>
            </div>

            {/* Mini echo of the landing page's floating app card, with a soft lift so it doesn't sit flat */}
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-br from-blue-100/50 to-cyan-100/50 rounded-3xl blur-xl -z-10" />
              <div className="rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 p-5">
                <div className="flex gap-1.5 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="space-y-3.5">
                  <Feature
                    icon={Shield}
                    text="Real-time messaging"
                    tint="blue"
                  />
                  <Feature
                    icon={CheckSquare}
                    text="Track & collaborate"
                    tint="green"
                  />
                  <Feature
                    icon={Activity}
                    text="Attendance, auto-tracked"
                    tint="orange"
                  />
                  <Feature
                    icon={Bell}
                    text="Broadcast announcements"
                    tint="purple"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-10 pt-2">
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  10K+
                </div>
                <div className="text-xs text-slate-500 mt-1">Teams</div>
              </div>
              <div className="w-px bg-slate-200" />
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  99.9%
                </div>
                <div className="text-xs text-slate-500 mt-1">Uptime</div>
              </div>
              <div className="w-px bg-slate-200" />
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  256-bit
                </div>
                <div className="text-xs text-slate-500 mt-1">Encryption</div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: the form ─── */}
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 lg:p-10 shadow-xl shadow-slate-200/60">
            {/* Traffic-light dots, rhyming with the mini card and landing mockup */}
            <div className="flex gap-1.5 mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 mb-1.5 tracking-tight">
                Welcome back
              </h1>
              <p className="text-slate-500 text-sm">
                Sign in to access your workspace
              </p>
            </div>

            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="login"
                  className="block mb-2 text-slate-700 font-medium text-sm"
                >
                  Email or Username
                </label>
                <div className="relative group">
                  <input
                    id="login"
                    type="text"
                    className="w-full py-3 pl-11 pr-4 bg-white border border-slate-200 rounded-lg text-base text-slate-900 placeholder-slate-400 transition-all duration-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300"
                    placeholder="Enter your email or username"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    required
                  />
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                    size={18}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-slate-700 font-medium text-sm"
                >
                  Password
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="w-full py-3 pl-11 pr-12 bg-white border border-slate-200 rounded-lg text-base text-slate-900 placeholder-slate-400 transition-all duration-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                    size={18}
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <label className="flex items-center gap-2 text-slate-700 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500/30"
                  />
                  <span>Remember me</span>
                </label>
                <Link
                  href="#"
                  className="text-blue-600 font-medium text-sm hover:text-blue-700 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Gradient CTA — matches "Start Free Trial" on the landing page */}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-[var(--heading)] rounded-full text-base font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-105 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed group"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in{" "}
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="px-4 text-slate-400 text-xs font-medium uppercase tracking-wider">
                or continue with
              </span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div className="flex justify-center gap-3">
              <SocialBtn label="Google">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#ea4335"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34a853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#fbbc05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#4285f4"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
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

            <p className="text-center text-slate-500 text-sm mt-8">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
              >
                Sign up now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

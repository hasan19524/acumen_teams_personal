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
  Layers,
  CheckCircle2,
  AlertCircle,
  User,
  Building2,
  ArrowLeft,
  UserPlus,
  Sparkles,
} from "lucide-react";

/* ─── Feature item — premium shadow + smooth scale ─── */
const Feature = ({
  icon: Icon,
  text,
  color,
}: {
  icon: React.ElementType;
  text: string;
  color: string;
}) => (
  <div className="flex items-center gap-4 group">
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white ring-1 ring-black/5 transition-transform duration-300 ease-out group-hover:scale-105"
      style={{
        backgroundColor: color,
        boxShadow: `0 10px 25px -8px ${color}80`,
      }}
    >
      <Icon size={20} strokeWidth={2} />
    </div>
    <span className="text-slate-800 text-base font-medium tracking-tight">
      {text}
    </span>
  </div>
);

/* ─── Social signup button — refined padding & active feedback ─── */
const SocialBtn = ({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) => (
  <button
    type="button"
    className="flex-1 h-11 px-4 bg-white border border-slate-200 rounded-xl flex items-center justify-center gap-2.5 text-slate-700 font-medium text-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm active:scale-[0.98]"
  >
    {children}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export default function SignupPage() {
  usePublicRoute();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [onboardingMode, setOnboardingMode] = useState<
    "START_COMPANY" | "JOIN_COMPANY"
  >("JOIN_COMPANY");

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    workspaceName: "",
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
    if (
      !formData.fullName ||
      !formData.username ||
      !formData.email ||
      !formData.password
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    if (onboardingMode === "START_COMPANY" && !formData.workspaceName) {
      setError("Workspace name is required to start a company.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/accounts/register/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            onboarding_mode: onboardingMode,
            company_name: formData.workspaceName,
          }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("username", data.username);
        if (data.user_id) localStorage.setItem("user_id", String(data.user_id));
        if (data.workspace_id)
          localStorage.setItem("workspace_id", String(data.workspace_id));

        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get("redirect");
        router.push(redirectUrl || "/dashboard");
      } else {
        setError(
          data.detail ||
            Object.values(data).flat().join(" ") ||
            "Signup failed.",
        );
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden font-sans bg-slate-50">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* Back to Home - Premium Glassmorphic Pill */}
      <Link
        href="/"
        className="absolute top-6 left-6 sm:top-8 sm:left-8 z-30 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group bg-white/80 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-sm"
      >
        <ArrowLeft
          size={16}
          className="group-hover:-translate-x-1 transition-transform duration-200"
        />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      {/* Ambient wash — Richer, deeper, matching landing page lighting */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Base canvas color */}
        <div className="absolute inset-0 bg-white" />

        {/* Dynamic colored blurs */}
        <div className="absolute top-0 left-0 w-[900px] h-[900px] bg-blue-200/40 rounded-full blur-[150px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-[900px] h-[900px] bg-cyan-200/40 rounded-full blur-[150px] translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-100/30 rounded-full blur-[120px]" />

        {/* Premium dotted grid overlay */}
        <div
          className="absolute inset-0 z-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.04) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ════════════════════════════════════════
          LEFT SIDE — Always visible, perfectly centered
      ════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-start px-16 xl:px-24 relative z-10 pt-20 pb-12 w-full">
        <div className="max-w-xl w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg shadow-blue-500/30">
              AT
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              Acumen Teams
            </span>
          </div>

          {/* Massive Hero Headline */}
          <h2 className="text-4xl xl:text-6xl font-black text-slate-900 mb-6 leading-[1.05] tracking-tight">
            Build faster.
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Grow smarter.
            </span>
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed mb-12 max-w-md">
            Launch your workspace in minutes with chat, tasks, attendance, and
            analytics — all in one beautifully designed platform.
          </p>

          {/* Features */}
          <div className="space-y-6 mb-14">
            <Feature
              icon={Shield}
              text="Enterprise-grade security & compliance"
              color="#9333ea"
            />
            <Feature
              icon={Users}
              text="Real-time collaboration & video calls"
              color="#0891b2"
            />
            <Feature
              icon={BarChart3}
              text="Advanced analytics & team insights"
              color="#e11d48"
            />
            <Feature
              icon={Layers}
              text="Unlimited projects, storage & integrations"
              color="#0d9488"
            />
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} className="text-purple-500" /> SOC 2
              Compliant
            </span>
            <span className="flex items-center gap-2 font-medium">
              <Shield size={16} className="text-blue-500" /> End-to-End
              Encrypted
            </span>
            <span className="flex items-center gap-2 font-medium">
              <Sparkles size={16} className="text-orange-500" /> GDPR Ready
            </span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          RIGHT SIDE — Balanced & Highly Interactive
      ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-8 lg:p-16 pt-24 sm:pt-28 lg:pt-16 relative z-10 w-full">
        <div className="lg:hidden flex items-center gap-3 mb-8 mt-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            AT
          </div>
          <span className="text-xl font-bold text-slate-900">Acumen Teams</span>
        </div>

        {/* ONBOARDING CHOICE (Step 0) */}
        {step === 0 && (
          <div className="w-full max-w-lg animate-fade-in-up">
            <h1 className="text-3xl md:text-[2.25rem] font-bold text-slate-900 mb-3 tracking-tight">
              Welcome to Acumen Teams
            </h1>
            <p className="text-slate-500 mb-10 text-base">
              Choose how you'd like to start your journey.
            </p>
            <div className="space-y-5">
              {/* Start a Company */}
              <div
                className="group relative bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-5 transition-all duration-300 ease-out hover:border-transparent hover:shadow-[0_20px_50px_-15px_rgba(147,51,234,0.25)] hover:-translate-y-1 cursor-pointer overflow-hidden"
                onClick={() => {
                  setOnboardingMode("START_COMPANY");
                  setStep(1);
                }}
              >
                {/* Subtle hover background tint */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 to-purple-50/0 group-hover:from-purple-50/40 group-hover:to-transparent transition-all duration-300 pointer-events-none"></div>

                <div
                  className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundColor: "#9333ea" }}
                >
                  <Building2 size={24} strokeWidth={2} />
                </div>
                <div className="relative flex-1">
                  <span className="inline-block px-2.5 py-0.5 mb-2 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                    Admins
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Start a Company
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Create a workspace and invite your team.
                  </p>
                </div>
                <div className="relative w-10 h-10 rounded-full bg-slate-50 group-hover:bg-purple-100 flex items-center justify-center transition-all duration-300 flex-shrink-0">
                  <ArrowRight
                    size={18}
                    className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Join a Company */}
              <div
                className="group relative bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-5 transition-all duration-300 ease-out hover:border-transparent hover:shadow-[0_20px_50px_-15px_rgba(37,99,235,0.25)] hover:-translate-y-1 cursor-pointer overflow-hidden"
                onClick={() => {
                  setOnboardingMode("JOIN_COMPANY");
                  setStep(1);
                }}
              >
                {/* Subtle hover background tint */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/0 group-hover:from-blue-50/40 group-hover:to-transparent transition-all duration-300 pointer-events-none"></div>

                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-white flex-shrink-0 bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105">
                  <UserPlus size={24} strokeWidth={2} />
                </div>
                <div className="relative flex-1">
                  <span className="inline-block px-2.5 py-0.5 mb-2 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    Team members
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Join an Existing Company
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Join a workspace with an invitation link.
                  </p>
                </div>
                <div className="relative w-10 h-10 rounded-full bg-slate-50 group-hover:bg-blue-100 flex items-center justify-center transition-all duration-300 flex-shrink-0">
                  <ArrowRight
                    size={18}
                    className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SIGNUP FORM (Step 1) */}
        {step === 1 && (
          <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-7 lg:p-8 shadow-[0_25px_80px_-20px_rgba(15,23,42,0.15)] animate-fade-in-up">
            <button
              onClick={() => setStep(0)}
              className="text-slate-500 hover:text-slate-900 text-sm flex items-center gap-1.5 mb-6 transition-colors group"
            >
              <ArrowLeft
                size={15}
                className="group-hover:-translate-x-0.5 transition-transform duration-200"
              />{" "}
              Back
            </button>

            <div className="mb-7">
              <h1 className="text-2xl font-bold text-slate-900 mb-1.5 tracking-tight">
                {onboardingMode === "START_COMPANY"
                  ? "Start Your Company"
                  : "Create Your Account"}
              </h1>
              <p className="text-slate-500 text-sm">
                {onboardingMode === "START_COMPANY"
                  ? "Set up your workspace details below."
                  : "Join a workspace using an invitation later."}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-700 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-5">
              <SocialBtn label="Google">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#4285F4"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </SocialBtn>
              <SocialBtn label="GitHub">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1e293b">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </SocialBtn>
            </div>

            <div className="flex items-center mb-5">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="px-3 text-slate-400 text-xs font-medium uppercase tracking-wider">
                or signup with email
              </span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block mb-1.5 text-slate-600 font-medium text-xs tracking-wide"
                  >
                    Full Name
                  </label>
                  <div className="relative group">
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      className="w-full h-12 pl-11 pr-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 hover:bg-white hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Full name"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                    />
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200"
                      size={18}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="username"
                    className="block mb-1.5 text-slate-600 font-medium text-xs tracking-wide"
                  >
                    Username
                  </label>
                  <div className="relative group">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      className="w-full h-12 pl-11 pr-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 hover:bg-white hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200"
                      size={18}
                    />
                  </div>
                </div>
              </div>

              {onboardingMode === "START_COMPANY" && (
                <div>
                  <label
                    htmlFor="workspaceName"
                    className="block mb-1.5 text-slate-600 font-medium text-xs tracking-wide"
                  >
                    Workspace Name
                  </label>
                  <div className="relative group">
                    <input
                      id="workspaceName"
                      name="workspaceName"
                      type="text"
                      className="w-full h-12 pl-11 pr-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 hover:bg-white hover:border-slate-300 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10"
                      placeholder="e.g. Acumen Inc."
                      value={formData.workspaceName}
                      onChange={handleChange}
                      required
                    />
                    <Building2
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors duration-200"
                      size={18}
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block mb-1.5 text-slate-600 font-medium text-xs tracking-wide"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="w-full h-12 pl-11 pr-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 hover:bg-white hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200"
                    size={18}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block mb-1.5 text-slate-600 font-medium text-xs tracking-wide"
                >
                  Create Password
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="w-full h-12 pl-11 pr-11 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 hover:bg-white hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200"
                    size={18}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-105 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed group mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Free Account
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-0.5 transition-transform duration-200"
                    />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-slate-500 text-xs mt-6">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors duration-200"
              >
                Login
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

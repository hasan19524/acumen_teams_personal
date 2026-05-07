"use client";

import { usePublicRoute } from "@/hooks/usePublicRoute";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Lock } from "lucide-react";

export default function LoginPage() {
  usePublicRoute();
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!login || !password) {
      setError("Please enter your email/username and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/accounts/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("username", data.username || login);
        router.push("/dashboard");
      } else {
        setError(data.error || "Invalid credentials. Please try again.");
      }
    } catch {
      setError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #020617 0%, #0d1117 50%, #020617 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .sora { font-family: 'Sora', sans-serif; }
        input { outline: none; }
        input:focus { border-color: #3b82f6 !important; }
        .login-btn:hover { opacity: 0.9; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 480, padding: "0 20px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Sparkles size={32} color="#3b82f6" style={{ marginBottom: 16 }} />
          <h1
            className="sora"
            style={{ color: "#fff", fontSize: 36, fontWeight: 800 }}
          >
            Acumen Teams
          </h1>
          <p style={{ color: "rgba(255,255,255,.5)", marginTop: 8 }}>
            Welcome back! Please login to your account.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 24,
            padding: "36px 36px 32px",
          }}
        >
          {/* Error */}
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,.1)",
                border: "1px solid rgba(239,68,68,.25)",
                borderRadius: 10,
                padding: "12px 16px",
                marginBottom: 20,
                color: "#f87171",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          {/* Email/Username field */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                color: "rgba(255,255,255,.7)",
                fontSize: 14,
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
              }}
            >
              Email Address
            </label>
            <input
              type="text"
              placeholder="Enter your email or username"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: "100%",
                background: "rgba(255,255,255,.07)",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 12,
                padding: "14px 16px",
                color: "#fff",
                fontSize: 15,
              }}
            />
          </div>

          {/* Password field */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                color: "rgba(255,255,255,.7)",
                fontSize: 14,
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={16}
                color="rgba(255,255,255,.3)"
                style={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,.07)",
                  border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 12,
                  padding: "14px 16px 14px 42px",
                  color: "#fff",
                  fontSize: 15,
                }}
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              background: "linear-gradient(135deg,#3b82f6,#4f46e5)",
              color: "#fff",
              border: "none",
              padding: "16px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 16,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? "Logging in..." : "Login →"}
          </button>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "24px 0 20px",
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background: "rgba(255,255,255,.07)",
              }}
            />
            <span style={{ color: "rgba(255,255,255,.3)", fontSize: 13 }}>
              OR
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: "rgba(255,255,255,.07)",
              }}
            />
          </div>

          {/* Signup link */}
          <p
            style={{
              textAlign: "center",
              color: "rgba(255,255,255,.5)",
              fontSize: 14,
            }}
          >
            Don't have an account?{" "}
            <Link
              href="/signup"
              style={{
                color: "#3b82f6",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

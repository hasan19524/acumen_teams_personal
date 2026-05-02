"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Sparkles, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/accounts/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: email,      // Changed from 'email' to 'login'
        password: password,
      }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store tokens
        localStorage.setItem("token", data.access);
        localStorage.setItem("refresh", data.refresh);
        
        // ✅ CORRECT: Redirect to dashboard
        router.push("/dashboard");
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0b14",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        .syne {
          font-family: 'Syne', sans-serif;
        }

        .logo-gradient {
          background: linear-gradient(135deg, #6366f1 0%, #818cf8 50%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .bg-orb-1 {
          position: fixed;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent);
          border-radius: 50%;
          filter: blur(120px);
          top: -200px;
          right: -200px;
          pointer-events: none;
          animation: float 20s ease-in-out infinite;
        }

        .bg-orb-2 {
          position: fixed;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(129, 140, 248, 0.15), transparent);
          border-radius: 50%;
          filter: blur(120px);
          bottom: -150px;
          left: -150px;
          pointer-events: none;
          animation: float 20s ease-in-out infinite 5s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, -50px) scale(1.1); }
          66% { transform: translate(-50px, 50px) scale(0.9); }
        }

        input:focus {
          outline: none;
          border-color: rgba(99, 102, 241, 0.6) !important;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        .btn-primary {
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }

        .btn-primary:active {
          transform: translateY(0);
        }
      `}</style>

      <div className="bg-orb-1" />
      <div className="bg-orb-2" />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 440,
          padding: 24,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1
            className="syne logo-gradient"
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <Sparkles size={32} style={{ color: "#818cf8" }} />
            Acumen Teams
          </h1>
          <p
            style={{
              marginTop: 12,
              color: "rgba(255,255,255,.5)",
              fontSize: 15,
            }}
          >
            Welcome back! Please login to your account.
          </p>
        </div>

        {/* Login Card */}
        <div
          style={{
            background: "rgba(18, 20, 31, 0.6)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 24,
            padding: 40,
          }}
        >
          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  color: "rgba(255,255,255,.9)",
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={18}
                  style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(255,255,255,.4)",
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  style={{
                    width: "100%",
                    padding: "14px 16px 14px 48px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,.08)",
                    background: "rgba(26, 29, 46, 0.6)",
                    color: "#fff",
                    fontSize: 15,
                    transition: "all 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  color: "rgba(255,255,255,.9)",
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={18}
                  style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(255,255,255,.4)",
                  }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: "100%",
                    padding: "14px 16px 14px 48px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,.08)",
                    background: "rgba(26, 29, 46, 0.6)",
                    color: "#fff",
                    fontSize: 15,
                    transition: "all 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                  fontSize: 14,
                  marginBottom: 24,
                }}
              >
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                padding: 16,
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              {loading ? "Logging in..." : "Login"}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              margin: "32px 0",
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background: "rgba(255,255,255,.08)",
              }}
            />
            <span style={{ color: "rgba(255,255,255,.4)", fontSize: 13 }}>
              OR
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: "rgba(255,255,255,.08)",
              }}
            />
          </div>

          {/* Signup Link */}
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 14 }}>
              Don't have an account?{" "}
              <Link
                href="/signup"
                style={{
                  color: "#818cf8",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
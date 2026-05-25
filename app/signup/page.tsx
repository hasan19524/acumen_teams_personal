"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePublicRoute } from "@/hooks/usePublicRoute";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError("");

    if (!fullName || !username || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/accounts/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          company_name: companyName,
          username,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok || res.status === 201) {
        // Auto-login: save tokens and go straight to dashboard
        localStorage.setItem("token", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("username", data.username);
        if (data.user_id) localStorage.setItem("user_id", String(data.user_id));
        router.push("/dashboard");
      } else {
        setError(data.error || "Signup failed. Please try again.");
      }
    } catch {
      setError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background:
          "radial-gradient(circle at top left, #dbeafe 0%, #eef4ff 35%, #f8fbff 65%, #eef2ff 100%)",
        color: "#0b1228",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;700&display=swap');
        .sora { font-family: 'Sora', sans-serif; }
        input { outline: none; }
        input:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
      `}</style>

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "60px 28px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 60,
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        {/* Left Side */}
        <div>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 48,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "linear-gradient(135deg,#3b82f6,#4f46e5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 16,
                  color: "#fff",
                }}
              >
                AT
              </div>
              <span style={{ fontWeight: 700, fontSize: 18, color: "#0b1228" }}>
                Acumen Teams
              </span>
            </div>
          </Link>

          <h1
            className="sora"
            style={{
              fontSize: "clamp(36px,5vw,56px)",
              lineHeight: 1.1,
              fontWeight: 800,
            }}
          >
            Build Faster.
            <br />
            <span style={{ color: "#2563eb" }}>Grow Smarter.</span>
          </h1>

          <p
            style={{
              marginTop: 20,
              color: "#64748b",
              fontSize: 17,
              lineHeight: 1.7,
            }}
          >
            Launch your workspace in minutes with chat, tasks, attendance,
            analytics and team collaboration tools.
          </p>

          <div
            style={{
              marginTop: 36,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            {[
              "✓ Free Setup",
              "✓ Unlimited Possibilities",
              "✓ Smart Team Tools",
              "✓ Scale Anytime",
            ].map((item) => (
              <div
                key={item}
                style={{
                  background: "rgba(37,99,235,.06)",
                  borderRadius: 12,
                  padding: "14px 18px",
                  color: "#2563eb",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side — Form */}
        <div
          style={{
            background: "#fff",
            borderRadius: 28,
            padding: 40,
            boxShadow: "0 20px 60px rgba(0,0,0,.08)",
            border: "1px solid rgba(0,0,0,.06)",
          }}
        >
          <h2
            className="sora"
            style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}
          >
            Start Free Today
          </h2>
          <p style={{ color: "#64748b", marginBottom: 28, fontSize: 15 }}>
            No credit card required. Create your workspace instantly.
          </p>

          {/* Google / Microsoft buttons */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {["Google", "Microsoft"].map((provider) => (
              <button
                key={provider}
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,.08)",
                  background: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                {provider}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div
              style={{ flex: 1, height: 1, background: "rgba(0,0,0,.08)" }}
            />
            <span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>
              OR SIGNUP
            </span>
            <div
              style={{ flex: 1, height: 1, background: "rgba(0,0,0,.08)" }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 16,
                color: "#dc2626",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,.1)",
                fontSize: 15,
                color: "#0b1228",
              }}
            />
            <input
              placeholder="Company Name (optional)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,.1)",
                fontSize: 15,
                color: "#0b1228",
              }}
            />
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,.1)",
                fontSize: 15,
                color: "#0b1228",
              }}
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,.1)",
                fontSize: 15,
                color: "#0b1228",
              }}
            />
            <input
              type="password"
              placeholder="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,.1)",
                fontSize: 15,
                color: "#0b1228",
              }}
            />

            <button
              onClick={handleSignup}
              disabled={loading}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                padding: "16px",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 16,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginTop: 4,
              }}
            >
              {loading ? "Creating account..." : "Create Free Account"}
            </button>
          </div>

          <p
            style={{
              textAlign: "center",
              color: "#64748b",
              fontSize: 14,
              marginTop: 20,
            }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              style={{
                color: "#2563eb",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

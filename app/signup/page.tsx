"use client";

import Navbar from "@/components/ui/Navbar";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/accounts/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Account created successfully!");
        router.push("/login");
      } else {
        alert(data.username?.[0] || data.email?.[0] || "Signup failed");
      }
    } catch (error) {
      alert("Server error");
    }
  };

  return (
    <>
      <Navbar />

      <main
        className="min-h-screen"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          background:
            "radial-gradient(circle at top left,#dbeafe 0%,#eef4ff 35%,#f8fbff 65%,#eef2ff 100%)",
          color: "#0b1228",
          padding: "60px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;700&display=swap');

          .sora {
            font-family: 'Sora', sans-serif;
          }

          input {
            outline: none;
            transition: .25s ease;
          }

          input:focus {
            border-color: #2563eb !important;
            box-shadow: 0 0 0 4px rgba(37,99,235,.08);
            transform: translateY(-1px);
          }

          .btn-main {
            transition: .25s ease;
          }

          .btn-main:hover {
            transform: translateY(-2px);
            background:#1d4ed8 !important;
            box-shadow: 0 18px 35px rgba(37,99,235,.28);
          }

          .glass {
            backdrop-filter: blur(18px);
          }

          .card-hover {
            transition: .25s ease;
          }

          .card-hover:hover {
            transform: translateY(-4px);
            box-shadow: 0 35px 80px rgba(0,0,0,.10);
          }

          .social-btn {
            transition: .2s ease;
          }

          .social-btn:hover {
            transform: translateY(-2px);
            border-color: rgba(37,99,235,.28) !important;
          }
        `}</style>

        <section
          style={{
            width: "100%",
            maxWidth: 1240,
            display: "grid",
            gridTemplateColumns: "1.05fr .95fr",
            gap: 34,
            alignItems: "center",
          }}
        >
          {/* LEFT SIDE */}
          <div
            style={{
              padding: "20px 10px",
            }}
          >
            <p
              style={{
                color: "#2563eb",
                fontWeight: 700,
                letterSpacing: 1,
                fontSize: 13,
              }}
            >
              START FREE
            </p>

            <h1
              className="sora"
              style={{
                fontSize: "clamp(56px,7vw,86px)",
                lineHeight: 0.95,
                marginTop: 18,
                letterSpacing: -4,
              }}
            >
              Build Faster.
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg,#2563eb,#6366f1)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Grow Smarter.
              </span>
            </h1>

            <p
              style={{
                marginTop: 28,
                fontSize: 19,
                color: "#5b6688",
                lineHeight: 1.8,
                maxWidth: 560,
              }}
            >
              Launch your workspace in minutes with chat, tasks, attendance,
              analytics and team collaboration tools.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2,minmax(220px,1fr))",
                gap: 18,
                marginTop: 42,
                maxWidth: 620,
              }}
            >
              {[
                "Free Setup",
                "Unlimited Possibilities",
                "Smart Team Tools",
                "Scale Anytime",
              ].map((item) => (
                <div
                  key={item}
                  className="glass"
                  style={{
                    background: "rgba(255,255,255,.58)",
                    border: "1px solid rgba(255,255,255,.6)",
                    borderRadius: 22,
                    padding: "18px 20px",
                    fontWeight: 700,
                    color: "#0b1228",
                  }}
                >
                  ✓ {item}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIGNUP CARD */}
          <div
            className="card-hover glass"
            style={{
              width: "100%",
              maxWidth: 520,
              marginLeft: "auto",
              background: "rgba(255,255,255,.72)",
              borderRadius: 34,
              padding: 38,
              border: "1px solid rgba(255,255,255,.75)",
              boxShadow: "0 35px 90px rgba(0,0,0,.08)",
            }}
          >
            <p
              style={{
                color: "#2563eb",
                fontWeight: 700,
                letterSpacing: 1,
                fontSize: 13,
              }}
            >
              CREATE ACCOUNT
            </p>

            <h2
              className="sora"
              style={{
                fontSize: 46,
                lineHeight: 1,
                marginTop: 12,
                letterSpacing: -2,
              }}
            >
              Start Free Today
            </h2>

            <p
              style={{
                marginTop: 14,
                color: "#64748b",
                lineHeight: 1.7,
                fontSize: 16,
              }}
            >
              No credit card required. Create your workspace instantly.
            </p>

            {/* SOCIAL */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 28,
              }}
            >
              <button
                className="social-btn"
                style={{
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,.08)",
                  padding: "14px",
                  borderRadius: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Google
              </button>

              <button
                className="social-btn"
                style={{
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,.08)",
                  padding: "14px",
                  borderRadius: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Microsoft
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                margin: "24px 0",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(0,0,0,.08)",
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  fontWeight: 700,
                }}
              >
                OR SIGNUP
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(0,0,0,.08)",
                }}
              />
            </div>

            {/* FORM */}
            <div
              style={{
                display: "grid",
                gap: 16,
              }}
            >
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  padding: "17px 18px",
                  borderRadius: 16,
                  border: "1px solid rgba(0,0,0,.08)",
                  background: "#fff",
                  fontSize: 16,
                }}
              />

              <input
                type="text"
                placeholder="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={{
                  padding: "17px 18px",
                  borderRadius: 16,
                  border: "1px solid rgba(0,0,0,.08)",
                  background: "#fff",
                  fontSize: 16,
                }}
              />

              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  padding: "17px 18px",
                  borderRadius: 16,
                  border: "1px solid rgba(0,0,0,.08)",
                  background: "#fff",
                  fontSize: 16,
                }}
              />

              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  padding: "17px 18px",
                  borderRadius: 16,
                  border: "1px solid rgba(0,0,0,.08)",
                  background: "#fff",
                  fontSize: 16,
                }}
              />

              <input
                type="password"
                placeholder="Create Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  padding: "17px 18px",
                  borderRadius: 16,
                  border: "1px solid rgba(0,0,0,.08)",
                  background: "#fff",
                  fontSize: 16,
                }}
              />

              <button
                onClick={handleSignup}
                className="btn-main"
                style={{
                  marginTop: 10,
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  padding: "17px",
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                Create Free Account
              </button>
            </div>

            <p
              style={{
                marginTop: 24,
                textAlign: "center",
                color: "#64748b",
                fontSize: 15,
              }}
            >
              Already have an account?{" "}
              <Link
                href="/login"
                style={{
                  color: "#2563eb",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Login
              </Link>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
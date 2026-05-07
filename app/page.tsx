"use client";

import Link from "next/link";
import Navbar from "@/components/ui/Navbar";

export default function LandingPage() {
  const plans = [
    {
      name: "Free",
      price: "₹0",
      sub: "Forever free",
      desc: "Perfect for solo founders",
      cta1: "Get Started",
      cta1Href: "/signup",
      cta2: "Login",
      cta2Href: "/login",
      features: [
        "1 User",
        "Team Chat",
        "Task Board",
        "Announcements",
        "Basic Attendance",
        "Community Support",
      ],
      featured: false,
    },
    {
      name: "Starter",
      price: "₹49",
      sub: "per user / month",
      desc: "For growing small teams",
      cta1: "Buy Now",
      cta1Href: "/signup",
      cta2: "Try Free",
      cta2Href: "/signup",
      features: [
        "Everything in Free",
        "5 Users",
        "Advanced Attendance",
        "Task Reports",
        "5 GB Storage",
        "Email Support",
      ],
      featured: false,
    },
    {
      name: "Growth",
      price: "₹99",
      sub: "per user / month",
      desc: "Most Popular",
      cta1: "Buy Now",
      cta1Href: "/signup",
      cta2: "Try Free",
      cta2Href: "/signup",
      features: [
        "Everything in Starter",
        "20 Users",
        "Analytics Dashboard",
        "Role Permissions",
        "20 GB Storage",
        "Priority Support",
      ],
      featured: true,
    },
    {
      name: "Enterprise",
      price: "₹149",
      sub: "per user / month",
      desc: "For advanced companies",
      cta1: "Contact Sales",
      cta1Href: "/support",
      cta2: "Book Demo",
      cta2Href: "/support",
      features: [
        "Unlimited Users",
        "Custom Branding",
        "Unlimited Storage",
        "Admin Controls",
        "Dedicated Manager",
        "24/7 Support",
      ],
      featured: false,
    },
  ];

  return (
    <>
      <Navbar />

      <main
        className="min-h-screen text-slate-900"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          background: "#f4f7ff",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;700&display=swap');

          .sora { font-family: 'Sora', sans-serif; }

          .hero-title {
            font-family: 'Sora', sans-serif;
            font-size: clamp(52px, 7vw, 82px);
            font-weight: 900;
            line-height: 1;
            letter-spacing: -3px;
            color: #0b1228;
          }

          .accent {
            background: linear-gradient(135deg,#2563eb,#6366f1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .card-hover { transition: all .25s ease; }
          .card-hover:hover { transform: translateY(-8px); box-shadow: 0 30px 70px rgba(0,0,0,.08); }

          .btn-main { transition: .25s ease; }
          .btn-main:hover { transform: translateY(-2px); background:#1d4ed8 !important; }

          .btn-outline { transition: .25s ease; }
          .btn-outline:hover { background: rgba(0,0,0,.03) !important; }

          .featured { box-shadow: 0 25px 80px rgba(37,99,235,.18); border: 2px solid #2563eb !important; }
        `}</style>

        {/* HERO */}
        <section
          style={{
            maxWidth: 1300,
            margin: "0 auto",
            padding: "90px 28px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 70,
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                gap: 10,
                alignItems: "center",
                background: "rgba(37,99,235,.08)",
                border: "1px solid rgba(37,99,235,.15)",
                padding: "8px 16px",
                borderRadius: 999,
                color: "#2563eb",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Trusted by Growing Teams
            </div>

            <h1 className="hero-title" style={{ marginTop: 28 }}>
              Work Smarter.
              <br />
              <span className="accent">Lead Stronger.</span>
            </h1>

            <p
              style={{
                marginTop: 28,
                fontSize: 18,
                lineHeight: 1.7,
                color: "#5b6688",
                maxWidth: 520,
              }}
            >
              Chat, tasks, attendance, announcements and productivity tools —
              built for businesses that want speed, structure and growth.
            </p>

            <div
              style={{
                display: "flex",
                gap: 14,
                marginTop: 36,
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/signup"
                className="btn-main"
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  textDecoration: "none",
                  padding: "16px 32px",
                  borderRadius: 999,
                  fontWeight: 700,
                  display: "inline-block",
                }}
              >
                Start Free Trial
              </Link>

              <Link
                href="/features"
                className="btn-outline"
                style={{
                  background: "#fff",
                  color: "#0b1228",
                  textDecoration: "none",
                  border: "1px solid rgba(0,0,0,.08)",
                  padding: "16px 32px",
                  borderRadius: 999,
                  fontWeight: 700,
                  display: "inline-block",
                }}
              >
                Watch Demo
              </Link>
            </div>
          </div>

          {/* RIGHT DASHBOARD PREVIEW */}
          <div
            style={{
              background: "#081028",
              borderRadius: 28,
              padding: 26,
              color: "#fff",
              boxShadow: "0 35px 90px rgba(0,0,0,.16)",
            }}
          >
            <h3 className="sora" style={{ fontSize: 28, marginBottom: 22 }}>
              Team Overview
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {[
                { label: "Attendance", value: "94%" },
                { label: "Tasks Done", value: "128" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "rgba(255,255,255,.05)",
                    borderRadius: 18,
                    padding: 22,
                  }}
                >
                  <p style={{ color: "rgba(255,255,255,.45)" }}>{item.label}</p>
                  <h4 className="sora" style={{ fontSize: 42, marginTop: 10 }}>
                    {item.value}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section
          style={{
            padding: "100px 28px",
            background:
              "linear-gradient(160deg,#eef4ff 0%,#ffffff 45%,#eef2ff 100%)",
          }}
        >
          <div style={{ maxWidth: 1300, margin: "0 auto" }}>
            <p
              style={{
                color: "#2563eb",
                fontWeight: 700,
                textAlign: "center",
                letterSpacing: 1,
              }}
            >
              PRICING
            </p>

            <h2
              className="sora"
              style={{
                fontSize: 56,
                textAlign: "center",
                lineHeight: 1,
                marginTop: 18,
                letterSpacing: -2,
              }}
            >
              Find the Right Plan
              <br />
              for Your Team
            </h2>

            <p
              style={{
                textAlign: "center",
                color: "#64748b",
                marginTop: 16,
                fontSize: 18,
              }}
            >
              Transparent pricing for startups, SMEs and growing companies.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 22,
                marginTop: 60,
              }}
            >
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`card-hover ${plan.featured ? "featured" : ""}`}
                  style={{
                    background: "#fff",
                    borderRadius: 26,
                    padding: 30,
                    border: "1px solid rgba(0,0,0,.06)",
                  }}
                >
                  {plan.featured && (
                    <div
                      style={{
                        display: "inline-block",
                        background: "linear-gradient(135deg,#2563eb,#6366f1)",
                        color: "#fff",
                        padding: "6px 14px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        marginBottom: 20,
                      }}
                    >
                      MOST POPULAR
                    </div>
                  )}

                  <h3 className="sora" style={{ fontSize: 28 }}>
                    {plan.name}
                  </h3>
                  <div
                    className="sora"
                    style={{
                      fontSize: 56,
                      fontWeight: 900,
                      marginTop: 18,
                      letterSpacing: -3,
                    }}
                  >
                    {plan.price}
                  </div>
                  <p style={{ color: "#64748b", marginTop: 6 }}>{plan.sub}</p>
                  <p style={{ color: "#64748b", marginTop: 2 }}>{plan.desc}</p>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      marginTop: 26,
                    }}
                  >
                    <Link
                      href={plan.cta1Href}
                      className="btn-main"
                      style={{
                        display: "block",
                        textAlign: "center",
                        background: "#2563eb",
                        color: "#fff",
                        textDecoration: "none",
                        padding: 14,
                        borderRadius: 999,
                        fontWeight: 700,
                      }}
                    >
                      {plan.cta1}
                    </Link>

                    <Link
                      href={plan.cta2Href}
                      className="btn-outline"
                      style={{
                        display: "block",
                        textAlign: "center",
                        background: "#fff",
                        color: "#0b1228",
                        textDecoration: "none",
                        border: "1px solid rgba(0,0,0,.08)",
                        padding: 14,
                        borderRadius: 999,
                        fontWeight: 700,
                      }}
                    >
                      {plan.cta2}
                    </Link>
                  </div>

                  <hr
                    style={{
                      border: "none",
                      borderTop: "1px solid rgba(0,0,0,.06)",
                      margin: "24px 0",
                    }}
                  />

                  <p
                    style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}
                  >
                    PLAN HIGHLIGHTS
                  </p>

                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {plan.features.map((f) => (
                      <li key={f} style={{ color: "#475569", fontSize: 14 }}>
                        ✓ {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          style={{
            background: "#081028",
            color: "#fff",
            padding: "100px 28px",
            textAlign: "center",
          }}
        >
          <h2 className="sora" style={{ fontSize: 56 }}>
            Ready to build a stronger team?
          </h2>

          <p
            style={{
              color: "rgba(255,255,255,.55)",
              maxWidth: 580,
              margin: "18px auto 0",
              lineHeight: 1.7,
              fontSize: 18,
            }}
          >
            Join Acumen Teams and manage your company in one modern workspace.
          </p>

          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              marginTop: 36,
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/signup"
              className="btn-main"
              style={{
                background: "#2563eb",
                color: "#fff",
                textDecoration: "none",
                padding: "18px 42px",
                borderRadius: 999,
                fontWeight: 700,
                display: "inline-block",
              }}
            >
              Start Free Trial
            </Link>

            <Link
              href="/login"
              style={{
                background: "rgba(255,255,255,.08)",
                color: "#fff",
                textDecoration: "none",
                padding: "18px 42px",
                borderRadius: 999,
                fontWeight: 700,
                border: "1px solid rgba(255,255,255,.15)",
                display: "inline-block",
              }}
            >
              Login
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

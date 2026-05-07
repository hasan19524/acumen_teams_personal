import Link from "next/link";
import Navbar from "@/components/ui/Navbar";

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "₹0",
      sub: "Forever free",
      desc: "Perfect for solo founders",
      cta: "Get Started",
      href: "/signup",
      featured: false,
      features: [
        "1 User",
        "Team Chat",
        "Task Board",
        "Basic Attendance",
        "Community Support",
      ],
    },
    {
      name: "Starter",
      price: "₹49",
      sub: "per user / month",
      desc: "For growing small teams",
      cta: "Start Trial",
      href: "/signup",
      featured: false,
      features: [
        "5 Users",
        "Advanced Attendance",
        "Task Reports",
        "5 GB Storage",
        "Email Support",
      ],
    },
    {
      name: "Growth",
      price: "₹99",
      sub: "per user / month",
      desc: "Most Popular",
      cta: "Buy Now",
      href: "/signup",
      featured: true,
      features: [
        "20 Users",
        "Analytics Dashboard",
        "Role Permissions",
        "20 GB Storage",
        "Priority Support",
      ],
    },
    {
      name: "Enterprise",
      price: "₹149",
      sub: "per user / month",
      desc: "For advanced companies",
      cta: "Contact Sales",
      href: "/support",
      featured: false,
      features: [
        "Unlimited Users",
        "Unlimited Storage",
        "Custom Branding",
        "Dedicated Manager",
        "24/7 Support",
      ],
    },
  ];

  return (
    <>
      <Navbar />

      <main
        className="min-h-screen"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          background: "#f4f7ff",
          color: "#0b1228",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;700&display=swap');

          .sora { font-family: 'Sora', sans-serif; }

          .card { transition: .25s ease; }
          .card:hover { transform: translateY(-8px); box-shadow: 0 30px 70px rgba(0,0,0,.08); }

          .featured { border: 2px solid #2563eb !important; box-shadow: 0 25px 80px rgba(37,99,235,.18); }

          .btn-main { transition: .25s ease; }
          .btn-main:hover { transform: translateY(-2px); background:#1d4ed8 !important; }
        `}</style>

        {/* HERO */}
        <section
          style={{
            maxWidth: 1300,
            margin: "0 auto",
            padding: "90px 28px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#2563eb", fontWeight: 700, letterSpacing: 1 }}>
            PRICING
          </p>

          <h1
            className="sora"
            style={{
              fontSize: "clamp(48px,7vw,78px)",
              lineHeight: 1,
              marginTop: 18,
              letterSpacing: -3,
            }}
          >
            Transparent Pricing
            <br />
            For Every Team
          </h1>

          <p
            style={{
              marginTop: 24,
              fontSize: 18,
              color: "#64748b",
              maxWidth: 700,
              marginInline: "auto",
              lineHeight: 1.7,
            }}
          >
            Choose a plan built for startups, SMEs and growing companies. Scale
            when you need it.
          </p>
        </section>

        {/* PRICING CARDS */}
        <section
          style={{ maxWidth: 1300, margin: "0 auto", padding: "0 28px 100px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: 24,
            }}
          >
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`card ${plan.featured ? "featured" : ""}`}
                style={{
                  background: "#fff",
                  borderRadius: 28,
                  padding: 32,
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

                <h3 className="sora" style={{ fontSize: 30 }}>
                  {plan.name}
                </h3>

                <div
                  className="sora"
                  style={{
                    fontSize: 58,
                    fontWeight: 900,
                    marginTop: 18,
                    letterSpacing: -3,
                  }}
                >
                  {plan.price}
                </div>

                <p style={{ color: "#64748b", marginTop: 8 }}>{plan.sub}</p>
                <p style={{ color: "#64748b", marginTop: 4 }}>{plan.desc}</p>

                <Link
                  href={plan.href}
                  className="btn-main"
                  style={{
                    display: "block",
                    textAlign: "center",
                    width: "100%",
                    marginTop: 28,
                    background: "#2563eb",
                    color: "#fff",
                    textDecoration: "none",
                    padding: "14px",
                    borderRadius: 999,
                    fontWeight: 700,
                    boxSizing: "border-box",
                  }}
                >
                  {plan.cta}
                </Link>

                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid rgba(0,0,0,.06)",
                    margin: "26px 0",
                  }}
                />

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      style={{ color: "#475569", fontSize: 15 }}
                    >
                      ✓ {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* COMPARE SECTION */}
        <section
          style={{
            background: "#081028",
            color: "#fff",
            padding: "100px 28px",
          }}
        >
          <div
            style={{ maxWidth: 1300, margin: "0 auto", textAlign: "center" }}
          >
            <h2 className="sora" style={{ fontSize: 56 }}>
              Why Teams Choose Us
            </h2>

            <div
              style={{
                marginTop: 50,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
                gap: 24,
              }}
            >
              {[
                "Affordable Pricing",
                "Modern UI",
                "Fast Setup",
                "SME Friendly",
                "Scalable Plans",
                "Premium Support",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    background: "rgba(255,255,255,.05)",
                    padding: 28,
                    borderRadius: 22,
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          style={{
            padding: "100px 28px",
            textAlign: "center",
            background: "#f4f7ff",
          }}
        >
          <h2 className="sora" style={{ fontSize: 56 }}>
            Start Free Today
          </h2>

          <p style={{ marginTop: 18, color: "#64748b", fontSize: 18 }}>
            Upgrade anytime as your company grows.
          </p>

          <Link
            href="/signup"
            className="btn-main"
            style={{
              display: "inline-block",
              marginTop: 34,
              background: "#2563eb",
              color: "#fff",
              textDecoration: "none",
              padding: "18px 42px",
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            Start Free Trial
          </Link>
        </section>
      </main>
    </>
  );
}

import Link from "next/link";
import Navbar from "@/components/ui/Navbar";

export default function FeaturesPage() {
  const features = [
    {
      title: "Team Chat",
      desc: "Instant communication with your team through channels and direct messages.",
    },
    {
      title: "Attendance",
      desc: "Track employee attendance, late marks, work hours and reports.",
    },
    {
      title: "Task Management",
      desc: "Assign tasks, monitor progress and improve accountability.",
    },
    {
      title: "Announcements",
      desc: "Share company-wide updates and notices instantly.",
    },
    {
      title: "Analytics",
      desc: "Track productivity, attendance and team performance.",
    },
    {
      title: "Role Permissions",
      desc: "Give access based on employee roles and departments.",
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
          .card:hover { transform: translateY(-6px); box-shadow: 0 30px 60px rgba(0,0,0,.08); }

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
            FEATURES
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
            Everything Your Team
            <br />
            Needs to Grow
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
            Chat, tasks, attendance, analytics and management tools — built for
            modern businesses that want speed and structure.
          </p>

          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              marginTop: 34,
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
                padding: "16px 34px",
                borderRadius: 999,
                fontWeight: 700,
                display: "inline-block",
              }}
            >
              Start Free Trial
            </Link>

            <Link
              href="/support"
              style={{
                background: "#fff",
                color: "#0b1228",
                textDecoration: "none",
                border: "1px solid rgba(0,0,0,.08)",
                padding: "16px 34px",
                borderRadius: 999,
                fontWeight: 700,
                display: "inline-block",
              }}
            >
              Book Demo
            </Link>
          </div>
        </section>

        {/* FEATURE GRID */}
        <section
          style={{
            maxWidth: 1300,
            margin: "0 auto",
            padding: "0 28px 90px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: 22,
            }}
          >
            {features.map((item) => (
              <div
                key={item.title}
                className="card"
                style={{
                  background: "#fff",
                  borderRadius: 24,
                  padding: 30,
                  border: "1px solid rgba(0,0,0,.06)",
                }}
              >
                <h3 className="sora" style={{ fontSize: 26, marginBottom: 14 }}>
                  {item.title}
                </h3>

                <p style={{ color: "#64748b", lineHeight: 1.7, fontSize: 16 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* WHY CHOOSE */}
        <section
          style={{
            background: "#081028",
            color: "#fff",
            padding: "100px 28px",
          }}
        >
          <div style={{ maxWidth: 1300, margin: "0 auto" }}>
            <h2 className="sora" style={{ fontSize: 54, textAlign: "center" }}>
              Why Acumen Teams?
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
                "Easy to Use",
                "Affordable for SMEs",
                "Fast Setup",
                "Modern UI",
                "Productivity Focused",
                "Scalable for Growth",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    background: "rgba(255,255,255,.05)",
                    padding: 28,
                    borderRadius: 22,
                    textAlign: "center",
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

        {/* DASHBOARD SHOWCASE */}
        <section
          style={{ maxWidth: 1300, margin: "0 auto", padding: "100px 28px" }}
        >
          <h2 className="sora" style={{ fontSize: 56, textAlign: "center" }}>
            Powerful Insights
          </h2>

          <p
            style={{
              textAlign: "center",
              color: "#64748b",
              marginTop: 16,
              fontSize: 18,
            }}
          >
            Track attendance, productivity and team growth in one dashboard.
          </p>

          <div
            style={{
              marginTop: 50,
              background: "#081028",
              borderRadius: 30,
              padding: 28,
              color: "#fff",
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 20,
            }}
          >
            {[
              { title: "Attendance", value: "94%" },
              { title: "Tasks Done", value: "128" },
              { title: "Productivity", value: "89%" },
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  background: "rgba(255,255,255,.05)",
                  padding: 24,
                  borderRadius: 22,
                }}
              >
                <p style={{ color: "rgba(255,255,255,.55)" }}>{card.title}</p>
                <h3 className="sora" style={{ fontSize: 44, marginTop: 10 }}>
                  {card.value}
                </h3>
              </div>
            ))}
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
            Ready to Empower Your Team?
          </h2>

          <p
            style={{
              color: "rgba(255,255,255,.55)",
              marginTop: 18,
              fontSize: 18,
            }}
          >
            Start using Acumen Teams today and simplify business management.
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

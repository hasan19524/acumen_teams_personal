import Navbar from "@/components/landing/Navbar";
import Link from "next/link";

export default function DownloadPage() {
  const desktopApps = [
    {
      title: "Windows App",
      desc: "Optimized for Windows 10 & above with full desktop experience.",
      button: "Download for Windows",
    },
    {
      title: "macOS App",
      desc: "Native performance for MacBook, iMac and Apple Silicon devices.",
      button: "Download for macOS",
    },
    {
      title: "Linux App",
      desc: "Built for Ubuntu, Debian and modern Linux environments.",
      button: "Download for Linux",
    },
  ];

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
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;700&display=swap');

          .sora {
            font-family: 'Sora', sans-serif;
          }

          .card {
            transition: .25s ease;
          }

          .card:hover {
            transform: translateY(-6px);
            box-shadow: 0 30px 70px rgba(0,0,0,.08);
          }

          .btn-main {
            transition: .25s ease;
          }

          .btn-main:hover {
            transform: translateY(-2px);
            background:#1d4ed8 !important;
          }
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
          <p
            style={{
              color: "#2563eb",
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            DESKTOP DOWNLOADS
          </p>

          <h1
            className="sora"
            style={{
              fontSize: "clamp(52px,7vw,84px)",
              lineHeight: 0.95,
              marginTop: 18,
              letterSpacing: -4,
            }}
          >
            Powerful Desktop
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg,#2563eb,#6366f1)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Productivity.
            </span>
          </h1>

          <p
            style={{
              marginTop: 28,
              fontSize: 19,
              color: "#5b6688",
              lineHeight: 1.8,
              maxWidth: 760,
              marginInline: "auto",
            }}
          >
            Use Acumen Teams on your desktop with faster performance,
            notifications and seamless team collaboration.
          </p>
        </section>

        {/* DOWNLOAD CARDS */}
        <section
          style={{
            maxWidth: 1300,
            margin: "0 auto",
            padding: "0 28px 100px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
              gap: 24,
            }}
          >
            {desktopApps.map((app) => (
              <div
                key={app.title}
                className="card"
                style={{
                  background: "#fff",
                  borderRadius: 30,
                  padding: 34,
                  border: "1px solid rgba(0,0,0,.06)",
                }}
              >
                <h3
                  className="sora"
                  style={{
                    fontSize: 36,
                  }}
                >
                  {app.title}
                </h3>

                <p
                  style={{
                    marginTop: 16,
                    color: "#64748b",
                    lineHeight: 1.7,
                    fontSize: 16,
                  }}
                >
                  {app.desc}
                </p>

                <button
                  className="btn-main"
                  style={{
                    marginTop: 30,
                    width: "100%",
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    padding: "16px",
                    borderRadius: 999,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 15,
                  }}
                >
                  {app.button}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* BENEFITS */}
        <section
          style={{
            background: "#081028",
            color: "#fff",
            padding: "100px 28px",
          }}
        >
          <div
            style={{
              maxWidth: 1300,
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <h2
              className="sora"
              style={{
                fontSize: 56,
              }}
            >
              Why Desktop App?
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
                "Faster Performance",
                "Real-time Notifications",
                "Better Multitasking",
                "Secure Access",
                "Premium Workspace",
                "Offline Ready",
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
          }}
        >
          <h2
            className="sora"
            style={{
              fontSize: 56,
            }}
          >
            Ready to Start?
          </h2>

          <p
            style={{
              marginTop: 18,
              color: "#64748b",
              fontSize: 18,
            }}
          >
            Install Acumen Teams and manage your business smarter.
          </p>

          <Link
            href="/signup"
            style={{
              marginTop: 34,
              background: "#2563eb",
              color: "#fff",
              textDecoration: "none",
              padding: "18px 42px",
              borderRadius: 999,
              fontWeight: 700,
              display: "inline-block",
            }}
          >
            Start Free
          </Link>
        </section>
      </main>
    </>
  );
}
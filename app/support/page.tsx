import Navbar from "@/components/ui/Navbar";

export default function SupportPage() {
  const faqs = [
    {
      q: "How do I start using Acumen Teams?",
      a: "Simply create an account, invite your team members and begin managing chat, tasks and attendance instantly.",
    },
    {
      q: "Is there a free plan available?",
      a: "Yes. We offer a free plan for solo founders and small teams getting started.",
    },
    {
      q: "Can I upgrade later?",
      a: "Absolutely. You can upgrade or downgrade your plan anytime as your company grows.",
    },
    {
      q: "Do you provide onboarding help?",
      a: "Yes. We help businesses with setup, migration and onboarding guidance.",
    },
    {
      q: "Is my company data secure?",
      a: "Yes. Security and privacy are top priorities with encrypted and protected systems.",
    },
    {
      q: "How can I contact support?",
      a: "You can use the support form below or email our support team anytime.",
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

          .sora {
            font-family: 'Sora', sans-serif;
          }

          .card {
            transition: .25s ease;
          }

          .card:hover {
            transform: translateY(-6px);
            box-shadow: 0 30px 60px rgba(0,0,0,.08);
          }

          .btn-main {
            transition: .25s ease;
          }

          .btn-main:hover {
            transform: translateY(-2px);
            background:#1d4ed8 !important;
          }

          input, textarea {
            outline: none;
          }

          input:focus, textarea:focus {
            border-color: #2563eb !important;
            box-shadow: 0 0 0 4px rgba(37,99,235,.08);
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
            SUPPORT
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
            We’re Here
            <br />
            To Help You
          </h1>

          <p
            style={{
              marginTop: 24,
              fontSize: 18,
              color: "#64748b",
              maxWidth: 720,
              marginInline: "auto",
              lineHeight: 1.7,
            }}
          >
            Get answers, onboarding guidance and fast support for your business.
            Our team is ready to help you succeed with Acumen Teams.
          </p>
        </section>

        {/* SUPPORT CARDS */}
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
            {[
              {
                title: "Live Chat",
                desc: "Talk to our team for instant help and guidance.",
              },
              {
                title: "Email Support",
                desc: "Get detailed assistance from our support specialists.",
              },
              {
                title: "Onboarding Help",
                desc: "We help you setup your workspace quickly.",
              },
            ].map((item) => (
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
                <h3
                  className="sora"
                  style={{
                    fontSize: 28,
                    marginBottom: 14,
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    color: "#64748b",
                    lineHeight: 1.7,
                    fontSize: 16,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section
          style={{
            background: "#081028",
            color: "#fff",
            padding: "100px 28px",
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
            }}
          >
            <h2
              className="sora"
              style={{
                fontSize: 56,
                textAlign: "center",
              }}
            >
              Frequently Asked Questions
            </h2>

            <div
              style={{
                marginTop: 50,
                display: "grid",
                gap: 18,
              }}
            >
              {faqs.map((item) => (
                <div
                  key={item.q}
                  style={{
                    background: "rgba(255,255,255,.05)",
                    borderRadius: 22,
                    padding: 26,
                  }}
                >
                  <h3
                    className="sora"
                    style={{
                      fontSize: 24,
                    }}
                  >
                    {item.q}
                  </h3>

                  <p
                    style={{
                      marginTop: 12,
                      color: "rgba(255,255,255,.65)",
                      lineHeight: 1.7,
                      fontSize: 16,
                    }}
                  >
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT FORM */}
        <section
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "100px 28px",
          }}
        >
          <h2
            className="sora"
            style={{
              fontSize: 56,
              textAlign: "center",
            }}
          >
            Contact Support
          </h2>

          <p
            style={{
              textAlign: "center",
              color: "#64748b",
              marginTop: 16,
              fontSize: 18,
            }}
          >
            Send us your query and we’ll get back to you soon.
          </p>

          <div
            style={{
              marginTop: 40,
              background: "#fff",
              borderRadius: 28,
              padding: 32,
              border: "1px solid rgba(0,0,0,.06)",
              display: "grid",
              gap: 18,
            }}
          >
            <input
              type="text"
              placeholder="Your Name"
              style={{
                padding: "16px 18px",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,.08)",
                fontSize: 16,
              }}
            />

            <input
              type="email"
              placeholder="Your Email"
              style={{
                padding: "16px 18px",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,.08)",
                fontSize: 16,
              }}
            />

            <textarea
              placeholder="How can we help you?"
              rows={6}
              style={{
                padding: "16px 18px",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,.08)",
                fontSize: 16,
                resize: "vertical",
              }}
            />

            <button
              className="btn-main"
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                padding: "16px 30px",
                borderRadius: 999,
                fontWeight: 700,
                cursor: "pointer",
                width: "fit-content",
              }}
            >
              Submit Request
            </button>
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
          <h2
            className="sora"
            style={{
              fontSize: 56,
            }}
          >
            Need Help Right Now?
          </h2>

          <p
            style={{
              color: "rgba(255,255,255,.55)",
              marginTop: 18,
              fontSize: 18,
            }}
          >
            Our support team is ready to assist your business.
          </p>

          <button
            className="btn-main"
            style={{
              marginTop: 34,
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "18px 42px",
              borderRadius: 999,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Contact Support
          </button>
        </section>
      </main>
    </>
  );
}
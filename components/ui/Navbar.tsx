"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [pathname]);

  // Redirect logged-in users away from all public pages to dashboard
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (
      token &&
      !pathname.startsWith("/dashboard") &&
      pathname !== "/login" &&
      pathname !== "/signup"
    ) {
      router.replace("/dashboard");
    }
  }, [pathname, router]);

  // Hide on dashboard (has its own sidebar with logout)
  if (pathname.startsWith("/dashboard")) return null;

  // Hide on login and signup
  if (pathname === "/login" || pathname === "/signup") return null;

  const navLinks = [
    ["Home", "/"],
    ["Features", "/features"],
    ["Pricing", "/pricing"],
    ["Support", "/support"],
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(8,14,40,.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,.08)",
      }}
    >
      <div
        style={{
          maxWidth: 1300,
          margin: "0 auto",
          padding: "16px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
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
              color: "#fff",
              fontSize: 16,
            }}
          >
            AT
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>
              Acumen Teams
            </div>
            <div style={{ color: "rgba(255,255,255,.45)", fontSize: 11 }}>
              Productivity Platform
            </div>
          </div>
        </Link>

        {/* Nav Links */}
        <nav style={{ display: "flex", gap: 34, alignItems: "center" }}>
          {navLinks.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              style={{
                color: pathname === href ? "#ffffff" : "rgba(255,255,255,.65)",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: pathname === href ? 700 : 500,
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right Buttons — only shown when NOT logged in */}
        {!isLoggedIn && (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link
              href="/login"
              style={{
                color: "#fff",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
                height: 42,
                display: "flex",
                alignItems: "center",
                padding: "0 8px",
              }}
            >
              Login
            </Link>

            <Link
              href="/download"
              style={{
                background: "rgba(255,255,255,.08)",
                color: "#fff",
                textDecoration: "none",
                height: 42,
                padding: "0 20px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                border: "1px solid rgba(255,255,255,.08)",
              }}
            >
              Download
            </Link>

            <Link
              href="/signup"
              style={{
                background: "#2563eb",
                color: "#fff",
                textDecoration: "none",
                height: 42,
                padding: "0 22px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
              }}
            >
              Start Free
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

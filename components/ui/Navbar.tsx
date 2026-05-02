"use client";

import Image from "next/image";
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    setIsLoggedIn(false);
    router.push("/login");
  };

  const navLink = (href: string) => ({
    color: pathname === href ? "#ffffff" : "rgba(255,255,255,.65)",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: pathname === href ? 700 : 500,
    cursor: "pointer",
  });

  /* Hide public navbar after login pages like dashboard */
  if (isLoggedIn && pathname.startsWith("/dashboard")) {
    return null;
  }

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
            gap: 14,
            textDecoration: "none",
          }}
        >
          <Image
            src="/Group 3.png"
            alt="Acumen Teams"
            width={42}
            height={42}
          />

          <div>
            <h2 style={{ color: "#fff", margin: 0, fontSize: 17 }}>
              Acumen Teams
            </h2>

            <p
              style={{
                color: "rgba(255,255,255,.45)",
                margin: 0,
                fontSize: 11,
              }}
            >
              Productivity Platform
            </p>
          </div>
        </Link>

        {/* Nav Links */}
        <nav
          style={{
            display: "flex",
            gap: 34,
            alignItems: "center",
          }}
        >
          <Link href="/" style={navLink("/")}>
            Home
          </Link>

          <Link href="/features" style={navLink("/features")}>
            Features
          </Link>

          <Link href="/pricing" style={navLink("/pricing")}>
            Pricing
          </Link>

          <Link href="/support" style={navLink("/support")}>
            Support
          </Link>
        </nav>

        {/* Right Buttons */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          {!isLoggedIn ? (
            <>
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
                  justifyContent: "center",
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
                  justifyContent: "center",
                }}
              >
                Start Free
              </Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                height: 42,
                padding: "0 22px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Menu, X } from "lucide-react";

const SCROLL_LINKS = [
  { name: "Features", href: "features" },
  { name: "Platform", href: "platform" },
  { name: "Pricing", href: "pricing" },
  { name: "Roadmap", href: "roadmap" },
];

const PAGE_LINKS = [
  { name: "About", href: "/about" },
  { name: "Support", href: "/support" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(pathname !== "/");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(
    pathname === "/" ? "home" : pathname,
  );
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (pathname !== "/") {
      setScrolled(true);
      setActiveSection(pathname);
      return;
    }
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      // FIX: Force the underline back to "Home" when scrolled near the top
      if (window.scrollY < 300) {
        setActiveSection("home");
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  useEffect(() => {
    const sectionIds = SCROLL_LINKS.map((l) => l.href);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (href.startsWith("/#")) {
      e.preventDefault();
      const id = href.substring(2);
      if (pathname !== "/") {
        router.push(href);
      } else {
        const el = document.getElementById(id);
        if (el) window.scrollTo({ top: el.offsetTop - 76, behavior: "smooth" });
      }
      setMobileOpen(false);
    } else if (href === "/") {
      if (pathname === "/") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      setMobileOpen(false);
    } else {
      setMobileOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen
          ? "backdrop-blur-xl bg-white/95 border-b border-slate-200/80 shadow-[0_4px_30px_rgba(0,0,0,0.08)]"
          : "bg-transparent"
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, "/")}
            className="flex items-center gap-2.5 group cursor-pointer -ml-4 md:-ml-23 md:mr-6 shrink-0"
          >
            <div className="relative w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 ring-1 ring-white/40 flex items-center justify-center text-white font-bold text-sm shadow-[0_2px_10px_rgba(37,99,235,0.35)] group-hover:shadow-[0_4px_18px_rgba(37,99,235,0.5)] transition-shadow">
              <span className="relative z-10 tracking-tight">AT</span>
              <span className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/25 to-transparent" />
            </div>
            <span className="text-slate-900 font-bold text-lg leading-tight tracking-tight hidden sm:block whitespace-nowrap">
              Acumen <span className="font-semibold text-slate-500">Teams</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            {/* Home Button - Emphasized */}
            <Link
              href="/"
              onClick={(e) => handleNavClick(e, "/")}
              className={`group relative flex items-center gap-1.5 text-sm font-bold py-2 px-4 rounded-lg transition-colors mr-2 whitespace-nowrap ${
                activeSection === "home"
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-blue-600"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Home
              <span
                className={`absolute bottom-1 left-4 right-4 h-0.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all duration-300 ${
                  activeSection === "home"
                    ? "opacity-100 scale-x-100"
                    : "opacity-0 scale-x-0 group-hover:opacity-60 group-hover:scale-x-100"
                }`}
              />
            </Link>

            {SCROLL_LINKS.map((link) => {
              const isActive = activeSection === link.href;
              return (
                <Link
                  key={link.name}
                  href={`/#${link.href}`}
                  onClick={(e) => handleNavClick(e, `/#${link.href}`)}
                  className={`relative text-sm font-medium py-2 px-4 rounded-lg transition-colors group whitespace-nowrap ${
                    isActive
                      ? "text-blue-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {link.name === "Pricing" ? "Future Plans" : link.name}
                  <span
                    className={`absolute bottom-1 left-4 right-4 h-0.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all duration-300 ${
                      isActive
                        ? "opacity-100 scale-x-100"
                        : "opacity-0 scale-x-0 group-hover:opacity-60 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}

            {/* Vertical Barricade Divider */}
            <div className="hidden md:block h-6 w-px bg-slate-300 mx-3 rounded-full"></div>

            {PAGE_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`relative text-sm font-medium py-2 px-4 rounded-lg transition-colors group whitespace-nowrap ${
                    isActive
                      ? "text-blue-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {link.name}
                  <span
                    className={`absolute bottom-1 left-4 right-4 h-0.5 bg-blue-500 rounded-full transition-all duration-300 ${
                      isActive
                        ? "opacity-100 scale-x-100"
                        : "opacity-0 scale-x-0 group-hover:opacity-60 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3 md:ml-6 lg:ml-10 shrink-0 whitespace-nowrap">
            <Link
              href="/login"
              className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium px-3 py-2"
            >
              Login
            </Link>

            <Link href="/download">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-300 text-slate-700 hover:bg-slate-100 rounded-full px-4 gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </Link>

            <Link href="/signup">
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-full px-5 transition-all hover:scale-105 hover:shadow-[0_0_22px_rgba(37,99,235,0.4)] font-semibold"
              >
                Start Free
              </Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 -mr-2 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed inset-x-0 top-[64px] bottom-0 bg-white transition-all duration-300 ease-out ${
          mobileOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="h-full overflow-y-auto flex flex-col px-4 pt-2 pb-8">
          <div className="flex flex-col gap-1 pt-2">
            <Link
              href="/"
              onClick={(e) => handleNavClick(e, "/")}
              className={`flex items-center py-3.5 px-4 rounded-xl text-[15px] font-bold transition-colors ${
                activeSection === "home"
                  ? "text-blue-600 bg-blue-50"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Home
            </Link>
            {SCROLL_LINKS.map((link) => {
              const isActive = activeSection === link.href;
              return (
                <Link
                  key={link.name}
                  href={`/#${link.href}`}
                  onClick={(e) => handleNavClick(e, `/#${link.href}`)}
                  className={`flex items-center py-3.5 px-4 rounded-xl text-[15px] font-medium transition-colors ${
                    isActive
                      ? "text-blue-600 bg-blue-50 font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {link.name === "Pricing" ? "Future Plans" : link.name}
                </Link>
              );
            })}

            <div className="h-px bg-slate-100 my-2 mx-4" />

            {PAGE_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`flex items-center py-3.5 px-4 rounded-xl text-[15px] font-medium transition-colors ${
                    isActive
                      ? "text-blue-600 bg-blue-50 font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100 space-y-3">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center py-3 text-[15px] font-semibold text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Login
            </Link>
            <Link href="/download" onClick={() => setMobileOpen(false)}>
              <Button
                variant="outline"
                className="w-full rounded-full border-slate-300 gap-2 text-[15px] h-12"
              >
                <Download className="w-4 h-4" /> Download
              </Button>
            </Link>
            <Link href="/signup" onClick={() => setMobileOpen(false)}>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full font-semibold text-[15px] h-12">
                Start Free
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

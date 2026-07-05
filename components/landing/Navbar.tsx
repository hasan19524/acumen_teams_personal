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
  const [activeSection, setActiveSection] = useState(pathname === "/" ? "home" : pathname);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (pathname !== "/") {
      setScrolled(true);
      setActiveSection(pathname);
      return;
    }
    const handleScroll = () => setScrolled(window.scrollY > 20);
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
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

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
        scrolled
          ? "backdrop-blur-xl bg-white/85 border-b border-slate-200/80 shadow-[0_4px_30px_rgba(0,0,0,0.08)]"
          : "bg-transparent"
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link href="/" onClick={(e) => handleNavClick(e, "/")} className="flex items-center gap-3 group cursor-pointer">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-[0_0_20px_rgba(37,99,235,0.25)] group-hover:shadow-[0_0_28px_rgba(37,99,235,0.45)] transition-shadow">
              AT
            </div>
            <span className="text-slate-900 font-bold text-lg leading-tight hidden sm:block">
              Acumen Teams
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {/* Home Button - Emphasized */}
            <Link 
              href="/" 
              onClick={(e) => handleNavClick(e, "/")} 
              className={`text-sm font-bold py-2 px-4 rounded-lg transition-colors mr-2 ${
                activeSection === "home" || pathname === "/"
                  ? "bg-blue-50 text-blue-600" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
                  className={`relative text-sm font-medium py-2 px-4 rounded-lg transition-colors group ${
                    isActive ? "text-blue-600" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {link.name === "Pricing" ? "Future Plans" : link.name}
                  <span
                    className={`absolute bottom-1 left-4 right-4 h-0.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all duration-300 ${
                      isActive ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0 group-hover:opacity-60 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}

            {PAGE_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`relative text-sm font-medium py-2 px-4 rounded-lg transition-colors group ${
                    isActive ? "text-blue-600" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {link.name}
                  <span
                    className={`absolute bottom-1 left-4 right-4 h-0.5 bg-blue-500 rounded-full transition-all duration-300 ${
                      isActive ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0 group-hover:opacity-60 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
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
            className="md:hidden p-2 text-slate-700"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden mt-3 pb-4 border-t border-slate-200 pt-4 space-y-1 bg-white/95 backdrop-blur-sm rounded-b-2xl">
            <Link href="/" onClick={(e) => handleNavClick(e, "/")} className={`block py-2.5 px-4 rounded-xl text-sm font-bold transition-colors ${activeSection === "home" ? "text-blue-600 bg-blue-50" : "text-slate-600 hover:bg-slate-50"}`}>
              Home
            </Link>
            {SCROLL_LINKS.map((link) => {
              const isActive = activeSection === link.href;
              return (
                <Link
                  key={link.name}
                  href={`/#${link.href}`}
                  onClick={(e) => handleNavClick(e, `/#${link.href}`)}
                  className={`block py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? "text-blue-600 bg-blue-50 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {link.name === "Pricing" ? "Future Plans" : link.name}
                </Link>
              );
            })}
            {PAGE_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`block py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? "text-blue-600 bg-blue-50 font-semibold" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-slate-100 space-y-2 px-1">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 px-3 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Login
              </Link>
              <Link href="/download" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full rounded-full border-slate-300 gap-2 text-sm">
                  <Download className="w-4 h-4" /> Download
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full font-semibold text-sm">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

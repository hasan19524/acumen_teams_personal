"use client";

import Link from "next/link";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { Mail, Globe, MapPin, Phone, ExternalLink } from "lucide-react";

const footerLinks = {
  company: [
    { label: "About", href: "/about" },
    { label: "Support", href: "/support" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms & Conditions", href: "#" },
    { label: "Cancellation & Refund", href: "#" },
  ],
  product: [
    { label: "Features", href: "/#features", scroll: true },
    { label: "Platform", href: "/#platform", scroll: true },
    { label: "Future Plans", href: "/#pricing", scroll: true },
    { label: "Download", href: "/download" },
  ],
  ecosystem: [
    {
      label: "Acumen Teams",
      href: "/",
      badge: "Current",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    {
      label: "Acumen Travels",
      href: "https://acumentravels.com",
      external: true,
      badge: "Live",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    {
      label: "Acumen AI",
      href: "#",
      badge: "Coming Soon",
      badgeColor: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    },
  ],
};

export default function Footer() {
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@acumenteams.com";
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+15551234567";

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id.replace("#", ""));
    if (el) window.scrollTo({ top: el.offsetTop - 76, behavior: "smooth" });
  };

  return (
    <footer className="w-full bg-slate-950 text-[var(--heading)] border-t border-slate-800">
      <ScrollReveal>
        {/* Main Footer */}
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 lg:py-20">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-8">
            {/* Brand — spans 2 cols on all screens */}
            <div className="col-span-2 lg:col-span-2 mb-4 lg:mb-0">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-[var(--heading)] font-bold text-sm">
                  AT
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  Acumen Teams
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-6">
                Enterprise collaboration software created by Acumen, built on
                more than two decades of operational excellence.
              </p>
              <p className="text-slate-500 italic text-sm">
                Work Smarter. Lead Stronger.
              </p>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">
                Company
              </h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-[var(--heading)] transition-colors text-sm font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">
                Product
              </h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    {link.scroll ? (
                      <button
                        onClick={() => scrollToSection(link.href)}
                        className="text-slate-400 hover:text-[var(--heading)] transition-colors text-sm font-medium"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-slate-400 hover:text-[var(--heading)] transition-colors text-sm font-medium"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Ecosystem + Contact */}
            <div className="col-span-2 lg:col-span-1 space-y-8">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">
                  Acumen Ecosystem
                </h4>
                <ul className="space-y-3">
                  {footerLinks.ecosystem.map((link) => (
                    <li
                      key={link.label}
                      className="flex items-center gap-2.5 flex-wrap"
                    >
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-[var(--heading)] transition-colors text-sm font-medium flex items-center gap-1.5"
                        >
                          {link.label}
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-slate-400 hover:text-[var(--heading)] transition-colors text-sm font-medium"
                        >
                          {link.label}
                        </Link>
                      )}
                      {link.badge && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${link.badgeColor}`}
                        >
                          {link.badge}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Contact
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2.5 text-sm text-slate-400">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                    <a
                      href={`mailto:${supportEmail}`}
                      className="hover:text-[var(--heading)] transition-colors"
                    >
                      {supportEmail}
                    </a>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-slate-400">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                    <a
                      href={`tel:${supportPhone.replace(/\s/g, "")}`}
                      className="hover:text-[var(--heading)] transition-colors"
                    >
                      {supportPhone}
                    </a>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm text-slate-400">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-500 mt-0.5" />
                    <span>
                      J-41, A Abdul Fazal Enclave, Thokar No. 4, Jamia Nagar,
                      Okhla, New Delhi, Delhi – 110025
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800">
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © 2026 Acumen Teams. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="#"
                className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/support"
                className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </footer>
  );
}

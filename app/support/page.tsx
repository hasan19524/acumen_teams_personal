"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { Mail, Phone, MapPin, Send, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function SupportPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  // Pulling from .env file
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@acumenteams.com";
  const supportPhone =
    process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+1 (555) 123-4567";
  const supportAddress =
    process.env.NEXT_PUBLIC_SUPPORT_ADDRESS ||
    "123 Tech Street, San Francisco, CA 94105, USA";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true); // Acts as loading state
    try {
      const res = await fetch(`${apiUrl}/api/support/contact/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setFormData({ name: "", email: "", subject: "", message: "" });
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        alert(data.error || "Failed to send message.");
        setSubmitted(false);
      }
    } catch (err) {
      alert("Network error. Please try again.");
      setSubmitted(false);
    }
  };

  const faqs = [
    {
      question: "How do I get started with Acumen Teams?",
      answer:
        "Sign up for a free account — no credit card required. You can create a workspace, invite team members, and start communicating within minutes.",
    },
    {
      question: "What is included in the free plan?",
      answer:
        "The free plan includes up to 10 team members, workspace messaging, basic task management, 5 GB of file storage, and email support. You can upgrade anytime.",
    },
    {
      question: "Can I invite people from outside my organization?",
      answer:
        "Yes. You can invite external collaborators via workspace invitations. Role-based permissions let you control exactly what they can access.",
    },
    {
      question: "Is my data secure?",
      answer:
        "We use secure JWT authentication, role-based access control, and workspace isolation to ensure your data is protected and only accessible to authorized members.",
    },
    {
      question: "Do you offer API access for developers?",
      answer:
        "API access is available on Growth and Enterprise plans. We are working on comprehensive developer documentation.",
    },
    {
      question: "What are your support response times?",
      answer:
        "Free plan users receive email support within 24 hours. Starter users within 12 hours. Growth and Enterprise customers receive priority support with guaranteed response times.",
    },
    {
      question: "Can I migrate from another platform?",
      answer:
        "Our support team can assist with migration from other collaboration tools. Reach out to us directly and we'll guide you through the process.",
    },
  ];

  return (
    <main className="min-h-screen bg-white overflow-x-clip">
      <Navbar />

      {/* HERO */}
      <section className="relative w-full min-h-[500px] flex items-center overflow-hidden pt-24 pb-20 bg-gradient-to-br from-slate-900 via-teal-900 to-slate-950">
        <div className="absolute inset-0 opacity-35">
          <div className="absolute top-1/4 right-0 w-[450px] h-[450px] bg-cyan-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-teal-500 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 rounded-full mb-8 border border-cyan-500/30 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-cyan-300">
                We're here whenever you need us
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Support & Contact
            </h1>

            <p className="text-lg sm:text-xl text-cyan-100/80 leading-relaxed max-w-2xl">
              Have a question? Need help with setup? Want to explore Enterprise
              pricing? Reach out — our team responds quickly.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 mt-10">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Mail className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <p className="text-xs text-cyan-300/70 font-medium mb-0.5">
                    Email us
                  </p>
                  <p className="text-white font-semibold text-sm">
                    {supportEmail}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Phone className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <p className="text-xs text-cyan-300/70 font-medium mb-0.5">
                    Call us
                  </p>
                  <p className="text-white font-semibold text-sm">
                    {supportPhone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORM + CONTACT INFO */}
      <section className="w-full py-20 lg:py-28 bg-gradient-to-b from-white to-slate-50">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14 mb-20">
            {/* CONTACT FORM */}
            <ScrollReveal className="lg:col-span-2">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-lg hover:shadow-2xl transition-shadow p-8 lg:p-12">
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                  Get in Touch
                </h2>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Our team responds within 24 hours. For urgent matters, call us
                  directly.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Jane Smith"
                      className="w-full px-4 py-3.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="jane@company.com"
                      className="w-full px-4 py-3.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      placeholder="How can we help?"
                      className="w-full px-4 py-3.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Message *
                    </label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder="Tell us more about your inquiry..."
                      rows={5}
                      className="w-full px-4 py-3.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400 resize-none text-sm"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitted}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
                  >
                    {submitted ? "Sending..." : "Send Message"}
                    {!submitted && <Send className="w-4 h-4" />}
                  </Button>

                  {submitted && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <p className="text-emerald-800 font-semibold text-sm">
                        ✓ Message sent. We'll get back to you within 24 hours.
                      </p>
                    </div>
                  )}
                </form>
              </div>
            </ScrollReveal>

            {/* CONTACT INFO */}
            <ScrollReveal delay={100}>
              <div className="space-y-5">
                {[
                  {
                    icon: Mail,
                    title: "Email Support",
                    sub: "Response within 24 hours",
                    value: supportEmail,
                    href: `mailto:${supportEmail}`,
                    iconBg: "bg-blue-100",
                    iconColor: "text-blue-600",
                  },
                  {
                    icon: Phone,
                    title: "Phone Support",
                    sub: "Mon–Fri, 9 AM – 6 PM IST",
                    value: supportPhone,
                    href: `tel:${supportPhone.replace(/\s/g, "")}`,
                    iconBg: "bg-emerald-100",
                    iconColor: "text-emerald-600",
                  },
                  {
                    icon: MapPin,
                    title: "Office Address",
                    sub: "",
                    value: supportAddress,
                    href: null,
                    iconBg: "bg-cyan-100",
                    iconColor: "text-cyan-600",
                  },
                ].map((contact, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-slate-200 p-7 hover:shadow-lg transition-shadow group"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${contact.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <contact.icon
                        className={`w-6 h-6 ${contact.iconColor}`}
                      />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      {contact.title}
                    </h3>
                    {contact.sub && (
                      <p className="text-slate-500 text-xs mb-3">
                        {contact.sub}
                      </p>
                    )}
                    {contact.href ? (
                      <Link
                        href={contact.href}
                        className={`${contact.iconColor} hover:opacity-80 font-semibold text-sm transition-opacity`}
                      >
                        {contact.value}
                      </Link>
                    ) : (
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {contact.value}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* FAQ */}
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-12">
                <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-5">
                  Frequently Asked Questions
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Answers to common questions about the platform, plans, and
                  support.
                </p>
              </div>
            </ScrollReveal>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <ScrollReveal key={i} delay={i * 40}>
                  <div className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
                    <button
                      onClick={() =>
                        setExpandedFaq(expandedFaq === i ? null : i)
                      }
                      className="w-full p-6 lg:p-7 text-left flex items-center justify-between gap-4 group"
                    >
                      <h3 className="text-base lg:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {faq.question}
                      </h3>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 group-hover:text-blue-600 flex-shrink-0 transition-all duration-300 ${
                          expandedFaq === i ? "rotate-180 text-blue-600" : ""
                        }`}
                      />
                    </button>

                    {expandedFaq === i && (
                      <div className="px-6 lg:px-7 pb-6 lg:pb-7 border-t border-slate-100">
                        <p className="text-slate-600 text-sm lg:text-base leading-relaxed pt-4">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

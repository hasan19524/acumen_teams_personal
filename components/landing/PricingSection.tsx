"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { CheckSquare } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "Current Plan",
    description: "For small teams getting started.",
    features: [
      "Up to 10 members",
      "Workspace messaging",
      "Basic task management",
      "5 GB file storage",
      "Email support",
    ],
  },
  {
    name: "Starter",
    price: "Coming Soon",
    period: "",
    description: "For growing teams that need more room.",
    features: [
      "Up to 50 members",
      "Advanced messaging & threads",
      "Full task management",
      "50 GB storage",
      "Attendance tracking",
      "Priority support",
    ],
  },
  {
    name: "Growth",
    price: "Coming Soon",
    period: "",
    description: "For organizations scaling fast.",
    featured: true,
    features: [
      "Unlimited members",
      "All platform features",
      "Multi-workspace management",
      "500 GB storage",
      "Advanced analytics",
      "24/7 support",
      "Role-based access controls",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "Contact Us",
    description: "For enterprises that need it all.",
    features: [
      "Everything in Growth",
      "Custom integrations",
      "Unlimited storage",
      "Dedicated account manager",
      "SLA guarantees",
      "Custom onboarding",
      "Audit logs & compliance",
    ],
  },
];

export default function PricingSection() {
  return (
    <section
      id="pricing"
      className="w-full py-20 lg:py-28 relative bg-gradient-to-b from-white to-slate-50"
    >
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <ScrollReveal>
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/80 rounded-full mb-6 border border-blue-200">
              <span className="text-sm font-semibold text-blue-700">
                Flexible Plans
              </span>
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-5">
              Future Plans & Enterprise
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              We are finalizing our pricing tiers. Until then, the platform is
              free to use. Explore our planned structures below.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
          {plans.map((plan, i) => (
            <ScrollReveal key={i} delay={i * 90}>
              <div
                className={`relative rounded-2xl border transition-all duration-300 hover:-translate-y-2 h-full flex flex-col ${
                  plan.featured
                    ? "bg-gradient-to-b from-blue-500/10 to-cyan-500/10 border-blue-300 shadow-2xl ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-xl"
                }`}
              >
                {plan.featured && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-2xl" />
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-[var(--heading)] text-xs rounded-full font-bold shadow-lg whitespace-nowrap">
                      Most Popular
                    </div>
                  </>
                )}

                <div className="p-7 lg:p-8 flex-1 flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-slate-500">{plan.description}</p>
                  </div>

                  <div className="mb-7">
                    <span
                      className={`text-2xl font-bold ${plan.featured ? "text-blue-600" : "text-slate-900"}`}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-slate-500 text-sm ml-2">
                        {plan.period}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-3 text-sm text-slate-600"
                      >
                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <CheckSquare className="w-2.5 h-2.5 text-blue-600" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href="/signup" className="w-full">
                    <Button
                      className={`w-full rounded-xl py-2.5 font-semibold transition-all hover:scale-[1.02] text-sm ${
                        plan.featured
                          ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-[var(--heading)]"
                          : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                      }`}
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ))}
          <ScrollReveal delay={200}>
            <p className="text-center text-sm text-slate-400 mt-12 italic">
              Illustrative pricing. Final plans and feature sets are subject to
              change.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

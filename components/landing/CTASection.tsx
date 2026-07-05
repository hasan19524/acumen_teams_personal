"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="w-full py-20 lg:py-28 relative bg-white">
      <div className="w-full max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
        <ScrollReveal>
          <div className="text-center">
            <h2 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6">
              Ready to bring your team together?
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              Thousands of teams use Acumen Teams to communicate clearly, manage work, and stay organized — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-8 py-6 text-base lg:text-lg rounded-full font-semibold transition-all hover:scale-105 hover:shadow-[0_20px_40px_rgba(6,182,212,0.25)] group"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full sm:w-auto border-2 border-slate-300 text-slate-700 hover:bg-slate-100 px-8 py-6 text-base lg:text-lg rounded-full font-semibold"
              >
                View Pricing
              </Button>
            </div>

            <p className="text-sm text-slate-400 mt-8">
              No credit card required. Free plan available forever.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  getRandomQuote,
  getGreeting,
  updateLastActiveTime,
} from "@/lib/content";

interface WelcomeExperienceProps {
  isBackendReady: boolean;
  onFinished: () => void;
}

export default function WelcomeExperience({
  isBackendReady,
  onFinished,
}: WelcomeExperienceProps) {
  const [quote] = useState(getRandomQuote());
  const [greeting] = useState(getGreeting());
  const [isExiting, setIsExiting] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  // The 1-second disappearing animation
  const startExit = () => {
    if (isExiting) return;
    updateLastActiveTime();
    setIsExiting(true);
    setTimeout(() => {
      onFinished();
    }, 1000); // 1 second fade out
  };

  const handleEnterDashboard = () => {
    if (isBackendReady) {
      startExit();
    } else {
      // If backend isn't ready, start waiting and show the spinner
      setIsWaiting(true);
    }
  };

  // Auto-start the exit the moment the backend becomes ready (if the user already clicked)
  useEffect(() => {
    if (isWaiting && isBackendReady) {
      startExit();
    }
  }, [isWaiting, isBackendReady]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg)] transition-all duration-1000 ${
        isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}
    >
      <div
        className={`text-center px-6 w-full max-w-2xl transition-all duration-1000 ${
          isExiting ? "opacity-0 -translate-y-4" : "opacity-100 translate-y-0"
        }`}
      >
        <div
          className="flex items-center justify-center gap-3 mb-10 sm:mb-12 animate-fade-in-up"
          style={{ animationDelay: "0s" }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-[var(--heading)] font-bold text-sm shadow-lg flex-shrink-0">
            AT
          </div>
          <span className="text-lg sm:text-xl font-bold text-[var(--heading)] tracking-tight">
            Acumen Teams
          </span>
        </div>

        <h1
          className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[var(--heading)] mb-3 sm:mb-4 tracking-tight animate-fade-in-up break-words"
          style={{ animationDelay: "0.8s" }}
        >
          {greeting}
        </h1>

        <div className="flex flex-col items-center justify-center">
          <p
            className="text-xs sm:text-sm uppercase tracking-widest mb-4 animate-fade-in-up"
            style={{ animationDelay: "1.6s", color: "var(--text-muted)" }}
          >
            Quote of the Day
          </p>
          <p
            className="text-sm sm:text-lg md:text-xl font-medium italic animate-fade-in-up break-words"
            style={{ animationDelay: "2.4s", color: "var(--text-secondary)" }}
          >
            "{quote.quote}"
          </p>
          <p
            className="text-xs sm:text-sm mt-3 animate-fade-in-up"
            style={{ animationDelay: "3.2s", color: "var(--text-muted)" }}
          >
            - {quote.author}
          </p>
        </div>

        <div className="mt-10 sm:mt-16 h-10 flex items-center justify-center">
          <button
            onClick={handleEnterDashboard}
            disabled={isWaiting}
            className="px-6 sm:px-8 py-2.5 bg-[var(--brand)] text-[var(--heading)] rounded-lg font-semibold hover:bg-[var(--brand-hover)] transition-all animate-fade-in-up text-sm sm:text-base flex items-center gap-2 disabled:cursor-not-allowed"
            style={{ animationDelay: "4.0s" }}
          >
            {isWaiting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Preparing Workspace...
              </>
            ) : (
              "Let's Go"
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          opacity: 0;
          /* 1.2s duration ensures the last element (delay 4.0s) finishes smoothly */
          animation: fadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

// lib/content.ts
import greetingsData from "@/content/greetings.json";
import quotesData from "@/content/quotes.json";
import festivalsData from "@/content/festivals.json";

// Typecast JSON imports to fix strict TypeScript indexing errors
const greetings = greetingsData as { [key: string]: string[] };
const quotes = quotesData as { quote: string; author: string }[];
const festivals = festivalsData as { [key: string]: string };

// Configurable inactivity threshold
export const WELCOME_THRESHOLD_HOURS = 4;

export function shouldShowWelcome(): boolean {
  if (typeof window === "undefined") return false;

  // 1. Check if it's a fresh login (set by login page)
  const freshLogin = sessionStorage.getItem("show_welcome");
  if (freshLogin === "true") {
    sessionStorage.removeItem("show_welcome"); // Only show once per login action
    return true;
  }

  // 2. Check inactivity threshold for returning users
  const lastActive = localStorage.getItem("last_active_time");
  if (!lastActive) return true; // First time ever

  const diff = Date.now() - parseInt(lastActive, 10);
  const hoursPassed = diff / (1000 * 60 * 60);

  return hoursPassed >= WELCOME_THRESHOLD_HOURS;
}

export function updateLastActiveTime() {
  if (typeof window !== "undefined") {
    localStorage.setItem("last_active_time", Date.now().toString());
  }
}

export function getGreeting(): string {
  const now = new Date();
  const monthDay = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  if (festivals[monthDay]) {
    return festivals[monthDay];
  }

  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getHours();

  let timeOfDay: "morning" | "afternoon" | "evening";
  if (hour < 12) timeOfDay = "morning";
  else if (hour < 18) timeOfDay = "afternoon";
  else timeOfDay = "evening";

  if (day === 0 || day === 6) {
    const weekendGreetings = greetings.weekend;
    return weekendGreetings[
      Math.floor(Math.random() * weekendGreetings.length)
    ];
  }

  const timeGreetings = greetings[timeOfDay];
  return timeGreetings[Math.floor(Math.random() * timeGreetings.length)];
}

export function getRandomQuote(): { quote: string; author: string } {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

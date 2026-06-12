import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "@/features/notification/components/NotificationProvider";
import { NotificationInitializer } from "@/features/notification/components/NotificationInitializer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Acumen Teams - Work Smarter. Lead Stronger.",
  description:
    "Chat, tasks, attendance, announcements and productivity tools. All in one place.",
  keywords: ["team collaboration", "productivity", "chat", "tasks", "attendance"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

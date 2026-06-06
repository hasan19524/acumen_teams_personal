import type { Metadata } from "next";
import "./globals.css";
import { NotificationProvider } from "@/features/notification/components/NotificationProvider";
import { NotificationInitializer } from "@/features/notification/components/NotificationInitializer";

export const metadata: Metadata = {
  title: "Acumen Teams",
  description: "Business Collaboration Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NotificationProvider>
          <NotificationInitializer />
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}

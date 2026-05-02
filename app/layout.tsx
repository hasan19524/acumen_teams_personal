import "./globals.css";

export const metadata = {
  title: "Acumen Teams",
  description: "Productivity Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
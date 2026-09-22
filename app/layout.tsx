import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PingLink — Message me, not my number",
  description:
    "Get a personal contact URL and receive two-way messages without giving out your phone number or email.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

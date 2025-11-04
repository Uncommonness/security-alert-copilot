import type { Metadata } from "next";
import "./globals.css";
// ClientShell moved into locale layout so NextIntlClientProvider can wrap it

export const metadata: Metadata = {
  title: "Security Alert Copilot",
  description: "Security Alert Copilot - AI-powered security assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="light" suppressHydrationWarning>
  <body className="bg-gray-50 text-slate-900">{children}</body>
    </html>
  );
}

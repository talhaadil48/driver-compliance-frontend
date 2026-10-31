import type { Metadata } from "next";
import "./globals.css";
import MainLayout from "@/components/MainLayout";

export const metadata: Metadata = {
  title: "Drivers Compliance Hub | Staff Portal",
  description: "Private internal drivers compliance, document management, and expiry tracking system for company staff only.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 dark:bg-slate-950 font-sans">
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}

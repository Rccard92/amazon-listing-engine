import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AppShell } from "@/components/layout/app-shell";
import { TopNav } from "@/components/layout/top-nav";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Amazon Listing Engine",
  description:
    "Piattaforma per generare e ottimizzare inserzioni Amazon con workflow guidati e ingestion strutturata.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <TopNav />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}


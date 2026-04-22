import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { TopNav } from "@/components/layout/top-nav";

import "./globals.css";

export const metadata: Metadata = {
  title: "Amazon Listing Engine — ottimizza le tue inserzioni",
  description:
    "Crea e migliora schede prodotto Amazon con percorsi guidati, spiegazioni chiare e strumenti per parole chiave e confronto con i concorrenti.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="min-h-screen font-sans antialiased">
        <TopNav />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}


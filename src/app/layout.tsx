import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import AppHeader from "@/components/AppHeader";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "QuestPilot — AI Gaming Companion",
  description:
    "Anti-spoiler, genre-adaptive AI companion with a dedicated workspace for every game.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.10),transparent_55%)] text-zinc-100 antialiased`}
      >
        <LanguageProvider>
          <AppHeader />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import SettingsModal from "@/components/settings/SettingsModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NavTagline from "@/components/NavTagline";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuestPilot — AI Gaming Companion",
  description: "Anti-spoiler, genre-adaptive AI companion with a dedicated workspace for every game.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <nav className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
              <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
                <Compass className="h-5 w-5 text-amber-400" />
                Quest<span className="text-amber-400">Pilot</span>
              </Link>
              <div className="flex items-center gap-3">
                <NavTagline />
                <LanguageSwitcher />
                <SettingsModal />
              </div>
            </div>
          </nav>
          <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}

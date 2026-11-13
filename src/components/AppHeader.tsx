"use client";

import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function AppHeader() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-emerald-400 text-zinc-950 shadow-lg shadow-amber-500/20 transition-transform duration-200 group-hover:scale-105">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5z" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold tracking-tight text-zinc-50">
              QuestPilot
            </span>
            <span className="block text-[11px] font-medium uppercase tracking-widest text-emerald-400/90">
              {t("tagline")}
            </span>
          </span>
        </Link>

        <LanguageSwitcher />
      </div>
    </header>
  );
}

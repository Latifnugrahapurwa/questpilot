"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className="inline-flex items-center rounded-md border border-zinc-800 bg-zinc-900 p-0.5 text-xs font-semibold"
      role="group"
      aria-label="Language"
    >
      {(["en", "id"] as const).map((l) => {
        const active = lang === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={active}
            className={`rounded px-2.5 py-1 transition-colors ${
              active
                ? "bg-amber-400 text-zinc-950"
                : "text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

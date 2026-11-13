"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className="inline-flex items-center rounded-full border border-zinc-700/70 bg-zinc-900/70 p-0.5 text-xs font-semibold shadow-inner"
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
            className={`rounded-full px-3 py-1 transition-all duration-200 ${
              active
                ? "bg-amber-400 text-zinc-950 shadow"
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

"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const base = "px-2 py-1 text-xs rounded transition-colors";
  return (
    <div className="inline-flex gap-1 rounded-md border border-zinc-700 p-0.5">
      {(["en", "id"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`${base} ${
            lang === l
              ? "bg-amber-500 text-zinc-900"
              : "text-zinc-400 hover:text-zinc-100"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

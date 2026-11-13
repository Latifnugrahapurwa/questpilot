"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { dictionary, type Lang, type TextKey } from "./dictionary";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: TextKey) => string;
};

const LanguageContext = createContext<Ctx>({
  lang: "en",
  setLang: () => {},
  t: (k) => dictionary.en[k],
});

function persist(l: Lang) {
  try {
    localStorage.setItem("lang", l);
  } catch {}
  document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = l;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Baca pilihan tersimpan saat pertama kali dibuka
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "id" || saved === "en") {
        setLangState(saved);
        persist(saved);
      } else {
        persist("en");
      }
    } catch {
      persist("en");
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    persist(l);
  };

  const t = (k: TextKey) => dictionary[lang][k];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);

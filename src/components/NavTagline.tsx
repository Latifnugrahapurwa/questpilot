"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function NavTagline() {
  const { t } = useLanguage();
  return (
    <span className="hidden text-xs text-zinc-500 sm:inline">{t("tagline")}</span>
  );
}

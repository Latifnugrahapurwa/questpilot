"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function NavManageLink() {
  const { t } = useLanguage();
  return (
    <Link
      href="/manage"
      className="rounded-md px-2 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
    >
      {t("manageGames")}
    </Link>
  );
}

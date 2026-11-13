"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Game = {
  id?: string | number;
  slug?: string;
  name?: string;
  title?: string;
  [key: string]: unknown;
};

export default function ManageGamesPage() {
  const { t } = useLanguage();
  const [games, setGames] = useState<Game[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const keyOf = (g: Game) => String(g.id ?? g.slug ?? "");
  const labelOf = (g: Game) => g.name ?? g.title ?? g.slug ?? "—";

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/manage-games", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "error");
      setGames(json.games as Game[]);
    } catch (e) {
      setError(`${t("loadFailed")} ${e instanceof Error ? e.message : ""}`);
      setGames([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(g: Game) {
    if (!window.confirm(`${labelOf(g)}\n\n${t("confirmDelete")}`)) return;
    setBusyKey(keyOf(g));
    setError(null);
    try {
      const res = await fetch("/api/manage-games", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: g.id, slug: g.slug }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "error");
      setGames((prev) => (prev ?? []).filter((x) => keyOf(x) !== keyOf(g)));
    } catch (e) {
      setError(`${t("deleteFailed")} ${e instanceof Error ? e.message : ""}`);
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToLibrary")}
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">{t("manageTitle")}</h1>
      <p className="mt-1 text-sm text-zinc-400">{t("manageSubtitle")}</p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-2">
        {games === null && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("loading")}
          </div>
        )}

        {games !== null && games.length === 0 && !error && (
          <p className="text-sm text-zinc-500">{t("noGamesManage")}</p>
        )}

        {games?.map((g) => {
          const busy = busyKey === keyOf(g);
          return (
            <div
              key={keyOf(g)}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-zinc-100">{labelOf(g)}</p>
                {g.slug && (
                  <p className="truncate text-xs text-zinc-500">/game/{g.slug}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(g)}
                disabled={busy}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-1.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-900/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {busy ? t("deleting") : t("deleteGame")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

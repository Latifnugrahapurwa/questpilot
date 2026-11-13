"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search, X } from "lucide-react";
import type { RawgSearchResult } from "@/lib/types";
import { keyHeaders } from "@/lib/keys";

export default function AddGameModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RawgSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/games/search?q=${encodeURIComponent(query)}`, { headers: keyHeaders() });
        const json = await res.json();
        setResults(json.results ?? []);
        setError(json.error ?? null);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  async function create(title: string, rawgId?: number) {
    setCreating(title);
    setError(null);
    try {
      const res = await fetch("/api/games/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...keyHeaders() },
        body: JSON.stringify({ title, rawgId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create game");
      setOpen(false);
      router.push(`/game/${json.slug}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setCreating(null);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
      >
        <Plus className="h-4 w-4" /> Add Game
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-24" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Add a game</h2>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any game…"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-500"
              />
              {searching && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-zinc-500" />}
            </div>

            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

            <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    disabled={!!creating}
                    onClick={() => create(r.name, r.id)}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {r.background_image ? <img src={r.background_image} alt="" className="h-10 w-16 rounded object-cover" /> : <div className="h-10 w-16 rounded bg-zinc-800" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <p className="truncate text-xs text-zinc-500">
                        {[r.released?.slice(0, 4), r.genres.join(", ")].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {creating === r.name && <Loader2 className="h-4 w-4 animate-spin text-amber-400" />}
                  </button>
                </li>
              ))}
              {query.trim().length >= 2 && !searching && (
                <li>
                  <button
                    disabled={!!creating}
                    onClick={() => create(query.trim())}
                    className="w-full rounded-lg border border-dashed border-zinc-700 p-2 text-left text-xs text-zinc-400 hover:border-amber-500 disabled:opacity-50"
                  >
                    {creating === query.trim() ? "Generating workspace…" : `Can't find it? Add "${query.trim()}" manually`}
                  </button>
                </li>
              )}
            </ul>
            {creating && <p className="mt-3 text-xs text-amber-300">Generating a custom workspace with AI… this takes a few seconds.</p>}
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { Check, Loader2 } from "lucide-react";
import type { ProgressField } from "@/lib/types";

type Props = {
  title: string;
  cover: string | null;
  genres: string[];
  fields: ProgressField[];
  saving: boolean;
  onChange: (fields: ProgressField[]) => void;
};

export default function ProgressHeader({ title, cover, genres, fields, saving, onChange }: Props) {
  return (
    <header className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-15" />
      )}
      <div className="relative p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            <div className="mt-1 flex flex-wrap gap-1">
              {genres.map((g) => (
                <span key={g} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-emerald-300">
                  {g}
                </span>
              ))}
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-emerald-400" />}
            {saving ? "Saving…" : "Saved"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {fields.map((f, i) => (
            <label key={f.key} className="block">
              <span className="text-[11px] uppercase tracking-wide text-amber-400">{f.label}</span>
              <input
                value={f.value}
                placeholder={f.placeholder}
                onChange={(e) => onChange(fields.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950/80 px-2 py-1.5 text-sm outline-none focus:border-amber-500"
              />
            </label>
          ))}
        </div>
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import { ExternalLink, X } from "lucide-react";
import type { VisualImage } from "@/lib/types";

export default function VisualImageGrid({ images, query }: { images: VisualImage[]; query?: string }) {
  const [active, setActive] = useState<VisualImage | null>(null);
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const visible = images.filter((i) => !broken.has(i.url));
  if (!visible.length) return null;

  return (
    <div className="my-3">
      {query && <p className="mb-1 text-[11px] text-zinc-500">Visual references: {query}</p>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {visible.map((img) => (
          <button key={img.url} onClick={() => setActive(img)} className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setBroken((s) => new Set(s).add(img.url))}
              className="aspect-video w-full object-cover transition group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setActive(null)}>
          <button className="absolute right-4 top-4" aria-label="Close">
            <X className="h-6 w-6" />
          </button>
          <div className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.url} alt={active.title} referrerPolicy="no-referrer" className="max-h-[80vh] rounded-lg object-contain" />
            <a href={active.link} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
              <ExternalLink className="h-3 w-3" /> {active.source || "Source"} — {active.title}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

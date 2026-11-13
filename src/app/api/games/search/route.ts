import { NextResponse } from "next/server";
import { getRawgKey } from "@/lib/ai/model";

type Result = { id: number; name: string; background_image: string | null; genres: string[]; released: string | null; source: "rawg" | "steam" };

async function searchRawg(key: string, q: string): Promise<Result[]> {
  const res = await fetch(
    `https://api.rawg.io/api/games?key=${encodeURIComponent(key)}&search=${encodeURIComponent(q)}&page_size=8&search_precise=true`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail || body?.error || res.statusText;
    throw new Error(`RAWG ${res.status}: ${detail}`);
  }
  const json = await res.json();
  return (json.results ?? []).map((g: any) => ({
    id: g.id,
    name: g.name,
    background_image: g.background_image ?? null,
    genres: (g.genres ?? []).map((x: any) => x.name),
    released: g.released ?? null,
    source: "rawg" as const,
  }));
}

// Keyless fallback so adding games still works when RAWG is unavailable (Steam catalog only).
async function searchSteam(q: string): Promise<Result[]> {
  const res = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=US`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Steam ${res.status}`);
  const json = await res.json();
  return (json.items ?? []).slice(0, 8).map((i: any) => ({
    id: i.id,
    name: i.name,
    background_image: `https://cdn.akamai.steamstatic.com/steam/apps/${i.id}/header.jpg`,
    genres: [],
    released: null,
    source: "steam" as const,
  }));
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  const key = getRawgKey(req);
  let rawgProblem = "RAWG API key belum diisi (Pengaturan).";

  if (key) {
    try {
      return NextResponse.json({ results: await searchRawg(key, q) });
    } catch (e) {
      rawgProblem = e instanceof Error ? e.message : "RAWG tidak bisa diakses";
    }
  }

  try {
    const results = await searchSteam(q);
    return NextResponse.json({ results, notice: `${rawgProblem} Menampilkan hasil dari Steam (tanpa genre).` });
  } catch {
    return NextResponse.json({ results: [], error: `${rawgProblem} Pencarian cadangan (Steam) juga gagal.` }, { status: 502 });
  }
}

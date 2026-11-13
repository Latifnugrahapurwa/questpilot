import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });
  const key = process.env.RAWG_API_KEY;
  if (!key) return NextResponse.json({ results: [], error: "RAWG_API_KEY missing" }, { status: 500 });

  const res = await fetch(
    `https://api.rawg.io/api/games?key=${key}&search=${encodeURIComponent(q)}&page_size=8&search_precise=true`,
    { cache: "no-store" },
  );
  if (!res.ok) return NextResponse.json({ results: [] }, { status: 502 });
  const json = await res.json();

  const results = (json.results ?? []).map((g: any) => ({
    id: g.id,
    name: g.name,
    background_image: g.background_image ?? null,
    genres: (g.genres ?? []).map((x: any) => x.name),
    released: g.released ?? null,
  }));
  return NextResponse.json({ results });
}

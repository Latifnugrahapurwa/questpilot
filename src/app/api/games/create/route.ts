import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getGeminiKey, getModel, getRawgKey } from "@/lib/ai/model";
import { workspaceConfigSchema } from "@/lib/ai/schemas";
import { WORKSPACE_GENERATION_SYSTEM } from "@/lib/ai/prompts";
import { slugify } from "@/lib/utils";
import type { WorkspaceConfig } from "@/lib/types";

export const maxDuration = 60;

type RawgInfo = { id: number | null; name: string; cover: string | null; genres: string[]; description: string };

async function fetchRawg(key: string, title: string, rawgId?: number): Promise<RawgInfo> {
  const fallback: RawgInfo = { id: rawgId ?? null, name: title, cover: null, genres: [], description: "" };
  if (!key) return fallback;
  try {
    let id = rawgId;
    if (!id) {
      const s = await fetch(`https://api.rawg.io/api/games?key=${encodeURIComponent(key)}&search=${encodeURIComponent(title)}&page_size=1`);
      id = (await s.json())?.results?.[0]?.id;
    }
    if (!id) return fallback;
    const d = await (await fetch(`https://api.rawg.io/api/games/${id}?key=${encodeURIComponent(key)}`)).json();
    return {
      id,
      name: d.name ?? title,
      cover: d.background_image ?? null,
      genres: (d.genres ?? []).map((g: any) => g.name),
      description: (d.description_raw ?? "").slice(0, 1200),
    };
  } catch {
    return fallback;
  }
}

export async function POST(req: Request) {
  try {
    const { title, rawgId, cover } = (await req.json()) as { title?: string; rawgId?: number; cover?: string };
    if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
    if (!getGeminiKey(req)) {
      return NextResponse.json({ error: "Gemini API key belum diisi. Buka Pengaturan (ikon gear) di navbar." }, { status: 400 });
    }

    const supabase = await createClient();
    const info = await fetchRawg(getRawgKey(req), title.trim(), rawgId);
    const slug = slugify(info.name);

    const { data: existing } = await supabase.from("games").select("slug").eq("slug", slug).maybeSingle();
    if (existing) return NextResponse.json({ slug: existing.slug, existed: true });

    const { object } = await generateObject({
      model: await getModel(req),
      schema: workspaceConfigSchema,
      system: WORKSPACE_GENERATION_SYSTEM,
      prompt: `Game: ${info.name}\nGenres: ${info.genres.join(", ") || "unknown"}\nDescription: ${info.description || "n/a"}`,
    });

    const config: WorkspaceConfig = {
      persona: object.persona,
      progress_fields: object.progress_fields.map((f) => ({ ...f, value: "" })),
      quick_actions: object.quick_actions,
      starter_checklist: object.starter_checklist.map((c, i) => ({ id: `c${i + 1}`, text: c.text, completed: false })),
    };

    const { error } = await supabase.from("games").insert({
      slug,
      title: info.name,
      rawg_id: info.id,
      cover_image: info.cover ?? cover ?? null,
      genres: info.genres,
      workspace_config: config,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ slug });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}

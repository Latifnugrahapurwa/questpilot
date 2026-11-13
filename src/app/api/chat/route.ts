import { convertToModelMessages, stepCountIs, streamText, tool, type LanguageModel, type UIMessage } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { aiConfigError, getAiConfig, getModel, getSerperKey } from "@/lib/ai/model";
import { buildCompanionSystemPrompt } from "@/lib/ai/prompts";
import { getLanguageInstruction } from "@/lib/i18n/server";
import type { Game, StoredToolInvocation, VisualImage } from "@/lib/types";

export const maxDuration = 60;

const makeSearchGameVisuals = (serperKey: string) => tool({
  description:
    "Search the web for real game screenshots, maps, item locations, or layouts. Use only when a visual clarifies spatial or appearance questions. Include the game name in the query.",
  inputSchema: z.object({ query: z.string().describe("Specific image search query including the game title") }),
  execute: async ({ query }): Promise<{ query: string; images: VisualImage[]; error?: string }> => {
    const key = serperKey;
    if (!key) return { query, images: [], error: "Serper API key belum diisi (Pengaturan)" };
    try {
      const res = await fetch("https://google.serper.dev/images", {
        method: "POST",
        headers: { "X-API-KEY": key, "Content-Type": "application/json" },
        body: JSON.stringify({ q: query, num: 8 }),
      });
      const json = await res.json();
      const images: VisualImage[] = (json.images ?? []).slice(0, 6).map((i: any) => ({
        url: i.imageUrl,
        title: i.title ?? "",
        source: i.source ?? "",
        link: i.link ?? i.imageUrl,
      }));
      return { query, images };
    } catch {
      return { query, images: [], error: "Image search failed" };
    }
  },
});

type Part = UIMessage["parts"][number];

const textOf = (m?: UIMessage) =>
  (m?.parts ?? []).map((p) => (p.type === "text" ? p.text : "")).join("");

const isImagePart = (p: Part) =>
  p.type === "file" && typeof p.mediaType === "string" && p.mediaType.startsWith("image/");

export async function POST(req: Request) {
  const cfgError = aiConfigError(getAiConfig(req));
  if (cfgError) return new Response(cfgError, { status: 400 });

  const { messages, gameId } = (await req.json()) as { messages: UIMessage[]; gameId: string };
  const supabase = await createClient();

  const { data } = await supabase.from("games").select("*").eq("id", gameId).single();
  if (!data) return new Response("Game not found", { status: 404 });
  const game = data as Game;

  const last = messages[messages.length - 1];
  if (last?.role === "user") {
    // Gambar tidak disimpan ke database (terlalu besar); hanya teks + catatan jumlah gambar.
    const imageCount = last.parts.filter(isImagePart).length;
    const content = textOf(last) + (imageCount ? `\n\n📎 ${imageCount} image${imageCount > 1 ? "s" : ""}` : "");
    const { error: userInsertError } = await supabase
      .from("messages")
      .insert({ game_id: gameId, role: "user", content });
    if (userInsertError) console.error("[chat] failed to save user message:", userInsertError.message);
  }

  // Kirim teks dari semua pesan ke model. Gambar hanya disertakan dari 2 pesan user terakhir
  // yang berisi gambar (supaya request tetap ringan). Output tool dicari ulang bila perlu.
  const imageMessageIdx = messages
    .map((m, i) => (m.role === "user" && m.parts.some(isImagePart) ? i : -1))
    .filter((i) => i >= 0);
  const keepImagesFor = new Set(imageMessageIdx.slice(-2));
  const clean = messages.map((m, i) => ({
    ...m,
    parts: m.parts.filter((p) => p.type === "text" || (keepImagesFor.has(i) && isImagePart(p))),
  }));

  let model: LanguageModel;
  try {
    model = await getModel(req);
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Model tidak bisa dimuat", { status: 400 });
  }

  const langInstruction = await getLanguageInstruction();

  const result = streamText({
    model,
    system: buildCompanionSystemPrompt(game.title, game.genres, game.workspace_config) + langInstruction,
    messages: await convertToModelMessages(clean),
    tools: { searchGameVisuals: makeSearchGameVisuals(getSerperKey(req)) },
    stopWhen: stepCountIs(4),
    onFinish: async ({ text, steps }) => {
      const invocations: StoredToolInvocation[] = steps
        .flatMap((s) => s.toolResults)
        .filter((r) => r.toolName === "searchGameVisuals")
        .map((r) => r.output as StoredToolInvocation)
        .filter((o) => o?.images?.length);
      const { error: assistantInsertError } = await supabase.from("messages").insert({
        game_id: gameId,
        role: "assistant",
        content: text,
        tool_invocations: invocations.length ? invocations : null,
      });
      if (assistantInsertError) console.error("[chat] failed to save assistant message:", assistantInsertError.message);
    },
  });

  return result.toUIMessageStreamResponse();
}

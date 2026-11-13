import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getGeminiKey, getModel, getSerperKey } from "@/lib/ai/model";
import { buildCompanionSystemPrompt } from "@/lib/ai/prompts";
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

const textOf = (m?: UIMessage) =>
  (m?.parts ?? []).map((p) => (p.type === "text" ? p.text : "")).join("");

export async function POST(req: Request) {
  if (!getGeminiKey(req)) {
    return new Response("Gemini API key belum diisi. Buka Pengaturan (ikon gear) di navbar.", { status: 400 });
  }
  const { messages, gameId } = (await req.json()) as { messages: UIMessage[]; gameId: string };
  const supabase = await createClient();

  const { data } = await supabase.from("games").select("*").eq("id", gameId).single();
  if (!data) return new Response("Game not found", { status: 404 });
  const game = data as Game;

  const last = messages[messages.length - 1];
  if (last?.role === "user") {
    await supabase.from("messages").insert({ game_id: gameId, role: "user", content: textOf(last) });
  }

  // Send only text parts of history to the model (tool outputs are re-fetched when needed).
  const clean = messages.map((m) => ({ ...m, parts: m.parts.filter((p) => p.type === "text") }));

  const result = streamText({
    model: getModel(req),
    system: buildCompanionSystemPrompt(game.title, game.genres, game.workspace_config),
    messages: await convertToModelMessages(clean),
    tools: { searchGameVisuals: makeSearchGameVisuals(getSerperKey(req)) },
    stopWhen: stepCountIs(4),
    onFinish: async ({ text, steps }) => {
      const invocations: StoredToolInvocation[] = steps
        .flatMap((s) => s.toolResults)
        .filter((r) => r.toolName === "searchGameVisuals")
        .map((r) => r.output as StoredToolInvocation)
        .filter((o) => o?.images?.length);
      await supabase.from("messages").insert({
        game_id: gameId,
        role: "assistant",
        content: text,
        tool_invocations: invocations.length ? invocations : null,
      });
    },
  });

  return result.toUIMessageStreamResponse();
}

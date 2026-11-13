import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Key priority: key sent from the Settings panel (header) -> Vercel env var.
export function getGeminiKey(req?: Request) {
  return req?.headers.get("x-gemini-key")?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
}

export function getRawgKey(req?: Request) {
  return req?.headers.get("x-rawg-key")?.trim() || process.env.RAWG_API_KEY || "";
}

export function getSerperKey(req?: Request) {
  return req?.headers.get("x-serper-key")?.trim() || process.env.SERPER_API_KEY || "";
}

export type GeminiModel = { id: string; label: string };

const EXCLUDE = /(tts|image|embedding|live|audio|robotics|computer-use|native|aqa|imagen|veo|learnlm)/i;
const CACHE_MS = 30 * 60 * 1000;
const cache = new Map<string, { at: number; models: GeminiModel[] }>();

// Ask Google which text models this specific API key can actually use.
export async function listGeminiModels(key: string): Promise<GeminiModel[]> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.models;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${encodeURIComponent(key)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || `Gemini API menolak request (${res.status})`);
  }
  const json = await res.json();

  const models: GeminiModel[] = (json.models ?? [])
    .filter(
      (m: any) =>
        /^models\/gemini-/.test(m.name) &&
        m.supportedGenerationMethods?.includes("generateContent") &&
        !EXCLUDE.test(m.name),
    )
    .map((m: any) => {
      const id = String(m.name).replace("models/", "");
      return { id, label: m.displayName || id };
    })
    .sort((a: GeminiModel, b: GeminiModel) => {
      const al = a.id.endsWith("-latest") ? 0 : 1;
      const bl = b.id.endsWith("-latest") ? 0 : 1;
      return al - bl || b.id.localeCompare(a.id, undefined, { numeric: true });
    });

  cache.set(key, { at: Date.now(), models });
  return models;
}

// Priority: model chosen in Settings -> AI_MODEL env -> newest Flash available for this key.
export async function resolveModelId(req?: Request) {
  const chosen = req?.headers.get("x-ai-model")?.trim();
  if (chosen) return chosen;
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  try {
    const list = await listGeminiModels(getGeminiKey(req));
    const pick =
      list.find((m) => m.id === "gemini-flash-latest") ??
      list.find((m) => /flash/.test(m.id) && !/lite/.test(m.id)) ??
      list[0];
    if (pick) return pick.id;
  } catch {
    // fall through to the static default
  }
  return "gemini-2.5-flash";
}

export async function getModel(req?: Request) {
  const modelId = await resolveModelId(req);
  return createGoogleGenerativeAI({ apiKey: getGeminiKey(req) })(modelId);
}

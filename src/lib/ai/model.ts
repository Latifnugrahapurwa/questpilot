import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

export type Provider = "google" | "openai" | "anthropic" | "custom";
export type ModelOption = { id: string; label: string };

export const PROVIDER_LABELS: Record<Provider, string> = {
  google: "Gemini",
  openai: "OpenAI (ChatGPT)",
  anthropic: "Anthropic (Claude)",
  custom: "OpenAI-compatible",
};
const PROVIDERS = Object.keys(PROVIDER_LABELS) as Provider[];

export type AiConfig = { provider: Provider; apiKey: string; baseUrl: string; model: string };

// Priority everywhere: value sent from the Settings panel (header) -> Vercel env var.
export function getAiConfig(req?: Request): AiConfig {
  const raw = req?.headers.get("x-ai-provider")?.trim() || process.env.AI_PROVIDER || "google";
  const provider = (PROVIDERS.includes(raw as Provider) ? raw : "google") as Provider;
  const envKeys: Record<Provider, string | undefined> = {
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    custom: process.env.CUSTOM_AI_API_KEY,
  };
  return {
    provider,
    apiKey: req?.headers.get("x-ai-key")?.trim() || envKeys[provider] || "",
    baseUrl: (req?.headers.get("x-ai-base-url")?.trim() || process.env.CUSTOM_AI_BASE_URL || "").replace(/\/+$/, ""),
    model: req?.headers.get("x-ai-model")?.trim() || process.env.AI_MODEL || "",
  };
}

function isSafeBaseUrl(value: string) {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return false;
    if (/^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[)/.test(h)) return false;
    return true;
  } catch {
    return false;
  }
}

export function aiConfigError(cfg: AiConfig): string | null {
  if (!cfg.apiKey) return `API key ${PROVIDER_LABELS[cfg.provider]} belum diisi. Buka Pengaturan (ikon gear) di navbar.`;
  if (cfg.provider === "custom") {
    if (!cfg.baseUrl) return "Base URL untuk provider OpenAI-compatible belum diisi (Pengaturan).";
    if (!isSafeBaseUrl(cfg.baseUrl)) return "Base URL harus berupa alamat https:// publik.";
  }
  return null;
}

export function getRawgKey(req?: Request) {
  return req?.headers.get("x-rawg-key")?.trim() || process.env.RAWG_API_KEY || "";
}

export function getSerperKey(req?: Request) {
  return req?.headers.get("x-serper-key")?.trim() || process.env.SERPER_API_KEY || "";
}

// ---- Model discovery: ask each provider which models this key can use ----

const CACHE_MS = 30 * 60 * 1000;
const cache = new Map<string, { at: number; models: ModelOption[] }>();

async function getJson(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = body?.error?.message || (typeof body?.error === "string" ? body.error : "") || res.statusText;
    throw new Error(`${res.status}: ${msg}`);
  }
  return res.json();
}

export async function listModels(cfg: AiConfig): Promise<ModelOption[]> {
  const cacheKey = `${cfg.provider}|${cfg.baseUrl}|${cfg.apiKey}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.models;

  let models: ModelOption[] = [];

  if (cfg.provider === "google") {
    const exclude = /(tts|image|embedding|live|audio|robotics|computer-use|native|aqa|imagen|veo|learnlm)/i;
    const json = await getJson(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${encodeURIComponent(cfg.apiKey)}`, {});
    models = (json.models ?? [])
      .filter((m: any) => /^models\/gemini-/.test(m.name) && m.supportedGenerationMethods?.includes("generateContent") && !exclude.test(m.name))
      .map((m: any) => {
        const id = String(m.name).replace("models/", "");
        return { id, label: m.displayName || id };
      })
      .sort((a: ModelOption, b: ModelOption) => {
        const al = a.id.endsWith("-latest") ? 0 : 1;
        const bl = b.id.endsWith("-latest") ? 0 : 1;
        return al - bl || b.id.localeCompare(a.id, undefined, { numeric: true });
      });
  } else if (cfg.provider === "openai") {
    const exclude = /(embedding|tts|whisper|dall-e|image|audio|realtime|transcribe|moderation|instruct|search|codex|computer-use|davinci|babbage|sora)/i;
    const json = await getJson("https://api.openai.com/v1/models", { Authorization: `Bearer ${cfg.apiKey}` });
    models = (json.data ?? [])
      .filter((m: any) => /^(gpt-|o\d|chatgpt-)/.test(m.id) && !exclude.test(m.id))
      .sort((a: any, b: any) => (b.created ?? 0) - (a.created ?? 0))
      .map((m: any) => ({ id: m.id, label: m.id }));
  } else if (cfg.provider === "anthropic") {
    const json = await getJson("https://api.anthropic.com/v1/models?limit=1000", {
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
    });
    models = (json.data ?? []).map((m: any) => ({ id: m.id, label: m.display_name || m.id }));
  } else {
    const json = await getJson(`${cfg.baseUrl}/models`, { Authorization: `Bearer ${cfg.apiKey}` });
    models = (json.data ?? [])
      .map((m: any) => ({ id: String(m.id), label: String(m.id) }))
      .sort((a: ModelOption, b: ModelOption) => a.id.localeCompare(b.id));
  }

  cache.set(cacheKey, { at: Date.now(), models });
  return models;
}

// Priority: model chosen in Settings -> AI_MODEL env -> best default from this key's own model list.
async function resolveModelId(cfg: AiConfig): Promise<string> {
  if (cfg.model) return cfg.model;
  if (cfg.provider === "custom") throw new Error("Pilih atau ketik nama model di Pengaturan (provider OpenAI-compatible tidak punya model otomatis).");

  const fallback = { google: "gemini-2.5-flash", openai: "gpt-4o-mini", anthropic: "claude-sonnet-4-5" }[cfg.provider];
  try {
    const list = await listModels(cfg);
    const pick =
      cfg.provider === "google"
        ? (list.find((m) => m.id === "gemini-flash-latest") ?? list.find((m) => /flash/.test(m.id) && !/lite/.test(m.id)) ?? list[0])
        : cfg.provider === "openai"
          ? (list.find((m) => /^gpt-[\d.]+-mini$/.test(m.id)) ?? list.find((m) => /^gpt-/.test(m.id)) ?? list[0])
          : (list.find((m) => /sonnet/.test(m.id)) ?? list[0]);
    return pick?.id ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getModel(req?: Request): Promise<LanguageModel> {
  const cfg = getAiConfig(req);
  const err = aiConfigError(cfg);
  if (err) throw new Error(err);
  const id = await resolveModelId(cfg);

  switch (cfg.provider) {
    case "google":
      return createGoogleGenerativeAI({ apiKey: cfg.apiKey })(id);
    case "openai":
      return createOpenAI({ apiKey: cfg.apiKey })(id);
    case "anthropic":
      return createAnthropic({ apiKey: cfg.apiKey })(id);
    case "custom":
      return createOpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseUrl }).chat(id);
  }
}

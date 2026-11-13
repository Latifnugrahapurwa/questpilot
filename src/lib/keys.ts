// Client-side only: API keys entered in the Settings panel live in this browser's localStorage.
export type Provider = "google" | "openai" | "anthropic" | "custom";

export type ApiKeys = {
  provider: Provider;
  keys: Record<Provider, string>;
  models: Record<Provider, string>; // "" = automatic
  baseUrl: string; // only for provider "custom"
  rawg: string;
  serper: string;
};

const STORAGE_KEY = "questpilot.keys";

export const EMPTY_KEYS: ApiKeys = {
  provider: "google",
  keys: { google: "", openai: "", anthropic: "", custom: "" },
  models: { google: "", openai: "", anthropic: "", custom: "" },
  baseUrl: "",
  rawg: "",
  serper: "",
};

export function loadKeys(): ApiKeys {
  if (typeof window === "undefined") return EMPTY_KEYS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_KEYS;
    const p = JSON.parse(raw);
    // Migrate the old single-provider format { gemini, rawg, serper, model }.
    const legacyGemini = typeof p.gemini === "string" ? p.gemini : "";
    const legacyModel = typeof p.model === "string" ? p.model : "";
    return {
      ...EMPTY_KEYS,
      ...p,
      keys: { ...EMPTY_KEYS.keys, ...(legacyGemini ? { google: legacyGemini } : {}), ...(p.keys ?? {}) },
      models: { ...EMPTY_KEYS.models, ...(legacyModel ? { google: legacyModel } : {}), ...(p.models ?? {}) },
    };
  } catch {
    return EMPTY_KEYS;
  }
}

export function saveKeys(keys: ApiKeys) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function clearKeys() {
  window.localStorage.removeItem(STORAGE_KEY);
}

// Headers attached to every request to our own API routes.
export function keyHeaders(): Record<string, string> {
  const k = loadKeys();
  const h: Record<string, string> = { "x-ai-provider": k.provider };
  if (k.keys[k.provider]?.trim()) h["x-ai-key"] = k.keys[k.provider].trim();
  if (k.models[k.provider]?.trim()) h["x-ai-model"] = k.models[k.provider].trim();
  if (k.provider === "custom" && k.baseUrl.trim()) h["x-ai-base-url"] = k.baseUrl.trim();
  if (k.rawg.trim()) h["x-rawg-key"] = k.rawg.trim();
  if (k.serper.trim()) h["x-serper-key"] = k.serper.trim();
  return h;
}

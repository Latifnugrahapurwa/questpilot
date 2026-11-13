// Client-side only: API keys entered in the Settings panel live in this browser's localStorage.
export type ApiKeys = { gemini: string; rawg: string; serper: string; model: string };

const STORAGE_KEY = "questpilot.keys";
const EMPTY: ApiKeys = { gemini: "", rawg: "", serper: "", model: "" };

export function loadKeys(): ApiKeys {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
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
  const h: Record<string, string> = {};
  if (k.gemini.trim()) h["x-gemini-key"] = k.gemini.trim();
  if (k.rawg.trim()) h["x-rawg-key"] = k.rawg.trim();
  if (k.serper.trim()) h["x-serper-key"] = k.serper.trim();
  if (k.model.trim()) h["x-ai-model"] = k.model.trim();
  return h;
}

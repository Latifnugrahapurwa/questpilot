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

export function getModel(req?: Request) {
  const modelId = req?.headers.get("x-ai-model")?.trim() || process.env.AI_MODEL || "gemini-2.5-flash";
  return createGoogleGenerativeAI({ apiKey: getGeminiKey(req) })(modelId);
}

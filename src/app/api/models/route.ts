import { NextResponse } from "next/server";
import { getGeminiKey, listGeminiModels } from "@/lib/ai/model";

export async function GET(req: Request) {
  const key = getGeminiKey(req);
  if (!key) return NextResponse.json({ models: [], error: "Masukkan Gemini API key dulu." }, { status: 400 });
  try {
    return NextResponse.json({ models: await listGeminiModels(key) });
  } catch (e) {
    return NextResponse.json({ models: [], error: e instanceof Error ? e.message : "Gagal memuat daftar model" }, { status: 502 });
  }
}

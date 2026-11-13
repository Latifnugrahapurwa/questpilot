import { NextResponse } from "next/server";
import { aiConfigError, getAiConfig, listModels } from "@/lib/ai/model";

export async function GET(req: Request) {
  const cfg = getAiConfig(req);
  const err = aiConfigError(cfg);
  if (err) return NextResponse.json({ models: [], error: err }, { status: 400 });
  try {
    return NextResponse.json({ models: await listModels(cfg) });
  } catch (e) {
    return NextResponse.json({ models: [], error: e instanceof Error ? e.message : "Gagal memuat daftar model" }, { status: 502 });
  }
}

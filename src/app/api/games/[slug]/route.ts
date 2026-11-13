import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ChecklistItem, ProgressField, WorkspaceConfig } from "@/lib/types";

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = (await req.json()) as { progress_fields?: ProgressField[]; checklist?: ChecklistItem[] };
  const supabase = await createClient();

  const { data: game, error: readErr } = await supabase.from("games").select("workspace_config").eq("slug", slug).single();
  if (readErr || !game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

  const config = game.workspace_config as WorkspaceConfig;
  const next: WorkspaceConfig = {
    ...config,
    progress_fields: body.progress_fields ?? config.progress_fields,
    starter_checklist: body.checklist ?? config.starter_checklist,
  };

  const { error } = await supabase.from("games").update({ workspace_config: next }).eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { UIMessage } from "ai";
import { createClient } from "@/lib/supabase/server";
import type { Game, StoredToolInvocation } from "@/lib/types";
import WorkspaceClient from "./WorkspaceClient";

export const dynamic = "force-dynamic";

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from("games").select("*").eq("slug", slug).single();
  if (!data) notFound();
  const game = data as Game;

  const { data: rows } = await supabase
    .from("messages")
    .select("*")
    .eq("game_id", game.id)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: true });

  const initialMessages: UIMessage[] = (rows ?? []).map((r: any) => {
    const parts: any[] = [{ type: "text", text: r.content }];
    (r.tool_invocations as StoredToolInvocation[] | null)?.forEach((inv, i) => {
      parts.push({
        type: "tool-searchGameVisuals",
        toolCallId: `${r.id}-${i}`,
        state: "output-available",
        input: { query: inv.query },
        output: inv,
      });
    });
    return { id: r.id, role: r.role, parts } as UIMessage;
  });

  return (
    <div>
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-amber-400">
        <ArrowLeft className="h-4 w-4" /> Library
      </Link>
      <WorkspaceClient game={game} initialMessages={initialMessages} />
    </div>
  );
}

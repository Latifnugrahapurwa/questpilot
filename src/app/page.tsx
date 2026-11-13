import { createClient } from "@/lib/supabase/server";
import type { Game } from "@/lib/types";
import GameCard from "@/components/library/GameCard";
import AddGameModal from "@/components/library/AddGameModal";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("games").select("*").order("created_at", { ascending: false });
  const games = (data ?? []) as Game[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Game Library</h1>
          <p className="text-sm text-zinc-400">Every game gets its own AI-tailored workspace.</p>
        </div>
        <AddGameModal />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
          Database error: {error.message}. Did you run supabase/schema.sql and set your env vars?
        </div>
      )}

      {games.length === 0 && !error ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
          No games yet. Click <span className="text-amber-400">+ Add Game</span> to get started.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {games.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}

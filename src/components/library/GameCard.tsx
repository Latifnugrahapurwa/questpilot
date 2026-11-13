import Link from "next/link";
import type { Game } from "@/lib/types";

export default function GameCard({ game }: { game: Game }) {
  const progress = game.workspace_config.progress_fields
    .filter((f) => f.value?.trim())
    .map((f) => `${f.label}: ${f.value}`)
    .slice(0, 2)
    .join(" · ");

  return (
    <Link
      href={`/game/${game.slug}`}
      className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition hover:border-amber-500/60"
    >
      <div className="aspect-[16/10] w-full bg-zinc-800">
        {game.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={game.cover_image} alt={game.title} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : null}
      </div>
      <div className="p-3">
        <h3 className="truncate font-semibold">{game.title}</h3>
        <div className="mt-1 flex flex-wrap gap-1">
          {game.genres.slice(0, 3).map((g) => (
            <span key={g} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-emerald-300">
              {g}
            </span>
          ))}
        </div>
        <p className="mt-2 truncate text-xs text-zinc-500">{progress || "No progress set yet"}</p>
      </div>
    </Link>
  );
}

"use client";

import { BookOpen, Compass, Hammer, Lightbulb, Map, Package, Shield, Sparkles, Swords, Target, TrendingUp, Wrench } from "lucide-react";
import type { QuickAction } from "@/lib/types";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  map: Map,
  sword: Swords,
  hammer: Hammer,
  book: BookOpen,
  lightbulb: Lightbulb,
  target: Target,
  package: Package,
  compass: Compass,
  wrench: Wrench,
  "trending-up": TrendingUp,
  shield: Shield,
  sparkles: Sparkles,
};

export default function QuickActionsBar({ actions, disabled, onPick }: { actions: QuickAction[]; disabled: boolean; onPick: (prompt: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {actions.map((a) => {
        const Icon = ICONS[a.icon] ?? Sparkles;
        return (
          <button
            key={a.label}
            disabled={disabled}
            onClick={() => onPick(a.prompt)}
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-xs font-medium hover:border-amber-500/60 disabled:opacity-50"
          >
            <Icon className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="truncate">{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}

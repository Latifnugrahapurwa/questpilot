"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ChecklistItem } from "@/lib/types";

export default function ChecklistSidebar({ items, onChange }: { items: ChecklistItem[]; onChange: (items: ChecklistItem[]) => void }) {
  const [text, setText] = useState("");
  const done = items.filter((i) => i.completed).length;

  function add() {
    const t = text.trim();
    if (!t) return;
    onChange([...items, { id: crypto.randomUUID(), text: t, completed: false }]);
    setText("");
  }

  return (
    <aside className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 lg:h-[70vh] lg:overflow-y-auto">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Checklist</h2>
        <span className="text-xs text-emerald-400">
          {done}/{items.length}
        </span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded bg-zinc-800">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: items.length ? `${(done / items.length) * 100}%` : "0%" }} />
      </div>

      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.id} className="group flex items-start gap-2 rounded-lg p-1.5 hover:bg-zinc-800/60">
            <input
              type="checkbox"
              checked={it.completed}
              onChange={() => onChange(items.map((x) => (x.id === it.id ? { ...x, completed: !x.completed } : x)))}
              className="mt-1 h-4 w-4 accent-emerald-500"
            />
            <span className={`flex-1 text-sm ${it.completed ? "text-zinc-500 line-through" : ""}`}>{it.text}</span>
            <button onClick={() => onChange(items.filter((x) => x.id !== it.id))} className="opacity-0 group-hover:opacity-100" aria-label="Delete">
              <Trash2 className="h-3.5 w-3.5 text-zinc-500 hover:text-red-400" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a goal…"
          className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm outline-none focus:border-amber-500"
        />
        <button onClick={add} className="rounded-lg bg-zinc-800 px-2 hover:bg-zinc-700" aria-label="Add">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

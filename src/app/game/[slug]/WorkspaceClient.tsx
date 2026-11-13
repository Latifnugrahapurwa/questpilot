"use client";

import { useCallback, useRef, useState } from "react";
import type { UIMessage } from "ai";
import type { ChecklistItem, Game, ProgressField } from "@/lib/types";
import ProgressHeader from "@/components/workspace/ProgressHeader";
import ChecklistSidebar from "@/components/workspace/ChecklistSidebar";
import ChatInterface from "@/components/workspace/ChatInterface";

export default function WorkspaceClient({ game, initialMessages }: { game: Game; initialMessages: UIMessage[] }) {
  const [fields, setFields] = useState<ProgressField[]>(game.workspace_config.progress_fields);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(game.workspace_config.starter_checklist);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patch = useCallback(
    (body: { progress_fields?: ProgressField[]; checklist?: ChecklistItem[] }) => {
      if (timer.current) clearTimeout(timer.current);
      setSaving(true);
      timer.current = setTimeout(async () => {
        try {
          await fetch(`/api/games/${game.slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        } finally {
          setSaving(false);
        }
      }, 500);
    },
    [game.slug],
  );

  return (
    <div className="space-y-4">
      <ProgressHeader
        title={game.title}
        cover={game.cover_image}
        genres={game.genres}
        fields={fields}
        saving={saving}
        onChange={(next) => {
          setFields(next);
          patch({ progress_fields: next });
        }}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <ChatInterface gameId={game.id} gameTitle={game.title} quickActions={game.workspace_config.quick_actions} initialMessages={initialMessages} />
        <ChecklistSidebar
          items={checklist}
          onChange={(next) => {
            setChecklist(next);
            patch({ checklist: next });
          }}
        />
      </div>
    </div>
  );
}

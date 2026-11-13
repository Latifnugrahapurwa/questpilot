export type ProgressField = { key: string; label: string; placeholder: string; value: string };
export type QuickAction = { label: string; prompt: string; icon: string };
export type ChecklistItem = { id: string; text: string; completed: boolean };

export type WorkspaceConfig = {
  persona: string;
  progress_fields: ProgressField[];
  quick_actions: QuickAction[];
  starter_checklist: ChecklistItem[];
};

export type Game = {
  id: string;
  slug: string;
  title: string;
  rawg_id: number | null;
  cover_image: string | null;
  genres: string[];
  workspace_config: WorkspaceConfig;
  created_at: string;
};

export type VisualImage = { url: string; title: string; source: string; link: string };

export type StoredToolInvocation = { query: string; images: VisualImage[] };

export type RawgSearchResult = {
  id: number;
  name: string;
  background_image: string | null;
  genres: string[];
  released: string | null;
  source?: "rawg" | "steam";
};

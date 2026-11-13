-- QuestPilot schema. Run in Supabase SQL Editor.
create extension if not exists "pgcrypto";

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  rawg_id int,
  cover_image text,
  genres text[] default '{}',
  workspace_config jsonb not null,
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool')),
  content text not null,
  tool_invocations jsonb,
  created_at timestamptz default now()
);

create index if not exists messages_game_id_created_idx
  on public.messages (game_id, created_at);

-- Single-user personal deployment: RLS disabled so it works out of the box.
-- WARNING: anyone with your anon key can read/write. Enable auth + RLS before sharing publicly.
alter table public.games disable row level security;
alter table public.messages disable row level security;

-- QuestPilot schema. Run the whole file in Supabase SQL Editor (safe to re-run).
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

-- Single-user personal deployment: fully open access for the anon key.
-- Explicit policies + grants work whether or not Supabase auto-enabled RLS on new tables.
-- WARNING: anyone with your anon key can read/write. Add auth + per-user policies before sharing publicly.
alter table public.games enable row level security;
alter table public.messages enable row level security;

drop policy if exists "open access games" on public.games;
create policy "open access games" on public.games
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "open access messages" on public.messages;
create policy "open access messages" on public.messages
  for all to anon, authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.games to anon, authenticated;
grant select, insert, update, delete on public.messages to anon, authenticated;

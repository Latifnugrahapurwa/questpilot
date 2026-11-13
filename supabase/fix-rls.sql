-- QuestPilot: perbaikan penyimpanan riwayat chat.
-- Jalankan di Supabase -> SQL Editor (aman dijalankan berulang kali).

alter table public.games disable row level security;
alter table public.messages disable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.games to anon, authenticated;
grant select, insert, update, delete on public.messages to anon, authenticated;

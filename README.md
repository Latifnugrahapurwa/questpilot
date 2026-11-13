# QuestPilot — AI Gaming Companion

Next.js 15 (App Router, TS) · Tailwind · Supabase · Vercel AI SDK v5 (Gemini) · RAWG · Serper.

## Setup
1. `npm install`
2. Create a Supabase project, run `supabase/schema.sql` in the SQL editor.
3. `cp .env.example .env.local` and fill in all keys.
4. `npm run dev` → http://localhost:3000

## Deploy
Push to GitHub, import in Vercel, add the same env vars (see `.env.example`), deploy.

> RLS is disabled for single-user use. Add auth + RLS before making the deployment public.

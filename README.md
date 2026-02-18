# Smart Bookmark App

A simple bookmark manager built with Next.js App Router, Supabase (Auth + Postgres + Realtime), and Tailwind CSS.

## Features

- Google OAuth login only (no email/password)
- Add bookmarks (title + URL)
- Bookmarks are private per user (RLS enforced)
- Realtime updates across tabs/windows
- Delete your own bookmarks
- Ready for Vercel deployment

## Tech Stack

- Next.js (App Router)
- Supabase Auth + Database + Realtime
- Tailwind CSS

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment variables:

```bash
cp .env.example .env.local
```

Fill `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run dev server:

```bash
npm run dev
```

## Supabase Setup

### 1) Create `bookmarks` table

Run this SQL in Supabase SQL editor:

```sql
create extension if not exists pgcrypto;

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  url text not null,
  created_at timestamptz not null default now()
);

alter table public.bookmarks enable row level security;
```

### 2) RLS policies (private per user)

```sql
create policy "Users can read their own bookmarks"
on public.bookmarks
for select
using (auth.uid() = user_id);

create policy "Users can insert their own bookmarks"
on public.bookmarks
for insert
with check (auth.uid() = user_id);

create policy "Users can delete their own bookmarks"
on public.bookmarks
for delete
using (auth.uid() = user_id);
```

### 3) Enable Realtime on `bookmarks`

- Supabase Dashboard -> Database -> Replication
- Turn on replication for `public.bookmarks`

### 4) Configure Google OAuth provider

- Supabase Dashboard -> Authentication -> Providers -> Google (enable)
- Add valid redirect URLs:
  - Local: `http://localhost:3000/auth/callback`
  - Production: `https://YOUR_VERCEL_DOMAIN/auth/callback`

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import project into Vercel.
3. Add env vars in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.
5. Add your Vercel URL callback to Supabase Google OAuth config.

## Problems Encountered and Fixes

1. Problem: Dynamic route path `app/api/bookmarks/[id]/route.ts` was treated as a wildcard path by PowerShell while writing files.
Fix: Used `Set-Content -LiteralPath` to target the exact path.

2. Problem: Session persistence can be inconsistent in App Router without middleware refresh.
Fix: Added Supabase middleware (`middleware.ts` + `supabase/middleware.ts`) to keep auth cookies synced.

3. Problem: Realtime list drift between tabs after local optimistic operations.
Fix: Kept logic simple and robust by re-fetching `/api/bookmarks` after insert/delete and on realtime events.

## Submission Checklist

- [ ] Live Vercel URL
- [ ] Public GitHub repo URL
- [x] README with issues encountered + fixes

-- INFOCOMMIE BBS — Supabase schema for ENLIST (accounts) + ECHOMAIL (forum).
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
--
-- Security model: anyone may READ the roster handles + the board; only the
-- authenticated author may WRITE their own rows. Enforced by Row Level Security.

-- ── profiles: one row per enlisted comrade, holds the public handle ──────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  handle     text unique not null check (handle ~ '^[A-Za-z0-9._]{3,24}$'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are public" on public.profiles
  for select using (true);

create policy "comrade manages own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "comrade updates own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ── threads: forum subjects ──────────────────────────────────────────────────
create table if not exists public.threads (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 1 and 120),
  author_id     uuid not null references auth.users (id) on delete cascade,
  author_handle text,
  created_at    timestamptz not null default now()
);

alter table public.threads enable row level security;

create policy "threads are public" on public.threads
  for select using (true);

create policy "enlisted comrades start threads" on public.threads
  for insert with check (auth.uid() = author_id);

-- ── posts: messages inside a thread ──────────────────────────────────────────
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  thread_id     uuid not null references public.threads (id) on delete cascade,
  author_id     uuid not null references auth.users (id) on delete cascade,
  author_handle text,
  body          text not null check (char_length(body) between 1 and 8000),
  created_at    timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "posts are public" on public.posts
  for select using (true);

create policy "enlisted comrades post" on public.posts
  for insert with check (auth.uid() = author_id);

create index if not exists posts_thread_idx on public.posts (thread_id, created_at);
create index if not exists threads_created_idx on public.threads (created_at desc);

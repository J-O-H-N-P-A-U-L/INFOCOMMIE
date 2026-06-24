-- INFOCOMMIE BBS — avatar support (run once, after schema.sql).
-- Adds avatar columns to profiles + a public `avatars` storage bucket where
-- each comrade may upload one picture into their own uid-named folder.
-- Generated badge avatars need NO setup — this is only for uploaded pictures.

-- ── profile columns ──────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists avatar_url  text,
  add column if not exists avatar_seed integer not null default 0;

-- ── storage bucket (public read) ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone may view avatar images.
drop policy if exists "avatar images are public" on storage.objects;
create policy "avatar images are public" on storage.objects
  for select using (bucket_id = 'avatars');

-- A comrade may write only inside their own folder: avatars/<uid>/...
drop policy if exists "comrade uploads own avatar" on storage.objects;
create policy "comrade uploads own avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "comrade updates own avatar" on storage.objects;
create policy "comrade updates own avatar" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "comrade deletes own avatar" on storage.objects;
create policy "comrade deletes own avatar" on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

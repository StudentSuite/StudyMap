-- Saved public places (#355): the stars on the map.
-- Run this once against the project's Supabase database (SQL editor or
-- `supabase db push`). It ships as a migration file because applying it needs
-- dashboard or CLI access; until it is applied, saving still works for every
-- visitor, kept in their own browser, and only the sync to an account is idle.
--
-- Mirrors competition_saves: one row per (user, place), private to its owner.
-- `place_id` is a public dataset id (data/places/*.json), not a foreign key,
-- so a place that is later renamed or removed leaves a dangling id that the
-- app drops silently when it reads the list.

create table if not exists public.saved_places (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  place_id   text not null check (char_length(place_id) between 1 and 80),
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

alter table public.saved_places enable row level security;

create policy "own saved places are selectable" on public.saved_places
  for select using (auth.uid() = user_id);
create policy "own saved places are insertable" on public.saved_places
  for insert with check (auth.uid() = user_id);
create policy "own saved places are deletable" on public.saved_places
  for delete using (auth.uid() = user_id);

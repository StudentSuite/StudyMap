-- Saved custom places + home location for signed-in users.
-- Run this once against the project's Supabase database (SQL editor or
-- `supabase db push`). Requires dashboard/CLI access this repo's Claude
-- session did not have, so it ships as a migration file instead of being
-- applied automatically.

create table if not exists user_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  type text not null,
  city text not null,
  lat double precision not null,
  lng double precision not null,
  address text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists user_places_user_id_idx on user_places (user_id);

alter table user_places enable row level security;

create policy "Users can view their own places"
  on user_places for select
  using (auth.uid() = user_id);

create policy "Users can insert their own places"
  on user_places for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own places"
  on user_places for update
  using (auth.uid() = user_id);

create policy "Users can delete their own places"
  on user_places for delete
  using (auth.uid() = user_id);

-- One home location per user.
create table if not exists user_home (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  label text not null,
  updated_at timestamptz not null default now()
);

alter table user_home enable row level security;

create policy "Users can view their own home"
  on user_home for select
  using (auth.uid() = user_id);

create policy "Users can insert their own home"
  on user_home for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own home"
  on user_home for update
  using (auth.uid() = user_id);

create policy "Users can delete their own home"
  on user_home for delete
  using (auth.uid() = user_id);

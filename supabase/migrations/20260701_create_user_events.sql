-- Personal calendar events for signed-in users.
-- Run this once against the project's Supabase database (SQL editor or
-- `supabase db push`). Requires dashboard/CLI access this repo's Claude
-- session did not have, so it ships as a migration file instead of being
-- applied automatically.

create table if not exists user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  date date not null,
  category text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists user_events_user_id_date_idx on user_events (user_id, date);

alter table user_events enable row level security;

create policy "Users can view their own events"
  on user_events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own events"
  on user_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own events"
  on user_events for update
  using (auth.uid() = user_id);

create policy "Users can delete their own events"
  on user_events for delete
  using (auth.uid() = user_id);

-- Private personal pins: each row belongs to one signed-in user and is never
-- exposed publicly. owner_id defaults to the caller so the client never has to
-- send it, and row level security keeps every row readable and writable only
-- by its owner.

create table if not exists personal_pins (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  type       text not null default 'custom'
             check (type in ('home', 'school', 'office', 'coaching', 'custom')),
  lat        double precision not null,
  lng        double precision not null,
  note       text,
  created_at timestamptz not null default now()
);

alter table personal_pins enable row level security;

create policy "owner can read own pins"
  on personal_pins for select
  using (owner_id = auth.uid());

create policy "owner can insert own pins"
  on personal_pins for insert
  with check (owner_id = auth.uid());

create policy "owner can update own pins"
  on personal_pins for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "owner can delete own pins"
  on personal_pins for delete
  using (owner_id = auth.uid());

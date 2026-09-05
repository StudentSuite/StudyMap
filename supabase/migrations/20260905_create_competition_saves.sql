-- Competition saves and the public save-count aggregate.
-- Run this once against the project's Supabase database (SQL editor or
-- `supabase db push`). Requires dashboard/CLI access this repo's Claude
-- session did not have, so it ships as a migration file instead of being
-- applied automatically.
--
-- Two tables, because a private-per-user table and a public aggregate pull
-- in opposite directions under row level security: if competition_saves is
-- readable only by its owner, nobody can COUNT() it. Saves stay private,
-- the aggregate is public, and only the trigger below writes to it.

-- competition_saves: one row per (user, competition). Private to its owner.
create table if not exists public.competition_saves (
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  competition_id text not null,
  created_at     timestamptz not null default now(),
  primary key (user_id, competition_id)
);

create index if not exists competition_saves_competition_idx
  on public.competition_saves (competition_id);

alter table public.competition_saves enable row level security;

create policy "own saves are selectable" on public.competition_saves
  for select using (auth.uid() = user_id);
create policy "own saves are insertable" on public.competition_saves
  for insert with check (auth.uid() = user_id);
create policy "own saves are deletable" on public.competition_saves
  for delete using (auth.uid() = user_id);

-- competition_stats: public aggregate. Readable by anyone, written only by the trigger.
create table if not exists public.competition_stats (
  competition_id text primary key,
  save_count     int not null default 0 check (save_count >= 0),
  updated_at     timestamptz not null default now()
);

alter table public.competition_stats enable row level security;

create policy "stats are public" on public.competition_stats
  for select using (true);
-- Deliberately no insert/update/delete policy. Only the trigger below writes here,
-- and it runs as SECURITY DEFINER so it bypasses RLS.

create or replace function public.bump_competition_save_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.competition_stats (competition_id, save_count, updated_at)
    values (new.competition_id, 1, now())
    on conflict (competition_id)
      do update set save_count = competition_stats.save_count + 1, updated_at = now();
    return new;
  elsif (tg_op = 'DELETE') then
    update public.competition_stats
       set save_count = greatest(save_count - 1, 0), updated_at = now()
     where competition_id = old.competition_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists competition_saves_count_trigger on public.competition_saves;
create trigger competition_saves_count_trigger
  after insert or delete on public.competition_saves
  for each row execute function public.bump_competition_save_count();

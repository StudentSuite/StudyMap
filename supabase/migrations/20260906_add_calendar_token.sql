-- Adds the per-user opaque token behind the saved-competitions calendar
-- feed (#210): GET /api/competitions/saved.ics?token=<calendar_token>.
-- Run this once against the project's Supabase database (SQL editor or
-- `supabase db push`), after 20260905_create_user_profiles.sql. Requires
-- dashboard/CLI access this repo's Claude session did not have, so it
-- ships as a migration file instead of being applied automatically.
--
-- The token is a random uuid, not the user id and not a JWT - so a leaked
-- feed URL never exposes anything about the account itself, and rotating
-- it (see rotateCalendarToken() in src/lib/user-profile.ts) is just
-- generating a fresh random value, not re-keying anything else.

alter table public.user_profiles
  add column if not exists calendar_token uuid not null default gen_random_uuid();

create unique index if not exists user_profiles_calendar_token_idx
  on public.user_profiles (calendar_token);

-- The calendar feed route has no signed-in session at all (a calendar app
-- fetches the URL directly, bearer-token style), so it cannot rely on
-- ordinary owner-only RLS the way every other private-data call in this
-- app does. Instead: a single security-definer function that does its own
-- authorization (token match) and is the only way in - never a broad
-- policy granting the anon key row access.
--
-- Returns null when no user_profiles row has this token (an invalid or
-- revoked token), and a text array (possibly empty) when it does, so the
-- caller can tell "token doesn't exist" apart from "valid token, zero
-- saves" without a second round trip.
create or replace function public.saved_competition_ids_for_calendar_token(p_token uuid)
returns text[]
language sql
security definer
set search_path = public
stable
as $$
  select case
    when exists (select 1 from public.user_profiles where calendar_token = p_token)
    then coalesce(
      (
        select array_agg(cs.competition_id)
        from public.user_profiles up
        join public.competition_saves cs on cs.user_id = up.user_id
        where up.calendar_token = p_token
      ),
      array[]::text[]
    )
    else null
  end;
$$;

-- The anon key is exactly what the feed route authenticates with (there is
-- no user session on this request), so it needs execute on this function
-- specifically - not on the underlying tables, which stay owner-only RLS.
grant execute on function public.saved_competition_ids_for_calendar_token(uuid)
  to anon, authenticated;

-- Rate-limits password-reset requests: at most 4 requests per email per
-- rolling 14-day window (defaults below), enforced server-side via
-- check_and_record_password_reset_attempt() so it can't be worked around by
-- repeatedly submitting the "forgot password" form. Run this once against
-- the project's Supabase database (SQL editor or `supabase db push`).
-- Requires dashboard/CLI access this repo's Claude session did not have, so
-- it ships as a migration file instead of being applied automatically.
--
-- Note this only throttles requests made through this app's own
-- /api/auth/forgot-password route, not calls made directly against
-- Supabase Auth's own REST endpoint with the public anon key - that layer
-- needs Supabase's own dashboard-configured auth rate limits as
-- defense in depth.
--
-- Stores a salted-by-normalization hash of the email (see
-- src/lib/password-reset-rate-limit.ts), never the address itself - this
-- table exists purely to count attempts, not to retain a plaintext list of
-- who asked for a reset.

create table if not exists public.password_reset_attempts (
  id bigint generated always as identity primary key,
  email_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_attempts_email_hash_created_at_idx
  on public.password_reset_attempts (email_hash, created_at desc);

-- No RLS policies are defined on purpose: this table has zero direct access
-- for anon/authenticated. The only way in is the security-definer function
-- below, the same pattern as saved_competition_ids_for_calendar_token
-- (see 20260906_add_calendar_token.sql).
alter table public.password_reset_attempts enable row level security;

-- Atomically checks and records one attempt for `p_email_hash`, returning
-- true when the request is allowed (fewer than p_max_attempts in the last
-- p_window_days days - a new row is recorded) and false when it should be
-- rejected (no row is recorded, so a rejected attempt never itself counts
-- toward the limit). The advisory lock serializes concurrent calls for the
-- same email hash so two simultaneous requests can't both read the same
-- under-limit count and both be let through.
create or replace function public.check_and_record_password_reset_attempt(
  p_email_hash text,
  p_max_attempts int default 4,
  p_window_days int default 14
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count int;
begin
  perform pg_advisory_xact_lock(hashtext(p_email_hash));

  select count(*) into recent_count
  from public.password_reset_attempts
  where email_hash = p_email_hash
    and created_at > now() - make_interval(days => p_window_days);

  if recent_count >= p_max_attempts then
    return false;
  end if;

  insert into public.password_reset_attempts (email_hash) values (p_email_hash);
  return true;
end;
$$;

-- The anon key is exactly what /api/auth/forgot-password authenticates with
-- (there is no user session for an unauthenticated password-reset request),
-- so it needs execute on this function specifically - not on the
-- underlying table, which stays RLS-locked with no policies.
grant execute on function public.check_and_record_password_reset_attempt(text, int, int)
  to anon, authenticated;

import { createAnonClient } from "@/lib/supabase/anon";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves a calendar-feed token (#210) to the set of competition ids that
 * user has saved, via the `saved_competition_ids_for_calendar_token`
 * security-definer function (see the #210 migration) - never by querying
 * `user_profiles`/`competition_saves` directly, since there is no signed-in
 * session on this request for owner-only RLS to key off.
 *
 * Returns `null` for anything that isn't a genuinely valid, live token:
 * malformed input, Supabase unconfigured, the RPC itself missing (an
 * unmigrated deployment), a lookup error, or a token that matches no
 * `user_profiles` row (never issued, or since rotated away). The caller's
 * job is to turn every one of those into the same 404 - this function
 * deliberately does not distinguish them, so the route handler can't leak
 * which case it was.
 */
export async function savedCompetitionIdsForCalendarToken(
  token: string,
): Promise<string[] | null> {
  if (!UUID_RE.test(token)) return null;

  const supabase = createAnonClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("saved_competition_ids_for_calendar_token", {
    p_token: token,
  });
  if (error || data === null) return null;
  return data as string[];
}

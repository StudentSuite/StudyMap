import { createClient } from "@/lib/supabase/client";

/**
 * Supabase client for the private-data calls below. These only ever run for a
 * signed-in user, which is impossible without Supabase configured, so a null
 * client here means something is badly misconfigured - throw rather than guess.
 * Mirrors src/lib/user-places.ts.
 */
function requireClient() {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

async function currentUserId(): Promise<string> {
  const supabase = requireClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

/** Every competition id the signed-in user has saved. */
export async function fetchSavedCompetitionIds(): Promise<string[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("competition_saves")
    .select("competition_id");
  if (error) throw error;
  return (data ?? []).map((row) => row.competition_id as string);
}

export async function saveCompetition(competitionId: string): Promise<void> {
  const supabase = requireClient();
  const user_id = await currentUserId();
  const { error } = await supabase
    .from("competition_saves")
    .insert({ competition_id: competitionId, user_id });
  if (error) throw error;
}

export async function unsaveCompetition(competitionId: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase
    .from("competition_saves")
    .delete()
    .eq("competition_id", competitionId);
  if (error) throw error;
}

/**
 * The public save count for every competition that has at least one save,
 * from the `competition_stats` aggregate. Works signed out (that table is
 * readable by anyone); returns `{}` rather than throwing when Supabase isn't
 * configured, since the count is decorative, not gating.
 */
export async function fetchSaveCounts(): Promise<Record<string, number>> {
  const supabase = createClient();
  if (!supabase) return {};
  const { data, error } = await supabase
    .from("competition_stats")
    .select("competition_id, save_count");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.competition_id as string] = row.save_count as number;
  }
  return counts;
}

/**
 * True when Supabase environment variables are set.
 *
 * When false, the app runs in self-host / preview mode: no sign-in, no saved
 * places, no personal calendar events - just the public map and calendar.
 * This lets contributors run StudyMap locally to preview their map entries
 * without provisioning a Supabase project. See SELF-HOSTING.md and issue #72.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

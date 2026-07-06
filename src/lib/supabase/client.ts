import { createBrowserClient } from "@supabase/ssr";

import { isSupabaseConfigured } from "./config";

/**
 * Browser Supabase client, or `null` when Supabase isn't configured.
 * Callers must handle the null case: in self-host / preview mode the app
 * runs without auth or any private features.
 */
export function createClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

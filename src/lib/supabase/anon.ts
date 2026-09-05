import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "./config";

/**
 * A plain anon-key Supabase client with no cookies and no session - for
 * server-side lookups that authenticate themselves some other way (a
 * bearer token in the request, e.g. the saved-competitions calendar feed
 * in #210) rather than via a signed-in user's own session.
 *
 * Never use this for anything gated by RLS on `auth.uid()`: without a
 * session, `auth.uid()` is null and every owner-only policy in this app
 * denies everything. It only works for calls a database function
 * explicitly authorizes itself, like a `security definer` RPC that checks
 * its own token argument.
 */
export function createAnonClient() {
  if (!isSupabaseConfigured()) return null;
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

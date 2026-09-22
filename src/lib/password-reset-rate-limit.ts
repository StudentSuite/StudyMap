import { createHash } from "crypto";

import { createAnonClient } from "@/lib/supabase/anon";

/**
 * Hashes an email address for the sole purpose of counting password-reset
 * attempts against it - never stored or compared as plaintext. Normalizes
 * case/whitespace first so "User@Example.com " and "user@example.com"
 * share one bucket.
 */
function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

/**
 * Enforces "at most N password-reset requests per email per window" (4 per
 * 14 days by default, both defined on the Postgres function itself - see
 * the matching migration - so the policy lives in one place) via the
 * check_and_record_password_reset_attempt() security-definer function,
 * never by querying `password_reset_attempts` directly: there is no
 * signed-in session on this request for owner-only RLS to key off, and the
 * table has no policies anyway (see the migration's comment).
 *
 * Fails OPEN (returns true / "allowed") when Supabase isn't configured or
 * the RPC itself errors (e.g. an unmigrated deployment before this
 * function exists) - a broken rate limit must never block a legitimate
 * password reset, only a working one should throttle abuse.
 */
export async function allowPasswordResetAttempt(email: string): Promise<boolean> {
  const supabase = createAnonClient();
  if (!supabase) return true;

  const { data, error } = await supabase.rpc("check_and_record_password_reset_attempt", {
    p_email_hash: hashEmail(email),
  });
  if (error) return true;
  return data === true;
}

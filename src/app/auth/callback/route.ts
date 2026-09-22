import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { safeNext } from "@/lib/safe-next";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Always redirect to the canonical domain after OAuth so that arriving via
// any auto-assigned Vercel URL (e.g. studymapp-student-suite.vercel.app)
// doesn't leave the user stranded on the wrong domain.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studyymap.com";

/**
 * Where to send a just-signed-in user: `next` as-is, unless this is their
 * first sign-in ever (no `user_profiles` row), in which case the first-run
 * questionnaire (#204) should see them before `next` does. Fails open to
 * `next` on any error - a missing table (the #203 migration not yet applied
 * to this deployment) or a lookup failure must never block sign-in.
 */
async function destinationAfterSignIn(
  supabase: SupabaseClient,
  next: string,
): Promise<string> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return next;

    const { data, error } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (data) return next;

    return `/onboarding?next=${encodeURIComponent(next)}`;
  } catch {
    // Missing table (migration not applied yet) or any other lookup
    // failure: fail open rather than block sign-in.
    return next;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  // Explicit, first-party recovery marker set by the "forgot password" form
  // (see login-form.tsx) on its `redirectTo`, checked alongside Supabase's
  // own `redirectType` below. Two independent signals rather than relying
  // solely on the SDK's return value, which the library itself notes isn't
  // even part of the client's declared return type.
  const flow = searchParams.get("flow");

  // No Supabase configured (self-host / preview mode): nothing to exchange.
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${SITE_URL}/`);
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    // exchangeCodeForSession's return type doesn't declare `redirectType`,
    // but the client library does set it at runtime - "recovery" for a
    // password reset link, absent/null otherwise. Combined with the
    // first-party `flow` marker above so recovery is never misdetected as
    // a normal sign-in on account of an SDK quirk.
    const redirectType = (data as { redirectType?: string | null } | null)?.redirectType;
    const isRecovery = flow === "recovery" || redirectType === "recovery";

    if (!error) {
      if (isRecovery) {
        // A recovery session shouldn't run the first-run-onboarding check
        // below (it's not a normal sign-in); instead flag it for the login
        // form to pick up, since the code exchange happens here
        // server-side and the login form itself never sees Supabase's own
        // PASSWORD_RECOVERY event.
        const separator = next.includes("?") ? "&" : "?";
        return NextResponse.redirect(`${SITE_URL}${next}${separator}type=recovery`);
      }
      return NextResponse.redirect(
        `${SITE_URL}${await destinationAfterSignIn(supabase, next)}`,
      );
    }

    // Exchange failed: for a recovery link, this is almost always an
    // expired or already-used link, or one opened in a different browser
    // than the one that requested the reset (the PKCE code verifier lives
    // in that browser's cookies). Route to a recovery-specific message with
    // an immediate way to request a new link - the generic "sign-in
    // failed" message makes no sense to someone who was never signing in.
    if (isRecovery) {
      return NextResponse.redirect(`${SITE_URL}/login?error=recovery_link_invalid`);
    }
  }

  return NextResponse.redirect(`${SITE_URL}/login?error=auth_error`);
}

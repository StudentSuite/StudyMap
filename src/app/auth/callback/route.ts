import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { safeNext } from "@/lib/safe-next";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Always redirect to the canonical domain after OAuth so that arriving via
// any auto-assigned Vercel URL (e.g. studymapp-student-suite.vercel.app)
// doesn't leave the user stranded on the wrong domain.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://studyymap.com";

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

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${SITE_URL}${await destinationAfterSignIn(supabase, next)}`);
    }
  }

  return NextResponse.redirect(`${SITE_URL}/login?error=auth_error`);
}

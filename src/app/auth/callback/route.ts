import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/config";

// Always redirect to the canonical domain after OAuth so that arriving via
// any auto-assigned Vercel URL (e.g. studymapp-student-suite.vercel.app)
// doesn't leave the user stranded on the wrong domain.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://studymapp.vercel.app";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

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
      return NextResponse.redirect(`${SITE_URL}${next}`);
    }
  }

  return NextResponse.redirect(`${SITE_URL}/login?error=auth_error`);
}

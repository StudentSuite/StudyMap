import { NextResponse } from "next/server";

import { allowPasswordResetAttempt } from "@/lib/password-reset-rate-limit";

// The rate-limit check must hit the live counter every time, never a cached
// or statically optimized response.
export const dynamic = "force-dynamic";

/**
 * Gate checked before the client calls Supabase's own
 * `resetPasswordForEmail` (see login-form.tsx): records one attempt for
 * this email and reports whether it's allowed. This route never sends the
 * reset email itself - that still happens client-side, since Supabase's
 * PKCE recovery flow needs the code verifier it stores in the browser that
 * makes the `resetPasswordForEmail` call, not this server.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const rawEmail =
    typeof body === "object" && body !== null
      ? (body as { email?: unknown }).email
      : undefined;
  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  if (!email) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const allowed = await allowPasswordResetAttempt(email);
  return NextResponse.json({ ok: allowed });
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const CANONICAL = "https://studymapp.vercel.app";
// Vercel auto-assigns this URL based on the team name — it can't be deleted,
// so we intercept every request on it and redirect to the canonical domain.
const WRONG_DOMAIN = "studymapp-student-suite.vercel.app";

export async function proxy(request: NextRequest) {
  // Domain enforcement — must happen before anything else so that OAuth
  // callbacks landing on the wrong Vercel domain get bounced to the right one
  // before the auth code exchange runs.
  const host =
    request.headers.get("x-forwarded-host") ?? request.nextUrl.hostname;

  if (host === WRONG_DOMAIN) {
    const canonical = `${CANONICAL}${request.nextUrl.pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(canonical, { status: 301 });
  }

  let proxyResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          proxyResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            proxyResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session so it doesn't expire mid-visit.
  await supabase.auth.getUser();

  return proxyResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

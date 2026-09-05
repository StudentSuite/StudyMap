import { NextResponse } from "next/server";

import { savedCompetitionIdsForCalendarToken } from "@/lib/calendar-feed";
import { getCompetitions } from "@/lib/competitions";
import { competitionsIcs } from "@/lib/ics";

// Per-user content authenticated by a bearer token in the query string -
// never statically optimized or cached at the edge/CDN. See the
// Cache-Control below for why the response itself is also "no-store".
export const dynamic = "force-dynamic";

function notFound(): NextResponse {
  // A calendar app fetching an invalid, revoked, or never-issued token gets
  // exactly this, with no body distinguishing which case it was - see
  // savedCompetitionIdsForCalendarToken's own doc comment.
  return new NextResponse("Not found", { status: 404 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return notFound();

  const savedIds = await savedCompetitionIdsForCalendarToken(token);
  if (savedIds === null) return notFound();

  const competitions = getCompetitions().filter((c) => savedIds.includes(c.id));
  const ics = competitionsIcs(competitions, new Date());

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="studymap-saved-competitions.ics"',
      // Never shared-cached: the response is scoped to one token, and a
      // CDN caching it under the request URL would serve one user's saved
      // competitions to anyone who guessed or intercepted that same URL
      // (or, on a cache keyed loosely, to a different token entirely).
      "Cache-Control": "private, no-store",
    },
  });
}
